import { CellCoord, CellData } from '../types';

/**
 * Converts zero-based column index to Excel column name (0 -> A, 25 -> Z, 26 -> AA)
 */
export function colIndexToName(col: number): string {
  let name = '';
  let temp = col;
  while (temp >= 0) {
    name = String.fromCharCode((temp % 26) + 65) + name;
    temp = Math.floor(temp / 26) - 1;
  }
  return name;
}

/**
 * Converts Excel column name to zero-based column index ("A" -> 0, "Z" -> 25, "AA" -> 26)
 */
export function colNameToIndex(name: string): number {
  const upper = name.toUpperCase();
  let index = 0;
  for (let i = 0; i < upper.length; i++) {
    index = index * 26 + (upper.charCodeAt(i) - 64);
  }
  return index - 1;
}

/**
 * Converts coord to standard Excel address (col 0, row 1 -> "A1")
 */
export function coordToAddress(coord: CellCoord): string {
  return `${colIndexToName(coord.col)}${coord.row}`;
}

/**
 * Converts address to coord ("A1" -> { col: 0, row: 1 })
 */
export function addressToCoord(address: string): CellCoord | null {
  const match = address.trim().toUpperCase().match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  const col = colNameToIndex(match[1]);
  const row = parseInt(match[2], 10);
  if (isNaN(row) || col < 0) return null;
  return { col, row };
}

/**
 * Expands range like "A1:B3" into an array of cell coordinates
 */
export function expandRange(rangeStr: string): CellCoord[] {
  const parts = rangeStr.trim().toUpperCase().split(':');
  if (parts.length === 1) {
    const c = addressToCoord(parts[0]);
    return c ? [c] : [];
  }
  if (parts.length === 2) {
    const c1 = addressToCoord(parts[0]);
    const c2 = addressToCoord(parts[1]);
    if (!c1 || !c2) return [];

    const minCol = Math.min(c1.col, c2.col);
    const maxCol = Math.max(c1.col, c2.col);
    const minRow = Math.min(c1.row, c2.row);
    const maxRow = Math.max(c1.row, c2.row);

    const coords: CellCoord[] = [];
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        coords.push({ col: c, row: r });
      }
    }
    return coords;
  }
  return [];
}

/**
 * Extract numerical values from coordinates in given cells dictionary
 */
function getNumericalValues(coords: CellCoord[], cells: Record<string, CellData>): number[] {
  const nums: number[] = [];
  for (const c of coords) {
    const addr = coordToAddress(c);
    const cell = cells[addr];
    if (cell && cell.computed !== undefined && cell.computed !== null && cell.computed !== '') {
      const n = typeof cell.computed === 'number' ? cell.computed : parseFloat(String(cell.computed));
      if (!isNaN(n)) nums.push(n);
    }
  }
  return nums;
}

/**
 * Evaluates standard Excel formula string (e.g. "=SUM(A1:A5) + 10")
 */
export function evaluateFormula(
  formula: string,
  cells: Record<string, CellData>,
  currentCellAddr?: string,
  visiting = new Set<string>()
): string | number | boolean {
  if (!formula.startsWith('=')) {
    return formula;
  }

  if (currentCellAddr) {
    if (visiting.has(currentCellAddr)) {
      return '#CIRCULAR!';
    }
    visiting.add(currentCellAddr);
  }

  let expr = formula.substring(1).trim();

  try {
    // 1. Process Functions
    const funcRegex = /([A-Z_]+)\(([^()]*)\)/i;
    let iterations = 0;
    while (funcRegex.test(expr) && iterations < 30) {
      iterations++;
      expr = expr.replace(funcRegex, (_, fnName, argsStr) => {
        const fn = fnName.toUpperCase();
        const rawArgs = splitArguments(argsStr);

        return String(evalExcelFunction(fn, rawArgs, cells, visiting));
      });
    }

    // 2. Replace remaining single cell references like A1, B3 with their evaluated values
    expr = expr.replace(/\b([A-Z]+[0-9]+)\b/g, (match) => {
      const targetCell = cells[match.toUpperCase()];
      if (!targetCell) return '0';

      let val = targetCell.computed;
      if (val === undefined) {
        val = evaluateFormula(targetCell.raw || '', cells, match.toUpperCase(), new Set(visiting));
      }

      if (typeof val === 'number') return String(val);
      if (typeof val === 'boolean') return val ? '1' : '0';
      const num = parseFloat(String(val));
      if (!isNaN(num)) return String(num);
      return JSON.stringify(String(val));
    });

    // 3. String concatenation with '&'
    if (expr.includes('&')) {
      const parts = expr.split('&');
      const concatRes = parts
        .map((p) => {
          const trimmed = p.trim();
          if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
            return trimmed.slice(1, -1);
          }
          try {
            // eslint-disable-next-line no-new-func
            return Function(`"use strict"; return (${trimmed})`)();
          } catch {
            return trimmed;
          }
        })
        .join('');
      return concatRes;
    }

    // 4. Safe arithmetic evaluation
    // Sanitize string to only valid math characters
    const sanitized = expr.replace(/[^0-9+\-*/().^%<>!= ]/g, '');
    if (!sanitized.trim()) return '#VALUE!';

    // Replace power ^ with **
    const mathExpr = sanitized.replace(/\^/g, '**');

    // eslint-disable-next-line no-new-func
    const evalResult = Function(`"use strict"; return (${mathExpr})`)();

    if (typeof evalResult === 'number') {
      if (!isFinite(evalResult)) return '#DIV/0!';
      return Math.round(evalResult * 100000000) / 100000000;
    }

    return evalResult;
  } catch (err) {
    return '#ERROR!';
  } finally {
    if (currentCellAddr) visiting.delete(currentCellAddr);
  }
}

