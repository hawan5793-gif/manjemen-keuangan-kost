import { useAppStore, useSummary } from '../store/app.store';
import { DebtForm } from '../components/debts/DebtForm';
import { DebtItem } from '../components/debts/DebtItem';
import { Card } from '../components/ui';
import { formatRupiah } from '../lib/format';

export default function Debts() {
  const debts = useAppStore((state) => state.debts);
  const addDebt = useAppStore((state) => state.addDebt);
  const toggleDebtPaid = useAppStore((state) => state.toggleDebtPaid);
  const deleteDebt = useAppStore((state) => state.deleteDebt);
  const { totalDebt, totalLent } = useSummary();

  const activeDebts = debts.filter((d) => !d.paid);
  const paidDebts = debts.filter((d) => d.paid);

  return (
    <div className="screen-page debts-page"><header className="screen-heading"><h1>Utang &amp; piutang</h1><p>Catat pinjaman dengan lebih rapi.</p></header>{/* Ringkasan */}
      <div className="grid grid-cols-2 gap-3"><Card className="p-3 text-center"><div className="text-xs text-[var(--color-text-secondary)]">Saya Berutang</div><div className="font-bold text-sm text-[var(--color-danger)] mt-1">{formatRupiah(totalDebt)}
          </div></Card><Card className="p-3 text-center"><div className="text-xs text-[var(--color-text-secondary)]">Teman Berutang</div><div className="font-bold text-sm text-[var(--color-accent)] mt-1">{formatRupiah(totalLent)}
          </div></Card></div><section><DebtForm onSubmit={addDebt} /></section><section><h2 className="font-bold mb-3">Belum Lunas</h2>{activeDebts.length === 0 ? (
          <Card className="p-4 text-center text-sm text-[var(--color-text-secondary)]">Tidak ada catatan aktif.
          </Card>) : (
          activeDebts.map((debt) => (
            <DebtItem
              key={debt.id}
              debt={debt}
              onTogglePaid={toggleDebtPaid}
              onDelete={deleteDebt}
            />))
        )}
      </section>{paidDebts.length > 0 && (
        <section><h2 className="font-bold mb-3">Sudah Lunas</h2>{paidDebts.map((debt) => (
            <DebtItem
              key={debt.id}
              debt={debt}
              onTogglePaid={toggleDebtPaid}
              onDelete={deleteDebt}
            />))}
        </section>)}
    </div>);
}
