import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../lib/api.js';
import { saveAuthSession } from '../lib/auth.js';
import { AppIcon, KostkasMark } from '../components/ui/Icons';

function errorMessage(error) {
  if (error.message?.startsWith('Server tidak mengirim token')) return error.message;
  if (!error.response) return 'Tidak dapat tersambung ke server. Coba lagi setelah koneksi tersedia.';
  return error.response.data?.message || error.response.data?.error || 'Email atau kata sandi tidak cocok.';
}

export default function Login() {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const isRegister = mode === 'register';

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const credentials = { email: email.trim().toLowerCase(), password };
      let response = isRegister
        ? await authAPI.register({ ...credentials, name: name.trim() })
        : await authAPI.login(credentials);

      try {
        saveAuthSession(response.data);
      } catch (sessionError) {
        if (!isRegister) throw sessionError;
        response = await authAPI.login(credentials);
        saveAuthSession(response.data);
      }

      const destination = location.state?.from?.pathname || '/';
      navigate(destination, { replace: true });
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return <main className="auth-page">
    <div className="auth-ambient" aria-hidden="true">
      <span className="auth-orb auth-orb--one" /><span className="auth-orb auth-orb--two" /><span className="auth-orb auth-orb--three" />
      <span className="auth-grid" /><span className="auth-glow auth-glow--one" /><span className="auth-glow auth-glow--two" />
    </div>

    <header className="auth-brand"><span className="auth-brand-mark"><KostkasMark /></span><span>Kostkas</span><small>RUANG KEUANGAN PRIBADI</small></header>

    <section className="auth-layout">
      <div className="auth-story">
        <span className="auth-kicker"><i /> KEUANGAN LEBIH TENANG</span>
        <h1>Setiap tujuan besar dimulai dari langkah kecil.</h1>
        <p>Simpan catatan, rencanakan anggaran, dan lihat progres keuanganmu dalam satu tempat.</p>
        <div className="auth-preview" aria-hidden="true">
          <div className="auth-preview-top"><span><AppIcon name="wallet" /> Ringkasan bulan ini</span><i /></div>
          <small>Total saldo</small><strong>Rp 8.450.000</strong>
          <div className="auth-preview-chart"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
          <div className="auth-preview-foot"><span><i /> Pemasukan</span><b>Rp 5,2 jt</b><span><i /> Pengeluaran</span><b>Rp 2,1 jt</b></div>
        </div>
        <div className="auth-trust"><span><AppIcon name="check" /> Data tersimpan aman</span><span><AppIcon name="check" /> Bisa dibuka kapan saja</span></div>
      </div>

      <section className="auth-card" aria-labelledby="auth-title">
        <span className="auth-card-sparkle"><KostkasMark /></span>
        <div className="auth-card-heading"><small>{isRegister ? 'MULAI PERJALANANMU' : 'SELAMAT DATANG KEMBALI'}</small><h2 id="auth-title">{isRegister ? 'Buat akun Kostkas' : 'Masuk ke Kostkas'}</h2><p>{isRegister ? 'Buat akun untuk mulai menyimpan catatan keuangan.' : 'Masuk untuk melanjutkan mengelola keuanganmu.'}</p></div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && <label className="auth-field"><span>Nama lengkap</span><div className="auth-input-wrap"><AppIcon name="user" /><input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nama kamu" required minLength={2} /></div></label>}
          <label className="auth-field"><span>Email</span><div className="auth-input-wrap"><AppIcon name="envelope" /><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" required /></div></label>
          <label className="auth-field"><span>Kata sandi</span><div className="auth-input-wrap"><AppIcon name="lock" /><input type={showPassword ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isRegister ? 'Minimal 8 karakter' : 'Masukkan kata sandi'} required minLength={isRegister ? 8 : undefined} /><button type="button" className="auth-password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}><AppIcon name={showPassword ? 'eyeSlash' : 'eye'} /></button></div></label>

          {error && <p className="auth-error" role="alert"><AppIcon name="warning" />{error}</p>}
          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            <span>{isSubmitting ? 'Memproses...' : isRegister ? 'Buat akun' : 'Masuk'}</span>
            {isSubmitting ? <i className="auth-spinner" /> : <AppIcon name="arrowRight" />}
          </button>
        </form>

        <div className="auth-switch">{isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'} <button type="button" onClick={() => { setMode(isRegister ? 'login' : 'register'); setError(''); }}>{isRegister ? 'Masuk' : 'Daftar sekarang'}</button></div>
        <div className="auth-privacy"><AppIcon name="lock" /> Kata sandi tidak disimpan di perangkat.</div>
      </section>
    </section>
    <footer className="auth-footer">KOSTKAS <span>•</span> CATAT HARI INI, LEBIH TENANG ESOK HARI</footer>
  </main>;
}
