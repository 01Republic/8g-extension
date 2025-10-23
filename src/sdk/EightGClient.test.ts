/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { EightGClient } from './EightGClient';
import { ExecutionContext } from './types';

describe('EightGClient Context Helper Functions', () => {
  describe('getFromContext', () => {
    it('should get step result data by path', () => {
      const context: ExecutionContext = {
        steps: {
          getProducts: {
            result: { data: [{ id: 1, name: 'Apple' }, { id: 2, name: 'Banana' }] },
            success: true,
            skipped: false,
          },
        },
        vars: {},
      };

      const data = EightGClient.getFromContext(context, 'steps.getProducts.result.data');
      expect(data).toEqual([{ id: 1, name: 'Apple' }, { id: 2, name: 'Banana' }]);
    });

    it('should get var by path', () => {
      const context: ExecutionContext = {
        steps: {},
        vars: {
          userId: '12345',
          apiKey: 'sk-test',
        },
      };

      const userId = EightGClient.getFromContext(context, 'vars.userId');
      expect(userId).toBe('12345');
    });

    it('should get forEach item by path', () => {
      const context: ExecutionContext = {
        steps: {},
        vars: {},
        forEach: {
          item: { id: 1, name: 'Apple' },
          index: 0,
          total: 5,
        },
      };

      const item = EightGClient.getFromContext(context, 'forEach.item');
      expect(item).toEqual({ id: 1, name: 'Apple' });

      const index = EightGClient.getFromContext(context, 'forEach.index');
      expect(index).toBe(0);
    });

    it('should get loop context by path', () => {
      const context: ExecutionContext = {
        steps: {},
        vars: {},
        loop: {
          index: 3,
          count: 10,
        },
      };

      const index = EightGClient.getFromContext(context, 'loop.index');
      expect(index).toBe(3);

      const count = EightGClient.getFromContext(context, 'loop.count');
      expect(count).toBe(10);
    });

    it('should return undefined for non-existent path', () => {
      const context: ExecutionContext = {
        steps: {},
        vars: {},
      };

      const result = EightGClient.getFromContext(context, 'steps.nonExistent.result.data');
      expect(result).toBeUndefined();
    });

    it('should handle nested object access', () => {
      const context: ExecutionContext = {
        steps: {
          fetchUser: {
            result: {
              data: {
                user: {
                  profile: {
                    name: 'John Doe',
                    age: 30,
                  },
                },
              },
            },
            success: true,
            skipped: false,
          },
        },
        vars: {},
      };

      const name = EightGClient.getFromContext(context, 'steps.fetchUser.result.data.user.profile.name');
      expect(name).toBe('John Doe');
    });
  });

  describe('getStepResult', () => {
    it('should get step result by stepId', () => {
      const context: ExecutionContext = {
        steps: {
          getProducts: {
            result: { data: [{ id: 1, name: 'Apple' }] },
            success: true,
            skipped: false,
          },
        },
        vars: {},
      };

      const stepResult = EightGClient.getStepResult(context, 'getProducts');
      expect(stepResult).toEqual({
        result: { data: [{ id: 1, name: 'Apple' }] },
        success: true,
        skipped: false,
      });
    });

    it('should return undefined for non-existent step', () => {
      const context: ExecutionContext = {
        steps: {},
        vars: {},
      };

      const stepResult = EightGClient.getStepResult(context, 'nonExistent');
      expect(stepResult).toBeUndefined();
    });

    it('should access step properties', () => {
      const context: ExecutionContext = {
        steps: {
          checkStatus: {
            result: { data: 'OK' },
            success: true,
            skipped: false,
          },
        },
        vars: {},
      };

      const stepResult = EightGClient.getStepResult(context, 'checkStatus');
      expect(stepResult.success).toBe(true);
      expect(stepResult.skipped).toBe(false);
      expect(stepResult.result.data).toBe('OK');
    });
  });

  describe('getStepData', () => {
    it('should get step data directly', () => {
      const context: ExecutionContext = {
        steps: {
          getProducts: {
            result: { data: [{ id: 1, name: 'Apple' }, { id: 2, name: 'Banana' }] },
            success: true,
            skipped: false,
          },
        },
        vars: {},
      };

      const data = EightGClient.getStepData(context, 'getProducts');
      expect(data).toEqual([{ id: 1, name: 'Apple' }, { id: 2, name: 'Banana' }]);
    });

    it('should return undefined for non-existent step', () => {
      const context: ExecutionContext = {
        steps: {},
        vars: {},
      };

      const data = EightGClient.getStepData(context, 'nonExistent');
      expect(data).toBeUndefined();
    });

    it('should handle various data types', () => {
      const context: ExecutionContext = {
        steps: {
          getString: {
            result: { data: 'Hello World' },
            success: true,
            skipped: false,
          },
          getNumber: {
            result: { data: 42 },
            success: true,
            skipped: false,
          },
          getBoolean: {
            result: { data: true },
            success: true,
            skipped: false,
          },
          getNull: {
            result: { data: null },
            success: true,
            skipped: false,
          },
        },
        vars: {},
      };

      expect(EightGClient.getStepData(context, 'getString')).toBe('Hello World');
      expect(EightGClient.getStepData(context, 'getNumber')).toBe(42);
      expect(EightGClient.getStepData(context, 'getBoolean')).toBe(true);
      expect(EightGClient.getStepData(context, 'getNull')).toBeNull();
    });
  });

  describe('getVar', () => {
    it('should get variable by key', () => {
      const context: ExecutionContext = {
        steps: {},
        vars: {
          userId: '12345',
          apiKey: 'sk-test',
          baseUrl: 'https://api.example.com',
        },
      };

      expect(EightGClient.getVar(context, 'userId')).toBe('12345');
      expect(EightGClient.getVar(context, 'apiKey')).toBe('sk-test');
      expect(EightGClient.getVar(context, 'baseUrl')).toBe('https://api.example.com');
    });

    it('should return undefined for non-existent variable', () => {
      const context: ExecutionContext = {
        steps: {},
        vars: {},
      };

      const value = EightGClient.getVar(context, 'nonExistent');
      expect(value).toBeUndefined();
    });

    it('should handle various variable types', () => {
      const context: ExecutionContext = {
        steps: {},
        vars: {
          stringVar: 'hello',
          numberVar: 123,
          booleanVar: true,
          objectVar: { key: 'value' },
          arrayVar: [1, 2, 3],
          nullVar: null,
        },
      };

      expect(EightGClient.getVar(context, 'stringVar')).toBe('hello');
      expect(EightGClient.getVar(context, 'numberVar')).toBe(123);
      expect(EightGClient.getVar(context, 'booleanVar')).toBe(true);
      expect(EightGClient.getVar(context, 'objectVar')).toEqual({ key: 'value' });
      expect(EightGClient.getVar(context, 'arrayVar')).toEqual([1, 2, 3]);
      expect(EightGClient.getVar(context, 'nullVar')).toBeNull();
    });
  });

  describe('Integration scenarios', () => {
    it('should work with realistic workflow result', () => {
      const context: ExecutionContext = {
        steps: {
          getProducts: {
            result: {
              data: [
                { id: 1, name: 'Apple', price: 150 },
                { id: 2, name: 'Banana', price: 50 },
              ],
            },
            success: true,
            skipped: false,
          },
          filterExpensive: {
            result: {
              data: [{ id: 1, name: 'Apple', price: 150 }],
            },
            success: true,
            skipped: false,
          },
          calculateTotal: {
            result: { data: 150 },
            success: true,
            skipped: false,
          },
        },
        vars: {
          minPrice: 100,
          userId: 'user123',
        },
      };

      // Get original products
      const products = EightGClient.getStepData(context, 'getProducts');
      expect(products).toHaveLength(2);

      // Get filtered products
      const expensive = EightGClient.getStepData(context, 'filterExpensive');
      expect(expensive).toHaveLength(1);
      expect(expensive[0].name).toBe('Apple');

      // Get total
      const total = EightGClient.getStepData(context, 'calculateTotal');
      expect(total).toBe(150);

      // Get vars
      const minPrice = EightGClient.getVar(context, 'minPrice');
      expect(minPrice).toBe(100);

      // Use getFromContext for deep access
      const firstProductName = EightGClient.getFromContext(
        context,
        'steps.getProducts.result.data.0.name'
      );
      expect(firstProductName).toBe('Apple');
    });
  });
});
