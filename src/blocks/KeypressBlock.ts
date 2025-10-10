import z from 'zod';
import { Block, BlockResult } from './types';

export interface KeypressBlock  extends Omit<Block, 'selector' | 'findBy' | 'option'> {
  readonly name: 'keypress';
  key: string; // 'Escape', 'Enter', 'ArrowDown', etc.
  code?: string; // Optional: 'Escape', 'Enter', etc.
  keyCode?: number; // Optional: 27 for Escape, 13 for Enter, etc.
  modifiers?: ('Alt' | 'Control' | 'Meta' | 'Shift')[];
}

export const KeypressBlockSchema = z.object({
  name: z.literal('keypress'),
  key: z.string(),
  code: z.string().optional(),
  keyCode: z.number().optional(),
  modifiers: z.array(z.enum(['Alt', 'Control', 'Meta', 'Shift'])).optional(),
});

export function validateKeypressBlock(data: unknown): KeypressBlock {
  return KeypressBlockSchema.parse(data);
}

export async function handlerKeypress(data: KeypressBlock): Promise<BlockResult<boolean>> {
  try {
    const { key, code, keyCode, modifiers = [] } = data;

    await simulateKeypress(key, code, keyCode, modifiers);

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

async function simulateKeypress(
  key: string,
  code?: string,
  keyCode?: number,
  modifiers: string[] = []
): Promise<void> {
  // Use CDP to press key via background service (isTrusted: true)
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'CDP_KEYPRESS',
      data: {
        key,
        code: code || key,
        keyCode: keyCode || getKeyCodeFromKey(key),
        modifiers,
      },
    });
    
    if (response && !response.$isError) {
      console.log('[Keypress] CDP keypress successful:', response);
    } else {
      throw new Error(response?.message || 'CDP keypress failed');
    }
  } catch (error) {
    console.error('[Keypress] CDP keypress failed, falling back to native dispatch:', error);
    
    // Fallback: Use native KeyboardEvent dispatch
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
    await new Promise(resolve => setTimeout(resolve, 10));
    document.dispatchEvent(keyupEvent);
  }
  
  // Small delay to ensure key press is processed
  await new Promise(resolve => setTimeout(resolve, 50));
}

// Helper function to get keyCode from key string
function getKeyCodeFromKey(key: string): number {
  const keyCodeMap: Record<string, number> = {
    'Escape': 27,
    'Enter': 13,
    'Tab': 9,
    'Backspace': 8,
    'Delete': 46,
    'ArrowUp': 38,
    'ArrowDown': 40,
    'ArrowLeft': 37,
    'ArrowRight': 39,
    'Space': 32,
    ' ': 32,
  };
  
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

