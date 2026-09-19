import React, { useState } from 'react';
import { X, Search, Check, HelpCircle } from 'lucide-react';
import { EXCEL_FUNCTIONS } from '../utils/templates';
import { FormulaHelp } from '../types';

interface FunctionWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFunction: (fn: FormulaHelp) => void;
}

export const FunctionWizardModal: React.FC<FunctionWizardModalProps> = ({
  isOpen,
  onClose,
  onSelectFunction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedFn, setSelectedFn] = useState<FormulaHelp>(EXCEL_FUNCTIONS[0]);

  if (!isOpen) return null;

  const categories = ['All', 'Math', 'Statistical', 'Logical', 'Text', 'Date', 'Lookup'];

  const filteredFunctions = EXCEL_FUNCTIONS.filter((fn) => {
    const matchesSearch =
      fn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fn.descriptionFa.includes(searchTerm) ||
      fn.descriptionEn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || fn.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-[#107c41] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif italic font-black text-base bg-white/20 px-2 py-0.5 rounded">
              fx
            </span>
            <h3 className="font-bold text-sm">راهنمای توابع و فرمول‌های اکسل (Insert Function)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجوی تابع (نام، کاربرد یا توضیحات)..."
              className="w-full pr-8 pl-3 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:border-emerald-600"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:border-emerald-600"
          >
            <option value="All">همه دسته‌ها (All)</option>
            <option value="Math">ریاضی (Math)</option>
            <option value="Statistical">آماری (Statistical)</option>
            <option value="Logical">منطقی (Logical)</option>
            <option value="Text">متنی (Text)</option>
            <option value="Date">تاریخ و زمان (Date)</option>
            <option value="Lookup">جستجو و ارجاع (Lookup)</option>
          </select>
        </div>

        {/* Function List & Details */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-slate-200">
          {/* List of Functions */}
          <div className="overflow-y-auto max-h-64 sm:max-h-80 p-2 space-y-1">
            {filteredFunctions.map((fn) => (
              <div
                key={fn.name}
                onClick={() => setSelectedFn(fn)}
                className={`p-2 rounded cursor-pointer transition-all flex items-center justify-between text-xs ${
                  selectedFn.name === fn.name
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div>
                  <span className="font-mono font-bold text-emerald-700">{fn.name}</span>
                  <div className="text-[10px] text-slate-500 truncate max-w-[170px]">
                    {fn.descriptionFa}
                  </div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                  {fn.category}
                </span>
              </div>
            ))}
            {filteredFunctions.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400">
                تابعی با این مشخصات یافت نشد.
              </div>
            )}
          </div>

          {/* Function Detail Pane */}
          <div className="p-4 flex flex-col justify-between overflow-y-auto bg-slate-50/50">
            {selectedFn ? (
              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">قالب و ساختار تابع:</div>
                  <div className="font-mono font-bold text-emerald-800 bg-white p-2 border border-emerald-200 rounded mt-1 text-left" dir="ltr">
                    {selectedFn.syntax}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 font-medium">توضیحات عملکرد:</div>
                  <p className="mt-1 text-slate-700 leading-relaxed font-medium">
                    {selectedFn.descriptionFa}
                  </p>
                  <p className="mt-1 text-slate-400 text-[11px] font-sans" dir="ltr">
                    {selectedFn.descriptionEn}
                  </p>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 font-medium">نمونه کاربرد:</div>
                  <div className="font-mono text-xs text-slate-800 bg-white p-1.5 border border-slate-200 rounded mt-1 text-left" dir="ltr">
                    {selectedFn.example}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-10 text-xs">
                یک تابع را برای مشاهده جزئیات انتخاب کنید
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500 text-[11px]">
            با زدن دکمه درج، فرمول در خانه فعال قرار می‌گیرد.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100 rounded text-slate-700 transition-colors"
            >
              انصراف
            </button>
            <button
              onClick={() => {
                onSelectFunction(selectedFn);
                onClose();
              }}
              className="px-4 py-1.5 bg-[#107c41] hover:bg-emerald-700 text-white font-bold rounded flex items-center gap-1 shadow-xs transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>درج در خانه (Insert)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
