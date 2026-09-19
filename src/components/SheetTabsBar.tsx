import React, { useState } from 'react';
import { Plus, MoreVertical, Trash2, Copy, Edit2, Palette } from 'lucide-react';
import { Sheet, SelectionRange, CellCoord } from '../types';
import { coordToAddress } from '../utils/formulaEngine';

interface SheetTabsBarProps {
  sheets: Sheet[];
  activeSheetId: string;
  onSelectSheet: (id: string) => void;
  onAddSheet: () => void;
  onRenameSheet: (id: string, newName: string) => void;
  onDuplicateSheet: (id: string) => void;
  onDeleteSheet: (id: string) => void;
  onColorChange: (id: string, color: string) => void;
  activeCell: CellCoord;
  selectionRange: SelectionRange | null;
  activeSheet: Sheet;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export const SheetTabsBar: React.FC<SheetTabsBarProps> = ({
  sheets,
  activeSheetId,
  onSelectSheet,
  onAddSheet,
  onRenameSheet,
  onDuplicateSheet,
  onDeleteSheet,
  onColorChange,
  activeCell,
  selectionRange,
  activeSheet,
  zoom,
  onZoomChange,
}) => {
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [menuSheetId, setMenuSheetId] = useState<string | null>(null);

  const startRenaming = (sheet: Sheet) => {
    setEditingSheetId(sheet.id);
    setEditingName(sheet.name);
    setMenuSheetId(null);
  };

  const commitRename = (id: string) => {
    if (editingName.trim()) {
      onRenameSheet(id, editingName.trim());
    }
    setEditingSheetId(null);
  };

  // Calculate live statistics for selected cells
  const stats = React.useMemo(() => {
    const minCol = selectionRange
      ? Math.min(selectionRange.start.col, selectionRange.end.col)
      : activeCell.col;
    const maxCol = selectionRange
      ? Math.max(selectionRange.start.col, selectionRange.end.col)
      : activeCell.col;
    const minRow = selectionRange
      ? Math.min(selectionRange.start.row, selectionRange.end.row)
      : activeCell.row;
    const maxRow = selectionRange
      ? Math.max(selectionRange.start.row, selectionRange.end.row)
      : activeCell.row;

    let count = 0;
    let sum = 0;
    let numCount = 0;

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const addr = coordToAddress({ col: c, row: r });
        const cell = activeSheet.cells[addr];
        if (cell && cell.raw !== '' && cell.raw !== undefined) {
          count++;
          const num =
            typeof cell.computed === 'number'
              ? cell.computed
              : parseFloat(String(cell.computed ?? ''));
          if (!isNaN(num)) {
            sum += num;
            numCount++;
          }
        }
      }
    }

    const average = numCount > 0 ? sum / numCount : 0;
    return { count, numCount, sum, average };
  }, [selectionRange, activeCell, activeSheet]);

  return (
    <div className="bg-[#f3f2f1] border-t border-[#d2d0ce] flex items-center justify-between text-xs select-none shrink-0 h-8 px-2">
      {/* Sheet Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
        <button
          onClick={onAddSheet}
          title="افزودن کاربرگ جدید (+)"
          className="p-1 hover:bg-slate-300 rounded text-slate-700 transition-colors flex items-center justify-center shrink-0"
        >
          <Plus className="w-3.5 h-3.5 font-bold" />
        </button>

        <div className="flex items-center gap-1">
          {sheets.map((sheet) => {
            const isActive = sheet.id === activeSheetId;

            return (
              <div key={sheet.id} className="relative flex items-center">
                {editingSheetId === sheet.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => commitRename(sheet.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename(sheet.id);
                      if (e.key === 'Escape') setEditingSheetId(null);
                    }}
                    autoFocus
                    className="px-2 py-0.5 text-xs border border-emerald-600 rounded bg-white text-slate-900 outline-none w-28"
                  />
                ) : (
                  <div
                    onClick={() => onSelectSheet(sheet.id)}
                    onDoubleClick={() => startRenaming(sheet)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setMenuSheetId(menuSheetId === sheet.id ? null : sheet.id);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-t border-t border-r border-l text-xs cursor-pointer transition-all ${
                      isActive
                        ? 'bg-white border-[#d2d0ce] text-[#107c41] font-bold shadow-xs'
                        : 'bg-[#f3f2f1] border-transparent text-slate-600 hover:bg-slate-200'
                    }`}
                    style={{
                      borderBottom: isActive
                        ? `3px solid ${sheet.tabColor || '#107c41'}`
                        : 'none',
                    }}
                  >
                    <span>{sheet.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuSheetId(menuSheetId === sheet.id ? null : sheet.id);
                      }}
                      className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600"
                    >
                      <MoreVertical className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Sheet Context Menu */}
                {menuSheetId === sheet.id && (
                  <div
                    className="absolute bottom-full mb-1 right-0 bg-white border border-slate-200 shadow-xl rounded p-1 w-40 z-50 text-xs"
                    onClick={() => setMenuSheetId(null)}
                  >
                    <button
                      onClick={() => startRenaming(sheet)}
                      className="w-full text-right px-2.5 py-1.5 hover:bg-slate-100 rounded flex items-center gap-2"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>تغییر نام کاربرگ</span>
                    </button>
                    <button
                      onClick={() => onDuplicateSheet(sheet.id)}
                      className="w-full text-right px-2.5 py-1.5 hover:bg-slate-100 rounded flex items-center gap-2"
                    >
                      <Copy className="w-3.5 h-3.5 text-purple-600" />
                      <span>ایجاد نسخه مشابه</span>
                    </button>
                    {sheets.length > 1 && (
                      <button
                        onClick={() => onDeleteSheet(sheet.id)}
                        className="w-full text-right px-2.5 py-1.5 hover:bg-red-50 text-red-600 rounded flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف کاربرگ</span>
                      </button>
                    )}
                    <div className="p-1 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">رنگ تب:</span>
                      <div className="flex items-center gap-1">
                        {['#107c41', '#0d6efd', '#dc3545', '#ffc107', '#6f42c1'].map((c) => (
                          <div
                            key={c}
                            onClick={() => onColorChange(sheet.id, c)}
                            style={{ backgroundColor: c }}
                            className="w-3.5 h-3.5 rounded-full cursor-pointer hover:scale-110"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Bar & Quick Stats */}
      <div className="flex items-center gap-3 text-[11px] text-slate-600 shrink-0">
        <span className="text-emerald-700 font-semibold hidden md:inline">
          آماده
        </span>

        {/* Live Selection Stats */}
        {stats.count > 0 && (
          <div className="hidden sm:flex items-center gap-2 bg-slate-200/70 px-2 py-0.5 rounded font-mono">
            {stats.numCount > 0 && (
              <>
                <span>
                  میانگین:{' '}
                  <b className="text-slate-900">
                    {stats.average.toLocaleString('en-US', {
                      maximumFractionDigits: 2,
                    })}
                  </b>
                </span>
                <span className="text-slate-400">|</span>
              </>
            )}
            <span>
              تعداد: <b className="text-slate-900">{stats.count}</b>
            </span>
            {stats.numCount > 0 && (
              <>
                <span className="text-slate-400">|</span>
                <span>
                  مجموع:{' '}
                  <b className="text-slate-900">
                    {stats.sum.toLocaleString('en-US', {
                      maximumFractionDigits: 2,
                    })}
                  </b>
                </span>
              </>
            )}
          </div>
        )}

        {/* Zoom Slider */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onZoomChange(Math.max(0.5, zoom - 0.1))}
            className="w-4 h-4 flex items-center justify-center hover:bg-slate-300 rounded font-bold"
          >
            -
          </button>
          <span className="w-9 text-center font-mono font-medium">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => onZoomChange(Math.min(2.0, zoom + 0.1))}
            className="w-4 h-4 flex items-center justify-center hover:bg-slate-300 rounded font-bold"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};
