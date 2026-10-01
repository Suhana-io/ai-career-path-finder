/* ═══════════════════════════════════════════
   api.js — all backend calls in one place
   ═══════════════════════════════════════════ */

const BASE = 'http://127.0.0.1:5000';

const getToken = () => localStorage.getItem('token');
const getUser  = () => JSON.parse(localStorage.getItem('user') || 'null');

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
  const res  = await fetch(BASE + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

/* Auth */
const API = {
  register:       (body) => apiFetch('POST', '/api/auth/register',             body, false),
  login:          (body) => apiFetch('POST', '/api/auth/login',                body, false),
  getProfile:     ()     => apiFetch('GET',  '/api/profile/'),
  saveProfile:    (body) => apiFetch('POST', '/api/profile/',                  body),
  getCareers:     ()     => apiFetch('GET',  '/api/careers/',                  null, false),
  getCareer:      (id)   => apiFetch('GET',  `/api/careers/${id}`),
  getResources:   (id)   => apiFetch('GET',  `/api/careers/${id}/resources`),
  recommend:      ()     => apiFetch('GET',  '/api/recommend/'),
  gap:            (id)   => apiFetch('GET',  `/api/recommend/gap/${id}`),
  roadmap:        (id)   => apiFetch('GET',  `/api/recommend/roadmap/${id}`),
  updateProgress: (body) => apiFetch('POST', '/api/recommend/progress',        body),
  dashboard:      ()     => apiFetch('GET',  '/api/recommend/dashboard'),
};