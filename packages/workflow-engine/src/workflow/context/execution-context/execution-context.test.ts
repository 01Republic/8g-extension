import { describe, it, expect } from 'vitest';
import {
  createExecutionContext,
  setStepResultInContext,
  setVarInContext,
  enterForEachInContext,
  exitLoopInContext,
  getByPath,
  resolveBindings,
  evaluateCondition,
} from './index';

describe('ExecutionContext', () => {
  describe('path resolution (integration)', () => {
    it('should resolve paths from all sub-contexts', () => {
      let context = createExecutionContext();
      context = setVarInContext(context, 'userId', 123);
      context = setStepResultInContext(context, 'step1', {
        result: { data: { nested: 'value' } },
        success: true,
        skipped: false,
      });
      context = enterForEachInContext(context, { id: 1 }, 0, 5);

      expect(getByPath(context, 'vars.userId')).toBe(123);
      expect(getByPath(context, 'steps.step1.result.data.nested')).toBe('value');
      expect(getByPath(context, 'forEach.item.id')).toBe(1);
      expect(getByPath(context, 'forEach.index')).toBe(0);
    });

    it('should return undefined for invalid paths', () => {
      let context = createExecutionContext();
      context = setVarInContext(context, 'userId', 123);
      context = enterForEachInContext(context, { id: 1 }, 0, 5);

      expect(getByPath(context, 'invalidPrefix.userId')).toBeUndefined();
      expect(getByPath(context, 'unknown.index')).toBeUndefined();
    });

    it('should return undefined for missing path', () => {
      const context = createExecutionContext();
      expect(getByPath(context, 'vars.missing')).toBeUndefined();
      expect(getByPath(context, 'steps.missing')).toBeUndefined();
    });
  });

  describe('binding resolution', () => {
    it('should resolve bindings from all contexts', () => {
      let context = createExecutionContext();
      context = setVarInContext(context, 'userId', 123);
      context = setVarInContext(context, 'name', 'John');
      context = setStepResultInContext(context, 'fetchUser', {
        result: { data: { email: 'john@example.com' } },
        success: true,
        skipped: false,
      });

      const result = resolveBindings(
        {
          id: { valueFrom: 'vars.userId' },
          greeting: 'Hello ${vars.name}',
          url: { template: '/users/${vars.userId}' },
          email: { valueFrom: 'steps.fetchUser.result.data.email' },
        },
        context
      );

      expect(result).toEqual({
        id: 123,
        greeting: 'Hello John',
        url: '/users/123',
        email: 'john@example.com',
      });
    });

    it('should resolve bindings with forEach context', () => {
      let context = createExecutionContext();
      context = setVarInContext(context, 'apiUrl', 'https://api.example.com');
      context = enterForEachInContext(context, { id: 42 }, 0, 3);

      const url = resolveBindings('${vars.apiUrl}/items/${forEach.item.id}', context);
      expect(url).toBe('https://api.example.com/items/42');
    });
  });

  describe('condition evaluation', () => {
    it('should evaluate JSON conditions across contexts', () => {
      let context = createExecutionContext();
      context = setVarInContext(context, 'status', 'OK');
      context = setVarInContext(context, 'count', 10);
      context = setStepResultInContext(context, 'step1', {
        result: { data: 'test' },
        success: true,
        skipped: false,
      });

      expect(evaluateCondition({ exists: 'vars.status' }, context)).toBe(true);
      expect(evaluateCondition({ equals: { left: 'vars.status', right: 'OK' } }, context)).toBe(
        true
      );
      expect(evaluateCondition({ equals: { left: 'vars.count', right: 10 } }, context)).toBe(true);
      expect(evaluateCondition({ equals: { left: 'vars.count', right: 5 } }, context)).toBe(false);
      expect(evaluateCondition({ exists: 'steps.step1' }, context)).toBe(true);
      expect(
        evaluateCondition({ equals: { left: 'steps.step1.success', right: true } }, context)
      ).toBe(true);
    });

    it('should evaluate expression conditions', () => {
      let context = createExecutionContext();
      context = setVarInContext(context, 'count', 10);

      expect(evaluateCondition({ expr: 'vars.count > 5' }, context)).toBe(true);
      expect(evaluateCondition({ expr: 'vars.count < 5' }, context)).toBe(false);
    });

    it('should return true for undefined condition', () => {
      const context = createExecutionContext();
      expect(evaluateCondition(undefined, context)).toBe(true);
    });
  });

  describe('integration', () => {
    it('should handle full workflow scenario', () => {
      let context = createExecutionContext();

      // Set some variables
      context = setVarInContext(context, 'apiUrl', 'https://api.example.com');
      context = setVarInContext(context, 'userId', 123);

      // Record step 1 result
      context = setStepResultInContext(context, 'fetchUser', {
        result: { data: { name: 'John', email: 'john@example.com' } },
        success: true,
        skipped: false,
      });

      // Enter forEach
      const users = [{ id: 1 }, { id: 2 }, { id: 3 }];
      context = enterForEachInContext(context, users[0], 0, 3);

      // Resolve bindings with forEach context
      const boundUrl = resolveBindings('${vars.apiUrl}/users/${forEach.item.id}', context);
      expect(boundUrl).toBe('https://api.example.com/users/1');

      // Check conditions
      expect(evaluateCondition({ exists: 'steps.fetchUser' }, context)).toBe(true);
      expect(evaluateCondition({ equals: { left: 'forEach.index', right: 0 } }, context)).toBe(
        true
      );
      expect(
        evaluateCondition({ equals: { left: 'steps.fetchUser.success', right: true } }, context)
      ).toBe(true);

      // Exit forEach
      context = exitLoopInContext(context);
      expect(context.loopContext.forEach).toBeUndefined();
    });
  });
});
