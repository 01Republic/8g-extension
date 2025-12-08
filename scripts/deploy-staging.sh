#!/bin/bash

# =============================================================================
# deploy-staging.sh
# Google Drive를 통해 확장프로그램 스테이징 배포
#
# 사용법:
#   pnpm deploy:staging [옵션]
#
# 옵션:
#   -y              버전 확인을 자동으로 승인
#   -b, --bump      버전 업데이트 후 배포 (기본값: patch, patch|minor|major 선택 가능)
#   --patch         patch 버전 올린 후 배포 (-b patch 와 동일)
#   --minor         minor 버전 올린 후 배포 (-b minor 와 동일)
#   --major         major 버전 올린 후 배포 (-b major 와 동일)
#   -h, --help      도움말 출력
#
# 예시:
#   pnpm deploy:staging              # 일반 배포
#   pnpm deploy:staging -y           # 확인 없이 배포
#   pnpm deploy:staging -b           # patch 버전 올린 후 배포 (기본값)
#   pnpm deploy:staging --patch      # patch 버전 올린 후 배포
#   pnpm deploy:staging --minor -y   # minor 버전 올리고 확인 없이 배포
# =============================================================================

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 설정
STAGING_FOLDER_NAME="scordi-extension-staging"

# 옵션 기본값
AUTO_YES=false
BUMP_TYPE=""

