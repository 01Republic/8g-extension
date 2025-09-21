import { describe, it, expect, beforeEach } from 'vitest';
import { GetAttributeValueBlock, handlerGetAttributeValue } from './GetAttributeValueBlock';

describe('handlerGetAttributeValue 테스트', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="test-container">
        <a href="https://example.com" class="test-link">Link 1</a>
        <a href="https://example2.com" class="test-link">Link 2</a>
        <img src="/image1.jpg" alt="Image 1" class="test-image">
        <img src="/image2.jpg" alt="Image 2" class="test-image">
        <div class="no-href">No href</div>
        <button data-action="click" class="test-button">Button</button>
        <input type="text" value="test value" class="test-input">
      </div>
    `;
  });

  const baseData: GetAttributeValueBlock = {
    name: 'attribute-value',
    selector: '.test-link',
    findBy: 'cssSelector',
    attributeName: 'href',
    option: {},
    isBlock: true,
  };

  it('빈 선택자면 에러 반환', async () => {
    const data = { ...baseData, selector: '' };
    const result = await handlerGetAttributeValue(data);

    expect(result.hasError).toBe(true);
    expect(result.message).toBe('Selector is required for attribute-value block');
  });

  it('속성명 없으면 에러 반환', async () => {
    const data = { ...baseData, attributeName: '' };
    const result = await handlerGetAttributeValue(data);

    expect(result.hasError).toBe(true);
    expect(result.message).toBe('Attribute name is required for attribute-value block');
  });

  it('요소 못 찾으면 null 반환', async () => {
    const data = { ...baseData, selector: '.non-existent' };
    const result = await handlerGetAttributeValue(data);

    expect(result.data).toBe(null);
    expect(result.hasError).toBeFalsy();
  });

  it('단일 요소에서 속성값 추출', async () => {
    const data = { ...baseData, selector: '.test-link' };
    const result = await handlerGetAttributeValue(data);

    expect(result.data).toBe('https://example.com');
  });

  it('여러 요소에서 속성값들 추출', async () => {
    const data = { ...baseData, selector: '.test-link', option: { multiple: true } };
    const result = await handlerGetAttributeValue(data);

    expect(result.data).toEqual(['https://example.com', 'https://example2.com']);
  });

  it('속성 없는 요소는 null 반환', async () => {
    const data = { ...baseData, selector: '.no-href' };
    const result = await handlerGetAttributeValue(data);

    expect(result.data).toBe(null);
  });

  it('여러 요소 중 일부만 속성 있으면 null 값 제거', async () => {
    const data = { ...baseData, selector: '.test-link, .no-href', option: { multiple: true } };
    const result = await handlerGetAttributeValue(data);

    expect(result.data).toEqual(['https://example.com', 'https://example2.com']);
  });

  it('다른 속성명으로도 작동', async () => {
    const data = { ...baseData, selector: '.test-image', attributeName: 'src' };
    const result = await handlerGetAttributeValue(data);

    expect(result.data).toBe('/image1.jpg');
  });

  it('alt 속성 추출', async () => {
    const data = { ...baseData, selector: '.test-image', attributeName: 'alt' };
    const result = await handlerGetAttributeValue(data);

    expect(result.data).toBe('Image 1');
  });

  it('data 속성도 추출', async () => {
    const data = { ...baseData, selector: '.test-button', attributeName: 'data-action' };
    const result = await handlerGetAttributeValue(data);

    expect(result.data).toBe('click');
  });

  it('value 속성도 추출', async () => {
    const data = { ...baseData, selector: '.test-input', attributeName: 'value' };
    const result = await handlerGetAttributeValue(data);

    expect(result.data).toBe('test value');
  });

  describe('XPath 테스트', () => {
    it('XPath로 단일 요소 속성 추출', async () => {
      const data = {
        ...baseData,
        selector: '//a[@href="https://example.com"]',
        findBy: 'xpath' as const,
        attributeName: 'href',
      };
      const result = await handlerGetAttributeValue(data);

      expect(result.data).toBe('https://example.com');
    });

    it('XPath로 여러 요소 속성들 추출', async () => {
      const data = {
        ...baseData,
        selector: '//a[@class="test-link"]',
        findBy: 'xpath' as const,
        option: { multiple: true },
        attributeName: 'href',
      };
      const result = await handlerGetAttributeValue(data);

      expect(result.data).toEqual(['https://example.com', 'https://example2.com']);
    });

    it('XPath로 이미지 src 속성 추출', async () => {
      const data = {
        ...baseData,
        selector: '//img[@alt="Image 1"]',
        findBy: 'xpath' as const,
        attributeName: 'src',
      };
      const result = await handlerGetAttributeValue(data);

      expect(result.data).toBe('/image1.jpg');
    });

    it('XPath로 데이터 속성 추출', async () => {
      const data = {
        ...baseData,
        selector: '//button[@data-action]',
        findBy: 'xpath' as const,
        attributeName: 'data-action',
      };
      const result = await handlerGetAttributeValue(data);

      expect(result.data).toBe('click');
    });

    it('XPath로 존재하지 않는 요소면 null 반환', async () => {
      const data = {
        ...baseData,
        selector: '//span[@class="non-existent"]',
        findBy: 'xpath' as const,
        attributeName: 'href',
      };
      const result = await handlerGetAttributeValue(data);

      expect(result.data).toBe(null);
    });

    it('XPath로 텍스트 내용 기반 요소 찾고 속성 추출', async () => {
      const data = {
        ...baseData,
        selector: '//a[text()="Link 1"]',
        findBy: 'xpath' as const,
        attributeName: 'href',
      };
      const result = await handlerGetAttributeValue(data);

      expect(result.data).toBe('https://example.com');
    });

    it('XPath로 contains 함수 사용해서 요소 찾고 속성 추출', async () => {
      const data = {
        ...baseData,
        selector: '//img[contains(@alt, "Image")]',
        findBy: 'xpath' as const,
        option: { multiple: true },
        attributeName: 'src',
      };
      const result = await handlerGetAttributeValue(data);

      expect(result.data).toEqual(['/image1.jpg', '/image2.jpg']);
    });
  });
});
