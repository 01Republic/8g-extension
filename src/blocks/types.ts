import { z } from 'zod';

export interface Block {
  name: string;
  selector: string;
  findBy: 'cssSelector' | 'xpath';
  option: {
    waitForSelector?: boolean;
    waitSelectorTimeout?: number;
    multiple?: boolean;
  };
}

export interface BlockResult<T = any> {
  data?: T;
  hasError?: boolean;
  message?: string;
}

export const BaseBlockSchema = z.object({
  name: z.string(),
  selector: z.string(),
  findBy: z.enum(['cssSelector', 'xpath']),
  option: z.object({
    waitForSelector: z.boolean().optional(),
    waitSelectorTimeout: z.number().optional(),
    multiple: z.boolean().optional(),
  }),
});
