import z from 'zod';
import { Block, BlockResult, BaseBlockSchema } from './types';
import { findElement } from '@/content/elements';

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

export async function handlerGetText(data: GetTextBlock): Promise<BlockResult<string | string[]>> {
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
      });
    }

    const elements = await findElement({ selector, findBy, option });

    if (!elements) {
      return { data: '' };
    }

    const extractText = createTextExtractor(
      includeTags,
      useTextContent,
      regex,
      prefixText,
      suffixText
    );

    if (Array.isArray(elements)) {
      const texts = elements.map(extractText);
      const filteredTexts = filterEmpty ? texts.filter((text) => text.trim() !== '') : texts;
      return { data: filteredTexts };
    } else {
      const text = extractText(elements);
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
  } = params;

  const extractText = createTextExtractor(includeTags, useTextContent, regex, prefixText, suffixText);
  const collectedTexts = new Set<string>();
  let scrollAttempts = 0;
  let consecutiveNoNewData = 0;
  const maxConsecutiveNoNewData = 5;

  while (scrollAttempts < maxScrollAttempts) {
    // Collect current visible elements
    const elements = await findElement({ selector, findBy, option });
    
    if (elements && Array.isArray(elements)) {
      const beforeSize = collectedTexts.size;
      
      elements.forEach((element) => {
        const text = extractText(element);
        if (!filterEmpty || text.trim() !== '') {
          collectedTexts.add(text);
        }
      });

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

    // Scroll down
    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    window.scrollBy({ top: scrollDistance, behavior: 'auto' });
    await new Promise((resolve) => setTimeout(resolve, scrollWaitMs));
    
    const newScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Check if we can't scroll anymore (reached bottom)
    if (newScrollTop === currentScrollTop) {
      break;
    }

    scrollAttempts++;
  }

  return { data: Array.from(collectedTexts) };
}

function createTextExtractor(
  includeTags: boolean,
  useTextContent: boolean,
  regex?: string,
  prefixText = '',
  suffixText = ''
) {
  return (element: Element): string => {
    let text = '';

    if (includeTags) {
      text = (element as HTMLElement).innerHTML;
    } else {
      text = useTextContent ? element.textContent || '' : (element as HTMLElement).innerText || '';
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
