import unittest

from services.openai_chat import PreparedAttachments, build_response_request_kwargs


class TestBuildResponseRequestKwargs(unittest.TestCase):
    def test_store_true_always(self):
        kwargs = build_response_request_kwargs(
            model="gpt-4.1",
            user_input="hi",
            tools=[],
            enable_web_search=False,
        )
        self.assertTrue(kwargs["store"])

    def test_web_search_tool_choice_first_turn(self):
        kwargs = build_response_request_kwargs(
            model="gpt-4.1",
            user_input="hi",
            tools=[{"type": "web_search"}],
            enable_web_search=True,
            previous_response_id=None,
        )
        self.assertEqual(kwargs["tool_choice"], {"type": "web_search"})

    def test_web_search_no_tool_choice_on_continuation(self):
        kwargs = build_response_request_kwargs(
            model="gpt-4.1",
            user_input="follow up",
            tools=[{"type": "web_search"}, {"type": "code_interpreter", "container": {"type": "auto"}}],
            enable_web_search=True,
            previous_response_id="resp_abc123",
        )
        self.assertNotIn("tool_choice", kwargs)
        self.assertEqual(kwargs["previous_response_id"], "resp_abc123")
        self.assertTrue(kwargs["store"])

    def test_previous_response_id_without_web_search(self):
        kwargs = build_response_request_kwargs(
            model="gpt-4.1",
            user_input="q",
            tools=[{"type": "code_interpreter", "container": {"type": "auto"}}],
            enable_web_search=False,
            previous_response_id="resp_xyz",
        )
        self.assertNotIn("tool_choice", kwargs)
        self.assertEqual(kwargs["previous_response_id"], "resp_xyz")

    def test_pdf_input_file_no_forced_tool_choice(self):
        prepared = PreparedAttachments(input_file_ids=["file-pdf"])
        kwargs = build_response_request_kwargs(
            model="gpt-4.1",
            user_input=[{"role": "user", "content": []}],
            tools=[{"type": "web_search"}],
            enable_web_search=True,
            previous_response_id=None,
            prepared=prepared,
            attachment_names=["report.pdf"],
        )
        self.assertNotIn("tool_choice", kwargs)
        self.assertIn("report.pdf", kwargs["instructions"])
        self.assertIn("do not use code_interpreter", kwargs["instructions"])

    def test_code_interpreter_tool_choice_with_spreadsheet(self):
        prepared = PreparedAttachments(code_interpreter_file_ids=["file-xlsx"])
        kwargs = build_response_request_kwargs(
            model="gpt-4.1",
            user_input="analyze",
            tools=[
                {"type": "web_search"},
                {"type": "code_interpreter", "container": {"type": "auto", "file_ids": ["file-xlsx"]}},
            ],
            enable_web_search=True,
            previous_response_id=None,
            prepared=prepared,
        )
        self.assertEqual(kwargs["tool_choice"], {"type": "code_interpreter"})

    def test_file_search_tool_choice_with_txt(self):
        prepared = PreparedAttachments(file_search_file_ids=["file-txt"])
        kwargs = build_response_request_kwargs(
            model="gpt-4.1",
            user_input="analyze",
            tools=[
                {"type": "web_search"},
                {"type": "file_search", "vector_store_ids": ["vs_1"]},
            ],
            enable_web_search=True,
            previous_response_id=None,
            prepared=prepared,
        )
        self.assertEqual(kwargs["tool_choice"], {"type": "file_search"})

    def test_web_search_only_without_attachments(self):
        kwargs = build_response_request_kwargs(
            model="gpt-4.1",
            user_input="hi",
            tools=[{"type": "web_search"}],
            enable_web_search=True,
            previous_response_id=None,
            prepared=PreparedAttachments(),
        )
        self.assertEqual(kwargs["tool_choice"], {"type": "web_search"})


if __name__ == "__main__":
    unittest.main()
