import { BackgroundManager } from './chrome/BackgroundManager';

// Initialize the 8G background script
console.log('[8G Extension] Background script starting...');
const backgroundService = new BackgroundManager();
backgroundService.initHandler();
