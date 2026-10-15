import { Card } from '../ui';
import { formatRupiah, formatDateShort } from '../../lib/format';
import { AppIcon } from '../ui/Icons';

export function DebtItem({ debt, onTogglePaid, onDelete }) {
  const isOwed = debt.direction === 'BERUTANG';
  const color = isOwed ? 'var(--color-danger)' : 'var(--color-accent)';
  return (
    <Card className={`interactive-card mb-2 p-3.5 ${debt.paid ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: 'var(--bg)', color }}><AppIcon name={isOwed ? 'arrowUp' : 'arrowDown'} /></span>
        <div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{debt.friendName}{debt.paid && <span className="ml-2 text-xs font-semibold text-[var(--color-safe)]">Lunas</span>}</div><div className="text-xs text-[var(--muted)]">{isOwed ? 'Saya berutang' : 'Teman berutang'}{debt.dueDate && ` · ${formatDateShort(debt.dueDate)}`}</div></div>
        <div className="text-right"><div className="whitespace-nowrap text-sm font-extrabold tabular-nums" style={{ color }}>{formatRupiah(debt.amount)}</div><div className="mt-1 flex justify-end gap-1">
          <button type="button" onClick={() => onTogglePaid(debt.id)} aria-label={debt.paid ? 'Tandai belum lunas' : 'Tandai lunas'} title={debt.paid ? 'Tandai belum lunas' : 'Tandai lunas'} className="grid h-7 w-7 place-items-center rounded-lg text-xs hover:bg-[var(--bg)]" style={{ color: 'var(--color-safe)' }}><AppIcon name={debt.paid ? 'arrowRight' : 'check'} /></button>
          <button type="button" onClick={() => { if (confirm('Hapus catatan ini?')) onDelete(debt.id); }} aria-label="Hapus catatan" className="grid h-7 w-7 place-items-center rounded-lg text-xs hover:bg-[var(--out-bg)]" style={{ color: 'var(--out)' }}><AppIcon name="trash" /></button>
        </div></div>
      </div>
    </Card>
  );
}
