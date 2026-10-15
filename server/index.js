// KostKas Backend - Express + Prisma
// Tahap 2: Setup backend untuk integrasi dengan frontend
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET wajib diatur di server/.env sebelum backend dijalankan');

// ===== Middleware =====
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '50mb' }));

function authenticateToken(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Silakan masuk terlebih dahulu' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload.userId) return res.status(401).json({ error: 'Sesi tidak valid' });
    req.auth = { userId: payload.userId };
    return next();
  } catch {
    return res.status(401).json({ error: 'Sesi tidak valid atau sudah kedaluwarsa' });
  }
}

async function getUserId(req) {
  return req.auth.userId;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===== AUTH =====
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const cleanName = String(name || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!cleanName || !normalizedEmail || !password) {
      return res.status(400).json({ error: 'Semua field harus diisi' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Kata sandi minimal 8 karakter' });
    }
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(400).json({ error: 'Email sudah terdaftar' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { id: 'user-' + Date.now(), name: cleanName, email: normalizedEmail, password: hashedPassword },
    });
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      message: 'Registrasi berhasil',
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) return res.status(401).json({ error: 'Email atau password salah' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Email atau password salah' });
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      message: 'Login berhasil',
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: { id: true, name: true, email: true },
    });
    if (!user) return res.status(401).json({ error: 'Akun tidak ditemukan' });
    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Semua endpoint data keuangan di bawah ini wajib memakai token login.
app.use('/api', authenticateToken);

// ===== CATEGORIES =====
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, icon, color } = req.body;
    const category = await prisma.category.upsert({
      where: { id: String(req.body.id || 'cat-' + Date.now()) },
      create: { id: String(req.body.id || 'cat-' + Date.now()), name, icon, color },
      update: { name, icon, color },
    });
    res.status(201).json({ message: 'Kategori dibuat', category });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== TRANSACTIONS =====
app.get('/api/transactions', async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    const where = { userId: await getUserId(req) };
    if (type) where.type = type;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    const transactions = await prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { date: 'desc' },
    });
    res.json({ transactions });
  } catch (error) {
    console.error('GET transactions error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/transactions/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = { userId: await getUserId(req) };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    const rows = await prisma.transaction.findMany({ where, select: { type: true, amount: true } });
    const summary = rows.reduce((result, row) => {
      const key = String(row.type).toUpperCase() === 'INCOME' ? 'income' : 'expense';
      result[key] += Number(row.amount);
      return result;
    }, { income: 0, expense: 0 });
    res.json({ summary: { ...summary, balance: summary.income - summary.expense } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/transactions/:id', async (req, res) => {
  try {
    const transaction = await prisma.transaction.findFirst({ where: { id: req.params.id, userId: await getUserId(req) }, include: { category: true } });
    if (!transaction) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    res.json({ transaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const { type, amount, categoryId, date, note } = req.body;
    const userId = await getUserId(req);
    const transaction = await prisma.transaction.create({
      data: {
        id: String(req.body.id || 'trx-' + Date.now()),
        userId,
        type,
        amount: parseFloat(amount),
        categoryId: categoryId || null,
        date: new Date(date),
        note: note || '',
      },
      include: { category: true },
    });
    res.status(201).json({ message: 'Transaksi berhasil', transaction });
  } catch (error) {
    console.error('POST transactions error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, categoryId, date, note } = req.body;
    const transaction = await prisma.transaction.updateMany({
      where: { id, userId: await getUserId(req) },
      data: {
        type,
        amount: parseFloat(amount),
        categoryId: categoryId || null,
        date: new Date(date),
        note: note || '',
      },
    });
    if (!transaction.count) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    const updated = await prisma.transaction.findUnique({ where: { id }, include: { category: true } });
    res.json({ message: 'Transaksi diupdate', transaction: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await prisma.transaction.deleteMany({ where: { id, userId: await getUserId(req) } });
    if (!deleted.count) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    res.json({ message: 'Transaksi dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== BUDGETS =====
app.get('/api/budgets', async (req, res) => {
  try {
    const { month } = req.query;
    const where = { userId: await getUserId(req) };
    if (month) where.month = month;
    const budgets = await prisma.budget.findMany({
      where,
      include: { category: true },
    });
    res.json({ budgets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/budgets', async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { categoryId, month, limitAmount } = req.body;
    // Cek jika sudah ada budget untuk kategori+month ini
    const existing = await prisma.budget.findFirst({
      where: { userId, categoryId: String(categoryId), month },
    });
    if (existing) {
      const budget = await prisma.budget.update({
        where: { id: existing.id },
        data: { limitAmount: parseFloat(limitAmount) },
      });
      return res.json({ message: 'Budget diupdate', budget });
    }
    const budget = await prisma.budget.create({
      data: {
        id: String(req.body.id || 'bud-' + Date.now()),
        userId,
        categoryId: String(categoryId),
        month,
        limitAmount: parseFloat(limitAmount),
        spentAmount: 0,
      },
    });
    res.status(201).json({ message: 'Budget dibuat', budget });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/budgets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await prisma.budget.deleteMany({ where: { id, userId: await getUserId(req) } });
    if (!deleted.count) return res.status(404).json({ error: 'Anggaran tidak ditemukan' });
    res.json({ message: 'Budget dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== SAVINGS GOALS =====
app.get('/api/savings-goals', async (req, res) => {
  try {
    const goals = await prisma.savingsGoal.findMany({
      where: { userId: await getUserId(req) },
      include: { deposits: true },
    });
    res.json({ goals });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/savings-goals', async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { name, targetAmount, deadline } = req.body;
    const goal = await prisma.savingsGoal.create({
      data: {
        id: String(req.body.id || 'sav-' + Date.now()),
        userId,
        name,
        targetAmount: parseFloat(targetAmount),
        deadline: new Date(deadline),
      },
    });
    res.status(201).json({ message: 'Target tabungan dibuat', goal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/savings-goals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, targetAmount, deadline } = req.body;
    const goal = await prisma.savingsGoal.updateMany({
      where: { id, userId: await getUserId(req) },
      data: {
        name,
        targetAmount: parseFloat(targetAmount),
        deadline: new Date(deadline),
      },
    });
    if (!goal.count) return res.status(404).json({ error: 'Target tidak ditemukan' });
    res.json({ message: 'Target diupdate' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/savings-goals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Hapus deposits dulu
    const userId = await getUserId(req);
    await prisma.savingsDeposit.deleteMany({ where: { goalId: id, goal: { userId } } });
    const deleted = await prisma.savingsGoal.deleteMany({ where: { id, userId } });
    if (!deleted.count) return res.status(404).json({ error: 'Target tidak ditemukan' });
    res.json({ message: 'Target dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Savings deposits
app.post('/api/savings-goals/:id/deposits', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, date } = req.body;
    const deposit = await prisma.savingsDeposit.create({
      data: {
        id: String(req.body.id || 'dep-' + Date.now()),
        goalId: id,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
      },
    });
    res.status(201).json({ message: 'Setoran berhasil', deposit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/savings-goals/deposits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await prisma.savingsDeposit.deleteMany({ where: { id, goal: { userId: await getUserId(req) } } });
    if (!deleted.count) return res.status(404).json({ error: 'Setoran tidak ditemukan' });
    res.json({ message: 'Setoran dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== DEBTS =====
app.get('/api/debts', async (req, res) => {
  try {
    const debts = await prisma.debt.findMany({ where: { userId: await getUserId(req) }, orderBy: { createdAt: 'desc' } });
    res.json({ debts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/debts', async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { friendName, amount, direction, dueDate, note } = req.body;
    const debt = await prisma.debt.create({
      data: {
        id: String(req.body.id || 'debt-' + Date.now()),
        userId,
        friendName,
        amount: parseFloat(amount),
        direction,
        dueDate: dueDate ? new Date(dueDate) : null,
        paid: false,
        note: note || '',
      },
    });
    res.status(201).json({ message: 'Utang dicatat', debt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/debts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { friendName, amount, direction, dueDate, note } = req.body;
    const debt = await prisma.debt.updateMany({
      where: { id, userId: await getUserId(req) },
      data: {
        friendName,
        amount: parseFloat(amount),
        direction,
        dueDate: dueDate ? new Date(dueDate) : null,
        note: note || '',
      },
    });
    if (!debt.count) return res.status(404).json({ error: 'Catatan utang tidak ditemukan' });
    res.json({ message: 'Utang diupdate' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/debts/:id/paid', async (req, res) => {
  try {
    const { id } = req.params;
    const debt = await prisma.debt.findFirst({ where: { id, userId: await getUserId(req) } });
    if (!debt) return res.status(404).json({ error: 'Catatan utang tidak ditemukan' });
    const updated = await prisma.debt.update({
      where: { id },
      data: { paid: !debt.paid },
    });
    res.json({ message: 'Status utang diubah', debt: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/debts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await prisma.debt.deleteMany({ where: { id, userId: await getUserId(req) } });
    if (!deleted.count) return res.status(404).json({ error: 'Catatan utang tidak ditemukan' });
    res.json({ message: 'Utang dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== REMINDERS =====
app.get('/api/reminders', async (req, res) => {
  try {
    const reminders = await prisma.reminder.findMany({ where: { userId: await getUserId(req) }, orderBy: { dueDate: 'asc' } });
    res.json({ reminders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reminders', async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { title, category, amount, dueDate, recurring } = req.body;
    const reminder = await prisma.reminder.create({
      data: {
        id: String(req.body.id || 'rem-' + Date.now()),
        userId,
        title,
        category: category || 'Lainnya',
        amount: amount ? parseFloat(amount) : null,
        dueDate: new Date(dueDate),
        recurring: recurring || 'NONE',
        completed: false,
      },
    });
    res.status(201).json({ message: 'Pengingat dibuat', reminder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/reminders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, amount, dueDate, recurring } = req.body;
    const reminder = await prisma.reminder.updateMany({
      where: { id, userId: await getUserId(req) },
      data: {
        title,
        category,
        amount: amount ? parseFloat(amount) : null,
        dueDate: new Date(dueDate),
        recurring,
      },
    });
    if (!reminder.count) return res.status(404).json({ error: 'Pengingat tidak ditemukan' });
    res.json({ message: 'Pengingat diupdate' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/reminders/:id/paid', async (req, res) => {
  try {
    const { id } = req.params;
    const reminder = await prisma.reminder.findFirst({ where: { id, userId: await getUserId(req) } });
    if (!reminder) return res.status(404).json({ error: 'Pengingat tidak ditemukan' });
    const updated = await prisma.reminder.update({
      where: { id },
      data: { completed: !reminder.completed },
    });
    res.json({ message: 'Status pengingat diubah', reminder: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/reminders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await prisma.reminder.deleteMany({ where: { id, userId: await getUserId(req) } });
    if (!deleted.count) return res.status(404).json({ error: 'Pengingat tidak ditemukan' });
    res.json({ message: 'Pengingat dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== SYNC endpoint - bulk sync untuk offline-first =====
app.post('/api/sync', async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { transactions, budgets, savingsGoals, savingsDeposits, debts, reminders, categories, settings } = req.body;

    const results = { transactions: 0, budgets: 0, savingsGoals: 0, savingsDeposits: 0, debts: 0, reminders: 0, categories: 0 };

    // Sync categories
    if (categories && categories.length) {
      for (const cat of categories) {
        await prisma.category.upsert({
          where: { id: String(cat.id) },
          create: { id: String(cat.id), name: cat.name, icon: cat.icon, color: cat.color },
          update: { name: cat.name, icon: cat.icon, color: cat.color },
        });
        results.categories++;
      }
    }

    // Sync transactions
    if (transactions && transactions.length) {
      for (const trx of transactions) {
        await prisma.transaction.upsert({
          where: { id: String(trx.id) },
          create: {
            id: String(trx.id),
            userId,
            type: trx.type,
            amount: parseFloat(trx.amount),
            categoryId: trx.categoryId == null ? null : String(trx.categoryId),
            date: new Date(trx.date),
            note: trx.note || '',
          },
          update: {
            type: trx.type,
            amount: parseFloat(trx.amount),
            categoryId: trx.categoryId == null ? null : String(trx.categoryId),
            date: new Date(trx.date),
            note: trx.note || '',
          },
        });
        results.transactions++;
      }
    }

    // Sync budgets
    if (budgets && budgets.length) {
      for (const bud of budgets) {
        const budgetData = { limitAmount: parseFloat(bud.limitAmount || bud.limit || 0) };
        const existing = await prisma.budget.findFirst({
          where: { userId, categoryId: String(bud.categoryId), month: bud.month },
        });
        if (existing) {
          await prisma.budget.update({ where: { id: existing.id }, data: budgetData });
        } else {
          await prisma.budget.create({
            data: {
              id: String(bud.id),
              userId,
              categoryId: String(bud.categoryId),
              month: bud.month,
              ...budgetData,
              spentAmount: 0,
            },
          });
        }
        results.budgets++;
      }
    }

    // Sync savings goals
    if (savingsGoals && savingsGoals.length) {
      for (const goal of savingsGoals) {
        await prisma.savingsGoal.upsert({
          where: { id: String(goal.id) },
          create: {
            id: String(goal.id),
            userId,
            name: goal.name,
            targetAmount: parseFloat(goal.targetAmount),
            deadline: new Date(goal.deadline),
          },
          update: {
            name: goal.name,
            targetAmount: parseFloat(goal.targetAmount),
            deadline: new Date(goal.deadline),
          },
        });
        results.savingsGoals++;
      }
    }

    // Sync savings deposits
    if (savingsDeposits && savingsDeposits.length) {
      for (const dep of savingsDeposits) {
        await prisma.savingsDeposit.upsert({
          where: { id: String(dep.id) },
          create: {
            id: String(dep.id),
            goalId: String(dep.goalId),
            amount: parseFloat(dep.amount),
            date: new Date(dep.date),
          },
          update: {
            amount: parseFloat(dep.amount),
            date: new Date(dep.date),
          },
        });
        results.savingsDeposits++;
      }
    }

    // Sync debts
    if (debts && debts.length) {
      for (const debt of debts) {
        await prisma.debt.upsert({
          where: { id: String(debt.id) },
          create: {
            id: String(debt.id),
            userId,
            friendName: debt.friendName,
            amount: parseFloat(debt.amount),
            direction: debt.direction,
            dueDate: debt.dueDate ? new Date(debt.dueDate) : null,
            paid: debt.paid || false,
            note: debt.note || '',
          },
          update: {
            friendName: debt.friendName,
            amount: parseFloat(debt.amount),
            direction: debt.direction,
            dueDate: debt.dueDate ? new Date(debt.dueDate) : null,
            paid: debt.paid || false,
            note: debt.note || '',
          },
        });
        results.debts++;
      }
    }

    // Sync reminders
    if (reminders && reminders.length) {
      for (const rem of reminders) {
        await prisma.reminder.upsert({
          where: { id: String(rem.id) },
          create: {
            id: String(rem.id),
            userId,
            title: rem.title,
            category: rem.category || 'Lainnya',
            amount: rem.amount ? parseFloat(rem.amount) : null,
            dueDate: new Date(rem.dueDate),
            recurring: rem.recurring || 'NONE',
            completed: rem.completed || false,
          },
          update: {
            title: rem.title,
            category: rem.category || 'Lainnya',
            amount: rem.amount ? parseFloat(rem.amount) : null,
            dueDate: new Date(rem.dueDate),
            recurring: rem.recurring || 'NONE',
            completed: rem.completed || false,
          },
        });
        results.reminders++;
      }
    }

    if (Array.isArray(settings)) {
      for (const setting of settings) {
        await prisma.userSetting.upsert({
          where: { userId_key: { userId, key: String(setting.key) } },
          create: { userId, key: String(setting.key), value: String(setting.value ?? '') },
          update: { value: String(setting.value ?? '') },
        });
      }
      results.settings = settings.length;
    }

    res.json({ message: 'Sync berhasil', results });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET sync - ambil semua data dari backend
app.get('/api/sync', async (req, res) => {
  try {
    const userId = await getUserId(req);
    const [categories, transactions, budgets, savingsGoals, savingsDeposits, debts, reminders, settings] = await Promise.all([
      prisma.category.findMany(),
      prisma.transaction.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
      prisma.budget.findMany({ where: { userId } }),
      prisma.savingsGoal.findMany({ where: { userId } }),
      prisma.savingsDeposit.findMany({ where: { goal: { is: { userId } } } }),
      prisma.debt.findMany({ where: { userId } }),
      prisma.reminder.findMany({ where: { userId } }),
      prisma.userSetting.findMany({ where: { userId } }),
    ]);

    res.json({
      categories,
      transactions,
      budgets,
      savingsGoals,
      savingsDeposits,
      debts,
      reminders,
      settings,
    });
  } catch (error) {
    console.error('GET sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== Start server =====
if (require.main === module) {
  prisma.$connect()
    .then(() => app.listen(PORT, () => {
      console.log('========================================');
      console.log(`  KostKas Backend berjalan di http://localhost:${PORT}`);
      console.log(`  Waktu: ${new Date().toLocaleString('id-ID')}`);
      console.log('========================================');
    }))
    .catch((error) => {
      console.error('Gagal menghubungkan database:', error);
      process.exitCode = 1;
    });
}

module.exports = app;
