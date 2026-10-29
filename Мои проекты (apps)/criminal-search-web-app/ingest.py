import re

import chromadb
from langchain_text_splitters import RecursiveCharacterTextSplitter

from embeddings import (
    CHROMA_PATH,
    COLLECTION_NAME,
    embed_passages,
)

# Режем по началу статьи. (?m) внутрь шаблона LangChain пихать нельзя:
# он оборачивает сепаратор в скобки, и Python орёт "global flags not at the start".
ARTICLE_RE = re.compile(r"(?=^Статья\s+\d+(?:\.\d+)?\.)", re.MULTILINE)
ARTICLE_NUM_RE = re.compile(r"^Статья\s+(\d+(?:\.\d+)?)\.")

# Некоторые статьи УК длиннее лимита модели — тогда режем внутри статьи с перекрытием,
# чтобы кусок не обрывался на полуслове и соседние абзацы не теряли связь.
LONG_ARTICLE_SPLITTER = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
)


def split_uk_rf(text: str) -> list[tuple[str, str]]:
    """Делит кодекс по статьям. Длинные статьи режет дальше, номер статьи сохраняет."""
    parts = [part.strip() for part in ARTICLE_RE.split(text) if part.strip()]
    chunks: list[tuple[str, str]] = []

    for part in parts:
        match = ARTICLE_NUM_RE.match(part)
        # Всё до первой статьи — преамбула (название, даты принятия и т.п.)
        article = match.group(1) if match else "preamble"
        pieces = LONG_ARTICLE_SPLITTER.split_text(part) if len(part) > 1000 else [part]
        for piece in pieces:
            chunks.append((article, piece))

    return chunks


def main() -> None:
    with open("UKRF.md", "r", encoding="utf-8") as f:
        text = f.read()

    articles = split_uk_rf(text)
    documents = [chunk for _, chunk in articles]
    metadatas = [
        {"source": "УК РФ", "article": article, "chunk_index": i}
        for i, (article, _) in enumerate(articles)
    ]
    ids = [f"chunk_{i}" for i in range(len(documents))]

    print(f"Статей/чанков: {len(documents)}. Считаю эмбеддинги ({len(documents)} шт.)...")
    embeddings = embed_passages(documents)

    chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
    # Пересоздаём коллекцию: иначе при повторном запуске налезут старые id / другие векторы.
    try:
        chroma_client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass

    collection = chroma_client.create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},  # e5 нормализован, для него cosine — родной метрика
    )

    # Chroma не любит огромные add() разом, кидаем пачками.
    batch_size = 100
    for start in range(0, len(documents), batch_size):
        end = start + batch_size
        collection.add(
            ids=ids[start:end],
            documents=documents[start:end],
            metadatas=metadatas[start:end],
            embeddings=embeddings[start:end],
        )

    print(f"Загружено {len(documents)} чанков в {CHROMA_PATH}/{COLLECTION_NAME}.")


if __name__ == "__main__":
    main()
