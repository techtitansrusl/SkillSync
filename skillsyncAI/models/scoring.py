import numpy as np

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """
    Cosine similarity between two L2-normalized vectors.
    """
    return float(np.dot(a, b))

def normalize_score(sim: float) -> float:
    """
    Map cosine similarity in [-1, 1] to a score in [0, 100].
    """
    return (sim + 1.0) * 50.0
