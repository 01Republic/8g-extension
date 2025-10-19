// Re-export common types
export type { Block, BlockResult } from './types';
export { BaseBlockSchema } from './types';

// Re-export all block types
export type { GetTextBlock } from './GetTextBlock';
export type { GetAttributeValueBlock } from './GetAttributeValueBlock';
export type { GetValueFormsBlock } from './GetValueFormBlock';
export type { SetValueFormsBlock } from './SetValueFormBlock';
export type { ClearValueFormsBlock } from './ClearValueFormBlock';
export type { ElementExistsBlock } from './ElementExistsBlock';
export type { EventClickBlock } from './EventClickBlock';
export type { KeypressBlock } from './KeypressBlock';
export type { WaitBlock } from './WaitBlock';
export type { WaitForConditionBlock, WaitForConditionResult } from './WaitForConditionBlock';
export type { SaveAssetsBlock } from './SaveAssetsBlock';
export type { GetElementDataBlock, ElementData } from './GetElementDataBlock';
export type { ScrollBlock } from './ScrollBlock';
export type { 
  AiParseDataBlock, 
  SchemaField, 
  SchemaDefinition,
  ObjectSchemaDefinition,
  ArraySchemaDefinition 
} from './AiParseDataBlock';
export { createSchema, createArraySchema, Schema } from './AiParseDataBlock';
export type { FetchApiBlock, FetchApiResponse } from './FetchApiBlock';
export type { DataExtractBlock } from './DataExtractBlock';

// Export all block schemas
export { GetTextBlockSchema } from './GetTextBlock';
export { GetAttributeValueBlockSchema } from './GetAttributeValueBlock';
export { GetValueFormsBlockSchema } from './GetValueFormBlock';
export { SetValueFormsBlockSchema } from './SetValueFormBlock';
export { ClearValueFormsBlockSchema } from './ClearValueFormBlock';
export { ElementExistsBlockSchema } from './ElementExistsBlock';
export { EventClickBlockSchema } from './EventClickBlock';
export { KeypressBlockSchema } from './KeypressBlock';
export { WaitBlockSchema } from './WaitBlock';
export { WaitForConditionBlockSchema } from './WaitForConditionBlock';
export { SaveAssetsBlockSchema } from './SaveAssetsBlock';
export { GetElementDataBlockSchema } from './GetElementDataBlock';
export { ScrollBlockSchema } from './ScrollBlock';
export { AiParseDataBlockSchema } from './AiParseDataBlock';
export { FetchApiBlockSchema } from './FetchApiBlock';
export { DataExtractBlockSchema } from './DataExtractBlock';

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
  validateWaitForConditionBlock
} from './WaitForConditionBlock';
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
import { handlerDataExtract, DataExtractBlock, validateDataExtractBlock } from './DataExtractBlock';
import { Block, BlockResult } from './types';
import { GetTextBlockSchema } from './GetTextBlock';
import { GetAttributeValueBlockSchema } from './GetAttributeValueBlock';
import { GetValueFormsBlockSchema } from './GetValueFormBlock';
import { SetValueFormsBlockSchema } from './SetValueFormBlock';
import { ClearValueFormsBlockSchema } from './ClearValueFormBlock';
import { ElementExistsBlockSchema } from './ElementExistsBlock';
import { EventClickBlockSchema } from './EventClickBlock';
import { KeypressBlockSchema } from './KeypressBlock';
import { WaitBlockSchema } from './WaitBlock';
import { WaitForConditionBlockSchema } from './WaitForConditionBlock';
import { SaveAssetsBlockSchema } from './SaveAssetsBlock';
import { GetElementDataBlockSchema } from './GetElementDataBlock';
import { ScrollBlockSchema } from './ScrollBlock';
import { AiParseDataBlockSchema } from './AiParseDataBlock';
import { FetchApiBlockSchema } from './FetchApiBlock';
import { DataExtractBlockSchema } from './DataExtractBlock';

// All block schemas mapped by block name
export const AllBlockSchemas = {
  'get-text': GetTextBlockSchema,
  'attribute-value': GetAttributeValueBlockSchema,
  'get-value-form': GetValueFormsBlockSchema,
  'set-value-form': SetValueFormsBlockSchema,
  'clear-value-form': ClearValueFormsBlockSchema,
  'element-exists': ElementExistsBlockSchema,
  'event-click': EventClickBlockSchema,
  'keypress': KeypressBlockSchema,
  'wait': WaitBlockSchema,
  'wait-for-condition': WaitForConditionBlockSchema,
  'save-assets': SaveAssetsBlockSchema,
  'get-element-data': GetElementDataBlockSchema,
  'scroll': ScrollBlockSchema,
  'ai-parse-data': AiParseDataBlockSchema,
  'fetch-api': FetchApiBlockSchema,
  'data-extract': DataExtractBlockSchema,
} as const;

export class BlockHandler {
  // Overloads
  static executeBlock(block: GetTextBlock): Promise<BlockResult<string | string[]>>;
  static executeBlock(
    block: GetAttributeValueBlock
  ): Promise<BlockResult<string | string[] | null>>;
  static executeBlock(block: GetValueFormsBlock): Promise<BlockResult<string | boolean | null>>;
  static executeBlock(block: SetValueFormsBlock): Promise<BlockResult<string | null>>;
  static executeBlock(block: ClearValueFormsBlock): Promise<BlockResult<string | null>>;
  static executeBlock(block: ElementExistsBlock): Promise<BlockResult<boolean | null>>;
  static executeBlock(block: EventClickBlock): Promise<BlockResult<boolean>>;
  static executeBlock(block: KeypressBlock): Promise<BlockResult<boolean>>;
  static executeBlock(block: WaitBlock): Promise<BlockResult<boolean>>;
  static executeBlock(block: WaitForConditionBlock): Promise<BlockResult<WaitForConditionResult>>;
  static executeBlock(block: SaveAssetsBlock): Promise<BlockResult<string[] | null>>;
  static executeBlock(
    block: GetElementDataBlock
  ): Promise<BlockResult<ElementData | ElementData[]>>;
  static executeBlock(block: ScrollBlock): Promise<BlockResult<boolean>>;
  static executeBlock(block: AiParseDataBlock): Promise<BlockResult<any>>;
  static executeBlock(block: FetchApiBlock): Promise<BlockResult<any>>;
  static executeBlock(block: DataExtractBlock): Promise<BlockResult<any>>;
  static executeBlock(block: Block): Promise<BlockResult>;

  // Implementation
  static async executeBlock(block: Block | AiParseDataBlock | FetchApiBlock | DataExtractBlock | KeypressBlock | WaitBlock | WaitForConditionBlock): Promise<BlockResult> {
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

        case 'data-extract': {
          const validatedBlock = validateDataExtractBlock(block);
          return await handlerDataExtract(validatedBlock);
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
