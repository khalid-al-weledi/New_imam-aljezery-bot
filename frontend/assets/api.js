// frontend/assets/api.js
const API_BASE = localStorage.getItem('api_base') || '/api';

function authHeaders() {
  const token = localStorage.getItem('token');
  const h = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function request(path, { method = 'GET', body, raw = false } = {}) {
  const opts = { method, headers: authHeaders() };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, opts);
  if (raw) return res;
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const err = new Error((data && data.error) || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  base: API_BASE,

  setBase(url) {
    localStorage.setItem('api_base', url);
  },

  // ===== Auth =====
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: () => request('/auth/me'),

  // ===== Public =====
  programs: () => request('/students/programs'),
  packages: () => request('/students/packages'),
  library: () => request('/library'),
  verifySanad: (serial) => request(`/certificates/verify/${encodeURIComponent(serial)}`),

  // ===== Student =====
  profile: () => request('/students/me/profile'),
  updateProfile: (payload) => request('/students/me/profile', { method: 'PATCH', body: payload }),
  wallet: () => request('/students/me/wallet'),
  myPrograms: () => request('/students/me/programs'),
  enroll: (program_id) => request('/students/me/enroll', { method: 'POST', body: { program_id } }),

  mySessions: () => request('/sessions/me'),
  bookSession: (payload) => request('/sessions/book', { method: 'POST', body: payload }),
  cancelSession: (id) => request(`/sessions/${id}`, { method: 'DELETE' }),

  myOrders: () => request('/payments/orders/me'),
  createOrder: (payload) => request('/payments/orders', { method: 'POST', body: payload }),
  sendReceipt: (payload) => request('/payments/receipts', { method: 'POST', body: payload }),

  myCertificates: () => request('/certificates/me'),

  createTicket: (payload) => request('/support/tickets', { method: 'POST', body: payload }),
  myTickets: () => request('/support/tickets/me'),
  ticketMessages: (id) => request(`/support/tickets/${id}/messages`),
  sendTicketMessage: (id, body) =>
    request(`/support/tickets/${id}/messages`, { method: 'POST', body: { body } }),

  // ===== Admin =====
  adminStats: () => request('/admin/stats'),
  adminStudents: () => request('/students/admin/students'),
  adminPendingReceipts: () => request('/payments/admin/receipts/pending'),
  adminApproveReceipt: (id) =>
    request(`/payments/admin/receipts/${id}/approve`, { method: 'POST' }),
  adminRejectReceipt: (id) =>
    request(`/payments/admin/receipts/${id}/reject`, { method: 'POST' }),
  adminAddMinutes: (userId, payload) =>
    request(`/admin/users/${userId}/minutes/add`, { method: 'POST', body: payload }),
  adminDeductMinutes: (userId, payload) =>
    request(`/admin/users/${userId}/minutes/deduct`, { method: 'POST', body: payload }),
  adminToggleUser: (userId) =>
    request(`/admin/users/${userId}/toggle`, { method: 'POST' }),
  adminAddLibrary: (payload) =>
    request('/library', { method: 'POST', body: payload }),
  adminDeleteLibrary: (id) => request(`/library/${id}`, { method: 'DELETE' }),
  adminTickets: () => request('/support/admin/tickets'),
  adminCloseTicket: (id) => request(`/support/admin/tickets/${id}/close`, { method: 'POST' }),
  adminAudit: (limit = 100) => request(`/admin/audit?limit=${limit}`),
  adminNotifyAll: (payload) => request('/admin/notify-all', { method: 'POST', body: payload }),
  adminIssueIjaza: (payload) =>
    request('/certificates/admin/ijazat', { method: 'POST', body: payload }),
  adminIssueCertificate: (payload) =>
    request('/certificates/admin/certificates', { method: 'POST', body: payload }),
  adminUpcomingSessions: () => request('/sessions/admin/upcoming'),
};

// ===== Helpers =====
export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

export function setSession(user, token) {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('token', token);
}

export function clearSession() {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
}

export function requireLogin() {
  if (!localStorage.getItem('token')) {
    location.href = 'login.html';
    return false;
  }
  return true;
}

export function requireAdmin() {
  const u = getUser();
  if (!u || !['admin', 'teacher'].includes(u.role)) {
    location.href = 'dashboard.html';
    return false;
  }
  return true;
}