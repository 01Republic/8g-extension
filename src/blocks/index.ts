// Re-export common types
export type { Block, BlockResult } from './types';
export { BaseBlockSchema } from './types';

// Re-export all block types
export type { GetTextBlock } from './GetTextBlock';
export type { GetAttributeValueBlock } from './GetAttributeValueBlock';
export type { GetValueFormsBlock } from './GetValueFormBlock';
export type { SetValueFormsBlock } from './SetValueFormBlock';
export type { ClearValueFormsBlock } from './ClearValueFormBlock';
export type { SetContentEditableBlock } from './SetContentEditableBlock';
export type { ElementExistsBlock } from './ElementExistsBlock';
export type { EventClickBlock } from './EventClickBlock';
export type { KeypressBlock } from './KeypressBlock';
export type { WaitBlock } from './WaitBlock';
export type { WaitForConditionBlock, WaitForConditionResult } from './WaitForConditionBlock';
export type { NavigateBlock } from './NavigateBlock';
export type { SaveAssetsBlock } from './SaveAssetsBlock';
export type { GetElementDataBlock, ElementData } from './GetElementDataBlock';
export type { ScrollBlock } from './ScrollBlock';
export type {
  AiParseDataBlock,
  SchemaField,
  SchemaDefinition,
  ObjectSchemaDefinition,
  ArraySchemaDefinition,
} from './AiParseDataBlock';
export { createSchema, createArraySchema, Schema } from './AiParseDataBlock';
export type { FetchApiBlock, FetchApiResponse } from './FetchApiBlock';
export type { TransformDataBlock } from './TransformDataBlock';
export type { ExportDataBlock } from './ExportDataBlock';
export type { NetworkCatchBlock, NetworkCatchResponse } from './NetworkCatchBlock';
export type { MarkBorderBlock } from './MarkBorderBlock';
export type { ApplyLocaleBlock } from './ApplyLocaleBlock';
export type { PasteValueBlock } from './PasteValueBlock';
export type { CheckStatusBlock } from './CheckStatusBlock';

// Export all block schemas
export { GetTextBlockSchema } from './GetTextBlock';
export { GetAttributeValueBlockSchema } from './GetAttributeValueBlock';
export { GetValueFormsBlockSchema } from './GetValueFormBlock';
export { SetValueFormsBlockSchema } from './SetValueFormBlock';
export { ClearValueFormsBlockSchema } from './ClearValueFormBlock';
export { SetContentEditableBlockSchema } from './SetContentEditableBlock';
export { ElementExistsBlockSchema } from './ElementExistsBlock';
export { EventClickBlockSchema } from './EventClickBlock';
export { KeypressBlockSchema } from './KeypressBlock';
export { WaitBlockSchema } from './WaitBlock';
export { WaitForConditionBlockSchema } from './WaitForConditionBlock';
export { NavigateBlockSchema } from './NavigateBlock';
export { SaveAssetsBlockSchema } from './SaveAssetsBlock';
export { GetElementDataBlockSchema } from './GetElementDataBlock';
export { ScrollBlockSchema } from './ScrollBlock';
export { AiParseDataBlockSchema } from './AiParseDataBlock';
export { FetchApiBlockSchema } from './FetchApiBlock';
export { TransformDataBlockSchema } from './TransformDataBlock';
export { ExportDataBlockSchema } from './ExportDataBlock';
export { NetworkCatchBlockSchema } from './NetworkCatchBlock';
export { MarkBorderBlockSchema } from './MarkBorderBlock';
export { ApplyLocaleBlockSchema } from './ApplyLocaleBlock';
export { PasteValueBlockSchema } from './PasteValueBlock';
export { CheckStatusBlockSchema } from './CheckStatusBlock';

