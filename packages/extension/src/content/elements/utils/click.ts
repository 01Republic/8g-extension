export function dispatchClickEvents(element: HTMLElement): void {
  const events = [
    new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window, button: 0 }),
    new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window, button: 0 }),
    new MouseEvent('click', { bubbles: true, cancelable: true, view: window, button: 0 })
  ];

  events.forEach(event => element.dispatchEvent(event));
}

export function scrollIntoViewAndFocus(element: HTMLElement): void {
  element.scrollIntoView({
    behavior: 'instant',
    block: 'center',
    inline: 'center',
  });

  if (element.focus) {
    element.focus();
  }
}

export function getElementCenter(element: HTMLElement): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}
