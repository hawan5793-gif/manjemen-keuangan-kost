import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore, useSummary } from '../store/app.store';
import { Card } from '../components/ui';
import { formatRupiah, formatDateShort } from '../lib/format';
import { AppIcon, CategoryIcon } from '../components/ui/Icons';

export default function Dashboard() {
  const user = useAppStore((state) => state.user);
  const currentMonth = useAppStore((state) => state.currentMonth);
  const transactions = useAppStore((state) => state.transactions);
  const categories = useAppStore((state) => state.categories);
  const { balance, income, expense } = useSummary();
  const [hideBalance, setHideBalance] = useState(false);
  const [hour] = useState(() => new Date().getHours());
  const greeting = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 19 ? 'Selamat sore' : 'Selamat malam';
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'Teman';
  const monthLabel = new Date(`${currentMonth}-01T00:00:00`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const barData = useMemo(() => {
    const [year, month] = currentMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const slots = Array.from({ length: 10 }, (_, i) => ({ label: String(Math.round((i + .5) * daysInMonth / 10)), amount: 0 }));
    transactions.filter((item) => item.type === 'EXPENSE').forEach((item) => {
      const day = Number(item.date.slice(-2));
      const index = Math.min(9, Math.floor((day - 1) / daysInMonth * 10));
      slots[index].amount += item.amount;
    });
    const max = Math.max(0, ...slots.map((item) => item.amount));
    const selected = slots.reduce((last, item, index) => item.amount > 0 ? index : last, -1);
    return slots.map((item, index) => ({ ...item, height: max ? Math.max(18, item.amount / max * 72) : 18, selected: index === selected }));
  }, [transactions, currentMonth]);
  const displayMoney = (value) => hideBalance ? '••••••••' : formatRupiah(value);
  const recentTransactions = [...transactions].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).slice(0, 4);

  return <div className="screen-page home-page">
    <header className="screen-heading"><h1>{greeting}, {firstName}</h1><p>Semua keuanganmu, terkendali.</p></header>
    <Card className="home-balance-card">
      <span className="balance-eyebrow">TOTAL SALDO</span>
      <button type="button" className="balance-visibility" aria-label={hideBalance ? 'Tampilkan saldo' : 'Sembunyikan saldo'} onClick={() => setHideBalance((value) => !value)}><AppIcon name={hideBalance ? 'eyeSlash' : 'wallet'} /></button>
      <strong>{displayMoney(balance)}</strong>
      <div className="balance-split"><div><span><i className="income-dot"><AppIcon name="arrowDown" /></i>Pemasukan</span><b>{displayMoney(income)}</b></div><div><span><i className="expense-dot"><AppIcon name="arrowUp" /></i>Pengeluaran</span><b>{displayMoney(expense)}</b></div></div>
    </Card>
    <div className="home-shortcuts">
      <Link to="/transactions"><span className="shortcut-icon tone-purple"><AppIcon name="plus" /></span><b>Catat transaksi</b><AppIcon name="arrowRight" /></Link>
      <Link to="/budget"><span className="shortcut-icon tone-mint"><AppIcon name="budget" /></span><b>Atur anggaran</b><AppIcon name="arrowRight" /></Link>
    </div>
    <Card className="expense-chart-card">
      <div className="expense-chart-heading"><div><span>Pengeluaran bulan ini</span><small>{monthLabel.toLocaleUpperCase('id-ID')}</small><strong>{displayMoney(expense)}</strong></div><Link to="/reports" aria-label="Lihat laporan"><AppIcon name="arrowRight" /></Link></div>
      <div className="expense-bars" aria-label={`Grafik pengeluaran bulan ${monthLabel}`}>
        {barData.map((bar, index) => <span key={`${bar.label}-${index}`} className={bar.selected ? 'is-selected' : ''} style={{ '--bar-height': `${bar.height}%` }} title={`${bar.amount ? formatRupiah(bar.amount) : 'Tidak ada transaksi'} · tanggal ${bar.label}`} />)}
      </div>
    </Card>
    {recentTransactions.length > 0 && <section className="home-recent"><div className="section-title-row"><h2>Transaksi terbaru</h2><Link to="/transactions">Lihat semua</Link></div><Card className="home-recent-list">{recentTransactions.map((item) => { const category = categories.find((entry) => entry.id === item.categoryId); const positive = item.type === 'INCOME'; return <div className="home-recent-row" key={item.id}><span className="transaction-item__icon"><CategoryIcon category={category} /></span><span><b>{item.note || category?.name || 'Transaksi'}</b><small>{category?.name || 'Lainnya'} · {formatDateShort(item.date)}</small></span><strong className={positive ? 'positive' : 'negative'}>{positive ? '+' : '−'}{displayMoney(item.amount)}</strong></div>; })}</Card></section>}
  </div>;
}
