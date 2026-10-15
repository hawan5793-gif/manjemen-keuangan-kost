import Dexie from 'dexie';

// Database KostKas — IndexedDB via Dexie
// Semua data offline disimpan di sini
export class KostKasDB extends Dexie {
  constructor() {
    super('KostKasDB');

    // Versi 1 — fitur dasar (Tahap 1)
    this.version(1).stores({
      transactions: '++id, userId, categoryId, type, amount, date, note, createdAt, updatedAt',
      categories: '++id, name, icon, userId',
      budgets: '++id, userId, categoryId, limit, month',
      savingsGoals: '++id, userId, name, targetAmount, deadline',
      savingsDeposits: '++id, goalId, amount, date',
      debts: '++id, userId, friendName, amount, direction, paid',
      settings: '++key, value',
    });

    // Versi 2 — tambah tabel reminders (Tahap 2)
    this.version(2).stores({
      transactions: '++id, userId, categoryId, type, amount, date, note, createdAt, updatedAt',
      categories: '++id, name, icon, userId',
      budgets: '++id, userId, categoryId, limit, month',
      savingsGoals: '++id, userId, name, targetAmount, deadline, createdAt',
      savingsDeposits: '++id, goalId, amount, date, createdAt',
      debts: '++id, userId, friendName, amount, direction, paid, dueDate, createdAt',
      reminders: '++id, userId, title, category, dueDate, recurring, completed, createdAt',
      settings: '++key, value',
    });

    this.transactions = this.table('transactions');
    this.categories = this.table('categories');
    this.budgets = this.table('budgets');
    this.savingsGoals = this.table('savingsGoals');
    this.savingsDeposits = this.table('savingsDeposits');
    this.debts = this.table('debts');
    this.reminders = this.table('reminders');
    this.settings = this.table('settings');
  }
}

export const db = new KostKasDB();

// Kategori bawaan
export const DEFAULT_CATEGORIES = [
  { name: 'Makan', icon: 'utensils', userId: null },
  { name: 'Kost', icon: 'house', userId: null },
  { name: 'Transport', icon: 'bus', userId: null },
  { name: 'Pulsa/Internet', icon: 'mobile', userId: null },
  { name: 'Nongkrong', icon: 'coffee', userId: null },
  { name: 'Rokok', icon: 'smoking', userId: null },
  { name: 'Lainnya', icon: 'box', userId: null },
];

// Pastikan kategori bawaan yang baru ditambahkan tersedia untuk data lama juga.
export async function initDefaultCategories() {
  const existingNames = new Set((await db.categories.toArray()).map(({ name }) => name.trim().toLocaleLowerCase('id')));
  const missingCategories = DEFAULT_CATEGORIES.filter(({ name }) => !existingNames.has(name.trim().toLocaleLowerCase('id')));
  if (missingCategories.length) await db.categories.bulkAdd(missingCategories);
}

// Helper untuk setting
export async function getSetting(key, defaultValue = '') {
  const setting = await db.settings.get(key);
  return setting?.value ?? defaultValue;
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value });
}

export default db;
