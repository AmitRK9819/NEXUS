"""
Speech-to-Text (STT) Engine Abstraction
"""

from __future__ import annotations
import os
from dataclasses import dataclass
from typing import Optional


@dataclass
class STTResult:
    native_text: str
    detected_language: str
    confidence: float
    model_name: str
    translated_text: Optional[str] = None


class BaseSTTEngine:
    def transcribe_and_translate(self, audio_file_path: str) -> STTResult:
        raise NotImplementedError


class MockSTTEngine(BaseSTTEngine):
    """Fallback STT engine returning structured simulated transcriptions."""
    def transcribe_and_translate(self, audio_file_path: str) -> STTResult:
        filename = os.path.basename(audio_file_path).lower()
        if "water" in filename or "pani" in filename:
            return STTResult(
                native_text="Pani ki pipeline phat gayi hai ward 14 mein",
                detected_language="hi",
                confidence=0.91,
                model_name="mock-indic-stt",
                translated_text="Water pipeline has burst in Ward 14, severe leakage on main road",
            )
        elif "road" in filename or "pothole" in filename:
            return STTResult(
                native_text="Sector 4 road par bada gaddha hai",
                detected_language="hi",
                confidence=0.88,
                model_name="mock-indic-stt",
                translated_text="Big pothole on Sector 4 road causing traffic congestion",
            )
        return STTResult(
            native_text="Civic infrastructure issue reported via voice note",
            detected_language="en",
            confidence=0.85,
            model_name="mock-stt-v1",
            translated_text="Civic infrastructure issue reported via voice note",
        )


def get_default_engine() -> BaseSTTEngine:
    return MockSTTEngine()
