import { LayoutNode, ScreenSpec } from '../generator/spec.js';
import { generateId } from '../utils/ids.js';
import { clamp } from '../utils/clamp.js';

export type DesignerMode = 'view' | 'edit-props' | 'help' | 'save';

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
  | { type: 'SET_PROP'; key: keyof LayoutNode; value: any }
  | { type: 'SET_CONTENT'; key: string; value: any }
  | { type: 'SET_STYLE'; key: string; value: any }
  | { type: 'SET_MODE'; mode: DesignerMode }
  | { type: 'TOGGLE_DEBUG' }
  | { type: 'SET_STATUS'; msg: string };

export const initialState = (spec: ScreenSpec): DesignerState => ({
  spec,
  selectedNodeId: spec.nodes.length > 0 ? spec.nodes[0].id : null,
  mode: 'view',
  showHelp: false,
  debugOverlay: false,
  statusMessage: 'Ready. Press "h" for help.',
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

    case 'SET_PROP': {
      if (!selectedNodeId) return state;
      const nodes = spec.nodes.map(n => {
        if (n.id !== selectedNodeId) return n;
        return { ...n, [action.key]: action.value };
      });
      return { ...state, spec: { ...spec, nodes } };
    }

    case 'SET_CONTENT': {
        if (!selectedNodeId) return state;
        const nodes = spec.nodes.map(n => {
            if (n.id !== selectedNodeId) return n;
            return { ...n, content: { ...n.content, [action.key]: action.value } };
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

    case 'SET_MODE':
      return { ...state, mode: action.mode };

    case 'TOGGLE_DEBUG':
      return { ...state, debugOverlay: !state.debugOverlay };

    case 'SET_STATUS':
      return { ...state, statusMessage: action.msg };

    default:
      return state;
  }
}