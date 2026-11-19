/**
 * Minimal write-only replacement for the subset of the SheetJS API used by the export service
 * (book_new, aoa_to_sheet, book_append_sheet, writeFile), backed by exceljs.
 */

export interface AoaSheet {
  aoa: unknown[][];
  '!cols'?: Array<{ wch?: number }>;
}

export interface AoaBook {
  sheets: Array<{ name: string; sheet: AoaSheet }>;
}

/** Excel forbids : \ / ? * [ ] in sheet names and limits them to 31 characters; names must be unique. */
export function safeSheetName(name: string, taken: Set<string>): string {
  const base = name.replace(/[:\\/?*[\]]/g, ' ').trim().slice(0, 31) || 'Planilha';
  let candidate = base;
  for (let n = 2; taken.has(candidate.toLowerCase()); n += 1) candidate = `${base.slice(0, 31 - String(n).length - 1)} ${n}`;
  taken.add(candidate.toLowerCase());
  return candidate;
}

function cellValue(value: unknown): string | number | boolean | Date | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean' || value instanceof Date) return value;
  return String(value);
}

export async function buildXlsxBuffer(book: AoaBook): Promise<ArrayBuffer> {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  const taken = new Set<string>();
  for (const { name, sheet } of book.sheets) {
    const ws = wb.addWorksheet(safeSheetName(name, taken));
    ws.addRows(sheet.aoa.map((row) => (Array.isArray(row) ? row.map(cellValue) : [])));
    sheet['!cols']?.forEach((col, i) => {
      if (col?.wch) ws.getColumn(i + 1).width = col.wch;
    });
  }
  return wb.xlsx.writeBuffer() as Promise<ArrayBuffer>;
}

export const XlsxWriter = {
  utils: {
    book_new: (): AoaBook => ({ sheets: [] }),
    aoa_to_sheet: (aoa: unknown[][]): AoaSheet => ({ aoa }),
    book_append_sheet: (book: AoaBook, sheet: AoaSheet, name: string): void => { book.sheets.push({ name, sheet }); },
  },
  async writeFile(book: AoaBook, fileName: string): Promise<void> {
    const buffer = await buildXlsxBuffer(book);
    const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    }
  },
};
