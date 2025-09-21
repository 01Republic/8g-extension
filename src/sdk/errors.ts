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

  static requestTimeout() {
    return new EightGError('Request timeout - Extension did not respond within 30 seconds', 'REQUEST_TIMEOUT');
  }
}
