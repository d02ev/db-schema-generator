from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.status import HTTP_500_INTERNAL_SERVER_ERROR
from app.core.logger import logger

class GlobalExceptionMiddleware(BaseHTTPMiddleware):
  async def dispatch(self, request, call_next):
    try:
      response = await call_next(request)
      return response

    except RequestValidationError as e:
      logger.error(f"Validation error: {e}")
      return JSONResponse(
        status_code=422,
        content={"detail": e.errors()},
      )

    except Exception as e:
      logger.error(f"Unhandled exception: {e}")
      return JSONResponse(
        status_code=HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal Server Error"},
      )