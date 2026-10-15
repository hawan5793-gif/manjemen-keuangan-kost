import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/app.store';
import { AppIcon, KostkasMark, UserAvatar } from '../ui/Icons';
import { getAuthSession } from '../../lib/auth.js';

const navItems = [
  { to: '/', label: 'Beranda', icon: 'house', end: true },
  { to: '/transactions', label: 'Transaksi', icon: 'coins' },
  { to: '/budget', label: 'Anggaran', icon: 'budget' },
  { to: '/savings', label: 'Tabungan', icon: 'cloud' },
  { to: '/more', label: 'Lainnya', icon: 'more' },
];
const extraItems = [
  ['/reminders', 'bell', 'Pengingat tagihan', 'Jangan lewatkan tanggal pembayaran'],
  ['/debts', 'handshake', 'Utang & piutang', 'Catatan pinjaman dengan rapi'],
  ['/reports', 'receipt', 'Laporan keuangan', 'Lihat dan ekspor analisis bulanan'],
];

function Brand() {
  return <Link to="/" className="brand-lockup" aria-label="Kostkas, ke beranda">
    <span className="brand-mark"><KostkasMark /></span>
    <span><strong>Kostkas</strong><small>Keuangan lebih teratur</small></span>
  </Link>;
}

export default function AppShell() {
  const init = useAppStore((state) => state.init);
  const isLoading = useAppStore((state) => state.isLoading);
  const user = useAppStore((state) => state.user);
  const reminders = useAppStore((state) => state.reminders);
  const hasPendingReminders = reminders.some((item) => !item.completed);
  const location = useLocation();
  const activeIndex = navItems.findIndex(({ to, end }) => end ? location.pathname === to : location.pathname.startsWith(to));
  const selectedIndex = activeIndex < 0 && extraItems.some(([to]) => location.pathname.startsWith(to)) ? 4 : activeIndex;
  const [navIconTransition, setNavIconTransition] = useState(() => ({ from: null, to: Math.max(0, selectedIndex) }));
  const navTransitionTimer = useRef(null);

  const transitionNavIcon = (target) => {
    setNavIconTransition((current) => current.to === target ? current : { from: current.to, to: target });
    window.clearTimeout(navTransitionTimer.current);
    navTransitionTimer.current = window.setTimeout(() => {
      setNavIconTransition((current) => current.to === target ? { from: null, to: target } : current);
    }, 420);
  };

  useEffect(() => () => window.clearTimeout(navTransitionTimer.current), []);

  useEffect(() => {
    init().then(() => {
      const sessionUser = getAuthSession();
      if (!sessionUser) return;
      useAppStore.setState((state) => ({ user: { ...state.user, ...sessionUser } }));
    });
    const syncWhenOnline = () => useAppStore.getState().syncWithServer();
    window.addEventListener('online', syncWhenOnline);
    return () => window.removeEventListener('online', syncWhenOnline);
  }, [init]);

  if (isLoading) return <div className="loading-screen"><span className="loading-mark"><KostkasMark /></span><span>Menyiapkan catatanmu...</span></div>;

  return <div className="app-shell">
    <aside className="desktop-sidebar">
      <Brand />
      <p className="sidebar-caption">MENU UTAMA</p>
      <nav className="sidebar-nav" aria-label="Menu utama">
        {navItems.map(({ to, label, icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}><AppIcon name={icon} /><span>{label}</span></NavLink>)}
      </nav>
      <p className="sidebar-caption sidebar-caption--second">KELOLA KEUANGAN</p>
      <nav className="sidebar-nav" aria-label="Fitur keuangan">
        {extraItems.map(([to, icon, label]) => <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}><AppIcon name={icon} /><span>{label}</span></NavLink>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-tip"><span className="sidebar-tip__icon"><KostkasMark /></span><b>Catatan kecil, dampak besar</b><p>Rencanakan hari ini untuk keuangan yang lebih tenang.</p><Link to="/transactions">Catat transaksi <AppIcon name="arrowRight" /></Link></div>
        <Link to="/profile" className="sidebar-profile"><UserAvatar user={user} className="profile-avatar" /><span className="sidebar-profile__text"><b>{user?.name || 'Teman'}</b><small>Profil keuangan</small></span></Link>
      </div>
    </aside>

    <div className="app-main">
      <header className="mobile-topbar"><Brand /><Link to="/reminders" className="notification-button" aria-label="Buka pengingat"><AppIcon name="bell" animation={hasPendingReminders ? 'shake' : undefined} />{hasPendingReminders && <i />}</Link></header>
      <header className="desktop-topbar"><div><span className="topbar-eyebrow">RUANG KEUANGAN PRIBADI</span><h1>Kelola keuanganmu</h1></div><div className="topbar-right"><span className="topbar-status"><i /> Data tersimpan di perangkat</span><UserAvatar user={user} className="profile-avatar profile-avatar--small" /></div></header>
      <main className="app-content"><div key={location.pathname} className="page-enter"><Outlet /></div></main>
      <nav className="mobile-nav" aria-label="Menu utama">
        {navItems.map(({ to, label, icon, end }, index) => <NavLink key={to} to={to} end={end} aria-label={label} onClick={() => transitionNavIcon(index)} className={({ isActive }) => `mobile-nav__item${isActive || (index === 4 && selectedIndex === 4) ? ' is-active' : ''}`}>
          <span className={`mobile-nav__icon${navIconTransition.to === index && navIconTransition.from !== null ? ' is-transitioning' : ''}`}><AppIcon name={icon} /></span><span className="mobile-nav__label">{label}</span>
        </NavLink>)}
      </nav>
    </div>
  </div>;
}
