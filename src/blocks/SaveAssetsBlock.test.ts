import { describe, it, expect, beforeEach } from 'vitest';
import { handlerSaveAssets, SaveAssetsBlock } from './SaveAssetsBlock';

describe('handlerSaveAssets 테스트', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="test-container">
        <img src="https://example.com/image1.jpg" alt="이미지 1">
        <img src="https://example.com/image2.png" alt="이미지 2">
        <video src="https://example.com/video1.mp4"></video>
        <audio src="https://example.com/audio1.mp3"></audio>
        <source src="https://example.com/source1.webm" type="video/webm">
        <img src="" alt="빈 이미지">
        <img alt="src 없는 이미지">
      </div>
    `;
  });

  const baseData: SaveAssetsBlock = {
    name: 'save-assets',
    selector: 'img, video, audio, source',
    findBy: 'cssSelector',
    option: { multiple: true },
    isBlock: true,
  };

  describe('기본 자산 추출', () => {
    it('요소 없으면 빈 배열 반환', async () => {
      const data = { ...baseData, selector: '.non-existent' };
      const result = await handlerSaveAssets(data);

      expect(result.data).toEqual([]);
      expect(result.hasError).toBeFalsy();
    });

    it('미디어 요소 src 추출', async () => {
      const result = await handlerSaveAssets(baseData);

      expect(result.data).toContain('https://example.com/image1.jpg');
      expect(result.data).toContain('https://example.com/image2.png');
      expect(result.data).toContain('https://example.com/video1.mp4');
      expect(result.data).toContain('https://example.com/audio1.mp3');
      expect(result.data).toContain('https://example.com/source1.webm');
    });

    it('중복 URL 제거', async () => {
      // 같은 이미지 추가
      const extraImg = document.createElement('img');
      extraImg.src = 'https://example.com/image1.jpg';
      document.body.appendChild(extraImg);

      const result = await handlerSaveAssets(baseData);

      const duplicateCount = (result.data as string[]).filter(
        (url) => url === 'https://example.com/image1.jpg'
      ).length;
      expect(duplicateCount).toBe(1);
    });

    it('빈 src 필터링', async () => {
      const result = await handlerSaveAssets(baseData);

      expect((result.data as string[]).every((url) => url && url.trim() !== '')).toBe(true);
      expect(result.data).not.toContain('');
    });
  });

  describe('개별 요소 테스트', () => {
    it('이미지만 추출', async () => {
      const data = { ...baseData, selector: 'img' };
      const result = await handlerSaveAssets(data);

      expect(result.data).toContain('https://example.com/image1.jpg');
      expect(result.data).toContain('https://example.com/image2.png');
      expect(result.data).not.toContain('https://example.com/video1.mp4');
    });

    it('비디오만 추출', async () => {
      const data = { ...baseData, selector: 'video' };
      const result = await handlerSaveAssets(data);

      expect(result.data).toContain('https://example.com/video1.mp4');
      expect(result.data).not.toContain('https://example.com/image1.jpg');
    });

    it('오디오만 추출', async () => {
      const data = { ...baseData, selector: 'audio' };
      const result = await handlerSaveAssets(data);

      expect(result.data).toContain('https://example.com/audio1.mp3');
      expect(result.data).not.toContain('https://example.com/image1.jpg');
    });

    it('source 태그만 추출', async () => {
      const data = { ...baseData, selector: 'source' };
      const result = await handlerSaveAssets(data);

      expect(result.data).toContain('https://example.com/source1.webm');
      expect(result.data).not.toContain('https://example.com/image1.jpg');
    });
  });

  describe('XPath 테스트', () => {
    it('XPath로 이미지 추출', async () => {
      const data = { ...baseData, selector: '//img', findBy: 'xpath' as const };
      const result = await handlerSaveAssets(data);

      expect(result.data).toContain('https://example.com/image1.jpg');
      expect(result.data).toContain('https://example.com/image2.png');
    });

    it('XPath로 비디오 추출', async () => {
      const data = { ...baseData, selector: '//video', findBy: 'xpath' as const };
      const result = await handlerSaveAssets(data);

      expect(result.data).toContain('https://example.com/video1.mp4');
    });

    it('XPath로 특정 속성 가진 요소 추출', async () => {
      const data = { ...baseData, selector: '//*[@src]', findBy: 'xpath' as const };
      const result = await handlerSaveAssets(data);

      expect((result.data as string[]).length).toBeGreaterThan(0);
      expect(result.data).toContain('https://example.com/image1.jpg');
      expect(result.data).toContain('https://example.com/video1.mp4');
    });
  });

  describe('에러 처리', () => {
    it('단일 요소 선택 (multiple: false)', async () => {
      const data = { ...baseData, option: { multiple: false } };
      const result = await handlerSaveAssets(data);

      // multiple: false일 때는 빈 배열 반환 (배열이 아닌 단일 요소 반환되므로)
      expect(result.data).toEqual([]);
    });

    it('src 속성 없는 요소 처리', async () => {
      const noSrcImg = document.createElement('img');
      noSrcImg.alt = 'No src';
      document.body.appendChild(noSrcImg);

      const result = await handlerSaveAssets(baseData);

      // src가 없으면 빈 문자열이 되고, 이는 필터링됨
      expect((result.data as string[]).every((url) => url && url.trim() !== '')).toBe(true);
    });
  });
});
