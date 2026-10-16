"""
backend/main.py - FastAPI Server & Real-Time Simulation Pipeline for ForgeMind AI
Provides REST endpoints, WebSocket telemetry streaming, background simulation loop,
and seamless integration with database, anomaly detection, and AI diagnostics.
"""

from __future__ import annotations

import asyncio
import json
import logging
import uuid
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional, Set

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field

from backend.ai_diagnostics import AIDiagnosticAssistant
from backend.anomaly_detector import AnomalyDetectionEngine
from backend.database import (
    get_latest_diagnostic,
    get_recent_alerts,
    get_recent_telemetry,
    save_alert,
    save_diagnostic,
    save_telemetry_reading,
)
from backend.simulator import ConveyorMotorSimulator

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ForgeMind")

# Singleton Services
simulator = ConveyorMotorSimulator(machine_id="CONV-MTR-01")
anomaly_detector = AnomalyDetectionEngine()
ai_assistant = AIDiagnosticAssistant(cooldown_seconds=40)

# In-memory rolling history for fast trend analysis
telemetry_buffer: List[Dict[str, Any]] = []
BUFFER_MAX_SIZE = 120


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, machine_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        if machine_id not in self.active_connections:
            self.active_connections[machine_id] = set()
        self.active_connections[machine_id].add(websocket)
        logger.info("Client connected to machine '%s'. Total: %d", machine_id, len(self.active_connections[machine_id]))

    def disconnect(self, machine_id: str, websocket: WebSocket) -> None:
        if machine_id in self.active_connections:
            self.active_connections[machine_id].discard(websocket)
            if not self.active_connections[machine_id]:
                del self.active_connections[machine_id]
        logger.info("Client disconnected from machine '%s'.", machine_id)

    async def broadcast_to_machine(self, machine_id: str, message: Dict[str, Any]) -> None:
        if machine_id not in self.active_connections:
            return

        dead_sockets: List[WebSocket] = []
        payload_text = json.dumps(message)

        for connection in list(self.active_connections[machine_id]):
            try:
                await connection.send_text(payload_text)
            except Exception:
                dead_sockets.append(connection)

        for dead in dead_sockets:
            self.disconnect(machine_id, dead)


ws_manager = ConnectionManager()
background_task: Optional[asyncio.Task] = None


async def simulation_worker():
    """
    Continuous background loop generating readings every ~1.0 second,
    evaluating anomaly detection, generating diagnostics when needed,
    persisting to SQLite, and broadcasting over WebSocket.
    """
    logger.info("Simulation worker loop started.")
    last_known_status = "HEALTHY"

    while True:
        try:
            await asyncio.sleep(1.0)

            # Generate reading
            reading = simulator.tick()

            # Run anomaly detection
            analysis = anomaly_detector.evaluate(reading)
            health_status = analysis["health_status"]

            # Merge payload
            packet = {
                **reading,
                "health_status": health_status,
                "anomaly_score": analysis["anomaly_score"],
                "anomaly_reasons": analysis["anomaly_reasons"],
                "parameters_detail": analysis["parameters"],
                "detection_timestamp": analysis["detection_timestamp"],
                "is_simulated": True,
            }

            # Update rolling buffer
            telemetry_buffer.append(packet)
            if len(telemetry_buffer) > BUFFER_MAX_SIZE:
                telemetry_buffer.pop(0)

            # Persist to database if running
            if reading.get("is_running", False):
                try:
                    save_telemetry_reading(packet)
                except Exception as e:
                    logger.error("Failed to save telemetry: %s", e)

            # Check for Incident Alerts and AI Diagnostics
            new_alert = None
            new_diagnostic = None

            if health_status in ("WARNING", "CRITICAL") and reading.get("is_running", False):
                # Trigger alert if entering abnormal state or escalated
                if health_status != last_known_status:
                    alert_id = f"ALR-{uuid.uuid4().hex[:6].upper()}"
                    alert_title = (
                        f"{simulator.machine_id} - Critical Overheat & Vibration Spike"
                        if health_status == "CRITICAL"
                        else f"{simulator.machine_id} - Abnormal Thermal & Current Elevation"
                    )
                    alert_desc = " • ".join(analysis["anomaly_reasons"]) or "Sensor values exceeded safety thresholds."

                    alert_payload = {
                        "id": alert_id,
                        "machine_id": simulator.machine_id,
                        "severity": health_status.lower(),
                        "title": alert_title,
                        "description": alert_desc,
                        "parameters": {
                            "temperature": reading["temperature"],
                            "vibration": reading["vibration"],
                            "current": reading["current"],
                        },
                    }
                    try:
                        save_alert(alert_payload)
                        new_alert = alert_payload
                    except Exception as e:
                        logger.error("Failed to save alert: %s", e)

                # Check AI Diagnostic generation with deduplication
                if ai_assistant.should_trigger(health_status):
                    try:
                        diagnostic = ai_assistant.generate_diagnostic(
                            machine_id=simulator.machine_id,
                            current_reading=packet,
                            recent_trend=telemetry_buffer[-10:],
                            anomaly_reasons=analysis["anomaly_reasons"],
                        )
                        save_diagnostic(diagnostic)
                        new_diagnostic = diagnostic
                        logger.info("AI Diagnostic generated: %s (Confidence %d%%)", diagnostic["id"], diagnostic["confidence"])
                    except Exception as e:
                        logger.error("Failed to generate AI diagnostic: %s", e)

            last_known_status = health_status

            # Broadcast WebSocket payload
            ws_payload = {
                "type": "telemetry_update",
                "telemetry": packet,
                "simulator_status": simulator.get_status(),
                "new_alert": new_alert,
                "new_diagnostic": new_diagnostic,
            }
            await ws_manager.broadcast_to_machine(simulator.machine_id, ws_payload)

        except asyncio.CancelledError:
            logger.info("Simulation worker loop cancelled.")
            break
        except Exception as e:
            logger.error("Exception in simulation worker loop: %s", e, exc_info=True)
            await asyncio.sleep(1.0)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global background_task
    # Automatically start the simulation engine in Normal scenario on launch
    simulator.start()
    simulator.set_scenario("normal")
    background_task = asyncio.create_task(simulation_worker())
    yield
    if background_task:
        background_task.cancel()
        try:
            await background_task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title="ForgeMind AI - Industrial Telemetry & Diagnostics API",
    description="Real-time conveyor motor telemetry simulation, anomaly detection, and AI diagnostics.",
    version="2.0.0",
    lifespan=lifespan,
)

