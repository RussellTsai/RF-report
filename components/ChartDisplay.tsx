
import React, { useMemo, useRef } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label
} from 'recharts';
import { Download } from 'lucide-react';
import { ChartConfig, DataBlock } from '../types';

interface ChartDisplayProps {
  config: ChartConfig;
  blocks: DataBlock[];
  onYAxisClick?: () => void;
}

const COLORS = ['#4F46E5', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

const ChartDisplay: React.FC<ChartDisplayProps> = ({ config, blocks, onYAxisClick }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  const chartData = useMemo(() => {
    const selectedBlockIds = Array.from(new Set(config.selectedCurves.map(id => id.split('|')[0])));
    const frequencyMap: Map<number, any> = new Map();

    selectedBlockIds.forEach(blockId => {
      const block = blocks.find(b => b.id === blockId);
      if (!block || !block.frequencyRow) return;

      const freqs = block.frequencyRow.values;
      freqs.forEach((f, idx) => {
        if (f < config.freqMin || f > config.freqMax) return;
        
        if (!frequencyMap.has(f)) {
          frequencyMap.set(f, { frequency: f });
        }
        
        const dataPoint = frequencyMap.get(f);
        
        config.selectedCurves.forEach(curveId => {
          const [bId, curveLabel] = curveId.split('|');
          if (bId === blockId) {
            const curve = block.curves.find(c => c.label === curveLabel);
            if (curve && curve.values[idx] !== undefined) {
              dataPoint[curveId] = curve.values[idx];
            }
          }
        });
      });
    });

    return Array.from(frequencyMap.values()).sort((a, b) => a.frequency - b.frequency);
  }, [config, blocks, config.freqMin, config.freqMax]);

  const xTickInterval = useMemo(() => {
    const total = chartData.length;
    if (total <= 35) return 0;
    return (index: number) => {
      if (index === 0 || index === total - 1) return true;
      const step = Math.floor(total / 30);
      return index % step === 0 && (total - 1 - index) > (step / 2);
    };
  }, [chartData]);

  const handleDownload = async () => {
    if (!chartRef.current) return;

    // 我們獲取內層包含邊框的容器
    const chartContainer = chartRef.current.querySelector('.chart-inner-container');
    const svgElement = chartRef.current.querySelector('svg');
    if (!svgElement || !chartContainer) return;

    const clonedSvg = svgElement.cloneNode(true) as SVGElement;
    clonedSvg.setAttribute('style', 'background-color: white; font-family: sans-serif;');
    
    // 確保下載圖檔中文字可見
    clonedSvg.querySelectorAll('text').forEach(t => {
      if (!t.getAttribute('fill')) t.setAttribute('fill', '#475569');
    });

    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    const scale = 3; // 高解析度
    const width = chartContainer.clientWidth;
    const height = chartContainer.clientHeight;
    canvas.width = width * scale;
    canvas.height = height * scale;

    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      if (ctx) {
        // 繪製背景
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 繪製 SVG 圖表內容
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // 繪製完整邊框 (在 Canvas 上重現外框)
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2 * scale;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `${config.title || 'RF_Measurement'}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="h-full w-full bg-white p-4 flex flex-col relative group/chart" ref={chartRef}>
      <div className="mb-4 flex items-center justify-between px-2">
        <div className="w-10" />
        <h3 className="text-lg font-bold text-slate-800 text-center flex-1 truncate px-2">
          {config.title || "圖表標題"}
        </h3>
        <button 
          onClick={handleDownload}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-indigo-600 transition-all opacity-0 group-hover/chart:opacity-100 flex items-center justify-center bg-white shadow-sm border border-slate-200"
          title="下載圖檔 (PNG)"
        >
          <Download size={18} />
        </button>
      </div>
      
      {/* 完整框線容器 */}
      <div className="flex-1 min-h-0 border-2 border-slate-400 rounded-lg overflow-hidden relative shadow-sm chart-inner-container bg-white">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 65 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            
            <XAxis 
              dataKey="frequency" 
              type="category"
              fontSize={9}
              stroke="#475569"
              interval={xTickInterval}
              tick={{ angle: -90, textAnchor: 'end', dy: 10 }}
              height={90}
              axisLine={{ stroke: '#64748b', strokeWidth: 1.5 }}
            >
              <Label 
                value="Frequency (MHz)" 
                offset={-75} 
                position="insideBottom" 
                fill="#475569" 
                fontWeight="bold" 
                fontSize={10} 
              />
            </XAxis>
            
            <YAxis 
                fontSize={10} 
                stroke="#475569" 
                // 當 config.yMin/Max 為 'auto' 時，Recharts 會自動計算所有 Line 的範圍
                domain={[config.yMin, config.yMax]}
                onClick={onYAxisClick}
                style={{ cursor: 'pointer' }}
                allowDataOverflow={true}
                axisLine={{ stroke: '#64748b', strokeWidth: 1.5 }}
                tickFormatter={(val) => typeof val === 'number' ? val.toFixed(1) : val}
            >
              <Label value="Magnitude (dB)" angle={-90} position="insideLeft" offset={10} fill="#475569" fontWeight="bold" fontSize={10} />
            </YAxis>
            
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
              labelFormatter={(val) => `Frequency: ${val} MHz`}
            />
            
            <Legend 
              verticalAlign="top" 
              height={40} 
              iconType="plainline" 
              iconSize={20}
              wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingBottom: '15px' }} 
            />
            
            {config.selectedCurves.map((curveId, index) => (
              <Line
                key={curveId}
                name={curveId.split('|')[1]}
                type="monotone"
                dataKey={curveId}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2.5}
                dot={chartData.length < 100}
                activeDot={{ r: 5 }}
                animationDuration={800}
                connectNulls={true}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartDisplay;
