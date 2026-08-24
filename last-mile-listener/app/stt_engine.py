"""
Multilingual Speech-to-Text + Translation engine.

Real deployment:
    pip install faster-whisper   # CTranslate2-based, fast on CPU/GPU
    # or: pip install openai-whisper  for the reference implementation
    # or swap in Canary-Qwen 2.5B via NVIDIA NeMo for max accuracy on
    #   supported languages.

This module defines a small interface (`STTEngine`) so you can swap
models without touching the orchestrator. `WhisperSTTEngine` is the
production implementation; `MockSTTEngine` is used in tests/CI and in
this sandbox where model weights can't be downloaded.

Pipeline per voice note:
    audio bytes -> [1] language-agnostic transcription (native script)
                -> [2] translation to English (backend language)
"""

from __future__ import annotations

import abc
from dataclasses import dataclass


@dataclass
class TranscriptionResult:
    native_text: str
    translated_text: str
    detected_language: str   # ISO 639-1 code, e.g. "hi", "ta", "sw", "pt"
    confidence: float
    model_name: str


class STTEngine(abc.ABC):
    @abc.abstractmethod
    def transcribe_and_translate(self, audio_path: str) -> TranscriptionResult:
        ...


class WhisperSTTEngine(STTEngine):
    """
    Production engine using faster-whisper (CTranslate2 build of
    Whisper). Large-v3 covers 99+ languages, which is the point for
    BRICS-scale multilingual intake.

        pip install faster-whisper

    Model sizes, smallest to largest: tiny, base, small, medium,
    large-v3. Use large-v3 for accuracy; use small/medium on constrained
    hardware or when latency matters more than accuracy.
    """

    def __init__(self, model_size: str = "large-v3", device: str = "cpu", compute_type: str = "int8"):
        try:
            from faster_whisper import WhisperModel
        except ImportError as e:
            raise ImportError(
                "faster-whisper is not installed. Run: pip install faster-whisper"
            ) from e

        self.model_name = f"whisper-{model_size}"
        self._model = WhisperModel(model_size, device=device, compute_type=compute_type)

    def transcribe_and_translate(self, audio_path: str) -> TranscriptionResult:
        # Pass 1: transcribe in the native language (task="transcribe")
        native_segments, info = self._model.transcribe(audio_path, task="transcribe")
        native_text = " ".join(seg.text.strip() for seg in native_segments)

        # Pass 2: translate directly to English (Whisper supports task="translate")
        translated_segments, _ = self._model.transcribe(audio_path, task="translate")
        translated_text = " ".join(seg.text.strip() for seg in translated_segments)

        return TranscriptionResult(
            native_text=native_text,
            translated_text=translated_text,
            detected_language=info.language,
            confidence=float(info.language_probability),
            model_name=self.model_name,
        )


class MockSTTEngine(STTEngine):
    """
    Deterministic stand-in used for local testing and in this sandbox
    (no GPU / no model download here). Swap for WhisperSTTEngine in
    production — nothing else in the pipeline needs to change since
    both implement the same STTEngine interface.
    """

    # audio_path -> canned (native_text, translated_text, lang) for demos/tests
    _FIXTURES = {
        "sample_data/voice_note_hi_water.wav": (
            "पिछले तीन दिनों से हमारी गली, सदर बाज़ार, नागपुर में पानी नहीं आ रहा है। "
            "बहुत परेशानी हो रही है, कृपया जल्दी ठीक करें।",
            "There has been no water supply in our street, Sadar Bazaar, Nagpur, "
            "for the last three days. We are facing a lot of trouble, please fix it urgently.",
            "hi",
        ),
        "sample_data/voice_note_ta_road.wav": (
            "எங்கள் தெருவில் பெரிய குழி இருக்கிறது, விபத்து ஆகலாம்.",
            "There is a big pothole in our street, an accident could happen.",
            "ta",
        ),
    }

    def transcribe_and_translate(self, audio_path: str) -> TranscriptionResult:
        native, translated, lang = self._FIXTURES.get(
            audio_path,
            (
                "[no fixture for this path]",
                "[no fixture for this path]",
                "und",
            ),
        )
        return TranscriptionResult(
            native_text=native,
            translated_text=translated,
            detected_language=lang,
            confidence=0.95,
            model_name="mock-whisper",
        )


def get_default_engine() -> STTEngine:
    """
    Factory used by the orchestrator. Tries the real engine first;
    falls back to the mock so the rest of the pipeline stays runnable
    in environments without the model downloaded (e.g. this sandbox).
    """
    try:
        return WhisperSTTEngine()
    except Exception:
        return MockSTTEngine()
