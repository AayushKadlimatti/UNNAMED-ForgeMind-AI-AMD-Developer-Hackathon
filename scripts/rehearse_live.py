"""Explicit, bounded demo rehearsal. Makes ONE real AMD request only with --live-amd.

Creates a clearly labelled rehearsal work order and retains it as auditable history.
Never adds fabricated manual excerpts or removes existing data.
"""
import argparse
import json
from pathlib import Path
import time

import httpx
from dotenv import dotenv_values

ROOT = Path(__file__).resolve().parents[1]


def run():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--live-amd', action='store_true', help='Authorize one real AMD diagnosis and a labelled rehearsal work order')
    args = parser.parse_args()
    if not args.live_amd:
        parser.error('Use --live-amd explicitly. This rehearsal consumes shared AMD quota and saves a rehearsal work order.')
    config = dotenv_values(ROOT / '.env')
    admin_token = config.get('FORGEMIND_ADMIN_TOKEN')
    if not admin_token:
        raise SystemExit('Administrator demo token missing. Run configure_demo.py first.')
    with httpx.Client(base_url='http://127.0.0.1:8001', timeout=15, headers={'Authorization': 'Bearer ' + admin_token}) as client:
        def call(method, path, **kwargs):
            response = client.request(method, path, **kwargs)
            if response.is_error:
                raise RuntimeError(f'{method} {path} returned {response.status_code}; inspect the local app for details.')
            return response.json()

        before = call('GET', '/api/simulator/status')
        if call('GET', '/api/diagnostics/latest')['status'] == 'pending' or before['retry_after_s'] > 0:
            raise SystemExit('A request is pending or cooling down. Wait before running a rehearsal.')
        call('POST', '/api/simulator/start')
        call('POST', '/api/simulator/scenario', json={'scenario': 'normal'})
        print('Recording a healthy baseline (12 seconds).', flush=True)
        time.sleep(12)
        call('POST', '/api/simulator/scenario', json={'scenario': 'warning'})
        time.sleep(3)
        call('POST', '/api/simulator/scenario', json={'scenario': 'critical'})
        snapshot = call('GET', '/api/simulator/status')
        assert snapshot['latest_reading']['health_status'] == 'CRITICAL'
        incident = next(item for item in call('GET', '/api/alerts')['alerts'] if item['state'] == 'active')
        call('PATCH', f"/api/alerts/{incident['id']}/acknowledge")
        requested = call('POST', '/api/diagnostics/request')['diagnostic']
        print('One AMD request started. No automatic retries.', flush=True)
        deadline = time.monotonic() + 95
        while time.monotonic() < deadline:
            result = call('GET', '/api/diagnostics/latest')['diagnostic']
            if result['id'] != requested['id']:
                raise RuntimeError('Another investigation replaced the latest result; stop this rehearsal and review history.')
            if result['status'] != 'pending':
                break
            time.sleep(2)
        else:
            raise RuntimeError('Rehearsal deadline reached; inspect the saved investigation. No retry was made.')
        if result['status'] != 'completed':
            raise RuntimeError('AMD unavailable. Saved evidence is retained; inspect the app. No retry was made.')
        assert result['context_readings'] and result['telemetry_snapshot']['health_status'] == 'CRITICAL'
        task_path = f"/api/diagnostics/{result['id']}/work-order"
        payload = {'title': 'Hackathon rehearsal: review conveyor sensor evidence', 'assigned_to': 'Demo technician', 'priority': 'HIGH'}
        task = call('POST', task_path, json=payload)
        assert call('POST', task_path, json=payload)['id'] == task['id']
        for state in ('In Progress', 'Completed'):
            task = call('PATCH', f"/api/v1/tasks/{task['id']}/status", json={'status': state})
        assert call('GET', '/api/simulator/status')['latest_reading']['health_status'] == 'CRITICAL'
        print('AMD completed; linked work order progressed and completed. Machine remains critical until recovery.', flush=True)
        call('POST', '/api/simulator/scenario', json={'scenario': 'recovery'})
        deadline = time.monotonic() + 60
        while time.monotonic() < deadline:
            recovered = call('GET', '/api/simulator/status')
            if recovered['latest_reading']['health_status'] == 'HEALTHY' and recovered['active_incidents'] == 0:
                break
            time.sleep(2)
        else:
            raise RuntimeError('Recovery did not settle within 60 seconds; inspect readings.')
        if not before['is_running']:
            call('POST', '/api/simulator/stop')
        result = call('GET', '/api/diagnostics/latest')['diagnostic']
        summary = {'diagnosis_id': result['id'], 'status': result['status'], 'inference': result['inference'],
                   'trend_readings': result['trend_readings'], 'reference_count': len(result['references']),
                   'work_order_id': task['id'], 'work_order_status': task['status'],
                   'recovered_detector_state': recovered['latest_reading']['health_status'],
                   'active_incidents_after_recovery': recovered['active_incidents']}
        output = ROOT / 'data/live-rehearsal.json'
        output.parent.mkdir(exist_ok=True)
        output.write_text(json.dumps(summary, indent=2), encoding='utf-8')
        print(json.dumps(summary, indent=2), flush=True)


if __name__ == '__main__':
    run()
