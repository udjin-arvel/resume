import os

from openai import OpenAI
import chromadb
import json
from dotenv import load_dotenv

from embeddings import CHROMA_PATH, COLLECTION_NAME, embed_query

load_dotenv()

# DeepSeek для ответов модели. Эмбеддинги у него не берём — они локальные, в embeddings.py.
client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com",
)
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
collection = chroma_client.get_collection(name=COLLECTION_NAME)


def search_criminal_code(query: str, n_results: int = 3) -> str:
    """Ищет в Уголовном кодексе РФ статьи, релевантные описанному случаю."""
    # Тот же энкодер, что при ingest. Иначе Chroma сравнивает векторы из разных миров.
    results = collection.query(
        query_embeddings=[embed_query(query)],
        n_results=n_results,
        include=["documents", "metadatas"],
    )

    docs = results["documents"][0]
    metas = results["metadatas"][0]

    if not docs:
        return "По запросу ничего не найдено в УК РФ."

    formatted = []
    for doc, meta in zip(docs, metas):
        formatted.append(f"[Фрагмент УК, чанк {meta['chunk_index']}]:\n{doc}")

    return "\n\n---\n\n".join(formatted)


# Схема инструмента для LLM
tools = [{
    "type": "function",
    "function": {
        "name": "search_criminal_code",
        "description": "Ищет статьи Уголовного кодекса РФ по описанию деяния. Вызывай, когда пользователь описывает ситуацию и нужно найти подходящую статью.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Поисковый запрос, сформулированный как описание деяния (например, 'меня ограбили поздно ночью')."
                }
            },
            "required": ["query"]
        }
    }
}]


def iter_agent_events(user_input: str):
    """Шаги поиска и финальный ответ — события для NDJSON-стрима клиента."""
    messages = [{
        "role": "system",
        "content": "Ты — юридический помощник по УК РФ. Если пользователь описывает случай, найди подходящую статью через инструмент. В ответе укажи номер статьи, кратко объясни квалификацию и возможное наказание. Не выдумывай статьи."
    }, {
        "role": "user",
        "content": user_input
    }]

    response = client.chat.completions.create(
        model="deepseek-flash",
        messages=messages,
        tools=tools,
        tool_choice="auto",
        extra_body={"thinking": {"type": "enabled"}},
    )

    msg = response.choices[0].message

    if msg.tool_calls:
        messages.append(msg)
        for tool_call in msg.tool_calls:
            args = json.loads(tool_call.function.arguments)
            query = args["query"]
            print(f"[Поиск по УК]: {query}")
            yield {"type": "step", "text": query}
            result = search_criminal_code(query)
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": result
            })

        final_response = client.chat.completions.create(
            model="deepseek-flash",
            messages=messages
        )
        yield {"type": "result", "text": final_response.choices[0].message.content or ""}
        return

    yield {"type": "result", "text": msg.content or ""}


def run_agent(user_input: str) -> str:
    """Запускает агента и возвращает финальный текст ответа."""
    result = ""
    for event in iter_agent_events(user_input):
        if event["type"] == "result":
            result = event["text"]
    return result


if __name__ == "__main__":
    print(run_agent("Меня ограбили поздно ночью"))