import unittest

from services.openai_chat import route_attachment_ext


class TestRouteAttachmentExt(unittest.TestCase):
    def test_image_kind(self):
        self.assertEqual(route_attachment_ext(".pdf", "image"), "image")

    def test_table_kind(self):
        self.assertEqual(route_attachment_ext(".txt", "table"), "code_interpreter")

    def test_pdf_docx_input_file(self):
        self.assertEqual(route_attachment_ext(".pdf", "document"), "input_file")
        self.assertEqual(route_attachment_ext(".docx", "document"), "input_file")
        self.assertEqual(route_attachment_ext("pdf", "document"), "input_file")

    def test_spreadsheet_code_interpreter(self):
        for ext in (".xlsx", ".xls", ".csv", ".json", ".parquet"):
            self.assertEqual(route_attachment_ext(ext, "document"), "code_interpreter")

    def test_text_file_search(self):
        self.assertEqual(route_attachment_ext(".txt", "document"), "file_search")
        self.assertEqual(route_attachment_ext(".md", "document"), "file_search")

    def test_unknown_ext_file_search(self):
        self.assertEqual(route_attachment_ext(".rtf", "document"), "file_search")


if __name__ == "__main__":
    unittest.main()
