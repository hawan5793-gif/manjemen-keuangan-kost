import { useMemo } from 'react';
import { useAppStore } from '../store/app.store';
import { ExpensePieChart, MonthlyTrendChart } from '../components/reports/Charts';
import { Button } from '../components/ui';
import { exportTransactionsToCSV, downloadFile } from '../lib/export';

export default function Reports() {
  const transactions = useAppStore((state) => state.transactions);
  const categories = useAppStore((state) => state.categories);

  // Group by month untuk bar chart
  const transactionsByMonth = useMemo(
    () =>
      transactions.reduce((acc, t) => {
        const month = t.date.substring(0, 7); // YYYY-MM
        let existing = acc.find((x) => x.month === month);
        if (!existing) {
          existing = { month, income: 0, expense: 0 };
          acc.push(existing);
        }
        if (t.type === 'INCOME') existing.income += t.amount;
        else existing.expense += t.amount;
        return acc;
      }, []),
    [transactions]
  );

  const handleExport = () => {
    const url = exportTransactionsToCSV(transactions, categories);
    downloadFile(url, `kostkas-export-${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="screen-page reports-page">
      <header className="screen-heading flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1>Laporan keuangan</h1>
          <p>Analisis keuanganmu bulan ini.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} className="shrink-0">
          Ekspor CSV
        </Button>
      </header>

      <section>
        <ExpensePieChart transactions={transactions} categories={categories} />
      </section>

      <section>
        <MonthlyTrendChart transactionsByMonth={transactionsByMonth} />
      </section>
    </div>
  );
}