// Import block handlers and types
import { handlerGetText, GetTextBlock, validateGetTextBlock } from './GetTextBlock';
import {
  handlerGetAttributeValue,
  GetAttributeValueBlock,
  validateGetAttributeValueBlock,
} from './GetAttributeValueBlock';
import {
  handlerGetValueForm,
  GetValueFormsBlock,
  validateGetValueFormsBlock,
} from './GetValueFormBlock';
import {
  handlerSetValueForm,
  SetValueFormsBlock,
  validateSetValueFormsBlock,
} from './SetValueFormBlock';
import {
  handlerClearValueForm,
  ClearValueFormsBlock,
  validateClearValueFormsBlock,
} from './ClearValueFormBlock';
import {
  handlerSetContentEditable,
  SetContentEditableBlock,
  validateSetContentEditableBlock,
} from './SetContentEditableBlock';
import {
  handlerElementExists,
  ElementExistsBlock,
  validateElementExistsBlock,
} from './ElementExistsBlock';
import { handlerEventClick, EventClickBlock, validateEventClickBlock } from './EventClickBlock';
import { handlerKeypress, KeypressBlock, validateKeypressBlock } from './KeypressBlock';
import { handlerWait, WaitBlock, validateWaitBlock } from './WaitBlock';
import {
  handlerWaitForCondition,
  WaitForConditionBlock,
  WaitForConditionResult,
  validateWaitForConditionBlock,
} from './WaitForConditionBlock';
import { handlerNavigate, NavigateBlock, validateNavigateBlock } from './NavigateBlock';
import { handlerSaveAssets, SaveAssetsBlock, validateSaveAssetsBlock } from './SaveAssetsBlock';
import {
  handlerGetElementData,
  GetElementDataBlock,
  validateGetElementDataBlock,
  ElementData,
} from './GetElementDataBlock';
import { handlerScroll, ScrollBlock, validateScrollBlock } from './ScrollBlock';
import { handlerAiParseData, AiParseDataBlock, validateAiParseDataBlock } from './AiParseDataBlock';
import { handlerFetchApi, FetchApiBlock, validateFetchApiBlock } from './FetchApiBlock';
import {
  handlerTransformData,
  TransformDataBlock,
  validateTransformDataBlock,
} from './TransformDataBlock';
import { handlerExportData, ExportDataBlock, validateExportDataBlock } from './ExportDataBlock';
import {
  handlerNetworkCatch,
  NetworkCatchBlock,
  validateNetworkCatchBlock,
} from './NetworkCatchBlock';
import { handlerMarkBorder, MarkBorderBlock, validateMarkBorderBlock } from './MarkBorderBlock';
import { handlerApplyLocale, ApplyLocaleBlock, validateApplyLocaleBlock } from './ApplyLocaleBlock';
import { handlerPasteValue, PasteValueBlock, validatePasteValueBlock } from './PasteValueBlock';
import { handlerCheckStatusBlock, CheckStatusBlock, validateCheckStatusBlock } from './CheckStatusBlock';
import { Block, BlockResult } from './types';
import { GetTextBlockSchema } from './GetTextBlock';
import { GetAttributeValueBlockSchema } from './GetAttributeValueBlock';
import { GetValueFormsBlockSchema } from './GetValueFormBlock';
import { SetValueFormsBlockSchema } from './SetValueFormBlock';
import { ClearValueFormsBlockSchema } from './ClearValueFormBlock';
import { SetContentEditableBlockSchema } from './SetContentEditableBlock';
import { ElementExistsBlockSchema } from './ElementExistsBlock';
import { EventClickBlockSchema } from './EventClickBlock';
import { KeypressBlockSchema } from './KeypressBlock';
import { WaitBlockSchema } from './WaitBlock';
import { WaitForConditionBlockSchema } from './WaitForConditionBlock';
import { NavigateBlockSchema } from './NavigateBlock';
import { SaveAssetsBlockSchema } from './SaveAssetsBlock';
import { GetElementDataBlockSchema } from './GetElementDataBlock';
import { ScrollBlockSchema } from './ScrollBlock';
import { AiParseDataBlockSchema } from './AiParseDataBlock';
import { FetchApiBlockSchema } from './FetchApiBlock';
import { TransformDataBlockSchema } from './TransformDataBlock';
import { ExportDataBlockSchema } from './ExportDataBlock';
import { NetworkCatchBlockSchema } from './NetworkCatchBlock';
import { MarkBorderBlockSchema } from './MarkBorderBlock';
import { ApplyLocaleBlockSchema } from './ApplyLocaleBlock';
import { PasteValueBlockSchema } from './PasteValueBlock';
import { CheckStatusBlockSchema } from './CheckStatusBlock';

