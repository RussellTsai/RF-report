
export interface ExcelRow {
  label: string;
  values: number[];
}

export interface DataBlock {
  id: string;
  title: string;
  curves: ExcelRow[];
  frequencyRow?: ExcelRow;
}

export interface ChartConfig {
  id: number;
  title: string;
  selectedCurves: string[]; // 格式為 "blockId|curveLabel"
  freqMin: number;
  freqMax: number;
  yMin: number | 'auto';
  yMax: number | 'auto';
  isConfigured: boolean;
}

export interface ProcessedData {
  blocks: DataBlock[];
  allCurveLabels: { blockId: string; label: string }[];
}
