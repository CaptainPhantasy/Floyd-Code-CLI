export interface TestClient {
  sendMessage(message: string, onChunk?: (chunk: string) => void): Promise<string>;
}
