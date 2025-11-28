export async function pasteText(text: string): Promise<void> {
  const element = document.activeElement as HTMLElement;
  if (!element) {
    throw new Error('No active element found');
  }

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    element.select();
    const start = element.selectionStart || 0;
    const end = element.selectionEnd || 0;
    const currentValue = element.value;
    const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
    element.value = newValue;
    const newCursorPosition = start + text.length;
    element.setSelectionRange(newCursorPosition, newCursorPosition);

    const pasteEvent = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: new DataTransfer(),
    });
    if (pasteEvent.clipboardData) {
      pasteEvent.clipboardData.setData('text/plain', text);
    }
    element.dispatchEvent(pasteEvent);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));

  } else if (element.isContentEditable) {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    const pasteEvent = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: new DataTransfer(),
    });
    if (pasteEvent.clipboardData) {
      pasteEvent.clipboardData.setData('text/plain', text);
    }
    element.dispatchEvent(pasteEvent);
    element.dispatchEvent(new Event('input', { bubbles: true }));

  } else {
    throw new Error('Active element is not editable');
  }
}
