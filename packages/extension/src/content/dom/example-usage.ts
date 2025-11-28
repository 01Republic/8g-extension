/**
 * Example usage of ChromeDOMProvider
 * This file demonstrates how to use the ChromeDOMProvider in workflow execution
 */

import { chromeDOMProvider } from './ChromeDOMProvider';
import type { DOMProvider } from '@8g/workflow-engine';

/**
 * Example function showing how to use ChromeDOMProvider for workflow operations
 */
export async function exampleWorkflowSteps() {
  // The provider implements the DOMProvider interface
  const provider: DOMProvider = chromeDOMProvider;

  try {
    // Example 1: Find and click an element
    console.log('Finding element...');
    const element = await provider.findElement({
      selector: '.submit-button',
      findBy: 'cssSelector',
      option: { waitForSelector: true, waitSelectorTimeout: 5000 }
    });

    if (element && !Array.isArray(element)) {
      console.log('Clicking element...');
      await provider.click(element);
      
      // Mark the element with a border
      await provider.markBorder(element, {
        color: '#00ff00',
        width: 2,
        style: 'solid',
        temporary: true,
        duration: 2000
      });
    }

    // Example 2: Fill out a form
    const inputElement = await provider.findElement({
      selector: 'input[name="email"]',
      findBy: 'cssSelector'
    });

    if (inputElement && !Array.isArray(inputElement)) {
      await provider.setValue(inputElement, 'user@example.com');
      
      const value = await provider.getValue(inputElement);
      console.log('Input value:', value);
    }

    // Example 3: Navigate to a page
    await provider.navigate('https://example.com/form');

    // Example 4: Scroll operations
    await provider.scroll({
      toElement: { selector: '#footer' }
    });

    // Example 5: Get text from elements
    const titleElement = await provider.findElement({
      selector: 'h1',
      findBy: 'cssSelector'
    });

    if (titleElement && !Array.isArray(titleElement)) {
      const titleText = await provider.getText(titleElement);
      console.log('Page title:', titleText);
    }

    // Example 6: Make API requests (Chrome extension specific)
    if (provider.fetch) {
      const response = await provider.fetch({
        url: 'https://api.example.com/data',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer token123'
        }
      });

      const data = await response.json();
      console.log('API response:', data);
    }

    // Example 7: Keyboard interactions (Chrome extension specific)
    if (provider.keypress) {
      await provider.keypress('Enter');
      
      // Copy text and paste it
      if (provider.paste) {
        await provider.paste('Hello, world!');
      }
    }

    // Example 8: Export data (Chrome extension specific)
    if (provider.exportData) {
      const dataToExport = [
        { name: 'John', email: 'john@example.com' },
        { name: 'Jane', email: 'jane@example.com' }
      ];

      await provider.exportData(dataToExport, {
        filename: 'users.csv',
        format: 'csv',
        includeHeaders: true
      });
    }

    // Example 9: AI parsing (Chrome extension specific)
    if (provider.parseWithAI) {
      const htmlContent = '<div>Price: $19.99</div>';
      const parsedData = await provider.parseWithAI(
        htmlContent,
        'Extract the price as a number'
      );
      console.log('AI parsed price:', parsedData);
    }

    console.log('Workflow steps completed successfully');

  } catch (error) {
    console.error('Workflow step failed:', error);
    throw error;
  }
}

/**
 * Example showing how to integrate ChromeDOMProvider with workflow runner
 */
export function setupWorkflowWithChromeProvider() {
  // The ChromeDOMProvider can be passed to WorkflowRunner
  // when it's created to handle all DOM operations
  
  console.log('ChromeDOMProvider is ready for use');
  console.log('Available methods:', Object.getOwnPropertyNames(chromeDOMProvider));
  
  return chromeDOMProvider;
}