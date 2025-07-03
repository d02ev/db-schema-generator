import pytest
from unittest.mock import AsyncMock, patch
from app.services.connection_service import check_db_connection

@pytest.mark.asyncio
async def test_check_db_connection_success():
    db_url = "postgresql://user:password@localhost/dbname"

    with patch("app.services.connection_service.asyncpg.connect", new_callable=AsyncMock) as mock_connect:
        mock_conn = AsyncMock()
        mock_conn.execute.return_value = None
        mock_connect.return_value = mock_conn

        result = await check_db_connection(db_url)

        assert result is True
        mock_connect.assert_called_once()
        mock_conn.close.assert_called_once()

@pytest.mark.asyncio
async def test_check_db_connection_failure():
    db_url = "postgresql://invalid_user:password@localhost/dbname"

    with patch("asyncpg.connect", new_callable=AsyncMock) as mock_connect:
        mock_connect.side_effect = Exception("Connection failed")

        result = await check_db_connection(db_url)

        assert result is False
        mock_connect.assert_called_once_with(db_url)