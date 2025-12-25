export interface FileData {
  name: string;
  content: string;
  size: number;
}

export interface Recommendation {
  action: string;
  impact: 'High' | 'Medium' | 'Low';
  description: string;
}

export interface ChartDataPoint {
  name: string;
  [key: string]: string | number;
}

export interface ChartConfig {
  title: string;
  type: 'bar' | 'line' | 'area';
  data: ChartDataPoint[];
  dataKeys: string[]; // Keys to plot (e.g., "Views", "Revenue")
  xAxisKey: string; // Key for X axis (e.g., "date", "videoTitle")
}

export interface AnalysisResult {
  filesDetected: Array<{ name: string; purpose: string }>;
  contentPerformance?: string;
  retention?: string;
  revenue?: string;
  thumbnails?: string;
  combinedStrategicInsights: string;
  recommendations: Recommendation[];
  charts?: ChartConfig[];
}

export enum AppState {
  IDLE,
  ANALYZING,
  COMPLETE,
  ERROR
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isStreaming?: boolean;
}