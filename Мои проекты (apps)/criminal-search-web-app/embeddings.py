from sentence_transformers import SentenceTransformer

# e5-small: нормальный русский, не тяжёлая на CPU.
# Если качество поиска начнёт не хватать — можно сменить на e5-base.
MODEL_NAME = "intfloat/multilingual-e5-small"
CHROMA_PATH = "./chroma_db"
COLLECTION_NAME = "uk_rf"

# Модель грузим один раз: веса ~сотня мегабайт, каждый раз с диска незачем.
_model: SentenceTransformer | None = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def embed_passages(texts: list[str]) -> list[list[float]]:
    # У e5 разные префиксы для документов и запросов — без них поиск заметно хуже.
    vectors = get_model().encode(
        [f"passage: {text}" for text in texts],
        batch_size=32,
        normalize_embeddings=True,  # иначе cosine в Chroma врёт
        show_progress_bar=len(texts) > 16,
    )
    return vectors.tolist()


def embed_query(text: str) -> list[float]:
    vector = get_model().encode(
        f"query: {text}",
        normalize_embeddings=True,
    )
    return vector.tolist()
