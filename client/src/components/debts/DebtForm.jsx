import { useState } from 'react';
import { Button, Input, Card } from '../ui';

export function DebtForm({ onSubmit, isLoading = false }) {
  const [friendName, setFriendName] = useState('');
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState('BERUTANG');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!friendName || !amount) {
      alert('Isi nama dan jumlah!');
      return;
    }
    onSubmit({ friendName, amount, direction, dueDate });
    setFriendName('');
    setAmount('');
    setDueDate('');
  };

  return (
    <Card className="p-4"><form onSubmit={handleSubmit} className="space-y-4"><div className="flex gap-2"><button
            type="button"
            onClick={() => setDirection('BERUTANG')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              direction === 'BERUTANG'
                ? 'bg-[var(--color-danger)] text-white'
                : 'bg-[var(--color-border)] text-[var(--color-text)]'
            }`}
          >Saya Berutang
          </button><button
            type="button"
            onClick={() => setDirection('DIHUTANGI')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              direction === 'DIHUTANGI'
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-border)] text-[var(--color-text)]'
            }`}
          >Teman Berutang
          </button></div><Input
          label={direction === 'BERUTANG' ? 'Nama Pemberi Pinjaman' : 'Nama Peminjam'}
          placeholder="Nama teman..."
          value={friendName}
          onChange={(e) => setFriendName(e.target.value)}
        /><Input
          label="Jumlah (Rp)"
          currency
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        /><Input
          label="Jatuh Tempo (opsional)"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        /><Button type="submit" variant="primary" size="lg" disabled={isLoading}>Tambah Catatan
        </Button></form></Card>);
}
