import { useState, useEffect, useCallback } from 'react';
import { getPump, getPumps, subscribe } from '../api/index.js';

/**
 * Subscribe to the pump list with polling.
 * @param {number} intervalMs
 */
export function usePumpList(intervalMs = 2000) {
  const [pumps, setPumps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    Promise.resolve(getPumps())
      .then(data => { if (mounted) { setPumps(data); setLoading(false); } })
      .catch(err => { if (mounted) { setError(err.message); setLoading(false); } });

    const unsub = subscribe(data => {
      if (mounted) setPumps(data);
    }, intervalMs);

    return () => { mounted = false; unsub(); };
  }, [intervalMs]);

  return { pumps, loading, error };
}

/**
 * Fetch a single pump's full record with periodic refresh.
 * @param {string} id
 * @param {number} intervalMs
 */
export function usePumpDetail(id, intervalMs = 1000) {
  const [pump, setPump] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(() => {
    Promise.resolve(getPump(id)).then(setPump).catch(err => setError(err.message));
  }, [id]);

  useEffect(() => {
    let mounted = true;

    Promise.resolve(getPump(id))
      .then(data => { if (mounted) { setPump(data); setLoading(false); } })
      .catch(err => { if (mounted) { setError(err.message); setLoading(false); } });

    const handle = setInterval(() => {
      if (mounted) {
        Promise.resolve(getPump(id)).then(data => {
          if (mounted) setPump(data);
        });
      }
    }, intervalMs);

    return () => { mounted = false; clearInterval(handle); };
  }, [id, intervalMs]);

  return { pump, loading, error, refresh };
}
