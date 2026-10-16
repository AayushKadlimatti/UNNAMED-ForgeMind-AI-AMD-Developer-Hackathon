"""
backend/simulator.py - Conveyor Motor Telemetry Simulator for ForgeMind AI
Generates continuous, realistic industrial telemetry with physical dynamics
and controlled transitions between NORMAL, WARNING, CRITICAL, and RECOVERY scenarios.
"""

from __future__ import annotations

import math
import random
from datetime import datetime, timezone
from typing import Any, Dict


class ConveyorMotorSimulator:
    """
    Physical simulation model of an industrial 3-phase AC induction conveyor motor.
    Rated Power: 11 kW, 400V, 1500 RPM nominal, Full Load Amps (FLA): 15.5 A.
    """

    def __init__(self, machine_id: str = "CONV-MTR-01"):
        self.machine_id = machine_id
        self.is_running = False
        self.scenario = "normal"  # normal, warning, critical, recovery
        self.tick_count = 0

        # Physical state baselines (nominal healthy values)
        self.base_temperature = 65.0  # °C
        self.base_vibration = 2.10    # mm/s RMS
        self.base_current = 15.20     # Amperes

        # Current state variables
        self.current_temperature = self.base_temperature
        self.current_vibration = self.base_vibration
        self.current_current = self.base_current

        # Scenario progress counters for smooth transitions
        self.scenario_tick = 0

    def start(self) -> None:
        self.is_running = True

    def stop(self) -> None:
        self.is_running = False

    def reset(self) -> None:
        self.scenario = "normal"
        self.scenario_tick = 0
        self.current_temperature = self.base_temperature
        self.current_vibration = self.base_vibration
        self.current_current = self.base_current

    def set_scenario(self, scenario: str) -> None:
        valid = {"normal", "warning", "critical", "recovery", "abnormal"}
        sc_lower = scenario.lower()
        if sc_lower not in valid:
            raise ValueError(f"Invalid scenario '{scenario}'. Valid options: {valid}")
        # Map 'abnormal' to 'critical' fault injection scenario
        if sc_lower == "abnormal":
            sc_lower = "critical"
        self.scenario = sc_lower
        self.scenario_tick = 0

        # Provide immediate telemetry response for demo responsiveness
        if sc_lower == "critical":
            self.current_vibration = 4.82
            self.current_temperature = 81.4
            self.current_current = 18.9
        elif sc_lower == "warning":
            self.current_vibration = 4.65
            self.current_temperature = 78.5
            self.current_current = 17.8
        elif sc_lower == "normal":
            self.current_vibration = 2.10
            self.current_temperature = 65.0
            self.current_current = 15.3

    def tick(self) -> Dict[str, Any]:
        """
        Advance simulation by one second and return telemetry dictionary.
        """
        if not self.is_running:
            return {
                "machine_id": self.machine_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "temperature": round(self.current_temperature, 2),
                "vibration": round(self.current_vibration, 3),
                "current": round(self.current_current, 2),
                "operating_status": "STOPPED",
                "is_running": False,
                "scenario": self.scenario,
                "tick_count": self.tick_count,
            }

        self.tick_count += 1
        self.scenario_tick += 1

        # Periodic cycle components (e.g. 10-second belt revolution cycle)
        cycle_phase = (self.tick_count % 10) / 10.0 * 2 * math.pi
        cycle_ripple = math.sin(cycle_phase)

        if self.scenario == "normal":
            # Scenario A: NORMAL
            # Stable values with natural Gaussian noise and minor cyclical load variations
            target_temp = self.base_temperature + random.gauss(0, 0.4)
            target_vib = self.base_vibration + 0.08 * cycle_ripple + random.gauss(0, 0.06)
            target_curr = self.base_current + 0.15 * cycle_ripple + random.gauss(0, 0.12)

            # Smooth inertia
            self.current_temperature += (target_temp - self.current_temperature) * 0.15
            self.current_vibration += (target_vib - self.current_vibration) * 0.25
            self.current_current += (target_curr - self.current_current) * 0.30
            op_status = "RUNNING"

        elif self.scenario == "warning":
            # Scenario B: WARNING
            # Gradually increasing temperature towards ~78°C, vibration to ~3.8 mm/s, current to ~18.5 A
            # Simulates developing bearing race degradation and mechanical friction
            progress = min(self.scenario_tick / 25.0, 1.0)
            target_temp = self.base_temperature + progress * 13.0 + random.gauss(0, 0.6)
            target_vib = self.base_vibration + progress * 1.8 + 0.15 * cycle_ripple + random.gauss(0, 0.12)
            target_curr = self.base_current + progress * 3.4 + random.gauss(0, 0.25)

            self.current_temperature += (target_temp - self.current_temperature) * 0.10
            self.current_vibration += (target_vib - self.current_vibration) * 0.20
            self.current_current += (target_curr - self.current_current) * 0.25
            op_status = "DEGRADED"

        elif self.scenario == "critical":
            # Scenario C: CRITICAL
            # Rapidly climbing temperature (84-95°C), high vibration spikes (5.5 - 8.5 mm/s),
            # heavy abnormal current (21.5 - 25.5 A)
            progress = min(self.scenario_tick / 18.0, 1.0)
            stochastic_spike = random.choice([0.0, 0.0, 0.0, 0.8, 1.2])

            target_temp = 78.0 + progress * 16.0 + random.gauss(0, 0.8)
            target_vib = 4.2 + progress * 3.8 + stochastic_spike + random.gauss(0, 0.25)
            target_curr = 19.0 + progress * 5.8 + random.gauss(0, 0.5)

            self.current_temperature += (target_temp - self.current_temperature) * 0.12
            self.current_vibration += (target_vib - self.current_vibration) * 0.30
            self.current_current += (target_curr - self.current_current) * 0.35
            op_status = "CRITICAL_FAULT"

        elif self.scenario == "recovery":
            # Recovery Scenario: Smooth exponential decay back to nominal baseline
            decay_factor = 0.08
            self.current_temperature += (self.base_temperature - self.current_temperature) * decay_factor
            self.current_vibration += (self.base_vibration - self.current_vibration) * (decay_factor * 2)
            self.current_current += (self.base_current - self.current_current) * (decay_factor * 2.5)

            # Add mild noise during recovery
            self.current_temperature += random.gauss(0, 0.15)
            self.current_vibration += random.gauss(0, 0.04)
            self.current_current += random.gauss(0, 0.1)

            # Auto-revert to normal once within close threshold
            if (
                abs(self.current_temperature - self.base_temperature) < 1.5
                and abs(self.current_vibration - self.base_vibration) < 0.25
                and abs(self.current_current - self.base_current) < 0.5
            ):
                self.scenario = "normal"
                op_status = "RUNNING"
            else:
                op_status = "RECOVERING"
        else:
            op_status = "RUNNING"

        # Sanity bounds to prevent negative or impossible values
        self.current_temperature = max(20.0, min(140.0, self.current_temperature))
        self.current_vibration = max(0.1, min(25.0, self.current_vibration))
        self.current_current = max(0.0, min(50.0, self.current_current))

        return {
            "machine_id": self.machine_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "temperature": round(self.current_temperature, 2),
            "vibration": round(self.current_vibration, 3),
            "current": round(self.current_current, 2),
            "operating_status": op_status,
            "is_running": self.is_running,
            "scenario": self.scenario,
            "tick_count": self.tick_count,
        }

    def get_status(self) -> Dict[str, Any]:
        return {
            "machine_id": self.machine_id,
            "is_running": self.is_running,
            "scenario": self.scenario,
            "tick_count": self.tick_count,
            "base_values": {
                "temperature": self.base_temperature,
                "vibration": self.base_vibration,
                "current": self.base_current,
            },
            "current_values": {
                "temperature": round(self.current_temperature, 2),
                "vibration": round(self.current_vibration, 3),
                "current": round(self.current_current, 2),
            },
        }
