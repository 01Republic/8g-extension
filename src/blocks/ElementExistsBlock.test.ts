import { describe, it, expect, beforeEach } from 'vitest';
import { ElementExistsBlock, handlerElementExists } from './ElementExistsBlock';

describe('handlerElementExists 테스트', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="test-container">
        <div class="existing-element">존재하는 요소</div>
        <button id="test-button" data-action="click">테스트 버튼</button>
        <span class="multiple-element">첫 번째</span>
        <span class="multiple-element">두 번째</span>
        <input type="text" value="test" class="test-input">
        <a href="https://example.com" class="test-link">링크</a>
      </div>
    `;
  });

  const baseData: ElementExistsBlock = {
    name: 'element-exists',
    selector: '.existing-element',
    findBy: 'cssSelector',
    option: {}
  };

  it('빈 선택자면 에러 반환', async () => {
    const data = { ...baseData, selector: '' };
    const result = await handlerElementExists(data);

    expect(result.hasError).toBe(true);
    expect(result.message).toBe('Selector is required for element-exists block');
  });

  it('요소 없으면 false 반환', async () => {
    const data = { ...baseData, selector: '.non-existent' };
    const result = await handlerElementExists(data);

    expect(result.data).toBe(false);
    expect(result.hasError).toBeFalsy();
  });

  it('요소 있으면 true 반환', async () => {
    const result = await handlerElementExists(baseData);

    expect(result.data).toBe(true);
    expect(result.hasError).toBeFalsy();
  });

  it('ID 선택자로 요소 존재 확인', async () => {
    const data = { ...baseData, selector: '#test-button' };
    const result = await handlerElementExists(data);

    expect(result.data).toBe(true);
  });

  it('클래스 선택자로 요소 존재 확인', async () => {
    const data = { ...baseData, selector: '.test-link' };
    const result = await handlerElementExists(data);

    expect(result.data).toBe(true);
  });

  it('태그 선택자로 요소 존재 확인', async () => {
    const data = { ...baseData, selector: 'input' };
    const result = await handlerElementExists(data);

    expect(result.data).toBe(true);
  });

  it('속성 선택자로 요소 존재 확인', async () => {
    const data = { ...baseData, selector: '[data-action="click"]' };
    const result = await handlerElementExists(data);

    expect(result.data).toBe(true);
  });

  it('복합 선택자로 요소 존재 확인', async () => {
    const data = { ...baseData, selector: 'button#test-button[data-action="click"]' };
    const result = await handlerElementExists(data);

    expect(result.data).toBe(true);
  });

  describe('XPath 테스트', () => {
    it('XPath로 요소 존재 확인', async () => {
      const data = {
        ...baseData,
        selector: '//div[@class="existing-element"]',
        findBy: 'xpath' as const,
      };
      const result = await handlerElementExists(data);

      expect(result.data).toBe(true);
    });

    it('XPath로 텍스트 기반 요소 존재 확인', async () => {
      const data = {
        ...baseData,
        selector: '//div[text()="존재하는 요소"]',
        findBy: 'xpath' as const,
      };
      const result = await handlerElementExists(data);

      expect(result.data).toBe(true);
    });

    it('XPath로 속성 기반 요소 존재 확인', async () => {
      const data = {
        ...baseData,
        selector: '//button[@data-action="click"]',
        findBy: 'xpath' as const,
      };
      const result = await handlerElementExists(data);

      expect(result.data).toBe(true);
    });

    it('XPath로 존재하지 않는 요소 확인', async () => {
      const data = {
        ...baseData,
        selector: '//div[@class="non-existent"]',
        findBy: 'xpath' as const,
      };
      const result = await handlerElementExists(data);

      expect(result.data).toBe(false);
    });

    it('XPath contains 함수로 요소 존재 확인', async () => {
      const data = {
        ...baseData,
        selector: '//span[contains(@class, "multiple")]',
        findBy: 'xpath' as const,
      };
      const result = await handlerElementExists(data);

      expect(result.data).toBe(true);
    });
  });
});
