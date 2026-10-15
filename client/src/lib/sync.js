import { db } from './db.js';
import api from './api.js';

function toLocalId(id) {
  if (id == null) return id;
  const numeric = Number(id);
  return Number.isSafeInteger(numeric) && String(numeric) === String(id) ? numeric : String(id);
}

function dateOnly(value) {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

const number = (value) => (value == null ? null : Number(value));

function toDexieTransaction(item) {
  return { ...item, id: toLocalId(item.id), userId: item.userId || 'local-user', categoryId: toLocalId(item.categoryId), amount: Number(item.amount), date: dateOnly(item.date), note: item.note || '' };
}
function toDexieBudget(item) {
  return { ...item, id: toLocalId(item.id), userId: item.userId || 'local-user', categoryId: toLocalId(item.categoryId), limit: Number(item.limitAmount ?? item.limit), spent: Number(item.spentAmount ?? item.spent ?? 0), month: item.month };
}
function toDexieSavingsGoal(item) {
  return { ...item, id: toLocalId(item.id), userId: item.userId || 'local-user', targetAmount: Number(item.targetAmount), deadline: dateOnly(item.deadline) };
}
function toDexieSavingsDeposit(item) {
  return { ...item, id: toLocalId(item.id), goalId: toLocalId(item.goalId), amount: Number(item.amount), date: dateOnly(item.date) };
}
function toDexieDebt(item) {
  return { ...item, id: toLocalId(item.id), userId: item.userId || 'local-user', amount: Number(item.amount), dueDate: dateOnly(item.dueDate) || null, paid: Boolean(item.paid), note: item.note || '' };
}
function toDexieReminder(item) {
  return { ...item, id: toLocalId(item.id), userId: item.userId || 'local-user', amount: number(item.amount), dueDate: dateOnly(item.dueDate), recurring: item.recurring || 'NONE', completed: Boolean(item.completed) };
}
function toDexieCategory(item) {
  return { ...item, id: toLocalId(item.id) };
}

function toServerRecords(records, map) {
  return records.map(map);
}

export async function pullFromServer() {
  try {
    const { data } = await api.get('/sync');
    const collections = {
      categories: (data.categories || []).map(toDexieCategory),
      transactions: (data.transactions || []).map(toDexieTransaction),
      budgets: (data.budgets || []).map(toDexieBudget),
      savingsGoals: (data.savingsGoals || []).map(toDexieSavingsGoal),
      savingsDeposits: (data.savingsDeposits || []).map(toDexieSavingsDeposit),
      debts: (data.debts || []).map(toDexieDebt),
      reminders: (data.reminders || []).map(toDexieReminder),
      settings: data.settings || [],
    };
    await db.transaction('rw', db.categories, db.transactions, db.budgets, db.savingsGoals, db.savingsDeposits, db.debts, db.reminders, db.settings, async () => {
      for (const [name, records] of Object.entries(collections)) {
        const table = db.table(name);
        await table.clear();
        if (records.length) await table.bulkAdd(records);
      }
    });
    return { success: true, data: collections };
  } catch (error) {
    console.error('Pull error:', error);
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

export async function pushToServer() {
  try {
    const [categories, transactions, budgets, savingsGoals, savingsDeposits, debts, reminders, settings] = await Promise.all([
      db.categories.toArray(), db.transactions.toArray(), db.budgets.toArray(), db.savingsGoals.toArray(),
      db.savingsDeposits.toArray(), db.debts.toArray(), db.reminders.toArray(),
      db.settings.toArray(),
    ]);
    const payload = {
      categories: toServerRecords(categories, (item) => ({ ...item, id: String(item.id) })),
      transactions: toServerRecords(transactions, (item) => ({ ...item, id: String(item.id), categoryId: item.categoryId == null ? null : String(item.categoryId) })),
      budgets: toServerRecords(budgets, (item) => ({ ...item, id: String(item.id), categoryId: String(item.categoryId), limitAmount: item.limitAmount ?? item.limit })),
      savingsGoals: toServerRecords(savingsGoals, (item) => ({ ...item, id: String(item.id) })),
      savingsDeposits: toServerRecords(savingsDeposits, (item) => ({ ...item, id: String(item.id), goalId: String(item.goalId) })),
      debts: toServerRecords(debts, (item) => ({ ...item, id: String(item.id) })),
      reminders: toServerRecords(reminders, (item) => ({ ...item, id: String(item.id) })),
      settings,
    };
    const { data } = await api.post('/sync', payload);
    return { success: true, data };
  } catch (error) {
    console.error('Push error:', error);
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

export const syncAPI = {
  createCategory: (data) => api.post('/categories', data),
  createTransaction: (data) => api.post('/transactions', { ...data, id: String(data.id), categoryId: data.categoryId == null ? null : String(data.categoryId) }),
  updateTransaction: (id, data) => api.put(`/transactions/${id}`, { ...data, categoryId: data.categoryId == null ? null : String(data.categoryId) }),
  deleteTransaction: (id) => api.delete(`/transactions/${id}`),
  createBudget: (data) => api.post('/budgets', { ...data, id: data.id == null ? undefined : String(data.id), categoryId: String(data.categoryId) }),
  deleteBudget: (id) => api.delete(`/budgets/${id}`),
  createSavingsGoal: (data) => api.post('/savings-goals', { ...data, id: String(data.id) }),
  updateSavingsGoal: (id, data) => api.put(`/savings-goals/${id}`, data),
  deleteSavingsGoal: (id) => api.delete(`/savings-goals/${id}`),
  addSavingsDeposit: (id, amount, depositId, date) => api.post(`/savings-goals/${id}/deposits`, { amount, id: String(depositId), date }),
  deleteSavingsDeposit: (id) => api.delete(`/savings-goals/deposits/${id}`),
  createDebt: (data) => api.post('/debts', { ...data, id: String(data.id) }),
  updateDebt: (id, data) => api.put(`/debts/${id}`, data),
  toggleDebtPaid: (id) => api.patch(`/debts/${id}/paid`),
  deleteDebt: (id) => api.delete(`/debts/${id}`),
  createReminder: (data) => api.post('/reminders', { ...data, id: String(data.id) }),
  updateReminder: (id, data) => api.put(`/reminders/${id}`, data),
  toggleReminderCompleted: (id) => api.patch(`/reminders/${id}/paid`),
  deleteReminder: (id) => api.delete(`/reminders/${id}`),
};

export { api };
