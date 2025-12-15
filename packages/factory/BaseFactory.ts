/**
 * BaseFactory - SaaS 플랫폼 크롤링 스크립트 추상 클래스
 *
 * 이 클래스를 상속받아 서비스별 Factory를 구현합니다.
 * 예: VercelFactory, NotionFactory, SentryFactory, SlackFactory, ChatGPTFactory
 *
 * ============================================================================
 * 📌 사용법
 * ============================================================================
 *
 * class VercelFactory extends BaseFactory {
 *   static platformName = 'vercel';
 *   static baseUrl = 'https://vercel.com';
 *
 *   static async getWorkspaces(): Promise<Workspace[]> {
 *     // 실제 구현
 *   }
 * }
 *
 * ============================================================================
 * 🔴 필수 규칙 (MUST)
 * ============================================================================
 *
 * 1. [실행 환경]
 *    - 브라우저 콘솔에서만 실행 가능해야 합니다
 *    - 해당 서비스에 로그인된 상태에서만 동작합니다
 *    - 외부 의존성 없이 순수 JavaScript/TypeScript로 작성해야 합니다
 *
 * 2. [인증]
 *    - 브라우저 세션 쿠키를 활용합니다
 *    - fetch 요청 시 credentials: 'include' 옵션을 사용합니다
 *
 * 3. [반환 형식]
 *    - 모든 메서드는 정의된 타입에 맞는 객체를 반환해야 합니다
 *    - null 값 허용: UI에서 제공하지 않는 정보는 null로 반환합니다
 *
 * 4. [에러 처리]
 *    - 모든 메서드는 try-catch로 감싸야 합니다
 *    - 에러 발생 시 console.error로 로깅 후 적절한 기본값 반환
 *
 * 5. [비동기 처리]
 *    - 모든 메서드는 async/await 패턴을 사용합니다
 *    - DOM 조작 후 적절한 wait 시간을 두어야 합니다
 *
 * 6. [즉시 실행 함수 (IIFE)]
 *    - 팩토리에 구현된 모든 함수는 즉시 실행 함수(IIFE)로 작성해야 합니다
 *    - 브라우저 콘솔에 붙여넣기만 하면 바로 실행되어야 합니다
 *    - 예시:
 *      (async function() {
 *        const result = await CursorFactory.getWorkspaces();
 *        console.log(result);
 *        return result;
 *      })();
 *
 * ============================================================================
 * 🟡 권장 규칙 (SHOULD)
 * ============================================================================
 *
 * 1. [DOM 파싱 - 핵심 원칙]
 *    - UI 파싱을 기본으로 합니다
 *    - 텍스트로 요소를 찾지 않습니다 (innerText, textContent 기반 검색 금지)
 *    - DOM 구조를 분석하여 HTML 파싱으로 데이터를 추출합니다
 *    - 구조 기반 셀렉터(class, id, data-*, aria-* 등)를 우선 사용합니다
 *    - waitForElement 헬퍼를 활용하여 요소 로딩을 대기합니다
 *
 * 2. [React 앱 호환]
 *    - React 기반 입력 필드는 setReactInputValue 헬퍼를 사용합니다
 *    - 이벤트 디스패치: input, change, keydown 순서로 발생시킵니다
 *
 * 3. [모달/탭 처리]
 *    - 모달 열기 후 최소 500ms 대기
 *    - ESC 키 이벤트로 모달 닫기
 *    - 탭 전환 후 컨텐츠 로딩 대기
 *
 * 4. [배치 처리]
 *    - 다중 항목 처리 시 적절한 딜레이(1-2초) 적용
 *    - Rate Limit 방지를 위한 순차 처리
 *
 * 5. [스크립트 작성 도구]
 *    - Playwright MCP를 사용하여 스크립트를 작성합니다
 *    - 실제 브라우저에서 DOM 구조를 분석하고 셀렉터를 확인합니다
 *    - 스냅샷을 통해 현재 페이지 상태를 파악합니다
 *
 * ============================================================================
 */

// ============================================================================
// 타입 정의
// ============================================================================

/** 통화 금액 */
export interface CurrencyAmount {
  /** 통화 코드 (USD, KRW 등) */
  code: string;
  /** 통화 기호 ($, ₩ 등) */
  symbol: string;
  /** 포맷 문자열 */
  format: string;
  /** 금액 (숫자) */
  amount: number;
  /** 포맷된 텍스트 (예: "$10.00") */
  text: string;
}

