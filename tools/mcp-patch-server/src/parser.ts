/**
 * Patch Parser
 *
 * Parses unified diff content into structured data and provides
 * risk assessment for patch operations.
 */

import parseDiff from 'parse-diff';

export interface DiffHunk {
	oldStart: number;
	oldLines: number;
	newStart: number;
	newLines: number;
	content: string;
}

export interface DiffFile {
	path: string;
	oldPath?: string;
	status: 'added' | 'deleted' | 'modified' | 'renamed';
	hunks: DiffHunk[];
}

export interface RiskAssessment {
	riskLevel: 'low' | 'medium' | 'high';
	warnings: string[];
	isBinary: boolean;
	affectsMultipleFiles: boolean;
	totalChanges: number;
}

export function parseUnifiedDiff(diffText: string): DiffFile[] {
	const parsed = parseDiff(diffText);
	return parsed.map(file => ({
		path: file.to || file.from || '',
		oldPath: file.from !== file.to ? file.from : undefined,
		status: getDiffStatus(file),
		hunks: file.chunks.map(chunk => ({
			oldStart: chunk.oldStart,
			oldLines: chunk.oldLines,
			newStart: chunk.newStart,
			newLines: chunk.newLines,
			content: chunk.changes.map(change => change.content || change.type).join('\n'),
		})),
	}));
}

export function assessRisk(parsedDiff: DiffFile[]): RiskAssessment {
	const warnings: string[] = [];
	let riskLevel: 'low' | 'medium' | 'high' = 'low';
	let totalChanges = 0;

	for (const file of parsedDiff) {
		totalChanges += file.hunks.length;

		if (
			file.path.includes('.bin') ||
			file.path.includes('.exe') ||
			file.path.includes('.dll')
		) {
			riskLevel = 'high';
			warnings.push(`Binary file detected: ${file.path}`);
		}

		const sensitivePatterns = [
			'package-lock.json',
			'yarn.lock',
			'pnpm-lock.yaml',
			'.env',
			'credentials',
			'secret',
			'private',
		];
		for (const pattern of sensitivePatterns) {
			if (file.path.toLowerCase().includes(pattern)) {
				riskLevel = 'high';
				warnings.push(`Sensitive file modification: ${file.path}`);
			}
		}

		for (const hunk of file.hunks) {
			if (hunk.oldLines > 50 || hunk.newLines > 50) {
				riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
				warnings.push(
					`Large hunk in ${file.path}: ${hunk.oldLines} -> ${hunk.newLines} lines`,
				);
			}
		}

		if (file.status === 'deleted') {
			riskLevel = 'high';
			warnings.push(`File deletion: ${file.path}`);
		}
	}

	if (parsedDiff.length > 3 && riskLevel === 'low') {
		riskLevel = 'medium';
	}

	return {
		riskLevel,
		warnings,
		isBinary: warnings.some(warning => warning.includes('Binary')),
		affectsMultipleFiles: parsedDiff.length > 1,
		totalChanges,
	};
}

function getDiffStatus(file: any): DiffFile['status'] {
	if (file.to === '/dev/null') return 'deleted';
	if (file.from === '/dev/null') return 'added';
	if (file.from !== file.to) return 'renamed';
	return 'modified';
}

export default {
	parseUnifiedDiff,
	assessRisk,
};
