/**
 * Safe spreadsheet reading for user-uploaded files (.xlsx via exceljs, .csv parsed locally).
 * Replaces the npm "xlsx" 0.18.x package, which has unpatched prototype-pollution and ReDoS advisories.
 * Legacy binary .xls is refused with a clear message: it is the format behind most parser exploits.
 */

export type CellValue = string | number;

export interface SheetRows {
  name: string;
  rows: CellValue[][];
}

export class SpreadsheetFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SpreadsheetFormatError';
  }
}

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_ROWS = 20_000;
const MAX_COLS = 200;

/** Converts an exceljs cell value (rich text, formula, hyperlink, date...) into a plain value. */
export function plainCell(value: unknown): CellValue {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return Number.isFinite(value) ? value : '';
  if (typeof value === 'string') return value;
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : value.toISOString().slice(0, 10);
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>;
    if (Array.isArray(v.richText)) return v.richText.map((part) => (part && typeof part === 'object' ? String((part as Record<string, unknown>).text ?? '') : '')).join('');
    if ('result' in v) return plainCell(v.result);
    if (typeof v.text === 'string') return v.text;
    if ('error' in v) return '';
  }
  return '';
}

/** RFC-4180-ish CSV parser; auto-detects ';' (Excel Brasil) or ',' from the first line. */
export function parseCsv(text: string): CellValue[][] {
  const clean = text.replace(/^﻿/, '');
  const firstLine = clean.slice(0, clean.indexOf('\n') === -1 ? clean.length : clean.indexOf('\n'));
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) >= (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';
  const rows: CellValue[][] = [];
  let row: CellValue[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i];
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') { field += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else field += ch;
      continue;
    }
    if (ch === '"' && field === '') quoted = true;
    else if (ch === delimiter) { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i += 1;
      row.push(field); field = '';
      if (row.some((c) => c !== '')) rows.push(row.slice(0, MAX_COLS));
      row = [];
      if (rows.length >= MAX_ROWS) break;
    } else field += ch;
  }
  if (field !== '' || row.length) { row.push(field); if (row.some((c) => c !== '')) rows.push(row.slice(0, MAX_COLS)); }
  return rows;
}

export async function readSpreadsheet(file: File): Promise<SheetRows[]> {
  if (file.size > MAX_BYTES) throw new SpreadsheetFormatError('Arquivo muito grande (máximo 10 MB).');
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv')) return [{ name: file.name, rows: parseCsv(await file.text()) }];
  if (name.endsWith('.xls')) {
    throw new SpreadsheetFormatError('Formato .xls antigo não é aceito por segurança. Abra no Excel e salve como .xlsx ou .csv.');
  }
  if (!name.endsWith('.xlsx')) throw new SpreadsheetFormatError('Envie uma planilha .xlsx ou .csv.');

  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(await file.arrayBuffer());
  } catch {
    throw new SpreadsheetFormatError('Não foi possível ler a planilha. Verifique se o arquivo .xlsx não está corrompido.');
  }
  return workbook.worksheets.map((ws) => {
    const rows: CellValue[][] = [];
    ws.eachRow({ includeEmpty: false }, (row) => {
      if (rows.length >= MAX_ROWS) return;
      // row.values is 1-based (index 0 is empty).
      const values = Array.isArray(row.values) ? row.values.slice(1, MAX_COLS + 1) : [];
      rows.push(Array.from(values, (v) => plainCell(v)));
    });
    return { name: ws.name, rows };
  });
}
