import React from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import type { DesignerState, Action, NodeType } from './state.js';

interface CanvasProps {
  state: DesignerState;
  dispatch: React.Dispatch<Action>;
}

export const Canvas: React.FC<CanvasProps> = ({ state, dispatch }) => {
  const { spec, selectedNodeId, mode, debugOverlay } = state;
  const { cols, rows } = spec.meta;
  const { exit } = useApp();

  useInput((input, key) => {
    if (mode !== 'view') return;

    // Movement speed
    const delta = key.shift ? 5 : 1;

    if (key.return) {
      dispatch({ type: 'SET_MODE', mode: 'edit-props' });
      return;
    }
    
    if (input === 'n') { dispatch({ type: 'ADD_PANEL' }); return; }
    if (input === 'd') { dispatch({ type: 'DELETE_PANEL' }); return; }
    if (input === 'h' || input === '?') { dispatch({ type: 'TOGGLE_HELP' }); return; }
    if (input === 'q') { exit(); return; }
    if (input === 's') { dispatch({ type: 'SET_MODE', mode: 'save' }); return; }
    if (input === 'b') {
      const node = spec.nodes.find(n => n.id === selectedNodeId);
      if (node) dispatch({ type: 'SET_BORDER', border: !node.style.border });
      return;
    }
    
    // Type cycling
    if (input === 't') {
      const node = spec.nodes.find(n => n.id === selectedNodeId);
      if (node) {
        const types: NodeType[] = ['frame', 'header', 'sidebar', 'main', 'footer', 'status', 'input', 'list', 'table', 'log', 'text', 'panel'];
        const currentIdx = types.indexOf(node.type);
        const nextType = types[(currentIdx + 1) % types.length];
        dispatch({ type: 'SET_TYPE', nodeType: nextType });
        dispatch({ type: 'SET_STATUS', msg: `Type set to ${nextType}` });
      }
      return;
    }

    if (key.tab) {
      if (key.shift) dispatch({ type: 'SELECT_PREV' });
      else dispatch({ type: 'SELECT_NEXT' });
      return;
    }
    
    // Move / Resize
    if (input === 'g') { dispatch({ type: 'TOGGLE_DEBUG' }); return; }

    // Resize (Alt) vs Move (Arrows)
    // Ink doesn't fully capture 'alt' on all terminals reliably in raw mode combination with arrows sometimes, 
    // but we check `key.meta` or implement a mode toggle if needed.
    // For this implementation, we'll use META (Alt) for resize.
    
    if (key.upArrow) {
      if (key.meta) dispatch({ type: 'RESIZE_RECT', dw: 0, dh: -1 });
      else dispatch({ type: 'MOVE_RECT', dx: 0, dy: -delta });
    }
    if (key.downArrow) {
      if (key.meta) dispatch({ type: 'RESIZE_RECT', dw: 0, dh: 1 });
      else dispatch({ type: 'MOVE_RECT', dx: 0, dy: delta });
    }
    if (key.leftArrow) {
      if (key.meta) dispatch({ type: 'RESIZE_RECT', dw: -1, dh: 0 });
      else dispatch({ type: 'MOVE_RECT', dx: -delta, dy: 0 });
    }
    if (key.rightArrow) {
      if (key.meta) dispatch({ type: 'RESIZE_RECT', dw: 1, dh: 0 });
      else dispatch({ type: 'MOVE_RECT', dx: delta, dy: 0 });
    }
  });

  // Render the canvas
  // Since we can't easily perform "layering" with z-index in standard Ink,
  // we render a text grid or use absolute positioning if we assume the terminal is large enough.
  // BUT, Ink supports absolute positioning via `Box` only relative to flow. 
  // We will trick it by rendering a containing Box of fixed size, and children with absolute dimensions?
  // No, standard Ink is Flexbox. 
  // THE TRICK: Render a specialized "Layer" component that renders 
  // a massive string grid constructed manually, then output that string to Ink.
  
  // Construct the character buffer
  const grid: string[][] = Array.from({ length: rows }, () => 
    Array.from({ length: cols }, () => '·')
  );

  // If we had an image loaded, we would sample it here and fill the grid chars.
  // For MVP, we just show the dots.

  // Draw nodes onto the grid
  spec.nodes.forEach((node) => {
    const isSelected = node.id === selectedNodeId;
    const { x, y, w, h } = node.rect;
    
    // Border characters (preview only; the generated Ink uses real border styles)
    const borderStyle = node.style.borderStyle ?? 'single';
    const chars =
      borderStyle === 'double'
        ? { h: '═', v: '║', tl: '╔', tr: '╗', bl: '╚', br: '╝' }
        : borderStyle === 'bold'
          ? { h: '━', v: '┃', tl: '┏', tr: '┓', bl: '┗', br: '┛' }
          : borderStyle === 'round'
            ? { h: '─', v: '│', tl: '╭', tr: '╮', bl: '╰', br: '╯' }
            : { h: '─', v: '│', tl: '┌', tr: '┐', bl: '└', br: '┘' };

    for (let r = y; r < y + h; r++) {
      for (let c = x; c < x + w; c++) {
        if (r >= rows || c >= cols || r < 0 || c < 0) continue;
        
        let char = ' ';
        // Borders
        if (r === y && c === x) char = chars.tl;
        else if (r === y && c === x + w - 1) char = chars.tr;
        else if (r === y + h - 1 && c === x) char = chars.bl;
        else if (r === y + h - 1 && c === x + w - 1) char = chars.br;
        else if (r === y || r === y + h - 1) char = chars.h;
        else if (c === x || c === x + w - 1) char = chars.v;
        else {
            // Content fill
             if (isSelected) char = '░';
             else char = ' ';
        }
        
        // Very basic "rendering" to the grid array
        // We add ANSI codes if it's the selected one to highlight it
        grid[r][c] = char; 
      }
    }
    
    // Draw Label
    const label = `${node.name} (${node.type})`;
    for (let i = 0; i < label.length; i++) {
        if (x + 2 + i < cols && y + 1 < rows) {
            grid[y+1][x+2+i] = label[i];
        }
    }
  });

  // Convert grid to string
  // We handle coloring by simple string concatenation for the selected item? 
  // To make it performant, we just join lines.
  const renderedLines = grid.map((line) => line.join(''));

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="cyan">
        <Text color="cyan" bold> Canvas </Text>
        {renderedLines.map((line, i) => (
             <Box key={i} height={1}>
                <Text wrap="truncate" color={i % 10 === 0 && debugOverlay ? 'yellow' : 'white'}>
                    {line}
                </Text>
             </Box>
        ))}
    </Box>
  );
};