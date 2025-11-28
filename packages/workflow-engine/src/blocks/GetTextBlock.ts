import z from 'zod';
import { Block, BlockResult, BaseBlockSchema } from './types';
import { DOMProvider } from '../dom/DOMProvider';

export interface GetTextBlock extends Block {
  readonly name: 'get-text';
  includeTags?: boolean;
  useTextContent?: boolean;
  regex?: string;
  prefixText?: string;
  suffixText?: string;
  filterEmpty?: boolean;
  scrollToCollect?: boolean;
  scrollDistance?: number;
  scrollWaitMs?: number;
  maxScrollAttempts?: number;
}

export const GetTextBlockSchema = BaseBlockSchema.extend({
  name: z.literal('get-text'),
  includeTags: z.boolean().optional(),
  useTextContent: z.boolean().optional(),
  regex: z.string().optional(),
  prefixText: z.string().optional(),
  suffixText: z.string().optional(),
  filterEmpty: z.boolean().optional(),
  scrollToCollect: z.boolean().optional(),
  scrollDistance: z.number().optional(),
  scrollWaitMs: z.number().optional(),
  maxScrollAttempts: z.number().optional(),
});

export function validateGetTextBlock(data: unknown): GetTextBlock {
  return GetTextBlockSchema.parse(data);
}

export async function handlerGetText(
  data: GetTextBlock, 
  domProvider: DOMProvider
): Promise<BlockResult<string | string[]>> {
  try {
    const {
      selector = '',
      includeTags = false,
      useTextContent = false,
      regex,
      prefixText = '',
      suffixText = '',
      findBy = 'cssSelector',
      option,
      filterEmpty = true,
      scrollToCollect = false,
      scrollDistance = 500,
      scrollWaitMs = 300,
      maxScrollAttempts = 100,
    } = data;

    if (!selector) {
      throw new Error('Selector is required for get-text block');
    }

    // If scrollToCollect is enabled, collect data while scrolling
    if (scrollToCollect && option?.multiple) {
      return await collectWithScroll({
        selector,
        findBy,
        option,
        includeTags,
        useTextContent,
        regex,
        prefixText,
        suffixText,
        filterEmpty,
        scrollDistance,
        scrollWaitMs,
        maxScrollAttempts,
        domProvider,
      });
    }

    const elements = await domProvider.findElement({ selector, findBy, option });

    if (!elements) {
      return { data: '' };
    }

    const extractText = createTextExtractor(
      includeTags,
      useTextContent,
      regex,
      prefixText || '',
      suffixText || '',
      domProvider
    );

    if (Array.isArray(elements)) {
      const texts = await Promise.all(elements.map(extractText));
      const filteredTexts = filterEmpty ? texts.filter((text) => text.trim() !== '') : texts;
      return { data: filteredTexts };
    } else {
      const text = await extractText(elements);
      return { data: text };
    }
  } catch (error) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error in get-text handler',
      data: '',
    };
  }
}

async function collectWithScroll(params: {
  selector: string;
  findBy: 'cssSelector' | 'xpath';
  option: any;
  includeTags: boolean;
  useTextContent: boolean;
  regex?: string;
  prefixText: string;
  suffixText: string;
  filterEmpty: boolean;
  scrollDistance: number;
  scrollWaitMs: number;
  maxScrollAttempts: number;
  domProvider: DOMProvider;
}): Promise<BlockResult<string[]>> {
  const {
    selector,
    findBy,
    option,
    includeTags,
    useTextContent,
    regex,
    prefixText,
    suffixText,
    filterEmpty,
    scrollDistance,
    scrollWaitMs,
    maxScrollAttempts,
    domProvider,
  } = params;

  const extractText = createTextExtractor(
    includeTags,
    useTextContent,
    regex,
    prefixText || '',
    suffixText || '',
    domProvider
  );
  const collectedTexts = new Set<string>();
  let scrollAttempts = 0;
  let consecutiveNoNewData = 0;
  const maxConsecutiveNoNewData = 5;

  while (scrollAttempts < maxScrollAttempts) {
    // Collect current visible elements
    const elements = await domProvider.findElement({ selector, findBy, option });

    if (elements && Array.isArray(elements)) {
      const beforeSize = collectedTexts.size;

      for (const element of elements) {
        const text = await extractText(element);
        if (!filterEmpty || text.trim() !== '') {
          collectedTexts.add(text);
        }
      }

      const afterSize = collectedTexts.size;

      // Check if we're still collecting new data
      if (afterSize === beforeSize) {
        consecutiveNoNewData++;
        if (consecutiveNoNewData >= maxConsecutiveNoNewData) {
          // No new data for multiple scrolls, likely reached the end
          break;
        }
      } else {
        consecutiveNoNewData = 0;
      }
    }

    // Scroll down using DOMProvider
    await domProvider.scroll({ byDistance: { x: 0, y: scrollDistance } });
    await new Promise((resolve) => setTimeout(resolve, scrollWaitMs));

    scrollAttempts++;
  }

  return { data: Array.from(collectedTexts) };
}

function createTextExtractor(
  includeTags: boolean,
  useTextContent: boolean,
  regex: string | undefined,
  prefixText: string,
  suffixText: string,
  domProvider: DOMProvider
) {
  return async (element: Element): Promise<string> => {
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

    return text;
  };
}