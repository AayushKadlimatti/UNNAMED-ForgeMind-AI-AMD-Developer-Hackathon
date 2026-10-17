import test from 'node:test';
import assert from 'node:assert/strict';
import { elapsedSeconds, investigationReport } from '../src/master/investigation.js';

test('report preserves saved evidence, zero usage and provider failure without fabricating a result', () => {
  const diagnosis = { id: 'DIAG-example', machine_id: 'CONV-MTR-01', status: 'unavailable', message: 'AMD timed out',
    telemetry_snapshot: { temperature: 0, vibration: 0, current: 0, health_status: 'WARNING', anomaly_reasons: ['Recorded detector reason'] },
    inference: { completion_tokens: 0 }, context_readings: [{ temperature: 0, vibration: 0, current: 0, health_status: 'WARNING' }] };
  const report = investigationReport(diagnosis);
  assert.match(report, /Temperature: 0 °C/);
  assert.match(report, /Completion tokens: 0/);
  assert.match(report, /AMD timed out/);
  assert.match(report, /No reference excerpts were supplied/);
  assert.match(report, /Hardware: Not reported/);
  assert.match(report, /No repair or machine actuation was performed/);
  assert.match(report, /Recorded detector reason/);
});

test('workflow duration rejects absent, invalid and reversed timestamps', () => {
  assert.equal(elapsedSeconds('2026-10-17T00:00:00Z', '2026-10-17T00:00:20Z'), 20);
  assert.equal(elapsedSeconds(undefined, undefined), null);
  assert.equal(elapsedSeconds('bad', 'date'), null);
  assert.equal(elapsedSeconds('2026-10-17T00:00:20Z', '2026-10-17T00:00:00Z'), null);
});

test('report links actual work-order evidence and review duration', () => {
  const report = investigationReport({ id: 'DIAG-test', status: 'completed', completed_at: '2026-10-17T00:00:00Z', work_order_id: 'TASK-test' },
    { id: 'TASK-test', title: 'Inspect records', assigned_to: 'Operator', status: 'Pending', created_at: '2026-10-17T00:00:40Z' });
  assert.match(report, /Work order: TASK-test/);
  assert.match(report, /Assessment-to-approval time: 40.0 s/);
  assert.match(report, /Assigned to: Operator/);
});
import { chartReadings } from '../src/master/telemetry.js';

test('chart uses actual timestamps and leaves a visible gap across pauses', () => {
  const history = [{ timestamp: '2026-10-17T00:00:00Z', vibration: 2 }, { timestamp: '2026-10-17T00:00:01Z', vibration: 3 }, { timestamp: '2026-10-17T01:00:00Z', vibration: 7 }];
  const data = chartReadings(history, 'vibration');
  assert.equal(data.length, 4);
  assert.equal(data[2].vibration, null);
  assert.equal(data[3].observedAt - data[0].observedAt, 3600000);
  assert.equal(history.length, 3);
  assert.equal(chartReadings([{ timestamp: 'invalid', vibration: 9 }], 'vibration').length, 0);
});
