import React from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { DesignerState, Action } from './state.js';

interface CanvasProps {
  state: DesignerState;
  dispatch: React.Dispatch<Action>;
}

export const Canvas: React.FC<CanvasProps> = ({ state, dispatch }) => {
  const { spec, selectedNodeId, mode, debugOverlay } = state;
  const { cols, rows } = spec.meta;
  const { exit } = useApp();

  useInput((input, key) => {
    // Global Help Toggle
    if (input === 'h') {
        if (mode === 'help') dispatch({ type: 'SET_MODE', mode: 'view' });
        else dispatch({ type: 'SET_MODE', mode: 'help' });
        return;
    }

    if (mode === 'help') {
        // Any other key exits help
        dispatch({ type: 'SET_MODE', mode: 'view' });
        return;
    }

    if (mode !== 'view') return;

    // Movement speed
    const delta = key.shift ? 5 : 1;

    if (key.return) {
      dispatch({ type: 'SET_MODE', mode: 'edit-props' });
      return;
    }
    
    if (input === 'n') { dispatch({ type: 'ADD_PANEL' }); return; }
    if (input === 'd') { dispatch({ type: 'DELETE_PANEL' }); return; }
    if (input === 'q') { exit(); } // Quick quit for MVP
    if (input === 's') { dispatch({ type: 'SET_MODE', mode: 'save' }); return; }
    if (input === 'b') { 
      const node = spec.nodes.find(n => n.id === selectedNodeId);
      if(node) dispatch({ type: 'SET_STYLE', key: 'border', value: !node.style.border }); 
      return;
    }
    
    // Type cycling
    if (input === 't') {
        const node = spec.nodes.find(n => n.id === selectedNodeId);
        if (node) {
            const types = ['frame', 'header', 'sidebar', 'main', 'footer', 'input', 'list', 'table', 'log'];
            const currentIdx = types.indexOf(node.type);
            const nextType = types[(currentIdx + 1) % types.length];
            dispatch({ type: 'SET_PROP', key: 'type', value: nextType });
            dispatch({ type: 'SET_STATUS', msg: `Type set to ${nextType}`});
        }
        return;
    }

    if (key.tab) {
      dispatch({ type: 'SELECT_NEXT' });
      return;
    }
    
    // Move / Resize
    if (input === 'g') { dispatch({ type: 'TOGGLE_DEBUG' }); return; }

    // Resize (Alt) vs Move (Arrows)
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
  // We use the same ASCII grid rendering strategy
  
  // Construct the character buffer
  const grid: string[][] = Array.from({ length: rows }, () => 
    Array.from({ length: cols }, () => '·')
  );

  // Draw nodes onto the grid
  spec.nodes.forEach(node => {
    const isSelected = node.id === selectedNodeId;
    const { x, y, w, h } = node.rect;
    
    // Draw Border logic (simplified visual preview)
    const charH = '─';
    const charV = '│';
    const charTL = '╭';
    const charTR = '╮';
    const charBL = '╰';
    const charBR = '╯';

    for (let r = y; r < y + h; r++) {
      for (let c = x; c < x + w; c++) {
        if (r >= rows || c >= cols || r < 0 || c < 0) continue;
        
        let char = ' ';
        // Borders
        if (r === y && c === x) char = charTL;
        else if (r === y && c === x + w - 1) char = charTR;
        else if (r === y + h - 1 && c === x) char = charBL;
        else if (r === y + h - 1 && c === x + w - 1) char = charBR;
        else if (r === y || r === y + h - 1) char = charH;
        else if (c === x || c === x + w - 1) char = charV;
        else {
             if (isSelected) char = '░';
             else char = ' ';
        }
        
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

  const renderedLines = grid.map((line) => line.join(''));

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="cyan">
        <Box marginTop={-1} marginLeft={2}>
            <Text color="cyan"> Canvas </Text>
        </Box>
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