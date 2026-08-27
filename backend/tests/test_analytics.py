import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.app.services.analytics import calculate_percentile


def test_percentile_calculation():
    scores = [0.20, 0.40, 0.60, 0.80, 1.00]

    assert calculate_percentile(scores, 0.20) == 0.2
    assert calculate_percentile(scores, 0.60) == 0.6
    assert calculate_percentile(scores, 1.00) == 1.0
    assert calculate_percentile([], 0.5) == 0.0


def test_misalignment_logic():
    ids_percentile = 0.80
    budget_percentile = 0.20
    misalignment = round(ids_percentile - budget_percentile, 3)

    is_critical_hotspot = misalignment > 0.50
    is_overfunded = misalignment < -0.50

    assert misalignment == 0.60
    assert is_critical_hotspot is True
    assert is_overfunded is False


if __name__ == "__main__":
    test_percentile_calculation()
    test_misalignment_logic()
    print("[PASS] Analytics unit tests passed!")
