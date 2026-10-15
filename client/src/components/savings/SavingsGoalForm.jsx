import { useState } from 'react';
import { Button, Input } from '../ui';

export function SavingsGoalForm({ onSubmit, onCancel, isLoading = false }) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !targetAmount || !deadline) {
      alert('Isi semua field!');
      return;
    }
    onSubmit({ name, targetAmount: Number(targetAmount), deadline });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nama Target"
        placeholder="Misal: Liburan ke Lombok"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        label="Target Jumlah (Rp)"
        currency
        placeholder="5000000"
        value={targetAmount}
        onChange={(e) => setTargetAmount(e.target.value)}
      />
      <Input
        label="Target Selesai"
        type="date"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
      />
      <div className="flex gap-2 mt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="flex-1"
        >
          Batal
        </Button>
        <Button type="submit" variant="primary" size="sm" disabled={isLoading} className="flex-1">
          Simpan target
        </Button>
      </div>
    </form>
  );
}
