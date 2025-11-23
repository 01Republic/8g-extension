import { describe, it, expect, beforeEach } from 'vitest';
import { GetValueFormsBlock, handlerGetValueForm } from './GetValueFormBlock';

describe('handlerGetValueForm 테스트', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="test-container">
        <input type="text" class="text-input" value="기본값">
        <input type="password" class="password-input" value="">
        <textarea class="textarea-input">텍스트에어리어 기본값</textarea>
        <select class="select-input">
          <option value="">선택해주세요</option>
          <option value="option1">옵션 1</option>
          <option value="option2" selected>옵션 2</option>
        </select>
        <input type="checkbox" class="checkbox-input" checked>
        <input type="radio" class="radio-input" value="radio1">
        <input type="number" class="number-input" value="123">
      </div>
    `;
  });

  const baseData: GetValueFormsBlock = {
    name: 'get-value-form',
    selector: '.text-input',
    findBy: 'cssSelector',
    option: {},
  };

  describe('기본 테스트', () => {
    it('빈 선택자면 에러 반환', async () => {
      const data = { ...baseData, selector: '' };
      const result = await handlerGetValueForm(data);

      expect(result.hasError).toBe(true);
      expect(result.message).toBe('Selector is required for get-value-form block');
    });

    it('요소 없으면 에러 반환', async () => {
      const data = { ...baseData, selector: '.non-existent' };
      const result = await handlerGetValueForm(data);

      expect(result.hasError).toBe(true);
      expect(result.message).toBe('Form element not found');
    });
  });

  describe('텍스트 필드 값 가져오기', () => {
    it('input 텍스트 값 가져오기', async () => {
      const data = { ...baseData, type: 'text-field' as const };
      const result = await handlerGetValueForm(data);

      expect(result.data).toBe('기본값');
      expect(result.hasError).toBeFalsy();
    });

    it('빈 input 값 가져오기', async () => {
      const data = { ...baseData, selector: '.password-input', type: 'text-field' as const };
      const result = await handlerGetValueForm(data);

      expect(result.data).toBe('');
      expect(result.hasError).toBeFalsy();
    });

    it('textarea 값 가져오기', async () => {
      const data = { ...baseData, selector: '.textarea-input', type: 'text-field' as const };
      const result = await handlerGetValueForm(data);

      expect(result.data).toBe('텍스트에어리어 기본값');
      expect(result.hasError).toBeFalsy();
    });

    it('number input 값 가져오기', async () => {
      const data = { ...baseData, selector: '.number-input', type: 'text-field' as const };
      const result = await handlerGetValueForm(data);

      expect(result.data).toBe('123');
      expect(result.hasError).toBeFalsy();
    });
  });

  describe('셀렉트 값 가져오기', () => {
    it('selected 옵션 값 가져오기', async () => {
      const data = { ...baseData, selector: '.select-input', type: 'select' as const };
      const result = await handlerGetValueForm(data);

      expect(result.data).toBe('option2');
      expect(result.hasError).toBeFalsy();
    });
  });

  describe('체크박스 값 가져오기', () => {
    it('체크된 체크박스 값 가져오기', async () => {
      const data = { ...baseData, selector: '.checkbox-input', type: 'checkbox' as const };
      const result = await handlerGetValueForm(data);

      expect(result.data).toBe(true);
      expect(result.hasError).toBeFalsy();
    });

    it('체크 안된 체크박스 값 가져오기', async () => {
      // 체크박스 체크 해제
      const checkbox = document.querySelector('.checkbox-input') as HTMLInputElement;
      checkbox.checked = false;

      const data = { ...baseData, selector: '.checkbox-input', type: 'checkbox' as const };
      const result = await handlerGetValueForm(data);

      expect(result.data).toBe(false);
      expect(result.hasError).toBeFalsy();
    });
  });

  describe('XPath 테스트', () => {
    it('XPath로 텍스트 입력 값 가져오기', async () => {
      const data = {
        ...baseData,
        selector: '//input[@class="text-input"]',
        findBy: 'xpath' as const,
        type: 'text-field' as const,
      };
      const result = await handlerGetValueForm(data);

      expect(result.data).toBe('기본값');
      expect(result.hasError).toBeFalsy();
    });

    it('XPath로 체크박스 상태 가져오기', async () => {
      const data = {
        ...baseData,
        selector: '//input[@type="checkbox"]',
        findBy: 'xpath' as const,
        type: 'checkbox' as const,
      };
      const result = await handlerGetValueForm(data);

      expect(result.data).toBe(true);
      expect(result.hasError).toBeFalsy();
    });
  });

  describe('에러 처리', () => {
    it('잘못된 폼 타입으로 에러 처리', async () => {
      const data = { ...baseData, type: 'invalid-type' as any };
      const result = await handlerGetValueForm(data);

      expect(result.hasError).toBe(true);
      expect(result.message).toContain('Unsupported form element type');
    });

    it('타입 불일치로 에러 처리', async () => {
      // text input을 checkbox 타입으로 처리 시도
      const data = { ...baseData, selector: '.text-input', type: 'checkbox' as const };
      const result = await handlerGetValueForm(data);

      expect(result.hasError).toBe(true);
      expect(result.message).toContain('Invalid element type');
    });
  });
});
