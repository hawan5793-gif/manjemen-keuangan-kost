import { useState } from 'react';
import { useAppStore, useBudgetStatus } from '../store/app.store';
import { BudgetForm } from '../components/budget/BudgetForm';
import { BudgetItem } from '../components/budget/BudgetItem';
import { Button, Card } from '../components/ui';
import { formatRupiah } from '../lib/format';
import { AppIcon } from '../components/ui/Icons';

export default function Budget() {
  const { categories, addBudget, deleteBudget, setCurrentMonth, currentMonth } = useAppStore();
  const budgets = useBudgetStatus();
  const [showForm, setShowForm] = useState(false);
  const handleAdd = async (data) => { await addBudget(data.categoryId, data.limit); setShowForm(false); };
  const shiftMonth = (delta) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + delta, 1);
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };
  const totalLimit = budgets.reduce((sum, budget) => sum + budget.limit, 0);
  const totalUsed = budgets.reduce((sum, budget) => sum + budget.used, 0);
  const totalRemaining = Math.max(0, totalLimit - totalUsed);
  const percent = totalLimit ? Math.min(100, Math.round(totalUsed / totalLimit * 100)) : 0;
  const monthLabel = new Date(`${currentMonth}-01T00:00:00`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  return <div className="screen-page budget-page">
    <header className="screen-heading"><h1>Anggaran</h1><p>Rencana kecil, dampak yang besar.</p></header>
    <div className="budget-period"><span>Periode aktif</span><div><button type="button" onClick={() => shiftMonth(-1)} aria-label="Bulan sebelumnya"><AppIcon name="arrowLeft" /></button><b>{monthLabel}</b><button type="button" onClick={() => shiftMonth(1)} aria-label="Bulan berikutnya"><AppIcon name="arrowRight" /></button></div></div>
    <Card className="budget-summary-card"><div className="budget-ring" style={{ '--ring-progress': `${percent}%` }}><div><b>{percent}%</b><small>terpakai</small></div></div><div className="budget-summary-copy"><small>TOTAL ANGGARAN</small><strong>{formatRupiah(totalLimit)}</strong><span>Sisa <b>{formatRupiah(totalRemaining)}</b> bulan ini</span></div></Card>
    <section className="budget-category-section">
      <div className="section-title-row"><h2>Anggaran kategori</h2><Button size="sm" variant="outline" onClick={() => setShowForm((open) => !open)}><AppIcon name="plus" />{showForm ? 'Tutup' : 'Tambah'}</Button></div>
      {showForm && <div className="budget-form-wrap"><BudgetForm categories={categories} onSubmit={handleAdd} /></div>}
      {budgets.length === 0 ? <Card className="empty-state"><AppIcon name="chart" /><b>Belum ada anggaran</b><span>Tambahkan batas pengeluaran untuk kategori pilihanmu.</span></Card> : <div className="budget-list">{budgets.map((budget) => <BudgetItem key={budget.id} budget={budget} onDelete={deleteBudget} />)}</div>}
    </section>
  </div>;
}
