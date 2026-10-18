/**
 * Data layer entry point.
 * Components import ONLY from this file — never from adapters directly.
 * Selects mock vs live adapter based on VITE_USE_MOCK env var.
 */

import * as mock from './mockAdapter.js';
import * as live from './liveAdapter.js';

const useMock = import.meta.env.VITE_USE_MOCK !== 'false';
const adapter = useMock ? mock : live;

export const getPumps = (...args) => adapter.getPumps(...args);
export const getPump = (...args) => adapter.getPump(...args);
export const subscribe = (...args) => adapter.subscribe(...args);
export const getBurstStats = (...args) => adapter.getBurstStats(...args);
export const triggerScenario = (...args) => adapter.triggerScenario(...args);
export const getTimeline = (...args) => adapter.getTimeline(...args);
export const isMock = adapter.isMock;
