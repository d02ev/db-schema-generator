from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.connection_service import check_db_connection

router = APIRouter(prefix="/api/v1")

class ConnectionTestRequest(BaseModel):
  db_url: str

@router.post("/test-connection", tags=["Connection"])
async def test_connection(request: ConnectionTestRequest):
  result = await check_db_connection(request.db_url)
  if result:
    return { "status_code": 200,  "message": "Connection successful" }
  raise HTTPException(status_code=400, detail="Invalid or unreachable database URL")