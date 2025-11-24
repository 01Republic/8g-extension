export { EightGClient } from './EightGClient';
export * from './types';
export { EightGError } from './errors';

// Block types
export type { Block, BlockResult } from '../blocks/types';
export type {
  GetTextBlock,
  GetAttributeValueBlock,
  GetValueFormsBlock,
  SetValueFormsBlock,
  ClearValueFormsBlock,
  ElementExistsBlock,
  EventClickBlock,
  KeypressBlock,
  WaitBlock,
  WaitForConditionBlock,
  WaitForConditionResult,
  NavigateBlock,
  SaveAssetsBlock,
  GetElementDataBlock,
  ElementData,
  ScrollBlock,
  AiParseDataBlock,
  SchemaField,
  SchemaDefinition,
  ObjectSchemaDefinition,
  ArraySchemaDefinition,
  FetchApiBlock,
  FetchApiResponse,
  TransformDataBlock,
  ExportDataBlock,
} from '../blocks';
