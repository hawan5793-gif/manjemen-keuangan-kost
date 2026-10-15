import { Card } from '../ui';
import { formatDateShort } from '../../lib/format';
import { AppIcon } from '../ui/Icons';

export function ReminderItem({ reminder, onToggleCompleted, onDelete }) {
  const recurringText = { NONE: '', MONTHLY: 'Bulanan', WEEKLY: 'Mingguan' };
  return (
    <Card className={`interactive-card mb-2 p-3.5 ${reminder.completed ? 'opacity-60' : ''}`} style={{ borderColor: reminder.completed ? 'var(--color-safe)' : 'var(--color-border)' }}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: 'var(--bg)', color: reminder.completed ? 'var(--color-safe)' : 'var(--brand)' }}><AppIcon name={reminder.completed ? 'check' : 'bell'} /></span>
        <div className="min-w-0 flex-1"><div className="font-bold text-sm">{reminder.title}{recurringText[reminder.recurring] && <span className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: 'var(--bg)', color: 'var(--muted)' }}>{recurringText[reminder.recurring]}</span>}{reminder.completed && <span className="ml-2 text-xs text-[var(--color-safe)]">Selesai</span>}</div>
          <div className="mt-1 text-xs text-[var(--muted)]">{formatDateShort(reminder.dueDate)}{reminder.category && ` · ${reminder.category}`}</div>
        </div>
        <div className="flex gap-1">
          <button type="button" onClick={() => onToggleCompleted(reminder.id)} aria-label={reminder.completed ? 'Tandai belum selesai' : 'Tandai selesai'} title={reminder.completed ? 'Tandai belum selesai' : 'Tandai selesai'} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[var(--bg)]" style={{ color: 'var(--color-safe)' }}><AppIcon name={reminder.completed ? 'arrowRight' : 'check'} /></button>
          <button type="button" onClick={() => { if (confirm('Hapus pengingat ini?')) onDelete(reminder.id); }} aria-label="Hapus pengingat" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[var(--out-bg)]" style={{ color: 'var(--out)' }}><AppIcon name="trash" /></button>
        </div>
      </div>
    </Card>
  );
}
