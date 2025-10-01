import { describe, it, expect } from 'vitest';
import { handlerExecuteScript, validateExecuteScriptBlock } from './ExecuteScriptBlock';

describe('ExecuteScriptBlock', () => {
  describe('validateExecuteScriptBlock', () => {
    it('should validate a valid execute-script block with string script', () => {
      const block = {
        name: 'execute-script',
        script: 'const result = 1 + 1;',
      };

      const result = validateExecuteScriptBlock(block);
      expect(result).toBeDefined();
      expect(result.name).toBe('execute-script');
    });

    it('should validate a valid execute-script block with array script', () => {
      const block = {
        name: 'execute-script',
        script: [
          'const a = 1;',
          'const b = 2;',
          'const result = a + b;',
        ],
      };

      const result = validateExecuteScriptBlock(block);
      expect(result).toBeDefined();
      expect(result.script).toEqual(['const a = 1;', 'const b = 2;', 'const result = a + b;']);
    });

    it('should throw error for invalid block name', () => {
      const block = {
        name: 'invalid-name',
        script: 'const result = 1 + 1;',
      };

      expect(() => validateExecuteScriptBlock(block)).toThrow();
    });
  });

  describe('handlerExecuteScript', () => {
    it('should execute simple script and return result', async () => {
      const block = {
        name: 'execute-script' as const,
        script: 'const result = 1 + 1;',
      };

      const response = await handlerExecuteScript(block);

      expect(response.hasError).toBeUndefined();
      expect(response.data).toBe(2);
    });

    it('should execute script array (multiline)', async () => {
      const block = {
        name: 'execute-script' as const,
        script: [
          'const a = 10;',
          'const b = 20;',
          'const result = a + b;',
        ],
      };

      const response = await handlerExecuteScript(block);

      expect(response.hasError).toBeUndefined();
      expect(response.data).toBe(30);
    });

    it('should execute script with context data', async () => {
      const block = {
        name: 'execute-script' as const,
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

    it('should parse workflow result array', async () => {
      const block = {
        name: 'execute-script' as const,
        script: [
          'const result = data',
          '  .filter(item => item.attributes.id !== null)',
          '  .map(item => ({',
          '    elementId: item.attributes.id,',
          '    elementText: item.text',
          '  }));',
        ],
        context: {
          data: [
            { text: '01Republic', attributes: { id: '01republic' } },
            { text: 'kerrys', attributes: { id: 'kerryshq' } },
            { text: '', attributes: { id: null } },
          ],
        },
      };

      const response = await handlerExecuteScript(block);

      expect(response.hasError).toBeUndefined();
      expect(response.data).toEqual([
        { elementId: '01republic', elementText: '01Republic' },
        { elementId: 'kerryshq', elementText: 'kerrys' },
      ]);
    });

    it('should handle complex data transformation', async () => {
      const block = {
        name: 'execute-script' as const,
        script: `
          const result = items.map(item => ({
            id: item.id,
            displayName: item.name.toUpperCase(),
            metadata: {
              length: item.name.length,
              hasSpace: item.name.includes(' ')
            }
          }));
        `,
        context: {
          items: [
            { id: 1, name: 'apple' },
            { id: 2, name: 'banana split' },
          ],
        },
      };

      const response = await handlerExecuteScript(block);

      expect(response.hasError).toBeUndefined();
      expect(response.data).toEqual([
        { id: 1, displayName: 'APPLE', metadata: { length: 5, hasSpace: false } },
        { id: 2, displayName: 'BANANA SPLIT', metadata: { length: 12, hasSpace: true } },
      ]);
    });

    it('should use custom return variable', async () => {
      const block = {
        name: 'execute-script' as const,
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
        script: '',
      };

      const response = await handlerExecuteScript(block);

      expect(response.hasError).toBe(true);
      expect(response.message).toBe('Script is required for execute-script block');
    });

    it('should handle array methods and filtering', async () => {
      const block = {
        name: 'execute-script' as const,
        script: [
          '// Filter and transform array',
          'const filtered = items.filter(x => x.score > 50);',
          'const result = filtered.map(x => x.name);',
        ],
        context: {
          items: [
            { name: 'Alice', score: 80 },
            { name: 'Bob', score: 45 },
            { name: 'Charlie', score: 90 },
          ],
        },
      };

      const response = await handlerExecuteScript(block);

      expect(response.hasError).toBeUndefined();
      expect(response.data).toEqual(['Alice', 'Charlie']);
    });

    it('should support JSON.parse and JSON.stringify', async () => {
      const block = {
        name: 'execute-script' as const,
        script: `
          const parsed = JSON.parse(jsonStr);
          const result = {
            ...parsed,
            processed: true,
            timestamp: new Date().toISOString()
          };
        `,
        context: {
          jsonStr: '{"id":"123","name":"Test"}',
        },
      };

      const response = await handlerExecuteScript(block);

      expect(response.hasError).toBeUndefined();
      expect(response.data.id).toBe('123');
      expect(response.data.name).toBe('Test');
      expect(response.data.processed).toBe(true);
      expect(response.data.timestamp).toBeDefined();
    });
  });
});

