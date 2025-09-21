import { SelectorData } from '..';
import { ElementSelector } from './ElementSelector';

export class XPathSelector extends ElementSelector {
  async find(
    data: SelectorData,
    documentCtx: Document = document
  ): Promise<Element | Element[] | null> {
    const { selector, option } = data;
    const { multiple = false } = option || {};

    try {
      const result = documentCtx.evaluate(
        selector,
        documentCtx,
        null,
        multiple ? XPathResult.ORDERED_NODE_SNAPSHOT_TYPE : XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );

      if (multiple) {
        const nodes: Element[] = [];
        for (let i = 0; i < result.snapshotLength; i++) {
          const node = result.snapshotItem(i);
          if (node && node.nodeType === Node.ELEMENT_NODE) {
            nodes.push(node as Element);
          }
        }
        return Promise.resolve(nodes.length > 0 ? nodes : null);
      } else {
        const node = result.singleNodeValue;
        return node && node.nodeType === Node.ELEMENT_NODE ? (node as Element) : null;
      }
    } catch (error) {
      console.error('XPath error:', error);
      return null;
    }
  }
}
