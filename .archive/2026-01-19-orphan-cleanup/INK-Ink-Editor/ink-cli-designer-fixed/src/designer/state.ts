import { LayoutNode, ScreenSpec } from '../generator/spec.js';
import { generateId } from '../utils/ids.js';
import { clamp } from '../utils/clamp.js';

export type DesignerMode = 'view' | 'edit-props' | 'help' | 'save';

export type Padding = 0 | 1 | 2;
export type BorderStyle = LayoutNode['style']['borderStyle'];
export type NodeType = LayoutNode['type'];
export type StyleColor = NonNullable<LayoutNode['style']['color']>;

export interface DesignerState {
  spec: ScreenSpec;
  selectedNodeId: string | null;
  mode: DesignerMode;
  showHelp: boolean;
  debugOverlay: boolean;
  statusMessage: string;
}

export type Action =
  | { type: 'ADD_PANEL' }
  | { type: 'DELETE_PANEL' }
  | { type: 'SELECT_NEXT' }
  | { type: 'SELECT_PREV' }
  | { type: 'MOVE_RECT'; dx: number; dy: number }
  | { type: 'RESIZE_RECT'; dw: number; dh: number }
  | { type: 'SET_NAME'; name: string }
  | { type: 'SET_TYPE'; nodeType: NodeType }
  | { type: 'SET_TITLE'; title: string }
  | { type: 'SET_BORDER'; border: boolean }
  | { type: 'SET_BORDER_STYLE'; borderStyle: BorderStyle }
  | { type: 'SET_PADDING'; padding: Padding }
  | { type: 'SET_COLOR'; color: StyleColor }
  | { type: 'SET_MODE'; mode: DesignerMode }
  | { type: 'TOGGLE_DEBUG' }
  | { type: 'TOGGLE_HELP' }
  | { type: 'SET_STATUS'; msg: string }
  // Generic actions used by PropertiesEditor
  | { type: 'SET_PROP'; key: string; value: string }
  | { type: 'SET_CONTENT'; key: string; value: string }
  | { type: 'SET_STYLE'; key: string; value: string | number | boolean };

export const initialState = (spec: ScreenSpec): DesignerState => ({
  spec,
  selectedNodeId: spec.nodes.length > 0 ? spec.nodes[0].id : null,
  mode: 'view',
  showHelp: false,
  debugOverlay: false,
  statusMessage: 'Ready. Press "n" to add a panel.',
});