# 스크립트 위치 기준으로 프로젝트 루트 찾기
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# .env 파일에서 환경변수 로드
if [ -f "$PROJECT_ROOT/.env" ]; then
    # .env 파일에서 GOOGLE_DRIVE_PATH와 KEEP_STAGING_VERSIONS 읽기
    # 이미 환경변수로 설정된 경우 덮어쓰지 않음
    while IFS='=' read -r key value; do
        # 주석과 빈 줄 무시
        [[ "$key" =~ ^#.*$ ]] && continue
        [[ -z "$key" ]] && continue
        # 따옴표 제거
        value=$(echo "$value" | sed 's/^["'"'"']//;s/["'"'"']$//')
        # 해당 키만 처리
        if [[ "$key" == "GOOGLE_DRIVE_PATH" && -z "$GOOGLE_DRIVE_PATH" ]]; then
            export GOOGLE_DRIVE_PATH="$value"
        elif [[ "$key" == "KEEP_STAGING_VERSIONS" && -z "$KEEP_STAGING_VERSIONS" ]]; then
            export KEEP_STAGING_VERSIONS="$value"
        fi
    done < "$PROJECT_ROOT/.env"
fi

# KEEP_STAGING_VERSIONS 기본값 설정
KEEP_STAGING_VERSIONS=${KEEP_STAGING_VERSIONS:-1}

# =============================================================================
# 도움말 함수
# =============================================================================

show_help() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  deploy:staging - 크롬 확장프로그램 스테이징 배포 스크립트"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "사용법:"
    echo "  pnpm deploy:staging [옵션]"
    echo ""
    echo "옵션:"
    echo "  -y              버전 확인 프롬프트를 건너뛰고 자동으로 승인"
    echo "  -b, --bump      버전을 올린 후 배포 (기본값: patch, patch|minor|major 선택 가능)"
    echo "  --patch         patch 버전 올린 후 배포 (-b patch 와 동일)"
    echo "  --minor         minor 버전 올린 후 배포 (-b minor 와 동일)"
    echo "  --major         major 버전 올린 후 배포 (-b major 와 동일)"
    echo "  -h, --help      이 도움말 출력"
    echo ""
    echo "예시:"
    echo "  pnpm deploy:staging              # 현재 버전으로 배포 (확인 필요)"
    echo "  pnpm deploy:staging -y           # 현재 버전으로 즉시 배포"
    echo "  pnpm deploy:staging -b           # patch 버전 올린 후 배포 (기본값)"
    echo "  pnpm deploy:staging --patch      # patch 버전 올린 후 배포 (1.19.18 → 1.19.19)"
    echo "  pnpm deploy:staging --minor      # minor 버전 올린 후 배포 (1.19.18 → 1.20.0)"
    echo "  pnpm deploy:staging --major      # major 버전 올린 후 배포 (1.19.18 → 2.0.0)"
    echo "  pnpm deploy:staging -b -y        # patch 버전 올리고 즉시 배포"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  세부사항"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "취지:"
    echo "  이 스크립트는 개발팀이 크롬 확장프로그램을 쉽게 테스트할 수 있도록"
    echo "  Google Drive 공유 폴더를 통해 빌드된 확장프로그램을 배포합니다."
    echo "  모든 개발자가 같은 Google Drive 폴더를 로컬에 마운트하고 있으므로,"
    echo "  한 명이 배포하면 모두가 최신 버전을 동기화 받을 수 있습니다."
    echo ""
    echo "동작 방식:"
    echo "  1. 환경변수 및 Google Drive 경로 검증"
    echo "  2. (--bump 옵션 시) 버전 업데이트 + git commit + push"
    echo "  3. 배포할 버전 확인 후 사용자 승인 대기"
    echo "  4. 확장프로그램 빌드 (pnpm --filter=scordi-extension run build:extension)"
    echo "  5. 기존 스테이징 폴더를 타임스탬프와 함께 아카이브"
    echo "  6. 오래된 아카이브 정리 (KEEP_STAGING_VERSIONS 개수만큼 유지)"
    echo "  7. 새 빌드를 Google Drive에 압축 해제하여 배포"
    echo ""
    echo "환경변수:"
    echo "  GOOGLE_DRIVE_PATH       (필수) Google Drive 마운트 경로"
    echo "  KEEP_STAGING_VERSIONS   (선택) 유지할 이전 버전 수 (기본값: 1)"
    echo ""
    echo "  * 환경변수는 .env 파일에 설정하거나 쉘에서 export 할 수 있습니다."
    echo ""
    echo "배포 후 (중요!):"
    echo "  Google Drive 동기화가 완료되면, 모든 개발자가 각자의 크롬에서"
    echo "  확장프로그램을 새로고침해야 최신 버전이 적용됩니다."
    echo ""
    echo "  각 개발자 작업:"
    echo "    1. chrome://extensions 접속"
    echo "    2. 개발자 모드 확인"
    echo "    3. 확장프로그램 새로고침 버튼 클릭 (또는 '압축해제된 확장프로그램을 로드합니다' 재실행)"
    echo ""
    echo "  * 배포자가 새로고침해도 다른 개발자의 크롬에는 자동 반영되지 않습니다."
    echo ""
    exit 0
}

# =============================================================================
# 인자 파싱
# =============================================================================

while [[ $# -gt 0 ]]; do
    case $1 in
        -y)
            AUTO_YES=true
            shift
            ;;
        -b|--bump)
            # 다음 인자가 없거나 다른 옵션이면 기본값 patch 사용
            if [[ -z "$2" || "$2" == -* ]]; then
                BUMP_TYPE="patch"
                shift
            elif [[ "$2" =~ ^(patch|minor|major)$ ]]; then
                BUMP_TYPE="$2"
                shift 2
            else
                echo -e "${RED}[ERROR]${NC} 유효하지 않은 버전 타입: $2 (patch|minor|major 중 선택)"
                exit 1
            fi
            ;;
        --patch)
            BUMP_TYPE="patch"
            shift
            ;;
        --minor)
            BUMP_TYPE="minor"
            shift
            ;;
        --major)
            BUMP_TYPE="major"
            shift
            ;;
        -h|--help)
            show_help
            ;;
        *)
            echo -e "${RED}[ERROR]${NC} 알 수 없는 옵션: $1"
            echo "도움말: pnpm deploy:staging --help"
            exit 1
            ;;
    esac
done

# =============================================================================
# 유틸리티 함수
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# =============================================================================
# 1. 환경변수 검증
# =============================================================================

log_info "환경변수 검증 중..."

if [ -z "$GOOGLE_DRIVE_PATH" ]; then
    log_error "GOOGLE_DRIVE_PATH가 설정되지 않았습니다."
    echo ""
    echo ".env 파일에 다음을 추가하세요:"
    echo "  GOOGLE_DRIVE_PATH=\"/path/to/your/google-drive\""
    echo ""
    exit 1
