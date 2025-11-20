import { createRoot } from 'react-dom/client';
import { MessageKernel } from './kernel/MessageKernel';
import { InternalMessageHandler } from './handler/InternalMessageHandler';
import { ExternalMessageHandler } from './handler/ExternalMessageHandler';
import { ConfirmationUIContainer } from './components/ConfirmationUI';
import { ExecutionStatusUIContainer } from './components/ExecutionStatusUI';
import CheckStatusUI from './components/CheckStatusUI';

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

  // UI 초기화 (top frame에서만)
  const isTopFrame = window.self === window.top;

  if (isTopFrame) {
    const initUI = () => {
      // Confirmation UI 마운트
      const confirmationRoot = document.createElement('div');
      confirmationRoot.id = '8g-confirmation-ui-root';
      confirmationRoot.style.cssText = 'all: initial; position: fixed; z-index: 2147483647;';
      document.body.appendChild(confirmationRoot);

      const confirmationReactRoot = createRoot(confirmationRoot);
      confirmationReactRoot.render(<ConfirmationUIContainer />);

      // Execution Status UI 마운트
      const executionStatusRoot = document.createElement('div');
      executionStatusRoot.id = '8g-execution-status-ui-root';
      executionStatusRoot.style.cssText = 'all: initial; position: fixed; z-index: 2147483647;';
      document.body.appendChild(executionStatusRoot);

      const executionStatusReactRoot = createRoot(executionStatusRoot);
      executionStatusReactRoot.render(<ExecutionStatusUIContainer />);

      // Check Status UI 마운트
      const checkStatusRoot = document.createElement('div');
      checkStatusRoot.id = '8g-check-status-ui-root';
      checkStatusRoot.style.cssText = 'all: initial; position: fixed; z-index: 2147483647;';
      document.body.appendChild(checkStatusRoot);

      let checkStatusReactRoot: any = null;
      let checkStatusUIProps: any = null;

      // Check Status UI 이벤트 리스너
      window.addEventListener('8g-show-check-status', ((event: CustomEvent) => {
        const detail = event.detail;
        checkStatusUIProps = detail;
        
        if (!checkStatusReactRoot) {
          checkStatusReactRoot = createRoot(checkStatusRoot);
        }
        
        checkStatusReactRoot.render(
          <CheckStatusUI
            checkType={detail.checkType}
            title={detail.title}
            description={detail.description}
            onConfirm={detail.onConfirm}
            onCancel={detail.onCancel}
          />
        );
      }) as EventListener);

      window.addEventListener('8g-hide-check-status', () => {
        if (checkStatusReactRoot) {
          checkStatusReactRoot.render(<></>);
        }
      });

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
