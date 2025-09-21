import { BackgroundStepResponse } from '../types';
import { Block } from '../blocks';
export * from '../blocks';

// Data collection request
export interface CollectDataRequest {
  targetUrl: string;
  block: Block;
}

// Collection result
export interface CollectDataResult<T = any> {
  success: boolean;
  data?:BackgroundStepResponse<T>
  error?: string;
  timestamp: string;
  targetUrl: string;
}
