import { BackgroundStepResponse } from '../types';
import { Block } from '../blocks';
export * from '../blocks';

// Data collection request
export interface CollectDataRequest {
  targetUrl: string;
  block: Block | Block[]; // 단일 블록 또는 블록 배열 지원
  blockDelay?: number; // 블록 간 지연 시간 (ms) - 기본값: 500ms
}

// Collection result
export interface CollectDataResult<T = any> {
  success: boolean;
  data?: BackgroundStepResponse<T> | BackgroundStepResponse<T>[]; // 단일 또는 배열 결과
  error?: string;
  timestamp: string;
  targetUrl: string;
}
