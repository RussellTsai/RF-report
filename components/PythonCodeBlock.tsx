
import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { ChartConfig } from '../types';

interface PythonCodeBlockProps {
  config: ChartConfig;
}

const PythonCodeBlock: React.FC<PythonCodeBlockProps> = ({ config }) => {
  const [copied, setCopied] = useState(false);

  const pythonCode = `
import pandas as pd
import matplotlib.pyplot as plt

# 1. 讀取數據 (假設檔名為 data.xlsx)
# 此處建議將您的 Excel 檔案轉置，或直接讀取 A 欄為 Header
df = pd.read_excel('data.xlsx', index_col=0).T

# 2. 參數設定
TITLE = "${config.title}"
X_AXIS = "${config.xAxisLabel}"
SELECTED_CURVES = ${JSON.stringify(config.selectedCurves)}
FREQ_MIN = ${config.freqMin}
FREQ_MAX = ${config.freqMax}

# 3. 數據過濾
# 假設 X_AXIS 已經是 DataFrame 的一欄
# 如果是轉置過的，我們通常直接過濾 index 或 columns
df_filtered = df[(df[X_AXIS] >= FREQ_MIN) & (df[X_AXIS] <= FREQ_MAX)]

# 4. 繪圖
plt.figure(figsize=(10, 6), facecolor='white')
plt.grid(True, linestyle='--', alpha=0.7)

colors = ${JSON.stringify(['#4F46E5', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'])}

for i, curve in enumerate(SELECTED_CURVES):
    plt.plot(df_filtered[X_AXIS], df_filtered[curve], label=curve, color=colors[i % len(colors)], linewidth=2)

plt.title(TITLE, fontsize=14, fontweight='bold', pad=15)
plt.xlabel(X_AXIS, fontsize=12)
plt.ylabel("Magnitude / Value", fontsize=12)
plt.legend()
plt.tight_layout()

# 顯示圖表
plt.show()
  `.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <button 
        onClick={handleCopy}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-indigo-100 rounded-lg transition-colors z-20"
      >
        {copied ? <Check size={18} /> : <Copy size={18} />}
      </button>
      <pre className="p-6 bg-slate-900 text-indigo-50 overflow-x-auto text-sm leading-relaxed custom-scrollbar max-h-[400px]">
        <code>{pythonCode}</code>
      </pre>
    </div>
  );
};

export default PythonCodeBlock;
