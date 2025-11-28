export interface ScrollToElementOptions {
  behavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
  inline?: ScrollLogicalPosition;
}

export interface ScrollByDistanceOptions {
  x: number;
  y: number;
  behavior?: ScrollBehavior;
}

export interface ScrollUntilLoadedOptions {
  maxWaitTime: number;
  scrollDelay: number;
}

export function scrollToElement(element: HTMLElement, options: ScrollToElementOptions = {}): void {
  element.scrollIntoView({
    behavior: options.behavior || 'smooth',
    block: options.block || 'center',
    inline: options.inline || 'center',
  });
}

export function scrollToBottom(behavior: ScrollBehavior = 'smooth'): void {
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior
  });
}

export function scrollByDistance(options: ScrollByDistanceOptions): void {
  window.scrollBy({
    left: options.x,
    top: options.y,
    behavior: options.behavior || 'smooth'
  });
}

export async function scrollUntilLoaded(options: ScrollUntilLoadedOptions): Promise<void> {
  const { maxWaitTime, scrollDelay } = options;
  const startTime = Date.now();
  const initialHeight = document.body.scrollHeight;

  while (Date.now() - startTime < maxWaitTime) {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });

    await new Promise(resolve => setTimeout(resolve, scrollDelay));

    if (document.body.scrollHeight > initialHeight) {
      break;
    }
  }
}
