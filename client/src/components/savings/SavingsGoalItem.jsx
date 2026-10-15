import { useState } from 'react';
import { Card, ProgressBar, Button, Input } from '../ui';
import { formatRupiah } from '../../lib/format';
import { AppIcon } from '../ui/Icons';

export function SavingsGoalItem({ goal, onDelete, onAddDeposit }) {
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const isComplete = goal.percent >= 100;
  const dateLabel = goal.deadline ? new Date(`${goal.deadline}T00:00:00`).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : 'Tanpa batas';

  const handleDeposit = () => {
    if (!depositAmount || Number(depositAmount) <= 0) { alert('Masukkan jumlah setoran!'); return; }
    onAddDeposit(goal.id, depositAmount);
    setDepositAmount('');
    setShowDepositForm(false);
  };

  return <Card className={`savings-goal-card${isComplete ? ' is-complete' : ''}`}>
    <div className="savings-goal-top"><span className="savings-goal-icon"><AppIcon name="goal" animation="beat" /></span><span className="savings-goal-date">{dateLabel}</span><button type="button" className="savings-goal-delete" aria-label={`Hapus target ${goal.name}`} onClick={() => { if (confirm(`Hapus target "${goal.name}"?`)) onDelete(goal.id); }}><AppIcon name="trash" /></button></div>
    <h3>{goal.name}</h3>
    <div className="savings-goal-amount"><strong>{formatRupiah(goal.totalDeposited)}</strong><span>dari {formatRupiah(goal.targetAmount)}</span></div>
    <ProgressBar percent={goal.percent} status={isComplete ? 'accent' : 'safe'} className="savings-goal-progress" />
    <div className="savings-goal-foot"><span>{Math.round(goal.percent)}% tercapai</span>{!isComplete && <button type="button" onClick={() => setShowDepositForm((open) => !open)}>{showDepositForm ? 'Batal' : '+ Isi tabungan'}</button>}</div>
    {showDepositForm && <div className="savings-deposit-form"><Input currency placeholder="Jumlah setoran" value={depositAmount} onChange={(event) => setDepositAmount(event.target.value)} /><Button size="sm" onClick={handleDeposit}>Simpan</Button></div>}
  </Card>;
}
