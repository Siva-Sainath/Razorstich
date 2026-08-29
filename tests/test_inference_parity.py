from __future__ import annotations

from pathlib import Path

from packages.policy.verify_inference import verify_parity


def test_exported_weights_match_typescript_mirror():
    ckpt = Path("eval/checkpoints/dueling_best.pt")
    if not ckpt.exists():
        ckpt = Path("eval/checkpoints/init_dueling.pt")
    report = verify_parity(ckpt, n_vectors=200)
    assert report["pass"], report
