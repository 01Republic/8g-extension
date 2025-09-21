import z from 'zod';
import { Block, BlockResult, BaseBlockSchema } from './types';
import { findElement } from '@/content/elements';
import { CSSSelectorGenerator } from '@/content/elements/utils/CSSSelectorGenerator';

export interface ElementData {
  text?: string;
  attributes?: Record<string, string | null>;
  selector?: string;        // 생성된 CSS 셀렉터
  [key: string]: any;
}

export interface GetElementDataBlock extends Block {
  readonly name: 'get-element-data';
  // Text extraction options
  includeText?: boolean;
  includeTags?: boolean;
  useTextContent?: boolean;
  regex?: string;
  prefixText?: string;
  suffixText?: string;
  // Attribute extraction options
  attributes?: string[];
  // CSS selector generation option
  includeSelector?: boolean;
}

export const GetElementDataBlockSchema = BaseBlockSchema.extend({
  name: z.literal('get-element-data'),
  includeText: z.boolean().optional(),
  includeTags: z.boolean().optional(),
  useTextContent: z.boolean().optional(),
  regex: z.string().optional(),
  prefixText: z.string().optional(),
  suffixText: z.string().optional(),
  attributes: z.array(z.string()).optional(),
  includeSelector: z.boolean().optional(),
});

export function validateGetElementDataBlock(data: unknown): GetElementDataBlock {
  return GetElementDataBlockSchema.parse(data);
}

export async function handlerGetElementData(
  data: GetElementDataBlock
): Promise<BlockResult<ElementData | ElementData[]>> {
  try {
    const {
      selector = '',
      includeText = true,
      includeTags = false,
      useTextContent = false,
      regex,
      prefixText = '',
      suffixText = '',
      attributes = [],
      includeSelector = false,
      findBy = 'cssSelector',
      option,
    } = data;

    if (!selector) {
      throw new Error('Selector is required for get-element-data block');
    }

    if (!includeText && attributes.length === 0) {
      throw new Error('Either includeText must be true or attributes must be provided');
    }

    const elements = await findElement({ selector, findBy, option });

    if (!elements) {
      return { data: Array.isArray(elements) ? [] : ({} as ElementData) };
    }

    const extractElementData = createElementDataExtractor(
      includeText,
      includeTags,
      useTextContent,
      regex,
      prefixText,
      suffixText,
      attributes,
      includeSelector
    );

    if (Array.isArray(elements)) {
      const elementsData = elements.map(extractElementData);
      return { data: elementsData };
    } else {
      const elementData = extractElementData(elements);
      return { data: elementData };
    }
  } catch (error) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error in get-element-data handler',
      data: {} as ElementData,
    };
  }
}

function createElementDataExtractor(
  includeText: boolean,
  includeTags: boolean,
  useTextContent: boolean,
  regex?: string,
  prefixText = '',
  suffixText = '',
  attributes: string[] = [],
  includeSelector: boolean = false
) {
  return (element: Element): ElementData => {
    const result: ElementData = {};

    // Extract text if requested
    if (includeText) {
      let text = '';

      if (includeTags) {
        text = (element as HTMLElement).innerHTML;
      } else {
        text = useTextContent
          ? element.textContent || ''
          : (element as HTMLElement).innerText || '';
      }

      // Apply regex filter if provided
      if (regex) {
        const regexPattern = new RegExp(regex, 'g');
        const matches = text.match(regexPattern);
        text = matches ? matches.join(' ') : '';
      }

      // Add prefix and suffix
      if (text.trim()) {
        text = prefixText + text.trim() + suffixText;
      }

      result.text = text;
    }

    // Extract attributes if requested
    if (attributes.length > 0) {
      result.attributes = {};
      attributes.forEach((attrName) => {
        result.attributes![attrName] = element.getAttribute(attrName);
      });
    }

    // Generate CSS selector if requested
    if (includeSelector) {
      result.selector = CSSSelectorGenerator.generate(element);
    }

    return result;
  };
}
