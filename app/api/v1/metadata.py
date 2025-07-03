from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.services.db import fetch_metadata

router = APIRouter(prefix="/api/v1/db")


class FetchMetadataRequest(BaseModel):
    db_url: str
    table_schema: str
    tables: list[str]


@router.get("/get-metadata", tags=["Metadata"])
async def get_metadata(request: FetchMetadataRequest):
    metadata = await fetch_metadata(
        request.db_url, request.table_schema, request.tables
    )
    if metadata:
        return JSONResponse(
            status_code=200,
            content={
                "status_code": 200,
                "message": "Metadata retrieved successfully",
                "metadata": metadata,
            },
        )
    raise HTTPException(
        status_code=404, detail={"status_code": 404, "message": "No metadata found"}
    )
