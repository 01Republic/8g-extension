import { EightGClient, EightGError } from '../index';
import type { Block } from '@/blocks';

// 기본 사용법 예제
async function basicUsage() {
  // 1. SDK 클라이언트 생성
  const client = new EightGClient({
    timeout: 30000,
    debug: true,
  });

  // 2. Extension 준비 상태 확인
  client.on('ready', (status) => {
    console.log('Extension ready:', status);
  });

  client.on('error', (error) => {
    console.error('SDK Error:', error);
  });

  // 3. 데이터 수집 이벤트 리스너
  client.on('collect-start', (data) => {
    console.log('Collection started:', data);
  });

  client.on('collect-complete', (data) => {
    console.log('Collection completed:', data);
  });

  try {
    // 4. Extension 설치 확인
    const status = await client.checkExtension();
    console.log('Extension status:', status);

    // 5. 데이터 수집 요청
    const block: Block = {
      name: 'get-text',
      selector: 'h1',
      findBy: 'cssSelector',
      option: {
        waitForSelector: true,
        waitSelectorTimeout: 5000,
        multiple: false,
      },
    };

    const result = await client.collectData({
      targetUrl: 'https://example.com',
      block,
      closeTabAfterCollection: true,
      activateTab: false,
    });

    console.log('Collection result:', result);

    if (result.success) {
      console.log('Collected data:', result.data);
    } else {
      console.error('Collection failed:', result.error);
    }
  } catch (error) {
    if (error instanceof EightGError) {
      switch (error.code) {
        case 'EXTENSION_NOT_FOUND':
          console.error('Please install the 8G Extension');
          break;
        case 'TIMEOUT':
          console.error('Request timed out');
          break;
        case 'COLLECTION_FAILED':
          console.error('Data collection failed:', error.message);
          break;
        default:
          console.error('SDK Error:', error.message);
      }
    } else {
      console.error('Unknown error:', error);
    }
  } finally {
    // 6. 정리
    client.destroy();
  }
}

// 실행
basicUsage().catch(console.error);
