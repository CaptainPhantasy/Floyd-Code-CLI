export interface VectorRecord {
	id: string;
	values: number[];
	metadata?: Record<string, string>;
}

export interface VectorQueryResult {
	id: string;
	score: number;
	metadata?: Record<string, string>;
}

export interface LocalVectorConfig {
	dimensions?: number;
}

const DEFAULT_DIMENSIONS = 256;

export class LocalVectorStore {
	private readonly dimensions: number;
	private readonly vectors = new Map<string, VectorRecord>();

	constructor(config: LocalVectorConfig = {}) {
		this.dimensions = config.dimensions ?? DEFAULT_DIMENSIONS;
	}

	addVector(record: VectorRecord): void {
		if (record.values.length !== this.dimensions) {
			throw new Error(
				`Vector dimension mismatch: expected ${this.dimensions}, got ${record.values.length}`,
			);
		}
		this.vectors.set(record.id, record);
	}

	addText(id: string, text: string, metadata?: Record<string, string>): void {
		const values = embedText(text, this.dimensions);
		this.addVector({id, values, metadata});
	}

	queryVector(values: number[], topK = 5): VectorQueryResult[] {
		if (values.length !== this.dimensions) {
			throw new Error(
				`Vector dimension mismatch: expected ${this.dimensions}, got ${values.length}`,
			);
		}

		const results: VectorQueryResult[] = [];
		for (const record of this.vectors.values()) {
			results.push({
				id: record.id,
				score: cosineSimilarity(values, record.values),
				metadata: record.metadata,
			});
		}

		return results
			.sort((a, b) => b.score - a.score)
			.slice(0, Math.max(1, topK));
	}

	queryText(text: string, topK = 5): VectorQueryResult[] {
		return this.queryVector(embedText(text, this.dimensions), topK);
	}

	listVectors(): VectorRecord[] {
		return Array.from(this.vectors.values());
	}
}

export function embedText(text: string, dimensions = DEFAULT_DIMENSIONS): number[] {
	const vector = new Array(dimensions).fill(0);
	const tokens = text
		.toLowerCase()
		.split(/[^a-z0-9_]+/g)
		.filter(Boolean);

	for (const token of tokens) {
		const index = hashToken(token) % dimensions;
		vector[index] += 1;
	}

	return normalizeVector(vector);
}

function normalizeVector(values: number[]): number[] {
	let sumSquares = 0;
	for (const value of values) {
		sumSquares += value * value;
	}
	if (sumSquares === 0) return values;

	const magnitude = Math.sqrt(sumSquares);
	return values.map(value => value / magnitude);
}

function cosineSimilarity(a: number[], b: number[]): number {
	let dot = 0;
	for (let i = 0; i < a.length; i++) {
		dot += (a[i] || 0) * (b[i] || 0);
	}
	return dot;
}

function hashToken(token: string): number {
	let hash = 0;
	for (let i = 0; i < token.length; i++) {
		hash = (hash * 31 + token.charCodeAt(i)) >>> 0;
	}
	return hash;
}

export default LocalVectorStore;
