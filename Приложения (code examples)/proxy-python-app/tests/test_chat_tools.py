import unittest

from services.openai_chat import (
    PreparedAttachments,
    build_chat_tools,
    build_user_input,
)


class TestBuildChatTools(unittest.TestCase):
    def test_web_search_only(self):
        tools = build_chat_tools(
            enable_web_search=True,
            prepared=PreparedAttachments(),
        )
        self.assertEqual(tools, [{"type": "web_search"}])

    def test_no_tools_without_search_or_attachments(self):
        tools = build_chat_tools(
            enable_web_search=False,
            prepared=PreparedAttachments(),
        )
        self.assertEqual(tools, [])

    def test_image_plus_web_search(self):
        tools = build_chat_tools(
            enable_web_search=True,
            prepared=PreparedAttachments(image_file_ids=["file-img"]),
        )
        self.assertEqual(tools, [{"type": "web_search"}])

    def test_table_plus_web_search(self):
        prepared = PreparedAttachments(code_interpreter_file_ids=["file-xlsx"])
        tools = build_chat_tools(enable_web_search=True, prepared=prepared)
        types = {t["type"] for t in tools}
        self.assertEqual(types, {"web_search", "code_interpreter"})
        ci = next(t for t in tools if t["type"] == "code_interpreter")
        self.assertEqual(ci["container"]["file_ids"], ["file-xlsx"])

    def test_text_document_file_search(self):
        prepared = PreparedAttachments(file_search_file_ids=["file-txt"])
        tools = build_chat_tools(
            enable_web_search=False,
            prepared=prepared,
            vector_store_id="vs_123",
        )
        self.assertEqual(len(tools), 1)
        self.assertEqual(tools[0]["type"], "file_search")
        self.assertEqual(tools[0]["vector_store_ids"], ["vs_123"])

    def test_pdf_document_no_code_interpreter_tool(self):
        prepared = PreparedAttachments(input_file_ids=["file-pdf"])
        tools = build_chat_tools(
            enable_web_search=True,
            prepared=prepared,
        )
        types = {t["type"] for t in tools}
        self.assertEqual(types, {"web_search"})

    def test_combined_all_tools(self):
        prepared = PreparedAttachments(
            code_interpreter_file_ids=["f1"],
            file_search_file_ids=["f2"],
        )
        tools = build_chat_tools(
            enable_web_search=True,
            prepared=prepared,
            vector_store_id="vs_99",
        )
        types = {t["type"] for t in tools}
        self.assertEqual(types, {"web_search", "code_interpreter", "file_search"})

    def test_continue_code_interpreter_empty_prepared(self):
        tools = build_chat_tools(
            enable_web_search=False,
            prepared=PreparedAttachments(),
            continue_code_interpreter=True,
        )
        self.assertEqual(len(tools), 1)
        self.assertEqual(tools[0]["type"], "code_interpreter")
        self.assertEqual(tools[0]["container"], {"type": "auto"})
        self.assertNotIn("file_ids", tools[0]["container"])

    def test_continue_code_interpreter_false_empty_prepared(self):
        tools = build_chat_tools(
            enable_web_search=False,
            prepared=PreparedAttachments(),
            continue_code_interpreter=False,
        )
        self.assertEqual(tools, [])

    def test_continue_code_interpreter_skipped_when_files_attached(self):
        prepared = PreparedAttachments(code_interpreter_file_ids=["file-xlsx"])
        tools = build_chat_tools(
            enable_web_search=False,
            prepared=prepared,
            continue_code_interpreter=True,
        )
        ci_tools = [t for t in tools if t["type"] == "code_interpreter"]
        self.assertEqual(len(ci_tools), 1)
        self.assertEqual(ci_tools[0]["container"]["file_ids"], ["file-xlsx"])


class TestBuildUserInput(unittest.TestCase):
    def test_plain_text(self):
        self.assertEqual(build_user_input("Привет", PreparedAttachments()), "Привет")

    def test_multimodal_with_image(self):
        prepared = PreparedAttachments(image_file_ids=["file-img"])
        inp = build_user_input("Что на картинке?", prepared)
        self.assertIsInstance(inp, list)
        self.assertEqual(inp[0]["role"], "user")
        types = [p["type"] for p in inp[0]["content"]]
        self.assertIn("input_text", types)
        self.assertIn("input_image", types)

    def test_multimodal_with_pdf_input_file(self):
        prepared = PreparedAttachments(input_file_ids=["file-pdf"])
        inp = build_user_input("Давай разбор", prepared)
        self.assertIsInstance(inp, list)
        types = [p["type"] for p in inp[0]["content"]]
        self.assertIn("input_text", types)
        self.assertIn("input_file", types)
        file_part = next(p for p in inp[0]["content"] if p["type"] == "input_file")
        self.assertEqual(file_part["file_id"], "file-pdf")


if __name__ == "__main__":
    unittest.main()