/**
 * Splits function argument string respecting quotes and nested commas
 */
function splitArguments(argsStr: string): string[] {
  const args: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';
  let parenDepth = 0;

  for (let i = 0; i < argsStr.length; i++) {
    const ch = argsStr[i];
    if ((ch === '"' || ch === "'") && !inQuotes) {
      inQuotes = true;
      quoteChar = ch;
      current += ch;
    } else if (ch === quoteChar && inQuotes) {
      inQuotes = false;
      current += ch;
    } else if (ch === '(' && !inQuotes) {
      parenDepth++;
      current += ch;
    } else if (ch === ')' && !inQuotes) {
      parenDepth--;
      current += ch;
    } else if ((ch === ',' || ch === ';') && !inQuotes && parenDepth === 0) {
      args.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim() || args.length > 0) {
    args.push(current.trim());
  }
  return args;
}

/**
 * Execute single Excel function
 */
function evalExcelFunction(
  fn: string,
  args: string[],
  cells: Record<string, CellData>,
  visiting: Set<string>
): string | number | boolean {
  // Collect all values from an argument (can be literal, cell, or range A1:B4)
  const resolveArgValues = (arg: string): (string | number | boolean)[] => {
    const trimmed = arg.trim();
    if (trimmed.includes(':')) {
      const coords = expandRange(trimmed);
      return coords.map((c) => {
        const addr = coordToAddress(c);
        const cell = cells[addr];
        if (!cell) return '';
        if (cell.computed !== undefined) return cell.computed ?? '';
        return cell.raw ?? '';
      });
    }

    const singleCoord = addressToCoord(trimmed);
    if (singleCoord) {
      const addr = coordToAddress(singleCoord);
      const cell = cells[addr];
      if (!cell) return [''];
      return [cell.computed !== undefined ? (cell.computed ?? '') : (cell.raw ?? '')];
    }

    // Literal string with quotes
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return [trimmed.slice(1, -1)];
    }

    // Literal number
    const num = parseFloat(trimmed);
    if (!isNaN(num) && String(num) === trimmed) {
      return [num];
    }

    // Boolean
    if (trimmed.toUpperCase() === 'TRUE') return [true];
    if (trimmed.toUpperCase() === 'FALSE') return [false];

    return [trimmed];
  };

  switch (fn) {
    case 'SUM': {
      let sum = 0;
      for (const arg of args) {
        const vals = resolveArgValues(arg);
        for (const v of vals) {
          const n = typeof v === 'number' ? v : parseFloat(String(v));
          if (!isNaN(n)) sum += n;
        }
      }
      return sum;
    }

    case 'AVERAGE': {
      let sum = 0;
      let count = 0;
      for (const arg of args) {
        const vals = resolveArgValues(arg);
        for (const v of vals) {
          const n = typeof v === 'number' ? v : parseFloat(String(v));
          if (!isNaN(n)) {
            sum += n;
            count++;
          }
        }
      }
      return count > 0 ? sum / count : 0;
    }

    case 'COUNT': {
      let count = 0;
      for (const arg of args) {
        const vals = resolveArgValues(arg);
        for (const v of vals) {
          const n = typeof v === 'number' ? v : parseFloat(String(v));
          if (!isNaN(n)) count++;
        }
      }
      return count;
    }

    case 'COUNTA': {
      let count = 0;
      for (const arg of args) {
        const vals = resolveArgValues(arg);
        for (const v of vals) {
          if (v !== '' && v !== null && v !== undefined) count++;
        }
      }
      return count;
    }

    case 'MIN': {
      const numbers: number[] = [];
      for (const arg of args) {
        for (const v of resolveArgValues(arg)) {
          const n = typeof v === 'number' ? v : parseFloat(String(v));
          if (!isNaN(n)) numbers.push(n);
        }
      }
      return numbers.length ? Math.min(...numbers) : 0;
    }

    case 'MAX': {
      const numbers: number[] = [];
      for (const arg of args) {
        for (const v of resolveArgValues(arg)) {
          const n = typeof v === 'number' ? v : parseFloat(String(v));
          if (!isNaN(n)) numbers.push(n);
        }
      }
      return numbers.length ? Math.max(...numbers) : 0;
    }

    case 'PRODUCT': {
      let prod = 1;
      let hasNum = false;
      for (const arg of args) {
        for (const v of resolveArgValues(arg)) {
          const n = typeof v === 'number' ? v : parseFloat(String(v));
          if (!isNaN(n)) {
            prod *= n;
            hasNum = true;
          }
        }
      }
      return hasNum ? prod : 0;
    }

    case 'ROUND': {
      const v = resolveArgValues(args[0])[0];
      const decimals = args[1] ? Number(resolveArgValues(args[1])[0]) : 0;
      const n = typeof v === 'number' ? v : parseFloat(String(v));
      if (isNaN(n)) return '#VALUE!';
      const factor = Math.pow(10, decimals);
      return Math.round(n * factor) / factor;
    }

    case 'ABS': {
      const v = resolveArgValues(args[0])[0];
      const n = typeof v === 'number' ? v : parseFloat(String(v));
      return isNaN(n) ? '#VALUE!' : Math.abs(n);
    }

    case 'SQRT': {
      const v = resolveArgValues(args[0])[0];
      const n = typeof v === 'number' ? v : parseFloat(String(v));
      if (isNaN(n) || n < 0) return '#NUM!';
      return Math.sqrt(n);
    }

    case 'POWER': {
      const b = resolveArgValues(args[0])[0];
      const p = resolveArgValues(args[1])[0];
      const base = typeof b === 'number' ? b : parseFloat(String(b));
      const exp = typeof p === 'number' ? p : parseFloat(String(p));
      return Math.pow(base, exp);
    }

    case 'IF': {
      const conditionArg = args[0];
      const trueVal = args[1] !== undefined ? resolveArgValues(args[1])[0] : true;
      const falseVal = args[2] !== undefined ? resolveArgValues(args[2])[0] : false;

      // Evaluate condition
      let condEvaluated = false;
      try {
        // eslint-disable-next-line no-new-func
        condEvaluated = Boolean(Function(`"use strict"; return (${conditionArg})`)());
      } catch {
        condEvaluated = Boolean(conditionArg);
      }
      return condEvaluated ? trueVal : falseVal;
    }

    case 'COUNTIF': {
      const range = args[0];
      const criteria = String(resolveArgValues(args[1])[0]).replace(/^"|"$/g, '');
      const coords = expandRange(range);
      let count = 0;
      for (const c of coords) {
        const val = cells[coordToAddress(c)]?.computed;
        if (matchesCriteria(val, criteria)) count++;
      }
      return count;
    }

    case 'SUMIF': {
      const range = args[0];
      const criteria = String(resolveArgValues(args[1])[0]).replace(/^"|"$/g, '');
      const sumRange = args[2] ? args[2] : range;

      const criteriaCoords = expandRange(range);
      const sumCoords = expandRange(sumRange);

      let sum = 0;
      for (let i = 0; i < criteriaCoords.length; i++) {
        const cVal = cells[coordToAddress(criteriaCoords[i])]?.computed;
        if (matchesCriteria(cVal, criteria)) {
          const sumCoord = sumCoords[i] || criteriaCoords[i];
          const sVal = cells[coordToAddress(sumCoord)]?.computed;
          const num = typeof sVal === 'number' ? sVal : parseFloat(String(sVal));
          if (!isNaN(num)) sum += num;
        }
      }
      return sum;
    }

    case 'CONCAT':
    case 'CONCATENATE': {
      let res = '';
      for (const arg of args) {
        for (const v of resolveArgValues(arg)) {
          res += String(v ?? '');
        }
      }
      return res;
    }

    case 'UPPER': {
      const val = resolveArgValues(args[0])[0];
      return String(val ?? '').toUpperCase();
    }

    case 'LOWER': {
      const val = resolveArgValues(args[0])[0];
      return String(val ?? '').toLowerCase();
    }

    case 'TRIM': {
      const val = resolveArgValues(args[0])[0];
      return String(val ?? '').trim();
    }

    case 'LEN': {
      const val = resolveArgValues(args[0])[0];
      return String(val ?? '').length;
    }

    case 'TODAY': {
      const d = new Date();
      return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
    }

    case 'NOW': {
      const d = new Date();
      return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }

    case 'VLOOKUP': {
      const lookupVal = resolveArgValues(args[0])[0];
      const tableRangeStr = args[1];
      const colIndex = parseInt(String(resolveArgValues(args[2])[0]), 10);
      const exactMatch = args[3] !== undefined ? Boolean(resolveArgValues(args[3])[0]) : true;

      const coords = expandRange(tableRangeStr);
      if (!coords.length) return '#N/A';

      const minCol = Math.min(...coords.map((c) => c.col));
      const maxCol = Math.max(...coords.map((c) => c.col));
      const minRow = Math.min(...coords.map((c) => c.row));
      const maxRow = Math.max(...coords.map((c) => c.row));

      const targetCol = minCol + colIndex - 1;
      if (targetCol > maxCol) return '#REF!';

      for (let r = minRow; r <= maxRow; r++) {
        const lookupCellAddr = coordToAddress({ col: minCol, row: r });
        const cellVal = cells[lookupCellAddr]?.computed;

        const isMatch = exactMatch
          ? String(cellVal).trim().toLowerCase() === String(lookupVal).trim().toLowerCase()
          : String(cellVal).includes(String(lookupVal));

        if (isMatch) {
          const resultAddr = coordToAddress({ col: targetCol, row: r });
          return cells[resultAddr]?.computed ?? '';
        }
      }
      return '#N/A';
    }

    default:
      return `#NAME?`;
  }
}

