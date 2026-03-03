
import React, { useState, useMemo } from 'react';
import { Upload, BarChart3, Plus, Minus, Layers, Settings2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { DataBlock, ChartConfig, ProcessedData, ExcelRow } from './types';
import ConfigPanel from './components/ConfigPanel';
import ChartDisplay from './components/ChartDisplay';

const App: React.FC = () => {
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [chartCount, setChartCount] = useState<number>(1);
  const [activeChartIndex, setActiveChartIndex] = useState<number>(0);
  const [chartConfigs, setChartConfigs] = useState<ChartConfig[]>([
    { id: 0, title: '', selectedCurves: [], freqMin: 0, freqMax: 5000, yMin: 'auto', yMax: 'auto', isConfigured: false }
  ]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const blocks: DataBlock[] = [];
      let currentRows: ExcelRow[] = [];

      json.forEach((row) => {
        const label = row[0]?.toString().trim();
        const hasValues = row.slice(1).some(v => v !== null && v !== undefined && v !== '');

        if (!label && !hasValues) {
          if (currentRows.length > 0) {
            blocks.push(createBlock(currentRows, blocks.length));
            currentRows = [];
          }
        } else if (label || hasValues) {
          currentRows.push({
            label: label || `Unnamed_Row_${currentRows.length}`,
            values: row.slice(1).map(v => parseFloat(v)).filter(v => !isNaN(v))
          });
        }
      });

      if (currentRows.length > 0) {
        blocks.push(createBlock(currentRows, blocks.length));
      }

      setProcessedData({
        blocks,
        allCurveLabels: blocks.flatMap(b => b.curves.map(c => ({ blockId: b.id, label: c.label })))
      });
      
      // 初始化配置
      if (blocks.length > 0) {
        updateChartConfig(0, {
          title: blocks[0].title,
          isConfigured: false
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const createBlock = (rows: ExcelRow[], index: number): DataBlock => {
    const title = rows[0].label;
    const freqRow = rows.find(r => r.label.toLowerCase().includes('frequency'));
    const curves = rows.slice(1).filter(r => !r.label.toLowerCase().includes('frequency'));
    return { id: `block-${index}`, title, curves, frequencyRow: freqRow };
  };

  const updateChartConfig = (index: number, updates: Partial<ChartConfig>) => {
    setChartConfigs(prev => {
      const newConfigs = [...prev];
      newConfigs[index] = { ...newConfigs[index], ...updates };
      return newConfigs;
    });
  };

  const handleChartCountChange = (newCount: number) => {
    const count = Math.max(1, Math.min(6, newCount));
    setChartCount(count);
    setChartConfigs(prev => {
      const next = [...prev];
      if (count > prev.length) {
        for (let i = prev.length; i < count; i++) {
          next.push({ id: i, title: '', selectedCurves: [], freqMin: 0, freqMax: 5000, yMin: 'auto', yMax: 'auto', isConfigured: false });
        }
      }
      return next.slice(0, count);
    });
    if (activeChartIndex >= count) setActiveChartIndex(count - 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <BarChart3 size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">RF 數據分析專家 v2</h1>
            <p className="text-xs text-slate-500 font-medium italic">Multi-Chart Visualizer</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            <span className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">圖表數量</span>
            <button onClick={() => handleChartCountChange(chartCount - 1)} className="p-1.5 hover:bg-white rounded-md text-slate-600 transition-colors"><Minus size={16}/></button>
            <span className="w-8 text-center font-bold text-indigo-600">{chartCount}</span>
            <button onClick={() => handleChartCountChange(chartCount + 1)} className="p-1.5 hover:bg-white rounded-md text-slate-600 transition-colors"><Plus size={16}/></button>
          </div>
          
          <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold cursor-pointer hover:bg-indigo-700 transition-all shadow-md">
            <Upload size={16} />
            {processedData ? "更換檔案" : "選擇 Excel"}
            <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleFileUpload} />
          </label>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Config */}
        <div className="w-80 bg-white border-r border-slate-200 overflow-y-auto custom-scrollbar shadow-inner">
          {processedData ? (
            <div className="p-4 space-y-4">
              <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 mb-4">
                <p className="text-xs font-bold text-indigo-700 flex items-center gap-1.5 uppercase">
                  <Settings2 size={14} /> 正在編輯
                </p>
                <p className="text-sm font-bold text-slate-800">圖表位 #{activeChartIndex + 1}</p>
              </div>
              
              <ConfigPanel 
                processedData={processedData}
                config={chartConfigs[activeChartIndex]}
                setConfig={(updates) => updateChartConfig(activeChartIndex, updates)}
                onGenerate={() => updateChartConfig(activeChartIndex, { isConfigured: true })}
              />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Layers size={48} className="mb-4 opacity-20" />
              <p className="font-medium">尚未載入數據</p>
              <p className="text-xs">請點擊上方按鈕上傳檔案</p>
            </div>
          )}
        </div>

        {/* Right Content: Multi-Chart Slots */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-100 custom-scrollbar">
          <div className={`grid gap-6 ${chartCount > 1 ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
            {chartConfigs.map((cfg, idx) => (
              <div 
                key={idx}
                onClick={() => setActiveChartIndex(idx)}
                className={`min-h-[400px] rounded-2xl transition-all cursor-pointer relative overflow-hidden group
                  ${activeChartIndex === idx ? 'ring-4 ring-indigo-500 shadow-xl scale-[1.01]' : 'bg-white/50 border-2 border-dashed border-slate-300 hover:border-indigo-300 hover:bg-white'}
                `}
              >
                <div className="absolute top-4 left-4 z-10">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${activeChartIndex === idx ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    Slot {idx + 1}
                  </span>
                </div>

                {cfg.isConfigured && processedData ? (
                  <ChartDisplay 
                    config={cfg}
                    blocks={processedData.blocks}
                    onYAxisClick={() => {
                        // We trigger a "focus" or scroll to the Y-axis config in the sidebar
                        const yAxisEl = document.getElementById('y-axis-config');
                        if (yAxisEl) yAxisEl.scrollIntoView({ behavior: 'smooth' });
                    }}
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                    <BarChart3 size={40} className="opacity-20 group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-medium">點擊此處進行配置</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
