import { describe, it, expect, beforeEach } from 'vitest';
import { handlerGetElementData, GetElementDataBlock } from './GetElementDataBlock';

describe('handlerGetElementData 테스트', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="test-container">
        <button id="btn1" class="btn primary" data-action="submit">Submit</button>
        <button id="btn2" class="btn secondary" data-action="cancel">Cancel</button>
        <div class="item" data-id="1">Item 1</div>
        <div class="item" data-id="2">Item 2</div>
        <a href="https://example.com" title="Example Link">Click here</a>
      </div>
    `;
  });

  it('단일 요소의 text와 attributes를 함께 수집해야 함', async () => {
    const block: GetElementDataBlock = {
      name: 'get-element-data',
      selector: '#btn1',
      findBy: 'cssSelector',
      option: {},
      isBlock: true,
      includeText: true,
      useTextContent: true,
      attributes: ['id', 'class', 'data-action'],
    };

    const result = await handlerGetElementData(block);

    expect(result.hasError).toBeFalsy();
    expect(result.data).toEqual({
      text: 'Submit',
      attributes: {
        id: 'btn1',
        class: 'btn primary',
        'data-action': 'submit',
      },
    });
  });

  it('여러 요소의 데이터를 수집해야 함', async () => {
    const block: GetElementDataBlock = {
      name: 'get-element-data',
      selector: '.item',
      findBy: 'cssSelector',
      option: { multiple: true },
      isBlock: true,
      includeText: true,
      useTextContent: true,
      attributes: ['data-id'],
    };

    const result = await handlerGetElementData(block);

    expect(result.hasError).toBeFalsy();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toEqual([
      {
        text: 'Item 1',
        attributes: { 'data-id': '1' },
      },
      {
        text: 'Item 2',
        attributes: { 'data-id': '2' },
      },
    ]);
  });

  it('text 없이 attributes만 수집해야 함', async () => {
    const block: GetElementDataBlock = {
      name: 'get-element-data',
      selector: 'a',
      findBy: 'cssSelector',
      option: {},
      isBlock: true,
      includeText: false,
      attributes: ['href', 'title'],
    };

    const result = await handlerGetElementData(block);

    expect(result.hasError).toBeFalsy();
    expect(result.data).toEqual({
      attributes: {
        href: 'https://example.com',
        title: 'Example Link',
      },
    });
  });

  it('attributes 없이 text만 수집해야 함', async () => {
    const block: GetElementDataBlock = {
      name: 'get-element-data',
      selector: '#btn2',
      findBy: 'cssSelector',
      option: {},
      isBlock: true,
      includeText: true,
      useTextContent: true,
      attributes: [],
    };

    const result = await handlerGetElementData(block);

    expect(result.hasError).toBeFalsy();
    expect(result.data).toEqual({
      text: 'Cancel',
    });
  });

  it('prefix와 suffix를 적용해야 함', async () => {
    const block: GetElementDataBlock = {
      name: 'get-element-data',
      selector: '#btn1',
      findBy: 'cssSelector',
      option: {},
      isBlock: true,
      includeText: true,
      useTextContent: true,
      prefixText: '[',
      suffixText: ']',
      attributes: ['id'],
    };

    const result = await handlerGetElementData(block);

    expect(result.hasError).toBeFalsy();
    expect(result.data).toEqual({
      text: '[Submit]',
      attributes: { id: 'btn1' },
    });
  });

  it('존재하지 않는 요소에 대해 빈 배열/객체를 반환해야 함', async () => {
    const block: GetElementDataBlock = {
      name: 'get-element-data',
      selector: '.non-existent',
      findBy: 'cssSelector',
      option: {},
      isBlock: true,
      includeText: true,
      attributes: ['id'],
    };

    const result = await handlerGetElementData(block);

    expect(result.hasError).toBeFalsy();
    expect(result.data).toEqual({});
  });

  it('selector가 없으면 에러를 반환해야 함', async () => {
    const block: GetElementDataBlock = {
      name: 'get-element-data',
      selector: '',
      findBy: 'cssSelector',
      option: {},
      isBlock: true,
      includeText: true,
    };

    const result = await handlerGetElementData(block);

    expect(result.hasError).toBe(true);
    expect(result.message).toContain('Selector is required');
  });

  it('text와 attributes 모두 false/빈배열이면 에러를 반환해야 함', async () => {
    const block: GetElementDataBlock = {
      name: 'get-element-data',
      selector: '#btn1',
      findBy: 'cssSelector',
      option: {},
      isBlock: true,
      includeText: false,
      attributes: [],
    };

    const result = await handlerGetElementData(block);

    expect(result.hasError).toBe(true);
    expect(result.message).toContain(
      'Either includeText must be true or attributes must be provided'
    );
  });
});
