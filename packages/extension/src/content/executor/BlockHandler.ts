import {
  Block,
  BlockResult,
  validateGetTextBlock,
  handlerGetText,
  validateGetAttributeValueBlock,
  handlerGetAttributeValue,
  validateGetValueFormsBlock,
  handlerGetValueForm,
  validateSetValueFormsBlock,
  handlerSetValueForm,
  validateClearValueFormsBlock,
  handlerClearValueForm,
  validateSetContentEditableBlock,
  handlerSetContentEditable,
  validateElementExistsBlock,
  handlerElementExists,
  validateEventClickBlock,
  handlerEventClick,
  validateScrollBlock,
  handlerScroll,
  validateNavigateBlock,
  handlerNavigate,
  validateGetElementDataBlock,
  handlerGetElementData,
  validateWaitBlock,
  handlerWait,
  validateTransformDataBlock,
  handlerTransformData,
  validateThrowErrorBlock,
  handlerThrowError,
  validateWaitForConditionBlock,
  handlerWaitForCondition,
  validateFetchApiBlock,
  handlerFetchApi,
  validateAiParseDataBlock,
  handlerAiParseData,
  validateNetworkCatchBlock,
  handlerNetworkCatch,
  validateSaveAssetsBlock,
  handlerSaveAssets,
  validateExportDataBlock,
  handlerExportData,
  validateKeypressBlock,
  handlerKeypress,
  validatePasteValueBlock,
  handlerPasteValue,
  validateMarkBorderBlock,
  handlerMarkBorder,
  validateApplyLocaleBlock,
  handlerApplyLocale,
  validateExecuteJavaScriptBlock,
  handlerExecuteJavaScript,
} from '@8g/workflow-engine';
import { ChromeDOMProvider } from '../dom/ChromeDOMProvider';

export class BlockHandler {
  private static domProvider = new ChromeDOMProvider();

  static async executeBlock(block: Block): Promise<BlockResult> {
    try {
      switch (block.name) {
        case 'get-text': {
          const validatedBlock = validateGetTextBlock(block);
          return await handlerGetText(validatedBlock, this.domProvider);
        }

        case 'attribute-value': {
          const validatedBlock = validateGetAttributeValueBlock(block);
          return await handlerGetAttributeValue(validatedBlock, this.domProvider);
        }

        case 'get-value-form': {
          const validatedBlock = validateGetValueFormsBlock(block);
          return await handlerGetValueForm(validatedBlock, this.domProvider);
        }

        case 'set-value-form': {
          const validatedBlock = validateSetValueFormsBlock(block);
          return await handlerSetValueForm(validatedBlock, this.domProvider);
        }

        case 'set-contenteditable': {
          const validatedBlock = validateSetContentEditableBlock(block);
          return await handlerSetContentEditable(validatedBlock, this.domProvider);
        }

        case 'clear-value-form': {
          const validatedBlock = validateClearValueFormsBlock(block);
          return await handlerClearValueForm(validatedBlock, this.domProvider);
        }

        case 'element-exists': {
          const validatedBlock = validateElementExistsBlock(block);
          return await handlerElementExists(validatedBlock, this.domProvider);
        }

        case 'event-click': {
          const validatedBlock = validateEventClickBlock(block);
          return await handlerEventClick(validatedBlock, this.domProvider);
        }

        case 'scroll': {
          const validatedBlock = validateScrollBlock(block);
          return await handlerScroll(validatedBlock, this.domProvider);
        }

        case 'navigate': {
          const validatedBlock = validateNavigateBlock(block);
          return await handlerNavigate(validatedBlock, this.domProvider);
        }

        case 'get-element-data': {
          const validatedBlock = validateGetElementDataBlock(block);
          return await handlerGetElementData(validatedBlock, this.domProvider);
        }

        case 'wait': {
          const validatedBlock = validateWaitBlock(block);
          return await handlerWait(validatedBlock);
        }

        case 'transform-data': {
          const validatedBlock = validateTransformDataBlock(block);
          return await handlerTransformData(validatedBlock);
        }

        case 'throw-error': {
          const validatedBlock = validateThrowErrorBlock(block);
          return await handlerThrowError(validatedBlock);
        }

        case 'wait-for-condition': {
          const validatedBlock = validateWaitForConditionBlock(block);
          return await handlerWaitForCondition(validatedBlock, this.domProvider);
        }

        case 'fetch-api': {
          const validatedBlock = validateFetchApiBlock(block);
          return await handlerFetchApi(validatedBlock, this.domProvider);
        }

        case 'ai-parse-data': {
          const validatedBlock = validateAiParseDataBlock(block);
          return await handlerAiParseData(validatedBlock, this.domProvider);
        }

        case 'network-catch': {
          const validatedBlock = validateNetworkCatchBlock(block);
          return await handlerNetworkCatch(validatedBlock, this.domProvider);
        }

        case 'save-assets': {
          const validatedBlock = validateSaveAssetsBlock(block);
          return await handlerSaveAssets(validatedBlock, this.domProvider);
        }

        case 'export-data': {
          const validatedBlock = validateExportDataBlock(block);
          return await handlerExportData(validatedBlock, this.domProvider);
        }

        case 'keypress': {
          const validatedBlock = validateKeypressBlock(block);
          return await handlerKeypress(validatedBlock, this.domProvider);
        }

        case 'paste-value': {
          const validatedBlock = validatePasteValueBlock(block);
          return await handlerPasteValue(validatedBlock, this.domProvider);
        }

        case 'mark-border': {
          const validatedBlock = validateMarkBorderBlock(block);
          return await handlerMarkBorder(validatedBlock, this.domProvider);
        }

        case 'apply-locale': {
          const validatedBlock = validateApplyLocaleBlock(block);
          return await handlerApplyLocale(validatedBlock, this.domProvider);
        }

        case 'execute-javascript': {
          const validatedBlock = validateExecuteJavaScriptBlock(block);
          return await handlerExecuteJavaScript(validatedBlock, this.domProvider);
        }

        default:
          return {
            hasError: true,
            message: `Unknown block type: ${block.name}`,
            data: null,
          };
      }
    } catch (error) {
      return {
        hasError: true,
        message: error instanceof Error ? error.message : 'Unknown error in block execution',
        data: null,
      };
    }
  }
}
