/* ═══════════════════════════════════════════
   app.js — Career Path Finder
   ═══════════════════════════════════════════ */

if (!localStorage.getItem('token')) {
  window.location.href = 'index.html';
}

const user = getUser();

/* Escape user-entered text before putting it into innerHTML */
function esc(str) {
  return String(str).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/* ── Toast ────────────────────────────────── */
function toast(msg, type = 'info') {
  const wrap = document.getElementById('toast-wrap');
  const el   = document.createElement('div');
  el.className = `toast toast-${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const iconEl = document.createElement('span');
  iconEl.textContent = icons[type] || icons.info;
  const msgEl = document.createElement('span');
  msgEl.textContent = msg;
  el.append(iconEl, msgEl);
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/* ── Sidebar ──────────────────────────────── */
function initSidebar() {
  if (!user) return;
  const ini = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
  document.getElementById('sb-avatar').textContent   = ini;
  document.getElementById('sb-name').textContent     = user.name;
  document.getElementById('sb-email').textContent    = user.email;
  document.getElementById('topbar-date').textContent =
    new Date().toLocaleDateString('en-IN', {
      weekday:'long', year:'numeric', month:'long', day:'numeric'
    });
  // settings page user info
  const sn = document.getElementById('settings-name');
  const se = document.getElementById('settings-email');
  if (sn) sn.textContent = user.name;
  if (se) se.textContent = user.email;
}

/* ── Section routing — NO loop prevention ── */
function goTo(sec) {
  // Always switch visually
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const secEl = document.getElementById('sec-' + sec);
  if (secEl) secEl.classList.add('active');

  const ni = document.querySelector(`[data-sec="${sec}"]`);
  if (ni) ni.classList.add('active');

  const titles = {
    dashboard: 'Dashboard',
    profile:   'My Profile',
    recommend: 'Career Recommendations',
    careers:   'Explore Careers',
    gap:       'Skill Gap Analysis',
    roadmap:   'Learning Roadmap',
    resources: 'Learning Resources',
    placement: 'Placement Preparation',
    progress:  'Progress Tracker',
    chatbot:   'Career Assistant',
    settings:  'Settings',
  };
  document.getElementById('topbar-title').textContent = titles[sec] || sec;

  // Always load fresh data for each section
  if      (sec === 'dashboard') loadDashboard();
  else if (sec === 'profile')   loadProfile();
  else if (sec === 'recommend') loadRecommendations();
  else if (sec === 'careers')   loadCareers();
  else if (sec === 'progress')  loadProgress();
  else if (sec === 'gap')       loadTopGap();
  else if (sec === 'roadmap')   loadTopRoadmap();
  else if (sec === 'resources') loadTopResources();
  else if (sec === 'chatbot')   initChatbot();
  // placement and settings have static content — no load needed
}

function logout() {
  clearSession();
  window.location.href = 'index.html';
}

function confirmLogout() {
  if (confirm('Are you sure you want to sign out?')) logout();
}

function clearAllData() {
  if (confirm('This will clear all local data. Continue?')) {
    clearSession();
    localStorage.clear();
    window.location.href = 'index.html';
  }
}

/* ═══════════════════════════════════════════
   SETTINGS — dark mode
   ═══════════════════════════════════════════ */
function initSettings() {
  const dark = localStorage.getItem('darkMode') === 'true';
  const toggle = document.getElementById('dark-toggle');
  if (toggle) toggle.checked = dark;
  if (dark) applyDark(true);
}

function toggleDarkMode(checked) {
  localStorage.setItem('darkMode', checked);
  applyDark(checked);
  toast(checked ? '🌙 Dark mode on' : '☀️ Light mode on', 'info');
}

function applyDark(on) {
  document.body.classList.toggle('dark', on);
  const slider = document.getElementById('toggle-slider');
  const knob   = document.getElementById('toggle-knob');
  if (slider) slider.style.background = on ? '#3B82F6' : '#CBD5E1';
  if (knob)   knob.style.transform    = on ? 'translateX(22px)' : 'translateX(0)';
}

/* ═══════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════ */
async function loadDashboard() {
  // Show loading state
  document.getElementById('dash-top-matches').innerHTML =
    '<div style="text-align:center;padding:2rem"><div class="spinner spinner-dark" style="width:30px;height:30px;border-width:3px;margin:auto"></div></div>';
  document.getElementById('dash-gaps').innerHTML = '';

  try {
    const data = await API.dashboard();
    const u    = data.user;
    const top  = data.top_recommendations;

    document.getElementById('dash-greeting').textContent =
      'Hi, ' + u.name.split(' ')[0] + '! 👋';

    const matched = top.filter(r => r.match_percent > 0).length;
    const topPct  = top.length ? Math.round(top[0].match_percent) : 0;
    document.getElementById('ds-careers').textContent = matched;
    document.getElementById('ds-match').textContent   = topPct + '%';
    document.getElementById('ds-skills').textContent  = data.total_skills;

    document.getElementById('dash-banner-sub').textContent = data.total_skills
      ? `You have ${data.total_skills} skills — top match: ${top[0]?.career_name || ''} at ${topPct}%`
      : 'Complete your profile to get personalized career recommendations!';

    // Top matches
    const recEl = document.getElementById('dash-top-matches');
    recEl.innerHTML = '';
    if (!data.total_skills) {
      recEl.innerHTML = `<div class="empty-state">
        <div class="empty-icon">🎯</div>
        <h3>No recommendations yet</h3>
        <p>Add your skills in Profile to get started.</p>
        <button class="btn btn-primary" style="margin-top:12px" onclick="goTo('profile')">Set up profile</button>
      </div>`;
    } else {
      top.slice(0,3).forEach((r, i) => {
        const pct      = Math.round(r.match_percent);
        const barColor = pct >= 70 ? '#22C55E' : pct >= 40 ? '#F59E0B' : '#EF4444';
        const cls      = pct >= 70 ? 'match-high' : pct >= 40 ? 'match-medium' : 'match-low';
        const row      = document.createElement('div');
        row.style.cssText = 'padding:12px 0;border-bottom:1px solid #E5E7EB;cursor:pointer';
        row.onclick = () => loadGapFor(r.id);
        row.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:7px">
            <div style="font-size:13px;font-weight:600">${i===0?'🏆 ':''}${r.career_name}</div>
            <span class="match-pill ${cls}">${pct}%</span>
          </div>
          <div class="pbar-bg"><div class="pbar-fill" style="width:${pct}%;background:${barColor}"></div></div>
          <div style="font-size:11px;color:#6B7280;margin-top:5px">💰 ${r.salary_range} • ${r.demand} demand</div>`;
        recEl.appendChild(row);
      });
    }

    // Missing skills
    const gapEl = document.getElementById('dash-gaps');
    gapEl.innerHTML = '';
    const topRec = top[0];
    if (topRec && topRec.missing_skills?.length) {
      topRec.missing_skills.slice(0,8).forEach(s => {
        gapEl.innerHTML += `<span class="chip chip-red">📌 ${s}</span>`;
      });
    } else if (data.total_skills) {
      gapEl.innerHTML = '<span class="chip chip-green">🎉 All skills matched!</span>';
    } else {
      gapEl.innerHTML = '<span class="chip">Add skills to see gaps</span>';
    }
  } catch (err) {
    console.error(err);
    document.getElementById('dash-top-matches').innerHTML =
      `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Failed to load</h3><p>${err.message}</p></div>`;
  }
}

/* ═══════════════════════════════════════════
   PROFILE
   ═══════════════════════════════════════════ */
let skills = [];

async function loadProfile() {
  try {
    const data = await API.getProfile();
    const p    = data.profile;
    if (p.branch)      document.getElementById('p-branch').value    = p.branch;
    if (p.year)        document.getElementById('p-year').value      = p.year;
    if (p.cgpa)        document.getElementById('p-cgpa').value      = p.cgpa;
    if (p.career_goal) document.getElementById('p-goal').value      = p.career_goal;
    if (p.interests && p.interests.length)
      document.getElementById('p-interests').value = p.interests.join(', ');
    skills = data.skills.map(s => s.skill_name);
    renderSkillTags();
  } catch (err) { console.error(err); }
}

