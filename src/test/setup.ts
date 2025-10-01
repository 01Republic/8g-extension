import { vi } from 'vitest';

// Mock chrome API if needed
global.chrome = {
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
    },
  },
} as any;

