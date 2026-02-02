// Exact JSON spec format requested
export interface LayoutMeta {
  name: string;
  cols: number;
  rows: number;
}

export interface LayoutTheme {
  preset: string;
  secondaryPreset?: string;
  dualMode?: 'blend' | 'split';
  animation?: 'none' | 'breathe' | 'rolling' | 'gradient';
  // Custom extracted colors
  custom?: {
    primary: string;
    secondary: string;
    background: string;
  };
}

export interface LayoutRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LayoutStyle {
  border: boolean;
  borderStyle: 'single' | 'round' | 'double' | 'bold' | 'dashed' | 'dotted';
  padding: 0 | 1 | 2;
  color: string;
  // Flexbox & Constraints
  flexDirection?: 'row' | 'column';
  flexGrow?: number;
  minWidth?: number;
  minHeight?: number;
}

export interface LayoutContent {
  title?: string;
  body?: string; // Added for ASCII art or text content
}

// Expanded semantic types
export type NodeType = 
  | 'header' | 'sidebar' | 'main' | 'log' | 'list' | 'table' | 'input' | 'status' | 'frame'
  | 'dataTable' | 'formInput' | 'progressBar';

export interface LayoutNode {
  id: string;
  name: string;
  type: NodeType;
  rect: LayoutRect;
  style: LayoutStyle;
  content: LayoutContent;
  children?: LayoutNode[];
  // Interaction
  focusOrder?: number;
  isFocusable?: boolean;
}

export interface TerminalLayoutSpec {
  meta: LayoutMeta;
  theme: LayoutTheme;
  nodes: LayoutNode[];
}

export interface AnalysisState {
  status: 'idle' | 'analyzing' | 'success' | 'error' | 'refining';
  data: TerminalLayoutSpec | null;
  error: string | null;
  imageUrl: string | null;
}