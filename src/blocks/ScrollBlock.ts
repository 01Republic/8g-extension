import z from 'zod';
import { Block, BlockResult, BaseBlockSchema } from './types';
import { findElement } from '@/content/elements';

export interface ScrollBlock extends Block {
  readonly name: 'scroll';
  scrollType?: 'toElement' | 'toBottom' | 'byDistance' | 'untilLoaded';
  distance?: number;
  behavior?: 'auto' | 'smooth';
  maxScrolls?: number;
  waitAfterScroll?: number;
}

export const ScrollBlockSchema = BaseBlockSchema.extend({
  name: z.literal('scroll'),
  scrollType: z.enum(['toElement', 'toBottom', 'byDistance', 'untilLoaded']).optional(),
  distance: z.number().optional(),
  behavior: z.enum(['auto', 'smooth']).optional(),
  maxScrolls: z.number().optional(),
  waitAfterScroll: z.number().optional(),
});

export function validateScrollBlock(data: unknown): ScrollBlock {
  return ScrollBlockSchema.parse(data);
}

export async function handlerScroll(data: ScrollBlock): Promise<BlockResult<boolean>> {
  try {
    const {
      selector = '',
      scrollType = 'toBottom',
      distance = 500,
      behavior = 'smooth',
      maxScrolls = 50,
      waitAfterScroll = 300,
      findBy = 'cssSelector',
      option,
    } = data;

    switch (scrollType) {
      case 'toElement':
        if (!selector) {
          throw new Error('Selector is required for toElement scroll type');
        }
        return await scrollToElement(selector, findBy, option, behavior);

      case 'toBottom':
        return await scrollToBottom(behavior, waitAfterScroll);

      case 'byDistance':
        return await scrollByDistance(distance, behavior);

      case 'untilLoaded':
        return await scrollUntilLoaded(maxScrolls, distance, behavior, waitAfterScroll);

      default:
        throw new Error(`Unknown scroll type: ${scrollType}`);
    }
  } catch (error) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error in scroll handler',
      data: false,
    };
  }
}

async function scrollToElement(
  selector: string,
  findBy: 'cssSelector' | 'xpath',
  option: any,
  behavior: 'auto' | 'smooth'
): Promise<BlockResult<boolean>> {
  const element = await findElement({ selector, findBy, option });

  if (!element) {
    return {
      hasError: true,
      message: 'Element not found for scrolling',
      data: false,
    };
  }

  const targetElement = Array.isArray(element) ? element[0] : element;
  (targetElement as HTMLElement).scrollIntoView({ behavior, block: 'center' });

  return { data: true };
}

async function scrollToBottom(
  behavior: 'auto' | 'smooth',
  waitAfterScroll: number
): Promise<BlockResult<boolean>> {
  let lastHeight = document.body.scrollHeight;
  let attempts = 0;
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior,
    });

    await new Promise((resolve) => setTimeout(resolve, waitAfterScroll));

    const newHeight = document.body.scrollHeight;
    if (newHeight === lastHeight) {
      // No more content loaded
      break;
    }

    lastHeight = newHeight;
    attempts++;
  }

  return { data: true };
}

async function scrollByDistance(
  distance: number,
  behavior: 'auto' | 'smooth'
): Promise<BlockResult<boolean>> {
  window.scrollBy({
    top: distance,
    behavior,
  });

  return { data: true };
}

async function scrollUntilLoaded(
  maxScrolls: number,
  distance: number,
  behavior: 'auto' | 'smooth',
  waitAfterScroll: number
): Promise<BlockResult<boolean>> {
  let scrollCount = 0;
  let lastHeight = document.body.scrollHeight;

  while (scrollCount < maxScrolls) {
    window.scrollBy({
      top: distance,
      behavior, // Use provided behavior
    });

    await new Promise((resolve) => setTimeout(resolve, waitAfterScroll));

    const newHeight = document.body.scrollHeight;

    // Check if we've reached the bottom
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;

    if (scrollTop + windowHeight >= newHeight - 10) {
      // We're at the bottom
      if (newHeight === lastHeight) {
        // No more content is being loaded
        break;
      }
    }

    lastHeight = newHeight;
    scrollCount++;
  }

  return { data: true };
}
