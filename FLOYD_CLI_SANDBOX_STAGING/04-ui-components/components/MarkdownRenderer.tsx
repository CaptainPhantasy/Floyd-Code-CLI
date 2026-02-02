import React, {useMemo} from 'react';
import {Box, Text} from 'ink';
import {roleColors, textColors} from '../../theme/crush-theme.js';

/**
 * Simple LRU cache for parsed markdown
 */
class MarkdownCache {
	private cache = new Map<string, React.ReactNode>();
	private maxSize = 50; // Cache up to 50 parsed documents

	get(key: string): React.ReactNode | undefined {
		return this.cache.get(key);
	}

	set(key: string, value: React.ReactNode): void {
		// Remove oldest entries if cache is full
		if (this.cache.size >= this.maxSize) {
			const firstKey = this.cache.keys().next().value;
			if (firstKey) {
				this.cache.delete(firstKey);
			}
		}
		this.cache.set(key, value);
	}

	clear(): void {
		this.cache.clear();
	}
}

// Global cache instance
const markdownCache = new MarkdownCache();

interface MarkdownRendererProps {
	children: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({children}) => {
	const lines = useMemo(() => children.split('\n'), [children]);

	return (
		<Box flexDirection="column">
			{lines.map((line, i) => (
				<LineRenderer key={i} line={line} />
			))}
		</Box>
	);
};

const LineRenderer = React.memo(({line}: {line: string}) => {
	// Header 1-3
	if (line.startsWith('#')) {
		const level = line.match(/^#+/)?.[0].length || 0;
		const content = line.replace(/^#+\s/, '');
		return (
			<Box marginTop={1} marginBottom={0}>
				<Text bold color={roleColors.headerTitle}>
					{content}
				</Text>
			</Box>
		);
	}

	// List item
	if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
		return (
			<Box marginLeft={1}>
				<Text color={roleColors.hint}>• </Text>
				<InlineRenderer text={line.trim().substring(2)} />
			</Box>
		);
	}

	// Numbered list
	if (/^\d+\./.test(line.trim())) {
		const match = line.trim().match(/^(\d+\.)\s(.*)/);
		if (match) {
			return (
				<Box marginLeft={1}>
					<Text color={roleColors.hint}>{match[1]} </Text>
					<InlineRenderer text={match[2]} />
				</Box>
			);
		}
	}

	// Code block (triple backticks) - simplified (just renders line)
	if (line.startsWith('```')) {
		return <Box borderStyle="single" borderColor={roleColors.hint} paddingX={1}><Text dimColor>{line}</Text></Box>;
	}

	// Empty line
	if (!line.trim()) {
		return <Box height={1} />;
	}

	// Default: render as text
	return <InlineRenderer text={line} />;
});

const InlineRenderer = React.memo(({text}: {text: string}) => {
	// Split by bold (** or __) and code (`)
	// Simple parser: assumes non-nested
	const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

	return (
		<Text>
			{parts.map((part, index) => {
				if (part.startsWith('**') && part.endsWith('**')) {
					return <Text key={index} bold color={textColors.primary}>{part.slice(2, -2)}</Text>;
				}
				if (part.startsWith('`') && part.endsWith('`')) {
					return <Text key={index} color={roleColors.toolLabel} backgroundColor={roleColors.diff.addition.background}> {part.slice(1, -1)} </Text>;
				}
				return <Text key={index} color={textColors.primary}>{part}</Text>;
			})}
		</Text>
	);
});
