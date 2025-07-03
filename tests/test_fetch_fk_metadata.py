import pytest
from unittest.mock import AsyncMock, patch

from app.services.db import fetch_fk_metadata

@pytest.mark.asyncio
async def test_fetch_fk_metadata_success():
    mock_conn = AsyncMock()
    schema = "public"
    tables = ["posts"]
    mock_rows = [
        {
            "source_table": "posts",
            "source_column": "user_id",
            "target_table": "users",
            "target_column": "id"
        }
    ]

    with patch.object(mock_conn, "fetch", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = mock_rows
        result = await fetch_fk_metadata(mock_conn, schema, tables)
        assert isinstance(result, list)
        assert result[0]["source_table"] == "posts"
        assert result[0]["source_column"] == "user_id"
        assert result[0]["target_table"] == "users"
        assert result[0]["target_column"] == "id"
        mock_fetch.assert_called_once_with(
            """
        SELECT tc.table_name AS source_table, kcu.column_name AS source_column,
               ccu.table_name AS target_table, ccu.column_name AS target_column
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = $1
        AND tc.table_name = ANY($2::text[])
        """, schema, tables
        )

@pytest.mark.asyncio
async def test_fetch_fk_metadata_exception():
    mock_conn = AsyncMock()
    schema = "public"
    tables = ["posts"]

    with patch.object(mock_conn, "fetch", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.side_effect = Exception("DB error")
        result = await fetch_fk_metadata(mock_conn, schema, tables)
        assert result == []
