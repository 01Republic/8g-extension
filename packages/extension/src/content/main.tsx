import { createRoot } from 'react-dom/client';
import { MessageKernel } from './kernel/MessageKernel';
import { InternalMessageHandler } from './handler/InternalMessageHandler';
import { ExternalMessageHandler } from './handler/ExternalMessageHandler';
import { ExecutionStatusUIContainer } from './components/ExecutionStatusUI';
import { refreshLocaleFromBrowser } from '../locales';
import { initSentry } from '../utils/sentry';

// Initialize Sentry first
initSentry('content');

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
      // Shadow DOM 호스트 생성 (호스트 페이지의 DOM 조작으로부터 UI 격리)
      const shadowHost = document.createElement('div');
      shadowHost.id = '8g-extension-shadow-host';
      shadowHost.style.cssText = 'all: initial; position: fixed; top: 0; left: 0; width: 0; height: 0; z-index: 2147483647; pointer-events: none;';
      document.body.appendChild(shadowHost);

      // Shadow DOM 생성 (closed 모드로 외부 접근 차단)
      const shadowRoot = shadowHost.attachShadow({ mode: 'closed' });

      // Shadow DOM 내부에 React 루트 컨테이너 생성
      const confirmationRoot = document.createElement('div');
      confirmationRoot.id = '8g-confirmation-ui-root';
      shadowRoot.appendChild(confirmationRoot);

      // Shadow DOM 내부에서 사용할 스타일 주입 (keyframes 애니메이션 포함)
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        @keyframes wave-flow {
          0% {
            box-shadow:
              inset 0 0 0 2px rgba(168, 85, 247, 0.9),
              inset 0 0 0 8px rgba(168, 85, 247, 0.5),
              inset 0 0 0 16px rgba(168, 85, 247, 0.2);
          }
          25% {
            box-shadow:
              inset 0 0 0 4px rgba(168, 85, 247, 1),
              inset 0 0 0 10px rgba(168, 85, 247, 0.6),
              inset 0 0 0 18px rgba(168, 85, 247, 0.25);
          }
          50% {
            box-shadow:
              inset 0 0 0 3px rgba(168, 85, 247, 0.95),
              inset 0 0 0 12px rgba(168, 85, 247, 0.7),
              inset 0 0 0 20px rgba(168, 85, 247, 0.3);
          }
          75% {
            box-shadow:
              inset 0 0 0 2px rgba(168, 85, 247, 0.85),
              inset 0 0 0 9px rgba(168, 85, 247, 0.55),
              inset 0 0 0 17px rgba(168, 85, 247, 0.22);
          }
          100% {
            box-shadow:
              inset 0 0 0 2px rgba(168, 85, 247, 0.9),
              inset 0 0 0 8px rgba(168, 85, 247, 0.5),
              inset 0 0 0 16px rgba(168, 85, 247, 0.2);
          }
        }
      `;
      shadowRoot.appendChild(styleElement);

      const confirmationReactRoot = createRoot(confirmationRoot);
      confirmationReactRoot.render(<ExecutionStatusUIContainer />);

      console.log('[8G Extension] ExecutionStatusUI mounted in Shadow DOM (top frame only)');
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
