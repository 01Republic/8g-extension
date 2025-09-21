import { SelectorData } from '..';
import { ElementSelector } from './ElementSelector';

export class CssSelector extends ElementSelector {
  async find(
    data: SelectorData,
    documentCtx: Document = document
  ): Promise<Element | Element[] | null> {
    const { selector, option } = data;
    const { multiple = false } = option || {};

    try {
      const processedSelector = this.processCustomPseudoSelectors(selector, documentCtx);

      if (multiple) {
        return Array.from(documentCtx.querySelectorAll(processedSelector));
      } else {
        return documentCtx.querySelector(processedSelector);
      }
    } catch (error) {
      console.error('CSS Selector error:', error);
      return null;
    }
  }

  private processCustomPseudoSelectors(selector: string, documentCtx: Document): string {
    // Check for :contains()
    const containsRegex = /:contains\(['"]([^'"]*)['"]\)/g;
    if (containsRegex.test(selector)) {
      this.markElementsWithText(documentCtx);
      return selector.replace(
        /:contains\(['"]([^'"]*)['"]\)/g,
        (_match, text) => `[data-contains="${text}"]`
      );
    }

    // Check for :equal()
    const equalRegex = /:equal\(['"]([^'"]*)['"]\)/g;
    if (equalRegex.test(selector)) {
      this.markElementsWithText(documentCtx);
      return selector.replace(
        /:equal\(['"]([^'"]*)['"]\)/g,
        (_match, text) => `[data-equal="${text}"]`
      );
    }

    // No custom pseudo-selectors
    return selector;
  }

  private markElementsWithText(documentCtx: Document): void {
    const allElements: NodeListOf<Element> = documentCtx.querySelectorAll('*');

    allElements.forEach((element: Element) => {
      const text = element.textContent?.trim() || '';

      if (text) {
        element.setAttribute('data-contains', text);

        // For :equal(), check if this element's direct text content matches
        // (not including text from child elements)
        const childNodes = Array.from(element.childNodes);
        const directText = childNodes
          .filter((node) => node.nodeType === Node.TEXT_NODE)
          .map((node) => node.textContent?.trim() || '')
          .join(' ')
          .trim();

        if ((directText && directText === text) || (element.children.length === 0 && text)) {
          element.setAttribute('data-equal', text);
        }
      }
    });
  }
}
