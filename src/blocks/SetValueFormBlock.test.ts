import { describe, it, expect, beforeEach } from 'vitest';
import { handlerSetValueForm, SetValueFormsBlock } from './SetValueFormBlock';

describe('handlerSetValueForm 테스트', () => {
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

  const baseData: SetValueFormsBlock = {
    name: 'set-value-form',
    selector: '.text-input',
    findBy: 'cssSelector',
    option: {},
    setValue: '',
  };

  describe('기본 테스트', () => {
    it('빈 선택자면 에러 반환', async () => {
      const data = { ...baseData, selector: '', setValue: '새값' };
      const result = await handlerSetValueForm(data);

      expect(result.hasError).toBe(true);
      expect(result.message).toBe('Selector is required for set-value-form block');
    });

    it('요소 없으면 에러 반환', async () => {
      const data = { ...baseData, selector: '.non-existent', setValue: '새값' };
      const result = await handlerSetValueForm(data);

      expect(result.hasError).toBe(true);
      expect(result.message).toBe('Form element not found');
    });
  });

  describe('텍스트 필드 값 설정', () => {
    it('input 텍스트 값 설정', async () => {
      const data = { ...baseData, setValue: '새로운 값', type: 'text-field' as const };
      const result = await handlerSetValueForm(data);

      expect(result.data).toBe('Form element updated successfully');
      expect(result.hasError).toBeFalsy();

      // 실제 값이 변경되었는지 확인
      const input = document.querySelector('.text-input') as HTMLInputElement;
      expect(input.value).toBe('새로운 값');
    });

    it('빈 문자열로 값 설정', async () => {
      const data = { ...baseData, setValue: '', type: 'text-field' as const };
      const result = await handlerSetValueForm(data);

      expect(result.data).toBe('Form element updated successfully');

      const input = document.querySelector('.text-input') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('textarea 값 설정', async () => {
      const data = {
        ...baseData,
        selector: '.textarea-input',
        setValue: '새로운 텍스트',
        type: 'text-field' as const,
      };
      const result = await handlerSetValueForm(data);

      expect(result.data).toBe('Form element updated successfully');

      const textarea = document.querySelector('.textarea-input') as HTMLTextAreaElement;
      expect(textarea.value).toBe('새로운 텍스트');
    });

    it('숫자 입력 필드 값 설정', async () => {
      const data = {
        ...baseData,
        selector: '.number-input',
        setValue: '456',
        type: 'text-field' as const,
      };
      const result = await handlerSetValueForm(data);

      expect(result.data).toBe('Form element updated successfully');

      const input = document.querySelector('.number-input') as HTMLInputElement;
      expect(input.value).toBe('456');
    });
  });

  describe('셀렉트 값 설정', () => {
    it('셀렉트 옵션 변경', async () => {
      const data = {
        ...baseData,
        selector: '.select-input',
        setValue: 'option1',
        type: 'select' as const,
      };
      const result = await handlerSetValueForm(data);

      expect(result.data).toBe('Form element updated successfully');

      const select = document.querySelector('.select-input') as HTMLSelectElement;
      expect(select.value).toBe('option1');
    });

    it('빈 값으로 셀렉트 설정', async () => {
      const data = {
        ...baseData,
        selector: '.select-input',
        setValue: '',
        type: 'select' as const,
      };
      const result = await handlerSetValueForm(data);

      expect(result.data).toBe('Form element updated successfully');

      const select = document.querySelector('.select-input') as HTMLSelectElement;
      expect(select.value).toBe('');
    });
  });

  describe('체크박스 값 설정', () => {
    it('체크박스 체크하기', async () => {
      // 먼저 체크 해제
      const checkbox = document.querySelector('.checkbox-input') as HTMLInputElement;
      checkbox.checked = false;

      const data = {
        ...baseData,
        selector: '.checkbox-input',
        setValue: 'true',
        type: 'checkbox' as const,
      };
      const result = await handlerSetValueForm(data);

      expect(result.data).toBe('Form element updated successfully');
      expect(checkbox.checked).toBe(true);
    });

    it('체크박스 체크 해제하기', async () => {
      const data = {
        ...baseData,
        selector: '.checkbox-input',
        setValue: 'false',
        type: 'checkbox' as const,
      };
      const result = await handlerSetValueForm(data);

      expect(result.data).toBe('Form element updated successfully');

      const checkbox = document.querySelector('.checkbox-input') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });

    it('체크박스 checked 문자열로 체크하기', async () => {
      const checkbox = document.querySelector('.checkbox-input') as HTMLInputElement;
      checkbox.checked = false;

      const data = {
        ...baseData,
        selector: '.checkbox-input',
        setValue: 'checked',
        type: 'checkbox' as const,
      };
      const result = await handlerSetValueForm(data);

      expect(result.data).toBe('Form element updated successfully');
      expect(checkbox.checked).toBe(true);
    });
  });

  describe('이벤트 발생 확인', () => {
    it('텍스트 입력 시 input과 change 이벤트 발생', async () => {
      let inputEventFired = false;
      let changeEventFired = false;

      const input = document.querySelector('.text-input') as HTMLInputElement;
      input.addEventListener('input', () => {
        inputEventFired = true;
      });
      input.addEventListener('change', () => {
        changeEventFired = true;
      });

      const data = { ...baseData, setValue: '이벤트 테스트', type: 'text-field' as const };
      await handlerSetValueForm(data);

      expect(inputEventFired).toBe(true);
      expect(changeEventFired).toBe(true);
    });

    it('셀렉트 변경 시 change 이벤트 발생', async () => {
      let changeEventFired = false;

      const select = document.querySelector('.select-input') as HTMLSelectElement;
      select.addEventListener('change', () => {
        changeEventFired = true;
      });

      const data = {
        ...baseData,
        selector: '.select-input',
        setValue: 'option1',
        type: 'select' as const,
      };
      await handlerSetValueForm(data);

      expect(changeEventFired).toBe(true);
    });

    it('체크박스 변경 시 change 이벤트 발생', async () => {
      let changeEventFired = false;

      const checkbox = document.querySelector('.checkbox-input') as HTMLInputElement;
      checkbox.addEventListener('change', () => {
        changeEventFired = true;
      });

      const data = {
        ...baseData,
        selector: '.checkbox-input',
        setValue: 'false',
        type: 'checkbox' as const,
      };
      await handlerSetValueForm(data);

      expect(changeEventFired).toBe(true);
    });
  });

  describe('XPath 테스트', () => {
    it('XPath로 텍스트 입력 값 설정', async () => {
      const data = {
        ...baseData,
        selector: '//input[@class="text-input"]',
        findBy: 'xpath' as const,
        setValue: 'XPath 테스트',
        type: 'text-field' as const,
      };
      const result = await handlerSetValueForm(data);

      expect(result.data).toBe('Form element updated successfully');

      const input = document.querySelector('.text-input') as HTMLInputElement;
      expect(input.value).toBe('XPath 테스트');
    });

    it('XPath로 체크박스 상태 설정', async () => {
      const data = {
        ...baseData,
        selector: '//input[@type="checkbox"]',
        findBy: 'xpath' as const,
        setValue: 'false',
        type: 'checkbox' as const,
      };
      const result = await handlerSetValueForm(data);

      expect(result.data).toBe('Form element updated successfully');

      const checkbox = document.querySelector('.checkbox-input') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });
  });

  describe('에러 처리', () => {
    it('잘못된 폼 타입으로 에러 처리', async () => {
      const data = { ...baseData, setValue: '값', type: 'invalid-type' as any };
      const result = await handlerSetValueForm(data);

      expect(result.hasError).toBe(true);
      expect(result.message).toContain('Unsupported form element type');
    });
  });
});
