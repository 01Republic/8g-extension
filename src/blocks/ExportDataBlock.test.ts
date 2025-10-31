// @vitest-environment node
import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { validateExportDataBlock, handlerExportData, ExportDataBlock } from './ExportDataBlock';

// Mock chrome.downloads API
const mockDownload = vi.fn((_options, callback) => {
  callback(123); // Mock download ID
});

beforeAll(() => {
  // @ts-ignore - Mock chrome API globally
  globalThis.chrome = {
    downloads: {
      download: mockDownload as any,
    },
    runtime: {
      lastError: undefined,
    } as any,
  };

  // Mock FileReader for blobToDataUrl
  // @ts-ignore
  globalThis.FileReader = class {
    result: string = 'data:application/json;base64,mock';
    onloadend: (() => void) | null = null;
    onerror: (() => void) | null = null;

    readAsDataURL() {
      setTimeout(() => {
        if (this.onloadend) {
          this.onloadend();
        }
      }, 0);
    }
  };

  // Mock Blob
  // @ts-ignore
  globalThis.Blob = class {
    constructor(public parts: any[], public options: any) {}
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  // @ts-ignore
  globalThis.chrome.runtime.lastError = undefined;
});

describe('ExportDataBlock', () => {
  describe('validateExportDataBlock', () => {
    it('should validate a valid JSON export block', () => {
      const block = {
        name: 'export-data',
        data: { test: 'value' },
        format: 'json',
        filename: 'test-export',
      };

      const result = validateExportDataBlock(block);
      expect(result).toEqual(block);
    });

    it('should validate a valid CSV export block with options', () => {
      const block = {
        name: 'export-data',
        data: [{ name: 'John', age: 30 }],
        format: 'csv',
        filename: 'users',
        csvOptions: {
          delimiter: ';',
          includeHeaders: true,
        },
      };

      const result = validateExportDataBlock(block);
      expect(result).toEqual(block);
    });

    it('should validate a valid XLSX export block', () => {
      const block = {
        name: 'export-data',
        data: [{ name: 'Jane', age: 25 }],
        format: 'xlsx',
      };

      const result = validateExportDataBlock(block);
      expect(result.name).toBe('export-data');
      expect(result.format).toBe('xlsx');
    });

    it('should throw error for invalid format', () => {
      const block = {
        name: 'export-data',
        data: { test: 'value' },
        format: 'pdf', // Invalid format
      };

      expect(() => validateExportDataBlock(block)).toThrow();
    });

    it('should throw error for missing name', () => {
      const block = {
        data: { test: 'value' },
        format: 'json',
      };

      expect(() => validateExportDataBlock(block)).toThrow();
    });
  });

  describe('handlerExportData - JSON', () => {
    it('should export simple object as JSON', async () => {
      const block: ExportDataBlock = {
        name: 'export-data',
        data: { name: 'John', age: 30 },
        format: 'json',
        filename: 'test',
      };

      const result = await handlerExportData(block);

      expect(result.hasError).toBeUndefined();
      expect(result.data?.filename).toBe('test.json');
      expect(result.data?.downloadId).toBe(123);
      expect(mockDownload).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: 'test.json',
          saveAs: false,
        }),
        expect.any(Function)
      );
    });

    it('should export array as JSON', async () => {
      const block: ExportDataBlock = {
        name: 'export-data',
        data: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
        format: 'json',
        filename: 'users.json',
      };

      const result = await handlerExportData(block);

      expect(result.hasError).toBeUndefined();
      expect(result.data?.filename).toBe('users.json');
    });
  });

  describe('handlerExportData - CSV', () => {
    it('should export array of objects as CSV', async () => {
      const block: ExportDataBlock = {
        name: 'export-data',
        data: [
          { name: 'Alice', age: 30, city: 'Seoul' },
          { name: 'Bob', age: 25, city: 'Busan' },
        ],
        format: 'csv',
        filename: 'users',
      };

      const result = await handlerExportData(block);

      expect(result.hasError).toBeUndefined();
      expect(result.data?.filename).toBe('users.csv');
      expect(mockDownload).toHaveBeenCalled();

      // Verify CSV content structure (data URL should contain CSV)
      const downloadCall = mockDownload.mock.calls[0][0];
      expect(downloadCall.url).toContain('data:');
    });

    it('should export with custom CSV delimiter', async () => {
      const block: ExportDataBlock = {
        name: 'export-data',
        data: [{ name: 'John', age: 30 }],
        format: 'csv',
        filename: 'data',
        csvOptions: {
          delimiter: ';',
          includeHeaders: true,
        },
      };

      const result = await handlerExportData(block);

      expect(result.hasError).toBeUndefined();
      expect(result.data?.filename).toBe('data.csv');
    });

    it('should export without headers when specified', async () => {
      const block: ExportDataBlock = {
        name: 'export-data',
        data: [{ name: 'Jane', age: 25 }],
        format: 'csv',
        csvOptions: {
          includeHeaders: false,
        },
      };

      const result = await handlerExportData(block);

      expect(result.hasError).toBeUndefined();
    });
  });

  describe('handlerExportData - XLSX', () => {
    it('should export array of objects as XLSX', async () => {
      const block: ExportDataBlock = {
        name: 'export-data',
        data: [
          { product: 'Laptop', price: 1000, stock: 5 },
          { product: 'Mouse', price: 25, stock: 100 },
        ],
        format: 'xlsx',
        filename: 'inventory',
      };

      const result = await handlerExportData(block);

      expect(result.hasError).toBeUndefined();
      expect(result.data?.filename).toBe('inventory.xlsx');
      expect(mockDownload).toHaveBeenCalled();
    });

    it('should handle empty data for XLSX', async () => {
      const block: ExportDataBlock = {
        name: 'export-data',
        data: [],
        format: 'xlsx',
      };

      const result = await handlerExportData(block);

      expect(result.hasError).toBeUndefined();
      expect(result.data?.filename).toBe('export-data.xlsx');
    });
  });

  describe('handlerExportData - Error Cases', () => {
    it('should return error when data is null', async () => {
      const block: ExportDataBlock = {
        name: 'export-data',
        data: null,
        format: 'json',
      };

      const result = await handlerExportData(block);

      expect(result.hasError).toBe(true);
      expect(result.message).toContain('No data provided');
    });

    it('should return error when data is undefined', async () => {
      const block: ExportDataBlock = {
        name: 'export-data',
        data: undefined,
        format: 'json',
      };

      const result = await handlerExportData(block);

      expect(result.hasError).toBe(true);
      expect(result.message).toContain('No data provided');
    });

    it('should handle download API errors', async () => {
      // @ts-ignore
      globalThis.chrome.runtime.lastError = { message: 'Download failed' };
      mockDownload.mockImplementation((_options, callback) => {
        callback(0);
      });

      const block: ExportDataBlock = {
        name: 'export-data',
        data: { test: 'value' },
        format: 'json',
      };

      const result = await handlerExportData(block);

      expect(result.hasError).toBe(true);
      expect(result.message).toContain('Download failed');
    });
  });

  describe('Filename handling', () => {
    it('should add extension if not present', async () => {
      const block: ExportDataBlock = {
        name: 'export-data',
        data: { test: 'value' },
        format: 'json',
        filename: 'myfile',
      };

      const result = await handlerExportData(block);

      expect(result.data?.filename).toBe('myfile.json');
    });

    it('should not duplicate extension if already present', async () => {
      const block: ExportDataBlock = {
        name: 'export-data',
        data: { test: 'value' },
        format: 'csv',
        filename: 'myfile.csv',
      };

      const result = await handlerExportData(block);

      expect(result.data?.filename).toBe('myfile.csv');
    });

    it('should use default filename when not provided', async () => {
      const block: ExportDataBlock = {
        name: 'export-data',
        data: [1, 2, 3],
        format: 'json',
      };

      const result = await handlerExportData(block);

      expect(result.data?.filename).toBe('export-data.json');
    });
  });
});
