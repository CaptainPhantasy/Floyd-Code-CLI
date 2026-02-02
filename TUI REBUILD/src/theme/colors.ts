export const floydTheme = {
  colors: {
    bg: '#1a1a2e',
    fgBase: '#e0e0e0',
    fgMuted: '#808080',
    border: '#303050',
    borderFocus: '#6B50FF',
    selection: '#6B50FF40',

    userLabel: '#82AAFF',
    assistantLabel: '#FF60FF',
    systemLabel: '#FFA500',
    toolLabel: '#00BCD4',

    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    working: '#FFC107',
    offline: '#9E9E9E',
    ready: '#8BC34A',

    accent: '#6B50FF',
    accentSecondary: '#FF60FF',
    accentTertiary: '#B85CFF',

    inputPrompt: '#FFC107',
    hint: '#808080',
    thinking: '#FF60FF',
  },
};

export const roleColors = {
  headerTitle: '#FF60FF',
  headerStatus: '#B85CFF',
  userLabel: '#82AAFF',
  assistantLabel: '#FF60FF',
  systemLabel: '#FFA500',
  toolLabel: '#00BCD4',
  thinking: '#FF60FF',
  muted: '#808080',
};

import type { FloydMode } from '../store/tui-store.js';

export const MODE_COLORS: Record<FloydMode, string> = {
  ask: '#2196F3',
  plan: '#4CAF50',
  auto: '#9C27B0',
  discuss: '#00BCD4',
  fuckit: '#F44336',
};
