import z from 'zod';
import { Block, BlockResult } from '../types';
import { DOMProvider, KeyOptions } from '../dom';

export interface KeypressBlock extends Omit<Block, 'selector' | 'findBy' | 'option'> {
  readonly name: 'keypress';
  key: string; // 'Escape', 'Enter', 'ArrowDown', etc.
  code?: string; // Optional: 'Escape', 'Enter', etc.
  keyCode?: number; // Optional: 27 for Escape, 13 for Enter, etc.
  modifiers?: ('Alt' | 'Control' | 'Meta' | 'Shift')[];
  delay?: number; // Optional delay after keypress (ms)
  repeat?: number; // Optional number of times to repeat the keypress
}

export const KeypressBlockSchema = z.object({
  name: z.literal('keypress'),
  key: z.string(),
  code: z.string().optional(),
  keyCode: z.number().optional(),
  modifiers: z.array(z.enum(['Alt', 'Control', 'Meta', 'Shift'])).optional(),
  delay: z.number().min(0).optional(),
  repeat: z.number().min(1).optional().default(1),
});

export function validateKeypressBlock(data: unknown): KeypressBlock {
  return KeypressBlockSchema.parse(data);
}

export async function handlerKeypress(
  data: KeypressBlock,
  domProvider: DOMProvider
): Promise<BlockResult<boolean>> {
  try {
    const { key, code, keyCode, modifiers = [], delay, repeat = 1 } = data;

    // Check if keypress method is available on the DOMProvider
    if (!domProvider.keypress) {
      // Fallback to native keypress simulation
      console.warn('[KeypressBlock] Advanced keypress not supported in this environment, falling back to native simulation');
      await simulateKeypressFallback(key, code, keyCode, modifiers, delay, repeat);
      return { data: true };
    }

    // Prepare key options for DOMProvider
    const keyOptions: KeyOptions = {
      modifiers,
      delay,
      repeat,
    };

    // Use DOMProvider's keypress method
    await domProvider.keypress(key, keyOptions);

    return { data: true };
  } catch (error) {
    console.log(error);
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error in keypress handler',
      data: false,
    };
  }
}

// Fallback function for environments without advanced keypress support
async function simulateKeypressFallback(
  key: string,
  code?: string,
  keyCode?: number,
  modifiers: string[] = [],
  delay?: number,
  repeat: number = 1
): Promise<void> {
  for (let i = 0; i < repeat; i++) {
    // Use native KeyboardEvent dispatch
    const keydownEvent = new KeyboardEvent('keydown', {
      key,
      code: code || key,
      keyCode: keyCode || getKeyCodeFromKey(key),
      bubbles: true,
      cancelable: true,
      ...getModifierStates(modifiers),
    });

    const keyupEvent = new KeyboardEvent('keyup', {
      key,
      code: code || key,
      keyCode: keyCode || getKeyCodeFromKey(key),
      bubbles: true,
      cancelable: true,
      ...getModifierStates(modifiers),
    });

    document.dispatchEvent(keydownEvent);
    await new Promise((resolve) => setTimeout(resolve, 10));
    document.dispatchEvent(keyupEvent);

    // Add delay between repeats if specified
    if (delay && i < repeat - 1) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Small delay to ensure key press is processed
  await new Promise((resolve) => setTimeout(resolve, 50));
}

// Helper function to get keyCode from key string
function getKeyCodeFromKey(key: string): number {
  const keyCodeMap: Record<string, number> = {
    Escape: 27,
    Enter: 13,
    Tab: 9,
    Backspace: 8,
    Delete: 46,
    ArrowUp: 38,
    ArrowDown: 40,
    ArrowLeft: 37,
    ArrowRight: 39,
    Space: 32,
    ' ': 32,
    Home: 36,
    End: 35,
    PageUp: 33,
    PageDown: 34,
    Insert: 45,
    F1: 112,
    F2: 113,
    F3: 114,
    F4: 115,
    F5: 116,
    F6: 117,
    F7: 118,
    F8: 119,
    F9: 120,
    F10: 121,
    F11: 122,
    F12: 123,
  };

  // Handle single character keys
  if (key.length === 1) {
    return key.toUpperCase().charCodeAt(0);
  }

  return keyCodeMap[key] || 0;
}

// Helper function to convert modifiers array to modifier states
function getModifierStates(modifiers: string[]): {
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
} {
  return {
    altKey: modifiers.includes('Alt'),
    ctrlKey: modifiers.includes('Control'),
    metaKey: modifiers.includes('Meta'),
    shiftKey: modifiers.includes('Shift'),
  };
}