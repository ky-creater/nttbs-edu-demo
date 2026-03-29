import * as XLSX from 'xlsx';

interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

interface ExcelExportOptions {
  sheetName?: string;
  columns: ExcelColumn[];
  data: Record<string, unknown>[];
  fileName: string;
}

/**
 * データをExcel(.xlsx)ファイルとしてダウンロード
 *
 * 使用例:
 * ```
 * exportToExcel({
 *   fileName: '生徒一覧.xlsx',
 *   sheetName: '生徒',
 *   columns: [
 *     { header: '氏名', key: 'name', width: 15 },
 *     { header: 'クラス', key: 'class', width: 10 },
 *   ],
 *   data: students.map(s => ({ name: s.name, class: `${s.grade}年${s.class}組` })),
 * });
 * ```
 */
export function exportToExcel({ sheetName = 'Sheet1', columns, data, fileName }: ExcelExportOptions): void {
  // ヘッダー行
  const headers = columns.map(c => c.header);

  // データ行
  const rows = data.map(row => columns.map(c => row[c.key] ?? ''));

  // ワークシート作成
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // 列幅設定
  ws['!cols'] = columns.map(c => ({ wch: c.width || 12 }));

  // ワークブック作成
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // ダウンロード
  XLSX.writeFile(wb, fileName);
}

/**
 * 2次元配列からExcelファイルを生成してダウンロード（シンプル版）
 */
export function exportArrayToExcel(data: (string | number)[][], fileName: string, sheetName = 'Sheet1'): void {
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
}
