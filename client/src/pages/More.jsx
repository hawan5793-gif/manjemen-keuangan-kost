import { Link, useNavigate } from 'react-router-dom';
import { useAppStore, useSummary } from '../store/app.store';
import { Card } from '../components/ui';
import { AppIcon, KostkasMark, UserAvatar } from '../components/ui/Icons';
import { clearAuthSession } from '../lib/auth.js';

const tools = [
  ['/reminders', 'bell', 'Pengingat tagihan', 'Jangan lewatkan tanggal pembayaran', 'purple'],
  ['/debts', 'handshake', 'Utang & piutang', 'Catat pinjaman dengan lebih rapi', 'coral'],
  ['/reports', 'receipt', 'Laporan keuangan', 'Lihat dan ekspor analisis bulanan', 'mint'],
];

export default function More() {
  const user = useAppStore((state) => state.user);
  const navigate = useNavigate();
  const transactions = useAppStore((state) => state.transactions);
  const { expense } = useSummary();
  const insight = transactions.length ? `Kamu sudah mencatat ${transactions.length} transaksi bulan ini.` : 'Mulai catat pengeluaran kecilmu hari ini.';

  return <div className="screen-page more-page">
    <header className="screen-heading"><h1>Lainnya</h1><p>Fitur tambahan untuk hidup lebih tenang.</p></header>
    <Card className="insight-card"><span className="insight-icon"><KostkasMark /></span><div><small>INSIGHT MINGGU INI</small><b>{insight}</b><span>Pengeluaran tercatat {new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(expense)} bulan ini</span></div></Card>
    <section className="more-tools-section"><h2>Kelola keuangan</h2><div className="more-tools-list">{tools.map(([to, icon, label, description, tone]) => <Link key={to} to={to} className="more-tool-link"><span className={`more-tool-icon tone-${tone}`}><AppIcon name={icon} /></span><span className="more-tool-copy"><b>{label}</b><small>{description}</small></span><AppIcon name="arrowRight" className="more-tool-arrow" /></Link>)}</div></section>
    <Card className="more-profile"><Link to="/profile" className="more-profile-link"><UserAvatar user={user} className="more-profile-avatar" /><span><b>{user?.name || 'Pengguna'}</b><small>{user?.email || 'Profil Kostkas'}</small></span><AppIcon name="arrowRight" /></Link><button type="button" onClick={() => { clearAuthSession(); useAppStore.getState().resetForNewSession(); navigate('/login', { replace: true }); }}>Keluar</button></Card>
  </div>;
}