fi

# =============================================================================
# 2. Google Drive 경로 접근 가능 여부 확인
# =============================================================================

log_info "Google Drive 경로 확인 중: $GOOGLE_DRIVE_PATH"

if [ ! -d "$GOOGLE_DRIVE_PATH" ]; then
    log_error "Google Drive 경로에 접근할 수 없습니다: $GOOGLE_DRIVE_PATH"
    exit 1
fi

if [ ! -w "$GOOGLE_DRIVE_PATH" ]; then
    log_error "Google Drive 경로에 쓰기 권한이 없습니다: $GOOGLE_DRIVE_PATH"
    exit 1
fi

log_success "Google Drive 경로 확인 완료"

# =============================================================================
# 3. 버전 bump (옵션)
# =============================================================================

EXTENSION_PKG="$PROJECT_ROOT/packages/extension/package.json"

# 버전 bump 함수
bump_version() {
    local current="$1"
    local type="$2"

    IFS='.' read -r major minor patch <<< "$current"

    case $type in
        major)
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        minor)
            minor=$((minor + 1))
            patch=0
            ;;
        patch)
            patch=$((patch + 1))
            ;;
    esac

    echo "${major}.${minor}.${patch}"
}

CURRENT_VERSION=$(grep '"version"' "$EXTENSION_PKG" | sed 's/.*"version": *"\([^"]*\)".*/\1/')

if [ -n "$BUMP_TYPE" ]; then
    NEW_VERSION=$(bump_version "$CURRENT_VERSION" "$BUMP_TYPE")

    echo ""
    echo "=============================================="
    echo -e "  ${YELLOW}버전 업데이트: v${CURRENT_VERSION} → v${NEW_VERSION}${NC}"
    echo "=============================================="
    echo ""

    if [ "$AUTO_YES" = false ]; then
        read -p "버전을 업데이트하고 배포를 진행하시겠습니까? (y/N): " confirm
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            log_warning "배포가 취소되었습니다."
            exit 0
        fi
        echo ""
    fi

    # package.json 버전 업데이트
    log_info "버전 업데이트 중: v${NEW_VERSION}"
    sed -i '' "s/\"version\": *\"${CURRENT_VERSION}\"/\"version\": \"${NEW_VERSION}\"/" "$EXTENSION_PKG"

    # Git 커밋 및 푸시
    log_info "Git 커밋 및 푸시 중..."
    cd "$PROJECT_ROOT"
    git add "$EXTENSION_PKG"
    git commit -m "chore: release v${NEW_VERSION}"
    git push

    log_success "버전 업데이트 완료: v${NEW_VERSION}"

    # 현재 버전 갱신
    CURRENT_VERSION="$NEW_VERSION"
else
    # =============================================================================
    # 4. 버전 확인 및 사용자 승인
    # =============================================================================

    echo ""
    echo "=============================================="
    echo -e "  ${YELLOW}배포할 확장프로그램 버전: v${CURRENT_VERSION}${NC}"
    echo "=============================================="
    echo ""

    if [ "$AUTO_YES" = false ]; then
        read -p "이 버전으로 스테이징 배포를 진행하시겠습니까? (y/N): " confirm
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            log_warning "배포가 취소되었습니다."
            exit 0
        fi
        echo ""
    fi
fi

# =============================================================================
# 5. 확장프로그램 빌드
# =============================================================================

log_info "확장프로그램 빌드 시작..."

cd "$PROJECT_ROOT"

# extension 패키지의 build:extension 스크립트 실행 (SDK 빌드 + 크롬 확장프로그램 빌드 + zip 생성)
if ! pnpm --filter=scordi-extension run build:extension; then
    log_error "빌드에 실패했습니다."
    exit 1
fi

log_success "빌드 완료"

# =============================================================================
# 6. 빌드된 zip 파일 확인
# =============================================================================

log_info "빌드된 zip 파일 확인 중..."

