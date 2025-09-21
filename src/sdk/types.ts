import { Block } from '@/blocks';

// Data collection request
export interface CollectDataRequest {
  targetUrl: string;
  block: Block;
}

// Collection result
export interface CollectDataResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
  targetUrl: string;
}
