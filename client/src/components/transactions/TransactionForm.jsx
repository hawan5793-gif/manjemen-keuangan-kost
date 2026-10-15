import { useState } from 'react';
import { Button, Input, Card, CategorySelect } from '../ui';
import { getToday } from '../../lib/format';
import { AppIcon } from '../ui/Icons';

export function TransactionForm({ categories, onSubmit, initialData, isLoading = false }) {
  const [type, setType] = useState(initialData?.type || 'EXPENSE');
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [date, setDate] = useState(initialData?.date || getToday());
  const [note, setNote] = useState(initialData?.note || '');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!amount || !categoryId) {
      alert('Isi jumlah dan kategori!');
      return;
    }
    onSubmit({ type, amount, categoryId, date, note });
    if (!initialData) {
      setAmount('');
      setCategoryId('');
      setNote('');
      setDate(getToday());
    }
  };

  return <Card className="transaction-form-card">
    <form onSubmit={handleSubmit} className="transaction-form">
      <div className="transaction-type-switch" role="group" aria-label="Jenis transaksi">
        <button type="button" onClick={() => setType('INCOME')} className={`transaction-type${type === 'INCOME' ? ' is-income' : ''}`}>Pemasukan</button>
        <button type="button" onClick={() => setType('EXPENSE')} className={`transaction-type${type === 'EXPENSE' ? ' is-expense' : ''}`}>Pengeluaran</button>
      </div>
      <Input label="Nama transaksi" type="text" placeholder="Contoh: Belanja bulanan" value={note} onChange={(event) => setNote(event.target.value)} />
      <Input label="Jumlah" currency placeholder="0" value={amount} onChange={(event) => setAmount(event.target.value)} />
      <div className="form-field"><label>Kategori</label><CategorySelect value={categoryId} onChange={(event) => setCategoryId(event.target.value)} categories={categories} /></div>
      <Input label="Tanggal" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      <Button type="submit" variant="primary" size="lg" disabled={isLoading} className="transaction-submit"><AppIcon name={initialData ? 'check' : 'plus'} />{initialData ? 'Simpan perubahan' : 'Tambah transaksi'}</Button>
    </form>
  </Card>;
}