function renderSkillTags() {
  const el = document.getElementById('skill-tags');
  el.innerHTML = '';
  if (!skills.length) {
    el.innerHTML = '<span style="font-size:12px;color:#9CA3AF">No skills yet — use quick add or type above</span>';
    return;
  }
  skills.forEach(s => {
    const tag = document.createElement('span');
    tag.className = 'skill-tag';
    tag.appendChild(document.createTextNode(s));
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'skill-tag-remove';
    btn.textContent = '×';
    btn.addEventListener('click', () => removeSkill(s));
    tag.appendChild(btn);
    el.appendChild(tag);
  });
}

function addSkill() {
  const inp = document.getElementById('skill-input');
  inp.value.split(',').map(s => s.trim()).filter(Boolean).forEach(s => {
    if (!skills.map(x => x.toLowerCase()).includes(s.toLowerCase())) skills.push(s);
  });
  inp.value = '';
  renderSkillTags();
}

function quickAdd(s) {
  if (!skills.map(x => x.toLowerCase()).includes(s.toLowerCase())) {
    skills.push(s); renderSkillTags();
  }
}

function removeSkill(s) {
  skills = skills.filter(x => x !== s);
  renderSkillTags();
}

document.getElementById('skill-input')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); addSkill(); }
});

document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn  = e.target.querySelector('button[type=submit]');
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Saving...';
  try {
    await API.saveProfile({
      branch:      document.getElementById('p-branch').value,
      year:        parseInt(document.getElementById('p-year').value),
      cgpa:        parseFloat(document.getElementById('p-cgpa').value) || null,
      career_goal: document.getElementById('p-goal').value,
      interests:   document.getElementById('p-interests').value.split(',').map(s=>s.trim()).filter(Boolean),
      skills:      skills
    });
    toast('Profile saved! Loading recommendations...', 'success');
    setTimeout(() => goTo('recommend'), 1000);
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.disabled = false; btn.innerHTML = orig;
  }
});

/* ═══════════════════════════════════════════
   RECOMMENDATIONS
   ═══════════════════════════════════════════ */
async function loadRecommendations() {
  const el = document.getElementById('rec-list');
  el.innerHTML = `<div style="text-align:center;padding:3rem">
    <div class="spinner spinner-dark" style="width:36px;height:36px;border-width:3px;margin:auto"></div>
    <div style="margin-top:12px;font-size:13px;color:#6B7280">Analyzing your profile...</div>
  </div>`;
  try {
    const data = await API.recommend();
    el.innerHTML = '';
    if (!data.recommendations.length) {
      el.innerHTML = `<div class="empty-state">
        <div class="empty-icon">🎯</div><h3>No recommendations yet</h3>
        <p>Please complete your profile first.</p>
        <button class="btn btn-primary" style="margin-top:12px" onclick="goTo('profile')">Complete profile</button>
      </div>`;
      return;
    }
    const seen = new Set();
    data.recommendations.forEach(r => {
      if (seen.has(r.career_name)) return;
      seen.add(r.career_name);
      el.appendChild(buildCareerCard(r, el.children.length === 0));
    });
  } catch (err) {
    el.innerHTML = `<div class="empty-state">
      <div class="empty-icon">⚠️</div><h3>Failed to load</h3><p>${err.message}</p>
    </div>`;
  }
}

