import { Card } from '../ui';
import { formatDateShort, formatRupiah } from '../../lib/format';
import { AppIcon, CategoryIcon } from '../ui/Icons';

export function TransactionItem({ transaction, category, onEdit, onDelete }) {
  const isIncome = transaction.type === 'INCOME';
  const sign = isIncome ? '+' : '−';
  const color = isIncome ? 'var(--color-income)' : 'var(--color-expense)';

  return <Card className="transaction-item interactive-card mb-2 flex items-center gap-3 p-3.5 animate-fade-in">
    <span className="transaction-item__icon"><CategoryIcon category={category} /></span>
    <div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{transaction.note || category?.name || 'Transaksi'}</div><div className="truncate text-xs text-[var(--muted)]">{category?.name || 'Lainnya'} · {formatDateShort(transaction.date)}</div></div>
    <div className="text-right"><div className="whitespace-nowrap text-sm font-extrabold tabular-nums" style={{ color }}>{sign} {formatRupiah(transaction.amount)}</div><div className="transaction-actions mt-1 flex justify-end gap-1">
      <button type="button" onClick={() => onEdit(transaction)} aria-label="Edit transaksi" className="grid h-7 w-7 place-items-center rounded-lg text-xs transition-colors hover:bg-[var(--bg)]" style={{ color: 'var(--muted)' }}><AppIcon name="edit" /></button>
      <button type="button" onClick={() => { if (confirm('Hapus transaksi ini?')) onDelete(transaction.id); }} aria-label="Hapus transaksi" className="grid h-7 w-7 place-items-center rounded-lg text-xs transition-colors hover:bg-[var(--out-bg)]" style={{ color: 'var(--out)' }}><AppIcon name="trash" /></button>
    </div></div>
  </Card>;
}
