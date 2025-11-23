import { describe, it, expect } from 'vitest';
import {
  createLoopContext,
  enterForEach,
  enterLoop,
  exitLoop,
  isInForEach,
  isInLoop,
  isLoopPath,
  getByLoopPath,
} from './index';

describe('LoopContext', () => {
  describe('context management', () => {
    it('should create an empty loop context', () => {
      const context = createLoopContext();
      expect(context).toEqual({});
    });

    it('should handle forEach context immutably', () => {
      const context = createLoopContext();
      const newContext = enterForEach(context, { id: 1 }, 0, 5);

      expect(newContext.forEach).toEqual({ item: { id: 1 }, index: 0, total: 5 });
      expect(context).toEqual({}); // Original unchanged
      expect(newContext).not.toBe(context);
    });

    it('should handle count loop context immutably', () => {
      const context = createLoopContext();
      const newContext = enterLoop(context, 3, 10);

      expect(newContext.loop).toEqual({ index: 3, count: 10 });
      expect(context).toEqual({}); // Original unchanged
      expect(newContext).not.toBe(context);
    });

    it('should exit forEach context', () => {
      let context = createLoopContext();
      context = enterForEach(context, { id: 1 }, 0, 5);
      context = exitLoop(context);

      expect(context.forEach).toBeUndefined();
    });

    it('should exit loop context', () => {
      let context = createLoopContext();
      context = enterLoop(context, 3, 10);
      context = exitLoop(context);

      expect(context.loop).toBeUndefined();
    });

    it('should check if in forEach', () => {
      let context = createLoopContext();
      expect(isInForEach(context)).toBe(false);

      context = enterForEach(context, { id: 1 }, 0, 5);
      expect(isInForEach(context)).toBe(true);
    });

    it('should check if in loop', () => {
      let context = createLoopContext();
      expect(isInLoop(context)).toBe(false);

      context = enterLoop(context, 3, 10);
      expect(isInLoop(context)).toBe(true);
    });
  });

  describe('path validation', () => {
    it('should validate loop paths', () => {
      expect(isLoopPath('$.forEach.item')).toBe(true);
      expect(isLoopPath('forEach.index')).toBe(false); // $. prefix 필수
      expect(isLoopPath('$.loop.count')).toBe(true);
      expect(isLoopPath('loop.index')).toBe(false); // $. prefix 필수
      expect(isLoopPath('$.vars.userId')).toBe(false);
      expect(isLoopPath('$.steps.step1')).toBe(false);
    });
  });

  describe('path resolution', () => {
    it('should resolve forEach paths', () => {
      let context = createLoopContext();
      context = enterForEach(context, { id: 1, name: 'test' }, 2, 5);

      expect(getByLoopPath(context, '$.forEach.item.id')).toBe(1);
      expect(getByLoopPath(context, '$.forEach.item.name')).toBe('test');
      expect(getByLoopPath(context, '$.forEach.index')).toBe(2);
      expect(getByLoopPath(context, '$.forEach.total')).toBe(5);
    });

    it('should resolve loop paths', () => {
      let context = createLoopContext();
      context = enterLoop(context, 3, 10);

      expect(getByLoopPath(context, '$.loop.index')).toBe(3);
      expect(getByLoopPath(context, '$.loop.count')).toBe(10);
    });

    it('should return undefined for paths without $. prefix', () => {
      const context = createLoopContext();
      expect(getByLoopPath(context, 'forEach.item')).toBeUndefined();
      expect(getByLoopPath(context, 'loop.index')).toBeUndefined();
    });

    it('should return undefined for non-loop paths', () => {
      const context = createLoopContext();
      expect(getByLoopPath(context, '$.vars.userId')).toBeUndefined();
      expect(getByLoopPath(context, 'steps.step1')).toBeUndefined();
    });

    it('should return undefined when not in loop', () => {
      const context = createLoopContext();
      expect(getByLoopPath(context, '$.forEach.item')).toBeUndefined();
      expect(getByLoopPath(context, '$.loop.index')).toBeUndefined();
    });
  });
});
