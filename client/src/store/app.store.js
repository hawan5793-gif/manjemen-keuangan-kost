import { useMemo } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { db, initDefaultCategories, getSetting, setSetting } from '../lib/db.js';
import { getCurrentMonth, getToday } from '../lib/format.js';
import {
  calculateBalance,
  calculateTotalIncome,
  calculateTotalExpense,
  calculateBudgetStatus,
  calculateDailySafeMoney,
  calculateSavingsProgress,
  calculateTotalDebt,
  calculateTotalLent,
} from '../lib/calc.js';
import { syncAPI, pushToServer, pullFromServer } from '../lib/sync.js';

const LOCAL_USER_ID = 'local-user';
const toLocalId = (value) => {
  if (value == null) return value;
  const number = Number(value);
  return Number.isSafeInteger(number) && String(number) === String(value) ? number : String(value);
};

export const useAppStore = create(
  persist(
    (set, get) => ({
      // ===== STATE =====
      user: { id: LOCAL_USER_ID, name: 'Pengguna', email: '', nextIncomeDate: '', avatar: '' },
      transactions: [],
      categories: [],
      budgets: [],
      savingsGoals: [],
      savingsDeposits: [],
      debts: [],
      reminders: [],
      currentMonth: getCurrentMonth(),
      isLoading: true,
      initialized: false,

      resetForNewSession: () => set({
        user: { id: LOCAL_USER_ID, name: 'Pengguna', email: '', nextIncomeDate: '', avatar: '' },
        transactions: [], categories: [], budgets: [], savingsGoals: [], savingsDeposits: [], debts: [], reminders: [],
        currentMonth: getCurrentMonth(), isLoading: true, initialized: false,
      }),

      // ===== INITIALIZATION =====
      init: async () => {
        if (get().initialized) return;
        set({ isLoading: true });
        await initDefaultCategories();
        const nextIncomeDate = await getSetting('nextIncomeDate', '');
        const userName = await getSetting('userName', 'Pengguna');
        const currentMonth = getCurrentMonth();

        const [transactions, categories, budgets, savingsGoals, savingsDeposits, debts, reminders] = await Promise.all([
          db.transactions
            .where('date')
            .startsWith(currentMonth)
            .sortBy('date'),
          db.categories.toArray(),
          db.budgets.where('month').equals(currentMonth).toArray(),
          db.savingsGoals.toArray(),
          db.savingsDeposits.toArray(),
          db.debts.toArray(),
          db.reminders.toArray(),
        ]);

        transactions.reverse();

        set({
          user: { ...get().user, id: LOCAL_USER_ID, name: userName, nextIncomeDate },
          transactions,
          categories,
          budgets,
          savingsGoals,
          savingsDeposits,
          debts,
          reminders,
          currentMonth,
          isLoading: false,
          initialized: true,
        });

        // IndexedDB is the offline cache; reconcile it with the API in the background.
        await get().syncWithServer();
      },

      syncWithServer: async () => {
        const pushed = await pushToServer();
        if (!pushed.success) return pushed;
        const pulled = await pullFromServer();
        if (pulled.success) await get().refreshAll();
        return pulled;
      },

      refreshAll: async () => {
        const month = get().currentMonth;
        const [transactions, categories, budgets, savingsGoals, savingsDeposits, debts, reminders] = await Promise.all([
          db.transactions.where('date').startsWith(month).sortBy('date'),
          db.categories.toArray(),
          db.budgets.where('month').equals(month).toArray(),
          db.savingsGoals.toArray(),
          db.savingsDeposits.toArray(),
          db.debts.toArray(),
          db.reminders.toArray(),
        ]);
        const [userName, nextIncomeDate] = await Promise.all([
          getSetting('userName', 'Pengguna'),
          getSetting('nextIncomeDate', ''),
        ]);
        set((state) => ({
          user: { ...state.user, name: userName, nextIncomeDate },
          transactions: transactions.reverse(), categories, budgets, savingsGoals, savingsDeposits, debts, reminders,
        }));
      },

      // ===== USER =====
      setNextIncomeDate: async (date) => {
        await setSetting('nextIncomeDate', date);
        set((state) => ({
          user: { ...state.user, nextIncomeDate: date },
        }));
        pushToServer();
      },

      setUserName: async (name) => {
        await setSetting('userName', name);
        set((state) => ({
          user: { ...state.user, name },
        }));
        pushToServer();
      },

      setUserAvatar: (avatar) => set((state) => ({
        user: { ...state.user, avatar: avatar || '' },
      })),

      // ===== CATEGORIES =====
      addCategory: async (name, icon) => {
        const id = await db.categories.add({
          name,
          icon,
          userId: LOCAL_USER_ID,
        });
        set((state) => ({
          categories: [...state.categories, { id, name, icon, userId: LOCAL_USER_ID }],
        }));
        syncAPI.createCategory({ id: String(id), name, icon }).catch((error) => console.error('Category sync error:', error));
        return id;
      },

      // ===== TRANSACTIONS =====
      addTransaction: async (data) => {
        const now = new Date().toISOString();
        const transaction = {
          userId: LOCAL_USER_ID,
          type: data.type,
          amount: Number(data.amount),
          categoryId: toLocalId(data.categoryId),
          date: data.date ?? getToday(),
          note: data.note ?? '',
          createdAt: now,
          updatedAt: now,
        };
        const id = await db.transactions.add(transaction);
        await get().refreshTransactions();
        // Push to backend (fire and forget, don't block UI)
        syncAPI.createTransaction({ ...transaction, id }).catch((err) => console.error('Sync error:', err));
        return id;
      },

      updateTransaction: async (id, data) => {
        const updates = {
          ...data,
          categoryId: toLocalId(data.categoryId),
          amount: Number(data.amount),
          updatedAt: new Date().toISOString(),
        };
        await db.transactions.update(id, updates);
        await get().refreshTransactions();
        syncAPI.updateTransaction(id, updates).catch((error) => console.error('Transaction sync error:', error));
      },

      deleteTransaction: async (id) => {
        await db.transactions.delete(id);
        await get().refreshTransactions();
        syncAPI.deleteTransaction(id).catch((error) => console.error('Transaction sync error:', error));
      },

      refreshTransactions: async () => {
        const currentMonth = get().currentMonth;
        const transactions = await db.transactions
          .where('date')
          .startsWith(currentMonth)
          .sortBy('date');
        transactions.reverse();
        set({ transactions });
      },

      setCurrentMonth: async (month) => {
        set({ currentMonth: month, isLoading: true });
        const transactions = await db.transactions
          .where('date')
          .startsWith(month)
          .sortBy('date');
        transactions.reverse();
        const budgets = await db.budgets.where('month').equals(month).toArray();
        set({ transactions, budgets, isLoading: false });
      },

      // ===== BUDGETS =====
      addBudget: async (categoryId, limit) => {
        const localCategoryId = toLocalId(categoryId);
        const month = get().currentMonth;
        const existing = await db.budgets
          .where({ month, categoryId: localCategoryId })
          .first();
        let id;
        if (existing) {
          await db.budgets.update(existing.id, { limit: Number(limit) });
          id = existing.id;
          syncAPI.createBudget({ categoryId: localCategoryId, month, limitAmount: limit }).catch(console.error);
        } else {
          id = await db.budgets.add({
            userId: LOCAL_USER_ID,
            categoryId: localCategoryId,
            limit: Number(limit),
            month,
          });
          syncAPI.createBudget({ categoryId: localCategoryId, month, limitAmount: limit, id }).catch(console.error);
        }
        const budgets = await db.budgets.where('month').equals(month).toArray();
        set({ budgets });
        return id;
      },

      deleteBudget: async (id) => {
        await db.budgets.delete(id);
        const month = get().currentMonth;
        const budgets = await db.budgets.where('month').equals(month).toArray();
        set({ budgets });
        syncAPI.deleteBudget(id).catch((error) => console.error('Budget sync error:', error));
      },

      // ===== SAVINGS GOALS (F6) =====
      addSavingsGoal: async (data) => {
        const now = new Date().toISOString();
        const id = await db.savingsGoals.add({
          userId: LOCAL_USER_ID,
          name: data.name,
          targetAmount: Number(data.targetAmount),
          deadline: data.deadline,
          createdAt: now,
          updatedAt: now,
        });
        await get().refreshSavingsGoals();
        syncAPI.createSavingsGoal({ id, name: data.name, targetAmount: data.targetAmount, deadline: data.deadline }).catch(console.error);
        return id;
      },

      updateSavingsGoal: async (id, data) => {
        await db.savingsGoals.update(id, {
          ...data,
          targetAmount: Number(data.targetAmount),
          updatedAt: new Date().toISOString(),
        });
        await get().refreshSavingsGoals();
        syncAPI.updateSavingsGoal(id, data).catch((error) => console.error('Savings sync error:', error));
      },

      deleteSavingsGoal: async (id) => {
        await db.savingsGoals.delete(id);
        await db.savingsDeposits.where('goalId').equals(id).delete();
        await get().refreshSavingsGoals();
        syncAPI.deleteSavingsGoal(id).catch((error) => console.error('Savings sync error:', error));
      },

      addSavingsDeposit: async (goalId, amount, date) => {
        const now = new Date().toISOString();
        const deposit = {
          goalId,
          amount: Number(amount),
          date: date ?? getToday(),
          createdAt: now,
        };
        const id = await db.savingsDeposits.add(deposit);
        await get().refreshSavingsGoals();
        syncAPI.addSavingsDeposit(goalId, Number(amount), id, deposit.date).catch((error) => console.error('Savings sync error:', error));
      },

      deleteSavingsDeposit: async (depositId) => {
        await db.savingsDeposits.delete(depositId);
        await get().refreshSavingsGoals();
        syncAPI.deleteSavingsDeposit(depositId).catch((error) => console.error('Savings sync error:', error));
      },

      refreshSavingsGoals: async () => {
        const [savingsGoals, savingsDeposits] = await Promise.all([
          db.savingsGoals.toArray(),
          db.savingsDeposits.toArray(),
        ]);
        set({ savingsGoals, savingsDeposits });
      },

      // ===== DEBTS (F8) =====
      addDebt: async (data) => {
        const now = new Date().toISOString();
        const id = await db.debts.add({
          userId: LOCAL_USER_ID,
          friendName: data.friendName,
          amount: Number(data.amount),
          direction: data.direction,
          dueDate: data.dueDate ?? null,
          paid: false,
          note: data.note ?? '',
          createdAt: now,
          updatedAt: now,
        });
        await get().refreshDebts();
        syncAPI.createDebt({ ...data, id }).catch((error) => console.error('Debt sync error:', error));
        return id;
      },

      updateDebt: async (id, data) => {
        await db.debts.update(id, {
          ...data,
          amount: Number(data.amount),
          updatedAt: new Date().toISOString(),
        });
        await get().refreshDebts();
        syncAPI.updateDebt(id, data).catch((error) => console.error('Debt sync error:', error));
      },

      toggleDebtPaid: async (id) => {
        const debt = await db.debts.get(id);
        await db.debts.update(id, { paid: !debt.paid, updatedAt: new Date().toISOString() });
        await get().refreshDebts();
        syncAPI.toggleDebtPaid(id).catch((error) => console.error('Debt sync error:', error));
      },

      deleteDebt: async (id) => {
        await db.debts.delete(id);
        await get().refreshDebts();
        syncAPI.deleteDebt(id).catch((error) => console.error('Debt sync error:', error));
      },

      refreshDebts: async () => {
        const debts = await db.debts.toArray();
        set({ debts });
      },

      // ===== REMINDERS (F9) =====
      addReminder: async (data) => {
        const now = new Date().toISOString();
        const id = await db.reminders.add({
          userId: LOCAL_USER_ID,
          title: data.title,
          category: data.category ?? 'Lainnya',
          amount: data.amount ? Number(data.amount) : null,
          dueDate: data.dueDate,
          recurring: data.recurring ?? 'NONE',
          completed: false,
          createdAt: now,
          updatedAt: now,
        });
        await get().refreshReminders();
        syncAPI.createReminder({ ...data, id }).catch((error) => console.error('Reminder sync error:', error));
        return id;
      },

      updateReminder: async (id, data) => {
        await db.reminders.update(id, {
          ...data,
          amount: data.amount ? Number(data.amount) : null,
          updatedAt: new Date().toISOString(),
        });
        await get().refreshReminders();
        syncAPI.updateReminder(id, data).catch((error) => console.error('Reminder sync error:', error));
      },

      toggleReminderCompleted: async (id) => {
        const reminder = await db.reminders.get(id);
        await db.reminders.update(id, {
          completed: !reminder.completed,
          updatedAt: new Date().toISOString(),
        });
        await get().refreshReminders();
        syncAPI.toggleReminderCompleted(id).catch((error) => console.error('Reminder sync error:', error));
      },

      deleteReminder: async (id) => {
        await db.reminders.delete(id);
        await get().refreshReminders();
        syncAPI.deleteReminder(id).catch((error) => console.error('Reminder sync error:', error));
      },

      refreshReminders: async () => {
        const reminders = await db.reminders.toArray();
        set({ reminders });
      },
    }),
    {
      name: 'kostkas-app',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }),
    }
  )
);

