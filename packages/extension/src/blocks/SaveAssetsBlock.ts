import { findElement } from '@/content/elements';
import { Block, BlockResult, BaseBlockSchema } from './types';
import z from 'zod';

export interface SaveAssetsBlock extends Block {
  readonly name: 'save-assets';
}

export const SaveAssetsBlockSchema = BaseBlockSchema.extend({
  name: z.literal('save-assets'),
});

export function validateSaveAssetsBlock(data: unknown): SaveAssetsBlock {
  return SaveAssetsBlockSchema.parse(data);
}

export async function handlerSaveAssets(
  data: SaveAssetsBlock
): Promise<BlockResult<string[] | null>> {
  try {
    const { selector = 'img, audio, video, source', findBy = 'cssSelector', option } = data;

    const elements = await findElement({ selector, findBy, option });

    if (!elements || !Array.isArray(elements)) {
      return { data: [] };
    }

    const assetUrls: string[] = [];

    elements.forEach((element: Element) => {
      let src = '';

      if (
        element instanceof HTMLImageElement ||
        element instanceof HTMLAudioElement ||
        element instanceof HTMLVideoElement ||
        element instanceof HTMLSourceElement
      ) {
        src = element.src;
      }

      if (src && !assetUrls.includes(src)) {
        assetUrls.push(src);
      }
    });

    return { data: assetUrls };
  } catch (error) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error in save-assets handler',
      data: null,
    };
  }
}
