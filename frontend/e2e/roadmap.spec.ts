import { test, expect } from '@playwright/test';

function makeUniqueUser() {
  const suffix = Date.now();
  return {
    email: `roadmap-e2e-${suffix}@example.com`,
    username: `roadmap-e2e-${suffix}`,
  };
}

test.describe('Roadmap Dashboard E2E', () => {
  test('registers, saves a roadmap, and starts reviewing the active day', async ({ page }) => {
    const user = makeUniqueUser();

    await page.goto('/');
    await expect(page.getByRole('heading', { name: '레벨별 완주 코스' })).toBeVisible();

    await page.getByRole('button', { name: '로그인 / 회원가입' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', { name: /계정이 없으신가요\? 회원가입/ }).click();
    await dialog.getByLabel('이메일').fill(user.email);
    await dialog.getByLabel('사용자명').fill(user.username);
    await dialog.getByLabel('목표 레벨').selectOption('N5');
    await dialog.getByRole('button', { name: '회원가입', exact: true }).click();

    await expect(page.getByText('회원가입과 로그인에 성공했습니다.')).toBeVisible();
    await expect(page.getByText(new RegExp(`${user.username}님의 학습 세션`))).toBeVisible();

    await page.locator('input[type="date"]').fill('2026-03-15');
    await page.getByRole('button', { name: '현재 플랜 저장' }).click();

    await expect(page.getByText(`${user.username}님의 로드맵을 저장했습니다.`)).toBeVisible();
    await expect(page.getByRole('heading', { name: '개인 로드맵 현황' })).toBeVisible();
    await expect(page.getByText('진행 중')).toBeVisible();

    const dayReviewButton = page.locator('button[aria-label^="day-review-"][aria-label$="-again"]').first();
    await expect(dayReviewButton).toBeVisible();
    await dayReviewButton.click();

    await expect(page.getByText(/카드를 Again 평가로 기록했습니다\./)).toBeVisible();

    const dueReviewButton = page.locator('button[aria-label^="due-review-"]').first();
    await expect(dueReviewButton).toBeVisible();
  });
});
