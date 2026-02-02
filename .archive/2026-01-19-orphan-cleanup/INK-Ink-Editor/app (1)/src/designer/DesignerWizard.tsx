import React, { useReducer, useEffect } from 'react';
import { Box, Text } from 'ink';
import { designerReducer, initialState, Action } from './state.js';
import { Canvas } from './Canvas.js';
import { PropertiesEditor } from './PropertiesEditor.js';
import { ScreenSpec } from '../generator/spec.js';
import fs from 'fs-extra';
import { emitTsx } from '../generator/emitTsx.js';

interface Props {
  initialSpec: ScreenSpec;
  savePath: string;
}

export const DesignerWizard: React.FC<Props> = ({ initialSpec, savePath }) => {
  const [state, dispatch] = useReducer(designerReducer, initialState(initialSpec));

  // Handle Save
  useEffect(() => {
    if (state.mode === 'save') {
        // Write spec
        fs.writeFileSync(savePath, JSON.stringify(state.spec, null, 2));
        
        // Generate TSX
        const tsx = emitTsx(state.spec);
        const outDir = 'generated';
        fs.ensureDirSync(outDir);
        fs.writeFileSync(`${outDir}/GeneratedScreen.tsx`, tsx);
        
        dispatch({ type: 'SET_STATUS', msg: `Saved to ${savePath} & ${outDir}/` });
        // Return to view after short delay or immediately
        setTimeout(() => dispatch({ type: 'SET_MODE', mode: 'view' }), 1000);
    }
  }, [state.mode, state.spec, savePath]);

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box flexDirection="row" justifyContent="space-between">
         <Text bold color="magenta">FLOYD CODE CLI DESIGNER</Text>
         <Text color="gray"> {state.spec.meta.cols}x{state.spec.meta.rows} </Text>
      </Box>

      {/* Main Workspace */}
      <Box flexDirection="row" marginTop={1}>
        {/* The Grid/Canvas */}
        <Canvas state={state} dispatch={dispatch} />
        
        {/* Sidebar info (if wide enough) or overlay */}
        <Box flexDirection="column" marginLeft={2} width={30}>
            <Text underline>Controls</Text>
            <Text dimColor>h: Toggle Help</Text>
            <Text dimColor>Arrows: Move</Text>
            <Text dimColor>Alt+Arrows: Resize</Text>
            <Text dimColor>Enter: Properties</Text>
            <Text dimColor>n: New | d: Delete</Text>
            <Text dimColor>s: Save | q: Quit</Text>
            
            <Box marginTop={1} borderStyle="single" paddingX={1}>
               <Text>{state.statusMessage}</Text>
            </Box>
        </Box>
      </Box>
      
      {/* Properties Modal Overlay */}
      {state.mode === 'edit-props' && (
        <Box position="absolute" marginTop={3} marginLeft={8}>
             <PropertiesEditor state={state} dispatch={dispatch} />
        </Box>
      )}

      {/* Help Modal Overlay */}
      {state.mode === 'help' && (
        <Box position="absolute" marginTop={4} marginLeft={15} borderStyle="double" borderColor="white" padding={1} flexDirection="column" width={40}>
            <Text bold underline>Keyboard Shortcuts</Text>
            <Box height={1}/>
            <Text>Arrows        : Move Panel</Text>
            <Text>Shift + Arrows: Move Faster</Text>
            <Text>Alt + Arrows  : Resize Panel</Text>
            <Text>Enter         : Edit Properties</Text>
            <Text>Tab           : Next Panel</Text>
            <Text>n             : New Panel</Text>
            <Text>d             : Delete Panel</Text>
            <Text>b             : Toggle Border</Text>
            <Text>t             : Cycle Panel Type</Text>
            <Text>s             : Save & Generate</Text>
            <Text>h             : Close Help</Text>
            <Text>q             : Quit</Text>
        </Box>
      )}

      {/* Save Overlay */}
      {state.mode === 'save' && (
          <Box position="absolute" marginTop={10} marginLeft={20} borderStyle="double" borderColor="green">
              <Text> Saving Spec & Generating Code... </Text>
          </Box>
      )}

    </Box>
  );
};