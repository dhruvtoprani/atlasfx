from fastapi import APIRouter

from app.schemas.system import ReadinessResponse
from app.services.readiness import readiness_report

router = APIRouter(prefix="/api/system", tags=["system"])


@router.get("/readiness", response_model=ReadinessResponse)
async def get_readiness() -> ReadinessResponse:
    return await readiness_report()
