
import React from 'react';
import { ChartConfig, ProcessedData } from '../types';
import { Type, Activity, Hash, CheckSquare, Square, ArrowUpDown } from 'lucide-react';

interface ConfigPanelProps {
  processedData: ProcessedData;
  config: ChartConfig;
  setConfig: (updates: Partial<ChartConfig>) => void;
  onGenerate: () => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ processedData, config, setConfig, onGenerate }) => {
  const { blocks } = processedData;

  const handleToggleCurve = (curveId: string) => {
    const selected = config.selectedCurves.includes(curveId)
      ? config.selectedCurves.filter(c => c !== curveId)
      : [...config.selectedCurves, curveId];
    setConfig({ selectedCurves: selected });
  };

  const handleSelectAll = () => {
    const allIds = blocks.flatMap(b => b.curves.map(c => `${b.id}|${c.label}`));
    const allSelected = allIds.every(id => config.selectedCurves.includes(id));
    
    if (allSelected) {
      setConfig({ selectedCurves: [] });
    } else {
      setConfig({ selectedCurves: allIds });
    }
  };

  const handleYLimitChange = (key: 'yMin' | 'yMax', val: string) => {
    if (val === '') {
        setConfig({ [key]: 'auto' });
    } else {
        setConfig({ [key]: parseFloat(val) });
    }
  }

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Title Selection (Only Block Headers) */}
      <section>
        <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
          <Type size={14} /> 1. 選擇標題 (A欄首位)
        </label>
        <select 
          value={config.title}
          onChange={(e) => setConfig({ title: e.target.value })}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
        >
          <option value="">-- 請選擇標題 --</option>
          {blocks.map(b => (
            <option key={b.id} value={b.title}>{b.title}</option>
          ))}
        </select>
      </section>

      {/* 2. Curve Selection grouped by Block */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
            <Activity size={14} /> 2. 選擇繪製曲線
          </label>
          <button 
            onClick={handleSelectAll}
            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            {config.selectedCurves.length === blocks.flatMap(b => b.curves).length ? (
              <><Square size={10}/> 取消全選</>
            ) : (
              <><CheckSquare size={10}/> 全選</>
            )}
          </button>
        </div>
        
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar border border-slate-100 rounded-xl p-3 bg-slate-50/50">
          {blocks.map(block => (
            <div key={block.id} className="space-y-1.5">
              <p className="text-[10px] font-black text-slate-400 bg-white px-2 py-1 rounded border border-slate-100 shadow-sm inline-block">{block.title}</p>
              <div className="grid grid-cols-1 gap-1 pl-1">
                {block.curves.map(curve => {
                  const curveId = `${block.id}|${curve.label}`;
                  const isChecked = config.selectedCurves.includes(curveId);
                  return (
                    <label 
                      key={curveId} 
                      className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all border ${isChecked ? 'bg-indigo-50 border-indigo-200' : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200'}`}
                    >
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleCurve(curveId)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <span className={`text-xs font-medium ${isChecked ? 'text-indigo-700' : 'text-slate-600'}`}>{curve.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Range Filter */}
      <section>
        <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
          <Hash size={14} /> 3. 頻率範圍過濾 (MHz)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 ml-1">MIN</span>
            <input 
              type="number"
              value={config.freqMin}
              onChange={(e) => setConfig({ freqMin: parseFloat(e.target.value) })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 ml-1">MAX</span>
            <input 
              type="number"
              value={config.freqMax}
              onChange={(e) => setConfig({ freqMax: parseFloat(e.target.value) })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
      </section>

      {/* 4. Y-Axis Scale (New) */}
      <section id="y-axis-config">
        <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
          <ArrowUpDown size={14} /> 4. 縱軸範圍調整 (dB)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 ml-1">Y-MIN</span>
            <input 
              type="number"
              placeholder="Auto"
              value={config.yMin === 'auto' ? '' : config.yMin}
              onChange={(e) => handleYLimitChange('yMin', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 ml-1">Y-MAX</span>
            <input 
              type="number"
              placeholder="Auto"
              value={config.yMax === 'auto' ? '' : config.yMax}
              onChange={(e) => handleYLimitChange('yMax', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
      </section>

      <button 
        onClick={onGenerate}
        disabled={config.selectedCurves.length === 0}
        className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-lg"
      >
        產出圖表
      </button>
    </div>
  );
};

export default ConfigPanel;
