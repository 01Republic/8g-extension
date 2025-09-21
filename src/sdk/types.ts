import { Block, BlockResult } from '../blocks';
export * from '../blocks';

// Data collection request
export interface CollectDataRequest {
  targetUrl: string;
  block: Block;
}

// Collection result
export interface CollectDataResult<T = any> extends BlockResult<T> {
  success: boolean;
  error?: string;
  timestamp: string;
  targetUrl: string;
}
