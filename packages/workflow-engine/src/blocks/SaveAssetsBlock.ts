import z from 'zod';
import { Block, BlockResult } from '../types';
import { DOMProvider, SelectorData, SaveOptions } from '../dom';

export interface SaveAssetsBlock extends Block {
  readonly name: 'save-assets';
  saveOptions?: SaveOptions; // Options for saving assets
  extractUrls?: boolean; // Whether to extract URLs instead of downloading (default: false)
}

export const SaveAssetsBlockSchema = z.object({
  name: z.literal('save-assets'),
  selector: z.string().optional().default('img, audio, video, source'),
  findBy: z.enum(['cssSelector', 'xpath']).optional().default('cssSelector'),
  option: z.object({
    waitForSelector: z.boolean().optional(),
    waitSelectorTimeout: z.number().optional(),
    multiple: z.boolean().optional().default(true),
    markEl: z.boolean().optional(),
  }).optional(),
  saveOptions: z.object({
    filename: z.string().optional(),
    dataType: z.enum(['json', 'csv', 'text', 'binary']).optional(),
    overwrite: z.boolean().optional(),
  }).optional(),
  extractUrls: z.boolean().optional().default(false),
});

export function validateSaveAssetsBlock(data: unknown): SaveAssetsBlock {
  return SaveAssetsBlockSchema.parse(data) as SaveAssetsBlock;
}

export async function handlerSaveAssets(
  data: SaveAssetsBlock,
  domProvider: DOMProvider
): Promise<BlockResult<string[] | null>> {
  try {
    const { selector = 'img, audio, video, source', findBy = 'cssSelector', option, saveOptions, extractUrls = false } = data;

    const selectorData: SelectorData = { selector, findBy, option };
    const elements = await domProvider.findElement(selectorData);

    if (!elements) {
      return { data: [] };
    }

    const elementArray = Array.isArray(elements) ? elements : [elements];
    const assetUrls: string[] = [];
    const savedAssets: string[] = [];

    for (const element of elementArray) {
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

        // If not just extracting URLs, try to save the asset
        if (!extractUrls) {
          // Check if saveAsset method is available on the DOMProvider
          if (!domProvider.saveAsset) {
            console.warn('[SaveAssetsBlock] Asset saving is not supported in this environment, falling back to URL extraction');
            continue;
          }

          try {
            // Fetch the asset data
            const response = await fetch(src);
            if (!response.ok) {
              console.warn(`[SaveAssetsBlock] Failed to fetch asset: ${src}`);
              continue;
            }

            const arrayBuffer = await response.arrayBuffer();
            const filename = saveOptions?.filename || src.split('/').pop() || 'asset';

            await domProvider.saveAsset(arrayBuffer, {
              filename,
              dataType: 'binary',
              overwrite: saveOptions?.overwrite,
            });

            savedAssets.push(src);
            console.log(`[SaveAssetsBlock] Saved asset: ${filename}`);
          } catch (error) {
            console.error(`[SaveAssetsBlock] Failed to save asset ${src}:`, error);
            // Continue with next asset instead of failing entirely
          }
        }
      }
    }

    const resultData = extractUrls ? assetUrls : savedAssets;
    return { data: resultData };
  } catch (error) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error in save-assets handler',
      data: null,
    };
  }
}