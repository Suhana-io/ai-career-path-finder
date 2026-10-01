/* ═══════════════════════════════════════════
   auth.js — login & register page logic
   ═══════════════════════════════════════════ */

// Redirect if already logged in
if (localStorage.getItem('token')) {
  window.location.href = 'dashboard.html';
}

/* ── Tab switching ────────────────────────── */
function showTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.style.display = 'none');
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  document.getElementById(`${tab}-form`).style.display = 'block';
  clearAlerts();
}

function clearAlerts() {
  document.querySelectorAll('.alert').forEach(a => a.classList.remove('show'));
}

function showAlert(id, msg, type = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = `alert alert-${type} show`;
}

function setLoading(btn, loading, originalText) {
  if (loading) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Please wait...';
  } else {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

/* ── Login ────────────────────────────────── */
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlerts();
  const btn  = e.target.querySelector('button[type=submit]');
  const orig = btn.innerHTML;
  setLoading(btn, true, orig);
  try {
    const data = await API.login({
      email:    document.getElementById('login-email').value.trim(),
      password: document.getElementById('login-password').value
    });
    setSession(data.token, data.user);
    window.location.href = 'dashboard.html';
  } catch (err) {
    showAlert('login-alert', err.message, 'error');
    setLoading(btn, false, orig);
  }
});

/* ── Register ─────────────────────────────── */
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlerts();
  const pass = document.getElementById('reg-password').value;
  const conf = document.getElementById('reg-confirm').value;
  if (pass !== conf) {
    showAlert('register-alert', 'Passwords do not match', 'error');
    return;
  }
  const btn  = e.target.querySelector('button[type=submit]');
  const orig = btn.innerHTML;
  setLoading(btn, true, orig);
  try {
    const data = await API.register({
      name:     document.getElementById('reg-name').value.trim(),
      email:    document.getElementById('reg-email').value.trim(),
      password: pass
    });
    setSession(data.token, data.user);
    window.location.href = 'dashboard.html';
  } catch (err) {
    showAlert('register-alert', err.message, 'error');
    setLoading(btn, false, orig);
  }
});