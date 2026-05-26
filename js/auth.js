// ── FinancialFreedom Auth System ──

const AUTH_KEY = 'ff_auth';

function getAuth() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); }
  catch(e) { return null; }
}

function saveAuth(data) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
}

function isFirstTime() {
  return getAuth() === null;
}

function isLoggedIn() {
  return sessionStorage.getItem('ff_logged_in') === '1';
}

function setLoggedIn() {
  sessionStorage.setItem('ff_logged_in', '1');
}

function logout() {
  sessionStorage.removeItem('ff_logged_in');
  window.location.href = 'splash.html';
}

function simpleHash(str) {
  // Simple hash - cukup untuk localStorage app
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}
