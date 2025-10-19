import { z } from 'zod';

export interface Block {
  name: string;
  selector: string;
  findBy: 'cssSelector' | 'xpath';
  option: {
    waitForSelector?: boolean;
    waitSelectorTimeout?: number;
    multiple?: boolean;
  };
}

export interface BlockResult<T = any> {
  data?: T;
  hasError?: boolean;
  message?: string;
}

export const BaseBlockSchema = z.object({
  name: z.string(),
  selector: z.string(),
  findBy: z.enum(['cssSelector', 'xpath']),
  option: z.object({
    waitForSelector: z.boolean().optional(),
    waitSelectorTimeout: z.number().optional(),
    multiple: z.boolean().optional(),
  }),
});

// Re-export all specific block types (타입 안전성을 위한 재export)
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
export type { AiParseDataBlock, SchemaField, SchemaDefinition } from './AiParseDataBlock';
export type { FetchApiBlock, FetchApiResponse } from './FetchApiBlock';
export type { DataExtractBlock } from './DataExtractBlock';

// Re-export AllBlockSchemas for SDK usage
export { AllBlockSchemas } from './index';
