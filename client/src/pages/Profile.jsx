import { useRef, useState } from 'react';
import { useAppStore } from '../store/app.store';
import { Button, Card, Input } from '../components/ui';
import { AppIcon, UserAvatar } from '../components/ui/Icons';

const MAX_AVATAR_SIZE = 8 * 1024 * 1024;

async function prepareAvatar(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Pilih foto berformat JPG, PNG, atau WebP.');
  }
  if (file.size > MAX_AVATAR_SIZE) {
    throw new Error('Ukuran foto maksimal 8 MB.');
  }

  let image;
  let imageUrl;
  try {
    if (typeof createImageBitmap === 'function') {
      image = await createImageBitmap(file);
    } else {
      imageUrl = URL.createObjectURL(file);
      image = await new Promise((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error('Foto tidak dapat dibuka. Coba pilih foto lain.'));
        element.src = imageUrl;
      });
    }
    const scale = Math.min(1, 512 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Foto tidak dapat diproses di perangkat ini.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.84);
  } finally {
    image?.close?.();
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  }
}

export default function Profile() {
  const user = useAppStore((state) => state.user);
  const setUserName = useAppStore((state) => state.setUserName);
  const setNextIncomeDate = useAppStore((state) => state.setNextIncomeDate);
  const setUserAvatar = useAppStore((state) => state.setUserAvatar);
  const fileInputRef = useRef(null);
  const [name, setName] = useState(user?.name || '');
  const [incomeDate, setIncomeDate] = useState(user?.nextIncomeDate || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [avatarError, setAvatarError] = useState('');
  const [saved, setSaved] = useState(false);

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      setAvatarError('');
      setAvatar(await prepareAvatar(file));
      setSaved(false);
    } catch (error) {
      setAvatarError(error.message || 'Foto tidak dapat dibuka. Coba pilih foto lain.');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    await Promise.all([setUserName(trimmedName), setNextIncomeDate(incomeDate), setUserAvatar(avatar)]);
    setSaved(true);
  };

  return <div className="screen-page profile-page">
    <header className="screen-heading"><h1>Profil pengguna</h1><p>Kelola informasi profil dan preferensi keuanganmu.</p></header>
    <Card className="profile-hero">
      <UserAvatar user={{ ...user, avatar }} className="profile-hero__avatar" />
      <div><h2>{user?.name || 'Pengguna'}</h2><p>{user?.email || 'Email belum terhubung'}</p></div>
    </Card>
    <Card className="profile-settings-card">
      <div className="profile-section-heading"><span><AppIcon name="user" /></span><div><h2>Informasi pengguna</h2><p>Nama ini ditampilkan di dashboard.</p></div></div>
      <form onSubmit={handleSubmit}>
        <div className="profile-photo-field">
          <div><b>Foto profil</b><small>Format JPG, PNG, atau WebP (maksimal 8 MB)</small></div>
          <div className="profile-photo-actions">
            <input ref={fileInputRef} className="profile-photo-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} aria-label="Pilih foto profil" />
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}><AppIcon name="cloud" /> Pilih foto</Button>
            {avatar && <Button type="button" variant="ghost" className="profile-photo-remove" onClick={() => { setAvatar(''); setSaved(false); setAvatarError(''); }}>Hapus</Button>}
          </div>
          {avatarError && <small className="profile-photo-error" role="alert">{avatarError}</small>}
        </div>
        <Input label="Nama tampilan" autoComplete="name" value={name} onChange={(event) => { setName(event.target.value); setSaved(false); }} placeholder="Nama kamu" required minLength={2} />
        <label className="profile-income-field"><span>Tanggal pemasukan berikutnya</span><small>Opsional, untuk membantu mengatur arus kas.</small><input type="date" value={incomeDate} onChange={(event) => { setIncomeDate(event.target.value); setSaved(false); }} /></label>
        <div className="profile-save-row">{saved && <span role="status"><AppIcon name="check" /> Profil tersimpan</span>}<Button type="submit"><AppIcon name="check" /> Simpan profil</Button></div>
      </form>
    </Card>
    <Card className="profile-email-card"><span><AppIcon name="lock" /></span><div><b>Email akun</b><p>{user?.email || 'Belum ada email akun yang terhubung.'}</p><small>Email akun dikelola saat masuk atau mendaftar.</small></div></Card>
  </div>;
}