/**
 * Checks criteria like ">10", "<=50", "<>0", "=Text"
 */
function matchesCriteria(val: any, criteria: string): boolean {
  if (val === undefined || val === null) return false;

  const str = String(criteria).trim();
  const numVal = typeof val === 'number' ? val : parseFloat(String(val));

  if (str.startsWith('>=')) {
    const target = parseFloat(str.substring(2));
    return !isNaN(numVal) && numVal >= target;
  }
  if (str.startsWith('<=')) {
    const target = parseFloat(str.substring(2));
    return !isNaN(numVal) && numVal <= target;
  }
  if (str.startsWith('<>')) {
    const target = str.substring(2);
    return String(val).toLowerCase() !== target.toLowerCase();
  }
  if (str.startsWith('>')) {
    const target = parseFloat(str.substring(1));
    return !isNaN(numVal) && numVal > target;
  }
  if (str.startsWith('<')) {
    const target = parseFloat(str.substring(1));
    return !isNaN(numVal) && numVal < target;
  }
  if (str.startsWith('=')) {
    const target = str.substring(1);
    return String(val).toLowerCase() === target.toLowerCase();
  }

  // Exact comparison
  return String(val).toLowerCase() === str.toLowerCase();
}

/**
 * Recomputes all cells in a sheet with dependency order
 */
