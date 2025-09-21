import { Block, BlockResult } from '../blocks';
export * from '../blocks';

// Data collection request
export interface CollectDataRequest {
  targetUrl: string;
  block: Block;
}

// Collection result
export interface CollectDataResult<T = any> {
  success: boolean;
  data?:BlockResult<T>
  error?: string;
  timestamp: string;
  targetUrl: string;
}
