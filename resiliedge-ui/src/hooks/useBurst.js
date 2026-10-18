import { useState, useEffect } from 'react';
import { getBurstStats } from '../api/index.js';

/**
 * Poll burst test stats at a regular interval.
 * @param {number} intervalMs
 */
export function useBurst(intervalMs = 2000) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const poll = () => {
      Promise.resolve(getBurstStats())
        .then(data => { if (mounted) { setStats(data); setLoading(false); } })
        .catch(err => { if (mounted) { setError(err.message); setLoading(false); } });
    };

    poll();
    const handle = setInterval(poll, intervalMs);

    return () => { mounted = false; clearInterval(handle); };
  }, [intervalMs]);

  return { stats, loading, error };
}
