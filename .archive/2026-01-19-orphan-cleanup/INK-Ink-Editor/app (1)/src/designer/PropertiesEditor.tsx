import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import { DesignerState, Action } from './state.js';

interface Props {
  state: DesignerState;
  dispatch: React.Dispatch<Action>;
}

export const PropertiesEditor: React.FC<Props> = ({ state, dispatch }) => {
  const node = state.spec.nodes.find(n => n.id === state.selectedNodeId);
  const [activeField, setActiveField] = useState(0);

  // Fields
  const fields = ['Name', 'Title', 'Type', 'Color', 'Border Style', 'Padding', 'Close'];
  
  const handleNameChange = (val: string) => {
    dispatch({ type: 'SET_PROP', key: 'name', value: val });
  };
  
  const handleTitleChange = (val: string) => {
    dispatch({ type: 'SET_CONTENT', key: 'title', value: val });
  };

  const handleTypeSelect = (item: { value: string }) => {
    dispatch({ type: 'SET_PROP', key: 'type', value: item.value });
    setActiveField(prev => prev + 1);
  };
  
  const handleColorSelect = (item: { value: string }) => {
    dispatch({ type: 'SET_STYLE', key: 'color', value: item.value });
    setActiveField(prev => prev + 1);
  };

  const handleBorderStyleSelect = (item: { value: string }) => {
    dispatch({ type: 'SET_STYLE', key: 'borderStyle', value: item.value });
    setActiveField(prev => prev + 1);
  };

  const handlePaddingSelect = (item: { value: number }) => {
    dispatch({ type: 'SET_STYLE', key: 'padding', value: item.value });
    setActiveField(prev => prev + 1);
  };

  useInput((input, key) => {
    // Only allow navigation if not editing text
    // We only control Up/Down if the current component doesn't consume it exclusively.
    
    // For Select Inputs: Up/Down is consumed by SelectInput.
    // For Text Inputs: Up/Down navigates fields.
    const isSelect = [2, 3, 4, 5].includes(activeField); // Type, Color, Border, Padding
    
    if (!isSelect) {
        if (key.upArrow) {
            setActiveField(prev => (prev - 1 + fields.length) % fields.length);
        }
        if (key.downArrow) {
            setActiveField(prev => (prev + 1) % fields.length);
        }
    }
    
    if (key.escape) {
        dispatch({ type: 'SET_MODE', mode: 'view' });
    }
  });

  if (!node) return <Text>No selection</Text>;

  const typeOptions = ['frame', 'header', 'sidebar', 'main', 'footer', 'input', 'list', 'table', 'log'].map(t => ({ label: t, value: t }));
  const colorOptions = ['cyan', 'magenta', 'green', 'yellow', 'white'].map(c => ({ label: c, value: c }));
  const borderOptions = ['round', 'single', 'double', 'bold'].map(b => ({ label: b, value: b }));
  const paddingOptions = [0, 1, 2].map(p => ({ label: String(p), value: p }));

  return (
    <Box flexDirection="column" borderStyle="double" borderColor="yellow" padding={1} width={50}>
      <Text bold color="yellow">Properties: {node.name}</Text>
      <Box height={1} />

      {/* Name Input */}
      <Box flexDirection="row">
        <Text color={activeField === 0 ? 'cyan' : 'white'} bold={activeField === 0}>Name: </Text>
        {activeField === 0 ? (
            <TextInput value={node.name} onChange={handleNameChange} onSubmit={() => setActiveField(1)} />
        ) : <Text>{node.name}</Text>}
      </Box>

      {/* Title Input */}
      <Box flexDirection="row" marginTop={1}>
        <Text color={activeField === 1 ? 'cyan' : 'white'} bold={activeField === 1}>Title: </Text>
        {activeField === 1 ? (
            <TextInput value={node.content?.title || ''} onChange={handleTitleChange} onSubmit={() => setActiveField(2)} />
        ) : <Text>{node.content?.title || '(none)'}</Text>}
      </Box>

      {/* Type Select */}
      <Box flexDirection="column" marginTop={1}>
        <Text color={activeField === 2 ? 'cyan' : 'white'} bold={activeField === 2}>Type: {node.type}</Text>
        {activeField === 2 && (
            <Box borderStyle="single" borderColor="gray">
                <SelectInput items={typeOptions} onSelect={handleTypeSelect} limit={3} />
            </Box>
        )}
      </Box>

      {/* Color Select */}
      <Box flexDirection="column" marginTop={1}>
        <Text color={activeField === 3 ? 'cyan' : 'white'} bold={activeField === 3}>Color: {node.style.color || 'white'}</Text>
        {activeField === 3 && (
            <Box borderStyle="single" borderColor="gray">
                <SelectInput items={colorOptions} onSelect={handleColorSelect} limit={3} />
            </Box>
        )}
      </Box>

      {/* Border Style Select */}
      <Box flexDirection="column" marginTop={1}>
        <Text color={activeField === 4 ? 'cyan' : 'white'} bold={activeField === 4}>Border: {node.style.borderStyle}</Text>
        {activeField === 4 && (
            <Box borderStyle="single" borderColor="gray">
                <SelectInput items={borderOptions} onSelect={handleBorderStyleSelect} limit={3} />
            </Box>
        )}
      </Box>

      {/* Padding Select */}
      <Box flexDirection="column" marginTop={1}>
        <Text color={activeField === 5 ? 'cyan' : 'white'} bold={activeField === 5}>Padding: {node.style.padding}</Text>
        {activeField === 5 && (
            <Box borderStyle="single" borderColor="gray">
                <SelectInput items={paddingOptions} onSelect={handlePaddingSelect} limit={3} />
            </Box>
        )}
      </Box>

      {/* Close Button */}
      <Box marginTop={1}>
        {activeField === 6 ? (
            <Text color="red" bold>Press Enter to Close</Text>
        ) : <Text color="gray">Close</Text>}
      </Box>
      
      {/* Hidden handler for close */}
      {activeField === 6 && (
          <Box display="none">
             <TextInput value="" onChange={() => {}} onSubmit={() => dispatch({ type: 'SET_MODE', mode: 'view' })} />
          </Box>
      )}

    </Box>
  );
};