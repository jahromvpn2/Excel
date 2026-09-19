import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Send,
  Loader2,
  Table,
  LineChart,
  Code,
  MessageSquare,
  Check,
  Copy,
  Lightbulb,
} from 'lucide-react';
import { CellCoord, Sheet } from '../types';
import { coordToAddress } from '../utils/formulaEngine';

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeSheet: Sheet;
  activeCell: CellCoord;
  onInsertFormula: (formula: string) => void;
  onPopulateTable: (headers: string[], rows: any[][], title?: string) => void;
  onOpenCharts: () => void;
}

type AITab = 'formula' | 'insights' | 'table' | 'chat';

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({
  isOpen,
  onClose,
  activeSheet,
  activeCell,
  onInsertFormula,
  onPopulateTable,
  onOpenCharts,
}) => {
  const [activeTab, setActiveTab] = useState<AITab>('formula');

  // Formula state
  const [formulaPrompt, setFormulaPrompt] = useState('');
  const [isFormulaLoading, setIsFormulaLoading] = useState(false);
  const [generatedFormula, setGeneratedFormula] = useState<{
    formula: string;
    explanation: string;
    notes?: string;
  } | null>(null);

  // Insights state
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);
  const [insightsResult, setInsightsResult] = useState<{
    title: string;
    summary: string;
    insights: string[];
    chartRecommendation?: { type: string; reason: string };
  } | null>(null);

  // Generate Table state
  const [tableTopic, setTableTopic] = useState('');
  const [isTableLoading, setIsTableLoading] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<
    { role: 'user' | 'assistant'; text: string }[]
  >([
    {
      role: 'assistant',
      text: 'سلام! من دستیار هوش مصنوعی اکسل (Gemini Copilot) هستم. می‌توانید هر فرمولی را به زبان ساده از من بخواهید، یا بپرسید تا داده‌های کاربرگ را برایتان تحلیل کنم.',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  if (!isOpen) return null;

  const activeAddr = coordToAddress(activeCell);

  // 1. Generate Formula handler
  const handleGenerateFormula = async () => {
    if (!formulaPrompt.trim()) return;
    setIsFormulaLoading(true);
    try {
      // Gather context headers
      const sampleHeaders: string[] = [];
      for (let c = 0; c < 10; c++) {
        const addr = coordToAddress({ col: c, row: 2 });
        const val = activeSheet.cells[addr]?.raw;
        if (val) sampleHeaders.push(val);
      }

      const res = await fetch('/api/ai/formula', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: formulaPrompt,
          currentCell: activeAddr,
          contextData: { headers: sampleHeaders, sheetName: activeSheet.name },
          language: 'fa',
        }),
      });
      const data = await res.json();
      setGeneratedFormula(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsFormulaLoading(false);
    }
  };

  // 2. Analyze Table handler
  const handleAnalyzeTable = async () => {
    setIsInsightsLoading(true);
    try {
      // Extract up to 30 rows of data from active sheet
      const tableRows: any[][] = [];
      const headers: string[] = [];

      for (let c = 0; c < 8; c++) {
        const hAddr = coordToAddress({ col: c, row: 2 });
        headers.push(activeSheet.cells[hAddr]?.raw || `ستون ${c + 1}`);
      }

      for (let r = 3; r <= 30; r++) {
        const rowVals: any[] = [];
        let hasAny = false;
        for (let c = 0; c < 8; c++) {
          const addr = coordToAddress({ col: c, row: r });
          const cell = activeSheet.cells[addr];
          const v = cell?.computed !== undefined ? cell.computed : (cell?.raw ?? '');
          if (v !== '') hasAny = true;
          rowVals.push(v);
        }
        if (hasAny) tableRows.push(rowVals);
      }

      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableData: tableRows,
          headers,
          sheetName: activeSheet.name,
        }),
      });
      const data = await res.json();
      setInsightsResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsInsightsLoading(false);
    }
  };

  // 3. Generate Table handler
  const handleGenerateTable = async () => {
    if (!tableTopic.trim()) return;
    setIsTableLoading(true);
    try {
      const res = await fetch('/api/ai/generate-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: tableTopic,
          rowCount: 6,
        }),
      });
      const data = await res.json();
      if (data.headers && data.rows) {
        onPopulateTable(data.headers, data.rows, data.title);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTableLoading(false);
    }
  };

  // 4. Chat handler
  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const userText = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText }),
      });
      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: data.reply || 'پاسخی دریافت نشد.' },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'متأسفانه در برقراری ارتباط خطایی رخ داد.' },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-80 sm:w-96 bg-white border-r border-slate-200 shadow-2xl z-40 flex flex-col animate-in slide-in-from-left duration-200">
      {/* Drawer Header */}
      <div className="bg-gradient-to-r from-[#107c41] to-emerald-800 text-white p-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-900" />
          </div>
          <div>
            <h3 className="font-bold text-xs">دستیار هوشمند اکسل</h3>
            <span className="text-[10px] text-emerald-200">Powered by Gemini 3.8</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded transition-colors text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 text-xs">
        <button
          onClick={() => setActiveTab('formula')}
          className={`flex-1 py-2 font-medium flex items-center justify-center gap-1 border-b-2 transition-all ${
            activeTab === 'formula'
              ? 'border-emerald-600 text-emerald-700 bg-white font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>فرمول‌ساز</span>
        </button>

        <button
          onClick={() => setActiveTab('insights')}
          className={`flex-1 py-2 font-medium flex items-center justify-center gap-1 border-b-2 transition-all ${
            activeTab === 'insights'
              ? 'border-emerald-600 text-emerald-700 bg-white font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <LineChart className="w-3.5 h-3.5" />
          <span>تحلیل داده</span>
        </button>

        <button
          onClick={() => setActiveTab('table')}
          className={`flex-1 py-2 font-medium flex items-center justify-center gap-1 border-b-2 transition-all ${
            activeTab === 'table'
              ? 'border-emerald-600 text-emerald-700 bg-white font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          <span>ساخت جدول</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2 font-medium flex items-center justify-center gap-1 border-b-2 transition-all ${
            activeTab === 'chat'
              ? 'border-emerald-600 text-emerald-700 bg-white font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>چت و راهنما</span>
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* TAB 1: FORMULA GENERATOR */}
        {activeTab === 'formula' && (
          <div className="space-y-3">
            <div className="bg-emerald-50 text-emerald-900 p-2.5 rounded-lg border border-emerald-200">
              <div className="font-semibold mb-1 flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
                <span>تبدیل زبان طبیعی به فرمول اکسل</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                خانه‌ی فعال: <b className="font-mono bg-white px-1 py-0.5 rounded border">{activeAddr}</b>. هر عملیاتی را به فارسی بنویسید تا فرمول دقیق آن تولید شود.
              </p>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                شرح محاسبه مورد نظر:
              </label>
              <textarea
                value={formulaPrompt}
                onChange={(e) => setFormulaPrompt(e.target.value)}
                placeholder="مثال: مجموع هزینه‌های ستون D را اگر بالاتر از ۲ میلیون باشد جمع کن..."
                rows={3}
                className="w-full p-2 border border-slate-300 rounded text-xs focus:outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white transition-all"
              />
            </div>

            {/* Quick prompts */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400">پیشنهادهای آماده:</span>
              <div className="flex flex-wrap gap-1">
                {[
                  'جمع ستون تا خانه قبلی',
                  'میانگین با نمرات بالای ۱۲',
                  'شرط اگر نمره بیشتر از ۱۰ بود قبول وگرنه مردود',
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFormulaPrompt(s)}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded transition-colors text-right"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerateFormula}
              disabled={isFormulaLoading || !formulaPrompt.trim()}
              className="w-full py-2 bg-[#107c41] hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              {isFormulaLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-300" />
              )}
              <span>تولید فرمول هوشمند</span>
            </button>

            {/* Result Box */}
            {generatedFormula && (
              <div className="bg-slate-50 border border-emerald-300 rounded-lg p-3 space-y-2 mt-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-800 text-[11px]">
                    فرمول تولید شده:
                  </span>
                  <button
                    onClick={() => onInsertFormula(generatedFormula.formula)}
                    className="px-2.5 py-1 bg-[#107c41] text-white rounded font-bold hover:bg-emerald-700 flex items-center gap-1 text-[11px]"
                  >
                    <Check className="w-3 h-3" />
                    <span>درج در خانه {activeAddr}</span>
                  </button>
                </div>

                <div className="font-mono text-xs font-bold text-slate-900 bg-white p-2 border border-slate-200 rounded text-left" dir="ltr">
                  {generatedFormula.formula}
                </div>

                <p className="text-slate-700 text-[11px] leading-relaxed">
                  {generatedFormula.explanation}
                </p>

                {generatedFormula.notes && (
                  <p className="text-slate-500 text-[10px]">
                    نکته: {generatedFormula.notes}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SMART DATA INSIGHTS */}
        {activeTab === 'insights' && (
          <div className="space-y-3">
            <div className="bg-blue-50 text-blue-900 p-2.5 rounded-lg border border-blue-200">
              <p className="text-[11px] leading-relaxed">
                هوش مصنوعی کل مقادیر جدول کاربرگ <b>{activeSheet.name}</b> را اسکن کرده و بینش‌های آماری، ناهنجاری‌ها و بهترین نوع نمودار را پیشنهاد می‌دهد.
              </p>
            </div>

            <button
              onClick={handleAnalyzeTable}
              disabled={isInsightsLoading}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              {isInsightsLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LineChart className="w-4 h-4 text-blue-200" />
              )}
              <span>شروع تحلیل آماری و استخراج بینش</span>
            </button>

            {insightsResult && (
              <div className="space-y-3 mt-4 animate-in fade-in">
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <h4 className="font-bold text-slate-800 mb-1">{insightsResult.title}</h4>
                  <p className="text-slate-600 text-[11px] leading-relaxed mb-2">
                    {insightsResult.summary}
                  </p>

                  <div className="space-y-1 mt-2">
                    <span className="font-semibold text-slate-700 text-[11px] block">
                      یافته‌های کلیدی:
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] pr-1">
                      {insightsResult.insights.map((ins, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {ins}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {insightsResult.chartRecommendation && (
                  <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-emerald-900 block">
                        پیشنهاد نمودار: {insightsResult.chartRecommendation.type.toUpperCase()}
                      </span>
                      <p className="text-emerald-700 text-[10px] mt-0.5">
                        {insightsResult.chartRecommendation.reason}
                      </p>
                    </div>
                    <button
                      onClick={onOpenCharts}
                      className="px-3 py-1.5 bg-[#107c41] text-white rounded font-bold hover:bg-emerald-700 text-xs shrink-0"
                    >
                      رسم نمودار
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: GENERATE COMPLETE TABLE */}
        {activeTab === 'table' && (
          <div className="space-y-3">
            <div className="bg-amber-50 text-amber-900 p-2.5 rounded-lg border border-amber-200">
              <p className="text-[11px] leading-relaxed">
                موضوع مورد نظر خود را بنویسید تا جمینای یک جدول کامل با سرستون‌ها، داده‌های واقعی و فرمول‌های محاسبه خودکار ایجاد کند.
              </p>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                موضوع یا عنوان جدول:
              </label>
              <input
                type="text"
                value={tableTopic}
                onChange={(e) => setTableTopic(e.target.value)}
                placeholder="مثال: فاکتور فروش قطعات کامپیوتر با تعداد و قیمت..."
                className="w-full p-2 border border-slate-300 rounded text-xs focus:outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white"
              />
            </div>

            <button
              onClick={handleGenerateTable}
              disabled={isTableLoading || !tableTopic.trim()}
              className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-bold rounded flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              {isTableLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Table className="w-4 h-4" />
              )}
              <span>ایجاد و درج خودکار جدول</span>
            </button>
          </div>
        )}

        {/* TAB 4: CHAT & HELP */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full justify-between space-y-3">
            <div className="flex-1 overflow-y-auto space-y-2.5 max-h-72 p-1">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-lg leading-relaxed text-[11px] ${
                    msg.role === 'user'
                      ? 'bg-[#107c41] text-white mr-6'
                      : 'bg-slate-100 text-slate-800 ml-6 border border-slate-200'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              {isChatLoading && (
                <div className="flex items-center gap-1 text-slate-400 text-xs p-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>درحال تایپ پاسخ...</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 pt-2 border-t border-slate-200">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder="سوال درباره فرمول‌ها یا اکسل..."
                className="flex-1 p-2 border border-slate-300 rounded text-xs focus:outline-none focus:border-emerald-600"
              />
              <button
                onClick={handleSendChat}
                disabled={isChatLoading || !chatInput.trim()}
                className="p-2 bg-[#107c41] hover:bg-emerald-700 text-white rounded disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
