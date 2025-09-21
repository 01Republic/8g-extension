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
}

export const GetTextBlockSchema = BaseBlockSchema.extend({
  name: z.literal('get-text'),
  includeTags: z.boolean().optional(),
  useTextContent: z.boolean().optional(),
  regex: z.string().optional(),
  prefixText: z.string().optional(),
  suffixText: z.string().optional(),
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
    } = data;

    if (!selector) {
      throw new Error('Selector is required for get-text block');
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
      const texts = elements.map(extractText).filter((text) => text.trim() !== '');
      return { data: texts };
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