RELEASE_DIR="$PROJECT_ROOT/packages/extension/release"
ZIP_FILE=$(ls -t "$RELEASE_DIR"/*.zip 2>/dev/null | head -n 1)

if [ -z "$ZIP_FILE" ]; then
    log_error "빌드된 zip 파일을 찾을 수 없습니다: $RELEASE_DIR"
    exit 1
fi

log_success "zip 파일 발견: $(basename "$ZIP_FILE")"

# =============================================================================
# 7. 기존 스테이징 폴더 아카이브
# =============================================================================

STAGING_PATH="$GOOGLE_DRIVE_PATH/$STAGING_FOLDER_NAME"

if [ -d "$STAGING_PATH" ]; then
    TIMESTAMP=$(date +"%y%m%d_%H%M%S")
    ARCHIVE_NAME="${STAGING_FOLDER_NAME}.archived_at-${TIMESTAMP}"
    ARCHIVE_PATH="$GOOGLE_DRIVE_PATH/$ARCHIVE_NAME"

    log_info "기존 스테이징 폴더 아카이브 중: $ARCHIVE_NAME"
    mv "$STAGING_PATH" "$ARCHIVE_PATH"
    log_success "아카이브 완료"
fi

# =============================================================================
# 8. 오래된 버전 정리
# =============================================================================

log_info "오래된 버전 정리 중 (유지: $KEEP_STAGING_VERSIONS개)..."

# archived_at 패턴으로 시작하는 폴더들을 찾아서 오래된 순으로 정렬
ARCHIVED_FOLDERS=$(ls -d "$GOOGLE_DRIVE_PATH/${STAGING_FOLDER_NAME}.archived_at-"* 2>/dev/null | sort || true)
ARCHIVED_COUNT=$(echo "$ARCHIVED_FOLDERS" | grep -c . 2>/dev/null || echo 0)

if [ "$ARCHIVED_COUNT" -gt "$KEEP_STAGING_VERSIONS" ]; then
    DELETE_COUNT=$((ARCHIVED_COUNT - KEEP_STAGING_VERSIONS))

    echo "$ARCHIVED_FOLDERS" | head -n "$DELETE_COUNT" | while read -r folder; do
        if [ -n "$folder" ] && [ -d "$folder" ]; then
            log_warning "삭제: $(basename "$folder")"
            rm -rf "$folder"
        fi
    done

    log_success "오래된 버전 $DELETE_COUNT개 삭제 완료"
else
    log_info "삭제할 오래된 버전 없음"
fi

# =============================================================================
# 9. zip 파일 복사
# =============================================================================

log_info "zip 파일 복사 중..."

DEST_ZIP="$GOOGLE_DRIVE_PATH/$(basename "$ZIP_FILE")"
cp "$ZIP_FILE" "$DEST_ZIP"

log_success "zip 파일 복사 완료"

# =============================================================================
# 10. 압축 해제
# =============================================================================

log_info "압축 해제 중..."

# 임시 디렉토리에 먼저 압축 해제
TEMP_DIR=$(mktemp -d)
unzip -q "$DEST_ZIP" -d "$TEMP_DIR"

# 압축 해제된 내용을 스테이징 폴더로 이동
mkdir -p "$STAGING_PATH"
mv "$TEMP_DIR"/* "$STAGING_PATH"/ 2>/dev/null || mv "$TEMP_DIR"/*/* "$STAGING_PATH"/ 2>/dev/null || true

# 임시 디렉토리 정리
rm -rf "$TEMP_DIR"

# 복사한 zip 파일 정리
rm -f "$DEST_ZIP"

log_success "압축 해제 완료"

# =============================================================================
# 11. 완료 메시지
# =============================================================================

echo ""
echo "=============================================="
log_success "스테이징 배포 완료!"
echo "=============================================="
echo ""
echo -e "  ${BLUE}배포 경로:${NC} $STAGING_PATH"
echo -e "  ${BLUE}버전:${NC} $(basename "$ZIP_FILE" .zip)"
echo ""
echo -e "${YELLOW}[중요] 모든 개발자가 각자의 크롬에서 새로고침해야 합니다!${NC}"
echo ""
echo "  1. chrome://extensions 접속"
echo "  2. 확장프로그램 새로고침 버튼 클릭"
echo ""
echo "  * 팀원들에게 새로고침 안내를 전달해주세요."
echo ""
