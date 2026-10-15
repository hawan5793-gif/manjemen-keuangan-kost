import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

/**
 * Format angka ke Rupiah: 1250000 → Rp1.250.000
 */
export function formatRupiah(amount) {
  if (amount == null || isNaN(amount)) return 'Rp0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format tanggal pendek: 2026-10-09 → 9 Okt 2026
 */
export function formatDateShort(dateStr) {
  if (!dateStr) return '-';
  try {
    return format(parseISO(dateStr), 'd MMM yyyy', { locale: idLocale });
  } catch {
    return dateStr;
  }
}

/**
 * Format tanggal lengkap: 2026-10-09 → Kamis, 9 Oktober 2026
 */
export function formatDateLong(dateStr) {
  if (!dateStr) return '-';
  try {
    return format(parseISO(dateStr), 'EEEE, d MMMM yyyy', { locale: idLocale });
  } catch {
    return dateStr;
  }
}

/**
 * Format bulan: 2026-10 → Oktober 2026
 */
export function formatMonth(monthStr) {
  if (!monthStr) return '-';
  try {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, month - 1);
    return format(date, 'MMMM yyyy', { locale: idLocale });
  } catch {
    return monthStr;
  }
}

/**
 * Dapatkan string bulan sekarang: YYYY-MM
 */
export function getCurrentMonth() {
  return format(new Date(), 'yyyy-MM');
}

/**
 * Dapatkan tanggal hari ini: YYYY-MM-DD
 */
export function getToday() {
  return format(new Date(), 'yyyy-MM-dd');
}
