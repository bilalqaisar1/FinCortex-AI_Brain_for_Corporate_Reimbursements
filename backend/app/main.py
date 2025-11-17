from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def create_app() -> FastAPI:
    app = FastAPI(title="FinCortex API", version="1.0.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Lazy import to avoid circulars in scaffolding
    try:
        from app.api.v1.router import api_v1_router

        app.include_router(api_v1_router, prefix="/api/v1")
    except Exception:
        # Router not ready yet during early scaffolding
        pass

    return app


app = create_app()

