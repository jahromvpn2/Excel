/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RibbonHeader } from './components/RibbonHeader';
import { FormulaBar } from './components/FormulaBar';
import { SpreadsheetGrid } from './components/SpreadsheetGrid';
import { SheetTabsBar } from './components/SheetTabsBar';
import { FunctionWizardModal } from './components/FunctionWizardModal';
import { ChartsPanel } from './components/ChartsPanel';
import { AICopilotDrawer } from './components/AICopilotDrawer';
import { FindReplaceModal } from './components/FindReplaceModal';
import { TemplatesModal } from './components/TemplatesModal';
import {
  CellCoord,
  CellData,
  CellStyle,
  FormulaHelp,
  NumberFormatType,
  RibbonTab,
  SelectionRange,
  Sheet,
  Workbook,
} from './types';
import {
  coordToAddress,
  addressToCoord,
  colIndexToName,
  recalculateSheet,
  colNameToIndex,
} from './utils/formulaEngine';
import {
  createBudgetTemplate,
  createEmptySheet,
} from './utils/templates';
import {
  exportSheetToCSV,
  exportSheetToHTMLTable,
  exportWorkbookJSON,
  parseCSVToCells,
} from './utils/exportImport';

export default function App() {
  // Initialize workbook with pre-populated Budget template
  const [workbook, setWorkbook] = useState<Workbook>(() => {
    const initialSheet = createBudgetTemplate();
    return {
      title: 'کاربرگ بودجه و امور مالی',
      sheets: [initialSheet],
      activeSheetId: initialSheet.id,
      updatedAt: Date.now(),
    };
  });

  // Undo / Redo history
  const [history, setHistory] = useState<Sheet[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Active navigation & selection
  const [activeTab, setActiveTab] = useState<RibbonTab>('home');
  const [activeCell, setActiveCell] = useState<CellCoord>({ col: 1, row: 3 }); // B3
  const [selectionRange, setSelectionRange] = useState<SelectionRange | null>(null);
  const [zoom, setZoom] = useState<number>(1.0);

  // Modals visibility
  const [isFunctionWizardOpen, setIsFunctionWizardOpen] = useState(false);
  const [isChartsOpen, setIsChartsOpen] = useState(false);
  const [isAICopilotOpen, setIsAICopilotOpen] = useState(false);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

  // Hidden file input for import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active sheet reference
  const activeSheet =
    workbook.sheets.find((s) => s.id === workbook.activeSheetId) || workbook.sheets[0];

  const activeAddress = coordToAddress(activeCell);
  const activeCellData = activeSheet.cells[activeAddress];

  // Helper to record history before making changes
  const pushHistory = useCallback((sheets: Sheet[]) => {
    setHistory((prev) => {
      const next = prev.slice(0, historyIndex + 1);
      return [...next, JSON.parse(JSON.stringify(sheets))];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const targetSheets = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setWorkbook((prev) => ({
        ...prev,
        sheets: JSON.parse(JSON.stringify(targetSheets)),
      }));
    }
  };

  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const targetSheets = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setWorkbook((prev) => ({
        ...prev,
        sheets: JSON.parse(JSON.stringify(targetSheets)),
      }));
    }
  };

  // Cell updates
  const handleCellUpdate = (address: string, updates: Partial<CellData>) => {
    setWorkbook((prev) => {
      pushHistory(prev.sheets);

      const updatedSheets = prev.sheets.map((sheet) => {
        if (sheet.id !== prev.activeSheetId) return sheet;

        const currentCell = sheet.cells[address] || { raw: '' };
        const updatedCells = {
          ...sheet.cells,
          [address]: { ...currentCell, ...updates },
        };

        const recalculated = recalculateSheet(updatedCells);
        return { ...sheet, cells: recalculated };
      });

      return { ...prev, sheets: updatedSheets, updatedAt: Date.now() };
    });
  };

  // Style change applied to active cell or entire selection range
  const handleStyleChange = (styleUpdates: Partial<CellStyle>) => {
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

    setWorkbook((prev) => {
      pushHistory(prev.sheets);

      const updatedSheets = prev.sheets.map((sheet) => {
        if (sheet.id !== prev.activeSheetId) return sheet;

        const newCells = { ...sheet.cells };
        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            const addr = coordToAddress({ col: c, row: r });
            const curr = newCells[addr] || { raw: '' };
            newCells[addr] = { ...curr, ...styleUpdates };
          }
        }

        return { ...sheet, cells: newCells };
      });

      return { ...prev, sheets: updatedSheets };
    });
  };

  // Number format change
  const handleFormatChange = (format: NumberFormatType) => {
    handleStyleChange({ ...activeCellData, format } as any);
  };

  // Decimal places change
  const handleDecimalsChange = (delta: number) => {
    const current = activeCellData?.decimals !== undefined ? activeCellData.decimals : 2;
    const next = Math.max(0, Math.min(6, current + delta));
    handleStyleChange({ decimals: next } as any);
  };

  // Insert Row
  const handleInsertRow = () => {
    const targetRow = activeCell.row;
    setWorkbook((prev) => {
      pushHistory(prev.sheets);

      const updatedSheets = prev.sheets.map((sheet) => {
        if (sheet.id !== prev.activeSheetId) return sheet;

        const newCells: Record<string, CellData> = {};
        for (const [addr, cell] of Object.entries(sheet.cells)) {
          const coord = addressToCoord(addr);
          if (!coord) continue;
          if (coord.row >= targetRow) {
            newCells[coordToAddress({ col: coord.col, row: coord.row + 1 })] = cell;
          } else {
            newCells[addr] = cell;
          }
        }
        return { ...sheet, cells: recalculateSheet(newCells) };
      });

      return { ...prev, sheets: updatedSheets };
    });
  };

  // Insert Column
  const handleInsertCol = () => {
    const targetCol = activeCell.col;
    setWorkbook((prev) => {
      pushHistory(prev.sheets);

      const updatedSheets = prev.sheets.map((sheet) => {
        if (sheet.id !== prev.activeSheetId) return sheet;

        const newCells: Record<string, CellData> = {};
        for (const [addr, cell] of Object.entries(sheet.cells)) {
          const coord = addressToCoord(addr);
          if (!coord) continue;
          if (coord.col >= targetCol) {
            newCells[coordToAddress({ col: coord.col + 1, row: coord.row })] = cell;
          } else {
            newCells[addr] = cell;
          }
        }
        return { ...sheet, cells: recalculateSheet(newCells) };
      });

      return { ...prev, sheets: updatedSheets };
    });
  };

  // Delete Row
  const handleDeleteRow = () => {
    const targetRow = activeCell.row;
    setWorkbook((prev) => {
      pushHistory(prev.sheets);

      const updatedSheets = prev.sheets.map((sheet) => {
        if (sheet.id !== prev.activeSheetId) return sheet;

        const newCells: Record<string, CellData> = {};
        for (const [addr, cell] of Object.entries(sheet.cells)) {
          const coord = addressToCoord(addr);
          if (!coord) continue;
          if (coord.row === targetRow) {
            // Delete
            continue;
          } else if (coord.row > targetRow) {
            newCells[coordToAddress({ col: coord.col, row: coord.row - 1 })] = cell;
          } else {
            newCells[addr] = cell;
          }
        }
        return { ...sheet, cells: recalculateSheet(newCells) };
      });

      return { ...prev, sheets: updatedSheets };
    });
  };

  // Delete Column
  const handleDeleteCol = () => {
    const targetCol = activeCell.col;
    setWorkbook((prev) => {
      pushHistory(prev.sheets);

      const updatedSheets = prev.sheets.map((sheet) => {
        if (sheet.id !== prev.activeSheetId) return sheet;

        const newCells: Record<string, CellData> = {};
        for (const [addr, cell] of Object.entries(sheet.cells)) {
          const coord = addressToCoord(addr);
          if (!coord) continue;
          if (coord.col === targetCol) {
            continue;
          } else if (coord.col > targetCol) {
            newCells[coordToAddress({ col: coord.col - 1, row: coord.row })] = cell;
          } else {
            newCells[addr] = cell;
          }
        }
        return { ...sheet, cells: recalculateSheet(newCells) };
      });

      return { ...prev, sheets: updatedSheets };
    });
  };

  // AutoFill drag logic
  const handleFillRange = (sourceRange: SelectionRange, targetEnd: CellCoord) => {
    setWorkbook((prev) => {
      pushHistory(prev.sheets);

      const updatedSheets = prev.sheets.map((sheet) => {
        if (sheet.id !== prev.activeSheetId) return sheet;

        const newCells = { ...sheet.cells };
        const sMinCol = Math.min(sourceRange.start.col, sourceRange.end.col);
        const sMaxCol = Math.max(sourceRange.start.col, sourceRange.end.col);
        const sMinRow = Math.min(sourceRange.start.row, sourceRange.end.row);
        const sMaxRow = Math.max(sourceRange.start.row, sourceRange.end.row);

        // Fill downward
        if (targetEnd.row > sMaxRow) {
          const sourceHeight = sMaxRow - sMinRow + 1;
          for (let r = sMaxRow + 1; r <= targetEnd.row; r++) {
            const offset = (r - sMaxRow - 1) % sourceHeight;
            const srcRow = sMinRow + offset;
            const rowDelta = r - srcRow;

            for (let c = sMinCol; c <= sMaxCol; c++) {
              const srcAddr = coordToAddress({ col: c, row: srcRow });
              const srcCell = sheet.cells[srcAddr];
              const destAddr = coordToAddress({ col: c, row: r });

              if (srcCell) {
                let filledRaw = srcCell.raw || '';
                // Adjust formulas
                if (filledRaw.startsWith('=')) {
                  filledRaw = filledRaw.replace(/([A-Z]+)(\d+)/g, (_, colStr, rowStr) => {
                    const nextRow = parseInt(rowStr, 10) + rowDelta;
                    return `${colStr}${nextRow}`;
                  });
                } else if (!isNaN(Number(filledRaw)) && filledRaw !== '') {
                  // Increment numbers
                  filledRaw = String(Number(filledRaw) + (r - srcRow));
                }

                newCells[destAddr] = {
                  ...srcCell,
                  raw: filledRaw,
                };
              }
            }
          }
        }

        return { ...sheet, cells: recalculateSheet(newCells) };
      });

      return { ...prev, sheets: updatedSheets };
    });
  };

  // AutoSum button action
  const handleAutoSum = (fnName: 'SUM' | 'AVERAGE' | 'COUNT' | 'MAX' | 'MIN') => {
    // Look upwards from active cell to find contiguous filled numbers
    const col = activeCell.col;
    let startRow = activeCell.row - 1;

    while (startRow > 1) {
      const prevAddr = coordToAddress({ col, row: startRow - 1 });
      const cell = activeSheet.cells[prevAddr];
      if (!cell || cell.raw === '') break;
      startRow--;
    }

    const endRow = Math.max(1, activeCell.row - 1);
    const rangeStr = `${colIndexToName(col)}${startRow}:${colIndexToName(col)}${endRow}`;
    const formula = `=${fnName}(${rangeStr})`;

    handleCellUpdate(activeAddress, { raw: formula });
  };

  // Sorting columns
  const handleSort = (direction: 'asc' | 'desc') => {
    setWorkbook((prev) => {
      pushHistory(prev.sheets);

      const updatedSheets = prev.sheets.map((sheet) => {
        if (sheet.id !== prev.activeSheetId) return sheet;

        const sortCol = activeCell.col;
        // Determine table rows from row 3 to max row
        let maxRow = 1;
        let maxCol = 10;
        for (const addr of Object.keys(sheet.cells)) {
          const c = addressToCoord(addr);
          if (c && c.row > maxRow) maxRow = c.row;
          if (c && c.col > maxCol) maxCol = c.col;
        }

        const dataRows: { rowIdx: number; keyVal: any; cells: Record<number, CellData> }[] = [];
        for (let r = 3; r <= maxRow; r++) {
          const sortAddr = coordToAddress({ col: sortCol, row: r });
          const keyVal = sheet.cells[sortAddr]?.computed ?? sheet.cells[sortAddr]?.raw ?? '';

          const rowCells: Record<number, CellData> = {};
          for (let c = 0; c <= maxCol; c++) {
            const addr = coordToAddress({ col: c, row: r });
            if (sheet.cells[addr]) {
              rowCells[c] = sheet.cells[addr];
            }
          }
          dataRows.push({ rowIdx: r, keyVal, cells: rowCells });
        }

        dataRows.sort((a, b) => {
          const valA = a.keyVal;
          const valB = b.keyVal;
          const numA = parseFloat(String(valA));
          const numB = parseFloat(String(valB));

          if (!isNaN(numA) && !isNaN(numB)) {
            return direction === 'asc' ? numA - numB : numB - numA;
          }
          return direction === 'asc'
            ? String(valA).localeCompare(String(valB))
            : String(valB).localeCompare(String(valA));
        });

        const newCells = { ...sheet.cells };
        dataRows.forEach((item, idx) => {
          const targetRow = 3 + idx;
          for (let c = 0; c <= maxCol; c++) {
            const targetAddr = coordToAddress({ col: c, row: targetRow });
            if (item.cells[c]) {
              newCells[targetAddr] = item.cells[c];
            } else {
              delete newCells[targetAddr];
            }
          }
        });

        return { ...sheet, cells: recalculateSheet(newCells) };
      });

      return { ...prev, sheets: updatedSheets };
    });
  };

  // Find & Replace All
  const handleReplaceAll = (findText: string, replaceText: string, matchCase: boolean) => {
    setWorkbook((prev) => {
      pushHistory(prev.sheets);

      const updatedSheets = prev.sheets.map((sheet) => {
        if (sheet.id !== prev.activeSheetId) return sheet;

        const newCells = { ...sheet.cells };
        const regex = new RegExp(
          findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          matchCase ? 'g' : 'gi'
        );

        for (const [addr, cell] of Object.entries(newCells)) {
          if (cell && cell.raw) {
            const replaced = cell.raw.replace(regex, replaceText);
            if (replaced !== cell.raw) {
              newCells[addr] = { ...cell, raw: replaced };
            }
          }
        }

        return { ...sheet, cells: recalculateSheet(newCells) };
      });

      return { ...prev, sheets: updatedSheets };
    });
  };

  // Sheet Management
  const handleAddSheet = () => {
    const newSheet = createEmptySheet(
      `sheet_${Date.now()}`,
      `کاربرگ ${workbook.sheets.length + 1}`,
      activeSheet.isRTL
    );
    setWorkbook((prev) => ({
      ...prev,
      sheets: [...prev.sheets, newSheet],
      activeSheetId: newSheet.id,
    }));
  };

  const handleRenameSheet = (id: string, newName: string) => {
    setWorkbook((prev) => ({
      ...prev,
      sheets: prev.sheets.map((s) => (s.id === id ? { ...s, name: newName } : s)),
    }));
  };

  const handleDuplicateSheet = (id: string) => {
    const target = workbook.sheets.find((s) => s.id === id);
    if (!target) return;
    const duplicated: Sheet = {
      ...JSON.parse(JSON.stringify(target)),
      id: `sheet_${Date.now()}`,
      name: `${target.name} (کپی)`,
    };
    setWorkbook((prev) => ({
      ...prev,
      sheets: [...prev.sheets, duplicated],
      activeSheetId: duplicated.id,
    }));
  };

  const handleDeleteSheet = (id: string) => {
    if (workbook.sheets.length <= 1) return;
    setWorkbook((prev) => {
      const remaining = prev.sheets.filter((s) => s.id !== id);
      const nextActive = prev.activeSheetId === id ? remaining[0].id : prev.activeSheetId;
      return { ...prev, sheets: remaining, activeSheetId: nextActive };
    });
  };

  const handleTabColorChange = (id: string, color: string) => {
    setWorkbook((prev) => ({
      ...prev,
      sheets: prev.sheets.map((s) => (s.id === id ? { ...s, tabColor: color } : s)),
    }));
  };

  // Populate AI Table into sheet
  const handlePopulateTable = (headers: string[], rows: any[][], title?: string) => {
    setWorkbook((prev) => {
      pushHistory(prev.sheets);

      const updatedSheets = prev.sheets.map((sheet) => {
        if (sheet.id !== prev.activeSheetId) return sheet;

        const newCells = { ...sheet.cells };

        // Title row
        if (title) {
          newCells['A1'] = {
            raw: title,
            bold: true,
            fontSize: 14,
            bgColor: '#d1e7dd',
            textColor: '#0f5132',
            align: 'center',
          };
        }

        // Headers
        headers.forEach((h, colIdx) => {
          const addr = coordToAddress({ col: colIdx, row: 2 });
          newCells[addr] = {
            raw: h,
            bold: true,
            bgColor: '#198754',
            textColor: '#ffffff',
            align: 'center',
          };
        });

        // Rows
        rows.forEach((row, rowIdx) => {
          const r = 3 + rowIdx;
          row.forEach((val, colIdx) => {
            const addr = coordToAddress({ col: colIdx, row: r });
            const num = Number(val);
            newCells[addr] = {
              raw: String(val),
              computed: !isNaN(num) && val !== '' ? num : val,
              align: isNaN(num) ? 'right' : 'left',
              format: !isNaN(num) && Number(val) > 1000 ? 'number' : undefined,
            };
          });
        });

        return { ...sheet, cells: recalculateSheet(newCells) };
      });

      return { ...prev, sheets: updatedSheets };
    });
  };

  // CSV Import file trigger
  const handleImportCSVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        if (file.name.endsWith('.json')) {
          try {
            const parsed = JSON.parse(text);
            if (parsed.sheets && parsed.title) {
              setWorkbook(parsed);
              return;
            }
          } catch (err) {
            console.error('Invalid JSON', err);
          }
        }

        // Parse as CSV
        const parsedCells = parseCSVToCells(text);
        const newSheet: Sheet = {
          id: `sheet_${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, '').slice(0, 15) || 'ورودی CSV',
          cells: recalculateSheet(parsedCells),
          colWidths: {},
          rowHeights: {},
          showGridLines: true,
          showHeaders: true,
          isRTL: activeSheet.isRTL,
          tabColor: '#0d6efd',
        };

        setWorkbook((prev) => ({
          ...prev,
          sheets: [...prev.sheets, newSheet],
          activeSheetId: newSheet.id,
        }));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#f3f4f6] text-slate-800 font-sans overflow-hidden">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.tsv,.json"
        className="hidden"
        onChange={handleImportCSVFile}
      />

      {/* 1. Ribbon Bar Header */}
      <RibbonHeader
        workbookTitle={workbook.title}
        onTitleChange={(title) => setWorkbook((p) => ({ ...p, title }))}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeCellStyle={activeCellData}
        onStyleChange={handleStyleChange}
        numberFormat={activeCellData?.format || 'general'}
        onFormatChange={handleFormatChange}
        onDecimalsChange={handleDecimalsChange}
        onInsertRow={handleInsertRow}
        onInsertCol={handleInsertCol}
        onDeleteRow={handleDeleteRow}
        onDeleteCol={handleDeleteCol}
        onClearCell={() => handleCellUpdate(activeAddress, { raw: '', computed: '' })}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onExportCSV={() => exportSheetToCSV(activeSheet)}
        onExportJSON={() => exportWorkbookJSON(workbook)}
        onExportXLS={() => exportSheetToHTMLTable(activeSheet)}
        onImportCSV={() => fileInputRef.current?.click()}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenCharts={() => setIsChartsOpen(true)}
        onOpenFunctions={() => setIsFunctionWizardOpen(true)}
        onOpenFindReplace={() => setIsFindReplaceOpen(true)}
        onToggleAICopilot={() => setIsAICopilotOpen(!isAICopilotOpen)}
        onPrint={() => window.print()}
        onAutoSum={handleAutoSum}
        onSort={handleSort}
        isRTL={activeSheet.isRTL ?? true}
        onToggleRTL={() =>
          setWorkbook((prev) => ({
            ...prev,
            sheets: prev.sheets.map((s) =>
              s.id === prev.activeSheetId ? { ...s, isRTL: !s.isRTL } : s
            ),
          }))
        }
        showGridLines={activeSheet.showGridLines ?? true}
        onToggleGridLines={() =>
          setWorkbook((prev) => ({
            ...prev,
            sheets: prev.sheets.map((s) =>
              s.id === prev.activeSheetId ? { ...s, showGridLines: !s.showGridLines } : s
            ),
          }))
        }
        showHeaders={activeSheet.showHeaders ?? true}
        onToggleHeaders={() =>
          setWorkbook((prev) => ({
            ...prev,
            sheets: prev.sheets.map((s) =>
              s.id === prev.activeSheetId ? { ...s, showHeaders: !s.showHeaders } : s
            ),
          }))
        }
        zoom={zoom}
        onZoomChange={setZoom}
      />

      {/* 2. Formula Bar */}
      <FormulaBar
        activeCellAddress={activeAddress}
        selectedRangeText={
          selectionRange
            ? `${coordToAddress(selectionRange.start)}:${coordToAddress(selectionRange.end)}`
            : undefined
        }
        cellRawValue={activeCellData?.raw || ''}
        onFormulaChange={(val) => handleCellUpdate(activeAddress, { raw: val })}
        onFormulaCommit={() => {
          // move down
          setActiveCell({ col: activeCell.col, row: activeCell.row + 1 });
        }}
        onFormulaCancel={() => {}}
        onJumpToCell={(addr) => {
          const coord = addressToCoord(addr);
          if (coord) {
            setActiveCell(coord);
            setSelectionRange(null);
          }
        }}
        onOpenFunctionWizard={() => setIsFunctionWizardOpen(true)}
      />

      {/* 3. Main Spreadsheet Grid */}
      <div className="flex-1 flex overflow-hidden relative">
        <SpreadsheetGrid
          sheet={activeSheet}
          activeCell={activeCell}
          selectionRange={selectionRange}
          onActiveCellChange={setActiveCell}
          onSelectionRangeChange={setSelectionRange}
          onCellUpdate={handleCellUpdate}
          onFillRange={handleFillRange}
          showGridLines={activeSheet.showGridLines ?? true}
          showHeaders={activeSheet.showHeaders ?? true}
          zoom={zoom}
        />

        {/* Gemini AI Copilot Sidebar */}
        {isAICopilotOpen && (
          <AICopilotDrawer
            isOpen={isAICopilotOpen}
            onClose={() => setIsAICopilotOpen(false)}
            activeSheet={activeSheet}
            activeCell={activeCell}
            onInsertFormula={(formula) => handleCellUpdate(activeAddress, { raw: formula })}
            onPopulateTable={handlePopulateTable}
            onOpenCharts={() => setIsChartsOpen(true)}
          />
        )}
      </div>

      {/* 4. Bottom Sheet Tabs Bar & Status Stats */}
      <SheetTabsBar
        sheets={workbook.sheets}
        activeSheetId={workbook.activeSheetId}
        onSelectSheet={(id) => setWorkbook((p) => ({ ...p, activeSheetId: id }))}
        onAddSheet={handleAddSheet}
        onRenameSheet={handleRenameSheet}
        onDuplicateSheet={handleDuplicateSheet}
        onDeleteSheet={handleDeleteSheet}
        onColorChange={handleTabColorChange}
        activeCell={activeCell}
        selectionRange={selectionRange}
        activeSheet={activeSheet}
        zoom={zoom}
        onZoomChange={setZoom}
      />

      {/* Modals */}
      <FunctionWizardModal
        isOpen={isFunctionWizardOpen}
        onClose={() => setIsFunctionWizardOpen(false)}
        onSelectFunction={(fn: FormulaHelp) => {
          handleCellUpdate(activeAddress, { raw: fn.example });
        }}
      />

      <ChartsPanel
        isOpen={isChartsOpen}
        onClose={() => setIsChartsOpen(false)}
        sheet={activeSheet}
        selectionRange={selectionRange}
      />

      <FindReplaceModal
        isOpen={isFindReplaceOpen}
        onClose={() => setIsFindReplaceOpen(false)}
        sheet={activeSheet}
        onSelectCell={setActiveCell}
        onReplaceCell={(addr, val) => handleCellUpdate(addr, { raw: val })}
        onReplaceAll={handleReplaceAll}
      />

      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onApplyTemplate={(newSheet, asNewSheet) => {
          if (asNewSheet) {
            setWorkbook((p) => ({
              ...p,
              sheets: [...p.sheets, newSheet],
              activeSheetId: newSheet.id,
            }));
          } else {
            setWorkbook((p) => ({
              ...p,
              sheets: p.sheets.map((s) => (s.id === p.activeSheetId ? newSheet : s)),
            }));
          }
        }}
      />
    </div>
  );
}
