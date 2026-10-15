import { useState } from 'react';
import { Button, Input, Card } from '../ui';

export function ReminderForm({ onSubmit, isLoading = false }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [recurring, setRecurring] = useState('NONE');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !dueDate) {
      alert('Isi judul dan tanggal!');
      return;
    }
    onSubmit({ title, dueDate, recurring });
    setTitle('');
    setDueDate('');
    setRecurring('NONE');
  };

  return (
    <Card className="p-4"><form onSubmit={handleSubmit} className="space-y-4"><Input
          label="Judul"
          placeholder="Misal: Bayar Kost, Bayar Listrik"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        /><Input
          label="Tanggal Jatuh Tempo"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        /><div className="flex flex-col gap-1"><label className="text-sm font-medium">Berulang</label><select
            value={recurring}
            onChange={(e) => setRecurring(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm focus:outline-none"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-bg-card)',
              color: 'var(--color-text)',
            }}
          ><option value="NONE">Tidak Berulang</option><option value="MONTHLY">Bulanan</option><option value="WEEKLY">Mingguan</option></select></div><Button type="submit" variant="primary" size="lg" disabled={isLoading}>Tambah Pengingat
        </Button></form></Card>);
}
