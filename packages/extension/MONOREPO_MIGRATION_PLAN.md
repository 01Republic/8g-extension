# 🏗️ 8G 모노레포 마이그레이션 Task Plan

## 📋 마이그레이션 개요

8G Extension과 8G Webapp을 하나의 모노레포로 통합하여 개발 효율성과 테스트 환경을 개선합니다.

**목표:**
- Extension 테스트를 위한 완벽한 통합 환경 구성
- 공통 코드 재사용 및 타입 안전성 강화
- 동시 개발 및 Hot Reload 지원
- 의존성 관리 효율화

## 🗂️ 최종 구조

```
8g-monorepo/
├── packages/
│   ├── extension/           # 기존 8g-extension
│   └── webapp/              # 기존 8g
├── shared/                  # 공통 코드
├── tools/                   # 빌드 도구
├── package.json            # Root workspace
├── pnpm-workspace.yaml
└── tsconfig.json
```

---

## 📝 Task List

### **Phase 1: 프로젝트 준비 & 설정** ⏱️ ~2시간

#### **Task 1.1: 새 모노레포 저장소 생성**
- [ ] 새 저장소 `8g-monorepo` 생성
- [ ] 기본 폴더 구조 생성
  ```bash
  mkdir -p packages/{extension,webapp}
  mkdir -p shared/{src/{types,utils,constants},tests}
  mkdir -p tools/{scripts,configs}
  mkdir -p apps/dev-server
  ```

#### **Task 1.2: 루트 설정 파일 생성**
- [ ] `pnpm-workspace.yaml` 작성
  ```yaml
  packages:
    - 'packages/*'
    - 'apps/*'
    - 'shared'
  ```
- [ ] 루트 `package.json` 작성 (workspace scripts 포함)
- [ ] 루트 `tsconfig.json` 작성 (project references)
- [ ] `.gitignore` 통합 및 정리
- [ ] `README.md` 업데이트

---

### **Phase 2: Extension 패키지 마이그레이션** ⏱️ ~1시간

#### **Task 2.1: Extension 코드 이동**
- [ ] `8g-extension/` 전체 내용을 `packages/extension/`로 복사
- [ ] `packages/extension/package.json` 수정
  - name: `"scordi-extension"`
  - workspace 관련 설정 추가
- [ ] `packages/extension/tsconfig.json` 수정
  - shared 패키지 참조 추가
  - 루트 설정 확장

#### **Task 2.2: Extension 빌드 설정 조정**
- [ ] `vite.config.ts` 경로 조정
- [ ] `manifest.config.ts` 검토 및 조정
- [ ] 빌드 스크립트 확인 및 테스트

---

### **Phase 3: Webapp 패키지 마이그레이션** ⏱️ ~1시간

#### **Task 3.1: Webapp 코드 이동**
- [ ] `8g/` 전체 내용을 `packages/webapp/`로 복사
- [ ] `packages/webapp/package.json` 수정
  - name: `"8g-webapp"`
  - `scordi-extension` 의존성을 `"workspace:*"`로 변경
- [ ] `packages/webapp/tsconfig.json` 수정
  - shared 패키지 참조 추가

#### **Task 3.2: Webapp 설정 조정**
- [ ] `server.js` 경로 조정 확인
- [ ] `vite.config.ts` 조정
- [ ] React Router 설정 검토

---

### **Phase 4: Shared 패키지 구성** ⏱️ ~2시간

#### **Task 4.1: 공통 타입 추출**
- [ ] `shared/src/types/workflow.ts` 생성
  - FormWorkflow, Step, Block 타입들 통합
- [ ] `shared/src/types/messages.ts` 생성
  - Extension ↔ Webapp 통신 타입들
- [ ] `shared/src/types/index.ts` 생성 (export 통합)

#### **Task 4.2: 공통 유틸리티 추출**
- [ ] `shared/src/utils/workflow-converter.ts` 생성
  - 워크플로우 JSON ↔ React Flow 변환 로직
- [ ] `shared/src/utils/validation.ts` 생성
  - 공통 검증 로직
- [ ] `shared/src/constants/block-schemas.ts` 생성
  - Block Zod 스키마 상수들

#### **Task 4.3: Shared 패키지 설정**
- [ ] `shared/package.json` 생성
- [ ] `shared/tsconfig.json` 생성
- [ ] Export 구조 정리 (`src/index.ts`)

---

### **Phase 5: 의존성 정리 & 최적화** ⏱️ ~1.5시간

#### **Task 5.1: 공통 Dependencies 호이스팅**
- [ ] 루트 `package.json`에 공통 devDependencies 이동
  - TypeScript, ESLint, Prettier, Vitest 등
- [ ] 각 패키지 `package.json`에서 중복 제거
- [ ] React 버전 통일 (19.x)

#### **Task 5.2: 버전 정리**
- [ ] 각 패키지별 버전 설정
  - extension: 현재 버전 유지 (1.18.14)
  - webapp: 1.0.0으로 초기화
  - shared: 1.0.0으로 시작

---

### **Phase 6: 빌드 & 개발 환경 구성** ⏱️ ~2시간

