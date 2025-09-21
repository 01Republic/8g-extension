import { describe, it, expect, beforeEach } from 'vitest';
import { handlerEventClick } from './EventClickBlock';
import { EventClickBlock } from '.';

describe('handlerEventClick 테스트', () => {
  let clickCount = 0;

  beforeEach(() => {
    clickCount = 0;
    document.body.innerHTML = `
      <div id="test-container">
        <button class="clickable-button" onclick="window.clickCount++">클릭 가능 버튼</button>
        <div class="clickable-div" onclick="window.clickCount++">클릭 가능 div</div>
        <a href="#" class="clickable-link" onclick="event.preventDefault(); window.clickCount++">클릭 가능 링크</a>
        <input type="button" value="클릭 가능 input" class="clickable-input" onclick="window.clickCount++">
        <span class="clickable-span" onclick="window.clickCount++">클릭 가능 span</span>
        <div class="disabled-element" style="pointer-events: none;">비활성화된 요소</div>
      </div>
    `;
    // @ts-ignore
    window.clickCount = clickCount;
  });

  const baseData: EventClickBlock = {
    name: 'event-click',
    selector: '.clickable-button',
    findBy: 'cssSelector',
    option: {},
    isBlock: true,
  };

  it('빈 선택자면 에러 반환', async () => {
    const data = { ...baseData, selector: '' };
    const result = await handlerEventClick(data);

    expect(result.hasError).toBe(true);
    expect(result.message).toBe('Selector is required for event-click block');
  });

  it('요소 없으면 에러 반환', async () => {
    const data = { ...baseData, selector: '.non-existent' };
    const result = await handlerEventClick(data);

    expect(result.hasError).toBe(true);
    expect(result.message).toBe('Element not found for clicking');
  });

  it('버튼 요소 클릭 성공', async () => {
    const result = await handlerEventClick(baseData);

    expect(result.hasError).toBeFalsy();
    expect(result.data).toBe(true);
  });

  it('div 요소 클릭 성공', async () => {
    const data = { ...baseData, selector: '.clickable-div' };
    const result = await handlerEventClick(data);

    expect(result.hasError).toBeFalsy();
    expect(result.data).toBe(true);
  });

  it('링크 요소 클릭 성공', async () => {
    const data = { ...baseData, selector: '.clickable-link' };
    const result = await handlerEventClick(data);

    expect(result.hasError).toBeFalsy();
    expect(result.data).toBe(true);
  });

  it('input 요소 클릭 성공', async () => {
    const data = { ...baseData, selector: '.clickable-input' };
    const result = await handlerEventClick(data);

    expect(result.hasError).toBeFalsy();
    expect(result.data).toBe(true);
  });

  it('span 요소 클릭 성공', async () => {
    const data = { ...baseData, selector: '.clickable-span' };
    const result = await handlerEventClick(data);

    expect(result.hasError).toBeFalsy();
    expect(result.data).toBe(true);
  });

  it('ID 선택자로 요소 클릭', async () => {
    document.querySelector('.clickable-button')?.setAttribute('id', 'test-button');
    const data = { ...baseData, selector: '#test-button' };
    const result = await handlerEventClick(data);

    expect(result.data).toBe(true);
  });

  it('속성 선택자로 요소 클릭', async () => {
    const data = { ...baseData, selector: '[type="button"]' };
    const result = await handlerEventClick(data);

    expect(result.data).toBe(true);
  });

  it('복합 선택자로 요소 클릭', async () => {
    const data = { ...baseData, selector: 'input[type="button"].clickable-input' };
    const result = await handlerEventClick(data);

    expect(result.data).toBe(true);
  });

  it('잘못된 선택자면 에러 처리', async () => {
    const data = { ...baseData, selector: '///invalid///' };
    const result = await handlerEventClick(data);

    expect(result.hasError).toBe(true);
  });

  describe('XPath 테스트', () => {
    it('XPath로 버튼 클릭', async () => {
      const data = {
        ...baseData,
        selector: '//button[@class="clickable-button"]',
        findBy: 'xpath' as const,
      };
      const result = await handlerEventClick(data);

      expect(result.data).toBe(true);
    });

    it('XPath로 텍스트 기반 요소 클릭', async () => {
      const data = {
        ...baseData,
        selector: '//button[text()="클릭 가능 버튼"]',
        findBy: 'xpath' as const,
      };
      const result = await handlerEventClick(data);

      expect(result.data).toBe(true);
    });

    it('XPath로 속성 기반 요소 클릭', async () => {
      const data = { ...baseData, selector: '//input[@type="button"]', findBy: 'xpath' as const };
      const result = await handlerEventClick(data);

      expect(result.data).toBe(true);
    });

    it('XPath로 존재하지 않는 요소 클릭 시도', async () => {
      const data = {
        ...baseData,
        selector: '//button[@class="non-existent"]',
        findBy: 'xpath' as const,
      };
      const result = await handlerEventClick(data);

      expect(result.hasError).toBe(true);
      expect(result.data).toBe(false);
    });

    it('XPath contains 함수로 요소 클릭', async () => {
      const data = {
        ...baseData,
        selector: '//span[contains(@class, "clickable")]',
        findBy: 'xpath' as const,
      };
      const result = await handlerEventClick(data);

      expect(result.data).toBe(true);
    });
  });
});
