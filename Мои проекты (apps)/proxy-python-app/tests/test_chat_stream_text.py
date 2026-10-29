import unittest
from types import SimpleNamespace

from services.openai_chat import (
    _response_output_text_delta,
    _response_output_text_done,
    _suffix_after_accumulated,
    extract_output_text_from_response,
)


class TestExtractOutputText(unittest.TestCase):
    def test_output_text_property(self):
        resp = SimpleNamespace(output_text="Hello", output=[])
        self.assertEqual(extract_output_text_from_response(resp), "Hello")

    def test_output_message_parts(self):
        resp = SimpleNamespace(
            output_text=None,
            output=[
                SimpleNamespace(
                    type="message",
                    content=[
                        SimpleNamespace(type="output_text", text="Part1"),
                        SimpleNamespace(type="output_text", text="Part2"),
                    ],
                )
            ],
        )
        self.assertEqual(extract_output_text_from_response(resp), "Part1Part2")


class TestStreamEventParsing(unittest.TestCase):
    def test_delta_event(self):
        ev = SimpleNamespace(type="response.output_text.delta", delta="abc")
        self.assertEqual(_response_output_text_delta(ev), "abc")

    def test_done_event(self):
        ev = SimpleNamespace(type="response.output_text.done", text="full answer")
        self.assertEqual(_response_output_text_done(ev), "full answer")


class TestSuffixAfterAccumulated(unittest.TestCase):
    def test_append_only_new_part(self):
        self.assertEqual(_suffix_after_accumulated("hel", "hello"), "lo")

    def test_full_when_empty(self):
        self.assertEqual(_suffix_after_accumulated("", "hello"), "hello")

    def test_no_duplicate_when_same(self):
        self.assertEqual(_suffix_after_accumulated("hello", "hello"), "")


if __name__ == "__main__":
    unittest.main()
