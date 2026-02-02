import React, { useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import type { BorderStyle, DesignerState, NodeType, Padding, StyleColor, Action } from './state.js';

type SelectItem<T extends string | number> = { label: string; value: T };

interface Props {
  state: DesignerState;
  dispatch: React.Dispatch<Action>;
}

export const PropertiesEditor: React.FC<Props> = ({ state, dispatch }) => {
  const node = state.spec.nodes.find((n) => n.id === state.selectedNodeId);
  const [activeField, setActiveField] = useState<number>(0);

  const typeOptions = useMemo<SelectItem<NodeType>[]>(
    () =>
      (
        [
          'frame',
          'header',
          'sidebar',
          'main',
          'footer',
          'status',
          'panel',
          'list',
          'table',
          'log',
          'input',
          'text',
        ] satisfies NodeType[]
      ).map((t) => ({ label: t, value: t })),
    [],
  );

  const borderOptions = useMemo<SelectItem<BorderStyle>[]>(
    () => (['single', 'round', 'double', 'bold'] satisfies BorderStyle[]).map((b) => ({ label: b, value: b })),
    [],
  );

  const paddingOptions = useMemo<SelectItem<Padding>[]>(
    () => ([0, 1, 2] satisfies Padding[]).map((p) => ({ label: String(p), value: p })),
    [],
  );

  const colorOptions = useMemo<SelectItem<StyleColor>[]>(
    () => (['cyan', 'magenta', 'green', 'yellow', 'white', 'gray'] satisfies StyleColor[]).map((c) => ({ label: c, value: c })),
    [],
  );

  const fields = [
    'Name',
    'Title',
    'Type',
    'Border Style',
    'Padding',
    'Color',
    'Close',
  ] as const;

  useInput((input, key) => {
    // Escape always returns to canvas
    if (key.escape) {
      dispatch({ type: 'SET_MODE', mode: 'view' });
      return;
    }

    // Tab navigation (so arrows remain available for SelectInput)
    if (key.tab) {
      setActiveField((prev) => {
        const next = key.shift ? prev - 1 : prev + 1;
        const len = fields.length;
        return ((next % len) + len) % len;
      });
      return;
    }

    // Close on Enter when focused
    if (key.return && activeField === fields.length - 1) {
      dispatch({ type: 'SET_MODE', mode: 'view' });
      return;
    }

    // Quick close
    if (input === 'q') {
      dispatch({ type: 'SET_MODE', mode: 'view' });
    }
  });

  if (!node) return <Text>No selection</Text>;

  const titleValue = node.content?.title ?? '';
  const borderStyleValue = node.style.borderStyle;
  const paddingValue = node.style.padding;
  const colorValue = node.style.color ?? 'white';

  return (
    <Box flexDirection="column" borderStyle="double" borderColor="yellow" padding={1} width={44}>
      <Text bold color="yellow">
        Properties
      </Text>
      <Text dimColor>
        Tab/Shift+Tab: next/prev field • Esc/q: close
      </Text>
      <Box height={1} />

      {/* Name */}
      <Box flexDirection="row">
        <Text color={activeField === 0 ? 'cyan' : 'white'}>Name: </Text>
        {activeField === 0 ? (
          <TextInput
            value={node.name}
            onChange={(val) => dispatch({ type: 'SET_NAME', name: val })}
            onSubmit={() => setActiveField(1)}
          />
        ) : (
          <Text>{node.name}</Text>
        )}
      </Box>

      {/* Title */}
      <Box flexDirection="row" marginTop={1}>
        <Text color={activeField === 1 ? 'cyan' : 'white'}>Title: </Text>
        {activeField === 1 ? (
          <TextInput
            value={titleValue}
            onChange={(val) => dispatch({ type: 'SET_TITLE', title: val })}
            onSubmit={() => setActiveField(2)}
            placeholder="(optional)"
          />
        ) : (
          titleValue ? <Text>{titleValue}</Text> : <Text dimColor>(none)</Text>
        )}
      </Box>

      {/* Type */}
      <Box flexDirection="column" marginTop={1}>
        <Text color={activeField === 2 ? 'cyan' : 'white'}>Type: {node.type}</Text>
        {activeField === 2 && (
          <SelectInput
            items={typeOptions}
            onSelect={(item: SelectItem<NodeType>) => {
              dispatch({ type: 'SET_TYPE', nodeType: item.value });
              setActiveField(3);
            }}
            limit={6}
          />
        )}
      </Box>

      {/* Border Style */}
      <Box flexDirection="column" marginTop={1}>
        <Text color={activeField === 3 ? 'cyan' : 'white'}>
          Border Style: {borderStyleValue}
        </Text>
        {activeField === 3 && (
          <SelectInput
            items={borderOptions}
            onSelect={(item: SelectItem<BorderStyle>) => {
              dispatch({ type: 'SET_BORDER_STYLE', borderStyle: item.value });
              setActiveField(4);
            }}
            limit={4}
          />
        )}
      </Box>

      {/* Padding */}
      <Box flexDirection="column" marginTop={1}>
        <Text color={activeField === 4 ? 'cyan' : 'white'}>Padding: {paddingValue}</Text>
        {activeField === 4 && (
          <SelectInput
            items={paddingOptions}
            onSelect={(item: SelectItem<Padding>) => {
              dispatch({ type: 'SET_PADDING', padding: item.value });
              setActiveField(5);
            }}
            limit={3}
          />
        )}
      </Box>

      {/* Color */}
      <Box flexDirection="column" marginTop={1}>
        <Text color={activeField === 5 ? 'cyan' : 'white'}>Color: {colorValue}</Text>
        {activeField === 5 && (
          <SelectInput
            items={colorOptions}
            onSelect={(item: SelectItem<StyleColor>) => {
              dispatch({ type: 'SET_COLOR', color: item.value });
              setActiveField(6);
            }}
            limit={6}
          />
        )}
      </Box>

      {/* Close */}
      <Box marginTop={1}>
        <Text color={activeField === 6 ? 'red' : 'gray'} bold={activeField === 6}>
          Close (Enter)
        </Text>
      </Box>
    </Box>
  );
};
