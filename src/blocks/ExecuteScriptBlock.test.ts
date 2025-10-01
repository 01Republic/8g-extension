import { describe, it, expect } from 'vitest';
import { handlerExecuteScript, validateExecuteScriptBlock } from './ExecuteScriptBlock';

describe('ExecuteScriptBlock', () => {
  describe('validateExecuteScriptBlock', () => {
    it('should validate a valid execute-script block', () => {
      const block = {
        name: 'execute-script',
        selector: '',
        findBy: 'cssSelector' as const,
        option: {},
        script: 'const result = 1 + 1;',
      };

      expect(() => validateExecuteScriptBlock(block)).not.toThrow();
    });

    it('should throw error for invalid block name', () => {
      const block = {
        name: 'invalid-name',
        selector: '',
        findBy: 'cssSelector' as const,
        option: {},
        script: 'const result = 1 + 1;',
      };

      expect(() => validateExecuteScriptBlock(block)).toThrow();
    });
  });

  describe('handlerExecuteScript', () => {
    it('should execute simple script and return result', async () => {
      const block = {
        name: 'execute-script' as const,
        selector: '',
        findBy: 'cssSelector' as const,
        option: {},
        script: 'const result = 1 + 1;',
      };

      const response = await handlerExecuteScript(block);

      expect(response.hasError).toBeUndefined();
      expect(response.data).toBe(2);
    });

    it('should execute script with context data', async () => {
      const block = {
        name: 'execute-script' as const,
        selector: '',
        findBy: 'cssSelector' as const,
        option: {},
        script: `
          const result = {
            id: data.id,
            name: data.name,
            fullName: data.id + ' - ' + data.name
          };
        `,
        context: {
          data: { id: '123', name: 'Test Name' },
        },
      };

      const response = await handlerExecuteScript(block);

      expect(response.hasError).toBeUndefined();
      expect(response.data).toEqual({
        id: '123',
        name: 'Test Name',
        fullName: '123 - Test Name',
      });
    });

    it('should parse JSON from text', async () => {
      const block = {
        name: 'execute-script' as const,
        selector: '',
        findBy: 'cssSelector' as const,
        option: {},
        script: `
          const match = text.match(/id:\\s*"([^"]+)".*name:\\s*"([^"]+)"/);
          const result = match ? { id: match[1], name: match[2] } : null;
        `,
        context: {
          text: 'id: "user123" name: "John Doe"',
        },
      };

      const response = await handlerExecuteScript(block);

      expect(response.hasError).toBeUndefined();
      expect(response.data).toEqual({ id: 'user123', name: 'John Doe' });
    });

    it('should handle array transformation', async () => {
      const block = {
        name: 'execute-script' as const,
        selector: '',
        findBy: 'cssSelector' as const,
        option: {},
        script: `
          const result = items.map(item => ({
            id: item.id,
            displayName: item.name.toUpperCase()
          }));
        `,
        context: {
          items: [
            { id: 1, name: 'apple' },
            { id: 2, name: 'banana' },
          ],
        },
      };

      const response = await handlerExecuteScript(block);

      expect(response.hasError).toBeUndefined();
      expect(response.data).toEqual([
        { id: 1, displayName: 'APPLE' },
        { id: 2, displayName: 'BANANA' },
      ]);
    });

    it('should use custom return variable', async () => {
      const block = {
        name: 'execute-script' as const,
        selector: '',
        findBy: 'cssSelector' as const,
        option: {},
        script: `
          const output = { customValue: 42 };
        `,
        returnVariable: 'output',
      };

      const response = await handlerExecuteScript(block);

      expect(response.hasError).toBeUndefined();
      expect(response.data).toEqual({ customValue: 42 });
    });

    it('should handle errors in script execution', async () => {
      const block = {
        name: 'execute-script' as const,
        selector: '',
        findBy: 'cssSelector' as const,
        option: {},
        script: 'const result = undefinedVariable.someMethod();',
      };

      const response = await handlerExecuteScript(block);

      expect(response.hasError).toBe(true);
      expect(response.message).toBeDefined();
      expect(response.data).toBeNull();
    });

    it('should return error when script is empty', async () => {
      const block = {
        name: 'execute-script' as const,
        selector: '',
        findBy: 'cssSelector' as const,
        option: {},
        script: '',
      };

      const response = await handlerExecuteScript(block);

      expect(response.hasError).toBe(true);
      expect(response.message).toBe('Script is required for execute-script block');
    });

    it('should handle complex JSON transformation', async () => {
      const block = {
        name: 'execute-script' as const,
        selector: '',
        findBy: 'cssSelector' as const,
        option: {},
        script: `
          // div에서 추출한 데이터를 가공
          const result = {
            id: elementData.attributes.id,
            name: elementData.attributes['data-name'],
            text: elementData.text.trim(),
            metadata: {
              selector: elementData.selector,
              hasChildren: elementData.text.includes('child')
            }
          };
        `,
        context: {
          elementData: {
            text: 'Some text with child elements',
            attributes: {
              id: 'div-123',
              'data-name': 'Main Div',
            },
            selector: 'div#div-123',
          },
        },
      };

      const response = await handlerExecuteScript(block);

      expect(response.hasError).toBeUndefined();
      expect(response.data).toEqual({
        id: 'div-123',
        name: 'Main Div',
        text: 'Some text with child elements',
        metadata: {
          selector: 'div#div-123',
          hasChildren: true,
        },
      });
    });
  });
});

