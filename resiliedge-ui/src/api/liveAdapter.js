/**
 * Live API adapter — talks to the real backend.
 * Activated when VITE_USE_MOCK=false and VITE_API_BASE is set.
 */

import { normalize, normalizeSummary } from './schema.js';

const BASE = import.meta.env.VITE_API_BASE || '';

async function fetchJSON(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getPumps() {
  const raw = await fetchJSON('/pumps');
  return (raw || []).map(normalizeSummary);
}

export async function getPump(id) {
  const raw = await fetchJSON(`/pumps/${encodeURIComponent(id)}`);
  return normalize(raw);
}

export function subscribe(callback, intervalMs = 2000) {
  let active = true;
  const poll = async () => {
    if (!active) return;
    try {
      const data = await getPumps();
      callback(data);
    } catch (err) {
      console.error('[ResiliEdge] polling error:', err);
    }
    if (active) setTimeout(poll, intervalMs);
  };
  poll();
  return () => { active = false; };
}

export async function getBurstStats() {
  return fetchJSON('/burst-stats');
}

export async function triggerScenario() {
  const res = await fetch(`${BASE}/scenario/trigger`, { method: 'POST' });
  if (res.status === 404) {
    throw new Error('Scenario endpoint not available on this backend (404)');
  }
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getTimeline() {
  const raw = await fetchJSON('/timeline');
  return raw || [];
}

export const isMock = false;
