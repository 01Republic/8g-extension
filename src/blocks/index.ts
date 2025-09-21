// Re-export common types
export type { Block, BlockResult } from './types';
export { BaseBlockSchema } from './types';

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
import { handlerSaveAssets, SaveAssetsBlock, validateSaveAssetsBlock } from './SaveAssetsBlock';
import {
  handlerGetElementData,
  GetElementDataBlock,
  validateGetElementDataBlock,
  ElementData,
} from './GetElementDataBlock';
import { Block, BlockResult } from './types';

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
  static executeBlock(block: SaveAssetsBlock): Promise<BlockResult<string[] | null>>;
  static executeBlock(
    block: GetElementDataBlock
  ): Promise<BlockResult<ElementData | ElementData[]>>;
  static executeBlock(block: Block): Promise<BlockResult>;

  // Implementation
  static async executeBlock(block: Block): Promise<BlockResult> {
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

        case 'save-assets': {
          const validatedBlock = validateSaveAssetsBlock(block);
          return await handlerSaveAssets(validatedBlock);
        }

        case 'get-element-data': {
          const validatedBlock = validateGetElementDataBlock(block);
          return await handlerGetElementData(validatedBlock);
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