/** 워크스페이스 */
export interface Workspace {
  /** 고유 식별자 */
  id: string;
  /** URL 슬러그 */
  slug: string;
  /** 표시 이름 */
  name: string;
  /** 프로필 이미지 URL */
  image: string;
  /** 멤버 수 */
  memberCount: number;
  /** 관리자 여부 */
  isAdmin: boolean | null;
}

/** 멤버 */
export interface Member {
  /** 사용자 고유 ID */
  uid: string | null;
  /** 이름 */
  name: string;
  /** 이메일 */
  email: string;
  /** 프로필 이미지 URL */
  profileImageUrl: string;
  /** 역할 (Owner, Admin, Member 등) */
  role: string;
  /** 구독 시트 상태 */
  subscriptionSeatStatus: 'NONE' | 'FREE' | 'PAID' | 'QUIT' | null;
  /** 가입일 */
  startedAt: Date | null;
  /** 삭제일 */
  deletedAt: Date | null;
}

/** 빌링 정보 */
export interface Billing {
  /** 플랜 이름 */
  planName: string;
  /** 현재 주기 청구액 */
  currentCycleBillAmount: CurrencyAmount;
  /** 다음 결제일 */
  nextPaymentDue: string;
  /** 결제 주기 */
  cycleTerm: 'MONTHLY' | 'ANNUAL' | null;
  /** 무료 플랜 여부 */
  isFreeTier: boolean;
  /** 사용자당 과금 여부 */
  isPerUser: boolean;
  /** 유료 멤버 수 */
  paidMemberCount: number;
  /** 사용 멤버 수 */
  usedMemberCount: number;
  /** 단가 */
  unitPrice: CurrencyAmount | null;
  /** 카드 번호 (마스킹) */
  cardNumber: string;
  /** 카드 이름 */
  cardName: string;
}

/** 인보이스 */
export interface Invoice {
  /** 인보이스 ID */
  uid: string;
  /** 발행일 */
  issuedDate: string;
  /** 결제일 */
  paidDate: string | null;
  /** 결제 수단 */
  paymentMethod: string;
  /** 금액 */
  amount: CurrencyAmount;
  /** 결제 성공 여부 */
  isSuccessfulPaid: boolean;
  /** 영수증 URL */
  receiptUrl: string;
}

/** 작업 결과 */
export interface ActionResult {
  success: boolean;
  message: string;
}

/** 멤버 초대 입력 */
export interface InviteMemberInput {
  email: string;
  role?: string;
}

/** 멤버 초대 결과 */
export interface InviteMemberResult extends ActionResult {
  email: string;
}

/** 멤버 제거 결과 */
export interface RemoveMemberResult extends ActionResult {
  id: string;
}

/** 연결 테스트 결과 */
export interface ConnectionTestResult {
  connected: boolean;
  message: string;
}

// ============================================================================
// BaseFactory 추상 클래스
// ============================================================================

export abstract class BaseFactory {
  // ============================================================================
  // 📌 플랫폼 설정 (하위 클래스에서 반드시 override)
  // ============================================================================

  /** 플랫폼 이름 */
  static platformName: string = 'base';

  /** 플랫폼 기본 URL */
  static baseUrl: string = '';

  // ============================================================================
  // 🔧 유틸리티 헬퍼 (상속받아 사용)
  // ============================================================================

