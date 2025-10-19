import { createRoot } from 'react-dom/client';
import { MessageKernel } from './kernel/MessageKernel';
import { InternalMessageHandler } from './handler/InternalMessageHandler';
import { ExternalMessageHandler } from './handler/ExternalMessageHandler';
import { ConfirmationUIContainer } from './components/ConfirmationUI';

// Prevent multiple injections
(() => {
  if ((window as any).is8gExtensionInjected) return;
  (window as any).is8gExtensionInjected = true;

  console.log('[8G Extension] Content script initialized on:', window.location.href);

  // 메시지 커널 생성 (중앙 집중식 메시지 처리)
  const messageKernel = new MessageKernel();

  // 메시지 핸들러 인스턴스 생성 (모두 커널에 의존)
  // internalHandler : background <-> content
  const internalHandler = new InternalMessageHandler(messageKernel);
  // externalHandler : content <-> web
  const externalHandler = new ExternalMessageHandler(messageKernel);

  // 내부/외부 메시지 리스너 초기화
  internalHandler.initializeMessageListener();
  externalHandler.initializeMessageListener();

  // Confirmation UI 초기화
  const uiRoot = document.createElement('div');
  uiRoot.id = '8g-confirmation-ui-root';
  uiRoot.style.cssText = 'all: initial; position: fixed; z-index: 2147483647;';
  document.body.appendChild(uiRoot);

  const root = createRoot(uiRoot);
  root.render(<ConfirmationUIContainer />);

  console.log('[8G Extension] Confirmation UI mounted');
})();
