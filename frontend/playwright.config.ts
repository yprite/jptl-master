import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '../tests/frontend/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  // CI에서는 어떤 테스트가 실행 중인지 콘솔에서 바로 보이도록 line 리포터를 사용하고,
  // 로컬에서는 기존처럼 html 리포트를 유지합니다.
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    headless: true, // 헤드리스 모드로 실행 (브라우저 창 열리지 않음)
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 서버 시작 타임아웃 120초
  },
});