// ===== SELECTORS =====
export const useSummary = () => {
  const transactions = useAppStore((s) => s.transactions);
  const nextIncomeDate = useAppStore((s) => s.user.nextIncomeDate);
  const debts = useAppStore((s) => s.debts);

  return useMemo(() => {
    const balance = calculateBalance(transactions);
    const income = calculateTotalIncome(transactions);
    const expense = calculateTotalExpense(transactions);
    const dailySafe = calculateDailySafeMoney(balance, nextIncomeDate);
    const totalDebt = calculateTotalDebt(debts);
    const totalLent = calculateTotalLent(debts);
    return { balance, income, expense, dailySafe, totalDebt, totalLent };
  }, [transactions, nextIncomeDate, debts]);
};

export const useBudgetStatus = () => {
  const budgets = useAppStore((s) => s.budgets);
  const transactions = useAppStore((s) => s.transactions);
  const categories = useAppStore((s) => s.categories);

  return useMemo(
    () => calculateBudgetStatus(budgets, transactions, categories),
    [budgets, transactions, categories]
  );
};

export const useSavingsProgress = () => {
  const savingsGoals = useAppStore((s) => s.savingsGoals);
  const savingsDeposits = useAppStore((s) => s.savingsDeposits);

  return useMemo(() => {
    return savingsGoals.map((goal) => {
      const deposits = savingsDeposits.filter((d) => d.goalId === goal.id);
      const progress = calculateSavingsProgress(goal, deposits);
      return { ...goal, ...progress, deposits };
    });
  }, [savingsGoals, savingsDeposits]);
};
