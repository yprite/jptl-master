/**
 * E2E 테스트 - Playwright
 * 전체 사용자 플로우 테스트
 */

import { test, expect } from '@playwright/test';

test.describe('JLPT App E2E', () => {
  test.beforeEach(async ({ page }) => {
    // 앱 시작 페이지로 이동
    await page.goto('http://localhost:3000');
  });

  test('should display initial page with start button', async ({ page }) => {
    // 제목 확인
    await expect(page.getByText('JLPT 자격 검증 프로그램')).toBeVisible();

    // 시작 버튼 확인
    await expect(
      page.getByRole('button', { name: '테스트 시작' })
    ).toBeVisible();
  });

  test('should complete full test flow', async ({ page }) => {
    // 테스트 시작
    await page.getByRole('button', { name: '테스트 시작' }).click();

    // 로딩 상태 확인
    await expect(page.getByText('테스트를 준비하는 중')).toBeVisible();

    // 테스트 UI 표시 확인 (API 응답 대기)
    await expect(
      page.getByText(/「こんにちは」の意味は何ですか？/),
      { timeout: 5000 }
    ).toBeVisible();

    // 답안 선택
    await page.getByText('안녕하세요').click();

    // 제출 버튼 확인 및 클릭
    const submitButton = page.getByRole('button', { name: /제출/i });
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // 결과 페이지 확인
    await expect(page.getByText('테스트 결과'), { timeout: 5000 }).toBeVisible();
    await expect(page.getByText(/점수/i)).toBeVisible();
  });

  test('should handle error state', async ({ page }) => {
    // API 실패 시뮬레이션을 위해 네트워크 요청 차단
    await page.route('**/api/v1/tests/diagnostic/n5', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ success: false, message: 'Server Error' }),
      });
    });

    // 테스트 시작
    await page.getByRole('button', { name: '테스트 시작' }).click();

    // 에러 메시지 확인
    await expect(page.getByText('오류가 발생했습니다')).toBeVisible();
    await expect(page.getByText('Server Error')).toBeVisible();

    // 다시 시도 버튼 확인
    await expect(
      page.getByRole('button', { name: /다시 시도/i })
    ).toBeVisible();
  });
});

