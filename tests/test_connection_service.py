from unittest.mock import AsyncMock, patch

import pytest

from app.services.db import check_db_connection


@pytest.mark.asyncio
async def test_check_db_connection_success():
    db_url = "postgresql://user:password@localhost/dbname"
    mock_schemas = ["public", "custom_schema"]

    with patch(
        "app.services.db.asyncpg.connect", new_callable=AsyncMock
    ) as mock_connect, patch(
        "app.services.db.fetch_schemas", new_callable=AsyncMock
    ) as mock_fetch_schemas:
        mock_conn = AsyncMock()
        mock_connect.return_value = mock_conn
        mock_fetch_schemas.return_value = mock_schemas

        conn_result, schemas = await check_db_connection(db_url)

        assert conn_result is True
        assert schemas == mock_schemas
        mock_connect.assert_called_once()
        mock_conn.close.assert_called_once()


@pytest.mark.asyncio
async def test_check_db_connection_failure():
    db_url = "postgresql://invalid_user:password@localhost/dbname"

    with patch("asyncpg.connect", new_callable=AsyncMock) as mock_connect:
        mock_connect.side_effect = Exception("Connection failed")

        conn_result, schemas = await check_db_connection(db_url)

        assert conn_result is False
        assert schemas == []
        mock_connect.assert_called_once_with(db_url)
