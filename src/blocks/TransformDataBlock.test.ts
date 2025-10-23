/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { handlerTransformData, validateTransformDataBlock, TransformDataBlock } from './TransformDataBlock';

describe('TransformDataBlock', () => {
  describe('validateTransformDataBlock', () => {
    it('should validate a valid transform-data block', () => {
      const block: TransformDataBlock = {
        name: 'transform-data',
        sourceData: { items: [{ price: 100 }, { price: 200 }] },
        expression: '$sum(items.price)',
      };

      expect(() => validateTransformDataBlock(block)).not.toThrow();
    });

    it('should throw error if expression is missing', () => {
      const block = {
        name: 'transform-data',
        sourceData: {},
      };

      expect(() => validateTransformDataBlock(block)).toThrow();
    });

    it('should throw error if expression is empty string', () => {
      const block = {
        name: 'transform-data',
        sourceData: {},
        expression: '',
      };

      expect(() => validateTransformDataBlock(block)).toThrow('JSONata expression is required');
    });
  });

  describe('handlerTransformData', () => {
    it('should transform data with simple JSONata expression', async () => {
      const block: TransformDataBlock = {
        name: 'transform-data',
        sourceData: { value: 10 },
        expression: 'value * 2',
      };

      const result = await handlerTransformData(block);

      expect(result.hasError).toBeUndefined();
      expect(result.data).toBe(20);
    });

    it('should sum array values', async () => {
      const block: TransformDataBlock = {
        name: 'transform-data',
        sourceData: { items: [{ price: 100 }, { price: 200 }, { price: 300 }] },
        expression: '$sum(items.price)',
      };

      const result = await handlerTransformData(block);

      expect(result.hasError).toBeUndefined();
      expect(result.data).toBe(600);
    });

    it('should filter and transform array', async () => {
      const block: TransformDataBlock = {
        name: 'transform-data',
        sourceData: {
          products: [
            { name: 'Apple', price: 150 },
            { name: 'Banana', price: 50 },
            { name: 'Orange', price: 120 },
          ],
        },
        expression: 'products[price > 100]',
      };

      const result = await handlerTransformData(block);

      expect(result.hasError).toBeUndefined();
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('Apple');
      expect(result.data[1].name).toBe('Orange');
    });

    it('should handle conditional expressions', async () => {
      const block: TransformDataBlock = {
        name: 'transform-data',
        sourceData: { count: 15 },
        expression: 'count > 10 ? "high" : "low"',
      };

      const result = await handlerTransformData(block);

      expect(result.hasError).toBeUndefined();
      expect(result.data).toBe('high');
    });

    it('should handle aggregation functions', async () => {
      const block: TransformDataBlock = {
        name: 'transform-data',
        sourceData: { numbers: [1, 2, 3, 4, 5] },
        expression: '{ "sum": $sum(numbers), "avg": $average(numbers), "max": $max(numbers) }',
      };

      const result = await handlerTransformData(block);

      expect(result.hasError).toBeUndefined();
      expect(result.data).toEqual({
        sum: 15,
        avg: 3,
        max: 5,
      });
    });

    it('should handle nested object access', async () => {
      const block: TransformDataBlock = {
        name: 'transform-data',
        sourceData: {
          user: {
            profile: {
              name: 'John Doe',
              age: 30,
            },
          },
        },
        expression: 'user.profile.name',
      };

      const result = await handlerTransformData(block);

      expect(result.hasError).toBeUndefined();
      expect(result.data).toBe('John Doe');
    });

    it('should handle empty sourceData as empty object', async () => {
      const block: TransformDataBlock = {
        name: 'transform-data',
        sourceData: undefined,
        expression: '"default value"',
      };

      const result = await handlerTransformData(block);

      expect(result.hasError).toBeUndefined();
      expect(result.data).toBe('default value');
    });

    it('should return error for invalid JSONata expression', async () => {
      const block: TransformDataBlock = {
        name: 'transform-data',
        sourceData: { value: 10 },
        expression: 'invalid[[[expression',
      };

      const result = await handlerTransformData(block);

      expect(result.hasError).toBe(true);
      expect(result.message).toContain('Invalid JSONata expression');
    });

    it('should return undefined for non-existent fields', async () => {
      const block: TransformDataBlock = {
        name: 'transform-data',
        sourceData: { value: 10 },
        expression: 'nonExistentField',
      };

      const result = await handlerTransformData(block);

      expect(result.hasError).toBeUndefined();
      expect(result.data).toBeUndefined();
    });

    it('should map array with complex transformation', async () => {
      const block: TransformDataBlock = {
        name: 'transform-data',
        sourceData: {
          orders: [
            { id: 1, items: [{ price: 10 }, { price: 20 }] },
            { id: 2, items: [{ price: 30 }] },
          ],
        },
        expression: '$map(orders, function($v) { { "orderId": $v.id, "total": $sum($v.items.price) } })',
      };

      const result = await handlerTransformData(block);

      expect(result.hasError).toBeUndefined();
      expect(result.data).toHaveLength(2);
      expect(result.data[0].orderId).toBe(1);
      expect(result.data[0].total).toBe(30);
      expect(result.data[1].orderId).toBe(2);
      expect(result.data[1].total).toBe(30);
    });

    it('should handle string operations', async () => {
      const block: TransformDataBlock = {
        name: 'transform-data',
        sourceData: { text: 'hello world' },
        expression: '$uppercase(text)',
      };

      const result = await handlerTransformData(block);

      expect(result.hasError).toBeUndefined();
      expect(result.data).toBe('HELLO WORLD');
    });
  });
});
