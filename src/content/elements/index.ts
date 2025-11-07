import { CssSelector } from './finders/CssSelector';
import { IframSelector } from './finders/IframeSelector';
import { ShadowDOMSelector } from './finders/ShadowDOMSelector';
import { XPathSelector } from './finders/XPathFinder';

export interface SelectorData {
  selector: string;
  findBy?: 'cssSelector' | 'xpath';
  option?: {
    waitForSelector?: boolean;
    waitSelectorTimeout?: number;
    multiple?: boolean;
    markEl?: boolean;
  };
}

export async function findElement(
  data: SelectorData,
  documentCtx: Document = document
): Promise<Element | Element[] | null> {
  const { selector, findBy = 'cssSelector', option } = data;
  const { waitForSelector = false, waitSelectorTimeout = 5000 } = option || {};

  const selectorInstance = buildSelector(selector, findBy);

  if (waitForSelector) {
    return selectorInstance.waitForElement(data, documentCtx, waitSelectorTimeout);
  }

  return selectorInstance.find(data, documentCtx);
}

function buildSelector(selector: string, findBy: 'cssSelector' | 'xpath') {
  if (findBy === 'xpath') {
    return new XPathSelector();
  }

  if (selector.includes('>>')) {
    return new ShadowDOMSelector();
  }

  if (selector.includes('|>')) {
    return new IframSelector();
  }

  return new CssSelector();
}

export { CSSSelectorGenerator } from './utils/CSSSelectorGenerator';
