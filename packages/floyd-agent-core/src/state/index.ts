/**
 * State management module exports
 *
 * PHASE 0 ARCHITECTURAL FOUNDATION - Item D
 */

export {
  StateManager,
  getState,
  getStateValue,
  onStateChange,
  onAnyStateChange,
  onMessageAdded,
  onStatusChanged,
  onToolExecuted,
  resetState,
} from './floyd-state.js';

export type {
  FloydState,
  StateMessage,
  ToolExecution,
  ToolStats,
  AgentStatus,
  SessionState,
  ExecutionState,
  CacheStats,
  UIState,
  StateChangeEvent,
  StateManagerEvents,
} from './floyd-state.js';