  /** 대기 */
  protected static wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /** 요소 대기 */
  protected static async waitForElement(
    selector: string,
    timeout: number = 10000
  ): Promise<Element | null> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      if (element) return element;
      await this.wait(100);
    }
    return null;
  }

  /** 조건 대기 */
  protected static async waitForCondition(
    conditionFn: () => boolean | Promise<boolean>,
    timeout: number = 10000
  ): Promise<boolean> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (await conditionFn()) return true;
      await this.wait(100);
    }
    return false;
  }

  /** React 입력 필드 값 설정 */
  protected static setReactInputValue(input: HTMLInputElement, value: string): void {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set;
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(input, value);
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /** ESC 키 발생 */
  protected static dispatchEscKey(): void {
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        keyCode: 27,
        which: 27,
        bubbles: true
      })
    );
  }

  /** Enter 키 발생 */
  protected static dispatchEnterKey(element: Element): void {
    element.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true
      })
    );
  }

  /** 현재 페이지 검증 */
  protected static validateCurrentPage(): boolean {
    if (!this.baseUrl) {
      console.warn(`${this.platformName}: baseUrl이 설정되지 않았습니다.`);
      return false;
    }
    return window.location.href.includes(this.baseUrl);
  }

  // ============================================================================
  // 📖 GET - 데이터 조회 (하위 클래스에서 구현)
  // ============================================================================

  /**
   * 워크스페이스 목록 조회
   *
   * @description 기본 구현 프롬프트
   * 1. 워크스페이스 선택 UI(드롭다운, 사이드바 등)를 찾는다
   * 2. 워크스페이스 목록 컨테이너에서 각 항목을 순회한다
   * 3. 각 항목에서 id, slug, name, image를 추출한다
   *    - id: data-* 속성 또는 href에서 추출
   *    - slug: URL 경로에서 추출
   *    - name: 텍스트 노드에서 추출
   *    - image: img src 또는 background-image에서 추출
   * 4. memberCount, isAdmin은 UI에서 제공하면 추출, 없으면 null
   *
   * @override 서비스별 특이사항은 하위 클래스 메서드 주석에 작성
   */
  static async getWorkspaces(): Promise<Workspace[]> {
    throw new Error(`${this.platformName}: getWorkspaces() 미구현`);
  }

  /**
   * 워크스페이스 상세 조회
   *
   * @description 기본 구현 프롬프트
   * 1. 현재 페이지 URL에서 워크스페이스 slug를 추출한다
   * 2. 설정 페이지 또는 헤더에서 워크스페이스 정보를 찾는다
   * 3. 워크스페이스 이름, 이미지, ID를 추출한다
   * 4. 멤버 수는 멤버 페이지 링크 또는 설정에서 확인한다
   *
   * @override 서비스별 특이사항은 하위 클래스 메서드 주석에 작성
   */
  static async getWorkspaceDetail(): Promise<Workspace> {
    throw new Error(`${this.platformName}: getWorkspaceDetail() 미구현`);
  }

  /**
   * 멤버 목록 조회
   *
   * @description 기본 구현 프롬프트
   * 1. 멤버 목록 페이지로 이동하거나 현재 페이지에서 멤버 섹션을 찾는다
   * 2. 테이블(table) 또는 리스트([role="list"]) 컨테이너를 찾는다
   * 3. 각 행(tr, [role="row"], li)을 순회하며 데이터 추출:
   *    - uid: data-* 속성 또는 행 고유 식별자
   *    - name: 이름 셀에서 추출
   *    - email: 이메일 셀에서 추출
   *    - profileImageUrl: img src에서 추출
   *    - role: 역할 배지/셀에서 추출
   * 4. 페이지네이션이 있으면 모든 페이지를 순회한다
   *
   * @override 서비스별 특이사항은 하위 클래스 메서드 주석에 작성
   */
  static async getMembers(): Promise<Member[]> {
    throw new Error(`${this.platformName}: getMembers() 미구현`);
  }

  /**
   * 빌링 정보 조회
   *
   * @description 기본 구현 프롬프트
   * 1. 빌링/구독 설정 페이지에서 정보를 추출한다
   * 2. 플랜 섹션에서 추출:
   *    - planName: 현재 플랜 이름
   *    - isFreeTier: 무료 플랜 여부
   *    - cycleTerm: 결제 주기 (월간/연간)
   * 3. 결제 정보 섹션에서 추출:
   *    - currentCycleBillAmount: 현재 청구 금액
   *    - nextPaymentDue: 다음 결제일
   *    - cardNumber, cardName: 결제 수단 정보
   * 4. 사용량 섹션에서 추출:
   *    - paidMemberCount, usedMemberCount: 멤버 수
   *    - unitPrice: 단가 (per-seat인 경우)
   *
   * @override 서비스별 특이사항은 하위 클래스 메서드 주석에 작성
   */
  static async getBilling(): Promise<Billing> {
    throw new Error(`${this.platformName}: getBilling() 미구현`);
  }

  /**
   * 결제 내역 조회
   *
   * @description 기본 구현 프롬프트
   * 1. 결제 내역/인보이스 페이지로 이동하거나 섹션을 찾는다
   * 2. 인보이스 테이블/리스트를 찾는다
   * 3. 각 행에서 추출:
   *    - uid: 인보이스 ID 또는 고유 식별자
   *    - issuedDate: 발행일
   *    - paidDate: 결제일
   *    - amount: 금액 (통화 포함)
   *    - paymentMethod: 결제 수단
   *    - isSuccessfulPaid: 결제 성공 여부
   *    - receiptUrl: 영수증 링크 (href에서 추출)
   * 4. 더보기/페이지네이션이 있으면 모든 내역을 로드한다
   *
   * @override 서비스별 특이사항은 하위 클래스 메서드 주석에 작성
   */
  static async getBillingHistories(): Promise<Invoice[]> {
    throw new Error(`${this.platformName}: getBillingHistories() 미구현`);
  }

  // ============================================================================
  // ➕ INVITE - 멤버 초대 (하위 클래스에서 구현)
  // ============================================================================

  /**
   * 멤버 초대
   *
   * @description 기본 구현 프롬프트
   * 1. 초대 버튼을 찾아 클릭한다 (button, [role="button"] 등)
   * 2. 초대 모달/폼이 열릴 때까지 대기한다
   * 3. 이메일 입력 필드를 찾아 값을 입력한다
   *    - React 앱은 setReactInputValue 헬퍼 사용
   * 4. 역할 선택이 있으면 드롭다운/라디오에서 선택한다
   * 5. 확인/전송 버튼을 클릭한다
   * 6. 성공/실패 메시지를 확인하여 결과를 반환한다
   * 7. 모달을 닫는다 (ESC 또는 닫기 버튼)
   *
   * @override 서비스별 특이사항은 하위 클래스 메서드 주석에 작성
   */
  static async inviteMember(email: string, role: string = 'member'): Promise<ActionResult> {
    throw new Error(`${this.platformName}: inviteMember() 미구현`);
  }

  /** 다중 멤버 초대 (배치) */
  static async inviteMembers(
    members: InviteMemberInput[],
    delayMs: number = 2000
  ): Promise<InviteMemberResult[]> {
    const results: InviteMemberResult[] = [];
    for (const member of members) {
      try {
        const result = await this.inviteMember(member.email, member.role);
        results.push({ email: member.email, ...result });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        results.push({ email: member.email, success: false, message });
      }
      await this.wait(delayMs);
    }
    return results;
  }

  // ============================================================================
  // ➖ REMOVE - 멤버 제거 (하위 클래스에서 구현)
  // ============================================================================

  /**
   * 멤버 제거
   *
   * @description 기본 구현 프롬프트
   * 1. 멤버 목록에서 대상 멤버 행을 찾는다
   *    - data-* 속성, email, uid 등으로 식별
   * 2. 해당 행의 더보기/액션 버튼을 클릭한다
   * 3. 드롭다운 메뉴에서 제거/삭제 옵션을 클릭한다
   * 4. 확인 다이얼로그가 나타나면:
   *    - 확인 입력이 필요하면 입력한다 (이름, 이메일 등)
   *    - 확인 버튼을 클릭한다
   * 5. 제거 완료 메시지를 확인하여 결과를 반환한다
   * 6. 모달/다이얼로그를 닫는다
   *
   * @override 서비스별 특이사항은 하위 클래스 메서드 주석에 작성
   */
  static async removeMember(memberIdOrEmail: string): Promise<ActionResult> {
    throw new Error(`${this.platformName}: removeMember() 미구현`);
  }

  /** 다중 멤버 제거 (배치) */
  static async removeMembers(
    memberIdsOrEmails: string[],
    delayMs: number = 2000
  ): Promise<RemoveMemberResult[]> {
    const results: RemoveMemberResult[] = [];
    for (const id of memberIdsOrEmails) {
      try {
        const result = await this.removeMember(id);
        results.push({ id, ...result });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        results.push({ id, success: false, message });
      }
      await this.wait(delayMs);
    }
    return results;
  }

  // ============================================================================
  // 🧪 TEST - 연결 테스트 (하위 클래스에서 구현)
  // ============================================================================

  /**
   * 연결 테스트
   *
   * @description 기본 구현 프롬프트
   * 1. 현재 페이지가 해당 서비스인지 validateCurrentPage()로 확인한다
   * 2. 로그인 상태를 확인한다:
   *    - 사용자 프로필/아바타 요소 존재 여부
   *    - 로그인 버튼 부재 여부
   *    - 세션 관련 DOM 요소 확인
   * 3. 워크스페이스/계정 정보가 로드되었는지 확인한다
   * 4. connected: true/false와 함께 상태 메시지를 반환한다
   *
   * @override 서비스별 특이사항은 하위 클래스 메서드 주석에 작성
   */
  static async testConnection(): Promise<ConnectionTestResult> {
    throw new Error(`${this.platformName}: testConnection() 미구현`);
  }
}
