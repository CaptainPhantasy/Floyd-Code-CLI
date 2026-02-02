/**
 * Rewind Overlay - FLOYD TUI
 *
 * Displays checkpoint list and allows restoring to previous states.
 */

import * as Ink from 'ink';
import {useState, useEffect} from 'react';
import {useInput} from 'ink';
import {useTuiStore} from '../store/tui-store.js';
import {getRewindManager, type Checkpoint} from '../utils/rewind.js';

const {Box, Text} = Ink;

function formatDate(date: Date): string {
	const now = Date.now();
	const diff = now - date.getTime();

	if (diff < 60000) return 'just now';
	if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
	if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
	return date.toLocaleDateString();
}

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function RewindOverlay() {
	const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [restoring, setRestoring] = useState(false);
	const closeOverlay = useTuiStore(state => state.closeOverlay);

	// Load checkpoints on mount
	useEffect(() => {
		loadCheckpoints();
	}, []);

	async function loadCheckpoints() {
		setLoading(true);
		setError(null);
		try {
			const rewind = getRewindManager();
			const list = await rewind.listCheckpoints();
			setCheckpoints(list);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load checkpoints');
		} finally {
			setLoading(false);
		}
	}

	async function handleRewind() {
		if (checkpoints.length === 0) return;

		const selected = checkpoints[selectedIndex];
		if (!selected) return;

		setRestoring(true);
		try {
			const rewind = getRewindManager();
			const result = await rewind.rewindTo(selected.id);

			if (result.failed.length > 0) {
				setError(`Restored ${result.restored.length} files, ${result.failed.length} failed`);
			} else {
				closeOverlay();
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Rewind failed');
		} finally {
			setRestoring(false);
		}
	}

	async function handleDelete() {
		if (checkpoints.length === 0) return;

		const selected = checkpoints[selectedIndex];
		if (!selected) return;

		try {
			const rewind = getRewindManager();
			await rewind.deleteCheckpoint(selected.id);
			await loadCheckpoints();
			if (selectedIndex >= checkpoints.length - 1) {
				setSelectedIndex(Math.max(0, selectedIndex - 1));
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Delete failed');
		}
	}

	// Handle keyboard input
	useInput((input, key) => {
		if (key.escape) {
			closeOverlay();
			return;
		}

		if (key.upArrow) {
			setSelectedIndex(prev => (prev > 0 ? prev - 1 : checkpoints.length - 1));
			return;
		}

		if (key.downArrow) {
			setSelectedIndex(prev => (prev < checkpoints.length - 1 ? prev + 1 : 0));
			return;
		}

		if (key.return && !restoring) {
			handleRewind();
			return;
		}

		if (input === 'd' || input === 'D') {
			handleDelete();
			return;
		}

		if (input === 'r' || input === 'R') {
			loadCheckpoints();
			return;
		}
	});

	const selected = checkpoints[selectedIndex];

	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor="cyan"
			paddingX={2}
			paddingY={1}
			width="100%"
			height="100%"
		>
			{/* Header */}
			<Box marginBottom={1}>
				<Text bold color="cyan">
					⏪ Rewind - Checkpoint History
				</Text>
			</Box>

			{/* Error message */}
			{error && (
				<Box marginBottom={1}>
					<Text color="red">⚠ {error}</Text>
				</Box>
			)}

			{/* Loading state */}
			{loading && (
				<Box>
					<Text dimColor>Loading checkpoints...</Text>
				</Box>
			)}

			{/* Empty state */}
			{!loading && checkpoints.length === 0 && (
				<Box flexDirection="column">
					<Text dimColor>No checkpoints found.</Text>
					<Text dimColor>
						Checkpoints are created automatically before file modifications.
					</Text>
				</Box>
			)}

			{/* Checkpoint list */}
			{!loading && checkpoints.length > 0 && (
				<Box flexDirection="row" height="100%">
					{/* List panel */}
					<Box flexDirection="column" width="50%">
						<Box marginBottom={1}>
							<Text bold underline>Checkpoints ({checkpoints.length})</Text>
						</Box>
						<Box flexDirection="column" overflowY="hidden">
							{checkpoints.slice(0, 15).map((cp, idx) => (
								<Box key={cp.id}>
									<Text
										color={idx === selectedIndex ? 'cyan' : undefined}
										inverse={idx === selectedIndex}
									>
										{idx === selectedIndex ? '▶ ' : '  '}
										{cp.automatic ? '🔄' : '📌'} {cp.name.slice(0, 25)}
									</Text>
									<Text dimColor> {formatDate(cp.createdAt)}</Text>
								</Box>
							))}
							{checkpoints.length > 15 && (
								<Text dimColor>... and {checkpoints.length - 15} more</Text>
							)}
						</Box>
					</Box>

					{/* Details panel */}
					<Box flexDirection="column" width="50%" paddingLeft={2}>
						<Box marginBottom={1}>
							<Text bold underline>Details</Text>
						</Box>
						{selected && (
							<Box flexDirection="column">
								<Text>
									<Text bold>ID: </Text>
									<Text dimColor>{selected.id}</Text>
								</Text>
								<Text>
									<Text bold>Name: </Text>
									{selected.name}
								</Text>
								<Text>
									<Text bold>Created: </Text>
									{selected.createdAt.toLocaleString()}
								</Text>
								<Text>
									<Text bold>Files: </Text>
									{selected.fileCount}
								</Text>
								<Text>
									<Text bold>Size: </Text>
									{formatBytes(selected.size)}
								</Text>
								<Text>
									<Text bold>Type: </Text>
									{selected.automatic ? 'Automatic' : 'Manual'}
								</Text>
								{selected.tags.length > 0 && (
									<Text>
										<Text bold>Tags: </Text>
										{selected.tags.join(', ')}
									</Text>
								)}
								{selected.description && (
									<Text>
										<Text bold>Description: </Text>
										{selected.description}
									</Text>
								)}

								<Box marginTop={1}>
									<Text bold underline>
										Files in checkpoint:
									</Text>
								</Box>
								{selected.snapshots.slice(0, 8).map(s => (
									<Text key={s.path} dimColor>
										• {s.path.split('/').pop()}
									</Text>
								))}
								{selected.snapshots.length > 8 && (
									<Text dimColor>
										... and {selected.snapshots.length - 8} more
									</Text>
								)}
							</Box>
						)}
					</Box>
				</Box>
			)}

			{/* Footer with controls */}
			<Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
				<Text dimColor>
					<Text bold>Enter</Text> Rewind to checkpoint {'  '}
					<Text bold>D</Text> Delete {'  '}
					<Text bold>R</Text> Refresh {'  '}
					<Text bold>Esc</Text> Close
				</Text>
				{restoring && <Text color="yellow"> Restoring...</Text>}
			</Box>
		</Box>
	);
}

export default RewindOverlay;
