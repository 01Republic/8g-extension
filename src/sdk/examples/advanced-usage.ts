import { EightGClient } from '../index';
import type { Block } from '@/blocks';

// 고급 사용법 예제
class DataCollector {
  private client: EightGClient;
  private isInitialized = false;

  constructor() {
    this.client = new EightGClient({
      timeout: 60000,
      debug: false,
    });

    this.setupEventHandlers();
  }

  /**
   * 초기화
   */
  async initialize(): Promise<boolean> {
    try {
      const status = await this.client.checkExtension();
      this.isInitialized = status.installed;
      return this.isInitialized;
    } catch (error) {
      console.error('Failed to initialize:', error);
      return false;
    }
  }

  /**
   * 여러 페이지에서 데이터 수집
   */
  async collectFromMultiplePages(urls: string[]) {
    if (!this.isInitialized) {
      throw new Error('Collector not initialized');
    }

    const results = [];

    for (const url of urls) {
      try {
        console.log(`Collecting from: ${url}`);

        const block: Block = {
          name: 'get-text',
          selector: 'title',
          findBy: 'cssSelector',
          option: {
            waitForSelector: true,
            multiple: false,
          },
        };

        const result = await this.client.collectData({
          targetUrl: url,
          block,
          closeTabAfterCollection: true,
        });

        results.push({
          url,
          success: result.success,
          title: result.success ? result.data : null,
          error: result.error,
        });
      } catch (error) {
        results.push({
          url,
          success: false,
          title: null,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // 요청 간 딜레이
      await this.delay(1000);
    }

    return results;
  }

  /**
   * 복잡한 데이터 수집 (여러 요소)
   */
  async collectComplexData(url: string) {
    const blocks: Block[] = [
      {
        name: 'get-text',
        selector: 'h1',
        findBy: 'cssSelector',
        option: { waitForSelector: true, multiple: false },
      },
      {
        name: 'get-text',
        selector: '.description',
        findBy: 'cssSelector',
        option: { waitForSelector: true, multiple: true },
      },
      {
        name: 'attribute-value',
        selector: 'img',
        findBy: 'cssSelector',
        option: { waitForSelector: true, multiple: true },
      },
    ];

    const results = {};

    for (const [index, block] of blocks.entries()) {
      try {
        const result = await this.client.collectData({
          targetUrl: url,
          block,
          closeTabAfterCollection: index === blocks.length - 1, // 마지막만 탭 닫기
        });

        results[`block_${index}`] = result;
      } catch (error) {
        results[`block_${index}`] = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    return results;
  }

  /**
   * 이벤트 핸들러 설정
   */
  private setupEventHandlers(): void {
    this.client.on('ready', (status) => {
      console.log('🚀 8G Extension ready:', status);
    });

    this.client.on('error', (error) => {
      console.error('❌ SDK Error:', error);
    });

    this.client.on('collect-start', (data) => {
      console.log('📥 Collection started:', data.targetUrl);
    });

    this.client.on('collect-complete', (data) => {
      if (data.result.success) {
        console.log('✅ Collection completed:', data.result.targetUrl);
      } else {
        console.log('❌ Collection failed:', data.result.error);
      }
    });
  }

  /**
   * 딜레이 유틸리티
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 정리
   */
  destroy(): void {
    this.client.destroy();
  }
}

// 사용 예제
async function advancedExample() {
  const collector = new DataCollector();

  try {
    // 초기화
    const initialized = await collector.initialize();
    if (!initialized) {
      throw new Error('Failed to initialize data collector');
    }

    // 여러 페이지에서 타이틀 수집
    const urls = [
      'https://github.com',
      'https://stackoverflow.com',
      'https://developer.mozilla.org',
    ];

    console.log('=== Multiple Page Collection ===');
    const multiResults = await collector.collectFromMultiplePages(urls);
    console.log('Results:', multiResults);

    // 복잡한 데이터 수집
    console.log('\n=== Complex Data Collection ===');
    const complexResult = await collector.collectComplexData('https://example.com');
    console.log('Complex Results:', complexResult);
  } catch (error) {
    console.error('Advanced example failed:', error);
  } finally {
    collector.destroy();
  }
}

export { DataCollector, advancedExample };
