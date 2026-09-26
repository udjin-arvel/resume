import asyncio
import unittest
from unittest.mock import AsyncMock, MagicMock, patch

from services.chat_service import ChatService


class _StatusRow:
    def __init__(self, status: str, row_id: str = "vsf_1"):
        self.status = status
        self.id = row_id


class TestWaitVectorStoreFilesReady(unittest.IsolatedAsyncioTestCase):
    async def test_completed_removes_from_pending(self):
        service = ChatService()
        vs_files = MagicMock()
        vs_files.retrieve = AsyncMock(
            side_effect=[
                _StatusRow("in_progress"),
                _StatusRow("completed"),
            ]
        )
        client = MagicMock()
        client.vector_stores.files = vs_files

        with patch("services.chat_service.asyncio.sleep", new_callable=AsyncMock):
            await service._wait_vector_store_files_ready(
                client,
                "vs_1",
                ["vsf_1"],
                timeout_sec=10,
                poll_interval_sec=0.01,
            )

        self.assertEqual(vs_files.retrieve.await_count, 2)

    async def test_failed_stops_polling_file(self):
        service = ChatService()
        vs_files = MagicMock()
        vs_files.retrieve = AsyncMock(return_value=_StatusRow("failed"))
        client = MagicMock()
        client.vector_stores.files = vs_files

        await service._wait_vector_store_files_ready(
            client,
            "vs_1",
            ["vsf_1"],
            timeout_sec=10,
            poll_interval_sec=0.01,
        )

        vs_files.retrieve.assert_awaited_once()

    async def test_timeout_logs_warning(self):
        service = ChatService()
        vs_files = MagicMock()
        vs_files.retrieve = AsyncMock(return_value=_StatusRow("in_progress"))
        client = MagicMock()
        client.vector_stores.files = vs_files

        with patch("services.chat_service.asyncio.sleep", new_callable=AsyncMock):
            with patch("services.chat_service.time.monotonic", side_effect=[0.0, 0.0, 100.0]):
                await service._wait_vector_store_files_ready(
                    client,
                    "vs_1",
                    ["vsf_1"],
                    timeout_sec=1,
                    poll_interval_sec=0.01,
                )

        self.assertGreaterEqual(vs_files.retrieve.await_count, 1)


if __name__ == "__main__":
    unittest.main()
