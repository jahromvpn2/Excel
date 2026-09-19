import { CellData, Sheet, Workbook } from '../types';
import { colIndexToName, colNameToIndex, coordToAddress } from './formulaEngine';

/**
 * Export current sheet as CSV with UTF-8 BOM so Persian text displays correctly in Excel
 */
export function exportSheetToCSV(sheet: Sheet): void {
  // Find bounding box of data
  let maxRow = 1;
  let maxCol = 0;

  for (const addr of Object.keys(sheet.cells)) {
    const match = addr.match(/^([A-Z]+)(\d+)$/);
    if (match) {
      const col = colNameToIndex(match[1]);
      const row = parseInt(match[2], 10);
      if (col > maxCol) maxCol = col;
      if (row > maxRow) maxRow = row;
    }
  }

  const rows: string[] = [];
  for (let r = 1; r <= maxRow; r++) {
    const rowValues: string[] = [];
    for (let c = 0; c <= maxCol; c++) {
      const addr = coordToAddress({ col: c, row: r });
      const cell = sheet.cells[addr];
      const val = cell?.computed !== undefined ? String(cell.computed) : (cell?.raw ?? '');
      // Escape CSV value
      const escaped = `"${val.replace(/"/g, '""')}"`;
      rowValues.push(escaped);
    }
    rows.push(rowValues.join(','));
  }

  const csvContent = '\uFEFF' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${sheet.name || 'Sheet'}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export entire workbook as JSON
 */
export function exportWorkbookJSON(workbook: Workbook): void {
  const jsonStr = JSON.stringify(workbook, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${workbook.title || 'Workbook'}.excel.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export current sheet as formatted HTML table compatible with Excel (.xls)
 */
export function exportSheetToHTMLTable(sheet: Sheet): void {
  let maxRow = 1;
  let maxCol = 0;

  for (const addr of Object.keys(sheet.cells)) {
    const match = addr.match(/^([A-Z]+)(\d+)$/);
    if (match) {
      const col = colNameToIndex(match[1]);
      const row = parseInt(match[2], 10);
      if (col > maxCol) maxCol = col;
      if (row > maxRow) maxRow = row;
    }
  }

  let tableHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8" /><style>
  table { border-collapse: collapse; font-family: 'Vazirmatn', sans-serif; }
  td { border: 1px solid #d0d7de; padding: 6px 12px; }
</style></head><body dir="${sheet.isRTL ? 'rtl' : 'ltr'}"><table>`;

  for (let r = 1; r <= maxRow; r++) {
    tableHtml += '<tr>';
    for (let c = 0; c <= maxCol; c++) {
      const addr = coordToAddress({ col: c, row: r });
      const cell = sheet.cells[addr];
      const val = cell?.computed !== undefined ? String(cell.computed) : (cell?.raw ?? '');
      const bg = cell?.bgColor ? `background-color: ${cell.bgColor};` : '';
      const color = cell?.textColor ? `color: ${cell.textColor};` : '';
      const weight = cell?.bold ? 'font-weight: bold;' : '';
      const style = [bg, color, weight].filter(Boolean).join(' ');
      tableHtml += `<td style="${style}">${val}</td>`;
    }
    tableHtml += '</tr>';
  }
  tableHtml += '</table></body></html>';

  const blob = new Blob(['\uFEFF' + tableHtml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${sheet.name || 'Sheet'}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Import CSV string into cells record
 */
export function parseCSVToCells(csvText: string): Record<string, CellData> {
  const cells: Record<string, CellData> = {};
  const clean = csvText.replace(/^\uFEFF/, '');
  const lines = clean.split(/\r?\n/);

  for (let r = 0; r < lines.length; r++) {
    const line = lines[r];
    if (!line.trim()) continue;

    // Simple CSV parser supporting quotes
    const regex = /(?:^|,)("(?:[^"]|"")*"|[^,]*)/g;
    let match;
    let col = 0;
    while ((match = regex.exec(line)) !== null) {
      if (match.index === regex.lastIndex) regex.lastIndex++;
      let val = match[1] || '';
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1).replace(/""/g, '"');
      }
      val = val.trim();
      if (val) {
        const addr = coordToAddress({ col, row: r + 1 });
        const num = Number(val);
        cells[addr] = {
          raw: val,
          computed: !isNaN(num) && val !== '' ? num : val,
          align: isNaN(num) ? 'right' : 'left',
        };
      }
      col++;
    }
  }

  return cells;
}
