import { BackgroundManager } from './chrome/BackgroundManager';
import { initSentry } from '../utils/sentry';

// Initialize Sentry first
initSentry('background');

// Initialize the 8G background script
console.log('[8G Extension] Background script starting...');
const backgroundService = new BackgroundManager();
backgroundService.initHandler();
