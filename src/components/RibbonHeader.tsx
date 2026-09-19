import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Undo2,
  Redo2,
  Printer,
  Download,
  Upload,
  Sparkles,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Grid,
  Percent,
  DollarSign,
  ChevronDown,
  Plus,
  Trash2,
  Search,
  BarChart3,
  HelpCircle,
  FolderOpen,
  Save,
  Check,
  Languages,
  Maximize2,
  SplitSquareVertical,
  WrapText,
  SlidersHorizontal,
  Sigma,
  SortAsc,
  SortDesc,
  Filter,
} from 'lucide-react';
import { CellStyle, NumberFormatType, RibbonTab } from '../types';

interface RibbonHeaderProps {
  workbookTitle: string;
  onTitleChange: (title: string) => void;
  activeTab: RibbonTab;
  onTabChange: (tab: RibbonTab) => void;
  activeCellStyle?: CellStyle;
  onStyleChange: (styleUpdates: Partial<CellStyle>) => void;
  numberFormat?: NumberFormatType;
  onFormatChange: (format: NumberFormatType) => void;
  onDecimalsChange: (delta: number) => void;
  onInsertRow: () => void;
  onInsertCol: () => void;
  onDeleteRow: () => void;
  onDeleteCol: () => void;
  onClearCell: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onExportXLS: () => void;
  onImportCSV: () => void;
  onOpenTemplates: () => void;
  onOpenCharts: () => void;
  onOpenFunctions: () => void;
  onOpenFindReplace: () => void;
  onToggleAICopilot: () => void;
  onPrint: () => void;
  onAutoSum: (fnName: 'SUM' | 'AVERAGE' | 'COUNT' | 'MAX' | 'MIN') => void;
  onSort: (direction: 'asc' | 'desc') => void;
  isRTL: boolean;
  onToggleRTL: () => void;
  showGridLines: boolean;
  onToggleGridLines: () => void;
  showHeaders: boolean;
  onToggleHeaders: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export const RibbonHeader: React.FC<RibbonHeaderProps> = ({
  workbookTitle,
  onTitleChange,
  activeTab,
  onTabChange,
  activeCellStyle = {},
  onStyleChange,
  numberFormat = 'general',
  onFormatChange,
  onDecimalsChange,
  onInsertRow,
  onInsertCol,
  onDeleteRow,
  onDeleteCol,
  onClearCell,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onExportCSV,
  onExportJSON,
  onExportXLS,
  onImportCSV,
  onOpenTemplates,
  onOpenCharts,
  onOpenFunctions,
  onOpenFindReplace,
  onToggleAICopilot,
  onPrint,
  onAutoSum,
  onSort,
  isRTL,
  onToggleRTL,
  showGridLines,
  onToggleGridLines,
  showHeaders,
  onToggleHeaders,
  zoom,
  onZoomChange,
}) => {
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showAutoSumMenu, setShowAutoSumMenu] = useState(false);
  const [showBorderMenu, setShowBorderMenu] = useState(false);

  const tabs: { id: RibbonTab; label: string; icon?: React.ReactNode }[] = [
    { id: 'home', label: 'خانه (Home)' },
    { id: 'insert', label: 'درج (Insert)' },
    { id: 'pageLayout', label: 'طرح‌بندی (Layout)' },
    { id: 'formulas', label: 'فرمول‌ها (Formulas)' },
    { id: 'data', label: 'داده‌ها (Data)' },
    { id: 'view', label: 'نمایش (View)' },
    {
      id: 'ai',
      label: 'هوش مصنوعی (Gemini AI)',
      icon: <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse inline ml-1" />,
    },
  ];

  return (
    <header className="bg-white border-b border-slate-200 select-none shadow-xs shrink-0">
      {/* Top Application Bar (Excel Green theme) */}
      <div className="bg-[#107c41] text-white px-3 py-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          {/* Excel App Icon & Badge */}
          <div className="flex items-center gap-1.5 font-semibold text-sm">
            <div className="w-6 h-6 rounded bg-white text-[#107c41] flex items-center justify-center font-black shadow-xs text-sm tracking-tight">
              X
            </div>
            <span className="hidden sm:inline tracking-tight font-bold">اکسل هوشمند</span>
          </div>

          <div className="h-4 w-px bg-emerald-600/60 mx-1 hidden sm:block" />

          {/* Quick Access Toolbar */}
          <div className="flex items-center gap-1">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className="p-1 hover:bg-emerald-700/70 rounded disabled:opacity-40 transition-colors"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
              className="p-1 hover:bg-emerald-700/70 rounded disabled:opacity-40 transition-colors"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onExportXLS}
              title="ذخیره / خروجی اکسل"
              className="p-1 hover:bg-emerald-700/70 rounded transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onPrint}
              title="چاپ یا ذخیره PDF"
              className="p-1 hover:bg-emerald-700/70 rounded transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-emerald-600/60 mx-1 hidden sm:block" />

