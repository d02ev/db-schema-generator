import pytest
from unittest.mock import AsyncMock, patch

from app.services.db import fetch_constraints_metadata

@pytest.mark.asyncio
async def test_fetch_constraints_metadata_success():
    mock_conn = AsyncMock()
    schema = "public"
    tables = ["users", "posts"]
    constraint_type = "PRIMARY KEY"
    mock_rows = [
        {"table_name": "users", "column_name": "id"},
        {"table_name": "posts", "column_name": "id"},
        {"table_name": "posts", "column_name": "user_id"},
    ]

    with patch.object(mock_conn, "fetch", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = mock_rows
        result = await fetch_constraints_metadata(mock_conn, schema, tables, constraint_type)
        assert isinstance(result, dict)
        assert result["users"] == ["id"]
        assert result["posts"] == ["id", "user_id"]
        mock_fetch.assert_called_once_with(
            """
        SELECT tc.table_name, kcu.column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = $1
        AND tc.table_schema = $2
        AND tc.table_name = ANY($3::text[])
        """, constraint_type, schema, tables
        )

@pytest.mark.asyncio
async def test_fetch_constraints_metadata_exception():
    mock_conn = AsyncMock()
    schema = "public"
    tables = ["users"]
    constraint_type = "PRIMARY KEY"

    with patch.object(mock_conn, "fetch", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.side_effect = Exception("DB error")
        result = await fetch_constraints_metadata(mock_conn, schema, tables, constraint_type)
        assert result == {}
