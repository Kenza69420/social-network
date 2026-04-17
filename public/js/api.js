const API = "http://localhost:3000/api";

function getToken() {
  return localStorage.getItem("token");
}

function getUser() {
  const u = localStorage.getItem("user");
  return u ? JSON.parse(u) : null;
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = "/";
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/";
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = "Bearer " + token;

  const res = await fetch(API + path, { ...options, headers });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("cs-CZ") + " " + d.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
}

function avatarSrc(url) {
  return url || "https://ui-avatars.com/api/?background=7c6cfc&color=fff&name=U";
}

function avatarSrcName(url, name) {
  return url || `https://ui-avatars.com/api/?background=7c6cfc&color=fff&name=${encodeURIComponent(name)}`;
}