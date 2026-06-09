import pytest
from unittest.mock import AsyncMock, patch
from services.agent.app.db.memory import save_memory, recall_memories, generate_embedding

@pytest.mark.asyncio
async def test_generate_embedding():
    with patch("services.agent.app.db.memory.OpenAIEmbeddings.aembed_query", new_callable=AsyncMock) as mock_embed:
        mock_embed.return_value = [0.1, 0.2, 0.3]

        result = await generate_embedding("test text", "test-key")

        assert result == [0.1, 0.2, 0.3]
        mock_embed.assert_called_once_with("test text")

@pytest.mark.asyncio
async def test_generate_embedding_missing_key():
    with pytest.raises(ValueError, match="API key is required"):
        await generate_embedding("test text", "")

@pytest.mark.asyncio
async def test_save_memory():
    mock_conn = AsyncMock()
    mock_conn.fetchrow.return_value = {"id": "test-id-123"}

    result = await save_memory(
        mock_conn,
        "user-1",
        "User likes Python",
        [0.1, 0.2],
        ["preference"]
    )

    assert result == "test-id-123"
    mock_conn.fetchrow.assert_called_once()

    # Check the embedding string formatting
    args = mock_conn.fetchrow.call_args[0]
    assert args[3] == "[0.1,0.2]"
    assert "preference" in args[4]

@pytest.mark.asyncio
async def test_recall_memories():
    mock_conn = AsyncMock()
    mock_conn.fetch.return_value = [
        {
            "id": "mem-1",
            "content": "User likes Python",
            "tags": '["preference"]',
            "created_at": None,
            "similarity": 0.95
        }
    ]

    results = await recall_memories(
        mock_conn,
        "user-1",
        [0.1, 0.2],
        top_k=2
    )

    assert len(results) == 1
    assert results[0]["id"] == "mem-1"
    assert results[0]["content"] == "User likes Python"
    assert results[0]["tags"] == ["preference"]
    assert results[0]["similarity"] == 0.95

    mock_conn.fetch.assert_called_once()
    args = mock_conn.fetch.call_args[0]
    assert args[1] == "[0.1,0.2]"
    assert args[2] == "user-1"
    assert args[3] == 2
