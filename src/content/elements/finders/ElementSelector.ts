import { SelectorData } from '..';

export abstract class ElementSelector {
  abstract find(data: SelectorData, documentCtx?: Document): Promise<Element | Element[] | null>;

  public async waitForElement(
    data: SelectorData,
    documentCtx: Document,
    timeout: number
  ): Promise<Element | Element[] | null> {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const checkElement = async () => {
        const element = await this.find(data, documentCtx);

        if (element && (Array.isArray(element) ? element.length > 0 : true)) {
          resolve(element);
          return;
        }

        if (Date.now() - startTime >= timeout) {
          resolve(null);
          return;
        }

        setTimeout(checkElement, 100);
      };

      checkElement();
    });
  }
}
