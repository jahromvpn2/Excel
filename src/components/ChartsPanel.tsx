import React, { useState, useMemo } from 'react';
import { X, BarChart3, PieChart, LineChart, Download, Sparkles } from 'lucide-react';
import { SelectionRange, Sheet } from '../types';
import { coordToAddress } from '../utils/formulaEngine';

interface ChartsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sheet: Sheet;
  selectionRange: SelectionRange | null;
}

type ChartType = 'column' | 'bar' | 'line' | 'pie';

export const ChartsPanel: React.FC<ChartsPanelProps> = ({
  isOpen,
  onClose,
  sheet,
  selectionRange,
}) => {
  const [chartType, setChartType] = useState<ChartType>('column');
  const [chartTitle, setChartTitle] = useState('نمودار تحلیلی داده‌ها');

  // Extract data from the selection range or automatically scan the first 8 rows
  const chartData = useMemo(() => {
    let minCol = 0;
    let maxCol = 1;
    let minRow = 2;
    let maxRow = 8;

    if (selectionRange) {
      minCol = Math.min(selectionRange.start.col, selectionRange.end.col);
      maxCol = Math.max(selectionRange.start.col, selectionRange.end.col);
      minRow = Math.min(selectionRange.start.row, selectionRange.end.row);
      maxRow = Math.max(selectionRange.start.row, selectionRange.end.row);
    }

    const items: { label: string; value: number }[] = [];

    for (let r = minRow; r <= maxRow; r++) {
      const labelAddr = coordToAddress({ col: minCol, row: r });
      const valAddr = coordToAddress({ col: maxCol === minCol ? minCol + 1 : maxCol, row: r });

      const labelCell = sheet.cells[labelAddr];
      const valCell = sheet.cells[valAddr];

      const label = labelCell?.raw || `مورد ${r}`;
      let val = 0;
      if (valCell) {
        const parsed =
          typeof valCell.computed === 'number'
            ? valCell.computed
            : parseFloat(String(valCell.computed ?? valCell.raw ?? '0'));
        if (!isNaN(parsed)) val = parsed;
      }

      if (label || val > 0) {
        items.push({ label, value: val });
      }
    }

    return items;
  }, [selectionRange, sheet]);

  if (!isOpen) return null;

  const maxValue = Math.max(...chartData.map((d) => d.value), 1);
  const totalValue = chartData.reduce((acc, d) => acc + d.value, 0) || 1;

  const colors = [
    '#107c41',
    '#0d6efd',
    '#f59e0b',
    '#dc2626',
    '#8b5cf6',
    '#06b6d4',
    '#ec4899',
    '#14b8a6',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#107c41] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            <h3 className="font-bold text-sm">ابزار ایجاد و ترسیم نمودار (Chart Generator)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded p-0.5">
            <button
              onClick={() => setChartType('column')}
              className={`px-3 py-1 rounded flex items-center gap-1 font-medium transition-colors ${
                chartType === 'column' ? 'bg-[#107c41] text-white font-bold' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>ستونی (Column)</span>
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 rounded flex items-center gap-1 font-medium transition-colors ${
                chartType === 'bar' ? 'bg-[#107c41] text-white font-bold' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 rotate-90" />
              <span>افقی (Bar)</span>
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 rounded flex items-center gap-1 font-medium transition-colors ${
                chartType === 'line' ? 'bg-[#107c41] text-white font-bold' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>خطی (Line)</span>
            </button>
            <button
              onClick={() => setChartType('pie')}
              className={`px-3 py-1 rounded flex items-center gap-1 font-medium transition-colors ${
                chartType === 'pie' ? 'bg-[#107c41] text-white font-bold' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>دایره‌ای (Pie)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={chartTitle}
              onChange={(e) => setChartTitle(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-800 focus:outline-none focus:border-emerald-600 w-44"
              placeholder="عنوان نمودار..."
            />
          </div>
        </div>

        {/* Chart Canvas Area */}
        <div className="p-6 flex-1 flex flex-col items-center justify-center min-h-[320px] bg-white overflow-y-auto">
          <div className="w-full text-center font-bold text-slate-800 text-sm mb-4">
            {chartTitle}
          </div>

          {chartData.length === 0 ? (
            <div className="text-slate-400 text-xs text-center py-12">
              داده‌ای برای رسم نمودار انتخاب نشده است. لطفاً ابتدا ستون‌های داده را در کاربرگ با ماوس انتخاب کنید.
            </div>
          ) : (
            <div className="w-full max-w-lg h-64 flex items-center justify-center">
              {/* COLUMN CHART */}
              {chartType === 'column' && (
                <div className="w-full h-full flex items-end justify-between gap-3 border-b-2 border-slate-300 pb-2 px-4">
                  {chartData.map((item, idx) => {
                    const heightPercent = Math.max(6, (item.value / maxValue) * 100);
                    const color = colors[idx % colors.length];

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                        <span className="text-[10px] font-mono text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.value.toLocaleString()}
                        </span>
                        <div
                          style={{
                            height: `${heightPercent}%`,
                            backgroundColor: color,
                          }}
                          className="w-full rounded-t-sm shadow-xs transition-all hover:brightness-110"
                        />
                        <span className="text-[10px] text-slate-700 truncate w-full text-center mt-1" title={item.label}>
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* BAR CHART */}
              {chartType === 'bar' && (
                <div className="w-full h-full flex flex-col justify-between gap-2 border-r-2 border-slate-300 pr-2">
                  {chartData.map((item, idx) => {
                    const widthPercent = Math.max(8, (item.value / maxValue) * 100);
                    const color = colors[idx % colors.length];

                    return (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <span className="w-24 text-right truncate text-[11px] text-slate-700" title={item.label}>
                          {item.label}
                        </span>
                        <div className="flex-1 h-5 bg-slate-100 rounded-xs overflow-hidden flex items-center">
                          <div
                            style={{
                              width: `${widthPercent}%`,
                              backgroundColor: color,
                            }}
                            className="h-full rounded-xs transition-all flex items-center justify-end px-2"
                          >
                            <span className="text-[9px] font-bold text-white">
                              {item.value.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* LINE CHART (SVG) */}
              {chartType === 'line' && (
                <div className="w-full h-full relative p-2">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200">
                    <defs>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#107c41" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#107c41" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    <line x1="0" y1="50" x2="500" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="150" x2="500" y2="150" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="190" x2="500" y2="190" stroke="#cbd5e1" strokeWidth="1.5" />

                    {/* Polyline */}
                    {(() => {
                      const points = chartData.map((d, i) => {
                        const x = (i / Math.max(1, chartData.length - 1)) * 480 + 10;
                        const y = 180 - (d.value / maxValue) * 150;
                        return `${x},${y}`;
                      });
                      const pointsStr = points.join(' ');
                      const areaStr = `10,190 ${pointsStr} 490,190`;

                      return (
                        <>
                          <polygon points={areaStr} fill="url(#lineGrad)" />
                          <polyline
                            points={pointsStr}
                            fill="none"
                            stroke="#107c41"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {chartData.map((d, i) => {
                            const x = (i / Math.max(1, chartData.length - 1)) * 480 + 10;
                            const y = 180 - (d.value / maxValue) * 150;
                            return (
                              <g key={i}>
                                <circle cx={x} cy={y} r="5" fill="#107c41" stroke="#ffffff" strokeWidth="2" />
                                <text x={x} y={y - 8} fontSize="10" textAnchor="middle" fill="#334155" fontWeight="bold">
                                  {d.value.toLocaleString()}
                                </text>
                                <text x={x} y={198} fontSize="9" textAnchor="middle" fill="#64748b">
                                  {d.label}
                                </text>
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              )}

              {/* PIE CHART (SVG) */}
              {chartType === 'pie' && (
                <div className="flex items-center justify-center gap-6 w-full">
                  <svg className="w-48 h-48" viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)' }}>
                    {(() => {
                      let accumulatedAngle = 0;
                      return chartData.map((d, i) => {
                        const sliceFraction = d.value / totalValue;
                        const sliceAngle = sliceFraction * 2 * Math.PI;

                        const startAngle = accumulatedAngle;
                        const endAngle = accumulatedAngle + sliceAngle;
                        accumulatedAngle = endAngle;

                        const x1 = Math.cos(startAngle);
                        const y1 = Math.sin(startAngle);
                        const x2 = Math.cos(endAngle);
                        const y2 = Math.sin(endAngle);

                        const largeArcFlag = sliceFraction > 0.5 ? 1 : 0;
                        const pathData = `M 0 0 L ${x1} ${y1} A 1 1 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                        return (
                          <path
                            key={i}
                            d={pathData}
                            fill={colors[i % colors.length]}
                            stroke="#ffffff"
                            strokeWidth="0.02"
                            className="hover:opacity-90 transition-opacity"
                          />
                        );
                      });
                    })()}
                  </svg>

                  {/* Legend */}
                  <div className="flex flex-col gap-1.5 text-xs max-h-48 overflow-y-auto">
                    {chartData.map((d, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-xs shrink-0"
                          style={{ backgroundColor: colors[i % colors.length] }}
                        />
                        <span className="text-slate-700 truncate max-w-[120px]" title={d.label}>
                          {d.label}:
                        </span>
                        <span className="font-bold text-slate-900 font-mono">
                          {((d.value / totalValue) * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            برای تغییر داده‌ها، ستون‌های دیگری از صفحه را انتخاب کنید.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#107c41] text-white font-bold rounded hover:bg-emerald-700 transition-colors"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
