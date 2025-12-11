import {
  BrowserClient,
  defaultStackParser,
  getDefaultIntegrations,
  makeFetchTransport,
  Scope,
} from '@sentry/browser';

// Chrome Extension용 Sentry 클라이언트와 스코프
let sentryScope: Scope | null = null;

export function initSentry(context: 'background' | 'content') {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  console.log(`[Sentry] DSN value: ${dsn ? 'configured' : 'empty'}`);

  if (!dsn) {
    console.warn('[Sentry] DSN not configured, skipping initialization');
    return;
  }

  // Chrome Extension에서는 전역 상태를 사용하는 통합을 제외해야 함
  const integrations = getDefaultIntegrations({}).filter((integration) => {
    return !['BrowserApiErrors', 'Breadcrumbs', 'GlobalHandlers'].includes(integration.name);
  });

  const client = new BrowserClient({
    dsn,
    transport: makeFetchTransport,
    stackParser: defaultStackParser,
    integrations,
    environment: import.meta.env.MODE,
  });

  sentryScope = new Scope();
  sentryScope.setClient(client);
  sentryScope.setTag('context', context);
  client.init();

  console.log(`[Sentry] Initialized for ${context}`);
}

// 수동 Breadcrumb 추가 (중요 이벤트용)
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>
) {
  if (!sentryScope) return;

  sentryScope.addBreadcrumb({
    category,
    message,
    level: 'info',
    data,
  });
}

// 에러 캡처 헬퍼
export function captureError(error: Error, extra?: Record<string, unknown>) {
  if (!sentryScope) {
    console.warn('[Sentry] Not initialized, cannot capture error');
    return;
  }

  sentryScope.captureException(error, {
    captureContext: {
      extra,
    },
  });
}

// 테스트용 함수 (Sentry 연결 확인)
export function testSentryConnection() {
  console.log('[Sentry] Sending test error...');
  captureError(new Error('Sentry test error - connection verified'));
  console.log('[Sentry] Test error sent! Check Sentry dashboard.');
}
