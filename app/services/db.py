import asyncpg

from app.core.logger import logger
from app.utils.util import simplify_type


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


async def fetch_columns_metadata(conn, schema: str, tables: list[str]) -> list[dict[str, str]]:
    try:
        query = """
        SELECT table_name, column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = $1
        AND table_name = ANY($2::text[])
        """
        rows = await conn.fetch(query, schema, tables)
        logger.info("Retrieved columns metadata")
        return [{"table_name": r["table_name"], "column_name": r["column_name"], "data_type": r["data_type"]} for r in rows]
    except Exception as e:
        logger.error(f"Failed to retrieve columns metadata: {e}")
        return []


async def fetch_constraints_metadata(conn, schema: str, tables: list[str], constraint_type: str) -> dict[str, list[str]]:
    try:
        query = """
        SELECT tc.table_name, kcu.column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = $1
        AND tc.table_schema = $2
        AND tc.table_name = ANY($3::text[])
        """
        rows = await conn.fetch(query, constraint_type, schema, tables)
        result = {}
        for row in rows:
            result.setdefault(row["table_name"], []).append(row["column_name"])
        logger.info(f"Retrieved {constraint_type} constraint metadata")
        return result
    except Exception as e:
        logger.error(f"Failed to retrieve {constraint_type} constraint metadata: {e}")
        return {}


async def fetch_fk_metadata(conn, schema: str, tables: list[str]) -> list[dict[str, str]]:
    try:
        query = """
        SELECT tc.table_name AS source_table, kcu.column_name AS source_column,
               ccu.table_name AS target_table, ccu.column_name AS target_column
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = $1
        AND tc.table_name = ANY($2::text[])
        """
        rows = await conn.fetch(query, schema, tables)
        logger.info("Retrieved foreign key metadata")
        return [{
            "source_table": r["source_table"],
            "source_column": r["source_column"],
            "target_table": r["target_table"],
            "target_column": r["target_column"]
        } for r in rows]
    except Exception as e:
        logger.error(f"Failed to retrieve foreign key metadata: {e}")
        return []


async def fetch_metadata(db_url: str, schema: str, tables: list[str]) -> list[dict[str, any]]:
    try:
        conn = await asyncpg.connect(db_url)
        columns = await fetch_columns_metadata(conn, schema, tables)
        pk = await fetch_constraints_metadata(conn, schema, tables, 'PRIMARY KEY')
        uniq = await fetch_constraints_metadata(conn, schema, tables, 'UNIQUE')
        fks = await fetch_fk_metadata(conn, schema, tables)
        fk_map = {}
        for fk in fks:
            fk_map.setdefault(fk["source_table"], []).append(fk)

        metadata = []
        for table in tables:
            foreign_keys = []
            for fk in fk_map.get(table, []):
                src = fk["source_column"]
                is_unique = src in pk.get(table, []) or src in uniq.get(table, [])
                rel_type = "OneToOne" if is_unique else "OneToMany"
                foreign_keys.append({
                    "source_column": src,
                    "target_table": fk["target_table"],
                    "target_column": fk["target_column"],
                    "relationship_type": rel_type
                })

            is_join_table = len(pk.get(table, [])) == 2 and len(fk_map.get(table, [])) == 2
            table_metadata = {
                "table_name": table,
                "columns": [
                    {"column_name": col["column_name"], "data_type": simplify_type(col["data_type"])}
                    for col in columns if col["table_name"] == table
                ],
                "primary_key": pk.get(table, []),
                "foreign_keys": foreign_keys
            }
            if is_join_table:
                table_metadata["relationship_type"] = "ManyToMany"

            metadata.append(table_metadata)

        await conn.close()
        logger.info("Retrieved metadata")
        return metadata
    except Exception as e:
        logger.error(f"Failed to retrieve metadata: {e}")
        return []