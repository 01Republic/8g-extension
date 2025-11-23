# 8G Monorepo

8G Extension과 8G Webapp을 통합한 모노레포 개발 환경입니다.

## 📁 프로젝트 구조

```
8g-monorepo/
├── packages/
│   ├── extension/           # 8G Chrome Extension
│   └── webapp/              # 8G Web Application
├── shared/                  # 공통 타입 및 유틸리티
├── tools/                   # 빌드 도구 및 스크립트
├── apps/                    # 개발 서버 등 앱
└── package.json            # Root workspace 설정
```

## 🚀 시작하기

### 의존성 설치

```bash
pnpm install
```

### 개발 모드

```bash
# 모든 패키지 병렬 개발 모드
pnpm dev

# 개별 패키지 개발 모드
pnpm dev:extension   # Extension 개발 모드
pnpm dev:webapp      # Webapp 개발 모드
```

### 빌드

```bash
# 모든 패키지 빌드
pnpm build

# 개별 패키지 빌드
pnpm build:extension   # Extension 빌드
pnpm build:webapp      # Webapp 빌드
```

## 🔧 개발 명령어

```bash
# 테스트
pnpm test              # 모든 테스트 실행
pnpm test:run          # 테스트 한 번만 실행

# 린트 및 포맷팅
pnpm lint              # ESLint 실행
pnpm lint:fix          # ESLint 자동 수정
pnpm format            # Prettier 포맷팅
pnpm format:check      # 포맷팅 확인

# 기타
pnpm typecheck         # TypeScript 타입 체크
pnpm clean             # 빌드 파일 정리
```

## 📦 패키지 설명

### packages/extension
- **설명**: 8G Chrome Extension (MV3)
- **빌드**: `dist/` 폴더에 extension.zip 생성
- **개발**: Chrome에서 `dist/` 폴더를 언팩드 확장으로 로드

### packages/webapp
- **설명**: 8G Web Application (React Router v7)
- **개발 서버**: `http://localhost:3000`
- **빌드**: `build/` 폴더에 정적 파일 생성

### shared
- **설명**: 공통 타입 정의 및 유틸리티
- **포함**: Workflow, Message 타입 등
- **사용**: `8g-shared` 패키지로 참조

## 🔄 워크플로우

1. **Extension에서 워크플로우 실행**
2. **Webapp에서 워크플로우 설계 및 테스트**
3. **Shared 패키지**로 타입 안전성 보장

## 📚 개발 가이드

### 새 공통 타입 추가
1. `shared/src/types/`에 타입 정의
2. `shared/src/index.ts`에서 export
3. 각 패키지에서 `8g-shared`로 import

### 의존성 관리
- 공통 devDependencies는 루트에 정의
- 패키지별 dependencies는 각 패키지에서 관리
- `workspace:*` 사용해 모노레포 내 의존성 참조

## 🛠️ 도구

- **패키지 매니저**: pnpm (workspace 기능)
- **TypeScript**: Project References로 빌드 최적화
- **빌드**: Vite (Extension, Webapp 모두)
- **테스트**: Vitest
- **린트**: ESLint + Prettier

---

더 자세한 정보는 각 패키지의 README를 참고하세요.