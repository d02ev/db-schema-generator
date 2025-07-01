from fastapi import FastAPI
from app.api.v1 import health
from app.core.exceptions import GlobalExceptionMiddleware

app = FastAPI(title="DB Schema Generator API", version="1.0.0")

app.add_middleware(GlobalExceptionMiddleware)

app.include_router(health.router)