export function designerReducer(state: DesignerState, action: Action): DesignerState {
  const { spec, selectedNodeId } = state;

  switch (action.type) {
    case 'ADD_PANEL': {
      const newId = generateId('panel');
      const newNode: LayoutNode = {
        id: newId,
        name: 'New Panel',
        type: 'frame',
        rect: { x: 2, y: 2, w: 20, h: 10 },
        style: { border: true, borderStyle: 'round', padding: 0, color: 'cyan' },
        content: { title: 'Untitled' }
      };
      return {
        ...state,
        spec: { ...spec, nodes: [...spec.nodes, newNode] },
        selectedNodeId: newId,
        statusMessage: 'Panel added.',
      };
    }

    case 'DELETE_PANEL': {
      if (!selectedNodeId) return state;
      const remaining = spec.nodes.filter(n => n.id !== selectedNodeId);
      return {
        ...state,
        spec: { ...spec, nodes: remaining },
        selectedNodeId: remaining.length > 0 ? remaining[remaining.length - 1].id : null,
        statusMessage: 'Panel deleted.',
      };
    }

    case 'SELECT_NEXT': {
      if (spec.nodes.length === 0) return state;
      const idx = spec.nodes.findIndex(n => n.id === selectedNodeId);
      const nextIdx = (idx + 1) % spec.nodes.length;
      return { ...state, selectedNodeId: spec.nodes[nextIdx].id };
    }

    case 'SELECT_PREV': {
      if (spec.nodes.length === 0) return state;
      const idx = spec.nodes.findIndex(n => n.id === selectedNodeId);
      const prevIdx = (idx - 1 + spec.nodes.length) % spec.nodes.length;
      return { ...state, selectedNodeId: spec.nodes[prevIdx].id };
    }

    case 'MOVE_RECT': {
      if (!selectedNodeId) return state;
      const nodes = spec.nodes.map(n => {
        if (n.id !== selectedNodeId) return n;
        const newX = clamp(n.rect.x + action.dx, 0, spec.meta.cols - n.rect.w);
        const newY = clamp(n.rect.y + action.dy, 0, spec.meta.rows - n.rect.h);
        return { ...n, rect: { ...n.rect, x: newX, y: newY } };
      });
      return { ...state, spec: { ...spec, nodes } };
    }

    case 'RESIZE_RECT': {
      if (!selectedNodeId) return state;
      const nodes = spec.nodes.map(n => {
        if (n.id !== selectedNodeId) return n;
        const newW = clamp(n.rect.w + action.dw, 2, spec.meta.cols - n.rect.x);
        const newH = clamp(n.rect.h + action.dh, 2, spec.meta.rows - n.rect.y);
        return { ...n, rect: { ...n.rect, w: newW, h: newH } };
      });
      return { ...state, spec: { ...spec, nodes } };
    }

    case 'SET_NAME': {
      if (!selectedNodeId) return state;
      const nodes = spec.nodes.map(n => (n.id === selectedNodeId ? { ...n, name: action.name } : n));
      return { ...state, spec: { ...spec, nodes } };
    }

    case 'SET_TYPE': {
      if (!selectedNodeId) return state;
      const nodes = spec.nodes.map(n => (n.id === selectedNodeId ? { ...n, type: action.nodeType } : n));
      return { ...state, spec: { ...spec, nodes } };
    }

    case 'SET_TITLE': {
      if (!selectedNodeId) return state;
      const nodes = spec.nodes.map(n => {
        if (n.id !== selectedNodeId) return n;
        return { ...n, content: { ...(n.content ?? {}), title: action.title } };
      });
      return { ...state, spec: { ...spec, nodes } };
    }

    case 'SET_BORDER': {
      if (!selectedNodeId) return state;
      const nodes = spec.nodes.map(n => (n.id === selectedNodeId ? { ...n, style: { ...n.style, border: action.border } } : n));
      return { ...state, spec: { ...spec, nodes } };
    }

    case 'SET_BORDER_STYLE': {
      if (!selectedNodeId) return state;
      const nodes = spec.nodes.map(n => (n.id === selectedNodeId ? { ...n, style: { ...n.style, borderStyle: action.borderStyle } } : n));
      return { ...state, spec: { ...spec, nodes } };
    }

    case 'SET_PADDING': {
      if (!selectedNodeId) return state;
      const nodes = spec.nodes.map(n => (n.id === selectedNodeId ? { ...n, style: { ...n.style, padding: action.padding } } : n));
      return { ...state, spec: { ...spec, nodes } };
    }

    case 'SET_COLOR': {
      if (!selectedNodeId) return state;
      const nodes = spec.nodes.map(n => (n.id === selectedNodeId ? { ...n, style: { ...n.style, color: action.color } } : n));
      return { ...state, spec: { ...spec, nodes } };
    }

    case 'SET_MODE':
      return { ...state, mode: action.mode };

    case 'TOGGLE_DEBUG':
      return { ...state, debugOverlay: !state.debugOverlay };

    case 'TOGGLE_HELP':
      return { ...state, showHelp: !state.showHelp };

    case 'SET_STATUS':
      return { ...state, statusMessage: action.msg };

    // Generic actions used by PropertiesEditor
    case 'SET_PROP': {
      if (!selectedNodeId) return state;
      const nodes = spec.nodes.map(n => {
        if (n.id !== selectedNodeId) return n;
        if (action.key === 'name') return { ...n, name: action.value };
        if (action.key === 'type') return { ...n, type: action.value as NodeType };
        return n;
      });
      return { ...state, spec: { ...spec, nodes } };
    }

    case 'SET_CONTENT': {
      if (!selectedNodeId) return state;
      const nodes = spec.nodes.map(n => {
        if (n.id !== selectedNodeId) return n;
        return { ...n, content: { ...(n.content ?? {}), [action.key]: action.value } };
      });
      return { ...state, spec: { ...spec, nodes } };
    }

    case 'SET_STYLE': {
      if (!selectedNodeId) return state;
      const nodes = spec.nodes.map(n => {
        if (n.id !== selectedNodeId) return n;
        return { ...n, style: { ...n.style, [action.key]: action.value } };
      });
      return { ...state, spec: { ...spec, nodes } };
    }

    default:
      return state;
  }
}
