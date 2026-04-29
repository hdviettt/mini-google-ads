"""LightGBM pCVR model. Train on logged impressions where the label is
"did this impression eventually convert?". Predict at auction time.

Persistence: model lives at backend/bidding/_model.txt (LightGBM's
native text format) plus _features.json for the feature column order.

Lazy load: the first prediction reads the model from disk. Until trained,
the predictor returns a baseline pCVR derived from Quality Score so the
auction still works.

Phase 6 polish: optional dynamic reload when the model file changes."""
from __future__ import annotations
import json
import os
from pathlib import Path

import numpy as np
import lightgbm as lgb
import pandas as pd

from .features import FeatureRow, ALL_COLS, NUMERIC_COLS, CATEGORICAL_COLS


_MODEL_DIR = Path(__file__).parent
_MODEL_PATH = _MODEL_DIR / "_model.txt"
_META_PATH = _MODEL_DIR / "_features.json"

_model: lgb.Booster | None = None
_meta: dict | None = None


def _to_dataframe(rows: list[FeatureRow]) -> pd.DataFrame:
    df = pd.DataFrame([r.to_dict() for r in rows])
    for col in CATEGORICAL_COLS:
        df[col] = df[col].astype("category")
    return df


def train(rows: list[FeatureRow], labels: list[int], num_leaves: int = 31, lr: float = 0.05) -> dict:
    """Train a LightGBM binary classifier on impression rows.
    `labels[i]` is 1 if the impression converted, else 0."""
    if not rows:
        raise ValueError("no training rows")
    if len(rows) != len(labels):
        raise ValueError("rows and labels must be same length")

    df = _to_dataframe(rows)
    y = np.array(labels, dtype=np.float32)

    pos = int(y.sum())
    neg = len(y) - pos
    if pos == 0:
        raise ValueError("no positive examples in training data; run more simulation")

    train_set = lgb.Dataset(
        df[ALL_COLS],
        label=y,
        categorical_feature=CATEGORICAL_COLS,
        free_raw_data=False,
    )
    params = {
        "objective": "binary",
        "learning_rate": lr,
        "num_leaves": num_leaves,
        "min_data_in_leaf": 20,
        "feature_fraction": 0.9,
        "bagging_fraction": 0.9,
        "bagging_freq": 5,
        "verbose": -1,
        "scale_pos_weight": max(1.0, neg / max(pos, 1)),
    }
    booster = lgb.train(params, train_set, num_boost_round=200)
    booster.save_model(str(_MODEL_PATH))
    meta = {
        "feature_cols": ALL_COLS,
        "numeric_cols": NUMERIC_COLS,
        "categorical_cols": CATEGORICAL_COLS,
        "n_train": len(rows),
        "n_pos": pos,
        "n_neg": neg,
    }
    _META_PATH.write_text(json.dumps(meta, indent=2))

    # Force reload the next time predict is called
    global _model, _meta
    _model = booster
    _meta = meta
    return meta


def _load() -> tuple[lgb.Booster, dict] | tuple[None, None]:
    global _model, _meta
    if _model is not None and _meta is not None:
        return _model, _meta
    if not _MODEL_PATH.exists() or not _META_PATH.exists():
        return None, None
    _model = lgb.Booster(model_file=str(_MODEL_PATH))
    _meta = json.loads(_META_PATH.read_text())
    return _model, _meta


def predict_pcvr(row: FeatureRow) -> float:
    """Return P(conversion | impression). Uses the trained LightGBM
    model if present, otherwise a Quality-Score-derived fallback."""
    booster, meta = _load()
    if booster is None or meta is None:
        return _fallback_pcvr(row)
    df = _to_dataframe([row])
    pred = booster.predict(df[meta["feature_cols"]])
    p = float(np.clip(pred[0], 1e-4, 0.999))
    return p


def predict_batch(rows: list[FeatureRow]) -> list[float]:
    booster, meta = _load()
    if booster is None or meta is None:
        return [_fallback_pcvr(r) for r in rows]
    if not rows:
        return []
    df = _to_dataframe(rows)
    preds = booster.predict(df[meta["feature_cols"]])
    return [float(np.clip(p, 1e-4, 0.999)) for p in preds]


def _fallback_pcvr(row: FeatureRow) -> float:
    """Used before the model has been trained. Purely Quality-Score-based:
    higher QS -> higher pCVR. Slot position dampens (lower slot, lower CTR
    therefore lower pCVR conditional on impression)."""
    base = 0.04 * (row.quality_score / 6.0)
    slot_mult = max(0.3, 1.0 - 0.18 * row.slot_position)
    intent_mult = {"high": 2.0, "medium": 1.0, "low": 0.4}.get(row.intent_level, 1.0)
    return float(max(1e-4, min(0.6, base * slot_mult * intent_mult)))


def is_trained() -> bool:
    return _MODEL_PATH.exists() and _META_PATH.exists()


def feature_importance() -> list[tuple[str, float]]:
    booster, meta = _load()
    if booster is None:
        return []
    imp = booster.feature_importance(importance_type="gain")
    return list(zip(meta["feature_cols"], [float(x) for x in imp]))
