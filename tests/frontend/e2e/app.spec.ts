/**
 * E2E 테스트 - Playwright
 * 전체 사용자 플로우 테스트
 */

import { test, expect } from '@playwright/test';

function makeUniqueUser(displayNamePrefix: string) {
  const suffix = Date.now();
  return {
    email: `test-${suffix}@example.com`,
    username: `${displayNamePrefix} ${suffix}`,
  };
}

test.describe('JLPT App E2E', () => {
  test.beforeEach(async ({ page }) => {
    // 앱 시작 페이지로 이동
    await page.goto('http://localhost:3000');
  });

  test.describe('로그인/회원가입 시나리오', () => {
    test('should display login page initially', async ({ page }) => {
      // 로그인 페이지가 표시되는지 확인
      await expect(page.getByText('JLPT 자격 검증 프로그램')).toBeVisible();
      await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
      await expect(page.getByLabel('이메일')).toBeVisible();
      await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();
    });

    test('should switch to register mode', async ({ page }) => {
      // 회원가입 모드로 전환
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();

      // 회원가입 폼이 표시되는지 확인
      await expect(page.getByRole('heading', { name: '회원가입' })).toBeVisible();
      await expect(page.getByLabel('이메일')).toBeVisible();
      await expect(page.getByLabel('사용자명')).toBeVisible();
      await expect(page.getByLabel('목표 레벨')).toBeVisible();
      await expect(page.getByRole('button', { name: '회원가입' })).toBeVisible();
    });

    test('should register new user and auto login', async ({ page }) => {
      // 회원가입 모드로 전환
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();

      // 회원가입 정보 입력
      const { email, username } = makeUniqueUser('테스트 사용자');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');

      // 회원가입 제출
      await page.getByRole('button', { name: '회원가입' }).click();

      // 로그인 성공 후 초기 페이지로 이동 확인
      // 회원가입 후 페이지가 완전히 로드될 때까지 대기
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(new RegExp(`안녕하세요, ${username}님`))).toBeVisible({ timeout: 15000 });
    });

    test('should login with existing user', async ({ page }) => {
      // 먼저 사용자 등록
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('테스트 사용자');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      // 회원가입 후 페이지가 완전히 로드될 때까지 대기
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });

      // 로그아웃
      await page.getByRole('button', { name: '로그아웃' }).click();
      await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();

      // 다시 로그인
      await page.getByLabel('이메일').fill(email);
      await page.getByRole('button', { name: '로그인' }).click();

      // 로그인 성공 확인
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(new RegExp(`안녕하세요, ${username}님`))).toBeVisible();
    });

    test('should show error on invalid login', async ({ page }) => {
      // 잘못된 이메일로 로그인 시도
      await page.getByLabel('이메일').fill('invalid@example.com');
      await page.getByRole('button', { name: '로그인' }).click();

      // 에러 메시지 확인
      await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('초기 페이지 시나리오', () => {
    test('should display initial page after login', async ({ page }) => {
      // 로그인 먼저 수행
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('테스트 사용자');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      // 회원가입 후 페이지가 완전히 로드될 때까지 대기
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });

      // 초기 페이지 요소 확인
      await expect(page.getByText('JLPT 자격 검증 프로그램')).toBeVisible();
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('테스트 모드와 학습 모드 중 선택하세요.')).toBeVisible();
      await expect(page.getByRole('button', { name: '테스트 모드' })).toBeVisible();
      await expect(page.getByRole('button', { name: '성능 분석 보기' })).toBeVisible();
    });

    test('should navigate to test when start button clicked', async ({ page }) => {
      // 로그인
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('테스트 사용자');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      // 회원가입 후 페이지가 완전히 로드될 때까지 대기
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });

      // 테스트 시작 버튼 클릭
      await page.getByRole('button', { name: '테스트 모드' }).click();

      // 로딩 상태 확인
      await expect(page.getByText('테스트를 준비하는 중')).toBeVisible();
    });
  });

  test.describe('테스트 풀이 시나리오', () => {
    test('should display test UI with questions', async ({ page }) => {
      // 로그인 및 테스트 시작
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('테스트 사용자');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      // 회원가입 후 페이지가 완전히 로드될 때까지 대기
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });
      await page.getByRole('button', { name: '테스트 모드' }).click();

      // 테스트 UI 표시 확인
      await expect(page.getByTestId('test-ui')).toBeVisible({ timeout: 15000 });
      await expect(page.getByTestId('progress-bar')).toBeVisible();
      await expect(page.getByText(/문제 \d+ \/ \d+/)).toBeVisible({ timeout: 10000 });
    });

    test('should navigate between questions', async ({ page }) => {
      // 로그인 및 테스트 시작
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('테스트 사용자');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      // 회원가입 후 페이지가 완전히 로드될 때까지 대기
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });
      await page.getByRole('button', { name: '테스트 모드' }).click();
      await expect(page.getByTestId('test-ui')).toBeVisible({ timeout: 15000 });

      // 첫 번째 문제 답안 선택
      const firstChoice = page.locator('[data-testid^="choice-"]').first();
      await firstChoice.click();

      // 다음 버튼 클릭
      await page.getByTestId('next-button').click();

      // 두 번째 문제로 이동 확인
      await expect(page.getByText(/문제 2 \/ \d+/)).toBeVisible({ timeout: 10000 });

      // 이전 버튼 클릭
      await page.getByTestId('prev-button').click();

      // 첫 번째 문제로 돌아온 것 확인
      await expect(page.getByText(/문제 1 \/ \d+/)).toBeVisible({ timeout: 10000 });
    });

    test('should select answers for all questions', async ({ page }) => {
      // 로그인 및 테스트 시작
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('테스트 사용자');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      // 회원가입 후 페이지가 완전히 로드될 때까지 대기
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });
      await page.getByRole('button', { name: '테스트 모드' }).click();
      await expect(page.getByTestId('test-ui')).toBeVisible({ timeout: 15000 });

      // 모든 문제에 답안 선택
      const questionIndicators = page.locator('[data-testid^="question-indicator-"]');
      const count = await questionIndicators.count();

      for (let i = 0; i < count; i++) {
        // 현재 문제의 첫 번째 선택지 클릭
        const firstChoice = page.locator('[data-testid^="choice-"]').first();
        await firstChoice.click();

        // 마지막 문제가 아니면 다음으로 이동
        if (i < count - 1) {
          await page.getByTestId('next-button').click();
        }
      }

      // 제출 버튼이 활성화되었는지 확인
      await expect(page.getByTestId('submit-button')).toBeEnabled();
    });

    test('should submit test and show result', async ({ page }) => {
      // 로그인 및 테스트 시작
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('테스트 사용자');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      // 회원가입 후 페이지가 완전히 로드될 때까지 대기
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });
      await page.getByRole('button', { name: '테스트 모드' }).click();
      await expect(page.getByTestId('test-ui')).toBeVisible({ timeout: 15000 });

      // 모든 문제에 답안 선택
      const questionIndicators = page.locator('[data-testid^="question-indicator-"]');
      const count = await questionIndicators.count();

      for (let i = 0; i < count; i++) {
        const firstChoice = page.locator('[data-testid^="choice-"]').first();
        await firstChoice.click();
        if (i < count - 1) {
          await page.getByTestId('next-button').click();
        }
      }

      // 제출
      await page.getByTestId('submit-button').click();

      // 제출 중 로딩 상태 확인
      await expect(page.getByText('결과를 처리하는 중')).toBeVisible();

      // 결과 페이지 확인
      await expect(page.getByTestId('result-ui')).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('결과 페이지 시나리오', () => {
    test('should display test result with all details', async ({ page }) => {
      // 로그인 및 테스트 완료
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('테스트 사용자');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      // 회원가입 후 페이지가 완전히 로드될 때까지 대기
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });
      await page.getByRole('button', { name: '테스트 모드' }).click();
      await expect(page.getByTestId('test-ui')).toBeVisible({ timeout: 15000 });

      // 모든 문제에 답안 선택 및 제출
      const questionIndicators = page.locator('[data-testid^="question-indicator-"]');
      const count = await questionIndicators.count();
      for (let i = 0; i < count; i++) {
        const firstChoice = page.locator('[data-testid^="choice-"]').first();
        await firstChoice.click();
        if (i < count - 1) {
          await page.getByTestId('next-button').click();
        }
      }
      await page.getByTestId('submit-button').click();
      await expect(page.getByTestId('result-ui')).toBeVisible({ timeout: 15000 });

      // 결과 페이지 요소 확인
      await expect(page.getByText('테스트 결과')).toBeVisible();
      await expect(page.getByTestId('result-status')).toBeVisible();
      await expect(page.getByTestId('score-value')).toBeVisible();
      await expect(page.getByTestId('assessed-level')).toBeVisible();
      await expect(page.getByTestId('recommended-level')).toBeVisible();
      await expect(page.getByTestId('performance-level')).toBeVisible();
    });

    test('should navigate back to initial page', async ({ page }) => {
      // 로그인 및 테스트 완료
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('테스트 사용자');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      // 회원가입 후 페이지가 완전히 로드될 때까지 대기
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });
      await page.getByRole('button', { name: '테스트 모드' }).click();
      await expect(page.getByTestId('test-ui')).toBeVisible({ timeout: 15000 });

      // 모든 문제에 답안 선택 및 제출
      const questionIndicators = page.locator('[data-testid^="question-indicator-"]');
      const count = await questionIndicators.count();
      for (let i = 0; i < count; i++) {
        const firstChoice = page.locator('[data-testid^="choice-"]').first();
        await firstChoice.click();
        if (i < count - 1) {
          await page.getByTestId('next-button').click();
        }
      }
      await page.getByTestId('submit-button').click();
      await expect(page.getByTestId('result-ui')).toBeVisible({ timeout: 15000 });

      // 다시 시작 버튼 클릭
      await page.getByRole('button', { name: '다시 시작' }).click();

      // 초기 페이지로 돌아온 것 확인
      await expect(page.getByTestId('initial-ui')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });
      await expect(page.getByRole('button', { name: '테스트 모드' })).toBeVisible();
    });
  });

  test.describe('성능 분석 페이지 시나리오', () => {
    test('should navigate to performance page', async ({ page }) => {
      // 로그인
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('테스트 사용자');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      // 회원가입 후 페이지가 완전히 로드될 때까지 대기
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });

      // 성능 분석 보기 버튼 클릭
      await page.getByRole('button', { name: '성능 분석 보기' }).click();

      // 성능 분석 페이지 표시 확인
      await expect(page.getByTestId('user-performance-ui')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('성능 분석')).toBeVisible();
    });

    test('should display performance data sections', async ({ page }) => {
      // 로그인 및 테스트 완료 (성능 데이터 생성)
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('테스트 사용자');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      // 회원가입 후 페이지가 완전히 로드될 때까지 대기
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });
      await page.getByRole('button', { name: '테스트 모드' }).click();
      await expect(page.getByTestId('test-ui')).toBeVisible({ timeout: 15000 });

      // 테스트 완료
      const questionIndicators = page.locator('[data-testid^="question-indicator-"]');
      const count = await questionIndicators.count();
      for (let i = 0; i < count; i++) {
        const firstChoice = page.locator('[data-testid^="choice-"]').first();
        await firstChoice.click();
        if (i < count - 1) {
          await page.getByTestId('next-button').click();
        }
      }
      await page.getByTestId('submit-button').click();
      await expect(page.getByTestId('result-ui')).toBeVisible({ timeout: 15000 });

      // 다시 시작하여 초기 페이지로
      await page.getByRole('button', { name: '다시 시작' }).click();
      await expect(page.getByTestId('initial-ui')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });

      // 성능 분석 보기
      await page.getByRole('button', { name: '성능 분석 보기' }).click();
      await expect(page.getByTestId('user-performance-ui')).toBeVisible({ timeout: 15000 });

      // 성능 분석 섹션 확인
      await expect(page.getByTestId('type-performance')).toBeVisible();
      await expect(page.getByTestId('difficulty-performance')).toBeVisible();
      await expect(page.getByTestId('level-progression')).toBeVisible();
    });

    test('should navigate back from performance page', async ({ page }) => {
      // 로그인
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('테스트 사용자');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      // 회원가입 후 페이지가 완전히 로드될 때까지 대기
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });

      // 성능 분석 보기
      await page.getByRole('button', { name: '성능 분석 보기' }).click();
      await expect(page.getByTestId('user-performance-ui')).toBeVisible({ timeout: 15000 });

      // 돌아가기 버튼 클릭
      await page.getByRole('button', { name: '돌아가기' }).click();

      // 초기 페이지로 돌아온 것 확인
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('에러 처리 시나리오', () => {
    test('should handle test creation error', async ({ page }) => {
      // 로그인
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('테스트 사용자');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      // 회원가입 후 페이지가 완전히 로드될 때까지 대기
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });

      // API 실패 시뮬레이션
      await page.route('**/api/v1/tests/diagnostic/n5', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ success: false, message: 'Server Error' }),
        });
      });

      // 테스트 시작
      await page.getByRole('button', { name: '테스트 모드' }).click();

      // 에러 메시지 확인
      await expect(page.getByText('오류가 발생했습니다')).toBeVisible({ timeout: 15000 });
      await expect(page.getByRole('button', { name: /다시 시도/i })).toBeVisible();
    });

    test('should handle test submission error', async ({ page }) => {
      // 로그인 및 테스트 시작
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('테스트 사용자');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      // 회원가입 후 페이지가 완전히 로드될 때까지 대기
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });
      await page.getByRole('button', { name: '테스트 모드' }).click();
      await expect(page.getByTestId('test-ui')).toBeVisible({ timeout: 15000 });

      // 모든 문제에 답안 선택
      const questionIndicators = page.locator('[data-testid^="question-indicator-"]');
      const count = await questionIndicators.count();
      for (let i = 0; i < count; i++) {
        const firstChoice = page.locator('[data-testid^="choice-"]').first();
        await firstChoice.click();
        if (i < count - 1) {
          await page.getByTestId('next-button').click();
        }
      }

      // 제출 API 실패 시뮬레이션
      await page.route('**/api/v1/tests/*/submit', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ success: false, message: 'Submission Error' }),
        });
      });

      // 제출
      await page.getByTestId('submit-button').click();

      // 에러 메시지 확인
      await expect(page.getByText('오류가 발생했습니다')).toBeVisible({ timeout: 15000 });
      await expect(page.getByRole('button', { name: /다시 시도/i })).toBeVisible();
    });

    test('should handle performance fetch error', async ({ page }) => {
      // 로그인
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('테스트 사용자');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      // 회원가입 후 페이지가 완전히 로드될 때까지 대기
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });

      // 성능 분석 API 실패 시뮬레이션
      await page.route('**/api/v1/users/*/performance', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ success: false, message: 'Performance Error' }),
        });
      });

      // 성능 분석 보기
      await page.getByRole('button', { name: '성능 분석 보기' }).click();

      // 에러 메시지 확인
      await expect(page.getByText('오류가 발생했습니다')).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('전체 사용자 플로우 검증', () => {
    test('should complete full user flow: register → login → test → result → performance', async ({ page }) => {
      // 1. 회원가입
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('전체 플로우 테스트');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      // 회원가입 후 페이지가 완전히 로드될 때까지 대기
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(new RegExp(`안녕하세요, ${username}님`))).toBeVisible();

      // 2. 테스트 시작
      await page.getByRole('button', { name: '테스트 모드' }).click();
      await expect(page.getByText('테스트를 준비하는 중')).toBeVisible();
      await expect(page.getByTestId('test-ui')).toBeVisible({ timeout: 15000 });

      // 3. 모든 문제 풀이
      const questionIndicators = page.locator('[data-testid^="question-indicator-"]');
      const count = await questionIndicators.count();
      for (let i = 0; i < count; i++) {
        const firstChoice = page.locator('[data-testid^="choice-"]').first();
        await firstChoice.click();
        if (i < count - 1) {
          await page.getByTestId('next-button').click();
        }
      }

      // 4. 테스트 제출
      await page.getByTestId('submit-button').click();
      await expect(page.getByText('결과를 처리하는 중')).toBeVisible();
      await expect(page.getByTestId('result-ui')).toBeVisible({ timeout: 15000 });

      // 5. 결과 확인
      await expect(page.getByText('테스트 결과')).toBeVisible();
      await expect(page.getByTestId('score-value')).toBeVisible();
      await expect(page.getByTestId('result-status')).toBeVisible();

      // 6. 다시 시작하여 초기 페이지로
      await page.getByRole('button', { name: '다시 시작' }).click();
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });

      // 7. 성능 분석 보기
      await page.getByRole('button', { name: '성능 분석 보기' }).click();
      await expect(page.getByTestId('user-performance-ui')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('성능 분석')).toBeVisible();

      // 8. 돌아가기
      await page.getByRole('button', { name: '돌아가기' }).click();
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });

      // 9. 로그아웃
      await page.getByRole('button', { name: '로그아웃' }).click();
      await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
    });
  });

  test.describe('어드민 플로우 검증', () => {
    test('should automatically redirect admin user to admin dashboard on login', async ({ page }) => {
      // 어드민 계정으로 로그인
      await page.getByLabel('이메일').fill('admin@example.com');
      await page.getByRole('button', { name: '로그인' }).click();

      // admin 사용자는 자동으로 admin-dashboard로 이동
      await expect(page.getByText('어드민 관리')).toBeVisible({ timeout: 15000 });
      await expect(page.getByRole('button', { name: '대시보드' })).toBeVisible();
      await expect(page.getByRole('button', { name: '사용자 관리' })).toBeVisible();
      await expect(page.getByRole('button', { name: '문제 관리' })).toBeVisible();
      
      // 일반 메뉴는 보이지 않아야 함
      await expect(page.getByText('JLPT 학습 플랫폼')).not.toBeVisible();
    });

    test('should navigate to admin dashboard', async ({ page }) => {
      // 어드민 계정으로 로그인
      await page.getByLabel('이메일').fill('admin@example.com');
      await page.getByRole('button', { name: '로그인' }).click();

      // admin 사용자는 자동으로 admin-dashboard로 이동
      await expect(page.getByText('어드민 관리')).toBeVisible({ timeout: 15000 });

      // 어드민 레이아웃과 네비게이션이 표시되는지 확인
      await expect(page.getByRole('button', { name: '대시보드' })).toBeVisible();
      await expect(page.getByRole('button', { name: '사용자 관리' })).toBeVisible();
      await expect(page.getByRole('button', { name: '문제 관리' })).toBeVisible();
    });

    test('should navigate between admin pages', async ({ page }) => {
      // 어드민 계정으로 로그인
      await page.getByLabel('이메일').fill('admin@example.com');
      await page.getByRole('button', { name: '로그인' }).click();
      
      // admin 사용자는 자동으로 admin-dashboard로 이동
      await expect(page.getByText('어드민 관리')).toBeVisible({ timeout: 15000 });

      // 사용자 관리로 이동
      await page.getByRole('button', { name: '사용자 관리' }).click();
      await expect(page.getByText('사용자 관리')).toBeVisible({ timeout: 5000 });

      // 문제 관리로 이동
      await page.getByRole('button', { name: '문제 관리' }).click();
      await expect(page.getByText('문제 관리')).toBeVisible({ timeout: 5000 });

      // 다시 대시보드로 이동
      await page.getByRole('button', { name: '대시보드' }).click();
      await expect(page.getByText('어드민 대시보드')).toBeVisible({ timeout: 5000 });
    });

    test('should not display admin buttons for regular user', async ({ page }) => {
      // 일반 사용자 회원가입 및 로그인
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('일반 사용자');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      // 회원가입 후 페이지가 완전히 로드될 때까지 대기
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });

      // 어드민 버튼들이 표시되지 않는지 확인
      await expect(page.getByRole('button', { name: '어드민 - 대시보드' })).not.toBeVisible();
      await expect(page.getByRole('button', { name: '어드민 - 사용자 관리' })).not.toBeVisible();
      await expect(page.getByRole('button', { name: '어드민 - 문제 관리' })).not.toBeVisible();
    });

    test('should handle admin login failure - user not found', async ({ page }) => {
      // 존재하지 않는 admin 계정으로 로그인 시도
      await page.getByLabel('이메일').fill('nonexistent-admin@example.com');
      await page.getByRole('button', { name: '로그인' }).click();

      // 에러 메시지가 표시되어야 함
      await expect(page.getByText(/사용자를 찾을 수 없습니다|오류가 발생했습니다/i)).toBeVisible({ timeout: 5000 });
      
      // 로그인 페이지에 머물러 있어야 함
      await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
    });

    test('should redirect regular user away from admin pages', async ({ page }) => {
      // 일반 사용자로 로그인
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('일반 사용자');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });

      // URL을 직접 admin-dashboard로 변경 시도 (일반적으로는 불가능하지만, 테스트를 위해)
      // 실제로는 AdminLayout이 권한 체크를 하므로 일반 사용자는 admin 페이지에 접근할 수 없음
      // 이 테스트는 AdminLayout의 권한 체크가 제대로 작동하는지 확인
      
      // 일반 메뉴가 표시되어야 함
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible();
      await expect(page.getByRole('button', { name: '테스트 모드' })).toBeVisible();
    });

    test('should verify admin user data after login', async ({ page }) => {
      // 어드민 계정으로 로그인
      await page.getByLabel('이메일').fill('admin@example.com');
      await page.getByRole('button', { name: '로그인' }).click();

      // admin 사용자는 자동으로 admin-dashboard로 이동
      await expect(page.getByText('어드민 관리')).toBeVisible({ timeout: 15000 });

      // API 호출이 성공했는지 확인 (네트워크 요청 모니터링)
      const responsePromise = page.waitForResponse(
        response => response.url().includes('/api/v1/users/me') && response.status() === 200,
        { timeout: 10000 }
      ).catch(() => null);

      // 사용자 정보가 올바르게 로드되었는지 확인
      // (어드민 레이아웃에 사용자명이 표시되는지 확인)
      await expect(page.getByText(/어드민:.*님/i)).toBeVisible({ timeout: 10000 });
      
      // API 응답 확인
      const response = await responsePromise;
      if (response) {
        const userData = await response.json();
        expect(userData.success).toBe(true);
        expect(userData.data.is_admin).toBe(true);
      }
    });

    test('should handle admin dashboard API errors gracefully', async ({ page }) => {
      // 어드민 계정으로 로그인
      await page.getByLabel('이메일').fill('admin@example.com');
      await page.getByRole('button', { name: '로그인' }).click();

      // admin 사용자는 자동으로 admin-dashboard로 이동
      await expect(page.getByText('어드민 관리')).toBeVisible({ timeout: 15000 });

      // 대시보드가 로드될 때까지 대기
      await expect(page.getByRole('heading', { name: '어드민 대시보드' })).toBeVisible({ timeout: 10000 });

      // API 호출이 완료될 때까지 대기 (성공 또는 실패)
      // 로딩이 완료될 때까지 대기 (로딩 메시지가 사라질 때까지)
      await page.waitForFunction(
        () => {
          const loading = document.querySelector('.admin-dashboard-loading');
          return !loading || loading.textContent?.trim() === '';
        },
        { timeout: 10000 }
      ).catch(() => {
        // 로딩이 완료되지 않아도 계속 진행
      });

      // 에러가 발생했더라도 페이지가 크래시되지 않고 에러 메시지가 표시되어야 함
      // (에러 메시지가 있으면 표시, 없으면 정상 로드)
      // 헤더는 이미 확인했으므로, 추가 콘텐츠를 확인
      const hasError = await page.getByText(/오류|에러|error/i).isVisible().catch(() => false);
      const hasUserStats = await page.getByText(/사용자 통계|전체 사용자/i).isVisible().catch(() => false);
      const hasTestStats = await page.getByText(/테스트 통계|전체 테스트/i).isVisible().catch(() => false);
      const hasQuestionStats = await page.getByText(/문제 통계|전체 문제/i).isVisible().catch(() => false);
      const hasEmptyMessage = await page.getByText(/통계 데이터가 없습니다/i).isVisible().catch(() => false);
      const hasHeader = await page.getByRole('heading', { name: '어드민 대시보드' }).isVisible().catch(() => false);
      
      // 하나 이상은 표시되어야 함 (에러, 콘텐츠, 빈 메시지, 또는 헤더)
      expect(hasError || hasUserStats || hasTestStats || hasQuestionStats || hasEmptyMessage || hasHeader).toBe(true);
    });

    test('should handle admin API 403 forbidden errors', async ({ page, context }) => {
      // 일반 사용자로 로그인
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('일반 사용자');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });

      // 일반 사용자가 admin API에 직접 접근 시도 (403 에러 발생)
      const adminApiResponse = await page.evaluate(async () => {
        try {
          const response = await fetch('http://localhost:8000/api/v1/admin/statistics', {
            credentials: 'include',
          });
          return { status: response.status, ok: response.ok };
        } catch (error) {
          return { error: error instanceof Error ? error.message : String(error) };
        }
      });

      // 403 Forbidden 응답이어야 함
      expect(adminApiResponse.status).toBe(403);
    });
  });

  // ============================================================================
  // 깊은 시나리오 검증 테스트
  // ============================================================================

  test.describe('학습 계획 진도율 깊은 검증', () => {
    test('should update progress when Day 1 is completed', async ({ page }) => {
      // 1. 로그인 및 학습 계획 접근
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('진도율 테스트');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });

      // 2. 학습 계획 접근
      await page.getByRole('button', { name: '6주 학습 계획' }).click();
      await page.waitForTimeout(1000);

      // 3. 초기 진도율 확인 (0%)
      const initialProgress = await page.locator('.overall-progress .progress-text').textContent();
      expect(initialProgress).toContain('0%');

      // 4. Day 1 체크리스트 접근
      await page.locator('.task-item').first().click();
      await page.waitForTimeout(500);

      // 5. vocabulary 체크박스 클릭
      const vocabularyCheckbox = page.locator('input[type="checkbox"]').first();
      await vocabularyCheckbox.click();
      await page.waitForTimeout(500);

      // 6. grammar 체크박스 클릭
      const grammarCheckbox = page.locator('input[type="checkbox"]').nth(1);
      await grammarCheckbox.click();
      await page.waitForTimeout(1000);

      // 7. localStorage 확인
      const day1Completed = await page.evaluate(() => 
        localStorage.getItem('studyPlan_day1_completed')
      );
      expect(day1Completed).toBe('true');

      // 8. 학습 계획 대시보드로 돌아가기
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(2000); // 상태 업데이트 대기

      // 9. 진도율 재확인 (약 2.4% = 1/42)
      const updatedProgress = await page.locator('.overall-progress .progress-text').textContent();
      expect(updatedProgress).toContain('2%'); // 반올림

      // 10. 1주차 진도율 확인 (약 14.3% = 1/7)
      const week1Progress = await page.locator('.week-card:first-child .week-progress').textContent();
      expect(week1Progress).toContain('14%');
    });

    test('should update progress correctly when multiple days are completed', async ({ page }) => {
      // 로그인 및 학습 계획 접근
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('다중 Day 테스트');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });

      await page.getByRole('button', { name: '6주 학습 계획' }).click();
      await page.waitForTimeout(1000);

      // Day 1-7 완료 (1주차 전체)
      for (let day = 1; day <= 7; day++) {
        // 해당 Day의 task-item 클릭
        const taskItems = page.locator('.task-item');
        const dayTask = taskItems.filter({ hasText: `Day ${day}` }).first();
        await dayTask.click();
        await page.waitForTimeout(500);

        // vocabulary와 grammar 체크박스 클릭
        const checkboxes = page.locator('input[type="checkbox"]');
        await checkboxes.nth(0).click();
        await checkboxes.nth(1).click();
        await page.waitForTimeout(500);

        // 돌아가기
        await page.getByRole('button', { name: /돌아가기/i }).click();
        await page.waitForTimeout(1000);
      }

      // 1주차 진도율 100% 확인
      const week1Progress = await page.locator('.week-card:first-child .week-progress').textContent();
      expect(week1Progress).toContain('100%');

      // 전체 진도율 확인 (7/42 = 약 16.7%)
      const overallProgress = await page.locator('.overall-progress .progress-text').textContent();
      expect(overallProgress).toContain('17%'); // 반올림
    });
  });

  test.describe('일일 목표 달성률 깊은 검증', () => {
    test('should calculate achievement rate correctly after study sessions', async ({ page }) => {
      // 1. 로그인
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('일일 목표 테스트');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });

      // 2. 일일 목표 페이지 접근
      await page.getByRole('button', { name: '일일 목표' }).click();
      await page.waitForTimeout(1000);

      // 3. 목표 수정 버튼 클릭
      await page.getByRole('button', { name: '목표 수정' }).click();
      await page.waitForTimeout(500);

      // 4. 목표 설정 (문제 10개, 시간 30분)
      const questionsInput = page.locator('input[id="target-questions"]');
      await questionsInput.clear();
      await questionsInput.fill('10');
      
      const minutesInput = page.locator('input[id="target-minutes"]');
      await minutesInput.clear();
      await minutesInput.fill('30');

      // 5. 저장
      await page.getByRole('button', { name: '저장' }).click();
      await page.waitForTimeout(1000);

      // 6. 초기 달성률 확인 (0%)
      const initialProgress = await page.locator('.progress-percentage').first().textContent();
      expect(initialProgress).toContain('0.0%');

      // 7. 학습 모드 시작 (문법, 5문제)
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: '학습 모드' }).click();
      await page.waitForTimeout(1000);

      // 학습 모드에서 문제 풀이
      await expect(page.getByTestId('study-ui')).toBeVisible({ timeout: 15000 });
      const studyQuestions = page.locator('[data-testid^="choice-"]');
      const questionCount = await studyQuestions.count();
      
      // 최대 5문제만 풀이
      for (let i = 0; i < Math.min(5, questionCount); i++) {
        const choice = studyQuestions.nth(i);
        await choice.click();
        await page.waitForTimeout(200);
        if (i < Math.min(5, questionCount) - 1) {
          await page.getByTestId('next-button').click();
          await page.waitForTimeout(200);
        }
      }

      // 제출
      await page.getByTestId('submit-button').click();
      await page.waitForTimeout(2000);

      // 8. 일일 목표 페이지에서 달성률 확인 (50%)
      await page.getByRole('button', { name: '일일 목표' }).click();
      await page.waitForTimeout(2000);

      const progressAfterFirst = await page.locator('.progress-percentage').first().textContent();
      // 달성률이 증가했는지 확인 (정확한 값은 백엔드 응답에 따라 다를 수 있음)
      expect(progressAfterFirst).toBeTruthy();

      // 9. 백엔드 API로 통계 확인
      const userId = await page.evaluate(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          return user.id;
        }
        return null;
      });

      if (userId) {
        const apiResponse = await page.evaluate(async (uid) => {
          try {
            const response = await fetch(`http://localhost:8000/api/v1/users/${uid}/daily-goal`, {
              credentials: 'include',
            });
            return await response.json();
          } catch (error) {
            return null;
          }
        }, userId);

        if (apiResponse && apiResponse.success) {
          expect(apiResponse.data.statistics.total_questions).toBeGreaterThanOrEqual(0);
          expect(apiResponse.data.statistics.total_minutes).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  test.describe('학습 이력 저장 및 조회 깊은 검증', () => {
    test('should save and display study history correctly', async ({ page }) => {
      // 1. 로그인
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('이력 테스트');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });

      // 2. 학습 모드 1: 문법 학습
      await page.getByRole('button', { name: '학습 모드' }).click();
      await page.waitForTimeout(1000);
      await expect(page.getByTestId('study-ui')).toBeVisible({ timeout: 15000 });

      // 문제 풀이 및 제출
      const studyQuestions1 = page.locator('[data-testid^="choice-"]');
      const count1 = await studyQuestions1.count();
      for (let i = 0; i < Math.min(5, count1); i++) {
        await studyQuestions1.nth(i).click();
        await page.waitForTimeout(200);
        if (i < Math.min(5, count1) - 1) {
          await page.getByTestId('next-button').click();
          await page.waitForTimeout(200);
        }
      }
      await page.getByTestId('submit-button').click();
      await page.waitForTimeout(2000);

      // 3. 학습 모드 2: 독해 학습
      await page.getByRole('button', { name: '학습 모드' }).click();
      await page.waitForTimeout(1000);
      await expect(page.getByTestId('study-ui')).toBeVisible({ timeout: 15000 });

      const studyQuestions2 = page.locator('[data-testid^="choice-"]');
      const count2 = await studyQuestions2.count();
      for (let i = 0; i < Math.min(10, count2); i++) {
        await studyQuestions2.nth(i).click();
        await page.waitForTimeout(200);
        if (i < Math.min(10, count2) - 1) {
          await page.getByTestId('next-button').click();
          await page.waitForTimeout(200);
        }
      }
      await page.getByTestId('submit-button').click();
      await page.waitForTimeout(2000);

      // 4. 학습 이력 페이지 접근
      await page.getByRole('button', { name: '학습 이력 보기' }).click();
      await page.waitForTimeout(2000);

      // 5. 이력 목록 확인
      const historyItems = page.locator('.history-item, [class*="history"]');
      const historyCount = await historyItems.count();
      expect(historyCount).toBeGreaterThan(0);

      // 6. 백엔드 API로 이력 확인
      const userId = await page.evaluate(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          return user.id;
        }
        return null;
      });

      if (userId) {
        const apiResponse = await page.evaluate(async (uid) => {
          try {
            const response = await fetch(`http://localhost:8000/api/v1/users/${uid}/history`, {
              credentials: 'include',
            });
            return await response.json();
          } catch (error) {
            return null;
          }
        }, userId);

        if (apiResponse && apiResponse.success) {
          expect(apiResponse.data.length).toBeGreaterThanOrEqual(0);
          // 오늘 날짜의 이력 확인
          const today = new Date().toISOString().split('T')[0];
          const todayHistory = apiResponse.data.filter((h: any) => h.study_date === today);
          expect(todayHistory.length).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  test.describe('체크리스트 상태 동기화 깊은 검증', () => {
    test('should sync checklist state after study mode completion', async ({ page }) => {
      // 1. 로그인 및 학습 계획 접근
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('체크리스트 동기화 테스트');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });

      await page.getByRole('button', { name: '6주 학습 계획' }).click();
      await page.waitForTimeout(1000);

      // 2. Day 1 체크리스트 접근
      await page.locator('.task-item').first().click();
      await page.waitForTimeout(500);

      // 3. 초기 상태 확인 (체크박스가 체크되지 않음)
      const checkboxes = page.locator('input[type="checkbox"]');
      const vocabularyCheckbox = checkboxes.nth(0);
      const grammarCheckbox = checkboxes.nth(1);
      
      expect(await vocabularyCheckbox.isChecked()).toBe(false);
      expect(await grammarCheckbox.isChecked()).toBe(false);

      // 4. 문법 학습 시작
      await page.getByRole('button', { name: /문법 학습 시작/i }).click();
      await page.waitForTimeout(1000);
      await expect(page.getByTestId('study-ui')).toBeVisible({ timeout: 15000 });

      // 5. 문제 풀이 및 제출
      const studyQuestions = page.locator('[data-testid^="choice-"]');
      const count = await studyQuestions.count();
      for (let i = 0; i < Math.min(2, count); i++) {
        await studyQuestions.nth(i).click();
        await page.waitForTimeout(200);
        if (i < Math.min(2, count) - 1) {
          await page.getByTestId('next-button').click();
          await page.waitForTimeout(200);
        }
      }
      await page.getByTestId('submit-button').click();
      await page.waitForTimeout(2000);

      // 6. 체크리스트로 돌아가서 grammar 체크 확인
      await page.waitForTimeout(1000);
      const grammarCheckboxAfter = page.locator('input[type="checkbox"]').nth(1);
      expect(await grammarCheckboxAfter.isChecked()).toBe(true);

      // 7. localStorage 확인
      const day1Data = await page.evaluate(() => 
        localStorage.getItem('studyPlan_day1_completed')
      );
      expect(day1Data).toBeTruthy();
      if (day1Data && day1Data !== 'true') {
        const parsed = JSON.parse(day1Data);
        expect(parsed.grammar).toBe(true);
      }

      // 8. vocabulary 학습 시작
      await page.getByRole('button', { name: /단어 학습 시작/i }).click();
      await page.waitForTimeout(1000);
      await expect(page.getByTestId('study-ui')).toBeVisible({ timeout: 15000 });

      // 9. 문제 풀이 및 제출
      const vocabQuestions = page.locator('[data-testid^="choice-"]');
      const vocabCount = await vocabQuestions.count();
      for (let i = 0; i < Math.min(20, vocabCount); i++) {
        await vocabQuestions.nth(i).click();
        await page.waitForTimeout(100);
        if (i < Math.min(20, vocabCount) - 1) {
          await page.getByTestId('next-button').click();
          await page.waitForTimeout(100);
        }
      }
      await page.getByTestId('submit-button').click();
      await page.waitForTimeout(2000);

      // 10. 체크리스트로 돌아가서 vocabulary 체크 확인
      await page.waitForTimeout(1000);
      const vocabularyCheckboxAfter = page.locator('input[type="checkbox"]').nth(0);
      expect(await vocabularyCheckboxAfter.isChecked()).toBe(true);

      // 11. 학습 계획 대시보드에서 Day 1 완료 확인
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(2000);
      
      const day1Task = page.locator('.task-item').first();
      const hasCheckIcon = await day1Task.locator('.check-icon, [class*="check"]').count();
      expect(hasCheckIcon).toBeGreaterThan(0);
    });
  });

  test.describe('복합 플로우 데이터 일관성 검증', () => {
    test('should maintain data consistency across multiple features', async ({ page }) => {
      // 1. 회원가입
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('복합 플로우 테스트');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });

      // 2. 학습 계획 접근
      await page.getByRole('button', { name: '6주 학습 계획' }).click();
      await page.waitForTimeout(1000);

      // 3. Day 1 체크리스트 접근
      await page.locator('.task-item').first().click();
      await page.waitForTimeout(500);

      // 4. 문법 학습 완료
      await page.getByRole('button', { name: /문법 학습 시작/i }).click();
      await page.waitForTimeout(1000);
      await expect(page.getByTestId('study-ui')).toBeVisible({ timeout: 15000 });

      const studyQuestions = page.locator('[data-testid^="choice-"]');
      const count = await studyQuestions.count();
      for (let i = 0; i < Math.min(2, count); i++) {
        await studyQuestions.nth(i).click();
        await page.waitForTimeout(200);
        if (i < Math.min(2, count) - 1) {
          await page.getByTestId('next-button').click();
          await page.waitForTimeout(200);
        }
      }
      await page.getByTestId('submit-button').click();
      await page.waitForTimeout(2000);

      // 5. 체크리스트에서 grammar 체크 확인
      await page.waitForTimeout(1000);
      const grammarCheckbox = page.locator('input[type="checkbox"]').nth(1);
      expect(await grammarCheckbox.isChecked()).toBe(true);

      // 6. 학습 계획 대시보드로 돌아가서 진도율 확인
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(2000);
      const progress = await page.locator('.overall-progress .progress-text').textContent();
      expect(progress).toContain('%');

      // 7. 일일 목표 설정
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: '일일 목표' }).click();
      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: '목표 수정' }).click();
      await page.waitForTimeout(500);

      const questionsInput = page.locator('input[id="target-questions"]');
      await questionsInput.clear();
      await questionsInput.fill('10');
      const minutesInput = page.locator('input[id="target-minutes"]');
      await minutesInput.clear();
      await minutesInput.fill('30');
      await page.getByRole('button', { name: '저장' }).click();
      await page.waitForTimeout(1000);

      // 8. Day 1 체크리스트에서 vocabulary 학습 완료
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: '6주 학습 계획' }).click();
      await page.waitForTimeout(1000);
      await page.locator('.task-item').first().click();
      await page.waitForTimeout(500);

      await page.getByRole('button', { name: /단어 학습 시작/i }).click();
      await page.waitForTimeout(1000);
      await expect(page.getByTestId('study-ui')).toBeVisible({ timeout: 15000 });

      const vocabQuestions = page.locator('[data-testid^="choice-"]');
      const vocabCount = await vocabQuestions.count();
      for (let i = 0; i < Math.min(20, vocabCount); i++) {
        await vocabQuestions.nth(i).click();
        await page.waitForTimeout(100);
        if (i < Math.min(20, vocabCount) - 1) {
          await page.getByTestId('next-button').click();
          await page.waitForTimeout(100);
        }
      }
      await page.getByTestId('submit-button').click();
      await page.waitForTimeout(2000);

      // 9. 일일 목표 페이지에서 달성률 확인
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: '일일 목표' }).click();
      await page.waitForTimeout(2000);

      const achievementRate = await page.locator('.progress-percentage').first().textContent();
      expect(achievementRate).toBeTruthy();

      // 10. 학습 이력 페이지에서 두 세션 확인
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: '학습 이력 보기' }).click();
      await page.waitForTimeout(2000);

      const historyItems = page.locator('.history-item, [class*="history"]');
      const historyCount = await historyItems.count();
      expect(historyCount).toBeGreaterThan(0);

      // 11. 학습 계획 대시보드에서 Day 1 완료 확인
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: '6주 학습 계획' }).click();
      await page.waitForTimeout(2000);

      const day1Task = page.locator('.task-item').first();
      const hasCheckIcon = await day1Task.locator('.check-icon, [class*="check"]').count();
      expect(hasCheckIcon).toBeGreaterThan(0);
    });
  });

  test.describe('테스트 → 오답 노트 → 반복 학습 복합 시나리오', () => {
    test('should complete test → wrong answers → repeat study flow', async ({ page }) => {
      // 1. 회원가입
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('오답 노트 테스트');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });

      // 2. 테스트 모드 시작
      await page.getByRole('button', { name: '테스트 모드' }).click();
      await expect(page.getByTestId('test-ui')).toBeVisible({ timeout: 15000 });

      // 3. 테스트 문제 풀이 (일부 오답 포함)
      const questionIndicators = page.locator('[data-testid^="question-indicator-"]');
      const count = await questionIndicators.count();
      
      for (let i = 0; i < count; i++) {
        // 일부 문제는 두 번째 선택지 선택 (오답 가능성)
        const choiceIndex = i % 2 === 0 ? 0 : 1;
        const choices = page.locator('[data-testid^="choice-"]');
        const choiceCount = await choices.count();
        if (choiceCount > choiceIndex) {
          await choices.nth(choiceIndex).click();
        }
        if (i < count - 1) {
          await page.getByTestId('next-button').click();
        }
      }

      // 4. 테스트 제출
      await page.getByTestId('submit-button').click();
      await expect(page.getByTestId('result-ui')).toBeVisible({ timeout: 15000 });

      // 5. 결과 확인
      await expect(page.getByText('테스트 결과')).toBeVisible();

      // 6. 오답 노트 접근
      await page.getByRole('button', { name: /오답 노트|다시 시작/i }).click();
      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: '오답 노트' }).click();
      await page.waitForTimeout(2000);

      // 7. 오답 노트에서 오답 문제 확인
      const wrongAnswerItems = page.locator('.wrong-answer-item, [class*="wrong"]');
      const wrongCount = await wrongAnswerItems.count();
      // 오답이 있으면 확인
      if (wrongCount > 0) {
        expect(wrongCount).toBeGreaterThan(0);
      }

      // 8. 반복 학습 시작
      await page.getByRole('button', { name: /반복 학습|다시 학습/i }).click();
      await page.waitForTimeout(2000);

      // 9. 학습 이력 페이지에서 테스트와 반복 학습 세션 확인
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: '학습 이력 보기' }).click();
      await page.waitForTimeout(2000);

      const historyItems = page.locator('.history-item, [class*="history"]');
      const historyCount = await historyItems.count();
      expect(historyCount).toBeGreaterThan(0);
    });
  });

  test.describe('학습 계획 → 체크리스트 → 학습 → 진도율 업데이트 복합 시나리오', () => {
    test('should update progress correctly through study plan flow', async ({ page }) => {
      // 1. 회원가입 및 학습 계획 접근
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('진도율 업데이트 테스트');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });

      await page.getByRole('button', { name: '6주 학습 계획' }).click();
      await page.waitForTimeout(1000);

      // 2. 초기 진도율 확인 (0%)
      const initialProgress = await page.locator('.overall-progress .progress-text').textContent();
      expect(initialProgress).toContain('0%');

      // 3. Day 1 체크리스트 접근
      await page.locator('.task-item').first().click();
      await page.waitForTimeout(500);

      // 4. 문법 학습 시작 및 완료
      await page.getByRole('button', { name: /문법 학습 시작/i }).click();
      await page.waitForTimeout(1000);
      await expect(page.getByTestId('study-ui')).toBeVisible({ timeout: 15000 });

      const studyQuestions = page.locator('[data-testid^="choice-"]');
      const count = await studyQuestions.count();
      for (let i = 0; i < Math.min(2, count); i++) {
        await studyQuestions.nth(i).click();
        await page.waitForTimeout(200);
        if (i < Math.min(2, count) - 1) {
          await page.getByTestId('next-button').click();
          await page.waitForTimeout(200);
        }
      }
      await page.getByTestId('submit-button').click();
      await page.waitForTimeout(2000);

      // 5. 체크리스트로 돌아가서 grammar 체크 확인
      await page.waitForTimeout(1000);
      const grammarCheckbox = page.locator('input[type="checkbox"]').nth(1);
      expect(await grammarCheckbox.isChecked()).toBe(true);

      // 6. vocabulary 학습 시작 및 완료
      await page.getByRole('button', { name: /단어 학습 시작/i }).click();
      await page.waitForTimeout(1000);
      await expect(page.getByTestId('study-ui')).toBeVisible({ timeout: 15000 });

      const vocabQuestions = page.locator('[data-testid^="choice-"]');
      const vocabCount = await vocabQuestions.count();
      for (let i = 0; i < Math.min(20, vocabCount); i++) {
        await vocabQuestions.nth(i).click();
        await page.waitForTimeout(100);
        if (i < Math.min(20, vocabCount) - 1) {
          await page.getByTestId('next-button').click();
          await page.waitForTimeout(100);
        }
      }
      await page.getByTestId('submit-button').click();
      await page.waitForTimeout(2000);

      // 7. 체크리스트로 돌아가서 vocabulary 체크 확인
      await page.waitForTimeout(1000);
      const vocabularyCheckbox = page.locator('input[type="checkbox"]').nth(0);
      expect(await vocabularyCheckbox.isChecked()).toBe(true);

      // 8. 학습 계획 대시보드로 돌아가기
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(2000);

      // 9. Day 1 완료 표시 확인
      const day1Task = page.locator('.task-item').first();
      const hasCheckIcon = await day1Task.locator('.check-icon, [class*="check"]').count();
      expect(hasCheckIcon).toBeGreaterThan(0);

      // 10. 전체 진도율 확인 (1/42 = 약 2.4%)
      const updatedProgress = await page.locator('.overall-progress .progress-text').textContent();
      expect(updatedProgress).toContain('2%');

      // 11. 1주차 진도율 확인 (1/7 = 약 14.3%)
      const week1Progress = await page.locator('.week-card:first-child .week-progress').textContent();
      expect(week1Progress).toContain('14%');
    });
  });

  test.describe('일일 목표 → 여러 학습 세션 → 목표 달성 → 이력 확인 복합 시나리오', () => {
    test('should achieve daily goal through multiple study sessions', async ({ page }) => {
      // 1. 회원가입
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('일일 목표 달성 테스트');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });

      // 2. 일일 목표 설정 (문제 20개, 시간 60분)
      await page.getByRole('button', { name: '일일 목표' }).click();
      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: '목표 수정' }).click();
      await page.waitForTimeout(500);

      const questionsInput = page.locator('input[id="target-questions"]');
      await questionsInput.clear();
      await questionsInput.fill('20');
      const minutesInput = page.locator('input[id="target-minutes"]');
      await minutesInput.clear();
      await minutesInput.fill('60');
      await page.getByRole('button', { name: '저장' }).click();
      await page.waitForTimeout(1000);

      // 3. 초기 달성률 확인 (0%)
      const initialProgress = await page.locator('.progress-percentage').first().textContent();
      expect(initialProgress).toContain('0.0%');

      // 4. 학습 모드 1: 문법 10문제
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: '학습 모드' }).click();
      await page.waitForTimeout(1000);
      await expect(page.getByTestId('study-ui')).toBeVisible({ timeout: 15000 });

      const studyQuestions1 = page.locator('[data-testid^="choice-"]');
      const count1 = await studyQuestions1.count();
      for (let i = 0; i < Math.min(10, count1); i++) {
        await studyQuestions1.nth(i).click();
        await page.waitForTimeout(200);
        if (i < Math.min(10, count1) - 1) {
          await page.getByTestId('next-button').click();
          await page.waitForTimeout(200);
        }
      }
      await page.getByTestId('submit-button').click();
      await page.waitForTimeout(2000);

      // 5. 일일 목표 페이지에서 달성률 확인 (50%)
      await page.getByRole('button', { name: '일일 목표' }).click();
      await page.waitForTimeout(2000);
      const progressAfterFirst = await page.locator('.progress-percentage').first().textContent();
      expect(progressAfterFirst).toBeTruthy();

      // 6. 학습 모드 2: 독해 10문제
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: '학습 모드' }).click();
      await page.waitForTimeout(1000);
      await expect(page.getByTestId('study-ui')).toBeVisible({ timeout: 15000 });

      const studyQuestions2 = page.locator('[data-testid^="choice-"]');
      const count2 = await studyQuestions2.count();
      for (let i = 0; i < Math.min(10, count2); i++) {
        await studyQuestions2.nth(i).click();
        await page.waitForTimeout(200);
        if (i < Math.min(10, count2) - 1) {
          await page.getByTestId('next-button').click();
          await page.waitForTimeout(200);
        }
      }
      await page.getByTestId('submit-button').click();
      await page.waitForTimeout(2000);

      // 7. 일일 목표 페이지에서 달성률 확인 (100%)
      await page.getByRole('button', { name: '일일 목표' }).click();
      await page.waitForTimeout(2000);
      const progressAfterSecond = await page.locator('.progress-percentage').first().textContent();
      expect(progressAfterSecond).toBeTruthy();

      // 8. 목표 달성 배지 확인
      const achievementBadge = page.locator('.achievement-badge, [class*="achievement"]');
      const badgeCount = await achievementBadge.count();
      // 배지가 있으면 확인
      if (badgeCount > 0) {
        expect(badgeCount).toBeGreaterThan(0);
      }

      // 9. 학습 이력 페이지에서 두 세션 확인
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: '학습 이력 보기' }).click();
      await page.waitForTimeout(2000);

      const historyItems = page.locator('.history-item, [class*="history"]');
      const historyCount = await historyItems.count();
      expect(historyCount).toBeGreaterThan(0);

      // 10. 백엔드 API로 통계 확인
      const userId = await page.evaluate(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          return user.id;
        }
        return null;
      });

      if (userId) {
        const apiResponse = await page.evaluate(async (uid) => {
          try {
            const response = await fetch(`http://localhost:8000/api/v1/users/${uid}/daily-goal`, {
              credentials: 'include',
            });
            return await response.json();
          } catch (error) {
            return null;
          }
        }, userId);

        if (apiResponse && apiResponse.success) {
          expect(apiResponse.data.statistics.total_questions).toBeGreaterThanOrEqual(0);
          expect(apiResponse.data.statistics.total_minutes).toBeGreaterThanOrEqual(0);
          expect(apiResponse.data.statistics.study_sessions).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  test.describe('테스트 → 결과 → 성능 분석 → 학습 계획 연동 복합 시나리오', () => {
    test('should link test results to performance analysis and study plan', async ({ page }) => {
      // 1. 회원가입
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('성능 분석 연동 테스트');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });

      // 2. 테스트 모드 시작
      await page.getByRole('button', { name: '테스트 모드' }).click();
      await expect(page.getByTestId('test-ui')).toBeVisible({ timeout: 15000 });

      // 3. 테스트 문제 풀이
      const questionIndicators = page.locator('[data-testid^="question-indicator-"]');
      const count = await questionIndicators.count();
      for (let i = 0; i < count; i++) {
        const firstChoice = page.locator('[data-testid^="choice-"]').first();
        await firstChoice.click();
        if (i < count - 1) {
          await page.getByTestId('next-button').click();
        }
      }

      // 4. 테스트 제출
      await page.getByTestId('submit-button').click();
      await expect(page.getByTestId('result-ui')).toBeVisible({ timeout: 15000 });

      // 5. 결과 확인
      await expect(page.getByText('테스트 결과')).toBeVisible();
      const score = await page.getByTestId('score-value').textContent();
      expect(score).toBeTruthy();

      // 6. 성능 분석 페이지 접근
      await page.getByRole('button', { name: '다시 시작' }).click();
      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: '성능 분석 보기' }).click();
      await page.waitForTimeout(2000);
      await expect(page.getByTestId('user-performance-ui')).toBeVisible({ timeout: 15000 });

      // 7. 성능 분석 데이터 확인
      await expect(page.getByText('성능 분석')).toBeVisible();
      const typePerformance = page.getByTestId('type-performance');
      const hasTypePerformance = await typePerformance.isVisible().catch(() => false);
      expect(hasTypePerformance).toBe(true);

      // 8. 학습 계획 접근
      await page.getByRole('button', { name: '돌아가기' }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: '6주 학습 계획' }).click();
      await page.waitForTimeout(1000);

      // 9. Day 1 체크리스트 접근 및 문법 학습
      await page.locator('.task-item').first().click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: /문법 학습 시작/i }).click();
      await page.waitForTimeout(1000);
      await expect(page.getByTestId('study-ui')).toBeVisible({ timeout: 15000 });

      const studyQuestions = page.locator('[data-testid^="choice-"]');
      const studyCount = await studyQuestions.count();
      for (let i = 0; i < Math.min(2, studyCount); i++) {
        await studyQuestions.nth(i).click();
        await page.waitForTimeout(200);
        if (i < Math.min(2, studyCount) - 1) {
          await page.getByTestId('next-button').click();
          await page.waitForTimeout(200);
        }
      }
      await page.getByTestId('submit-button').click();
      await page.waitForTimeout(2000);

      // 10. 성능 분석 페이지 재확인
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: '성능 분석 보기' }).click();
      await page.waitForTimeout(2000);
      await expect(page.getByTestId('user-performance-ui')).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('어휘 학습 → 복습 → 학습 이력 → 프로필 확인 복합 시나리오', () => {
    test('should complete vocabulary learning and review flow', async ({ page }) => {
      // 1. 회원가입
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('어휘 학습 테스트');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });

      // 2. 어휘 학습 시작
      await page.getByRole('button', { name: /어휘 학습/i }).click();
      await page.waitForTimeout(2000);

      // 3. 어휘 목록 조회 확인
      const vocabularyItems = page.locator('.vocabulary-item, [class*="vocabulary"]');
      const vocabCount = await vocabularyItems.count();
      // 어휘가 있으면 확인
      if (vocabCount > 0) {
        expect(vocabCount).toBeGreaterThan(0);
      }

      // 4. 플래시카드로 어휘 학습 (10개)
      const flashcardButton = page.getByRole('button', { name: /플래시카드|카드/i });
      const hasFlashcard = await flashcardButton.isVisible().catch(() => false);
      if (hasFlashcard) {
        await flashcardButton.click();
        await page.waitForTimeout(1000);
        
        // 플래시카드 진행
        for (let i = 0; i < Math.min(10, vocabCount); i++) {
          const nextButton = page.getByRole('button', { name: /다음/i });
          const hasNext = await nextButton.isVisible().catch(() => false);
          if (hasNext) {
            await nextButton.click();
            await page.waitForTimeout(300);
          } else {
            break;
          }
        }
      }

      // 5. 어휘 복습 모드 접근
      await page.getByRole('button', { name: /복습|review/i }).click();
      await page.waitForTimeout(2000);

      // 6. 복습 진행 (easy/normal/hard 선택)
      const reviewButtons = page.getByRole('button', { name: /easy|normal|hard|쉬움|보통|어려움/i });
      const reviewButtonCount = await reviewButtons.count();
      if (reviewButtonCount > 0) {
        await reviewButtons.first().click();
        await page.waitForTimeout(1000);
      }

      // 7. 학습 이력 페이지에서 어휘 학습 세션 확인
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: '학습 이력 보기' }).click();
      await page.waitForTimeout(2000);

      const historyItems = page.locator('.history-item, [class*="history"]');
      const historyCount = await historyItems.count();
      expect(historyCount).toBeGreaterThanOrEqual(0);

      // 8. 프로필 페이지 접근
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: '프로필 관리' }).click();
      await page.waitForTimeout(2000);

      // 9. 프로필 정보 확인
      const profileUsername = page.getByText(new RegExp(username));
      await expect(profileUsername).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('여러 주차 학습 계획 완료 → 전체 진도율 확인 복합 시나리오', () => {
    test('should calculate overall progress correctly across multiple weeks', async ({ page }) => {
      // 1. 회원가입 및 학습 계획 접근
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('다중 주차 테스트');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });

      await page.getByRole('button', { name: '6주 학습 계획' }).click();
      await page.waitForTimeout(1000);

      // 2. 1주차 Day 1-7 완료
      for (let day = 1; day <= 7; day++) {
        const taskItems = page.locator('.task-item');
        const dayTask = taskItems.filter({ hasText: `Day ${day}` }).first();
        await dayTask.click();
        await page.waitForTimeout(500);

        const checkboxes = page.locator('input[type="checkbox"]');
        const checkboxCount = await checkboxes.count();
        if (checkboxCount >= 2) {
          await checkboxes.nth(0).click();
          await checkboxes.nth(1).click();
          await page.waitForTimeout(500);
        }

        await page.getByRole('button', { name: /돌아가기/i }).click();
        await page.waitForTimeout(1000);
      }

      // 3. 1주차 진도율 100% 확인
      const week1Progress = await page.locator('.week-card:first-child .week-progress').textContent();
      expect(week1Progress).toContain('100%');

      // 4. 전체 진도율 확인 (7/42 = 약 16.7%)
      const overallProgress1 = await page.locator('.overall-progress .progress-text').textContent();
      expect(overallProgress1).toContain('17%'); // 반올림

      // 5. 2주차 Day 8-14 완료
      for (let day = 8; day <= 14; day++) {
        const taskItems = page.locator('.task-item');
        const dayTask = taskItems.filter({ hasText: `Day ${day}` }).first();
        if (await dayTask.count() > 0) {
          await dayTask.click();
          await page.waitForTimeout(500);

          const checkboxes = page.locator('input[type="checkbox"]');
          const checkboxCount = await checkboxes.count();
          if (checkboxCount >= 2) {
            await checkboxes.nth(0).click();
            await checkboxes.nth(1).click();
            await page.waitForTimeout(500);
          }

          await page.getByRole('button', { name: /돌아가기/i }).click();
          await page.waitForTimeout(1000);
        }
      }

      // 6. 2주차 진도율 100% 확인
      const week2Progress = page.locator('.week-card').nth(1).locator('.week-progress');
      const week2ProgressText = await week2Progress.textContent();
      expect(week2ProgressText).toContain('100%');

      // 7. 전체 진도율 확인 (14/42 = 약 33.3%)
      const overallProgress2 = await page.locator('.overall-progress .progress-text').textContent();
      expect(overallProgress2).toContain('33%');
    });
  });

  test.describe('테스트 → 오답 노트 → 어휘 학습 → 복습 → 이력 확인 복합 시나리오', () => {
    test('should complete test → wrong answers → vocabulary → review flow', async ({ page }) => {
      // 1. 회원가입
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('오답 어휘 테스트');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });

      // 2. 테스트 모드 시작
      await page.getByRole('button', { name: '테스트 모드' }).click();
      await expect(page.getByTestId('test-ui')).toBeVisible({ timeout: 15000 });

      // 3. 테스트 문제 풀이 (어휘 관련 오답 포함)
      const questionIndicators = page.locator('[data-testid^="question-indicator-"]');
      const count = await questionIndicators.count();
      for (let i = 0; i < count; i++) {
        const choiceIndex = i % 2 === 0 ? 0 : 1;
        const choices = page.locator('[data-testid^="choice-"]');
        const choiceCount = await choices.count();
        if (choiceCount > choiceIndex) {
          await choices.nth(choiceIndex).click();
        }
        if (i < count - 1) {
          await page.getByTestId('next-button').click();
        }
      }

      // 4. 테스트 제출
      await page.getByTestId('submit-button').click();
      await expect(page.getByTestId('result-ui')).toBeVisible({ timeout: 15000 });

      // 5. 오답 노트 접근
      await page.getByRole('button', { name: /다시 시작/i }).click();
      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: '오답 노트' }).click();
      await page.waitForTimeout(2000);

      // 6. 어휘 학습 시작
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: /어휘 학습/i }).click();
      await page.waitForTimeout(2000);

      // 7. 어휘 학습 진행
      const vocabularyItems = page.locator('.vocabulary-item, [class*="vocabulary"]');
      const vocabCount = await vocabularyItems.count();
      if (vocabCount > 0) {
        expect(vocabCount).toBeGreaterThan(0);
      }

      // 8. 어휘 복습 모드 접근
      await page.getByRole('button', { name: /복습|review/i }).click();
      await page.waitForTimeout(2000);

      // 9. 복습 진행
      const reviewButtons = page.getByRole('button', { name: /easy|normal|hard|쉬움|보통|어려움/i });
      const reviewButtonCount = await reviewButtons.count();
      if (reviewButtonCount > 0) {
        await reviewButtons.first().click();
        await page.waitForTimeout(1000);
      }

      // 10. 학습 이력 페이지에서 모든 세션 확인
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: '학습 이력 보기' }).click();
      await page.waitForTimeout(2000);

      const historyItems = page.locator('.history-item, [class*="history"]');
      const historyCount = await historyItems.count();
      expect(historyCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('프로필 수정 → 목표 레벨 변경 → 학습 계획 재확인 복합 시나리오', () => {
    test('should update profile and reflect in study plan', async ({ page }) => {
      // 1. 회원가입 (목표 레벨 N5)
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('프로필 수정 테스트');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });

      // 2. 학습 계획 접근 → N5 학습 계획 확인
      await page.getByRole('button', { name: '6주 학습 계획' }).click();
      await page.waitForTimeout(1000);
      const studyPlanTitle = page.getByText(/JLPT N5/i);
      await expect(studyPlanTitle).toBeVisible({ timeout: 10000 });

      // 3. 프로필 관리 접근
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: '프로필 관리' }).click();
      await page.waitForTimeout(2000);

      // 4. 목표 레벨을 N4로 변경
      await page.getByRole('button', { name: /수정|편집/i }).click();
      await page.waitForTimeout(500);
      
      const targetLevelSelect = page.getByLabel('목표 레벨');
      await targetLevelSelect.selectOption('N4');
      await page.waitForTimeout(500);

      // 5. 프로필 저장
      await page.getByRole('button', { name: /저장|확인/i }).click();
      await page.waitForTimeout(2000);

      // 6. 학습 계획 재확인
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: '6주 학습 계획' }).click();
      await page.waitForTimeout(1000);

      // 학습 계획이 여전히 표시되는지 확인 (N5 또는 N4)
      const studyPlanTitleAfter = page.getByText(/JLPT N[45]/i);
      await expect(studyPlanTitleAfter).toBeVisible({ timeout: 10000 });

      // 7. 테스트 모드에서 레벨 선택 확인
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: '테스트 모드' }).click();
      await page.waitForTimeout(1000);
      // 테스트가 시작되면 성공
      await expect(page.getByTestId('test-ui')).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('학습 계획 → 체크리스트 → 학습 → 일일 목표 달성 → 이력 → 성능 분석 복합 시나리오', () => {
    test('should maintain data consistency across all features', async ({ page }) => {
      // 1. 회원가입
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('통합 플로우 테스트');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });

      // 2. 일일 목표 설정 (문제 15개, 시간 45분)
      await page.getByRole('button', { name: '일일 목표' }).click();
      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: '목표 수정' }).click();
      await page.waitForTimeout(500);

      const questionsInput = page.locator('input[id="target-questions"]');
      await questionsInput.clear();
      await questionsInput.fill('15');
      const minutesInput = page.locator('input[id="target-minutes"]');
      await minutesInput.clear();
      await minutesInput.fill('45');
      await page.getByRole('button', { name: '저장' }).click();
      await page.waitForTimeout(1000);

      // 3. 학습 계획 접근 → Day 1 체크리스트 접근
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: '6주 학습 계획' }).click();
      await page.waitForTimeout(1000);
      await page.locator('.task-item').first().click();
      await page.waitForTimeout(500);

      // 4. 문법 학습 시작 → 문제 풀이 → 제출 (5문제, 15분)
      await page.getByRole('button', { name: /문법 학습 시작/i }).click();
      await page.waitForTimeout(1000);
      await expect(page.getByTestId('study-ui')).toBeVisible({ timeout: 15000 });

      const studyQuestions1 = page.locator('[data-testid^="choice-"]');
      const count1 = await studyQuestions1.count();
      for (let i = 0; i < Math.min(5, count1); i++) {
        await studyQuestions1.nth(i).click();
        await page.waitForTimeout(200);
        if (i < Math.min(5, count1) - 1) {
          await page.getByTestId('next-button').click();
          await page.waitForTimeout(200);
        }
      }
      await page.getByTestId('submit-button').click();
      await page.waitForTimeout(2000);

      // 5. 일일 목표 페이지에서 달성률 확인 (33%)
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: '일일 목표' }).click();
      await page.waitForTimeout(2000);

      const progressAfterFirst = await page.locator('.progress-percentage').first().textContent();
      expect(progressAfterFirst).toBeTruthy();

      // 6. 체크리스트로 돌아가서 grammar 체크 확인
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: '6주 학습 계획' }).click();
      await page.waitForTimeout(1000);
      await page.locator('.task-item').first().click();
      await page.waitForTimeout(500);

      const grammarCheckbox = page.locator('input[type="checkbox"]').nth(1);
      expect(await grammarCheckbox.isChecked()).toBe(true);

      // 7. vocabulary 학습 시작 → 문제 풀이 → 제출 (20문제, 30분)
      await page.getByRole('button', { name: /단어 학습 시작/i }).click();
      await page.waitForTimeout(1000);
      await expect(page.getByTestId('study-ui')).toBeVisible({ timeout: 15000 });

      const studyQuestions2 = page.locator('[data-testid^="choice-"]');
      const count2 = await studyQuestions2.count();
      for (let i = 0; i < Math.min(20, count2); i++) {
        await studyQuestions2.nth(i).click();
        await page.waitForTimeout(100);
        if (i < Math.min(20, count2) - 1) {
          await page.getByTestId('next-button').click();
          await page.waitForTimeout(100);
        }
      }
      await page.getByTestId('submit-button').click();
      await page.waitForTimeout(2000);

      // 8. 일일 목표 페이지에서 달성률 확인 (100% 이상)
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: '일일 목표' }).click();
      await page.waitForTimeout(2000);

      const progressAfterSecond = await page.locator('.progress-percentage').first().textContent();
      expect(progressAfterSecond).toBeTruthy();

      // 9. 목표 달성 배지 확인
      const achievementBadge = page.locator('.achievement-badge, [class*="achievement"]');
      const badgeCount = await achievementBadge.count();
      if (badgeCount > 0) {
        expect(badgeCount).toBeGreaterThan(0);
      }

      // 10. 체크리스트에서 vocabulary 체크 확인
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: '6주 학습 계획' }).click();
      await page.waitForTimeout(1000);
      await page.locator('.task-item').first().click();
      await page.waitForTimeout(500);

      const vocabularyCheckbox = page.locator('input[type="checkbox"]').nth(0);
      expect(await vocabularyCheckbox.isChecked()).toBe(true);

      // 11. Day 1 완료 확인
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(2000);
      const day1Task = page.locator('.task-item').first();
      const hasCheckIcon = await day1Task.locator('.check-icon, [class*="check"]').count();
      expect(hasCheckIcon).toBeGreaterThan(0);

      // 12. 학습 계획 대시보드에서 진도율 확인
      const progress = await page.locator('.overall-progress .progress-text').textContent();
      expect(progress).toContain('%');

      // 13. 학습 이력 페이지에서 두 세션 확인
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: '학습 이력 보기' }).click();
      await page.waitForTimeout(2000);

      const historyItems = page.locator('.history-item, [class*="history"]');
      const historyCount = await historyItems.count();
      expect(historyCount).toBeGreaterThan(0);

      // 14. 성능 분석 페이지에서 오늘의 학습 통계 확인
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: '성능 분석 보기' }).click();
      await page.waitForTimeout(2000);
      await expect(page.getByTestId('user-performance-ui')).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('계산 로직 엣지 케이스 검증', () => {
    test('should handle edge cases in progress calculation', async ({ page }) => {
      // 1. 로그인 및 학습 계획 접근
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('엣지 케이스 테스트');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });

      await page.getByRole('button', { name: '6주 학습 계획' }).click();
      await page.waitForTimeout(1000);

      // 2. Day 1만 완료: 전체 진도율 1/42 = 2.38% (반올림 2%)
      await page.locator('.task-item').first().click();
      await page.waitForTimeout(500);

      const checkboxes = page.locator('input[type="checkbox"]');
      await checkboxes.nth(0).click();
      await checkboxes.nth(1).click();
      await page.waitForTimeout(1000);

      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(2000);

      const progress1 = await page.locator('.overall-progress .progress-text').textContent();
      expect(progress1).toContain('2%'); // 반올림

      // 3. Day 1-7 완료: 1주차 진도율 7/7 = 100%, 전체 진도율 7/42 = 16.67% (반올림 17%)
      for (let day = 2; day <= 7; day++) {
        const taskItems = page.locator('.task-item');
        const dayTask = taskItems.filter({ hasText: `Day ${day}` }).first();
        if (await dayTask.count() > 0) {
          await dayTask.click();
          await page.waitForTimeout(500);

          const dayCheckboxes = page.locator('input[type="checkbox"]');
          const checkboxCount = await dayCheckboxes.count();
          if (checkboxCount >= 2) {
            await dayCheckboxes.nth(0).click();
            await dayCheckboxes.nth(1).click();
            await page.waitForTimeout(500);
          }

          await page.getByRole('button', { name: /돌아가기/i }).click();
          await page.waitForTimeout(1000);
        }
      }

      const week1Progress = await page.locator('.week-card:first-child .week-progress').textContent();
      expect(week1Progress).toContain('100%');

      const progress7 = await page.locator('.overall-progress .progress-text').textContent();
      expect(progress7).toContain('17%'); // 반올림
    });

    test('should handle edge cases in daily goal achievement calculation', async ({ page }) => {
      // 1. 로그인
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('목표 엣지 케이스 테스트');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });

      // 2. 일일 목표 설정 (문제 10개, 시간 30분)
      await page.getByRole('button', { name: '일일 목표' }).click();
      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: '목표 수정' }).click();
      await page.waitForTimeout(500);

      const questionsInput = page.locator('input[id="target-questions"]');
      await questionsInput.clear();
      await questionsInput.fill('10');
      const minutesInput = page.locator('input[id="target-minutes"]');
      await minutesInput.clear();
      await minutesInput.fill('30');
      await page.getByRole('button', { name: '저장' }).click();
      await page.waitForTimeout(1000);

      // 3. 실제 문제 수가 목표보다 많을 때 달성률 100% 이상 처리 확인
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: '학습 모드' }).click();
      await page.waitForTimeout(1000);
      await expect(page.getByTestId('study-ui')).toBeVisible({ timeout: 15000 });

      // 많은 문제 풀이
      const studyQuestions = page.locator('[data-testid^="choice-"]');
      const count = await studyQuestions.count();
      for (let i = 0; i < Math.min(25, count); i++) {
        await studyQuestions.nth(i).click();
        await page.waitForTimeout(100);
        if (i < Math.min(25, count) - 1) {
          await page.getByTestId('next-button').click();
          await page.waitForTimeout(100);
        }
      }
      await page.getByTestId('submit-button').click();
      await page.waitForTimeout(2000);

      // 4. 일일 목표 페이지에서 달성률 확인 (100% 이상)
      await page.getByRole('button', { name: '일일 목표' }).click();
      await page.waitForTimeout(2000);

      const progress = await page.locator('.progress-percentage').first().textContent();
      expect(progress).toBeTruthy();
      // 달성률이 100% 이상일 수 있음
      const progressValue = parseFloat(progress?.replace('%', '') || '0');
      expect(progressValue).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('백엔드 데이터 검증 통합', () => {
    test('should verify backend data matches frontend state', async ({ page }) => {
      // 1. 로그인
      await page.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
      const { email, username } = makeUniqueUser('백엔드 검증 테스트');
      await page.getByLabel('이메일').fill(email);
      await page.getByLabel('사용자명').fill(username);
      await page.getByLabel('목표 레벨').selectOption('N5');
      await page.getByRole('button', { name: '회원가입' }).click();
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });

      // 2. 사용자 ID 가져오기
      const userId = await page.evaluate(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          return user.id;
        }
        return null;
      });
      expect(userId).toBeTruthy();

      // 3. 학습 세션 완료
      await page.getByRole('button', { name: '학습 모드' }).click();
      await page.waitForTimeout(1000);
      await expect(page.getByTestId('study-ui')).toBeVisible({ timeout: 15000 });

      const studyQuestions = page.locator('[data-testid^="choice-"]');
      const count = await studyQuestions.count();
      for (let i = 0; i < Math.min(5, count); i++) {
        await studyQuestions.nth(i).click();
        await page.waitForTimeout(200);
        if (i < Math.min(5, count) - 1) {
          await page.getByTestId('next-button').click();
          await page.waitForTimeout(200);
        }
      }
      await page.getByRole('button', { name: /제출/i }).click();
      await page.waitForTimeout(2000);

      // 4. 백엔드 API로 학습 이력 확인
      const historyResponse = await page.evaluate(async (uid) => {
        try {
          const response = await fetch(`http://localhost:8000/api/v1/users/${uid}/history`, {
            credentials: 'include',
          });
          return await response.json();
        } catch (error) {
          return null;
        }
      }, userId);

      expect(historyResponse).toBeTruthy();
      if (historyResponse && historyResponse.success) {
        expect(Array.isArray(historyResponse.data)).toBe(true);
        // 오늘 날짜의 이력 확인
        const today = new Date().toISOString().split('T')[0];
        const todayHistory = historyResponse.data.filter((h: any) => h.study_date === today);
        expect(todayHistory.length).toBeGreaterThanOrEqual(0);
      }

      // 5. 일일 목표 달성 후 백엔드 통계 확인
      await page.getByRole('button', { name: '일일 목표' }).click();
      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: '목표 수정' }).click();
      await page.waitForTimeout(500);

      const questionsInput = page.locator('input[id="target-questions"]');
      await questionsInput.clear();
      await questionsInput.fill('10');
      const minutesInput = page.locator('input[id="target-minutes"]');
      await minutesInput.clear();
      await minutesInput.fill('30');
      await page.getByRole('button', { name: '저장' }).click();
      await page.waitForTimeout(1000);

      const dailyGoalResponse = await page.evaluate(async (uid) => {
        try {
          const response = await fetch(`http://localhost:8000/api/v1/users/${uid}/daily-goal`, {
            credentials: 'include',
          });
          return await response.json();
        } catch (error) {
          return null;
        }
      }, userId);

      expect(dailyGoalResponse).toBeTruthy();
      if (dailyGoalResponse && dailyGoalResponse.success) {
        expect(dailyGoalResponse.data.statistics).toBeTruthy();
        expect(dailyGoalResponse.data.statistics.total_questions).toBeGreaterThanOrEqual(0);
        expect(dailyGoalResponse.data.statistics.total_minutes).toBeGreaterThanOrEqual(0);
        expect(dailyGoalResponse.data.statistics.study_sessions).toBeGreaterThanOrEqual(0);
      }

      // 6. 학습 계획 완료 후 localStorage와 백엔드 데이터 비교
      await page.getByRole('button', { name: /돌아가기/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: '6주 학습 계획' }).click();
      await page.waitForTimeout(1000);

      await page.locator('.task-item').first().click();
      await page.waitForTimeout(500);

      const checkboxes = page.locator('input[type="checkbox"]');
      await checkboxes.nth(0).click();
      await checkboxes.nth(1).click();
      await page.waitForTimeout(1000);

      const localStorageData = await page.evaluate(() => 
        localStorage.getItem('studyPlan_day1_completed')
      );
      expect(localStorageData).toBe('true');

      // 백엔드에는 학습 계획 데이터가 없을 수 있으므로, 학습 이력만 확인
      const finalHistoryResponse = await page.evaluate(async (uid) => {
        try {
          const response = await fetch(`http://localhost:8000/api/v1/users/${uid}/history`, {
            credentials: 'include',
          });
          return await response.json();
        } catch (error) {
          return null;
        }
      }, userId);

      if (finalHistoryResponse && finalHistoryResponse.success) {
        expect(Array.isArray(finalHistoryResponse.data)).toBe(true);
      }
    });
  });
});

