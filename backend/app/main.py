"""
backend/app/main.py - ForgeMind AI Application Entrypoint
Exposes the FastAPI application with docs redirect and full simulation pipeline.
"""

from fastapi.responses import RedirectResponse
from backend.main import (
    app,
    simulator,
    anomaly_detector,
    ai_assistant,
    ws_manager,
    telemetry_buffer,
)

# Export all symbols for compatibility
__all__ = [
    "app",
    "simulator",
    "anomaly_detector",
    "ai_assistant",
    "ws_manager",
    "telemetry_buffer",
    "RedirectResponse",
]
