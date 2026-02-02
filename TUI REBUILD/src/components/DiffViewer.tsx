import React from 'react';
import {Box, Text} from 'ink';

interface DiffViewerProps {
	file1Path: string;
	file2Path: string;
	file1Content: string;
	file2Content: string;
	onClose?: () => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
	file1Path,
	file2Path,
	file1Content,
	file2Content,
	onClose,
}) => {
	const lines1 = file1Content.split('\n');
	const lines2 = file2Content.split('\n');

	const renderDiffLine = (
		line1: string | undefined,
		line2: string | undefined,
		index: number,
	) => {
		const isSame = line1 === line2;
		const color = isSame ? 'green' : 'red';

		return (
			<Box key={index}>
				<Text color={color}>
					{index + 1}: {line1 ?? ''}
				</Text>
				<Text color="gray"> | </Text>
				<Text color={color}>{line2 ?? ''}</Text>
			</Box>
		);
	};

	return (
		<Box flexDirection="column" gap={2}>
			<Box borderStyle="single" borderColor="gray" paddingX={1}>
				<Box flexDirection="column" gap={1}>
					<Text bold color="cyan">
						{file1Path}
					</Text>
					{lines1.map((line, i) => renderDiffLine(line, lines2[i], i))}
				</Box>

				<Box flexDirection="column" gap={1}>
					<Text bold color="cyan">
						{file2Path}
					</Text>
					{lines2.map((line, i) => renderDiffLine(lines1[i], line, i))}
				</Box>
			</Box>

			<Box gap={1}>
				<Text dimColor>Keys:</Text>
				<Text>Tab</Text>
				<Text dimColor>- Toggle side-by-side view</Text>
			</Box>

			{onClose && (
				<Box>
					<Text dimColor>Ctrl+Q</Text>
					<Text dimColor>- Close diff viewer</Text>
				</Box>
			)}
		</Box>
	);
};
