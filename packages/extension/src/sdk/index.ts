export { EightGClient } from './EightGClient';
export * from './types';
export { EightGError } from './errors';

// Block schemas (re-export from workflow-engine)
export {
  GetTextBlockSchema,
  GetAttributeValueBlockSchema,
  GetValueFormsBlockSchema,
  SetValueFormsBlockSchema,
  ClearValueFormsBlockSchema,
  SetContentEditableBlockSchema,
  ElementExistsBlockSchema,
  EventClickBlockSchema,
  ScrollBlockSchema,
  NavigateBlockSchema,
  WaitBlockSchema,
  TransformDataBlockSchema,
  ThrowErrorBlockSchema,
  WaitForConditionBlockSchema,
  FetchApiBlockSchema,
  AiParseDataBlockSchema,
  NetworkCatchBlockSchema,
  SaveAssetsBlockSchema,
  ExportDataBlockSchema,
  KeypressBlockSchema,
  PasteValueBlockSchema,
  MarkBorderBlockSchema,
  ApplyLocaleBlockSchema,
  ExecuteJavaScriptBlockSchema,
  GetElementDataBlockSchema,
  AllBlockSchemas,
} from '@8g/workflow-engine';

// Block types
export type { Block, BlockResult } from '@8g/workflow-engine';
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
} from '@8g/workflow-engine';
