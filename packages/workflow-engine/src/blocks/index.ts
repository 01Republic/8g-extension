// Block handler entry point for workflow-engine

import { DOMProvider } from '../dom';
import { Block, BlockResult } from '../types';

// Import all schemas for AllBlockSchemas
import { GetTextBlockSchema } from './GetTextBlock';
import { GetElementDataBlockSchema } from './GetElementDataBlock';
import { GetAttributeValueBlockSchema } from './GetAttributeValueBlock';
import { GetValueFormsBlockSchema } from './GetValueFormBlock';
import { SetValueFormsBlockSchema } from './SetValueFormBlock';
import { ClearValueFormsBlockSchema } from './ClearValueFormBlock';
import { EventClickBlockSchema } from './EventClickBlock';
import { ScrollBlockSchema } from './ScrollBlock';
import { ElementExistsBlockSchema } from './ElementExistsBlock';
import { NavigateBlockSchema } from './NavigateBlock';
import { WaitBlockSchema } from './WaitBlock';
import { TransformDataBlockSchema } from './TransformDataBlock';
import { ThrowErrorBlockSchema } from './ThrowErrorBlock';
import { WaitForConditionBlockSchema } from './WaitForConditionBlock';
import { FetchApiBlockSchema } from './FetchApiBlock';
import { AiParseDataBlockSchema } from './AiParseDataBlock';
import { NetworkCatchBlockSchema } from './NetworkCatchBlock';
import { SaveAssetsBlockSchema } from './SaveAssetsBlock';
import { ExportDataBlockSchema } from './ExportDataBlock';
import { KeypressBlockSchema } from './KeypressBlock';
import { PasteValueBlockSchema } from './PasteValueBlock';
import { MarkBorderBlockSchema } from './MarkBorderBlock';
import { SetContentEditableBlockSchema } from './SetContentEditableBlock';
import { ApplyLocaleBlockSchema } from './ApplyLocaleBlock';
import { ExecuteJavaScriptBlockSchema } from './ExecuteJavaScriptBlock';

export type BlockHandler = (
  block: Block,
  domProvider: DOMProvider,
  context?: any
) => Promise<BlockResult>;

// DOM manipulation blocks
export { validateGetTextBlock, handlerGetText, GetTextBlockSchema } from './GetTextBlock';
export type { GetTextBlock } from './GetTextBlock';
export { validateGetElementDataBlock, handlerGetElementData, GetElementDataBlockSchema } from './GetElementDataBlock';
export type { GetElementDataBlock, ElementData } from './GetElementDataBlock';
export { validateGetAttributeValueBlock, handlerGetAttributeValue, GetAttributeValueBlockSchema } from './GetAttributeValueBlock';
export type { GetAttributeValueBlock } from './GetAttributeValueBlock';
export { validateGetValueFormsBlock, handlerGetValueForm, GetValueFormsBlockSchema } from './GetValueFormBlock';
export type { GetValueFormsBlock } from './GetValueFormBlock';
export { validateSetValueFormsBlock, handlerSetValueForm, SetValueFormsBlockSchema } from './SetValueFormBlock';
export type { SetValueFormsBlock } from './SetValueFormBlock';
export { validateClearValueFormsBlock, handlerClearValueForm, ClearValueFormsBlockSchema } from './ClearValueFormBlock';
export type { ClearValueFormsBlock } from './ClearValueFormBlock';
export { validateEventClickBlock, handlerEventClick, EventClickBlockSchema } from './EventClickBlock';
export type { EventClickBlock } from './EventClickBlock';
export { validateScrollBlock, handlerScroll, ScrollBlockSchema } from './ScrollBlock';
export type { ScrollBlock } from './ScrollBlock';
export { validateElementExistsBlock, handlerElementExists, ElementExistsBlockSchema } from './ElementExistsBlock';
export type { ElementExistsBlock } from './ElementExistsBlock';
export { validateNavigateBlock, handlerNavigate, NavigateBlockSchema } from './NavigateBlock';
export type { NavigateBlock } from './NavigateBlock';

// Platform-independent blocks
export { validateWaitBlock, handlerWait, WaitBlockSchema } from './WaitBlock';
export type { WaitBlock } from './WaitBlock';
export { validateTransformDataBlock, handlerTransformData, TransformDataBlockSchema } from './TransformDataBlock';
export type { TransformDataBlock } from './TransformDataBlock';
export { validateThrowErrorBlock, handlerThrowError, ThrowErrorBlockSchema, THROW_ERROR_MESSAGES } from './ThrowErrorBlock';
export type { ThrowErrorBlock, ThrowErrorMessage, ThrowErrorMessageKey } from './ThrowErrorBlock';
export { validateWaitForConditionBlock, handlerWaitForCondition, WaitForConditionBlockSchema } from './WaitForConditionBlock';
export type { WaitForConditionBlock, WaitForConditionResult } from './WaitForConditionBlock';

// Chrome-specific blocks using DOMProvider
export { validateFetchApiBlock, handlerFetchApi, FetchApiBlockSchema } from './FetchApiBlock';
export type { FetchApiBlock, FetchApiResponse } from './FetchApiBlock';
export { validateAiParseDataBlock, handlerAiParseData, AiParseDataBlockSchema, createSchema, createArraySchema } from './AiParseDataBlock';
export type { AiParseDataBlock, SchemaField, SchemaDefinition, ObjectSchemaDefinition, ArraySchemaDefinition, Schema } from './AiParseDataBlock';
export { validateNetworkCatchBlock, handlerNetworkCatch, NetworkCatchBlockSchema } from './NetworkCatchBlock';
export type { NetworkCatchBlock, NetworkCatchResponse } from './NetworkCatchBlock';
export { validateSaveAssetsBlock, handlerSaveAssets, SaveAssetsBlockSchema } from './SaveAssetsBlock';
export type { SaveAssetsBlock } from './SaveAssetsBlock';
export { validateExportDataBlock, handlerExportData, ExportDataBlockSchema } from './ExportDataBlock';
export type { ExportDataBlock } from './ExportDataBlock';
export { validateKeypressBlock, handlerKeypress, KeypressBlockSchema } from './KeypressBlock';
export type { KeypressBlock } from './KeypressBlock';
export { validatePasteValueBlock, handlerPasteValue, PasteValueBlockSchema } from './PasteValueBlock';
export type { PasteValueBlock } from './PasteValueBlock';
export { validateMarkBorderBlock, handlerMarkBorder, MarkBorderBlockSchema } from './MarkBorderBlock';
export type { MarkBorderBlock } from './MarkBorderBlock';
export { validateSetContentEditableBlock, handlerSetContentEditable, SetContentEditableBlockSchema } from './SetContentEditableBlock';
export type { SetContentEditableBlock } from './SetContentEditableBlock';
export { validateApplyLocaleBlock, handlerApplyLocale, ApplyLocaleBlockSchema } from './ApplyLocaleBlock';
export type { ApplyLocaleBlock } from './ApplyLocaleBlock';
export { validateExecuteJavaScriptBlock, handlerExecuteJavaScript, ExecuteJavaScriptBlockSchema } from './ExecuteJavaScriptBlock';
export type { ExecuteJavaScriptBlock } from './ExecuteJavaScriptBlock';

// Types and interfaces
export * from './types';

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
  'execute-javascript': ExecuteJavaScriptBlockSchema,
  'throw-error': ThrowErrorBlockSchema,
} as const;