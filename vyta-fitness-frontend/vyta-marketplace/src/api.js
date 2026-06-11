const BASE = import.meta.env.VITE_API_URL || '/api/v1';

export async function api(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (options.headers) Object.assign(headers, options.headers);

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const text = await res.text();
    let msg;
    try { msg = JSON.parse(text); } catch { msg = text; }
    const error = new Error(typeof msg.detail === 'string' ? msg.detail : JSON.stringify(msg));
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) return null;
  return res.json();
}

export function setToken(token, role) {
  localStorage.setItem('token', token);
  localStorage.setItem('role', role);
}

export function getToken() {
  return localStorage.getItem('token');
}

export function getRole() {
  return localStorage.getItem('role');
}

export function clearToken() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
}
