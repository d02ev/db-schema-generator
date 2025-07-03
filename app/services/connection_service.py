import asyncpg
from app.core.logger import logger

async def check_db_connection(db_url: str) -> bool:
    """
    Test the database connection by attempting to connect.

    Args:
        db_url (str): The database URL to connect to.

    Returns:
        bool: True if the connection is successful, False otherwise.
    """
    try:
        conn = await asyncpg.connect(db_url)
        await conn.close()
        logger.info("Database connection successful.")
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False