import { describe, it, expect } from 'vitest';
import {
  createStepContext,
  setStepResult,
  getStepResult,
  hasStep,
  isStepPath,
  getByStepPath,
} from './index';

describe('StepContext', () => {
  describe('context management', () => {
    it('should create an empty step context', () => {
      const context = createStepContext();
      expect(context.steps).toEqual({});
    });

    it('should add step result immutably', () => {
      const context = createStepContext();
      const result = { result: { data: 'test' }, success: true, skipped: false };

      const newContext = setStepResult(context, 'step1', result);

      expect(newContext.steps.step1).toEqual(result);
      expect(context.steps).toEqual({}); // Original unchanged
      expect(newContext).not.toBe(context);
    });

    it('should get step result', () => {
      let context = createStepContext();
      const result = { result: { data: 'test' }, success: true, skipped: false };
      context = setStepResult(context, 'step1', result);

      expect(getStepResult(context, 'step1')).toEqual(result);
      expect(getStepResult(context, 'missing')).toBeUndefined();
    });

    it('should check if step exists', () => {
      let context = createStepContext();
      context = setStepResult(context, 'step1', {
        result: {},
        success: true,
        skipped: false,
      });

      expect(hasStep(context, 'step1')).toBe(true);
      expect(hasStep(context, 'missing')).toBe(false);
    });
  });

  describe('path validation', () => {
    it('should validate step paths', () => {
      expect(isStepPath('$.steps.step1.result')).toBe(true);
      expect(isStepPath('steps.step1.result')).toBe(false); // $. prefix 필수
      expect(isStepPath('$.vars.userId')).toBe(false);
      expect(isStepPath('$.forEach.item')).toBe(false);
    });
  });

  describe('path resolution', () => {
    it('should resolve step paths', () => {
      let context = createStepContext();
      context = setStepResult(context, 'step1', {
        result: { data: { nested: 'value' } },
        success: true,
        skipped: false,
      });

      expect(getByStepPath(context, '$.steps.step1.result.data.nested')).toBe('value');
      expect(getByStepPath(context, '$.steps.step1.success')).toBe(true);
      expect(getByStepPath(context, '$.steps.step1.skipped')).toBe(false);
    });

    it('should return undefined for paths without $. prefix', () => {
      const context = createStepContext();
      expect(getByStepPath(context, 'steps.step1.result')).toBeUndefined();
    });

    it('should return undefined for non-step paths', () => {
      const context = createStepContext();
      expect(getByStepPath(context, '$.vars.userId')).toBeUndefined();
      expect(getByStepPath(context, 'forEach.item')).toBeUndefined();
    });

    it('should return undefined for missing step', () => {
      const context = createStepContext();
      expect(getByStepPath(context, '$.steps.missing')).toBeUndefined();
    });
  });
});
