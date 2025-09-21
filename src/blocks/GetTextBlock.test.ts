import { describe, it, expect, beforeEach } from 'vitest';
import { GetTextBlock, handlerGetText } from './GetTextBlock';

describe('handlerGetText 테스트', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="test-container">
        <div class="text-element">기본 텍스트</div>
        <span class="inner-text">   여백있는 텍스트   </span>
        <p class="html-content">안녕하세요 <strong>굵은글씨</strong> 입니다</p>
        <div class="empty-element"></div>
        <div class="whitespace-only">   </div>
        <div class="multiple-text">첫 번째</div>
        <div class="multiple-text">두 번째</div>
        <div class="multiple-text">세 번째</div>
        <div class="price-text">가격: 25,000원 할인가: 20,000원</div>
        <div class="number-text">전화번호: 010-1234-5678, 팩스: 02-123-4567</div>
        <article class="nested-content">
          <h2>제목</h2>
          <p>내용 <a href="#">링크</a> 더보기</p>
        </article>
      </div>
    `;
  });

  const baseData: GetTextBlock = {
    name: 'get-text',
    selector: '.text-element',
    findBy: 'cssSelector',
    useTextContent: true,
    option: {},
  };

  describe('기본 텍스트 추출', () => {
    it('빈 선택자면 에러 반환', async () => {
      const data = { ...baseData, selector: '' };
      const result = await handlerGetText(data);

      expect(result.hasError).toBe(true);
      expect(result.message).toBe('Selector is required for get-text block');
    });

    it('요소 없으면 빈 문자열 반환', async () => {
      const data = { ...baseData, selector: '.non-existent' };
      const result = await handlerGetText(data);

      expect(result.data).toBe('');
      expect(result.hasError).toBeFalsy();
    });

    it('단일 요소 텍스트 추출', async () => {
      const result = await handlerGetText(baseData);

      expect(result.data).toBe('기본 텍스트');
    });

    it('여러 요소 텍스트 추출', async () => {
      const data = { ...baseData, selector: '.multiple-text', option: { multiple: true } };
      const result = await handlerGetText(data);

      expect(result.data).toEqual(['첫 번째', '두 번째', '세 번째']);
    });

    it('공백 제거된 텍스트 추출', async () => {
      const data = { ...baseData, selector: '.inner-text' };
      const result = await handlerGetText(data);

      expect(result.data).toBe('여백있는 텍스트');
    });

    it('빈 요소들 필터링', async () => {
      const data = {
        ...baseData,
        selector: '.empty-element, .whitespace-only, .text-element',
        option: { multiple: true },
      };
      const result = await handlerGetText(data);

      expect(result.data).toEqual(['기본 텍스트']);
    });
  });

  describe('텍스트 추출 옵션', () => {
    it('textContent 사용', async () => {
      const data = { ...baseData, selector: '.html-content', useTextContent: true };
      const result = await handlerGetText(data);

      expect(result.data).toBe('안녕하세요 굵은글씨 입니다');
    });

    it('HTML 태그 포함', async () => {
      const data = { ...baseData, selector: '.html-content', includeTags: true };
      const result = await handlerGetText(data);

      expect(result.data).toBe('안녕하세요 <strong>굵은글씨</strong> 입니다');
    });

    it('중첩된 HTML 태그 포함', async () => {
      const data = { ...baseData, selector: '.nested-content', includeTags: true };
      const result = await handlerGetText(data);

      expect(result.data).toContain('<h2>제목</h2>');
      expect(result.data).toContain('<a href="#">링크</a>');
    });
  });

  describe('정규식 필터링', () => {
    it('가격 정보만 추출', async () => {
      const data = { ...baseData, selector: '.price-text', regex: '[0-9,]+원' };
      const result = await handlerGetText(data);

      expect(result.data).toBe('25,000원 20,000원');
    });

    it('전화번호만 추출', async () => {
      const data = { ...baseData, selector: '.number-text', regex: '\\d{2,3}-\\d{3,4}-\\d{4}' };
      const result = await handlerGetText(data);

      expect(result.data).toBe('010-1234-5678 02-123-4567');
    });

    it('숫자만 추출', async () => {
      const data = { ...baseData, selector: '.price-text', regex: '\\d+' };
      const result = await handlerGetText(data);

      expect(result.data).toBe('25 000 20 000');
    });

    it('매칭되는 패턴 없으면 빈 문자열', async () => {
      const data = { ...baseData, selector: '.text-element', regex: '\\d+' };
      const result = await handlerGetText(data);

      expect(result.data).toBe('');
    });
  });

  describe('접두사 및 접미사', () => {
    it('접두사 추가', async () => {
      const data = { ...baseData, prefixText: '제목: ' };
      const result = await handlerGetText(data);

      expect(result.data).toBe('제목: 기본 텍스트');
    });

    it('접미사 추가', async () => {
      const data = { ...baseData, suffixText: ' 끝' };
      const result = await handlerGetText(data);

      expect(result.data).toBe('기본 텍스트 끝');
    });

    it('접두사와 접미사 모두 추가', async () => {
      const data = { ...baseData, prefixText: '[', suffixText: ']' };
      const result = await handlerGetText(data);

      expect(result.data).toBe('[기본 텍스트]');
    });

    it('빈 텍스트에는 접두사 접미사 적용 안됨', async () => {
      const data = {
        ...baseData,
        selector: '.empty-element',
        prefixText: 'PREFIX',
        suffixText: 'SUFFIX',
      };
      const result = await handlerGetText(data);

      expect(result.data).toBe('');
    });

    it('여러 요소에 접두사 접미사 적용', async () => {
      const data = {
        ...baseData,
        selector: '.multiple-text',
        option: { multiple: true },
        prefixText: '• ',
        suffixText: ' 항목',
      };
      const result = await handlerGetText(data);

      expect(result.data).toEqual(['• 첫 번째 항목', '• 두 번째 항목', '• 세 번째 항목']);
    });
  });

  describe('XPath 테스트', () => {
    it('XPath로 텍스트 추출', async () => {
      const data = {
        ...baseData,
        selector: '//div[@class="text-element"]',
        findBy: 'xpath' as const,
      };
      const result = await handlerGetText(data);

      expect(result.data).toBe('기본 텍스트');
    });

    it('XPath로 여러 요소 텍스트 추출', async () => {
      const data = {
        ...baseData,
        selector: '//div[@class="multiple-text"]',
        findBy: 'xpath' as const,
        option: { multiple: true },
      };
      const result = await handlerGetText(data);

      expect(result.data).toEqual(['첫 번째', '두 번째', '세 번째']);
    });

    it('XPath로 텍스트 내용 기반 요소 찾기', async () => {
      const data = {
        ...baseData,
        selector: '//div[text()="기본 텍스트"]',
        findBy: 'xpath' as const,
      };
      const result = await handlerGetText(data);

      expect(result.data).toBe('기본 텍스트');
    });

    it('XPath contains 함수로 요소 찾기', async () => {
      const data = {
        ...baseData,
        selector: '//div[contains(@class, "price")]',
        findBy: 'xpath' as const,
      };
      const result = await handlerGetText(data);

      expect(result.data).toBe('가격: 25,000원 할인가: 20,000원');
    });

    it('XPath로 중첩 요소에서 텍스트 추출', async () => {
      const data = { ...baseData, selector: '//article//h2', findBy: 'xpath' as const };
      const result = await handlerGetText(data);

      expect(result.data).toBe('제목');
    });
  });

  describe('복합 옵션 테스트', () => {
    it('HTML 포함 + 정규식 + 접두사/접미사', async () => {
      const data = {
        ...baseData,
        selector: '.html-content',
        includeTags: true,
        regex: '<strong>.*?</strong>',
        prefixText: '강조: ',
        suffixText: ' 부분',
      };
      const result = await handlerGetText(data);

      expect(result.data).toBe('강조: <strong>굵은글씨</strong> 부분');
    });

    it('여러 요소 + textContent + 정규식', async () => {
      const data = {
        ...baseData,
        selector: '.multiple-text',
        option: { multiple: true },
        useTextContent: true,
        regex: '번째',
        prefixText: '순서: ',
      };
      const result = await handlerGetText(data);

      expect(result.data).toEqual(['순서: 번째', '순서: 번째', '순서: 번째']);
    });
  });
});
