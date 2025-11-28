import z from 'zod';
import { Block, BlockResult, BaseBlockSchema } from './types';
import { DOMProvider } from '../dom/DOMProvider';

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

export async function handlerScroll(
  data: ScrollBlock,
  domProvider: DOMProvider
): Promise<BlockResult<boolean>> {
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
        return await scrollToElement(selector, findBy, option, behavior, domProvider);

      case 'toBottom':
        return await scrollToBottom(behavior, waitAfterScroll, domProvider);

      case 'byDistance':
        return await scrollByDistance(distance, behavior, domProvider);

      case 'untilLoaded':
        return await scrollUntilLoaded(maxScrolls, distance, behavior, waitAfterScroll, domProvider);

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
  behavior: 'auto' | 'smooth',
  domProvider: DOMProvider
): Promise<BlockResult<boolean>> {
  const element = await domProvider.findElement({ selector, findBy, option });

  if (!element) {
    return {
      hasError: true,
      message: 'Element not found for scrolling',
      data: false,
    };
  }

  const targetElement = Array.isArray(element) ? element[0] : element;
  
  // Use DOMProvider's scroll method to scroll to element
  await domProvider.scroll({ toElement: { selector, findBy, option } });

  return { data: true };
}

async function scrollToBottom(
  behavior: 'auto' | 'smooth',
  waitAfterScroll: number,
  domProvider: DOMProvider
): Promise<BlockResult<boolean>> {
  // Use DOMProvider's scroll method to scroll to bottom
  await domProvider.scroll({ toBottom: true });

  // Add wait time for content to load
  await new Promise((resolve) => setTimeout(resolve, waitAfterScroll));

  return { data: true };
}

async function scrollByDistance(
  distance: number,
  behavior: 'auto' | 'smooth',
  domProvider: DOMProvider
): Promise<BlockResult<boolean>> {
  // Use DOMProvider's scroll method to scroll by distance
  await domProvider.scroll({ byDistance: { x: 0, y: distance } });

  return { data: true };
}

async function scrollUntilLoaded(
  maxScrolls: number,
  distance: number,
  behavior: 'auto' | 'smooth',
  waitAfterScroll: number,
  domProvider: DOMProvider
): Promise<BlockResult<boolean>> {
  let scrollCount = 0;

  while (scrollCount < maxScrolls) {
    // Use DOMProvider's scroll method to scroll by distance
    await domProvider.scroll({ byDistance: { x: 0, y: distance } });

    await new Promise((resolve) => setTimeout(resolve, waitAfterScroll));

    scrollCount++;
  }

  return { data: true };
}