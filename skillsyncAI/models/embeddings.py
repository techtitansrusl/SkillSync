from sentence_transformers import SentenceTransformer
import numpy as np

class EmbeddingModel:
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        print("Loading Sentence-BERT model... this may take a bit the first time.")
        self.model = SentenceTransformer(model_name)
        print("Model loaded.")

    def encode(self, texts: list[str]) -> np.ndarray:
        """
        Encode a list of texts into normalized embedding vectors.
        """
        embeddings = self.model.encode(
            texts,
            convert_to_numpy=True,
            normalize_embeddings=True,
        )
        return embeddings
