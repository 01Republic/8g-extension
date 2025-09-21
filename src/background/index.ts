import { BackgroundManager } from './BackgroundManager';
import { TabManager } from './TabManager';

// Initialize the 8G background script
console.log('[8G Extension] Background script starting...');
const tabManager = new TabManager();
const backgroundService = new BackgroundManager(tabManager);
backgroundService.initHandler();
