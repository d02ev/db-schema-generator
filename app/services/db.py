import asyncpg

from app.core.logger import logger
from app.utils.url import parse_schema_from_url


async def check_db_connection(db_url: str) -> tuple[bool, list[str]]:
    conn = None
    try:
        conn = await asyncpg.connect(db_url)
        logger.info("Database connection successful.")
        schemas = await fetch_schemas(conn)
        return True, schemas
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False, []
    finally:
        if conn:
            await conn.close()
            logger.info("Database connection closed.")


async def fetch_tables(db_url: str, schema: str) -> list[str]:
    try:
        conn = await asyncpg.connect(db_url)
        query = f"""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = '{schema}';
        """
        tables = await conn.fetch(query)
        await conn.close()
        table_names = [table["table_name"] for table in tables]
        logger.info(f"Retrieved tables: {table_names}")
        return table_names
    except Exception as e:
        logger.error(f"Failed to retrieve tables: {e}")
        return []


async def fetch_schemas(conn: asyncpg.Connection) -> list[str]:
    try:
        query = """
        SELECT schema_name
        FROM information_schema.schemata
        WHERE schema_name NOT IN ('information_schema', 'pg_catalog')
            AND schema_name NOT LIKE 'pg_toast%'
            AND schema_name NOT LIKE 'pg_temp%'
        ORDER BY schema_name;
        """
        schemas = await conn.fetch(query)
        schema_names = [schema["schema_name"] for schema in schemas]
        logger.info(f"Retrieved schemas: {schema_names}")
        return schema_names
    except Exception as e:
        logger.error(f"Failed to retrieve schemas: {e}")
        return []
