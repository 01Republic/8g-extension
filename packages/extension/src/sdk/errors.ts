export class EightGError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'EightGError';
  }

  static extensionNotInstalled() {
    return new EightGError(
      '8G Extension is not installed or not responding',
      'EXTENSION_NOT_FOUND'
    );
  }

  static invalidRequest(message: string) {
    return new EightGError(`Invalid request: ${message}`, 'INVALID_REQUEST');
  }

  static collectionFailed(error: string) {
    return new EightGError(`Data collection failed: ${error}`, 'COLLECTION_FAILED');
  }

  static requestTimeout(timeoutMs: number = 600000) {
    const seconds = Math.floor(timeoutMs / 1000);
    return new EightGError(
      `Request timeout - Extension did not respond within ${seconds} seconds`,
      'REQUEST_TIMEOUT'
    );
  }
}
