import z from 'zod';
import { Block, BlockResult, BaseBlockSchema } from './types';
import { findElement } from '@/content/elements';

export interface EventClickBlock extends Block {
  readonly name: 'event-click';
}

export const EventClickBlockSchema = BaseBlockSchema.extend({
  name: z.literal('event-click'),
});

export function validateEventClickBlock(data: unknown): EventClickBlock {
  return EventClickBlockSchema.parse(data);
}

export async function handlerEventClick(data: EventClickBlock): Promise<BlockResult<boolean>> {
  try {
    const { selector = '', findBy = 'cssSelector', option } = data;

    if (!selector) {
      throw new Error('Selector is required for event-click block');
    }

    const element = (await findElement({ selector, findBy, option })) as HTMLElement;

    if (!element) {
      throw new Error('Element not found for clicking');
    }

    simulateClickElement(element);

    return { data: true };
  } catch (error) {
    console.log(error);
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error in event-click handler',
      data: false,
    };
  }
}

function simulateClickElement(element: HTMLElement): void {
  // Simulate realistic mouse events
  const mouseEvents = [
    new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      button: 0,
    }),
    new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
      button: 0,
    }),
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      button: 0,
    }),
  ];

  mouseEvents.forEach((event) => {
    element.dispatchEvent(event);
  });

  // Also try the native click method
  if (element.click) {
    element.click();
  }
}
