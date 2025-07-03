from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.status import (
    HTTP_422_UNPROCESSABLE_ENTITY,
    HTTP_500_INTERNAL_SERVER_ERROR,
)

from app.core.logger import logger


class GlobalExceptionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        try:
            response = await call_next(request)
            return response
        except RequestValidationError as e:
            logger.error(f"Validation error: {e}")
            return JSONResponse(
                status_code=HTTP_422_UNPROCESSABLE_ENTITY,
                content={
                    "status_code": HTTP_422_UNPROCESSABLE_ENTITY,
                    "message": "Validation errors",
                    "errors": e.errors(),
                },
            )
        except Exception as e:
            logger.error(f"Unhandled exception: {e}")
            return JSONResponse(
                status_code=HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "status_code": HTTP_500_INTERNAL_SERVER_ERROR,
                    "message": "Internal server error",
                    "error": str(e),
                },
            )
