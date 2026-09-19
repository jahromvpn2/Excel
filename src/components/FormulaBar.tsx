import React, { useState, useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';

interface FormulaBarProps {
  activeCellAddress: string;
  selectedRangeText?: string;
  cellRawValue: string;
  onFormulaChange: (val: string) => void;
  onFormulaCommit: () => void;
  onFormulaCancel: () => void;
  onJumpToCell: (address: string) => void;
  onOpenFunctionWizard: () => void;
}

export const FormulaBar: React.FC<FormulaBarProps> = ({
  activeCellAddress,
  selectedRangeText,
  cellRawValue,
  onFormulaChange,
  onFormulaCommit,
  onFormulaCancel,
  onJumpToCell,
  onOpenFunctionWizard,
}) => {
  const [addressInput, setAddressInput] = useState(activeCellAddress);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAddressInput(selectedRangeText || activeCellAddress);
  }, [activeCellAddress, selectedRangeText]);

  const handleAddressKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onJumpToCell(addressInput);
    }
  };

  const handleFormulaKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onFormulaCommit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onFormulaCancel();
    }
  };

  return (
    <div className="bg-white border-b border-slate-200 px-2 py-1 flex items-center gap-1 text-xs select-none shrink-0 h-9">
      {/* Name Box (Jump to cell / Range indicator) */}
      <div className="relative">
        <input
          type="text"
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
          onKeyDown={handleAddressKeyDown}
          title="نام خانه فعال (برای پرش به خانه اینتر بزنید)"
          className="w-20 sm:w-24 text-center font-mono font-semibold py-1 px-1.5 border border-slate-300 rounded bg-slate-50 text-slate-800 text-xs focus:bg-white focus:outline-none focus:border-emerald-600 uppercase"
        />
      </div>

      <div className="h-4 w-px bg-slate-200 mx-1" />

      {/* Action Buttons: Cancel, Enter, Function Wizard */}
      <div className="flex items-center gap-0.5 text-slate-500">
        <button
          onClick={onFormulaCancel}
          title="لغو ویرایش (Esc)"
          className="p-1 hover:bg-slate-100 hover:text-red-600 rounded transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onFormulaCommit}
          title="تأیید و اعمال فرمول (Enter)"
          className="p-1 hover:bg-slate-100 hover:text-emerald-700 rounded transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onOpenFunctionWizard}
          title="درج تابع یا فرمول (fx)"
          className="px-1.5 py-0.5 hover:bg-slate-100 hover:text-emerald-700 rounded font-serif font-bold italic text-slate-600 transition-colors"
        >
          fx
        </button>
      </div>

      <div className="h-4 w-px bg-slate-200 mx-1" />

      {/* Formula Input Box */}
      <div className="flex-1 relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={cellRawValue}
          onChange={(e) => onFormulaChange(e.target.value)}
          onKeyDown={handleFormulaKeyDown}
          dir="ltr"
          placeholder="مقدار یا فرمول (مثال: =SUM(A1:A10))"
          className="w-full font-mono py-1 px-2.5 rounded bg-transparent text-slate-800 text-xs focus:outline-none focus:bg-emerald-50/30 border border-transparent focus:border-emerald-300 transition-all text-left"
        />
        {cellRawValue.startsWith('=') && (
          <span className="absolute right-2 text-[10px] text-emerald-700 font-sans font-semibold bg-emerald-100 px-1.5 py-0.5 rounded pointer-events-none">
            حالت فرمول
          </span>
        )}
      </div>
    </div>
  );
};
