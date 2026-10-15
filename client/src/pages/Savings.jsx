import { useState } from 'react';
import { useAppStore, useSavingsProgress } from '../store/app.store';
import { SavingsGoalForm } from '../components/savings/SavingsGoalForm';
import { SavingsGoalItem } from '../components/savings/SavingsGoalItem';
import { Card, ProgressBar, Button } from '../components/ui';
import { formatRupiah } from '../lib/format';
import { AppIcon } from '../components/ui/Icons';

export default function Savings() {
  const [showModal, setShowModal] = useState(false);
  const addSavingsGoal = useAppStore((state) => state.addSavingsGoal);
  const deleteSavingsGoal = useAppStore((state) => state.deleteSavingsGoal);
  const addSavingsDeposit = useAppStore((state) => state.addSavingsDeposit);
  const savingsGoals = useSavingsProgress();

  // Hitung total
  const totalSaved = savingsGoals.reduce((sum, g) => sum + g.totalDeposited, 0);
  const totalTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const overallPercent = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const handleAddGoal = (data) => {
    addSavingsGoal(data);
    setShowModal(false);
  };

  return (
    <div className="screen-page savings-page">
      <header className="screen-heading"><h1>Tabungan</h1><p>Wujudkan satu per satu impianmu.</p></header>
      <Card className="savings-hero">
        <div className="savings-hero-copy"><span className="balance-eyebrow">TOTAL TABUNGAN</span><strong>{formatRupiah(totalSaved)}</strong><span>{Math.round(overallPercent)}% dari seluruh target <i>·</i> {savingsGoals.filter((goal) => goal.percent < 100).length} target aktif</span></div>
        <div className="savings-orbit"><AppIcon name="savings" /></div>
        <div className="savings-hero-progress"><ProgressBar percent={overallPercent} status="safe" color="#45e0be" /><small>{formatRupiah(totalTarget)} target</small></div>
      </Card>

      {/* Daftar Target */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-bold text-[var(--color-text)]">Target saya</h2>
          <Button size="sm" variant="outline" onClick={() => setShowModal(true)}><AppIcon name="plus" /> Target baru</Button>
        </div>
        {savingsGoals.length === 0 ? (
          <Card className="p-6 text-center text-sm text-[var(--color-text-secondary)]">
            Belum ada target tabungan.
          </Card>
        ) : (
          savingsGoals.map((goal) => (
            <SavingsGoalItem
              key={goal.id}
              goal={goal}
              onDelete={deleteSavingsGoal}
              onAddDeposit={addSavingsDeposit}
            />
          ))
        )}
      </section>

      {/* Modal Form */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-[var(--color-bg-card)] rounded-lg p-5 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-4 text-[var(--color-text)]">Target baru</h2>
            <SavingsGoalForm onSubmit={handleAddGoal} onCancel={() => setShowModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
