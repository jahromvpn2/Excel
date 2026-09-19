import React, { useState } from 'react';
import { X, Search, Replace, ChevronRight, ChevronLeft } from 'lucide-react';
import { CellCoord, Sheet } from '../types';
import { coordToAddress, addressToCoord } from '../utils/formulaEngine';

interface FindReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheet: Sheet;
  onSelectCell: (coord: CellCoord) => void;
  onReplaceCell: (address: string, newVal: string) => void;
  onReplaceAll: (findText: string, replaceText: string, matchCase: boolean) => void;
}

export const FindReplaceModal: React.FC<FindReplaceModalProps> = ({
  isOpen,
  onClose,
  sheet,
  onSelectCell,
  onReplaceCell,
  onReplaceAll,
}) => {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [matchResults, setMatchResults] = useState<string[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);

  if (!isOpen) return null;

  const handleFind = () => {
    if (!findText.trim()) {
      setMatchResults([]);
      return;
    }

    const matches: string[] = [];
    for (const [addr, cell] of Object.entries(sheet.cells)) {
      const val = String(cell.computed ?? cell.raw ?? '');
      const isMatch = matchCase
        ? val.includes(findText)
        : val.toLowerCase().includes(findText.toLowerCase());

      if (isMatch) {
        matches.push(addr);
      }
    }

    setMatchResults(matches);
    setCurrentResultIndex(0);

    if (matches.length > 0) {
      const firstCoord = addressToCoord(matches[0]);
      if (firstCoord) onSelectCell(firstCoord);
    }
  };

  const handleNext = () => {
    if (!matchResults.length) return;
    const nextIdx = (currentResultIndex + 1) % matchResults.length;
    setCurrentResultIndex(nextIdx);
    const coord = addressToCoord(matchResults[nextIdx]);
    if (coord) onSelectCell(coord);
  };

  const handlePrev = () => {
    if (!matchResults.length) return;
    const prevIdx = (currentResultIndex - 1 + matchResults.length) % matchResults.length;
    setCurrentResultIndex(prevIdx);
    const coord = addressToCoord(matchResults[prevIdx]);
    if (coord) onSelectCell(coord);
  };

  const handleReplaceSingle = () => {
    if (!matchResults.length) return;
    const currentAddr = matchResults[currentResultIndex];
    const cell = sheet.cells[currentAddr];
    if (cell) {
      const currentRaw = cell.raw || '';
      const regex = new RegExp(escapeRegExp(findText), matchCase ? 'g' : 'gi');
      const updated = currentRaw.replace(regex, replaceText);
      onReplaceCell(currentAddr, updated);
      handleNext();
    }
  };

  function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#107c41] text-white px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <h3 className="font-bold text-xs">یافتن و جایگزینی (Find & Replace)</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">متن مورد جستجو:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFind()}
                placeholder="متن، عدد یا عبارت..."
                className="flex-1 p-2 border border-slate-300 rounded focus:outline-none focus:border-emerald-600"
              />
              <button
                onClick={handleFind}
                className="px-3 py-1.5 bg-[#107c41] text-white rounded font-bold hover:bg-emerald-700"
              >
                جستجو
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">جایگزینی با:</label>
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="متن جدید..."
              className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={matchCase}
                onChange={(e) => setMatchCase(e.target.checked)}
                className="accent-emerald-600"
              />
              <span>حساس به حروف بزرگ و کوچک (Match Case)</span>
            </label>

            {matchResults.length > 0 && (
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                مورد {currentResultIndex + 1} از {matchResults.length} ({matchResults[currentResultIndex]})
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              disabled={!matchResults.length}
              className="p-1.5 border border-slate-300 hover:bg-slate-100 rounded disabled:opacity-40"
              title="قبلی"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              disabled={!matchResults.length}
              className="p-1.5 border border-slate-300 hover:bg-slate-100 rounded disabled:opacity-40"
              title="بعدی"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReplaceSingle}
              disabled={!matchResults.length}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium disabled:opacity-40"
            >
              جایگزینی این مورد
            </button>
            <button
              onClick={() => onReplaceAll(findText, replaceText, matchCase)}
              disabled={!findText.trim()}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold disabled:opacity-40"
            >
              جایگزینی همه
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
