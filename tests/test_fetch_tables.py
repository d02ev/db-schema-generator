from unittest.mock import AsyncMock, patch

import pytest


from app.services.db import fetch_tables



@pytest.mark.asyncio
async def test_fetch_tables_success():
    mock_db_url = "postgresql://user:password@localhost/dbname"
    mock_schema = "public"
    mock_tables = ["table1", "table2"]

    with patch("app.services.db.asyncpg.connect", new_callable=AsyncMock) as mock_connect:
        mock_conn = AsyncMock()
        mock_connect.return_value = mock_conn
        mock_conn.fetch.return_value = [{"table_name": "table1"}, {"table_name": "table2"}]

        tables = await fetch_tables(mock_db_url, mock_schema)
        assert tables == mock_tables
        mock_connect.assert_called_once_with(mock_db_url)
        mock_conn.fetch.assert_called_once()



@pytest.mark.asyncio
async def test_fetch_tables_failure():
    mock_db_url = "postgresql://user:password@localhost/dbname"
    mock_schema = "public"

    with patch("app.services.db.asyncpg.connect", new_callable=AsyncMock) as mock_connect:
        mock_connect.side_effect = Exception("Failed to connect")

        tables = await fetch_tables(mock_db_url, mock_schema)
        assert tables == []
        mock_connect.assert_called_once_with(mock_db_url)
