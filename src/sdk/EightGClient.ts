import { CollectDataRequest, CollectDataResult, CollectWorkflowRequest, CollectWorkflowResult } from './types';
import type { 
  Block,
  GetTextBlock,
  GetAttributeValueBlock,
  GetValueFormsBlock,
  SetValueFormsBlock,
  ClearValueFormsBlock,
  ElementExistsBlock,
  EventClickBlock,
  SaveAssetsBlock,
  GetElementDataBlock,
  ElementData
} from '../blocks';
import { EightGError } from './errors';
import { ExtensionResponseMessage, isExtensionResponseMessage } from '@/types/external-messages';

/**
 * 8G Extension SDK Client
 * 웹페이지에서 8G Extension과 통신하기 위한 클라이언트
 */
export class EightGClient {
  constructor() {}

  /**
   * Extension 설치 여부 확인
   */
  async checkExtension(): Promise<ExtensionResponseMessage> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(EightGError.extensionNotInstalled());
      }, 5000);

      const handleResponse = (event: MessageEvent) => {
        if (isExtensionResponseMessage(event.data)) {
          clearTimeout(timeout);
          window.removeEventListener('message', handleResponse);
          resolve(event.data);
        }
      };

      window.addEventListener('message', handleResponse);
      window.postMessage({ type: '8G_EXTENSION_CHECK' }, '*');
    });
  }

  // Overloads for single block
  async collectData(request: { targetUrl: string; block: GetTextBlock }): Promise<CollectDataResult<string | string[]>>;
  async collectData(request: { targetUrl: string; block: GetAttributeValueBlock }): Promise<CollectDataResult<string | string[] | null>>;
  async collectData(request: { targetUrl: string; block: GetValueFormsBlock }): Promise<CollectDataResult<string | boolean | null>>;
  async collectData(request: { targetUrl: string; block: SetValueFormsBlock }): Promise<CollectDataResult<string | null>>;
  async collectData(request: { targetUrl: string; block: ClearValueFormsBlock }): Promise<CollectDataResult<string | null>>;
  async collectData(request: { targetUrl: string; block: ElementExistsBlock }): Promise<CollectDataResult<boolean | null>>;
  async collectData(request: { targetUrl: string; block: EventClickBlock }): Promise<CollectDataResult<boolean>>;
  async collectData(request: { targetUrl: string; block: SaveAssetsBlock }): Promise<CollectDataResult<string[] | null>>;
  async collectData(request: { targetUrl: string; block: GetElementDataBlock }): Promise<CollectDataResult<ElementData | ElementData[]>>;
  
  // Overload for multiple blocks (순차 실행)
  async collectData(request: { targetUrl: string; block: Block[] }): Promise<CollectDataResult<any[]>>;
  
  // Generic overload
  async collectData(request: CollectDataRequest): Promise<CollectDataResult>;

  /**
   * 데이터 수집 요청
   */
  async collectData(request: CollectDataRequest): Promise<CollectDataResult> {
    return new Promise((resolve, reject) => {
      const requestId = `8g_${Date.now()}_${Math.random()}`;
      const timeout = setTimeout(() => {
        reject(EightGError.requestTimeout());
      }, 30000);

      const handleResponse = (event: MessageEvent) => {
        if (event.data?.type === '8G_COLLECT_RESPONSE' && event.data.requestId === requestId) {
          clearTimeout(timeout);
          window.removeEventListener('message', handleResponse);
          
          const response = event.data;
          resolve({
            success: response.success,
            data: response.result,
            error: response.success ? undefined : 'Collection failed',
            timestamp: new Date().toISOString(),
            targetUrl: request.targetUrl,
          });
        }
      };

      window.addEventListener('message', handleResponse);
      window.postMessage({
        type: '8G_COLLECT_DATA',
        requestId,
        targetUrl: request.targetUrl,
        block: request.block,
        closeTabAfterCollection: true,
        activateTab: false,
        blockDelay: request.blockDelay || 500, // 기본값 500ms
      }, '*');
    });
  }

  /**
   * 워크플로우 실행 요청
   */
  async collectWorkflow(request: CollectWorkflowRequest): Promise<CollectWorkflowResult> {
    return new Promise((resolve, reject) => {
      const requestId = `8g_wf_${Date.now()}_${Math.random()}`;
      const timeout = setTimeout(() => {
        reject(EightGError.requestTimeout());
      }, 60000);

      const handleResponse = (event: MessageEvent) => {
        if (event.data?.type === '8G_COLLECT_RESPONSE' && event.data.requestId === requestId) {
          clearTimeout(timeout);
          window.removeEventListener('message', handleResponse);

          const response = event.data as any;
          const steps =
            response?.result?.steps ??
            response?.result?.result?.steps ??
            [];

          resolve({
            success: response.success,
            steps,
            error: response.success ? undefined : 'Workflow failed',
            timestamp: new Date().toISOString(),
            targetUrl: request.targetUrl,
          });
        }
      };

      window.addEventListener('message', handleResponse);
      window.postMessage({
        type: '8G_COLLECT_WORKFLOW',
        requestId,
        targetUrl: request.targetUrl,
        workflow: request.workflow,
        closeTabAfterCollection: request.closeTabAfterCollection !== false,
        activateTab: request.activateTab === true,
      }, '*');
    });
  }
}
