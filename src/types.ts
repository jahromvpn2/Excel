export type NumberFormatType = 'general' | 'number' | 'currency' | 'percent' | 'date' | 'text';

export type HorizontalAlign = 'left' | 'center' | 'right';
export type VerticalAlign = 'top' | 'middle' | 'bottom';

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  bgColor?: string;
  align?: HorizontalAlign;
  verticalAlign?: VerticalAlign;
  wrapText?: boolean;
  borderTop?: boolean;
  borderBottom?: boolean;
  borderLeft?: boolean;
  borderRight?: boolean;
  borderColor?: string;
}

export interface CellData extends CellStyle {
  raw: string; // User entered value or formula (e.g. "=SUM(A1:A5)" or "25000")
  computed?: string | number | boolean | null; // Evaluated result
  format?: NumberFormatType;
  decimals?: number;
}

export interface CellCoord {
  col: number; // 0 = A, 1 = B, etc.
  row: number; // 1 = 1st row, 2 = 2nd row, etc.
}

export interface SelectionRange {
  start: CellCoord;
  end: CellCoord;
}

export interface Sheet {
  id: string;
  name: string;
  cells: Record<string, CellData>; // keyed by standard address, e.g. "A1", "B12"
  colWidths: Record<number, number>; // colIndex -> width in px
  rowHeights: Record<number, number>; // rowIndex -> height in px
  tabColor?: string;
  showGridLines?: boolean;
  showHeaders?: boolean;
  isRTL?: boolean;
}

export interface Workbook {
  title: string;
  sheets: Sheet[];
  activeSheetId: string;
  updatedAt: number;
}

export type RibbonTab = 'home' | 'insert' | 'pageLayout' | 'formulas' | 'data' | 'view' | 'ai';

export interface ChartConfig {
  id: string;
  title: string;
  type: 'bar' | 'column' | 'line' | 'pie' | 'doughnut' | 'area';
  dataRange: string; // e.g. "A1:B6"
  hasHeaders: boolean;
  themeColor: string;
}

export interface FormulaHelp {
  name: string;
  syntax: string;
  category: 'Math' | 'Logical' | 'Text' | 'Date' | 'Lookup' | 'Statistical';
  descriptionFa: string;
  descriptionEn: string;
  example: string;
}
