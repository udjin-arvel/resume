import unittest

from services.openai_chat import coerce_bool, is_previous_response_id, resolve_previous_response_id


class TestCoerceBool(unittest.TestCase):
    def test_false_values(self):
        for val in (False, 0, "0", "false", "False", "no", "off", None, ""):
            self.assertFalse(coerce_bool(val), msg=repr(val))

    def test_true_values(self):
        for val in (True, 1, "1", "true", "True", "yes", "on"):
            self.assertTrue(coerce_bool(val), msg=repr(val))


class TestPreviousResponseId(unittest.TestCase):
    def test_resp_prefix(self):
        self.assertTrue(is_previous_response_id("resp_abc"))
        self.assertEqual(resolve_previous_response_id("resp_abc"), "resp_abc")

    def test_legacy_thread_ignored(self):
        self.assertFalse(is_previous_response_id("thread_abc"))
        self.assertIsNone(resolve_previous_response_id("thread_abc"))

    def test_empty(self):
        self.assertIsNone(resolve_previous_response_id(None))
        self.assertIsNone(resolve_previous_response_id(""))


if __name__ == "__main__":
    unittest.main()