// All block schemas mapped by block name
export const AllBlockSchemas = {
  'get-text': GetTextBlockSchema,
  'attribute-value': GetAttributeValueBlockSchema,
  'get-value-form': GetValueFormsBlockSchema,
  'set-value-form': SetValueFormsBlockSchema,
  'set-contenteditable': SetContentEditableBlockSchema,
  'clear-value-form': ClearValueFormsBlockSchema,
  'element-exists': ElementExistsBlockSchema,
  'event-click': EventClickBlockSchema,
  keypress: KeypressBlockSchema,
  wait: WaitBlockSchema,
  'wait-for-condition': WaitForConditionBlockSchema,
  navigate: NavigateBlockSchema,
  'save-assets': SaveAssetsBlockSchema,
  'get-element-data': GetElementDataBlockSchema,
  scroll: ScrollBlockSchema,
  'ai-parse-data': AiParseDataBlockSchema,
  'fetch-api': FetchApiBlockSchema,
  'transform-data': TransformDataBlockSchema,
  'export-data': ExportDataBlockSchema,
  'network-catch': NetworkCatchBlockSchema,
  'mark-border': MarkBorderBlockSchema,
  'apply-locale': ApplyLocaleBlockSchema,
  'paste-value': PasteValueBlockSchema,
  'check-status': CheckStatusBlockSchema,
} as const;

export class BlockHandler {
  // Overloads
  static executeBlock(block: GetTextBlock): Promise<BlockResult<string | string[]>>;
  static executeBlock(
    block: GetAttributeValueBlock
  ): Promise<BlockResult<string | string[] | null>>;
  static executeBlock(block: GetValueFormsBlock): Promise<BlockResult<string | boolean | null>>;
  static executeBlock(block: SetValueFormsBlock): Promise<BlockResult<string | null>>;
  static executeBlock(block: SetContentEditableBlock): Promise<BlockResult<string | null>>;
  static executeBlock(block: ClearValueFormsBlock): Promise<BlockResult<string | null>>;
  static executeBlock(block: ElementExistsBlock): Promise<BlockResult<boolean | null>>;
  static executeBlock(block: EventClickBlock): Promise<BlockResult<boolean>>;
  static executeBlock(block: KeypressBlock): Promise<BlockResult<boolean>>;
  static executeBlock(block: WaitBlock): Promise<BlockResult<boolean>>;
  static executeBlock(block: WaitForConditionBlock): Promise<BlockResult<WaitForConditionResult>>;
  static executeBlock(block: NavigateBlock): Promise<BlockResult<boolean>>;
  static executeBlock(block: SaveAssetsBlock): Promise<BlockResult<string[] | null>>;
  static executeBlock(
    block: GetElementDataBlock
  ): Promise<BlockResult<ElementData | ElementData[]>>;
  static executeBlock(block: ScrollBlock): Promise<BlockResult<boolean>>;
  static executeBlock(block: AiParseDataBlock): Promise<BlockResult<any>>;
  static executeBlock(block: FetchApiBlock): Promise<BlockResult<any>>;
  static executeBlock(block: TransformDataBlock): Promise<BlockResult<any>>;
  static executeBlock(
    block: ExportDataBlock
  ): Promise<BlockResult<{ filename: string; downloadId?: number }>>;
  static executeBlock(block: NetworkCatchBlock): Promise<BlockResult<any>>;
  static executeBlock(block: MarkBorderBlock): Promise<BlockResult<boolean>>;
  static executeBlock(block: ApplyLocaleBlock): Promise<BlockResult<any>>;
  static executeBlock(block: PasteValueBlock): Promise<BlockResult<boolean>>;
  static executeBlock(block: CheckStatusBlock): Promise<BlockResult<any>>;
  static executeBlock(block: Block): Promise<BlockResult>;

