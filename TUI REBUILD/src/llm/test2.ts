export interface TestClient {
  sendMessage(message: string): Promise<string>;
}
