/**
 * Ekspor data transaksi ke file CSV
 * @param {Array} transactions
 * @param {Array} categories
 * @returns {string} URL blob untuk download
 */
export function exportTransactionsToCSV(transactions, categories) {
  const headers = ['Tanggal', 'Tipe', 'Kategori', 'Jumlah', 'Catatan'];
  const rows = transactions.map((t) => {
    const cat = categories.find((c) => c.id === t.categoryId);
    return [
      t.date,
      t.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
      cat?.name ?? 'Lainnya',
      t.amount,
      t.note ?? '',
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  return URL.createObjectURL(blob);
}

/**
 * Trigger download file
 * @param {string} url
 * @param {string} filename
 */
export function downloadFile(url, filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
