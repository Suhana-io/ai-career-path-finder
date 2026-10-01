/* ═══════════════════════════════════════════
   api.js — all backend calls in one place
   Load this BEFORE app.js and your login script.
   ═══════════════════════════════════════════ */

const BASE_URL = 'https://ai-career-path-finder-v3mg.onrender.com';

const getToken = () => localStorage.getItem('token');
const getUser  = () => {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); }
  catch (e) { return null; }
};

const setSession = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};
const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

async function apiFetch(method, path, body = null, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = 'Bearer ' + getToken();

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  // Network failure (server down, wrong port, CORS blocked)
  let res;
  try {
    res = await fetch(BASE_URL + path, opts);
  } catch (e) {
    throw new Error('Cannot reach the server. Is the Flask backend running on port 5000?');
  }

  // Server may return non-JSON (e.g. an HTML 500 page)
  let data = {};
  try { data = await res.json(); } catch (e) { /* ignore */ }

  // Expired / invalid token on a protected call → back to login
  if (auth && (res.status === 401 || res.status === 422)) {
    clearSession();
    window.location.href = 'index.html';
    throw new Error('Session expired. Please sign in again.');
  }

  if (!res.ok) throw new Error(data.error || data.msg || `Request failed (${res.status})`);
  return data;
}

const API = {
  /* Auth */
  register:       (body) => apiFetch('POST', '/api/auth/register',      body, false),
  login:          (body) => apiFetch('POST', '/api/auth/login',         body, false),

  /* Profile */
  getProfile:     ()     => apiFetch('GET',  '/api/profile/'),
  saveProfile:    (body) => apiFetch('POST', '/api/profile/',           body),

  /* Careers */
  getCareers:     ()     => apiFetch('GET',  '/api/careers/',           null, false),
  getCareer:      (id)   => apiFetch('GET',  `/api/careers/${id}`,      null, false),
  getResources:   (id)   => apiFetch('GET',  `/api/careers/${id}/resources`, null, false),

  /* Recommendations */
  recommend:      ()     => apiFetch('GET',  '/api/recommend/'),
  gap:            (id)   => apiFetch('GET',  `/api/recommend/gap/${id}`),
  roadmap:        (id)   => apiFetch('GET',  `/api/recommend/roadmap/${id}`),
  updateProgress: (body) => apiFetch('POST', '/api/recommend/progress', body),
  dashboard:      ()     => apiFetch('GET',  '/api/recommend/dashboard'),
};