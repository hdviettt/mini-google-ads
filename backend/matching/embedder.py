"""Sentence-transformer embedder. Local, CPU, lazy-loaded singleton.
Default model: sentence-transformers/all-MiniLM-L6-v2, 384-dim."""
from __future__ import annotations
import threading
from typing import Optional

from config import EMBEDDING_MODEL, EMBEDDING_DIM


_model = None
_model_lock = threading.Lock()


def _load() -> "SentenceTransformer":  # noqa: F821
    global _model
    if _model is not None:
        return _model
    with _model_lock:
        if _model is None:
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer(EMBEDDING_MODEL)
    return _model


def embed_text(text: str) -> list[float]:
    """Return a single 384-dim embedding for `text`."""
    model = _load()
    vec = model.encode(text, normalize_embeddings=True)
    return [float(x) for x in vec.tolist()]


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    model = _load()
    vecs = model.encode(texts, normalize_embeddings=True, batch_size=32, show_progress_bar=False)
    return [[float(x) for x in v.tolist()] for v in vecs]


def warmup() -> None:
    """Trigger lazy load. Optional: callers that want to pay the
    model-load cost up front (e.g. server startup) can call this."""
    _load()
