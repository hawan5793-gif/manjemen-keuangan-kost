import { authAPI } from './api.js';
import { db } from './db.js';

const TOKEN_KEY = 'kostkas_token';
const SESSION_KEY = 'kostkas_session';
const DATA_OWNER_KEY = 'kostkas_data_owner';

function unwrap(payload) {
  return payload?.data ?? payload;
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getAuthSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

export function saveAuthSession(payload) {
  const data = unwrap(payload);
  const token = data?.token || data?.accessToken || data?.access_token || data?.session?.access_token;
  if (!token) throw new Error('Server tidak mengirim token login. Periksa format respons API.');

  const user = data?.user || data?.profile || data?.session?.user || {};
  const session = {
    id: user.id ?? user._id ?? null,
    name: user.name || user.fullName || user.username || 'Pengguna',
    email: user.email || '',
  };

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function updateAuthUser(payload) {
  const data = unwrap(payload);
  const user = data?.user || data?.profile || data;
  const current = getAuthSession() || {};
  const session = {
    id: user.id ?? user._id ?? current.id ?? null,
    name: user.name || user.fullName || user.username || current.name || 'Pengguna',
    email: user.email || current.email || '',
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
}

export async function claimLocalData(session) {
  const owner = session?.id ? `id:${session.id}` : session?.email ? `email:${session.email.toLowerCase()}` : '';
  if (!owner) return false;
  const previousOwner = localStorage.getItem(DATA_OWNER_KEY);
  if (previousOwner && previousOwner !== owner) {
    await db.transaction('rw', db.transactions, db.categories, db.budgets, db.savingsGoals, db.savingsDeposits, db.debts, db.reminders, db.settings, async () => {
      await Promise.all([db.transactions.clear(), db.categories.clear(), db.budgets.clear(), db.savingsGoals.clear(), db.savingsDeposits.clear(), db.debts.clear(), db.reminders.clear(), db.settings.clear()]);
    });
  }
  localStorage.setItem(DATA_OWNER_KEY, owner);
  return previousOwner !== owner;
}

export async function requestCurrentUser() {
  const { data } = await authAPI.me();
  return updateAuthUser(data);
}
