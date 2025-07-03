from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.services.db import fetch_tables

router = APIRouter(prefix="/api/v1/db")


class GetTablesRequest(BaseModel):
    db_url: str
    table_schema: str


@router.get("/get-tables", tags=["Tables"])
async def get_tables(request: GetTablesRequest):
    tables = await fetch_tables(request.db_url, request.table_schema)
    if tables:
        return JSONResponse(
            status_code=200,
            content={
                "status_code": 200,
                "message": "Tables retrieved successfully",
                "tables": tables,
            },
        )
    raise HTTPException(
        status_code=404, detail={"status_code": 404, "message": "No tables found"}
    )