  // Implementation
  static async executeBlock(
    block:
      | Block
      | AiParseDataBlock
      | FetchApiBlock
      | TransformDataBlock
      | ExportDataBlock
      | NetworkCatchBlock
      | MarkBorderBlock
      | ApplyLocaleBlock
      | PasteValueBlock
      | CheckStatusBlock
      | KeypressBlock
      | WaitBlock
      | WaitForConditionBlock
      | NavigateBlock
  ): Promise<BlockResult> {
    try {
      switch (block.name) {
        case 'get-text': {
          const validatedBlock = validateGetTextBlock(block);
          return await handlerGetText(validatedBlock);
        }

        case 'attribute-value': {
          const validatedBlock = validateGetAttributeValueBlock(block);
          return await handlerGetAttributeValue(validatedBlock);
        }

        case 'get-value-form': {
          const validatedBlock = validateGetValueFormsBlock(block);
          return await handlerGetValueForm(validatedBlock);
        }

        case 'set-value-form': {
          const validatedBlock = validateSetValueFormsBlock(block);
          return await handlerSetValueForm(validatedBlock);
        }

        case 'set-contenteditable': {
          const validatedBlock = validateSetContentEditableBlock(block);
          return await handlerSetContentEditable(validatedBlock);
        }

        case 'clear-value-form': {
          const validatedBlock = validateClearValueFormsBlock(block);
          return await handlerClearValueForm(validatedBlock);
        }

        case 'element-exists': {
          const validatedBlock = validateElementExistsBlock(block);
          return await handlerElementExists(validatedBlock);
        }

        case 'event-click': {
          const validatedBlock = validateEventClickBlock(block);
          return await handlerEventClick(validatedBlock);
        }

        case 'keypress': {
          const validatedBlock = validateKeypressBlock(block);
          return await handlerKeypress(validatedBlock);
        }

        case 'wait': {
          const validatedBlock = validateWaitBlock(block);
          return await handlerWait(validatedBlock);
        }

        case 'wait-for-condition': {
          const validatedBlock = validateWaitForConditionBlock(block);
          return await handlerWaitForCondition(validatedBlock);
        }

        case 'navigate': {
          const validatedBlock = validateNavigateBlock(block);
          return await handlerNavigate(validatedBlock);
        }

        case 'save-assets': {
          const validatedBlock = validateSaveAssetsBlock(block);
          return await handlerSaveAssets(validatedBlock);
        }

        case 'get-element-data': {
          const validatedBlock = validateGetElementDataBlock(block);
          return await handlerGetElementData(validatedBlock);
        }

        case 'scroll': {
          const validatedBlock = validateScrollBlock(block);
          return await handlerScroll(validatedBlock);
        }

        case 'ai-parse-data': {
          const validatedBlock = validateAiParseDataBlock(block);
          return await handlerAiParseData(validatedBlock);
        }

        case 'fetch-api': {
          const validatedBlock = validateFetchApiBlock(block);
          return await handlerFetchApi(validatedBlock);
        }

        case 'transform-data': {
          const validatedBlock = validateTransformDataBlock(block);
          return await handlerTransformData(validatedBlock);
        }

        case 'export-data': {
          const validatedBlock = validateExportDataBlock(block);
          return await handlerExportData(validatedBlock);
        }

        case 'network-catch': {
          const validatedBlock = validateNetworkCatchBlock(block as NetworkCatchBlock);
          return await handlerNetworkCatch(validatedBlock);
        }

        case 'mark-border': {
          const validatedBlock = validateMarkBorderBlock(block);
          return await handlerMarkBorder(validatedBlock);
        }

        case 'apply-locale': {
          const validatedBlock = validateApplyLocaleBlock(block);
          return await handlerApplyLocale(validatedBlock);
        }

        case 'paste-value': {
          const validatedBlock = validatePasteValueBlock(block);
          return await handlerPasteValue(validatedBlock);
        }

        case 'check-status': {
          const validatedBlock = validateCheckStatusBlock(block);
          return await handlerCheckStatusBlock(validatedBlock);
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
