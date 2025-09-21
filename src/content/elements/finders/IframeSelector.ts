import { SelectorData } from '..';
import { ElementSelector } from './ElementSelector';

export class IframSelector extends ElementSelector {
  async find(
    data: SelectorData,
    documentCtx: Document = document
  ): Promise<Element | Element[] | null> {
    const { selector, option } = data;
    const { multiple = false } = option || {};

    if (!selector || selector.trim() === '') {
      return null;
    }

    const parts = selector.split('|>').map((part) => part.trim());

    // |> 구분자가 없거나 부분이 2개가 아니면 에러
    if (parts.length !== 2) {
      return null;
    }

    const iframeSelector = parts[0];
    const targetSelector = parts[1];

    // 빈 선택자 체크
    if (!iframeSelector || !targetSelector) {
      return null;
    }

    try {
      const iframe = documentCtx.querySelector(iframeSelector) as HTMLIFrameElement;
      if (!iframe || !iframe.contentDocument) return null;

      const iframeDoc = iframe.contentDocument;

      if (multiple) {
        return Array.from(iframeDoc.querySelectorAll(targetSelector));
      } else {
        return iframeDoc.querySelector(targetSelector);
      }
    } catch (error) {
      console.error('Iframe Selector error:', error);
      return null;
    }
  }
}
