from pydantic import BaseModel


class ConnectorStatus(BaseModel):
    name: str
    status: str
    required: bool
    latency_ms: int
    detail: str


class ReadinessResponse(BaseModel):
    status: str
    as_of: str
    countries_loaded: int
    connectors: list[ConnectorStatus]
