import { createRoot } from 'react-dom/client';
import { MessageKernel } from './kernel/MessageKernel';
import { InternalMessageHandler } from './handler/InternalMessageHandler';
import { ExternalMessageHandler } from './handler/ExternalMessageHandler';
import { ExecutionStatusUIContainer } from './components/ExecutionStatusUI';
import { SideModalContainer } from './components/SideModal';
import { refreshLocaleFromBrowser } from '../locales';

// Prevent multiple injections
(() => {
  if ((window as any).is8gExtensionInjected) return;
  (window as any).is8gExtensionInjected = true;

  console.log('[8G Extension] Content script initialized on:', window.location.href);

  // i18n 초기화 (브라우저 언어에서 자동 감지)
  refreshLocaleFromBrowser();

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

  // UI 초기화 (top frame에서만)
  const isTopFrame = window.self === window.top;

  if (isTopFrame) {
    const initUI = () => {
      const confirmationRoot = document.createElement('div');
      confirmationRoot.id = '8g-confirmation-ui-root';
      confirmationRoot.style.cssText = 'all: initial; position: fixed; z-index: 2147483647;';
      document.body.appendChild(confirmationRoot);

      const confirmationReactRoot = createRoot(confirmationRoot);
      confirmationReactRoot.render(<ExecutionStatusUIContainer />);

      // Side Modal 마운트
      const sideModalRoot = document.createElement('div');
      sideModalRoot.id = '8g-side-modal-root';
      sideModalRoot.style.cssText = 'all: initial; position: fixed; z-index: 2147483647;';
      document.body.appendChild(sideModalRoot);

      const sideModalReactRoot = createRoot(sideModalRoot);
      sideModalReactRoot.render(<SideModalContainer />);

      console.log('[8G Extension] UI Components mounted (top frame only)');
    };

    // document.body가 준비되면 UI 초기화
    if (document.body) {
      initUI();
    } else {
      document.addEventListener('DOMContentLoaded', initUI);
    }
  } else {
    console.log('[8G Extension] Skipping UI mount (inside iframe)');
  }
})();
