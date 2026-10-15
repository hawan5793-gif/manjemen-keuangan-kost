import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Card } from '../ui';
import { formatRupiah } from '../../lib/format';

const COLORS = ['#7c9a82', '#5b9ea6', '#d4a373', '#8b9dc3', '#b5c99a', '#e07a5f', '#6b7280'];

export function ExpensePieChart({ transactions, categories }) {
  const data = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'EXPENSE');
    const byCategory = {};
    expenses.forEach((t) => {
      const catId = t.categoryId;
      byCategory[catId] = (byCategory[catId] || 0) + t.amount;
    });

    const result = Object.entries(byCategory).map(([catId, amount]) => {
      const cat = categories.find((c) => c.id === Number(catId));
      return {
        name: cat?.name || 'Lainnya',
        value: amount,
      };
    });

    return result.sort((a, b) => b.value - a.value);
  }, [transactions, categories]);

  if (data.length === 0) {
    return (
      <Card className="p-6 text-center text-sm text-[var(--color-text-secondary)]">
        Belum ada data pengeluaran
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="font-medium text-base mb-4">Pengeluaran per Kategori</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(val) => formatRupiah(val)} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function MonthlyTrendChart({ transactionsByMonth }) {
  if (transactionsByMonth.length === 0) {
    return (
      <Card className="p-6 text-center text-sm text-[var(--color-text-secondary)]">
        Belum ada data transaksi
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="font-medium text-base mb-4">Tren Bulanan</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={transactionsByMonth}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(val) => formatRupiah(val)} />
          <Legend />
          <Bar dataKey="income" name="Pemasukan" fill="#7c9a82" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="Pengeluaran" fill="#5b9ea6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
