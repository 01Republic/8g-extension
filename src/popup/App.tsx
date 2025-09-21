import { useState } from 'react';
import crxLogo from '@/assets/crx.svg';
import './App.css';
import { GetElementDataBlock } from '@/blocks/GetElementDataBlock';
import { EightGClient } from '@/sdk';

export default function App() {
  const [isCollecting, setIsCollecting] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const sampleBlocks: GetElementDataBlock[] = [
    // Slack workspace titles의 id와 text를 한번에 multiple로 수집
    {
      name: 'get-element-data',
      selector: 'span.ss-c-workspace-detail__title',
      findBy: 'cssSelector',
      includeText: true, // text 포함
      attributes: ['id'], // id 속성 포함
      option: {
        waitForSelector: true,
        waitSelectorTimeout: 5000,
        multiple: true,
      },
    },
  ];

  const handleTestCollection = async () => {
    setIsCollecting(true);
    setResults([]);

    try {
      const client = new EightGClient();
      const targetUrl = 'https://slack.com/intl/ko-kr';

      for (const [index, block] of sampleBlocks.entries()) {
        try {
          console.log(`Testing block ${index + 1}:`, block);

          // SDK를 통한 데이터 수집
          const response = await client.collectData({
            targetUrl,
            block,
          });

          console.log('SDK Response:', response);

          setResults((prev) => [
            ...prev,
            {
              blockIndex: index + 1,
              blockName: block.name,
              success: response?.success || false,
              data: response?.data || null,
              error: response?.error || null,
            },
          ]);
        } catch (error) {
          setResults((prev) => [
            ...prev,
            {
              blockIndex: index + 1,
              blockName: block.name,
              success: false,
              data: null,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          ]);
        }

        // 블록 간 딜레이
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error('Collection failed:', error);
    } finally {
      setIsCollecting(false);
    }
  };

  return (
    <div className="automa-popup" style={{ padding: '16px', width: '400px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <img
          src={crxLogo}
          alt="Automa Logo"
          className="automa-logo"
          style={{ width: '32px', height: '32px', marginRight: '12px' }}
        />
        <h1 className="automa-title" style={{ margin: 0, fontSize: '18px' }}>
          8G Extension
        </h1>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Slack Workspace Title 수집 테스트</h3>
        <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#666' }}>
          Target: https://slack.com/intl/ko-kr
          <br />
          Selector: span.ss-c-workspace-detail__title
          <br />
          수집 데이터: id + text (multiple)
        </p>

        <button
          onClick={handleTestCollection}
          disabled={isCollecting}
          style={{
            padding: '8px 16px',
            backgroundColor: isCollecting ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isCollecting ? 'not-allowed' : 'pointer',
            fontSize: '12px',
          }}
        >
          {isCollecting ? '수집 중...' : '샘플 데이터 수집 실행'}
        </button>
      </div>

      {results.length > 0 && (
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>수집 결과:</h4>
          {results.map((result, index) => (
            <div
              key={index}
              style={{
                padding: '8px',
                marginBottom: '8px',
                backgroundColor: result.success ? '#f0f8ff' : '#ffe6e6',
                border: `1px solid ${result.success ? '#4CAF50' : '#f44336'}`,
                borderRadius: '4px',
                fontSize: '11px',
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                Block {result.blockIndex}: {result.blockName}
              </div>

              {result.success ? (
                <div>
                  <div style={{ color: '#4CAF50', marginBottom: '4px' }}>✅ 성공</div>
                  <div style={{ backgroundColor: '#fff', padding: '4px', borderRadius: '2px' }}>
                    <pre style={{ margin: 0, fontSize: '10px', whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ color: '#f44336', marginBottom: '4px' }}>❌ 실패</div>
                  <div style={{ color: '#f44336', fontSize: '10px' }}>{result.error}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '16px', fontSize: '10px', color: '#888' }}>
        <details>
          <summary style={{ cursor: 'pointer' }}>샘플 Block 코드 보기</summary>
          <pre
            style={{
              backgroundColor: '#f5f5f5',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '9px',
              overflowX: 'auto',
              marginTop: '8px',
            }}
          >
            {`// ID와 Text를 한번에 수집 (multiple)
{
  name: 'get-element-data',
  selector: 'span.ss-c-workspace-detail__title',
  findBy: 'cssSelector',
  includeText: true,      // text 포함
  attributes: ['id'],     // id 속성 포함
  option: {
    waitForSelector: true,
    waitSelectorTimeout: 5000,
    multiple: true
  }
}

// 예상 결과:
// [
//   { 
//     text: "Workspace 1", 
//     attributes: { id: "workspace-1" } 
//   },
//   { 
//     text: "Workspace 2", 
//     attributes: { id: "workspace-2" } 
//   },
//   ...
// ]`}
          </pre>
        </details>
      </div>
    </div>
  );
}
