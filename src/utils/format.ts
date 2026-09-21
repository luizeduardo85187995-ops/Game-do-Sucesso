export function formatBRL(value: number): string {
  if (!Number.isFinite(value)) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parseBRLNumber(input: string): number {
  if (!input) return 0;
  const cleaned = input
    .replace(/\s/g, '')
    .replace(/R\$/gi, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const value = parseFloat(cleaned);
  return Number.isFinite(value) ? value : 0;
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDateBR(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function monthKey(iso: string): string {
  return iso ? iso.slice(0, 7) : todayISO().slice(0, 7);
}

export function monthLabel(key: string): string {
  const parts = key.split('-');
  if (parts.length < 2) return key;
  const m = parseInt(parts[1], 10);
  const labels = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${labels[m - 1] || ''} ${parts[0]}`;
}
