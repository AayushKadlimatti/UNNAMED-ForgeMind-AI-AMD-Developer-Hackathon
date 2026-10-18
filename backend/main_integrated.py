"""Run with: python -m uvicorn backend.main_integrated:app --port 8001"""
from .integrated_server import app

__all__ = ['app']
