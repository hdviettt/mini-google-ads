"""Landing Page Experience: simulated load time + content score.
In real Google this is a complex evaluation. We simplify to two
inputs already on the ads table: lp_load_ms and lp_content_score."""
from __future__ import annotations


def compute_lp_experience(load_ms: int, content_score: float) -> float:
    """Return LP experience in [1, 10].

    load_ms breakdown:
      <= 1000 ms -> 10
      <= 1500    -> 8.5
      <= 2000    -> 7
      <= 2500    -> 5
      <= 3500    -> 3
      else        -> 1.5
    content_score is in [0, 1] and contributes equally.
    """
    if load_ms <= 1000:
        speed = 10.0
    elif load_ms <= 1500:
        speed = 8.5
    elif load_ms <= 2000:
        speed = 7.0
    elif load_ms <= 2500:
        speed = 5.0
    elif load_ms <= 3500:
        speed = 3.0
    else:
        speed = 1.5

    content = 1.0 + 9.0 * max(0.0, min(1.0, content_score))
    return (speed + content) / 2.0