export function recalculateSheet(cells: Record<string, CellData>): Record<string, CellData> {
  const updated: Record<string, CellData> = {};
  const addresses = Object.keys(cells);

  // Initialize values
  for (const addr of addresses) {
    const cell = cells[addr];
    if (!cell) continue;

    if (cell.raw && cell.raw.startsWith('=')) {
      // compute later
      updated[addr] = { ...cell };
    } else {
      let computed: any = cell.raw;
      // If pure number string, parse as number
      if (cell.raw !== '' && !isNaN(Number(cell.raw))) {
        computed = Number(cell.raw);
      }
      updated[addr] = { ...cell, computed };
    }
  }

  // Multi-pass formula resolution
  for (let pass = 0; pass < 3; pass++) {
    for (const addr of addresses) {
      const cell = updated[addr];
      if (cell && cell.raw && cell.raw.startsWith('=')) {
        cell.computed = evaluateFormula(cell.raw, updated, addr);
      }
    }
  }

  return updated;
}

/**
 * Formats cell value according to type and decimals
 */
export function formatCellValue(cell?: CellData): string {
  if (!cell) return '';
  const val = cell.computed !== undefined ? cell.computed : cell.raw;
  if (val === null || val === undefined || val === '') return '';

  const format = cell.format || 'general';
  const decimals = cell.decimals !== undefined ? cell.decimals : 2;

  if (typeof val === 'number') {
    switch (format) {
      case 'currency':
        return '$' + val.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      case 'percent':
        return (val * 100).toFixed(decimals) + '%';
      case 'number':
        return val.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      default:
        return String(val);
    }
  }

  return String(val);
}
