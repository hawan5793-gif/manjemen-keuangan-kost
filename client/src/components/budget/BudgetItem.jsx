import { Card, ProgressBar } from '../ui';
import { formatRupiah } from '../../lib/format';
import { AppIcon } from '../ui/Icons';

export function BudgetItem({ budget, onDelete }) {
  const tone = /makan|food|restoran/i.test(budget.name) ? 'purple' : /transport|kendaraan|bensin|ojek/i.test(budget.name) ? 'mint' : 'coral';
  return <Card className={`budget-category-card tone-${tone}`}>
    <div className="budget-category-top"><span className="budget-category-dot" /><b>{budget.name}</b><span className="budget-category-amount">{formatRupiah(budget.used)} <i>/ {formatRupiah(budget.limit)}</i></span><button type="button" className="budget-delete-button" onClick={() => { if (confirm(`Hapus anggaran ${budget.name}?`)) onDelete(budget.id); }} aria-label={`Hapus anggaran ${budget.name}`}><AppIcon name="trash" /></button></div>
    <ProgressBar percent={budget.percent} status="safe" className="budget-progress" color="var(--budget-tone)" />
    <div className="budget-category-foot"><span>{Math.round(budget.percent)}% terpakai</span><span>Sisa {formatRupiah(Math.max(0, budget.remaining))}</span></div>
  </Card>;
}
