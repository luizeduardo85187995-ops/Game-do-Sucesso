const { test } = require('node:test');
const assert = require('node:assert/strict');
const { build } = require('esbuild');
const Module = require('module');

async function compile(entry) {
  const built = await build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', write: false, external: ['exceljs', 'pdfjs-dist'] });
  const m = new Module(process.cwd() + '/spreadsheets-test.cjs', module);
  m.filename = process.cwd() + '/spreadsheets-test.cjs'; m.paths = module.paths;
  m._compile(built.outputFiles[0].text, m.filename);
  return m.exports;
}

test('CSV: ponto-e-vírgula do Excel Brasil, aspas, BOM e vírgula', async () => {
  const r = await compile('src/utils/spreadsheetReader.ts');
  assert.deepEqual(r.parseCsv('﻿Código;Quantidade;Obs\r\nPETR4;100;"tem ; dentro"\r\n\r\nMXRF11;50;"aspas ""duplas"""\n'),
    [['Código', 'Quantidade', 'Obs'], ['PETR4', '100', 'tem ; dentro'], ['MXRF11', '50', 'aspas "duplas"']]);
  assert.deepEqual(r.parseCsv('a,b\n1,2'), [['a', 'b'], ['1', '2']]);
});

test('células do Excel viram valores simples (fórmula, texto rico, data, erro)', async () => {
  const r = await compile('src/utils/spreadsheetReader.ts');
  assert.equal(r.plainCell({ formula: 'A1*2', result: 42 }), 42);
  assert.equal(r.plainCell({ richText: [{ text: 'PE' }, { text: 'TR4' }] }), 'PETR4');
  assert.equal(r.plainCell(new Date('2026-11-05T00:00:00Z')), '2026-11-05');
  assert.equal(r.plainCell({ error: '#REF!' }), '');
  assert.equal(r.plainCell({ text: 'link', hyperlink: 'https://x' }), 'link');
  assert.equal(r.plainCell(null), '');
});

test('arquivos recusados: .xls antigo, formato desconhecido e arquivo gigante', async () => {
  const r = await compile('src/utils/spreadsheetReader.ts');
  await assert.rejects(r.readSpreadsheet(new File(['x'], 'carteira.xls')), /salve como \.xlsx/);
  await assert.rejects(r.readSpreadsheet(new File(['x'], 'carteira.ods')), /\.xlsx ou \.csv/);
  await assert.rejects(r.readSpreadsheet(new File([new Uint8Array(11 * 1024 * 1024)], 'grande.csv')), /muito grande/);
  await assert.rejects(r.readSpreadsheet(new File(['não é zip'], 'quebrada.xlsx')), /corrompido/);
});

test('exportação gera .xlsx válido que o leitor lê de volta (abas, nomes inválidos, larguras)', async () => {
  const w = await compile('src/utils/xlsxWriter.ts');
  const r = await compile('src/utils/spreadsheetReader.ts');
  const book = w.XlsxWriter.utils.book_new();
  const sheet = w.XlsxWriter.utils.aoa_to_sheet([['Categoria', 'Valor'], ['Mercado', 120.5], ['Moradia', 900]]);
  sheet['!cols'] = [{ wch: 30 }, { wch: 12 }];
  w.XlsxWriter.utils.book_append_sheet(book, sheet, '📊 Dashboard & Gráficos');
  w.XlsxWriter.utils.book_append_sheet(book, w.XlsxWriter.utils.aoa_to_sheet([['x']]), 'Nome: com/barra? e muito comprido demais');
  w.XlsxWriter.utils.book_append_sheet(book, w.XlsxWriter.utils.aoa_to_sheet([['y']]), '📊 Dashboard & Gráficos');
  const buffer = await w.buildXlsxBuffer(book);
  const sheets = await r.readSpreadsheet(new File([buffer], 'export.xlsx'));
  assert.deepEqual(sheets.map(s => s.name), ['📊 Dashboard & Gráficos', 'Nome  com barra  e muito compri', '📊 Dashboard & Gráficos 2']);
  assert.deepEqual(sheets[0].rows, [['Categoria', 'Valor'], ['Mercado', 120.5], ['Moradia', 900]]);
});

test('importação da B3 por planilha .xlsx continua identificando os ativos', async () => {
  const w = await compile('src/utils/xlsxWriter.ts');
  const b3 = await compile('src/services/b3MarketService.ts');
  const book = w.XlsxWriter.utils.book_new();
  w.XlsxWriter.utils.book_append_sheet(book, w.XlsxWriter.utils.aoa_to_sheet([
    ['Posição de custódia'],
    ['Produto', 'Instituição', 'Código de Negociação', 'Quantidade', 'Preço de Fechamento', 'Valor Atualizado'],
    ['PETR4 - PETROBRAS PN', 'XP', 'PETR4', 100, 38.5, 3850],
    ['MXRF11 - MAXI RENDA FII', 'XP', 'MXRF11', 50, 10.2, 510],
  ]), 'Ações e FIIs');
  const buffer = await w.buildXlsxBuffer(book);
  const result = await b3.parseB3File(new File([buffer], 'posicao.xlsx'));
  assert.equal(result.success, true, result.message);
  const codes = result.assets.map(a => a.code).sort();
  assert.deepEqual(codes, ['MXRF11', 'PETR4']);
  const xls = await b3.parseB3File(new File(['x'], 'posicao.xls'));
  assert.equal(xls.success, false);
  assert.match(xls.message, /\.xlsx/);
});
