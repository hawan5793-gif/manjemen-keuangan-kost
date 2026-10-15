import { differenceInDays, parseISO } from 'date-fns';

/**
 * Hitung saldo dari daftar transaksi
 * @param {Array} transactions
 * @returns {number}
 */
export function calculateBalance(transactions) {
  return transactions.reduce((acc, t) => {
    if (t.type === 'INCOME') return acc + t.amount;
    return acc - t.amount;
  }, 0);
}

/**
 * Hitung total pemasukan bulan ini
 */
export function calculateTotalIncome(transactions) {
  return transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((acc, t) => acc + t.amount, 0);
}

/**
 * Hitung total pengeluaran bulan ini
 */
export function calculateTotalExpense(transactions) {
  return transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((acc, t) => acc + t.amount, 0);
}

/**
 * Hitung pengeluaran per kategori
 * @param {Array} transactions — transaksi bulan ini
 * @param {Array} categories — daftar kategori
 * @returns {Object} { [categoryName]: amount }
 */
export function calculateExpenseByCategory(transactions, categories) {
  const result = {};
  for (const t of transactions) {
    if (t.type === 'EXPENSE') {
      const cat = categories.find((c) => c.id === t.categoryId);
      const name = cat?.name ?? 'Lainnya';
      result[name] = (result[name] ?? 0) + t.amount;
    }
  }
  return result;
}

/**
 * Hitung sisa anggaran per kategori
 * @param {Array} budgets — anggaran bulan ini
 * @param {Array} transactions — transaksi bulan ini
 * @param {Array} categories — daftar kategori
 * @returns {Array} [{ id, name, icon, limit, used, remaining, percent }]
 */
export function calculateBudgetStatus(budgets, transactions, categories) {
  const expenseByCat = {};
  for (const t of transactions) {
    if (t.type === 'EXPENSE') {
      expenseByCat[t.categoryId] = (expenseByCat[t.categoryId] ?? 0) + t.amount;
    }
  }

  return budgets.map((b) => {
    const cat = categories.find((c) => c.id === b.categoryId);
    const used = expenseByCat[b.categoryId] ?? 0;
    const remaining = b.limit - used;
    const percent = b.limit > 0 ? Math.min((used / b.limit) * 100, 100) : 0;
    return {
      id: b.id,
      name: cat?.name ?? 'Lainnya',
      icon: cat?.icon ?? 'box',
      limit: b.limit,
      used,
      remaining,
      percent,
    };
  });
}

/**
 * Hitung uang harian aman
 * (sisa uang) / (sisa hari sampai tanggal kiriman)
 * @param {number} balance — saldo saat ini
 * @param {string} nextIncomeDate — tanggal kiriman berikutnya (YYYY-MM-DD)
 * @returns {number} uang harian aman
 */
export function calculateDailySafeMoney(balance, nextIncomeDate) {
  if (!nextIncomeDate) return 0;
  const today = new Date();
  const nextDate = parseISO(nextIncomeDate);
  const daysLeft = differenceInDays(nextDate, today);
  if (daysLeft <= 0) return balance;
  return Math.floor(balance / daysLeft);
}

/**
 * Status anggaran: 'safe' | 'warning' | 'danger'
 */
export function getBudgetStatus(percent) {
  if (percent >= 100) return 'danger';
  if (percent >= 80) return 'warning';
  return 'safe';
}

/**
 * Hitung progress target tabungan
 * @param {Object} goal — { id, name, targetAmount, deadline }
 * @param {Array} deposits — array of { amount }
 * @returns {Object} { totalDeposited, percent, remaining, estimatedDaysLeft, estimatedDateReached }
 */
export function calculateSavingsProgress(goal, deposits) {
  const totalDeposited = deposits.reduce((acc, d) => acc + d.amount, 0);
  const percent = goal.targetAmount > 0 ? Math.min((totalDeposited / goal.targetAmount) * 100, 100) : 0;
  const remaining = Math.max(goal.targetAmount - totalDeposited, 0);

  // Perkiraan kapan tercapai (asumsi rata-rata setoran per hari)
  let estimatedDateReached = null;
  if (deposits.length > 1 && remaining > 0) {
    // Hitung rata-rata setoran per hari
    const sorted = [...deposits].sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstDate = new Date(sorted[0].date);
    const lastDate = new Date(sorted[sorted.length - 1].date);
    const daysSpan = differenceInDays(lastDate, firstDate) || 1;
    const avgPerDay = totalDeposited / daysSpan;
    if (avgPerDay > 0) {
      const daysToGoal = Math.ceil(remaining / avgPerDay);
      estimatedDateReached = new Date();
      estimatedDateReached.setDate(estimatedDateReached.getDate() + daysToGoal);
    }
  }

  return {
    totalDeposited,
    percent,
    remaining,
    estimatedDateReached: estimatedDateReached
      ? estimatedDateReached.toISOString().split('T')[0]
      : null,
  };
}

/**
 * Hitung total utang aktif (yang belum lunas)
 */
export function calculateTotalDebt(debts) {
  return debts
    .filter((d) => !d.paid && d.direction === 'BERUTANG')
    .reduce((acc, d) => acc + d.amount, 0);
}

/**
 * Hitung total yang dihutangi (teman berutang ke kita)
 */
export function calculateTotalLent(debts) {
  return debts
    .filter((d) => !d.paid && d.direction === 'DIHUTANGI')
    .reduce((acc, d) => acc + d.amount, 0);
}

