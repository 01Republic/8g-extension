export {
  EightGClient,
  // Types
  type WorkspaceItemDto,
  type CurrencyDto,
  type WorkspaceBillingDto,
  type WorkspaceBillingHistoryDto,
  type WorkspaceMemberDto,
  type ConnectWorkspaceResponseDto,
  // Enums
  BillingCycleTerm,
  // Schemas
  WorkspaceItemSchema,
  WorkspaceBillingSchema,
  WorkspaceBillingHistorySchema,
  WorkspaceMemberSchema,
} from './EightGClient';
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
  DataExtractBlock,
} from '../blocks';
