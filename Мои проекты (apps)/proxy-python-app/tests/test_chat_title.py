import unittest
from unittest.mock import AsyncMock, MagicMock

from services.openai_chat import (
    DEFAULT_CHAT_TITLE,
    build_chat_title_input,
    generate_chat_title,
    normalize_chat_title,
)


class TestNormalizeChatTitle(unittest.TestCase):
    def test_strips_quotes_and_period(self):
        self.assertEqual(normalize_chat_title('"Погода в Москве"'), "Погода в Москве")

    def test_empty_fallback(self):
        self.assertEqual(normalize_chat_title(""), DEFAULT_CHAT_TITLE)
        self.assertEqual(normalize_chat_title("  "), DEFAULT_CHAT_TITLE)

    def test_truncates_long_title(self):
        long_title = "а" * 300
        self.assertEqual(len(normalize_chat_title(long_title)), 255)


class TestBuildChatTitleInput(unittest.TestCase):
    def test_message_only(self):
        self.assertEqual(build_chat_title_input("Привет", None), "Привет")

    def test_attachments_only(self):
        self.assertEqual(
            build_chat_title_input("", ["report.pdf"]),
            "Вложения: report.pdf",
        )


class TestGenerateChatTitle(unittest.IsolatedAsyncioTestCase):
    async def test_calls_responses_create(self):
        client = MagicMock()
        response = MagicMock()
        client.responses.create = AsyncMock(return_value=response)
        with unittest.mock.patch(
            "services.openai_chat.extract_output_text_from_response",
            return_value="Помощь с Python",
        ):
            title = await generate_chat_title(
                client,
                user_message="Как учить Python?",
                model="gpt-4o-mini",
            )
        self.assertEqual(title, "Помощь с Python")
        client.responses.create.assert_awaited_once()
        call_kwargs = client.responses.create.await_args.kwargs
        self.assertFalse(call_kwargs.get("store", True))


if __name__ == "__main__":
    unittest.main()
