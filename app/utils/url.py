def parse_schema_from_url(db_url: str) -> str:
    return db_url.split("/")[-1]