function buildCareerCard(r, isTop = false) {
  const pct      = Math.round(r.match_percent);
  const matchCls = pct >= 70 ? 'match-high' : pct >= 40 ? 'match-medium' : 'match-low';
  const barColor = pct >= 70 ? '#22C55E' : pct >= 40 ? '#F59E0B' : '#EF4444';
  const div      = document.createElement('div');
  div.className  = 'career-card' + (isTop ? ' top' : '');
  const safeName = r.career_name.replace(/'/g, "\\'");
  div.innerHTML  = `
    <div class="cc-header">
      <div>
        <div class="cc-name">${isTop?'🏆 ':''}${r.career_name}</div>
        <div class="cc-desc">${r.description}</div>
      </div>
      <span class="match-pill ${matchCls}">${pct}% match</span>
    </div>
    <div class="pbar-bg" style="margin-bottom:10px">
      <div class="pbar-fill" style="width:${pct}%;background:${barColor}"></div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <span style="font-size:12px;color:#6B7280">💰 ${r.salary_range}</span>
      <span class="demand demand-${r.demand.toLowerCase().replace(' ','-')}">${r.demand} demand</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
      <div>
        <div style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px">✅ Matched</div>
        <div>${r.matched_skills.length
          ? r.matched_skills.slice(0,4).map(s=>`<span class="chip chip-green">${s}</span>`).join('')+(r.matched_skills.length>4?`<span class="chip">+${r.matched_skills.length-4}</span>`:'')
          : '<span style="font-size:12px;color:#9CA3AF">Add more skills</span>'}</div>
      </div>
      <div>
        <div style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px">📌 Missing</div>
        <div>${r.missing_skills.length
          ? r.missing_skills.slice(0,4).map(s=>`<span class="chip chip-red">${s}</span>`).join('')+(r.missing_skills.length>4?`<span class="chip chip-red">+${r.missing_skills.length-4}</span>`:'')
          : '<span class="chip chip-green">All matched! 🎉</span>'}</div>
      </div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;border-top:1px solid #E5E7EB;padding-top:12px">
      <button class="btn btn-primary btn-sm"   onclick="event.stopPropagation();loadRoadmapFor(${r.id},'${safeName}')">🗺️ Roadmap</button>
      <button class="btn btn-outline btn-sm"   onclick="event.stopPropagation();loadGapFor(${r.id})">📊 Skill gap</button>
      <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();loadResourcesFor(${r.id},'${safeName}')">📚 Resources</button>
    </div>`;
  return div;
}

/* ═══════════════════════════════════════════
   EXPLORE CAREERS
   ═══════════════════════════════════════════ */
async function loadCareers() {
  const el = document.getElementById('careers-list');
  el.innerHTML = `<div style="text-align:center;padding:3rem;grid-column:1/-1">
    <div class="spinner spinner-dark" style="width:36px;height:36px;border-width:3px;margin:auto"></div>
  </div>`;
  try {
    const data = await API.getCareers();
    el.innerHTML = '';
    data.careers.forEach(c => {
      const div      = document.createElement('div');
      div.className  = 'career-card';
      const safeName = c.career_name.replace(/'/g, "\\'");
      div.innerHTML  = `
        <div class="cc-header">
          <div><div class="cc-name">${c.career_name}</div><div class="cc-desc">${c.description}</div></div>
          <span class="demand demand-${c.demand.toLowerCase().replace(' ','-')}">${c.demand}</span>
        </div>
        <div style="font-size:12px;color:#6B7280;margin-bottom:10px">💰 ${c.salary_range}</div>
        <div style="margin-bottom:12px">
          <div style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Required skills</div>
          <div>${c.required_skills.slice(0,5).map(s=>`<span class="chip chip-blue">${s}</span>`).join('')}${c.required_skills.length>5?`<span class="chip">+${c.required_skills.length-5} more</span>`:''}</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;border-top:1px solid #E5E7EB;padding-top:12px">
          <button class="btn btn-primary btn-sm"   onclick="event.stopPropagation();loadRoadmapFor(${c.id},'${safeName}')">🗺️ Roadmap</button>
          <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();loadResourcesFor(${c.id},'${safeName}')">📚 Resources</button>
          <button class="btn btn-outline btn-sm"   onclick="event.stopPropagation();loadGapFor(${c.id})">📊 Skill gap</button>
        </div>`;
      el.appendChild(div);
    });
  } catch(err) { toast(err.message, 'error'); }
}

/* ═══════════════════════════════════════════
   MY PATH — auto-load top career
   ═══════════════════════════════════════════ */
async function loadTopGap() {
  try {
    const data = await API.recommend();
    const top  = data.recommendations[0];
    if (!top) {
      document.getElementById('gap-career-name').textContent = 'Skill Gap Analysis';
      document.getElementById('gap-your-skills').innerHTML   = '<span style="color:#9CA3AF">Complete your profile first</span>';
      document.getElementById('gap-required').innerHTML  = '';
      document.getElementById('gap-missing').innerHTML   = '';
      document.getElementById('gap-resources').innerHTML = '';
      return;
    }
    await fetchAndRenderGap(top.id);
  } catch(err) { console.error(err); }
}

async function loadTopRoadmap() {
  try {
    const data = await API.recommend();
    const top  = data.recommendations[0];
    if (!top) { toast('Complete your profile first', 'info'); return; }
    await fetchAndRenderRoadmap(top.id, top.career_name);
  } catch(err) { console.error(err); }
}

async function loadTopResources() {
  try {
    const data = await API.recommend();
    const top  = data.recommendations[0];
    if (!top) {
      document.getElementById('res-career-name').textContent = 'Learning Resources';
      document.getElementById('res-list').innerHTML = `<div class="empty-state">
        <div class="empty-icon">🎯</div><h3>Complete your profile first</h3>
        <button class="btn btn-primary" style="margin-top:12px" onclick="goTo('profile')">Set up profile</button>
      </div>`;
      return;
    }
    await fetchAndRenderResources(top.id, top.career_name);
  } catch(err) { console.error(err); }
}

/* ═══════════════════════════════════════════
   FETCH HELPERS — no goTo inside these
   ═══════════════════════════════════════════ */
async function fetchAndRenderGap(careerId) {
  const resEl = document.getElementById('gap-resources');
  resEl.innerHTML = '<div style="text-align:center;padding:1rem"><div class="spinner spinner-dark" style="width:24px;height:24px;border-width:2px;margin:auto"></div></div>';
  try {
    const d = await API.gap(careerId);
    document.getElementById('gap-career-name').textContent = d.career_name + ' — Skill Gap';
    document.getElementById('gap-pct').textContent         = Math.round(d.match_percent) + '%';
    const bar = document.getElementById('gap-bar');
    bar.style.width      = d.match_percent + '%';
    bar.style.background = d.match_percent >= 70 ? '#22C55E' : d.match_percent >= 40 ? '#F59E0B' : '#EF4444';
    document.getElementById('gap-your-skills').innerHTML =
      d.user_skills.length
        ? d.user_skills.map(s=>`<span class="chip chip-blue">${esc(s)}</span>`).join('')
        : '<span style="color:#9CA3AF">No skills added yet</span>';
    document.getElementById('gap-required').innerHTML =
      d.required_skills.map(s =>
        d.matched_skills.includes(s)
          ? `<span class="chip chip-green">✅ ${s}</span>`
          : `<span class="chip chip-red">❌ ${s}</span>`
      ).join('');
    document.getElementById('gap-missing').innerHTML =
      d.missing_skills.length
        ? d.missing_skills.map(s=>`<span class="chip chip-red">📌 ${s}</span>`).join('')
        : '<span class="chip chip-green">🎉 You have all required skills!</span>';
    resEl.innerHTML = '';
    if (d.gap_resources.length > 0) {
      renderResourcesGrouped(resEl, d.gap_resources);
    } else if (d.missing_skills.length === 0) {
      resEl.innerHTML = '<p style="color:#6B7280;padding:10px">🎉 All skills matched!</p>';
    } else {
      try {
        const allRes = await API.getResources(careerId);
        renderResourcesGrouped(resEl, allRes.resources);
      } catch(e) { resEl.innerHTML = '<p style="color:#6B7280">No resources found.</p>'; }
    }
  } catch(err) { toast(err.message, 'error'); }
}

async function fetchAndRenderRoadmap(careerId, careerName) {
  document.getElementById('rm-career-title').textContent = careerName + ' — Roadmap';
  document.getElementById('rm-career-sub').textContent   = 'Step-by-step path to become a ' + careerName;
  document.getElementById('rm-steps').innerHTML = '<div style="text-align:center;padding:2rem"><div class="spinner spinner-dark" style="width:30px;height:30px;border-width:3px;margin:auto"></div></div>';
  try {
    const d = await API.roadmap(careerId);
    document.getElementById('rm-total').textContent   = d.total_steps;
    document.getElementById('rm-done').textContent    = d.completed_steps;
    document.getElementById('rm-left').textContent    = d.total_steps - d.completed_steps;
    document.getElementById('rm-pct').textContent     = Math.round(d.progress_percent) + '%';
    document.getElementById('rm-pct-lbl').textContent = Math.round(d.progress_percent) + '% complete';
    document.getElementById('rm-pbar').style.width    = d.progress_percent + '%';
    const ul           = document.getElementById('rm-steps');
    ul.innerHTML       = '';
    const phases       = groupIntoPhases(d.roadmap);
    const nextIdx      = (d.roadmap.find(s => !s.completed) || {}).step_index;
    const phaseNames   = ['Foundations','Core Skills','Advanced','Capstone'];
    const phaseIcons   = ['🌱','⚙️','🚀','🏆'];
    const phaseClasses = ['phase-1','phase-2','phase-3','phase-4'];
    phases.forEach((phase, pi) => {
      const phDiv = document.createElement('div');
      phDiv.style.marginBottom = '18px';
      phDiv.innerHTML = `<div class="phase-label ${phaseClasses[pi]}">${phaseIcons[pi]} ${phaseNames[pi]}</div>
                         <div class="rm-timeline" id="phase-${pi}"></div>`;
      ul.appendChild(phDiv);
      const tl = document.getElementById('phase-' + pi);
      phase.forEach(item => tl.appendChild(buildRoadmapStep(item, careerId, nextIdx)));
    });
  } catch(err) { toast(err.message, 'error'); }
}

async function fetchAndRenderResources(careerId, careerName) {
  document.getElementById('res-career-name').textContent = careerName + ' — Learning Resources';
  const subEl = document.getElementById('res-career-sub');
  if (subEl) subEl.textContent = 'Theory → Videos → Courses → Practice';
  const el = document.getElementById('res-list');
  el.innerHTML = `<div style="text-align:center;padding:2rem">
    <div class="spinner spinner-dark" style="width:32px;height:32px;border-width:3px;margin:auto"></div>
  </div>`;
  try {
    const data = await API.getResources(careerId);
    el.innerHTML = '';
    if (!data.resources || data.resources.length === 0) {
      el.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><h3>No resources found</h3></div>';
      return;
    }
    renderResourcesGrouped(el, data.resources);
  } catch(err) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Failed to load</h3><p>${err.message}</p></div>`;
  }
}

/* ═══════════════════════════════════════════
   SKILL GAP
   ═══════════════════════════════════════════ */
async function loadGapFor(careerId) {
  goTo('gap');
  await fetchAndRenderGap(careerId);
}

/* ═══════════════════════════════════════════
   ROADMAP
   ═══════════════════════════════════════════ */
async function loadRoadmapFor(careerId, careerName) {
  goTo('roadmap');
  await fetchAndRenderRoadmap(careerId, careerName);
}

function groupIntoPhases(steps) {
  const size = Math.ceil(steps.length / 4);
  return [0,1,2,3].map(i => steps.slice(i*size,(i+1)*size)).filter(p => p.length > 0);
}

function buildRoadmapStep(item, careerId, nextIdx) {
  const statusClass = item.completed ? 'done' : item.step_index === nextIdx ? 'current' : 'pending';
  const badge = item.completed
    ? '<span class="rm-step-badge badge-done">Completed</span>'
    : item.step_index === nextIdx ? '<span class="rm-step-badge badge-current">In progress</span>' : '';
  const div = document.createElement('div');
  div.className = `rm-step ${statusClass}`;
  div.innerHTML = `
    <div class="rm-step-num">${item.completed ? '✓' : item.step_index + 1}</div>
    <div style="flex:1">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <div class="rm-step-text">${item.step}</div>${badge}
      </div>
    </div>
    <div class="rm-step-check">
      <input type="checkbox" ${item.completed?'checked':''}
        onchange="toggleStep(${careerId},${item.step_index},this.checked,this)">
    </div>`;
  return div;
}

async function toggleStep(careerId, stepIndex, completed, checkbox) {
  try {
    await API.updateProgress({ career_id: careerId, step_index: stepIndex, completed });
    toast(completed ? '🎉 Step completed!' : 'Step marked incomplete', completed ? 'success' : 'info');
    const title = document.getElementById('rm-career-title').textContent.replace(' — Roadmap','');
    await fetchAndRenderRoadmap(careerId, title);
  } catch(err) {
    toast(err.message, 'error');
    checkbox.checked = !completed;
  }
}

/* ═══════════════════════════════════════════
   RESOURCES
   ═══════════════════════════════════════════ */
async function loadResourcesFor(careerId, careerName) {
  goTo('resources');
  await fetchAndRenderResources(careerId, careerName);
}

const PLATFORM_ORDER  = ['W3Schools','GFG','YouTube','Coursera','Udemy','HackerRank','LeetCode','CodeChef','Kaggle','TryHackMe','HackTheBox','AWS','Other'];
const PLATFORM_COLORS = {
  'W3Schools':'#04AA6D','GFG':'#2F8D46','YouTube':'#CC0000','Coursera':'#0056D2',
  'Udemy':'#A435F0','HackerRank':'#2EC866','LeetCode':'#FFA116','CodeChef':'#5B4638',
  'Kaggle':'#20BEFF','TryHackMe':'#212C42','HackTheBox':'#9FEF00','AWS':'#FF9900','Other':'#6B7280'
};
const PLATFORM_LABELS = {
  'W3Schools':'📖 Theory — W3Schools','GFG':'📖 Theory — GeeksforGeeks',
  'YouTube':'🎥 Video Tutorials — YouTube','Coursera':'🎓 Courses — Coursera',
  'Udemy':'🎓 Courses — Udemy','HackerRank':'💻 Practice — HackerRank',
  'LeetCode':'💻 Practice — LeetCode','CodeChef':'💻 Practice — CodeChef',
  'Kaggle':'📊 Projects — Kaggle','TryHackMe':'🔐 Practice — TryHackMe',
  'HackTheBox':'🔐 Practice — HackTheBox','AWS':'☁️ Practice — AWS',
};

function renderResourcesGrouped(container, resources) {
  container.innerHTML = '';
  const grouped = {};
  resources.forEach(r => {
    const p = r.platform || 'Other';
    if (!grouped[p]) grouped[p] = [];
    grouped[p].push(r);
  });
  const ordered = PLATFORM_ORDER.filter(p => grouped[p]);
  Object.keys(grouped).forEach(p => { if (!ordered.includes(p)) ordered.push(p); });

  ordered.forEach((platform, idx) => {
    const color = PLATFORM_COLORS[platform] || '#6B7280';
    const label = PLATFORM_LABELS[platform]  || platform;

    // Section wrapper
    const sec = document.createElement('div');
    sec.style.cssText = 'margin-bottom:28px';

    // Platform header
    const header = document.createElement('div');
    header.style.cssText = `display:flex;align-items:center;gap:10px;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid ${color}`;
    header.innerHTML = `
      <span style="width:10px;height:10px;border-radius:50%;background:${color};display:inline-block;flex-shrink:0"></span>
      <span style="font-size:13px;font-weight:700;color:${color}">${label}</span>
      <span style="font-size:11px;color:var(--txt3);margin-left:auto;background:var(--bg3);padding:2px 8px;border-radius:99px;border:1px solid var(--border)">
        ${grouped[platform].length} resource${grouped[platform].length>1?'s':''}
      </span>`;
    sec.appendChild(header);

    // Grid — append cards directly
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px';
    grouped[platform].forEach(r => {
      const card = buildResourceCard(r);
      grid.appendChild(card);
    });
    sec.appendChild(grid);
    container.appendChild(sec);
  });
}


function buildResourceCard(r) {
  const color = PLATFORM_COLORS[r.platform] || '#6B7280';
  const div   = document.createElement('div');
  div.style.cssText = 'background:var(--bg2);border:1.5px solid var(--border);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:8px;transition:all .2s;box-shadow:0 2px 8px rgba(0,0,0,.06)';
  div.innerHTML = `
    <div style="font-size:10px;font-weight:700;color:${color};text-transform:uppercase;
                letter-spacing:.05em;padding:3px 8px;background:${color}20;
                border-radius:6px;width:fit-content">${r.platform}</div>
    <div class="res-title" style="color:var(--txt)">${r.title}</div>
    ${r.skill_name?`<div class="res-skill">📌 ${r.skill_name}</div>`:''}
    <div class="res-footer">
      <span class="chip ${r.is_free?'chip-green':'chip-amber'}" style="font-size:11px">
        ${r.is_free?'🆓 Free':'💳 Paid'}
      </span>
      <a href="${r.url}" target="_blank" class="btn btn-primary btn-sm">Open →</a>
    </div>`;
  return div;
}

function buildResourceCardHTML(r) {
  const color = PLATFORM_COLORS[r.platform] || '#6B7280';
  return `<div class="res-card">
    <div style="font-size:10px;font-weight:700;color:${color};text-transform:uppercase;
                letter-spacing:.05em;padding:3px 8px;background:${color}20;
                border-radius:6px;width:fit-content">${r.platform}</div>
    <div class="res-title" style="color:var(--txt)">${r.title}</div>
    ${r.skill_name?`<div class="res-skill">📌 ${r.skill_name}</div>`:''}
    <div class="res-footer">
      <span class="chip ${r.is_free?'chip-green':'chip-amber'}" style="font-size:11px">
        ${r.is_free?'🆓 Free':'💳 Paid'}
      </span>
      <a href="${r.url}" target="_blank" class="btn btn-primary btn-sm">Open →</a>
    </div>
  </div>`;
}

/* ═══════════════════════════════════════════
   STUDY PLAN
   ═══════════════════════════════════════════ */
async function showStudyPlan() {
  goTo('resources');
  document.getElementById('res-career-name').textContent = '🎯 Personalized Study Plan';
  const subEl = document.getElementById('res-career-sub');
  if (subEl) subEl.textContent = 'Step 1: Missing skills → Step 2: Practice → Step 3: All resources';
  const el = document.getElementById('res-list');
  el.innerHTML = `<div style="text-align:center;padding:3rem">
    <div class="spinner spinner-dark" style="width:36px;height:36px;border-width:3px;margin:auto"></div>
  </div>`;
  try {
    const recData = await API.recommend();
    const top     = recData.recommendations[0];
    if (!top) {
      el.innerHTML = `<div class="empty-state">
        <div class="empty-icon">🎯</div><h3>Complete your profile first</h3>
        <button class="btn btn-primary" style="margin-top:12px" onclick="goTo('profile')">Set up profile</button>
      </div>`;
      return;
    }
    const gapData = await API.gap(top.id);
    const resData = await API.getResources(top.id);
    el.innerHTML  = `
      <div style="background:linear-gradient(135deg,#1E3A8A,#6D28D9);border-radius:14px;padding:20px;color:#fff;margin-bottom:24px">
        <div style="font-size:17px;font-weight:700;margin-bottom:6px">🎯 Personalized Study Plan</div>
        <div style="font-size:13px;opacity:.85">Top career: <strong>${top.career_name}</strong> — ${Math.round(top.match_percent)}% match</div>
        <div style="display:flex;gap:24px;margin-top:14px">
          <div><div style="font-size:22px;font-weight:700">${gapData.matched_skills.length}</div><div style="font-size:11px;opacity:.7">Skills you have ✅</div></div>
          <div style="width:1px;background:rgba(255,255,255,.2)"></div>
          <div><div style="font-size:22px;font-weight:700">${gapData.missing_skills.length}</div><div style="font-size:11px;opacity:.7">Skills to learn 📌</div></div>
          <div style="width:1px;background:rgba(255,255,255,.2)"></div>
          <div><div style="font-size:22px;font-weight:700">${resData.resources.length}</div><div style="font-size:11px;opacity:.7">Resources 📚</div></div>
        </div>
      </div>`;

    if (gapData.missing_skills.length > 0) {
      const missingRes = resData.resources.filter(r =>
        gapData.missing_skills.some(ms =>
          ms.toLowerCase().includes((r.skill_name||'').toLowerCase()) ||
          (r.skill_name||'').toLowerCase().includes(ms.toLowerCase())
        )
      );
      const step1 = document.createElement('div');
      step1.className = 'card'; step1.style.marginBottom = '20px';
      step1.innerHTML = `
        <div class="card-title">📌 Step 1 — Learn these missing skills first</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">
          ${gapData.missing_skills.map(s=>`<span class="chip chip-red">${s}</span>`).join('')}
        </div>
        ${missingRes.length?`<div style="font-size:12px;font-weight:700;color:#6B7280;text-transform:uppercase;margin-bottom:10px">Resources for missing skills</div><div class="res-grid">${missingRes.map(r=>buildResourceCardHTML(r)).join('')}</div>`:''}`;
      el.appendChild(step1);
    }

    const step2 = document.createElement('div');
    step2.className = 'card'; step2.style.marginBottom = '20px';
    step2.innerHTML = `
      <div class="card-title">💻 Step 2 — Practice coding every day</div>
      <div class="res-grid">
        <div class="res-card"><div style="font-size:10px;font-weight:700;color:#FFA116;padding:3px 8px;background:#FFA11620;border-radius:6px;width:fit-content">LeetCode</div><div class="res-title">DSA Practice Problems</div><div class="res-skill">📌 Algorithms & Data Structures</div><div class="res-footer"><span class="chip chip-green">🆓 Free</span><a href="https://leetcode.com/problemset/" target="_blank" class="btn btn-primary btn-sm">Open →</a></div></div>
        <div class="res-card"><div style="font-size:10px;font-weight:700;color:#2EC866;padding:3px 8px;background:#2EC86620;border-radius:6px;width:fit-content">HackerRank</div><div class="res-title">Coding Practice & Certifications</div><div class="res-skill">📌 Problem Solving</div><div class="res-footer"><span class="chip chip-green">🆓 Free</span><a href="https://www.hackerrank.com/dashboard" target="_blank" class="btn btn-primary btn-sm">Open →</a></div></div>
        <div class="res-card"><div style="font-size:10px;font-weight:700;color:#5B4638;padding:3px 8px;background:#5B463820;border-radius:6px;width:fit-content">CodeChef</div><div class="res-title">Competitive Programming</div><div class="res-skill">📌 Contests & Practice</div><div class="res-footer"><span class="chip chip-green">🆓 Free</span><a href="https://www.codechef.com/practice" target="_blank" class="btn btn-primary btn-sm">Open →</a></div></div>
        <div class="res-card"><div style="font-size:10px;font-weight:700;color:#2F8D46;padding:3px 8px;background:#2F8D4620;border-radius:6px;width:fit-content">GFG</div><div class="res-title">Interview Preparation DSA</div><div class="res-skill">📌 DSA + Interview Questions</div><div class="res-footer"><span class="chip chip-green">🆓 Free</span><a href="https://www.geeksforgeeks.org/dsa-tutorial/" target="_blank" class="btn btn-primary btn-sm">Open →</a></div></div>
      </div>`;
    el.appendChild(step2);

    const step3 = document.createElement('div');
    step3.className = 'card';
    step3.innerHTML = `<div class="card-title">📚 Step 3 — All resources for ${top.career_name}</div><div id="study-all-res"></div>`;
    el.appendChild(step3);
    const grid = document.getElementById('study-all-res');
    if (grid) renderResourcesGrouped(grid, resData.resources);

  } catch(err) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Failed to load</h3><p>${err.message}</p></div>`;
    toast(err.message, 'error');
  }
}

/* ═══════════════════════════════════════════
   PROGRESS TRACKER
   ═══════════════════════════════════════════ */
async function loadProgress() {
  const listEl = document.getElementById('pg-career-list');
  listEl.innerHTML = `<div style="text-align:center;padding:2rem">
    <div class="spinner spinner-dark" style="width:32px;height:32px;border-width:3px;margin:auto"></div>
  </div>`;
  try {
    const careersData     = await API.getCareers();
    const careers         = careersData.careers;
    const progressResults = await Promise.all(careers.map(c => API.roadmap(c.id).catch(() => null)));

    let totalDone = 0, totalSteps = 0, activeCareers = 0, completedCount = 0;
    const started = [];

    careers.forEach((career, i) => {
      const prog = progressResults[i];
      if (!prog) return;
      const done = prog.completed_steps;
      const total = prog.total_steps;
      const pct  = Math.round(prog.progress_percent);
      totalDone  += done; totalSteps += total;
      if (pct === 100) completedCount++;
      if (done > 0) { activeCareers++; started.push({ career, prog, done, total, pct }); }
    });

    listEl.innerHTML = '';
    if (!started.length) {
      listEl.innerHTML = `<div class="empty-state">
        <div class="empty-icon">🗺️</div><h3>No roadmaps started yet</h3>
        <p>Click "Roadmap" on any career to start your learning journey.</p>
        <button class="btn btn-primary" style="margin-top:12px" onclick="goTo('recommend')">View recommendations</button>
      </div>`;
    } else {
      started.forEach(({ career, prog, done, total, pct }, idx) => {
        const color    = pct === 100 ? '#22C55E' : pct >= 50 ? '#3B82F6' : '#F59E0B';
        const badge    = pct === 100
          ? '<span style="background:#DCFCE7;color:#166534;font-size:11px;font-weight:700;padding:4px 12px;border-radius:99px">🏆 Completed</span>'
          : '<span style="background:#DBEAFE;color:#1D4ED8;font-size:11px;font-weight:700;padding:4px 12px;border-radius:99px">⚡ In progress</span>';
        const nextStep = prog.roadmap.find(s => !s.completed);
        const safeName = career.career_name.replace(/'/g, "\\'");
        const card     = document.createElement('div');
        card.style.cssText = `background:var(--bg2);border:1.5px solid var(--border);border-radius:16px;padding:20px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,.06)`;
        card.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px">
            <div style="display:flex;align-items:center;gap:10px">
              <div style="font-size:15px;font-weight:700;color:var(--txt)">${career.career_name}</div>
              ${badge}
            </div>
            <div style="display:flex;align-items:center;gap:12px">
              <div style="text-align:right">
                <div style="font-size:22px;font-weight:800;color:${color}">${pct}%</div>
                <div style="font-size:11px;color:var(--txt3)">${done} of ${total} steps done</div>
              </div>
              <button class="btn btn-primary btn-sm" onclick="loadRoadmapFor(${career.id},'${safeName}')">
                ${pct===100?'Review →':'Continue →'}
              </button>
            </div>
          </div>
          <div style="height:10px;background:var(--bg3);border-radius:99px;overflow:hidden;margin-bottom:10px">
            <div style="height:100%;width:${pct}%;background:${color};border-radius:99px;transition:width .6s"></div>
          </div>
          ${nextStep?`<div style="font-size:12px;color:var(--txt3);display:flex;align-items:center;gap:6px;padding:8px 12px;background:var(--bg3);border-radius:8px;border:1px solid var(--border)">▶ Next: ${nextStep.step}</div>`:''}`;
        listEl.appendChild(card);
      });
    }

    const overallPct = totalSteps > 0 ? Math.round((totalDone/totalSteps)*100) : 0;
    document.getElementById('pg-total-done').textContent        = totalDone;
    document.getElementById('pg-total-pct').textContent         = overallPct + '%';
    document.getElementById('pg-active-careers').textContent    = activeCareers;
    document.getElementById('pg-completed-careers').textContent = completedCount;

  } catch(err) {
    listEl.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Failed to load</h3><p>${err.message}</p></div>`;
  }
}

/* ═══════════════════════════════════════════
   CHATBOT
   ═══════════════════════════════════════════ */
let chatbotReady = false;

const chatResponses = {
  /* ── Greetings ─────────────────────────── */
  'hello':      'Hi! 👋 I am your Career Assistant. Ask me about careers, skills, companies, DSA, placement or college tips!',
  'hi':         'Hello! 😊 How can I help you today? Ask me about careers, skills, companies or interview tips.',
  'hey':        'Hey there! 👋 What would you like to know about your career journey?',
  'help':       'I can help you with:\n• Career recommendations and paths\n• Skill gap analysis\n• Learning roadmaps\n• Company-specific placement tips\n• DSA and interview preparation\n• Resources and certifications\n• College and CGPA guidance\n• Internships and projects',
  'thanks':     'You are welcome! 😊 All the best for your career journey!',
  'thank you':  'Happy to help! 🎉 Keep learning and growing!',
  'bye':        'Goodbye! 👋 Best of luck with your career!',

  /* ── Career Paths ───────────────────────── */
  'career':     'We have 7 career paths:\n🌐 Web Developer\n🐍 Python Developer\n🤖 AI/ML Engineer\n📊 Data Analyst\n🔐 Cybersecurity Analyst\n☁️ Cloud Engineer\n⚙️ DevOps Engineer\n\nAsk me about any specific career for details!',
  'web':        '🌐 Web Developer\nSkills: HTML, CSS, JavaScript, React, Node.js, Git, REST API\nSalary: 4-18 LPA | Demand: High\nBest for: Students who like building websites\nCompanies: TCS, Infosys, Wipro, startups\nStart: W3Schools HTML → CSS → JavaScript → React',
  'python':     '🐍 Python Developer\nSkills: Python, OOP, Flask, Django, SQL, Git, REST API\nSalary: 5-20 LPA | Demand: High\nBest for: Backend development lovers\nCompanies: Amazon, Flipkart, startups\nStart: Python basics → OOP → Flask → Django → SQL',
  'ai':         '🤖 AI/ML Engineer\nSkills: Python, Machine Learning, Deep Learning, Pandas, NumPy, TensorFlow, Statistics\nSalary: 8-25 LPA | Demand: Very High\nBest for: Students interested in artificial intelligence\nCompanies: Google, Microsoft, Amazon, research labs\nStart: Python → Statistics → ML → Deep Learning',
  'ml':         '🤖 Machine Learning path:\nStep 1: Python + NumPy/Pandas\nStep 2: Statistics and Mathematics\nStep 3: ML algorithms (scikit-learn)\nStep 4: Deep Learning (TensorFlow)\nStep 5: Kaggle projects\nSalary: 8-25 LPA | Very high demand!',
  'machine':    '🤖 Machine Learning needs Python, Statistics, scikit-learn, TensorFlow and Pandas. Start with Andrew Ng course on Coursera. Salary: 8-25 LPA.',
  'artificial': '🤖 Artificial Intelligence career needs Python, Machine Learning, Deep Learning and Statistics. Very high demand in 2026. Salary: 8-25 LPA.',
  'data':       '📊 Data Analyst\nSkills: Python, SQL, Excel, Tableau, Power BI, Statistics\nSalary: 4-15 LPA | Demand: High\nBest for: Students who like numbers and insights\nCompanies: TCS, Accenture, consulting firms\nStart: Excel → SQL → Python → Tableau/Power BI',
  'cyber':      '🔐 Cybersecurity Analyst\nSkills: Networking, Linux, Python, Ethical Hacking, Kali Linux\nSalary: 6-22 LPA | Demand: Very High\nCertifications: CEH, CompTIA Security+, OSCP\nPlatforms: TryHackMe, HackTheBox\nStart: Networking basics → Linux → Python → Ethical Hacking',
  'cloud':      '☁️ Cloud Engineer\nSkills: AWS, Azure, Docker, Kubernetes, Linux, Terraform\nSalary: 8-30 LPA | Demand: Very High\nCertification: AWS Cloud Practitioner → AWS Solutions Architect\nStart: Linux → AWS Free Tier → Docker → Kubernetes',
  'devops':     '⚙️ DevOps Engineer\nSkills: Linux, Git, Docker, Jenkins, CI/CD, AWS, Kubernetes\nSalary: 7-28 LPA | Demand: Very High\nBest for: Students who like automation and deployment\nStart: Linux → Git → Docker → Jenkins → AWS',

  /* ── Skills ─────────────────────────────── */
  'skill':      'Go to My Profile → add your skills → click Save.\nThe system will automatically:\n✅ Match you with best careers\n✅ Show your skill gap\n✅ Generate learning roadmap\n✅ Suggest resources for missing skills',
  'html':       '📖 HTML is the foundation of web development.\nLearn on: W3Schools, MDN docs\nTime: 1 week for basics\nTopics: tags, forms, tables, semantic HTML\nCombine with CSS and JavaScript for frontend skills.',
  'css':        '🎨 CSS makes websites look beautiful.\nMust learn: Flexbox, Grid, Responsive design\nLearn on: W3Schools, CSS-Tricks, YouTube\nTime: 2-3 weeks\nTip: Practice by cloning website designs.',
  'javascript': '⚡ JavaScript is essential for web development.\nTopics: variables, functions, arrays, DOM, promises, async/await\nPractice on: HackerRank, JavaScript30 challenge\nTime: 2-3 months\nTip: Build small projects while learning.',
  'react':      '⚛️ React is the most popular frontend framework.\nPrerequisites: HTML, CSS, JavaScript basics\nTopics: components, props, state, hooks, React Router\nLearn on: official docs, Traversy Media YouTube\nSalary boost: +20-30% compared to basic web dev.',
  'node':       '🟢 Node.js is for backend web development.\nTopics: Express.js, REST APIs, authentication, database\nCombined with React = Full Stack Developer (MERN stack)\nSalary: 6-20 LPA',
  'sql':        '🗄️ SQL is essential for almost all tech careers.\nTopics: SELECT, INSERT, UPDATE, DELETE, JOIN, GROUP BY\nPractice on: HackerRank SQL section, SQLZoo\nTime: 2-3 weeks\nUsed in: Data Analyst, Python Dev, Web Dev careers.',
  'git':        '📦 Git is essential for every developer.\nLearn: init, add, commit, push, pull, branch, merge\nUse GitHub to store projects\nTime: 1 week\nEvery company expects Git knowledge. Learn it early!',
  'dsa':        '🧮 DSA is critical for tech interviews.\nTopics: Arrays, Strings, Linked List, Stack, Queue, Trees, Graphs, DP\nPlatforms: LeetCode, HackerRank, GFG\nStrategy:\n• Week 1-2: Arrays and Strings\n• Week 3-4: Linked List, Stack, Queue\n• Week 5-6: Trees and Graphs\n• Week 7-8: DP and backtracking\nSolve 150+ problems before interviews.',
  'docker':     '🐳 Docker is used for containerization.\nImportant for: Cloud and DevOps careers\nLearn: images, containers, Dockerfile, docker-compose\nFree: Docker Desktop on Windows/Mac.',
  'aws':        '☁️ AWS is the most popular cloud platform.\nFree tier available for practice!\nStart with: EC2, S3, RDS, Lambda, IAM\nCertification: AWS Cloud Practitioner (best for freshers)\nSalary: 8-30 LPA for cloud engineers.',
  'linux':      '🐧 Linux is essential for Cloud, DevOps and Cybersecurity.\nLearn: basic commands, file system, permissions, bash scripting\nPractice on: Ubuntu (free), WSL on Windows\nTime: 2-3 weeks for basics.\nUse: https://linuxjourney.com (free)',
  'tensorflow': '🧠 TensorFlow is for Deep Learning.\nPrerequisite: Python, NumPy, basic ML\nLearn on: Coursera (free audit), TensorFlow official docs\nAlternative: PyTorch (also popular)',
  'pandas':     '🐼 Pandas is for data analysis in Python.\nEssential for: Data Analyst and AI/ML careers\nLearn: DataFrames, read_csv, groupby, merge, plot\nPractice on: Kaggle notebooks (free)',

  /* ── Companies ──────────────────────────── */
  'placement':  'Placement Preparation:\n💻 Coding: LeetCode, HackerRank, CodeChef\n🏢 Companies: Google, Microsoft, Amazon, TCS, Infosys, Wipro\n📝 Interview: Technical + HR rounds\n📄 Resume: 1 page, GitHub link, projects\n🎤 Mock: Pramp, Interviewing.io\nGo to Placement Prep in sidebar!',
  'google':     '🔵 Google Interview:\nRounds: 4-5 rounds (phone screen + onsite)\nFocus: DSA (Hard level), System Design, Behavioral\nSalary: 20-80 LPA for freshers\nPrep: LeetCode Hard problems, System Design primer\nTip: Practice 300+ LeetCode problems. Focus on Trees, DP, Graphs.',
  'microsoft':  '🔷 Microsoft Interview:\nRounds: 3-4 rounds\nFocus: DSA (Medium-Hard), OOP, Behavioral\nSalary: 15-45 LPA for freshers\nPrep: LeetCode Medium, SOLID principles\nTip: Strong OOP knowledge is must. Research Microsoft products.',
  'amazon':     '🟠 Amazon Interview:\nRounds: 5-6 rounds\nFocus: DSA + 14 Leadership Principles (VERY important!)\nSalary: 15-50 LPA for freshers\nPrep: LeetCode Medium, Leadership Principles STAR stories\nTip: Prepare STAR stories for every Leadership Principle!',
  'tcs':        '🟠 TCS NQT Process:\nRounds: Online NQT → Technical HR → HR\nTopics: Aptitude, Verbal, Reasoning, Coding (2 questions)\nSalary: 3.36-7 LPA\nPrep: TCS NQT previous papers on GFG, PrepInsta\nTip: Score 70%+ in NQT to get shortlisted for higher packages.',
  'infosys':    '🔵 Infosys Interview:\nRounds: InfyTQ Test → Technical → HR\nTopics: Aptitude, Puzzle, Coding, Technical HR\nSalary: 3.6-8 LPA\nPrep: InfyTQ certification (free!), HackerRank practice\nTip: Get InfyTQ certified before applying — increases chances!',
  'wipro':      '🟣 Wipro Interview:\nRounds: NLTH Online Test → Technical → HR\nTopics: Aptitude, Written Communication, Coding\nSalary: 3.5-6.5 LPA\nPrep: Previous NLTH papers, basic coding practice\nTip: Written communication section is important!',
  'accenture':  '🟢 Accenture Interview:\nRounds: Cognitive Test → Coding Test → HR\nTopics: Aptitude, Logical Reasoning, Coding basics\nSalary: 4.5-8 LPA\nPrep: IndiaBix aptitude, HackerRank easy problems\nTip: Focus on aptitude — coding is easy (basic level).',
  'cognizant':  '🔵 Cognizant (CTS) Interview:\nRounds: GenC Test → Technical → HR\nTopics: Aptitude, Verbal, Coding\nSalary: 4-7 LPA\nPrep: GenC Elevate certification helps a lot\nTip: Apply through campus placement — easier than off-campus.',

  /* ── Interview Tips ─────────────────────── */
  'interview':  'Interview Tips:\n\n🧠 Technical Round:\n✅ Practice 2-3 LeetCode problems daily\n✅ Focus on Arrays, Strings, Trees, DP, Graphs\n✅ Learn time and space complexity\n✅ Always explain approach before coding\n\n🎤 HR Round:\n✅ Prepare "Tell me about yourself" — 2 mins\n✅ Use STAR method for behavioral questions\n✅ Research the company before interview\n\n📄 Resume:\n✅ Keep to 1 page only\n✅ Add GitHub and project links',
  'resume':     '📄 Resume Tips for B.Tech Students:\n✅ Keep to 1 page only\n✅ Add GitHub profile link\n✅ Add LinkedIn profile\n✅ List 2-3 good projects with tech stack\n✅ Quantify: "Reduced load time by 40%"\n✅ Use action verbs: Built, Designed, Implemented\n✅ Add certifications\n✅ No spelling mistakes — use Grammarly\nBuild resume on: Resume.io, Novoresume',
  'hr':         '🎤 HR Round Tips:\n✅ Prepare "Tell me about yourself" — 2 minutes\n✅ Why do you want to join this company?\n✅ Where do you see yourself in 5 years?\n✅ What are your strengths and weaknesses?\n✅ Use STAR method\n✅ Ask good questions at end of interview\nTip: Research company news and products before interview.',
  'star':       '⭐ STAR Method for HR interviews:\nS — Situation: Describe the context\nT — Task: What was your responsibility?\nA — Action: What steps did you take?\nR — Result: What was the outcome?\n\nExample: "During my project (S), I had to fix a critical bug (T). I debugged the code (A). The app performance improved by 30% (R)."',
  'aptitude':   '🧮 Aptitude Preparation:\nTopics: Number systems, Percentages, Time and Work, Probability, Logical Reasoning, Verbal\nPractice on: IndiaBix, PrepInsta, GeeksforGeeks\nTip: Solve 20 aptitude questions daily for 1 month\nMost company tests are 60-90 minutes online.',

  /* ── Resources ──────────────────────────── */
  'resource':   'Learning Resources available:\n📖 Theory: W3Schools, GeeksforGeeks\n🎥 Videos: YouTube free courses\n🎓 Courses: Coursera, Udemy\n💻 Practice: LeetCode, HackerRank, CodeChef\n📊 Projects: Kaggle\nGo to Resources in sidebar to see all!',
  'roadmap':    'Click Roadmap on any career card in Recommendations.\nYou will see 4 phases:\n🌱 Foundations — Core basics\n⚙️ Core Skills — Main technical skills\n🚀 Advanced — Projects and advanced topics\n🏆 Capstone — Interview preparation\nMark each step complete using the checkbox!',
  'coursera':   '🎓 Best Coursera Courses (free audit):\n• ML by Andrew Ng — most popular ever\n• Google Data Analytics\n• IBM Data Science\n• Meta Frontend Developer\n• Google Cybersecurity\nTip: Audit for free — only pay if you need certificate.',
  'udemy':      '🎓 Best Udemy Courses:\n• The Web Developer Bootcamp (Colt Steele)\n• Python Bootcamp (Jose Portilla)\n• React — The Complete Guide\n• AWS Certified Solutions Architect\nTip: Never pay full price — wait for sale (Rs.399-Rs.599).',
  'youtube':    '🎥 Best YouTube channels:\n• Traversy Media — Web Dev\n• Corey Schafer — Python\n• Sentdex — ML/AI\n• TechWorld with Nana — DevOps\n• NetworkChuck — Cybersecurity\n• CodeWithHarry — Hindi tutorials\n• Apna College — DSA in Hindi',
  'leetcode':   '💻 LeetCode Tips:\n✅ Start with Easy problems (first 2 weeks)\n✅ Then move to Medium (most important)\n✅ Focus: Arrays, Strings, Trees, DP, Graphs\n✅ Solve 150+ problems before interviews\n✅ Practice company-specific problems\n✅ Use Discussion section to learn better solutions',
  'hackerrank': '💻 HackerRank Tips:\n✅ Complete Python domain first\n✅ SQL domain is very useful\n✅ Get Problem Solving certification\n✅ Many companies use HackerRank for screening\n✅ Practice 30 Days of Code challenge',
  'kaggle':     '📊 Kaggle Tips for AI/ML students:\n✅ Complete Kaggle Learn courses (free)\n✅ Participate in competitions\n✅ Build portfolio with notebooks\n✅ Kaggle profile impresses ML interviewers',
  'certificate':'🏆 Best Certifications for B.Tech students:\n• AWS Cloud Practitioner — Cloud career\n• Google Data Analytics — Data career\n• Meta Frontend Developer — Web career\n• HackerRank Python — Python career\n• Cisco CCNA — Networking/Cyber career\n• TCS NQT Certification — TCS placements\nAll on Coursera or official sites.',

  /* ── College & Career Guidance ──────────── */
  'cgpa':       '📊 CGPA Requirements:\n• TCS, Infosys, Wipro: 60% or 6.0 CGPA\n• Accenture, Cognizant: 60% or 6.0 CGPA\n• Amazon, Microsoft: No strict cutoff (skills matter)\n• Google: No strict cutoff (but 7+ helps)\nTip: Focus on skills and projects if CGPA is low. Many companies care more about coding skills.',
  'backlog':    '📚 Backlog Impact:\n• TCS, Infosys: No active backlogs allowed\n• Wipro: No active backlogs\n• Some companies: Max 1-2 backlogs allowed\n• Startups: Usually flexible\nTip: Clear all backlogs before placement season.',
  'college':    '🏫 College Tips:\n✅ Build 2-3 good projects\n✅ Contribute to GitHub regularly\n✅ Participate in hackathons\n✅ Get internships in 2nd/3rd year\n✅ Join coding clubs\n✅ Build LinkedIn profile from 2nd year\n✅ Attend placement training seriously',
  'internship': '💼 Internship Tips:\n✅ Apply from 2nd year itself\n✅ Platforms: Internshala, LinkedIn, Naukri\n✅ Build mini projects to show portfolio\n✅ Even 1-2 month internship adds great resume value\n✅ Many internships convert to full-time offers',
  'project':    '🏗️ Project Tips for Resume:\n✅ Build 2-3 full-stack projects\n✅ Host on GitHub with good README\n✅ Deploy on Netlify, Vercel or Heroku\n✅ Use real APIs and databases\n✅ Add features: login, dashboard, charts\nIdeas: Todo app, E-commerce, Blog, Portfolio, Chat app',
  'hackathon':  '🏆 Hackathon Tips:\n✅ Participate in Smart India Hackathon, HackWithInfy\n✅ Build MVP in 24-48 hours\n✅ Focus on problem statement, not just tech\n✅ Team of 4 works best\n✅ Check Devfolio and Unstop for hackathons',
  'linkedin':   '💼 LinkedIn Tips:\n✅ Create profile from 2nd year\n✅ Add skills, projects and certifications\n✅ Connect with seniors and recruiters\n✅ Post about your projects and learning\n✅ Follow companies you want to join\n✅ Use "Open to Work" feature',

  /* ── App Specific ───────────────────────── */
  'recommend':  'Go to Recommendations in sidebar to see all 7 careers ranked by match %. Add more skills in My Profile to improve your match scores!',
  'profile':    'Go to My Profile → fill branch, year, CGPA, interests → add skills using quick add buttons → click Save. The more skills you add the better your recommendations!',
  'gap':        'Go to Skill Gap in sidebar to see:\n✅ Skills you already have (green)\n❌ Skills you are missing (red)\n📚 Resources for each missing skill',
  'progress':   'Go to Progress Tracker to see:\n• Which roadmaps you started\n• % completion for each career\n• Your next step to complete\nMark steps as done in the Roadmap section!',
  'setting':    'Go to Settings in sidebar to:\n• Toggle dark/light mode\n• Edit your profile\n• Sign out of the app',
  'dark':       'Go to Settings → toggle the Dark Mode switch. Your preference is saved automatically!',
  'salary':     'Salary ranges in India 2026 (freshers):\n🌐 Web Developer: 4-18 LPA\n🐍 Python Developer: 5-20 LPA\n🤖 AI/ML Engineer: 8-25 LPA\n📊 Data Analyst: 4-15 LPA\n🔐 Cybersecurity: 6-22 LPA\n☁️ Cloud Engineer: 8-30 LPA\n⚙️ DevOps Engineer: 7-28 LPA\nSkills and projects help get higher packages!',
}

function getQuickReplies() {
  return ['Career options 💼', 'Interview tips 🎯', 'Salary info 💰', 'TCS placement 🟠', 'Google interview 🔵', 'DSA tips 🧮', 'Resume tips 📄', 'Internship tips 💼'];
}

function appendMsg(text, sender) {
  const msgs   = document.getElementById('chatbot-messages');
  const wrap   = document.createElement('div');
  wrap.style.cssText = `display:flex;flex-direction:column;align-items:${sender==='user'?'flex-end':'flex-start'}`;
  const bubble = document.createElement('div');
  bubble.style.cssText = `max-width:75%;padding:12px 16px;border-radius:${sender==='user'?'16px 16px 4px 16px':'16px 16px 16px 4px'};font-size:13px;line-height:1.6;${sender==='user'?'background:linear-gradient(135deg,#3B82F6,#1D4ED8);color:#fff':'background:#fff;color:#111827;border:1px solid #E5E7EB'}`;
  bubble.innerHTML = text.replace(/\n/g,'<br>');
  const meta = document.createElement('div');
  meta.style.cssText = `font-size:10px;color:#9CA3AF;margin-top:4px;text-align:${sender==='user'?'right':'left'}`;
  meta.textContent = sender === 'user' ? 'You' : '🤖 Career Assistant';
  wrap.appendChild(bubble);
  wrap.appendChild(meta);
  msgs.appendChild(wrap);
  msgs.scrollTop = msgs.scrollHeight;
}

function showTyping() {
  const msgs = document.getElementById('chatbot-messages');
  const div  = document.createElement('div');
  div.id = 'typing';
  div.style.cssText = 'display:flex;align-items:center;gap:4px;padding:10px 14px;background:#fff;border:1px solid #E5E7EB;border-radius:16px 16px 16px 4px;width:fit-content';
  div.innerHTML = `<span style="width:7px;height:7px;border-radius:50%;background:#9CA3AF;animation:bounce .8s infinite"></span>
    <span style="width:7px;height:7px;border-radius:50%;background:#9CA3AF;animation:bounce .8s .15s infinite"></span>
    <span style="width:7px;height:7px;border-radius:50%;background:#9CA3AF;animation:bounce .8s .3s infinite"></span>
    <style>@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}</style>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function hideTyping() {
  const el = document.getElementById('typing');
  if (el) el.remove();
}

function getBotResponse(input) {
  const lower = input.toLowerCase();
  let best = null;
  for (const [key, response] of Object.entries(chatResponses)) {
    // short keys (hi, ai, hr, ml...) must be whole words; longer ones match word starts
    const re = new RegExp('\\b' + key + (key.length <= 3 ? '\\b' : ''));
    const m  = re.exec(lower);
    if (!m) continue;
    if (!best || m.index < best.index || (m.index === best.index && key.length > best.len)) {
      best = { index: m.index, len: key.length, response };
    }
  }
  if (best) return best.response;
  return `I'm not sure about that, but I can help you with:\n• Career recommendations\n• Skill gap analysis\n• Learning roadmaps\n• Placement preparation\n\nTry asking about a career like "web developer" or "machine learning"!`;
}

function showQuickReplies() {
  const wrap = document.getElementById('quick-replies-wrap');
  if (!wrap) return;
  wrap.innerHTML = '';
  getQuickReplies().forEach(qr => {
    const btn = document.createElement('button');
    btn.style.cssText = 'padding:7px 14px;border-radius:99px;border:1.5px solid #3B82F6;background:#EFF6FF;color:#1D4ED8;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s';
    btn.textContent = qr;
    btn.onmouseover = () => { btn.style.background='#3B82F6'; btn.style.color='#fff'; };
    btn.onmouseout  = () => { btn.style.background='#EFF6FF'; btn.style.color='#1D4ED8'; };
    btn.onclick = () => {
      wrap.innerHTML = '';
      document.getElementById('chatbot-input').value = qr;
      sendChatMessage();
    };
    wrap.appendChild(btn);
  });
}

async function sendChatMessage() {
  const input = document.getElementById('chatbot-input');
  const msg   = input.value.trim();
  if (!msg) return;
  input.value = '';
  document.getElementById('quick-replies-wrap').innerHTML = '';

  appendMsg(msg, 'user');
  showTyping();

  await new Promise(r => setTimeout(r, 700 + Math.random()*400));
  hideTyping();

  const response = getBotResponse(msg);
  appendMsg(response, 'bot');
  showQuickReplies();
}

function initChatbot() {
  const msgs = document.getElementById('chatbot-messages');
  if (!msgs) return;
  if (chatbotReady) return; // don't re-init
  chatbotReady = true;
  msgs.innerHTML = '';
  const name = user?.name?.split(' ')[0] || 'there';
  appendMsg(`Hi ${name}! 👋 I am your Career Assistant.\n\nI can help you with career guidance, skill advice, roadmap tips and learning resources.\n\nWhat would you like to know?`, 'bot');
  showQuickReplies();
}

// chatbot input enter key
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.activeElement.id === 'chatbot-input') {
    e.preventDefault();
    sendChatMessage();
  }
});

/* ── Init ─────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initSettings();
  goTo('dashboard');
});