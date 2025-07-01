from fastapi import APIRouter

router = APIRouter()

@router.get("/health", tags=["Health Check"])
async def health_check():
    """
    Health check endpoint to verify the API is running.
    """
    return {"status": "ok", "message": "API is running"}