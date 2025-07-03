from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.services.db import check_db_connection

router = APIRouter(prefix="/api/v1/db")


class ConnectionTestRequest(BaseModel):
    db_url: str


@router.post("/test-connection", tags=["Connection"])
async def test_connection(request: ConnectionTestRequest):
    success_conn, schemas = await check_db_connection(request.db_url)
    if success_conn:
        return JSONResponse(
            status_code=200,
            content={
                "status_code": 200,
                "message": "connection successful",
                "schemas": schemas,
            },
        )
    raise HTTPException(
        status_code=400, detail={"status_code": 400, "message": "Connection failed"}
    )
