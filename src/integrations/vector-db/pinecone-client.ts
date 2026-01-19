export interface PineconeConfig {
	apiKey: string;
	environment?: string;
	index?: string;
}

export class PineconeClient {
	constructor(_config: PineconeConfig) {
		throw new Error(
			'[NEEDS_INVESTIGATION] Pinecone client not implemented. Add SDK and credentials handling.',
		);
	}
}

export default PineconeClient;
