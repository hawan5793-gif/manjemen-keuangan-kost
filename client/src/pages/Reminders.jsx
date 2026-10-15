import { useAppStore } from '../store/app.store';
import { ReminderForm } from '../components/reminders/ReminderForm';
import { ReminderItem } from '../components/reminders/ReminderItem';
import { Card } from '../components/ui';

export default function Reminders() {
  const reminders = useAppStore((state) => state.reminders);
  const addReminder = useAppStore((state) => state.addReminder);
  const toggleReminderCompleted = useAppStore((state) => state.toggleReminderCompleted);
  const deleteReminder = useAppStore((state) => state.deleteReminder);

  const pending = reminders.filter((r) => !r.completed);
  const done = reminders.filter((r) => r.completed);

  return (
    <div className="screen-page reminders-page"><header className="screen-heading"><h1>Pengingat tagihan</h1><p>Jangan lewatkan tanggal pembayaran.</p></header><section><ReminderForm onSubmit={addReminder} /></section><section><h2 className="font-bold mb-3">Mendatang</h2>{pending.length === 0 ? (
          <Card className="p-4 text-center text-sm text-[var(--color-text-secondary)]">Tidak ada pengingat aktif.
          </Card>) : (
          pending.map((item) => (
            <ReminderItem
              key={item.id}
              reminder={item}
              onToggleCompleted={toggleReminderCompleted}
              onDelete={deleteReminder}
            />))
        )}
      </section>{done.length > 0 && (
        <section><h2 className="font-bold mb-3">Selesai</h2>{done.map((item) => (
            <ReminderItem
              key={item.id}
              reminder={item}
              onToggleCompleted={toggleReminderCompleted}
              onDelete={deleteReminder}
            />))}
        </section>)}
    </div>);
}
