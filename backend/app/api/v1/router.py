from fastapi import APIRouter


api_v1_router = APIRouter()


@api_v1_router.get("/health")
async def health() -> dict:
    return {"status": "ok"}

