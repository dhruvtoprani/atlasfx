from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import fx, macro, model, news, rankings, risk, system

app = FastAPI(
    title="AtlasFX API",
    description="Currency stress research API for the AtlasFX dashboard.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(fx.router)
app.include_router(risk.router)
app.include_router(rankings.router)
app.include_router(news.router)
app.include_router(macro.router)
app.include_router(model.router)
app.include_router(system.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "atlasfx-api"}
