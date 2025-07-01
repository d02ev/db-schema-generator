from fastapi import APIRouter

router = APIRouter()

@router.get("/health", tags=["Health Check"])
async def health_check():
    """
    Health check endpoint to verify the API is running.
    """
    return {"status": "ok", "message": "API is running"}

@router.get("/fail")
async def fail():
    """
    Endpoint to simulate a failure for testing purposes.
    """
    raise Exception("This is a simulated failure for testing purposes.")