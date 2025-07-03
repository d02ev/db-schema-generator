import pytest
from unittest.mock import AsyncMock, patch

from app.services.db import fetch_metadata

@pytest.mark.asyncio
async def test_fetch_metadata_success():
    db_url = "postgresql://user:password@localhost/db"
    schema = "public"
    tables = ["users", "posts"]

    # Mocked return values
    columns = [
        {"table_name": "users", "column_name": "id", "data_type": "integer"},
        {"table_name": "users", "column_name": "name", "data_type": "text"},
        {"table_name": "posts", "column_name": "id", "data_type": "integer"},
        {"table_name": "posts", "column_name": "user_id", "data_type": "integer"},
    ]
    pk = {"users": ["id"], "posts": ["id"]}
    uniq = {"users": [], "posts": []}
    fks = [
        {"source_table": "posts", "source_column": "user_id", "target_table": "users", "target_column": "id"}
    ]

    with patch("app.services.db.asyncpg.connect", new_callable=AsyncMock) as mock_connect, \
         patch("app.services.db.fetch_columns_metadata", new_callable=AsyncMock) as mock_columns, \
         patch("app.services.db.fetch_constraints_metadata", new_callable=AsyncMock) as mock_constraints, \
         patch("app.services.db.fetch_fk_metadata", new_callable=AsyncMock) as mock_fk, \
         patch("app.services.db.simplify_type", side_effect=lambda x: x):

        mock_conn = AsyncMock()
        mock_connect.return_value = mock_conn
        mock_columns.return_value = columns
        # fetch_constraints_metadata is called twice: once for 'PRIMARY KEY', once for 'UNIQUE'
        mock_constraints.side_effect = [pk, uniq]
        mock_fk.return_value = fks

        result = await fetch_metadata(db_url, schema, tables)

        assert isinstance(result, list)
        assert result[0]["table_name"] == "users"
        assert result[1]["table_name"] == "posts"
        assert result[0]["columns"][0]["column_name"] == "id"
        assert result[1]["foreign_keys"][0]["source_column"] == "user_id"

@pytest.mark.asyncio
async def test_fetch_metadata_exception():
    db_url = "postgresql://user:password@localhost/db"
    schema = "public"
    tables = ["users"]

    with patch("app.services.db.asyncpg.connect", new_callable=AsyncMock) as mock_connect:
        mock_connect.side_effect = Exception("Connection failed")
        result = await fetch_metadata(db_url, schema, tables)
        assert result == []