export interface WeaviateConfig {
	endpoint: string;
	apiKey?: string;
}

export class WeaviateClient {
	constructor(_config: WeaviateConfig) {
		throw new Error(
			'[NEEDS_INVESTIGATION] Weaviate client not implemented. Add SDK and auth flow.',
		);
	}
}

export default WeaviateClient;