#### **Task 6.1: 워크스페이스 스크립트 구성**
- [ ] 루트 `package.json`에 통합 스크립트 추가
  ```json
  {
    "scripts": {
      "dev": "pnpm --parallel --filter=\"{packages/*}\" run dev",
      "dev:extension": "pnpm --filter=scordi-extension run dev",
      "dev:webapp": "pnpm --filter=8g-webapp run dev",
      "build": "pnpm run build:shared && pnpm run build:extension && pnpm run build:webapp",
      "build:shared": "pnpm --filter=8g-shared run build",
      "build:extension": "pnpm --filter=scordi-extension run build",
      "build:webapp": "pnpm --filter=8g-webapp run build",
      "test": "pnpm --recursive run test",
      "lint": "pnpm --recursive run lint",
      "clean": "pnpm --recursive run clean"
    }
  }
  ```

#### **Task 6.2: TypeScript Project References 설정**
- [ ] 루트 `tsconfig.json` project references 구성
- [ ] 각 패키지별 TypeScript 설정 조정
- [ ] 빌드 순서 의존성 설정 (shared → extension → webapp)

#### **Task 6.3: 개발 서버 통합 스크립트**
- [ ] `tools/scripts/dev.js` 생성 (병렬 개발 서버 실행)
- [ ] Hot Reload 설정 확인
- [ ] 포트 충돌 방지 설정

---

### **Phase 7: 통합 테스트 & 검증** ⏱️ ~2시간

#### **Task 7.1: 빌드 테스트**
- [ ] `pnpm install` 실행 및 의존성 설치 확인
- [ ] `pnpm run build` 실행 및 모든 패키지 빌드 성공 확인
- [ ] Extension 빌드 결과물 검증 (dist/extension.zip)
- [ ] Webapp 빌드 결과물 검증

#### **Task 7.2: 개발 환경 테스트**
- [ ] `pnpm dev:extension` 실행 테스트
- [ ] Chrome 확장 로드 및 Hot Reload 확인
- [ ] `pnpm dev:webapp` 실행 테스트 (localhost:3000)
- [ ] Extension ↔ Webapp 통신 테스트

#### **Task 7.3: 통합 워크플로우 테스트**
- [ ] 워크플로우 생성 → 실행 → 결과 확인 E2E 테스트
- [ ] 모든 Block 타입 동작 확인
- [ ] 타입 안전성 검증 (TypeScript 컴파일 에러 없음)

---

### **Phase 8: 문서화 & 마이그레이션 완료** ⏱️ ~1시간

#### **Task 8.1: 문서 업데이트**
- [ ] 루트 `README.md` 업데이트
  - 모노레포 구조 설명
  - 개발 환경 설정 가이드
  - 빌드 & 배포 가이드
- [ ] `packages/extension/CLAUDE.md` 업데이트
- [ ] `packages/webapp/CLAUDE.md` 업데이트

#### **Task 8.2: 기존 저장소 아카이브**
- [ ] 기존 `8g-extension` 저장소에 마이그레이션 공지 추가
- [ ] 기존 `8g` 저장소에 마이그레이션 공지 추가
- [ ] 새 저장소 링크 안내

---

## 🚀 실행 순서

### **우선순위 높음 (필수)**
1. **Phase 1** → **Phase 2** → **Phase 3** → **Phase 7.2**
   - 기본적인 개발 환경 구성까지

### **우선순위 중간 (개선)**
2. **Phase 4** → **Phase 5** → **Phase 6**
   - 공통 코드 추출 및 최적화

### **우선순위 낮음 (완성)**
3. **Phase 7** → **Phase 8**
   - 완전한 테스트 및 문서화

---

## 📋 체크리스트 요약

- [ ] **Phase 1**: 프로젝트 준비 & 설정 ⏱️ ~2시간
- [ ] **Phase 2**: Extension 마이그레이션 ⏱️ ~1시간
- [ ] **Phase 3**: Webapp 마이그레이션 ⏱️ ~1시간
- [ ] **Phase 4**: Shared 패키지 구성 ⏱️ ~2시간
- [ ] **Phase 5**: 의존성 정리 & 최적화 ⏱️ ~1.5시간
- [ ] **Phase 6**: 빌드 & 개발 환경 구성 ⏱️ ~2시간
- [ ] **Phase 7**: 통합 테스트 & 검증 ⏱️ ~2시간
- [ ] **Phase 8**: 문서화 & 마이그레이션 완료 ⏱️ ~1시간

**총 예상 시간: ~12.5시간**

---

## 💡 주의사항

1. **백업**: 기존 프로젝트 백업 후 진행
2. **브랜치**: 각 Phase별로 브랜치 생성 권장
3. **테스트**: 각 Phase 완료 후 기본 동작 확인
4. **의존성**: pnpm 캐시 초기화 필요 시 `pnpm store prune`
5. **포트**: 개발 서버 포트 충돌 주의 (Extension: Vite default, Webapp: 3000)

---

**🎯 이 계획을 따라 진행하면 완벽한 8G 모노레포 개발 환경이 완성됩니다!**