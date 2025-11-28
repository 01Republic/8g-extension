import z from 'zod';
import { Block, BlockResult, BaseBlockSchema } from './types';
import { DOMProvider } from '../dom/DOMProvider';

export interface ElementData {
  text?: string;
  attributes?: Record<string, string | null>;
  selector?: string; // 생성된 CSS 셀렉터
  xpath?: string; // 생성된 XPath
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
  // Selector generation options
  includeSelector?: boolean;
  includeXPath?: boolean;
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
  includeXPath: z.boolean().optional(),
});

export function validateGetElementDataBlock(data: unknown): GetElementDataBlock {
  return GetElementDataBlockSchema.parse(data);
}

export async function handlerGetElementData(
  data: GetElementDataBlock,
  domProvider: DOMProvider
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
      includeXPath = false,
      findBy = 'cssSelector',
      option,
    } = data;

    if (!selector) {
      throw new Error('Selector is required for get-element-data block');
    }

    if (!includeText && attributes.length === 0) {
      throw new Error('Either includeText must be true or attributes must be provided');
    }

    const elements = await domProvider.findElement({ selector, findBy, option });

    if (!elements) {
      return { data: Array.isArray(elements) ? [] : ({} as ElementData) };
    }

    const extractElementData = createElementDataExtractor(
      includeText,
      includeTags,
      useTextContent,
      regex,
      prefixText || '',
      suffixText || '',
      attributes || [],
      includeSelector || false,
      includeXPath || false,
      domProvider
    );

    if (Array.isArray(elements)) {
      const elementsData = await Promise.all(elements.map(extractElementData));
      return { data: elementsData };
    } else {
      const elementData = await extractElementData(elements);
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
  regex: string | undefined,
  prefixText: string,
  suffixText: string,
  attributes: string[],
  includeSelector: boolean,
  includeXPath: boolean,
  domProvider: DOMProvider
) {
  return async (element: Element): Promise<ElementData> => {
    const result: ElementData = {};

    // Extract text if requested
    if (includeText) {
      let text = '';

      if (includeTags) {
        // For HTML content, we use getAttribute to get innerHTML-like content
        text = await domProvider.getAttribute(element, 'innerHTML') || '';
      } else {
        // Use getText method from DOMProvider
        text = await domProvider.getText(element);
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

      for (const attrName of attributes) {
        // First check the element itself
        let attrValue = await domProvider.getAttribute(element, attrName);

        // If not found on parent, look for child elements with this attribute
        // This functionality might need DOMProvider to support querySelector
        // For now, we'll just use the main element's attribute
        if (!attrValue) {
          // If DOMProvider supports finding child elements, this could be enhanced
          // For now, we'll just set it to empty string if not found
          attrValue = '';
        }

        result.attributes![attrName] = attrValue;
      }
    }

    // Generate CSS selector if requested
    // Note: This functionality would need to be implemented in DOMProvider
    // or passed as a separate utility function
    if (includeSelector) {
      // This would need to be implemented in DOMProvider or as a utility
      // For now, leaving it undefined
      result.selector = undefined;
    }

    // Generate XPath if requested
    // Note: This functionality would need to be implemented in DOMProvider
    // or passed as a separate utility function
    if (includeXPath) {
      // This would need to be implemented in DOMProvider or as a utility
      // For now, leaving it undefined
      result.xpath = undefined;
    }

    return result;
  };
}