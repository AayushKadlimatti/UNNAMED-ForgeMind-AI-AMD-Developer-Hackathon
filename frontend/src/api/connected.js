const BASE = import.meta.env.VITE_API_BASE || '';
let token = '';
export function setToken(value) { token = value; }
export async function api(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      ...options, signal: controller.signal, credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    });
  } catch (err) {
    throw new Error(err.name === 'AbortError' ? 'Server did not respond within 15 seconds. Retry when it is available.' : 'Cannot reach the backend. Check that it is running.');
  } finally { clearTimeout(timer); }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 401) window.dispatchEvent(new Event('forgemind-session-expired'));
    throw new Error(typeof body.detail === 'string' ? body.detail : `Request failed (${response.status})`);
  }
  return response.json();
}
