import { describe, it, expect, beforeEach } from 'vitest';
import { ClearValueFormsBlock, handlerClearValueForm } from './ClearValueFormBlock';

describe('handlerClearValueForm 테스트', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="test-container">
        <input type="text" class="text-input" value="기본값">
        <input type="password" class="password-input" value="비밀번호">
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

  const baseData: ClearValueFormsBlock = {
    name: 'clear-value-form',
    selector: '.text-input',
    findBy: 'cssSelector',
    option: {},
    isBlock: true,
  };

  describe('기본 테스트', () => {
    it('빈 선택자면 에러 반환', async () => {
      const data = { ...baseData, selector: '' };
      const result = await handlerClearValueForm(data);

      expect(result.hasError).toBe(true);
      expect(result.message).toBe('Selector is required for clear-value-form block');
    });

    it('요소 없으면 에러 반환', async () => {
      const data = { ...baseData, selector: '.non-existent' };
      const result = await handlerClearValueForm(data);

      expect(result.hasError).toBe(true);
      expect(result.message).toBe('Form element not found');
    });
  });

  describe('텍스트 필드 값 지우기', () => {
    it('input 텍스트 값 지우기', async () => {
      const data = { ...baseData, type: 'text-field' as const };
      const result = await handlerClearValueForm(data);

      expect(result.data).toBe('Form element cleared successfully');
      expect(result.hasError).toBeFalsy();

      // 실제 값이 지워졌는지 확인
      const input = document.querySelector('.text-input') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('비밀번호 입력 값 지우기', async () => {
      const data = { ...baseData, selector: '.password-input', type: 'text-field' as const };
      const result = await handlerClearValueForm(data);

      expect(result.data).toBe('Form element cleared successfully');

      const input = document.querySelector('.password-input') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('textarea 값 지우기', async () => {
      const data = { ...baseData, selector: '.textarea-input', type: 'text-field' as const };
      const result = await handlerClearValueForm(data);

      expect(result.data).toBe('Form element cleared successfully');

      const textarea = document.querySelector('.textarea-input') as HTMLTextAreaElement;
      expect(textarea.value).toBe('');
    });

    it('숫자 입력 필드 값 지우기', async () => {
      const data = { ...baseData, selector: '.number-input', type: 'text-field' as const };
      const result = await handlerClearValueForm(data);

      expect(result.data).toBe('Form element cleared successfully');

      const input = document.querySelector('.number-input') as HTMLInputElement;
      expect(input.value).toBe('');
    });
  });

  describe('셀렉트 값 지우기', () => {
    it('셀렉트 첫 번째 옵션으로 리셋', async () => {
      const data = { ...baseData, selector: '.select-input', type: 'select' as const };
      const result = await handlerClearValueForm(data);

      expect(result.data).toBe('Form element cleared successfully');

      const select = document.querySelector('.select-input') as HTMLSelectElement;
      expect(select.selectedIndex).toBe(0);
      expect(select.value).toBe('');
    });
  });

  describe('체크박스 값 지우기', () => {
    it('체크박스 체크 해제', async () => {
      const data = { ...baseData, selector: '.checkbox-input', type: 'checkbox' as const };
      const result = await handlerClearValueForm(data);

      expect(result.data).toBe('Form element cleared successfully');

      const checkbox = document.querySelector('.checkbox-input') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });

    it('이미 체크 해제된 체크박스 처리', async () => {
      // 먼저 체크 해제
      const checkbox = document.querySelector('.checkbox-input') as HTMLInputElement;
      checkbox.checked = false;

      const data = { ...baseData, selector: '.checkbox-input', type: 'checkbox' as const };
      const result = await handlerClearValueForm(data);

      expect(result.data).toBe('Form element cleared successfully');
      expect(checkbox.checked).toBe(false);
    });
  });

  describe('이벤트 발생 확인', () => {
    it('텍스트 입력 지울 때 input과 change 이벤트 발생', async () => {
      let inputEventFired = false;
      let changeEventFired = false;

      const input = document.querySelector('.text-input') as HTMLInputElement;
      input.addEventListener('input', () => {
        inputEventFired = true;
      });
      input.addEventListener('change', () => {
        changeEventFired = true;
      });

      const data = { ...baseData, type: 'text-field' as const };
      await handlerClearValueForm(data);

      expect(inputEventFired).toBe(true);
      expect(changeEventFired).toBe(true);
    });

    it('셀렉트 지울 때 change 이벤트 발생', async () => {
      let changeEventFired = false;

      const select = document.querySelector('.select-input') as HTMLSelectElement;
      select.addEventListener('change', () => {
        changeEventFired = true;
      });

      const data = { ...baseData, selector: '.select-input', type: 'select' as const };
      await handlerClearValueForm(data);

      expect(changeEventFired).toBe(true);
    });

    it('체크박스 지울 때 change 이벤트 발생', async () => {
      let changeEventFired = false;

      const checkbox = document.querySelector('.checkbox-input') as HTMLInputElement;
      checkbox.addEventListener('change', () => {
        changeEventFired = true;
      });

      const data = { ...baseData, selector: '.checkbox-input', type: 'checkbox' as const };
      await handlerClearValueForm(data);

      expect(changeEventFired).toBe(true);
    });
  });

  describe('XPath 테스트', () => {
    it('XPath로 텍스트 입력 값 지우기', async () => {
      const data = {
        ...baseData,
        selector: '//input[@class="text-input"]',
        findBy: 'xpath' as const,
        type: 'text-field' as const,
      };
      const result = await handlerClearValueForm(data);

      expect(result.data).toBe('Form element cleared successfully');

      const input = document.querySelector('.text-input') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('XPath로 체크박스 체크 해제', async () => {
      const data = {
        ...baseData,
        selector: '//input[@type="checkbox"]',
        findBy: 'xpath' as const,
        type: 'checkbox' as const,
      };
      const result = await handlerClearValueForm(data);

      expect(result.data).toBe('Form element cleared successfully');

      const checkbox = document.querySelector('.checkbox-input') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });
  });

  describe('에러 처리', () => {
    it('잘못된 폼 타입으로 에러 처리', async () => {
      const data = { ...baseData, type: 'invalid-type' as any };
      const result = await handlerClearValueForm(data);

      expect(result.hasError).toBe(true);
      expect(result.message).toContain('Unsupported form element type');
    });
  });
});
