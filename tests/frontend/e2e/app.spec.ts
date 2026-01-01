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
    test('should display admin buttons when admin user logs in', async ({ page }) => {
      // 어드민 계정으로 로그인
      await page.getByLabel('이메일').fill('admin@example.com');
      await page.getByRole('button', { name: '로그인' }).click();

      // 초기 페이지에서 어드민 버튼들이 표시되는지 확인
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });
      await expect(page.getByRole('button', { name: '어드민 - 대시보드' })).toBeVisible();
      await expect(page.getByRole('button', { name: '어드민 - 사용자 관리' })).toBeVisible();
      await expect(page.getByRole('button', { name: '어드민 - 문제 관리' })).toBeVisible();
    });

    test('should navigate to admin dashboard', async ({ page }) => {
      // 어드민 계정으로 로그인
      await page.getByLabel('이메일').fill('admin@example.com');
      await page.getByRole('button', { name: '로그인' }).click();
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });

      // 어드민 대시보드로 이동
      await page.getByRole('button', { name: '어드민 - 대시보드' }).click();

      // 어드민 레이아웃과 네비게이션이 표시되는지 확인
      await expect(page.getByText('어드민 관리')).toBeVisible();
      await expect(page.getByRole('button', { name: '대시보드' })).toBeVisible();
      await expect(page.getByRole('button', { name: '사용자 관리' })).toBeVisible();
      await expect(page.getByRole('button', { name: '문제 관리' })).toBeVisible();
    });

    test('should navigate between admin pages', async ({ page }) => {
      // 어드민 계정으로 로그인
      await page.getByLabel('이메일').fill('admin@example.com');
      await page.getByRole('button', { name: '로그인' }).click();
      await expect(page.getByText('JLPT 학습 플랫폼')).toBeVisible({ timeout: 15000 });

      // 어드민 대시보드로 이동
      await page.getByRole('button', { name: '어드민 - 대시보드' }).click();
      await expect(page.getByText('어드민 관리')).toBeVisible();

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
  });
});