# Enable CORS for local Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request Models
class ScenarioRequest(BaseModel):
    scenario: str = Field(..., description="Scenario to activate: 'normal', 'warning', 'critical', 'recovery', 'abnormal'")


# REST API Endpoints

@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")


@app.get("/api/simulator/status")
def get_simulator_status() -> Dict[str, Any]:
    status = simulator.get_status()
    latest = telemetry_buffer[-1] if telemetry_buffer else None
    return {
        **status,
        "latest_reading": latest,
        "disclaimer": "SIMULATED TELEMETRY: Data generated by software simulator, not physical industrial equipment.",
    }


@app.post("/api/simulator/start")
def start_simulator() -> Dict[str, Any]:
    simulator.start()
    return {"message": "Simulation started", "status": simulator.get_status()}


@app.post("/api/simulator/stop")
def stop_simulator() -> Dict[str, Any]:
    simulator.stop()
    return {"message": "Simulation stopped", "status": simulator.get_status()}


@app.post("/api/simulator/scenario")
def set_simulator_scenario(req: ScenarioRequest) -> Dict[str, Any]:
    try:
        simulator.set_scenario(req.scenario)
        return {"message": f"Scenario set to '{req.scenario}'", "status": simulator.get_status()}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/simulator/reset")
def reset_simulator() -> Dict[str, Any]:
    simulator.reset()
    simulator.start()
    return {"message": "Simulation reset to nominal baseline", "status": simulator.get_status()}


@app.get("/api/telemetry/history")
def get_telemetry_history(machine_id: str = "CONV-MTR-01", limit: int = 50) -> Dict[str, Any]:
    records = get_recent_telemetry(machine_id=machine_id, limit=limit)
    return {
        "machine_id": machine_id,
        "count": len(records),
        "history": records,
    }


@app.get("/api/alerts")
def get_alerts(limit: int = 20) -> Dict[str, Any]:
    alerts = get_recent_alerts(limit=limit)
    return {"alerts": alerts, "count": len(alerts)}


@app.get("/api/diagnostics/latest")
def get_latest_diagnostics(machine_id: str = "CONV-MTR-01") -> Dict[str, Any]:
    diag = get_latest_diagnostic(machine_id=machine_id)
    if not diag:
        # Return fallback high-fidelity template if no anomaly has triggered yet
        return {
            "diagnostic": {
                "id": "DIAG-BASELINE",
                "machine_id": machine_id,
                "confidence": 92,
                "primaryHypothesis": {
                    "title": "Nominal Operating State (No Anomaly Detected)",
                    "description": "Continuous telemetry parameters are within ISO 10816-3 Zone A and NEMA Class F limits.",
                },
                "alternatives": [],
                "remediationSteps": ["Continue regular scheduled vibration monitoring."],
                "timestamp": None,
            }
        }
    return {"diagnostic": diag}


# WebSocket Endpoint

@app.websocket("/ws/machines/{machine_id}")
async def websocket_telemetry_endpoint(websocket: WebSocket, machine_id: str):
    await ws_manager.connect(machine_id, websocket)

    # Immediately push current status and latest reading on connect
    init_packet = {
        "type": "connection_established",
        "machine_id": machine_id,
        "simulator_status": simulator.get_status(),
        "latest_reading": telemetry_buffer[-1] if telemetry_buffer else None,
        "recent_history": telemetry_buffer[-30:] if telemetry_buffer else [],
        "latest_diagnostic": get_latest_diagnostic(machine_id),
        "disclaimer": "SIMULATED TELEMETRY: Data generated by software simulator, not physical industrial equipment.",
    }
    await websocket.send_text(json.dumps(init_packet))

    try:
        while True:
            # Listen for client control commands (e.g. switch scenario from UI over WS)
            data_text = await websocket.receive_text()
            try:
                msg = json.loads(data_text)
                action = msg.get("action")
                if action == "start":
                    simulator.start()
                elif action == "stop":
                    simulator.stop()
                elif action == "set_scenario":
                    sc = msg.get("scenario")
                    if sc:
                        simulator.set_scenario(sc)
                elif action == "reset":
                    simulator.reset()
                    simulator.start()

                # Broadcast immediate confirmation
                await ws_manager.broadcast_to_machine(
                    machine_id,
                    {
                        "type": "control_ack",
                        "simulator_status": simulator.get_status(),
                    },
                )
            except Exception as e:
                logger.warning("Error processing client WS message: %s", e)
    except WebSocketDisconnect:
        ws_manager.disconnect(machine_id, websocket)
    except Exception as e:
        logger.error("WebSocket exception: %s", e)
        ws_manager.disconnect(machine_id, websocket)
