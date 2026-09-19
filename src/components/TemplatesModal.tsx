import React from 'react';
import { X, FolderOpen, Wallet, ShoppingCart, GraduationCap, FilePlus2, Check } from 'lucide-react';
import { Sheet } from '../types';
import {
  createBudgetTemplate,
  createSalesTemplate,
  createGradebookTemplate,
  createEmptySheet,
} from '../utils/templates';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (sheet: Sheet, asNewSheet: boolean) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onApplyTemplate,
}) => {
  if (!isOpen) return null;

  const templates = [
    {
      id: 'budget',
      title: 'بودجه و هزینه‌های ماهانه',
      desc: 'جدول کامل ثبت اقلام بودجه، هزینه‌های واقعی، انحراف معیار و جمع خودکار',
      icon: <Wallet className="w-8 h-8 text-emerald-600" />,
      color: 'border-emerald-500 hover:bg-emerald-50/50',
      generator: createBudgetTemplate,
    },
    {
      id: 'sales',
      title: 'گزارش فروش و سود ناخالص',
      desc: 'محاسبه بهای تمام شده، فروش کل، سود هر محصول و درصد مارجین',
      icon: <ShoppingCart className="w-8 h-8 text-blue-600" />,
      color: 'border-blue-500 hover:bg-blue-50/50',
      generator: createSalesTemplate,
    },
    {
      id: 'gradebook',
      title: 'کارنامه و معدل دانش‌آموزان',
      desc: 'ثبت نمرات دروس مختلف، میانگین حسابی با ROUND/AVERAGE و شرط قبولی IF',
      icon: <GraduationCap className="w-8 h-8 text-rose-600" />,
      color: 'border-rose-500 hover:bg-rose-50/50',
      generator: createGradebookTemplate,
    },
    {
      id: 'blank',
      title: 'صفحه گسترده خالی',
      desc: 'کاربرگ تازه و بدون داده برای شروع طراحی اختصاصی',
      icon: <FilePlus2 className="w-8 h-8 text-slate-500" />,
      color: 'border-slate-400 hover:bg-slate-50',
      generator: () => createEmptySheet(`sheet_${Date.now()}`, 'کاربرگ جدید'),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#107c41] text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            <h3 className="font-bold text-sm">قالب‌های آماده صفحه گسترده (Templates)</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Template Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className={`p-4 rounded-lg border-2 transition-all flex flex-col justify-between ${tpl.color}`}
            >
              <div>
                <div className="mb-3">{tpl.icon}</div>
                <h4 className="font-bold text-sm text-slate-900 mb-1">{tpl.title}</h4>
                <p className="text-slate-600 leading-relaxed text-[11px] mb-4">
                  {tpl.desc}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                <button
                  onClick={() => {
                    onApplyTemplate(tpl.generator(), true);
                    onClose();
                  }}
                  className="flex-1 py-1.5 bg-[#107c41] hover:bg-emerald-700 text-white font-bold rounded text-center transition-colors shadow-xs"
                >
                  افزودن کاربرگ جدید
                </button>
                <button
                  onClick={() => {
                    onApplyTemplate(tpl.generator(), false);
                    onClose();
                  }}
                  className="px-2.5 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded transition-colors"
                  title="جایگزینی در همین کاربرگ"
                >
                  جایگزین
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-slate-300 hover:bg-slate-100 rounded text-xs text-slate-700"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
