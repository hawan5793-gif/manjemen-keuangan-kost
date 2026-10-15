import { useMemo, useState } from 'react';
import { useAppStore } from '../store/app.store';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { TransactionItem } from '../components/transactions/TransactionItem';
import { Card } from '../components/ui';
import { AppIcon } from '../components/ui/Icons';

export default function Transactions() {
  const { transactions, categories, addTransaction, updateTransaction, deleteTransaction } = useAppStore();
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('ALL');

  const handleSubmit = async (data) => {
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, data);
      setEditingTransaction(null);
    } else {
      await addTransaction(data);
    }
  };
  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const filteredTransactions = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('id');
    return [...transactions]
      .filter((item) => filter === 'ALL' || item.type === filter)
      .filter((item) => {
        if (!normalized) return true;
        const category = categories.find((entry) => entry.id === item.categoryId);
        return `${category?.name || ''} ${item.note || ''} ${item.amount}`.toLocaleLowerCase('id').includes(normalized);
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  }, [transactions, categories, filter, query]);

  return <div className="screen-page transaction-page">
    <header className="screen-heading"><h1>Transaksi</h1><p>Catat setiap rupiah dengan mudah.</p></header>
    <div className="transaction-form-wrap"><TransactionForm key={editingTransaction?.id || 'new'} categories={categories} onSubmit={handleSubmit} initialData={editingTransaction} />
      {editingTransaction && <button type="button" onClick={() => setEditingTransaction(null)} className="cancel-edit-button">Batalkan edit</button>}
    </div>
    <Card className="transaction-search-card">
      <AppIcon name="search" />
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari transaksi..." aria-label="Cari transaksi" />
      {query && <button onClick={() => setQuery('')} aria-label="Hapus pencarian"><AppIcon name="close" /></button>}
    </Card>
    <div className="transaction-filters" role="group" aria-label="Filter transaksi">
      {[['ALL', 'Semua'], ['INCOME', 'Masuk'], ['EXPENSE', 'Keluar']].map(([value, label]) => <button key={value} onClick={() => setFilter(value)} className={filter === value ? 'is-active' : ''}>{label}</button>)}
    </div>
    <section className="transaction-results">
      <p className="transaction-result-count">{filteredTransactions.length} transaksi ditemukan</p>
      {filteredTransactions.length === 0 ? <Card className="empty-state"><AppIcon name={transactions.length ? 'search' : 'receipt'} animation="beat" /><b>{transactions.length ? 'Transaksi tidak ditemukan' : 'Belum ada transaksi'}</b><span>{transactions.length ? 'Coba kata kunci atau filter yang berbeda.' : 'Catat pemasukan atau pengeluaran pertamamu.'}</span></Card> : filteredTransactions.map((item) => <TransactionItem key={item.id} transaction={item} category={categories.find((category) => category.id === item.categoryId)} onEdit={handleEdit} onDelete={deleteTransaction} />)}
    </section>
  </div>;
}