          {/* Workbook Title (Editable) */}
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={workbookTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              className="bg-emerald-800/40 hover:bg-emerald-800/60 focus:bg-white focus:text-slate-900 px-2 py-0.5 rounded font-medium text-xs text-white border border-transparent focus:border-emerald-400 focus:outline-none transition-all w-44 sm:w-64"
              placeholder="نام فایل اکسل..."
            />
            <span className="text-[10px] text-emerald-200 hidden md:inline">
              (ذخیره خودکار)
            </span>
          </div>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-2">
          {/* RTL / LTR Toggle */}
          <button
            onClick={onToggleRTL}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-800/40 hover:bg-emerald-800/70 text-emerald-100 transition-colors text-[11px]"
            title="تغییر جهت جدول (راست‌چین / چپ‌چین)"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{isRTL ? 'راست‌چین (RTL)' : 'چپ‌چین (LTR)'}</span>
          </button>

          {/* AI Copilot Button */}
          <button
            onClick={onToggleAICopilot}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold transition-all shadow-xs text-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-900" />
            <span>دستیار هوش مصنوعی</span>
          </button>
        </div>
      </div>

      {/* Ribbon Navigation Tabs */}
      <div className="flex items-center border-b border-slate-200 px-2 bg-slate-50 overflow-x-auto no-scrollbar">
        {/* File Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => setShowFileMenu(!showFileMenu)}
            className={`px-3 py-1.5 font-bold text-xs flex items-center gap-1 transition-colors ${
              showFileMenu ? 'bg-[#107c41] text-white' : 'bg-[#107c41] text-white hover:bg-emerald-700'
            } rounded-t-sm`}
          >
            <span>پرونده (File)</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showFileMenu && (
            <div
              className="absolute right-0 top-full mt-0 w-56 bg-white border border-slate-200 shadow-xl rounded-b-md z-50 py-1 text-xs text-slate-700 divide-y divide-slate-100"
              onClick={() => setShowFileMenu(false)}
            >
              <div className="p-1">
                <button
                  onClick={onOpenTemplates}
                  className="w-full text-right px-3 py-1.5 hover:bg-slate-100 rounded flex items-center gap-2"
                >
                  <FolderOpen className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="font-semibold">قالب‌های آماده (Templates)</div>
                    <div className="text-[10px] text-slate-400">بودجه، فروش، کارنامه، پروژه</div>
                  </div>
                </button>
              </div>

              <div className="p-1">
                <button
                  onClick={onImportCSV}
                  className="w-full text-right px-3 py-1.5 hover:bg-slate-100 rounded flex items-center gap-2"
                >
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>وارد کردن فایل CSV یا اکسل</span>
                </button>
                <button
                  onClick={onExportXLS}
                  className="w-full text-right px-3 py-1.5 hover:bg-slate-100 rounded flex items-center gap-2 font-medium text-emerald-700"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>خروجی اکسل استاندارد (.xls)</span>
                </button>
                <button
                  onClick={onExportCSV}
                  className="w-full text-right px-3 py-1.5 hover:bg-slate-100 rounded flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>خروجی فرمت CSV (با یونیکد فارسی)</span>
                </button>
                <button
                  onClick={onExportJSON}
                  className="w-full text-right px-3 py-1.5 hover:bg-slate-100 rounded flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-purple-600" />
                  <span>پشتیبان‌گیری کامل (JSON)</span>
                </button>
              </div>

              <div className="p-1">
                <button
                  onClick={onPrint}
                  className="w-full text-right px-3 py-1.5 hover:bg-slate-100 rounded flex items-center gap-2"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>چاپ صفحه یا ذخیره PDF</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Regular Tabs */}
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-3.5 py-1.5 text-xs font-medium border-b-2 transition-all shrink-0 ${
              activeTab === tab.id
                ? 'border-[#107c41] text-[#107c41] font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
            {tab.icon}
          </button>
        ))}
      </div>

      {/* Ribbon Command Strip */}
      <div className="p-1.5 bg-white flex items-center gap-3 overflow-x-auto min-h-[58px] text-xs">
        {/* HOME TAB COMMANDS */}
        {activeTab === 'home' && (
          <div className="flex items-center gap-2.5 divide-x divide-slate-200 divide-x-reverse">
            {/* Clipboard & History */}
            <div className="flex flex-col items-center gap-1 pr-1">
              <div className="flex items-center gap-1">
                <button
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="p-1.5 hover:bg-slate-100 rounded disabled:opacity-40"
                  title="Undo"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="p-1.5 hover:bg-slate-100 rounded disabled:opacity-40"
                  title="Redo"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-[9px] text-slate-400 font-medium">تاریخچه</span>
            </div>

            {/* Font & Styles */}
            <div className="flex flex-col gap-1 px-2.5">
              <div className="flex items-center gap-1">
                {/* Font Size Selector */}
                <select
                  value={activeCellStyle.fontSize || 12}
                  onChange={(e) => onStyleChange({ fontSize: Number(e.target.value) })}
                  className="border border-slate-200 rounded px-1.5 py-0.5 text-xs bg-white text-slate-700 focus:outline-none"
                  title="اندازه قلم"
                >
                  {[9, 10, 11, 12, 14, 16, 18, 20, 24].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>

                {/* Bold */}
                <button
                  onClick={() => onStyleChange({ bold: !activeCellStyle.bold })}
                  className={`p-1.5 rounded transition-colors ${
                    activeCellStyle.bold ? 'bg-emerald-100 text-emerald-800 font-bold' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                  title="بولد / ضخیم (Ctrl+B)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>

                {/* Italic */}
                <button
                  onClick={() => onStyleChange({ italic: !activeCellStyle.italic })}
                  className={`p-1.5 rounded transition-colors ${
                    activeCellStyle.italic ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                  title="مورب / ایتالیک (Ctrl+I)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>

                {/* Underline */}
                <button
                  onClick={() => onStyleChange({ underline: !activeCellStyle.underline })}
                  className={`p-1.5 rounded transition-colors ${
                    activeCellStyle.underline ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                  title="خط زیرین (Ctrl+U)"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>

                {/* Strikethrough */}
                <button
                  onClick={() => onStyleChange({ strikethrough: !activeCellStyle.strikethrough })}
                  className={`p-1.5 rounded transition-colors ${
                    activeCellStyle.strikethrough ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                  title="خط‌خورده"
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                </button>

                {/* Background / Fill Color */}
                <div className="relative flex items-center">
                  <input
                    type="color"
                    value={activeCellStyle.bgColor || '#ffffff'}
                    onChange={(e) => onStyleChange({ bgColor: e.target.value })}
                    className="w-6 h-6 p-0 border border-slate-300 rounded cursor-pointer"
                    title="رنگ پس‌زمینه خانه"
                  />
                </div>

                {/* Text Color */}
                <div className="relative flex items-center">
                  <input
                    type="color"
                    value={activeCellStyle.textColor || '#000000'}
                    onChange={(e) => onStyleChange({ textColor: e.target.value })}
                    className="w-6 h-6 p-0 border border-slate-300 rounded cursor-pointer"
                    title="رنگ متن قلم"
                  />
                </div>

                {/* Borders Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowBorderMenu(!showBorderMenu)}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-700 flex items-center"
                    title="کادربندی و خطوط حاشیه"
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <ChevronDown className="w-2.5 h-2.5 ml-0.5 text-slate-400" />
                  </button>

                  {showBorderMenu && (
                    <div
                      className="absolute right-0 top-full mt-1 bg-white border border-slate-200 shadow-lg rounded p-1 w-36 z-50 text-xs"
                      onClick={() => setShowBorderMenu(false)}
                    >
                      <button
                        onClick={() =>
                          onStyleChange({
                            borderTop: true,
                            borderBottom: true,
                            borderLeft: true,
                            borderRight: true,
                            borderColor: '#333333',
                          })
                        }
                        className="w-full text-right px-2 py-1 hover:bg-slate-100 rounded"
                      >
                        تمام خطوط حاشیه
                      </button>
                      <button
                        onClick={() =>
                          onStyleChange({
                            borderBottom: true,
                            borderColor: '#333333',
                          })
                        }
                        className="w-full text-right px-2 py-1 hover:bg-slate-100 rounded"
                      >
                        فقط حاشیه پایین
                      </button>
                      <button
                        onClick={() =>
                          onStyleChange({
                            borderTop: false,
                            borderBottom: false,
                            borderLeft: false,
                            borderRight: false,
                          })
                        }
                        className="w-full text-right px-2 py-1 hover:bg-red-50 text-red-600 rounded"
                      >
                        حذف حاشیه‌ها
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[9px] text-slate-400 font-medium text-center">قلم و رنگ</span>
            </div>

            {/* Alignment & Layout */}
            <div className="flex flex-col gap-1 px-2.5">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onStyleChange({ align: 'right' })}
                  className={`p-1.5 rounded ${
                    activeCellStyle.align === 'right' ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                  title="راست‌چین"
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onStyleChange({ align: 'center' })}
                  className={`p-1.5 rounded ${
                    activeCellStyle.align === 'center' ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                  title="وسط‌چین"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onStyleChange({ align: 'left' })}
                  className={`p-1.5 rounded ${
                    activeCellStyle.align === 'left' ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                  title="چپ‌چین"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-4 bg-slate-200 mx-0.5" />

                <button
                  onClick={() => onStyleChange({ wrapText: !activeCellStyle.wrapText })}
                  className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                    activeCellStyle.wrapText ? 'bg-emerald-100 text-emerald-800 font-medium' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                  title="شکستن سطر متن طولانی (Wrap Text)"
                >
                  <WrapText className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">شکستن متن</span>
                </button>
              </div>
              <span className="text-[9px] text-slate-400 font-medium text-center">تراز متن</span>
            </div>

            {/* Number Formatting */}
            <div className="flex flex-col gap-1 px-2.5">
              <div className="flex items-center gap-1">
                <select
                  value={numberFormat}
                  onChange={(e) => onFormatChange(e.target.value as NumberFormatType)}
                  className="border border-slate-200 rounded px-1.5 py-0.5 text-xs bg-white text-slate-700 focus:outline-none"
                  title="فرمت عدد"
                >
                  <option value="general">عمومی (General)</option>
                  <option value="number">عدد (Number)</option>
                  <option value="currency">واحد پول (Currency $)</option>
                  <option value="percent">درصد (Percentage %)</option>
                  <option value="date">تاریخ (Date)</option>
                  <option value="text">متن (Text)</option>
                </select>

                <button
                  onClick={() => onFormatChange('currency')}
                  className="p-1.5 hover:bg-slate-100 rounded text-slate-700"
                  title="فرمت پول"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onFormatChange('percent')}
                  className="p-1.5 hover:bg-slate-100 rounded text-slate-700"
                  title="فرمت درصد"
                >
                  <Percent className="w-3.5 h-3.5" />
                </button>

                {/* Decimal Places */}
                <button
                  onClick={() => onDecimalsChange(1)}
                  className="px-1.5 py-0.5 text-[11px] font-bold border border-slate-200 rounded hover:bg-slate-100 text-slate-700"
                  title="افزایش رقم اعشار"
                >
                  .00→
                </button>
                <button
                  onClick={() => onDecimalsChange(-1)}
                  className="px-1.5 py-0.5 text-[11px] font-bold border border-slate-200 rounded hover:bg-slate-100 text-slate-700"
                  title="کاهش رقم اعشار"
                >
                  ←.0
                </button>
              </div>
              <span className="text-[9px] text-slate-400 font-medium text-center">اعداد و ارقام</span>
            </div>

            {/* Cells Management (Insert / Delete) */}
            <div className="flex flex-col gap-1 px-2.5">
              <div className="flex items-center gap-1">
                <button
                  onClick={onInsertRow}
                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded flex items-center gap-1 font-medium text-xs"
                  title="درج سطر جدید بالای خانه فعال"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>سطر</span>
                </button>

                <button
                  onClick={onInsertCol}
                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded flex items-center gap-1 font-medium text-xs"
                  title="درج ستون جدید کنار خانه فعال"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ستون</span>
                </button>

                <button
                  onClick={onDeleteRow}
                  className="p-1.5 hover:bg-red-50 text-red-600 rounded"
                  title="حذف سطر فعال"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={onClearCell}
                  className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded text-xs"
                  title="پاک کردن محتوای خانه"
                >
                  پاکسازی
                </button>
              </div>
              <span className="text-[9px] text-slate-400 font-medium text-center">سلول‌ها</span>
            </div>

            {/* Editing (AutoSum, Sort, Find) */}
            <div className="flex flex-col gap-1 px-2.5">
              <div className="flex items-center gap-1">
                {/* AutoSum Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowAutoSumMenu(!showAutoSumMenu)}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-800 font-semibold"
                    title="جمع و توابع سریع (AutoSum)"
                  >
                    <Sigma className="w-3.5 h-3.5 text-emerald-700" />
                    <span>جمع خودکار</span>
                    <ChevronDown className="w-2.5 h-2.5 text-slate-500" />
                  </button>

                  {showAutoSumMenu && (
                    <div
                      className="absolute right-0 top-full mt-1 bg-white border border-slate-200 shadow-lg rounded p-1 w-32 z-50 text-xs"
                      onClick={() => setShowAutoSumMenu(false)}
                    >
                      <button
                        onClick={() => onAutoSum('SUM')}
                        className="w-full text-right px-2 py-1 hover:bg-slate-100 rounded"
                      >
                        جمع (SUM)
                      </button>
                      <button
                        onClick={() => onAutoSum('AVERAGE')}
                        className="w-full text-right px-2 py-1 hover:bg-slate-100 rounded"
                      >
                        میانگین (AVERAGE)
                      </button>
                      <button
                        onClick={() => onAutoSum('COUNT')}
                        className="w-full text-right px-2 py-1 hover:bg-slate-100 rounded"
                      >
                        شمارش (COUNT)
                      </button>
                      <button
                        onClick={() => onAutoSum('MAX')}
                        className="w-full text-right px-2 py-1 hover:bg-slate-100 rounded"
                      >
                        بیشترین (MAX)
                      </button>
                      <button
                        onClick={() => onAutoSum('MIN')}
                        className="w-full text-right px-2 py-1 hover:bg-slate-100 rounded"
                      >
                        کمترین (MIN)
                      </button>
                    </div>
                  )}
                </div>

                {/* Sort buttons */}
                <button
                  onClick={() => onSort('asc')}
                  className="p-1.5 hover:bg-slate-100 rounded text-slate-700"
                  title="مرتب‌سازی صعودی (A-Z یا کم به زیاد)"
                >
                  <SortAsc className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onSort('desc')}
                  className="p-1.5 hover:bg-slate-100 rounded text-slate-700"
                  title="مرتب‌سازی نزولی (Z-A یا زیاد به کم)"
                >
                  <SortDesc className="w-3.5 h-3.5" />
                </button>

                {/* Find / Replace */}
                <button
                  onClick={onOpenFindReplace}
                  className="p-1.5 hover:bg-slate-100 rounded text-slate-700 flex items-center gap-1"
                  title="جستجو و جایگزینی (Ctrl+F)"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-[9px] text-slate-400 font-medium text-center">ویرایش و مرتب‌سازی</span>
            </div>
          </div>
        )}

        {/* INSERT TAB */}
        {activeTab === 'insert' && (
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenCharts}
              className="flex flex-col items-center gap-1 p-1.5 hover:bg-slate-100 rounded px-3 text-slate-700"
            >
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <span className="text-[11px] font-semibold">نمودارها (Charts)</span>
            </button>

            <button
              onClick={onOpenFunctions}
              className="flex flex-col items-center gap-1 p-1.5 hover:bg-slate-100 rounded px-3 text-slate-700"
            >
              <div className="w-5 h-5 rounded bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                fx
              </div>
              <span className="text-[11px] font-semibold">توابع و فرمول</span>
            </button>

            <button
              onClick={onOpenTemplates}
              className="flex flex-col items-center gap-1 p-1.5 hover:bg-slate-100 rounded px-3 text-slate-700"
            >
              <FolderOpen className="w-5 h-5 text-amber-600" />
              <span className="text-[11px] font-semibold">قالب‌های آماده</span>
            </button>

            <button
              onClick={onToggleAICopilot}
              className="flex flex-col items-center gap-1 p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded px-3 font-semibold"
            >
              <Sparkles className="w-5 h-5 text-amber-600 animate-bounce" />
              <span className="text-[11px]">ساخت جدول با AI</span>
            </button>
          </div>
        )}

        {/* FORMULAS TAB */}
        {activeTab === 'formulas' && (
          <div className="flex items-center gap-3 divide-x divide-slate-200 divide-x-reverse">
            <button
              onClick={onOpenFunctions}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-bold text-xs shadow-xs"
            >
              <span className="italic font-black text-sm">fx</span>
              <span>درج تابع (Insert Function)</span>
            </button>

            <div className="flex items-center gap-1 px-3">
              <button
                onClick={() => onAutoSum('SUM')}
                className="px-2 py-1 hover:bg-slate-100 rounded text-slate-700 font-medium"
              >
                SUM
              </button>
              <button
                onClick={() => onAutoSum('AVERAGE')}
                className="px-2 py-1 hover:bg-slate-100 rounded text-slate-700 font-medium"
              >
                AVERAGE
              </button>
              <button
                onClick={() => onAutoSum('COUNT')}
                className="px-2 py-1 hover:bg-slate-100 rounded text-slate-700 font-medium"
              >
                COUNT
              </button>
              <button
                onClick={() => onAutoSum('MAX')}
                className="px-2 py-1 hover:bg-slate-100 rounded text-slate-700 font-medium"
              >
                MAX
              </button>
              <button
                onClick={() => onAutoSum('MIN')}
                className="px-2 py-1 hover:bg-slate-100 rounded text-slate-700 font-medium"
              >
                MIN
              </button>
            </div>

            <button
              onClick={onToggleAICopilot}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded font-medium mr-2"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>فرمول‌ساز هوشمند جمینای</span>
            </button>
          </div>
        )}

        {/* DATA TAB */}
        {activeTab === 'data' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSort('asc')}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 rounded text-slate-800 font-medium"
            >
              <SortAsc className="w-4 h-4 text-emerald-600" />
              <span>مرتب‌سازی صعودی (A-Z)</span>
            </button>
            <button
              onClick={() => onSort('desc')}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 rounded text-slate-800 font-medium"
            >
              <SortDesc className="w-4 h-4 text-emerald-600" />
              <span>مرتب‌سازی نزولی (Z-A)</span>
            </button>
            <button
              onClick={onOpenFindReplace}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 rounded text-slate-800 font-medium"
            >
              <Search className="w-4 h-4 text-blue-600" />
              <span>جستجو و جایگزین داده‌ها</span>
            </button>
          </div>
        )}

        {/* PAGE LAYOUT TAB */}
        {activeTab === 'pageLayout' && (
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleRTL}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium ${
                isRTL ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
              }`}
            >
              <Languages className="w-4 h-4" />
              <span>جهت صفحه: {isRTL ? 'راست به چپ (فارسی)' : 'چپ به راست (انگلیسی)'}</span>
            </button>

            <button
              onClick={onPrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-800 font-medium"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>تنظیمات چاپ و حاشیه‌ها</span>
            </button>
          </div>
        )}

        {/* VIEW TAB */}
        {activeTab === 'view' && (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showGridLines}
                onChange={onToggleGridLines}
                className="accent-emerald-600"
              />
              <span>خطوط جدول (Gridlines)</span>
            </label>

            <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showHeaders}
                onChange={onToggleHeaders}
                className="accent-emerald-600"
              />
              <span>سرستون و سطرها (Headers)</span>
            </label>

            <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
              <span className="text-[11px] text-slate-500">بزرگ‌نمایی:</span>
              <button
                onClick={() => onZoomChange(Math.max(0.5, zoom - 0.1))}
                className="px-1.5 py-0.5 hover:bg-white rounded font-bold"
              >
                -
              </button>
              <span className="font-semibold text-xs">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => onZoomChange(Math.min(2.0, zoom + 0.1))}
                className="px-1.5 py-0.5 hover:bg-white rounded font-bold"
              >
                +
              </button>
              <button
                onClick={() => onZoomChange(1.0)}
                className="text-[10px] text-emerald-700 px-1 hover:underline"
              >
                100%
              </button>
            </div>
          </div>
        )}

        {/* AI TAB */}
        {activeTab === 'ai' && (
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleAICopilot}
              className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold rounded shadow-xs hover:brightness-110 transition-all text-xs"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>باز کردن دستیار هوشمند جمینای (Excel AI Copilot)</span>
            </button>
            <span className="text-xs text-slate-500">
              تولید فرمول با زبان محاوره‌ای، تحلیل هوشمند جداول و ایجاد جداول خودکار
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
