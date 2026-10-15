import { useState } from 'react';
import { Button, Input, Card, CategorySelect } from '../ui';

export function BudgetForm({ categories, onSubmit, isLoading = false }) {
  const [categoryId, setCategoryId] = useState('');
  const [limit, setLimit] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!categoryId || !limit) {
      alert('Isi kategori dan batas anggaran!');
      return;
    }
    onSubmit({ categoryId, limit: Number(limit) });
    setCategoryId('');
    setLimit('');
  };

  return (
    <Card className="p-4"><form onSubmit={handleSubmit} className="space-y-4"><div className="flex flex-col gap-1"><label className="text-sm font-medium">Kategori</label><CategorySelect
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          categories={categories}
        /></div><Input
          label="Batas Anggaran"
          currency
          placeholder="0"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
        /><Button type="submit" variant="primary" size="lg" disabled={isLoading}>Tambah Anggaran
        </Button></form></Card>);
}
