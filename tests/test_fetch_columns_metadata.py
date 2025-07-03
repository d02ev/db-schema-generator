
import pytest
from unittest.mock import AsyncMock, patch

from app.services.db import fetch_columns_metadata

@pytest.mark.asyncio
async def test_fetch_columns_metadata_success():
    mock_conn = AsyncMock()
    schema = "public"
    tables = ["users", "posts"]
    mock_rows = [
        {"table_name": "users", "column_name": "id", "data_type": "integer"},
        {"table_name": "users", "column_name": "name", "data_type": "text"},
        {"table_name": "posts", "column_name": "id", "data_type": "integer"},
    ]

    with patch.object(mock_conn, "fetch", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = mock_rows
        result = await fetch_columns_metadata(mock_conn, schema, tables)
        assert isinstance(result, list)
        assert result[0]["table_name"] == "users"
        assert result[0]["column_name"] == "id"
        assert result[0]["data_type"] == "integer"
        mock_fetch.assert_called_once_with(
            """
        SELECT table_name, column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = $1
        AND table_name = ANY($2::text[])
        """, schema, tables
        )

@pytest.mark.asyncio
async def test_fetch_columns_metadata_exception():
    mock_conn = AsyncMock()
    schema = "public"
    tables = ["users"]

    with patch.object(mock_conn, "fetch", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.side_effect = Exception("DB error")
        result = await fetch_columns_metadata(mock_conn, schema, tables)
        assert result == []
