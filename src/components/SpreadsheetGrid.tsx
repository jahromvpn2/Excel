import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CellCoord, CellData, SelectionRange, Sheet } from '../types';
import {
  colIndexToName,
  coordToAddress,
  formatCellValue,
  addressToCoord,
} from '../utils/formulaEngine';

interface SpreadsheetGridProps {
  sheet: Sheet;
  activeCell: CellCoord;
  selectionRange: SelectionRange | null;
  onActiveCellChange: (coord: CellCoord) => void;
  onSelectionRangeChange: (range: SelectionRange | null) => void;
  onCellUpdate: (address: string, updates: Partial<CellData>) => void;
  onFillRange: (sourceRange: SelectionRange, targetEnd: CellCoord) => void;
  showGridLines: boolean;
  showHeaders: boolean;
  zoom: number;
}

const DEFAULT_COL_WIDTH = 90;
const DEFAULT_ROW_HEIGHT = 25;
const VISIBLE_COLS_COUNT = 26; // A to Z
const VISIBLE_ROWS_COUNT = 60; // 1 to 60

export const SpreadsheetGrid: React.FC<SpreadsheetGridProps> = ({
  sheet,
  activeCell,
  selectionRange,
  onActiveCellChange,
  onSelectionRangeChange,
  onCellUpdate,
  onFillRange,
  showGridLines,
  showHeaders,
  zoom,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isFillDragging, setIsFillDragging] = useState(false);
  const [fillTargetCoord, setFillTargetCoord] = useState<CellCoord | null>(null);

  // Column resizing state
  const [resizingCol, setResizingCol] = useState<number | null>(null);
  const [resizeStartX, setResizeStartX] = useState<number>(0);
  const [resizeStartWidth, setResizeStartWidth] = useState<number>(DEFAULT_COL_WIDTH);
  const [colWidths, setColWidths] = useState<Record<number, number>>(sheet.colWidths || {});

  const gridContainerRef = useRef<HTMLDivElement>(null);
  const editorInputRef = useRef<HTMLInputElement>(null);

  // Synchronize colWidths from sheet
  useEffect(() => {
    setColWidths(sheet.colWidths || {});
  }, [sheet.colWidths]);

  const getColWidth = useCallback(
    (col: number) => colWidths[col] || DEFAULT_COL_WIDTH,
    [colWidths]
  );

  const getRowHeight = useCallback(
    (row: number) => sheet.rowHeights?.[row] || DEFAULT_ROW_HEIGHT,
    [sheet.rowHeights]
  );

  // Current active address
  const activeAddress = coordToAddress(activeCell);
  const activeCellData = sheet.cells[activeAddress];

  // Normalized selection bounding box
  const normalizedRange = React.useMemo(() => {
    if (!selectionRange) {
      return {
        minCol: activeCell.col,
        maxCol: activeCell.col,
        minRow: activeCell.row,
        maxRow: activeCell.row,
      };
    }
    return {
      minCol: Math.min(selectionRange.start.col, selectionRange.end.col),
      maxCol: Math.max(selectionRange.start.col, selectionRange.end.col),
      minRow: Math.min(selectionRange.start.row, selectionRange.end.row),
      maxRow: Math.max(selectionRange.start.row, selectionRange.end.row),
    };
  }, [selectionRange, activeCell]);

  // Focus editor when editing starts
  useEffect(() => {
    if (isEditing && editorInputRef.current) {
      editorInputRef.current.focus();
      editorInputRef.current.select();
    }
  }, [isEditing]);

  const startEditing = (initialVal?: string) => {
    const current = activeCellData?.raw ?? '';
    setEditValue(initialVal !== undefined ? initialVal : current);
    setIsEditing(true);
  };

  const commitEdit = () => {
    if (isEditing) {
      onCellUpdate(activeAddress, { raw: editValue });
      setIsEditing(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  // Keyboard navigation & Shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing) {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitEdit();
        // Move to next row
        onActiveCellChange({ col: activeCell.col, row: activeCell.row + 1 });
        onSelectionRangeChange(null);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        commitEdit();
        onActiveCellChange({
          col: e.shiftKey ? Math.max(0, activeCell.col - 1) : activeCell.col + 1,
          row: activeCell.row,
        });
        onSelectionRangeChange(null);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      }
      return;
    }

    // Grid Navigation when not editing
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newRow = Math.max(1, activeCell.row - 1);
      if (e.shiftKey) {
        const start = selectionRange ? selectionRange.start : activeCell;
        onSelectionRangeChange({ start, end: { col: activeCell.col, row: newRow } });
      } else {
        onActiveCellChange({ col: activeCell.col, row: newRow });
        onSelectionRangeChange(null);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newRow = activeCell.row + 1;
      if (e.shiftKey) {
        const start = selectionRange ? selectionRange.start : activeCell;
        onSelectionRangeChange({ start, end: { col: activeCell.col, row: newRow } });
      } else {
        onActiveCellChange({ col: activeCell.col, row: newRow });
        onSelectionRangeChange(null);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      // In RTL, left arrow might mean increasing or decreasing depending on convention
      const delta = sheet.isRTL ? 1 : -1;
      const newCol = Math.max(0, activeCell.col + delta);
      if (e.shiftKey) {
        const start = selectionRange ? selectionRange.start : activeCell;
        onSelectionRangeChange({ start, end: { col: newCol, row: activeCell.row } });
      } else {
        onActiveCellChange({ col: newCol, row: activeCell.row });
        onSelectionRangeChange(null);
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const delta = sheet.isRTL ? -1 : 1;
      const newCol = Math.max(0, activeCell.col + delta);
      if (e.shiftKey) {
        const start = selectionRange ? selectionRange.start : activeCell;
        onSelectionRangeChange({ start, end: { col: newCol, row: activeCell.row } });
      } else {
        onActiveCellChange({ col: newCol, row: activeCell.row });
        onSelectionRangeChange(null);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      startEditing();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const newCol = e.shiftKey ? Math.max(0, activeCell.col - 1) : activeCell.col + 1;
      onActiveCellChange({ col: newCol, row: activeCell.row });
      onSelectionRangeChange(null);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      // Clear cells in range
      for (let r = normalizedRange.minRow; r <= normalizedRange.maxRow; r++) {
        for (let c = normalizedRange.minCol; c <= normalizedRange.maxCol; c++) {
          onCellUpdate(coordToAddress({ col: c, row: r }), { raw: '', computed: '' });
        }
      }
    } else if (e.key === 'F2') {
      e.preventDefault();
      startEditing();
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Typing starts editing immediately
      startEditing(e.key);
    }
  };

  // Mouse Handlers for selection
  const handleCellMouseDown = (col: number, row: number, e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only primary button
    if (isEditing) commitEdit();

    setIsMouseDown(true);
    const clickedCoord = { col, row };

    if (e.shiftKey) {
      onSelectionRangeChange({ start: activeCell, end: clickedCoord });
    } else {
      onActiveCellChange(clickedCoord);
      onSelectionRangeChange(null);
    }
  };

  const handleCellMouseEnter = (col: number, row: number) => {
    if (isMouseDown && !isFillDragging) {
      onSelectionRangeChange({ start: activeCell, end: { col, row } });
    } else if (isFillDragging) {
      setFillTargetCoord({ col, row });
    }
  };

  const handleMouseUp = () => {
    if (isFillDragging && fillTargetCoord) {
      onFillRange(
        selectionRange || { start: activeCell, end: activeCell },
        fillTargetCoord
      );
      setIsFillDragging(false);
      setFillTargetCoord(null);
    }
    setIsMouseDown(false);
    if (resizingCol !== null) {
      setResizingCol(null);
    }
  };

  // Column Resizing handlers
  const handleColResizeMouseDown = (colIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingCol(colIndex);
    setResizeStartX(e.clientX);
    setResizeStartWidth(getColWidth(colIndex));
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingCol !== null) {
        const delta = (e.clientX - resizeStartX) * (sheet.isRTL ? -1 : 1);
        const newWidth = Math.max(40, resizeStartWidth + delta);
        setColWidths((prev) => ({ ...prev, [resizingCol]: newWidth }));
      }
    };

    const handleGlobalMouseUp = () => {
      if (resizingCol !== null) {
        setResizingCol(null);
      }
      setIsMouseDown(false);
      if (isFillDragging && fillTargetCoord) {
        onFillRange(
          selectionRange || { start: activeCell, end: activeCell },
          fillTargetCoord
        );
        setIsFillDragging(false);
        setFillTargetCoord(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [resizingCol, resizeStartX, resizeStartWidth, sheet.isRTL, isFillDragging, fillTargetCoord, onFillRange, selectionRange, activeCell]);

  return (
    <div
      ref={gridContainerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseUp={handleMouseUp}
      dir={sheet.isRTL ? 'rtl' : 'ltr'}
      className="flex-1 overflow-auto bg-[#e1dfdd] select-none focus:outline-none relative"
      style={{ transform: `scale(${zoom})`, transformOrigin: sheet.isRTL ? 'top right' : 'top left' }}
    >
      <div className="inline-block min-w-full bg-white">
        {/* Table Header Row (Column Letters A, B, C...) */}
        {showHeaders && (
          <div className="sticky top-0 z-20 flex bg-[#f3f2f1] border-b border-[#d2d0ce] text-xs font-semibold text-slate-600 shadow-xs">
            {/* Top-Left Corner Select All */}
            <div className="w-12 h-6 border-r border-[#d2d0ce] bg-[#e1dfdd] flex items-center justify-center shrink-0 cursor-pointer hover:bg-slate-300">
              <div className="w-2.5 h-2.5 bg-slate-400 rotate-45" />
            </div>

            {/* Column Headers */}
            {Array.from({ length: VISIBLE_COLS_COUNT }).map((_, col) => {
              const colName = colIndexToName(col);
              const isColSelected =
                col >= normalizedRange.minCol && col <= normalizedRange.maxCol;

              return (
                <div
                  key={col}
                  style={{ width: getColWidth(col) }}
                  onClick={() => {
                    onActiveCellChange({ col, row: 1 });
                    onSelectionRangeChange({
                      start: { col, row: 1 },
                      end: { col, row: VISIBLE_ROWS_COUNT },
                    });
                  }}
                  className={`h-6 flex items-center justify-center border-r border-[#d2d0ce] relative shrink-0 cursor-pointer transition-colors ${
                    isColSelected
                      ? 'bg-[#107c41] text-white font-bold'
                      : 'hover:bg-[#eae8e6]'
                  }`}
                >
                  <span>{colName}</span>

                  {/* Column Resizer Handle */}
                  <div
                    onMouseDown={(e) => handleColResizeMouseDown(col, e)}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-emerald-600 z-30"
                    title="تغییر عرض ستون"
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Rows & Grid Cells */}
        <div className="flex flex-col">
          {Array.from({ length: VISIBLE_ROWS_COUNT }).map((_, rowIdx) => {
            const row = rowIdx + 1;
            const isRowSelected =
              row >= normalizedRange.minRow && row <= normalizedRange.maxRow;

            return (
              <div key={row} className="flex" style={{ height: getRowHeight(row) }}>
                {/* Row Header Number */}
                {showHeaders && (
                  <div
                    style={{ height: getRowHeight(row) }}
                    onClick={() => {
                      onActiveCellChange({ col: 0, row });
                      onSelectionRangeChange({
                        start: { col: 0, row },
                        end: { col: VISIBLE_COLS_COUNT - 1, row },
                      });
                    }}
                    className={`w-12 sticky ${sheet.isRTL ? 'right-0' : 'left-0'} z-10 flex items-center justify-center border-b border-r border-[#d2d0ce] text-xs font-semibold shrink-0 cursor-pointer select-none transition-colors ${
                      isRowSelected
                        ? 'bg-[#107c41] text-white font-bold'
                        : 'bg-[#f3f2f1] text-slate-600 hover:bg-[#eae8e6]'
                    }`}
                  >
                    <span>{row}</span>
                  </div>
                )}

                {/* Cells in Row */}
                {Array.from({ length: VISIBLE_COLS_COUNT }).map((_, col) => {
                  const addr = coordToAddress({ col, row });
                  const cell = sheet.cells[addr];
                  const isActive = activeCell.col === col && activeCell.row === row;
                  const isInRange =
                    col >= normalizedRange.minCol &&
                    col <= normalizedRange.maxCol &&
                    row >= normalizedRange.minRow &&
                    row <= normalizedRange.maxRow;

                  const isRangeBottomRight =
                    col === normalizedRange.maxCol && row === normalizedRange.maxRow;

                  const displayVal = formatCellValue(cell);

                  // Border styling
                  const borderClasses = showGridLines
                    ? 'border-r border-b border-[#e1dfdd]'
                    : 'border-r border-b border-transparent';

                  // Custom styles
                  const customStyle: React.CSSProperties = {
                    width: getColWidth(col),
                    height: getRowHeight(row),
                    fontWeight: cell?.bold ? 'bold' : 'normal',
                    fontStyle: cell?.italic ? 'italic' : 'normal',
                    textDecoration: [
                      cell?.underline ? 'underline' : '',
                      cell?.strikethrough ? 'line-through' : '',
                    ]
                      .filter(Boolean)
                      .join(' '),
                    fontSize: cell?.fontSize ? `${cell.fontSize}px` : '12px',
                    color: cell?.textColor || '#1f2937',
                    backgroundColor: cell?.bgColor || (isInRange ? '#107c4115' : '#ffffff'),
                    textAlign: cell?.align || (typeof cell?.computed === 'number' ? 'left' : 'right'),
                    borderTop: cell?.borderTop ? '2px solid #212529' : undefined,
                    borderBottom: cell?.borderBottom ? '2px solid #212529' : undefined,
                    borderLeft: cell?.borderLeft ? '2px solid #212529' : undefined,
                    borderRight: cell?.borderRight ? '2px solid #212529' : undefined,
                  };

                  return (
                    <div
                      key={addr}
                      style={customStyle}
                      onMouseDown={(e) => handleCellMouseDown(col, row, e)}
                      onMouseEnter={() => handleCellMouseEnter(col, row)}
                      onDoubleClick={() => startEditing()}
                      className={`relative flex items-center px-1.5 text-xs select-none transition-colors ${borderClasses} ${
                        isActive
                          ? 'outline-2 outline-[#107c41] -outline-offset-1 z-20 shadow-xs'
                          : isInRange
                          ? 'bg-emerald-50/50'
                          : ''
                      } ${cell?.wrapText ? 'whitespace-normal break-words' : 'whitespace-nowrap overflow-hidden'}`}
                    >
                      {/* Active In-Cell Editor */}
                      {isActive && isEditing ? (
                        <input
                          ref={editorInputRef}
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={commitEdit}
                          dir="auto"
                          className="absolute inset-0 w-full h-full px-1.5 py-0 border-none outline-none font-mono text-xs bg-white text-slate-900 z-30 shadow-md"
                        />
                      ) : (
                        <span className="truncate w-full block">
                          {displayVal}
                        </span>
                      )}

                      {/* Excel Fill Handle (small green square at bottom right of selection) */}
                      {(isActive || isRangeBottomRight) && !isEditing && (
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setIsFillDragging(true);
                          }}
                          title="AutoFill (بکشید تا فرمول یا داده خودکار کپی شود)"
                          className={`absolute ${
                            sheet.isRTL ? 'left-[-3px]' : 'right-[-3px]'
                          } bottom-[-3px] w-2 h-2 bg-[#107c41] border border-white cursor-crosshair z-30 hover:scale-125 transition-transform`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
