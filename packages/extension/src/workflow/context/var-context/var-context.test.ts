import { describe, it, expect } from 'vitest';
import {
  createVarContext,
  setVar,
  setVars,
  getVar,
  hasVar,
  isVarPath,
  getByVarPath,
} from './index';

describe('VarContext', () => {
  describe('context management', () => {
    it('should create an empty var context', () => {
      const context = createVarContext();
      expect(context.vars).toEqual({});
    });

    it('should set single variable immutably', () => {
      const context = createVarContext();
      const newContext = setVar(context, 'userId', 123);

      expect(newContext.vars.userId).toBe(123);
      expect(context.vars).toEqual({}); // Original unchanged
      expect(newContext).not.toBe(context);
    });

    it('should set multiple variables', () => {
      let context = createVarContext();
      context = setVar(context, 'userId', 123);
      context = setVars(context, { name: 'test', count: 5 });

      expect(context.vars.name).toBe('test');
      expect(context.vars.count).toBe(5);
      expect(context.vars.userId).toBe(123); // Previous var preserved
    });

    it('should get variable', () => {
      let context = createVarContext();
      context = setVar(context, 'userId', 123);

      expect(getVar(context, 'userId')).toBe(123);
      expect(getVar(context, 'missing')).toBeUndefined();
    });

    it('should check if variable exists', () => {
      let context = createVarContext();
      context = setVar(context, 'userId', 123);

      expect(hasVar(context, 'userId')).toBe(true);
      expect(hasVar(context, 'missing')).toBe(false);
    });
  });

  describe('path validation', () => {
    it('should validate var paths', () => {
      expect(isVarPath('$.vars.userId')).toBe(true);
      expect(isVarPath('vars.user.name')).toBe(false); // $. prefix 필수
      expect(isVarPath('$.steps.step1')).toBe(false);
      expect(isVarPath('$.forEach.item')).toBe(false);
    });
  });

  describe('path resolution', () => {
    it('should resolve var paths', () => {
      let context = createVarContext();
      context = setVar(context, 'user', { name: 'John', age: 30 });
      context = setVar(context, 'userId', 123);

      expect(getByVarPath(context, '$.vars.userId')).toBe(123);
      expect(getByVarPath(context, '$.vars.user.name')).toBe('John');
      expect(getByVarPath(context, '$.vars.user.age')).toBe(30);
    });

    it('should return undefined for paths without $. prefix', () => {
      const context = createVarContext();
      expect(getByVarPath(context, 'vars.userId')).toBeUndefined();
    });

    it('should return undefined for non-var paths', () => {
      const context = createVarContext();
      expect(getByVarPath(context, '$.steps.step1')).toBeUndefined();
      expect(getByVarPath(context, 'forEach.item')).toBeUndefined();
    });

    it('should return undefined for missing variable', () => {
      const context = createVarContext();
      expect(getByVarPath(context, '$.vars.missing')).toBeUndefined();
    });
  });
});
