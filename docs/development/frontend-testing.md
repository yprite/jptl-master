# 프론트엔드 테스트 가이드

이 문서는 프론트엔드 테스트 전략, 도구, 그리고 모범 사례를 정의합니다.

## 테스트 도구 스택

### 실무에서 자주 쓰는 조합 (추천)
- **유닛/컴포넌트 테스트**: Vitest (또는 Jest) + Testing Library
- **E2E 테스트**: Playwright
- **API 목킹**: MSW (Mock Service Worker)

## 테스트 전략

### 테스트 피라미드
```
        /\
       /E2E\        ← 전체 사용자 플로우 (소수)
      /------\
     /컴포넌트\      ← UI 상호작용 (중간)
    /----------\
   /   유닛     \    ← 비즈니스 로직 (다수)
  /--------------\
```

### 테스트 범위 결정 기준

#### 1. 로직은 유닛, UI 상호작용은 컴포넌트, 전체 흐름은 E2E
- **유닛 테스트**: 순수 함수, 유틸리티, 비즈니스 로직
  - 예: `calculateScore()`, `formatDate()`, `validateInput()`
- **컴포넌트 테스트**: React 컴포넌트의 렌더링 및 상호작용
  - 예: 버튼 클릭, 폼 제출, 상태 변경
- **E2E 테스트**: 실제 브라우저에서의 전체 사용자 플로우
  - 예: 로그인 → 시험 시작 → 문제 풀이 → 결과 확인

#### 2. 테스트는 "사용자가 보는 것" 기준으로 작성
- **사용자 관점 검증**: 화면에 보이는 텍스트, role, label로 검증
- **구현 세부사항 테스트 금지**: 내부 상태나 props 구조 직접 테스트하지 않음
- **접근성 고려**: ARIA role, label, name 속성 활용

**좋은 예:**
```typescript
// ✅ 사용자가 보는 것 기준
const button = screen.getByRole('button', { name: '시험 시작' });
expect(button).toBeInTheDocument();
```

**나쁜 예:**
```typescript
// ❌ 구현 세부사항 테스트
expect(component.state.isLoading).toBe(true);
expect(component.props.onSubmit).toHaveBeenCalled();
```

#### 3. 네트워크는 MSW로 성공/실패/지연 케이스를 쉽게 만들기
- **MSW (Mock Service Worker) 사용**: 실제 네트워크 요청을 가로채서 목킹
- **다양한 시나리오 테스트**: 성공, 실패, 지연, 타임아웃 등
- **실제 API 스펙 반영**: OpenAPI 스펙 기반으로 핸들러 작성

**예시:**
```typescript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  // 성공 케이스
  rest.get('/api/tests', (req, res, ctx) => {
    return res(ctx.json({ tests: [...] }));
  }),
  // 실패 케이스
  rest.post('/api/tests', (req, res, ctx) => {
    return res(ctx.status(500), ctx.json({ error: 'Server Error' }));
  }),
  // 지연 케이스
  rest.get('/api/results', (req, res, ctx) => {
    return res(ctx.delay(1000), ctx.json({ results: [...] }));
  })
);
```

#### 4. 스냅샷 테스트는 남발 금지 (진짜 가치 있는 UI만)
- **스냅샷 테스트 사용 시기**:
  - 중요한 UI 컴포넌트 (예: 에러 메시지, 알림)
  - 복잡한 레이아웃 컴포넌트
  - 디자인 시스템 컴포넌트
- **스냅샷 테스트 피해야 할 경우**:
  - 단순한 컴포넌트
  - 자주 변경되는 컴포넌트
  - 동적 데이터를 포함하는 컴포넌트

## 테스트 작성 가이드

### 유닛 테스트 예시

```typescript
import { describe, it, expect } from 'vitest';
import { calculateScore } from './utils';

describe('calculateScore', () => {
  it('정답일 때 1점을 반환해야 함', () => {
    expect(calculateScore(true)).toBe(1);
  });

  it('오답일 때 0점을 반환해야 함', () => {
    expect(calculateScore(false)).toBe(0);
  });
});
```

### 컴포넌트 테스트 예시

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestList } from './TestList';

describe('TestList', () => {
  it('시험 목록을 표시해야 함', () => {
    const tests = [
      { id: 1, title: 'JLPT N5 모의고사' },
      { id: 2, title: 'JLPT N4 모의고사' },
    ];
    
    render(<TestList tests={tests} />);
    
    expect(screen.getByText('JLPT N5 모의고사')).toBeInTheDocument();
    expect(screen.getByText('JLPT N4 모의고사')).toBeInTheDocument();
  });

  it('시험 시작 버튼 클릭 시 onStart 콜백을 호출해야 함', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    const tests = [{ id: 1, title: 'JLPT N5 모의고사' }];
    
    render(<TestList tests={tests} onStart={onStart} />);
    
    const startButton = screen.getByRole('button', { name: '시험 시작' });
    await user.click(startButton);
    
    expect(onStart).toHaveBeenCalledWith(1);
  });
});
```

### E2E 테스트 예시 (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test('사용자가 시험을 완료하고 결과를 확인할 수 있어야 함', async ({ page }) => {
  // 로그인
  await page.goto('/login');
  await page.fill('[name="email"]', 'user@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // 시험 시작
  await page.goto('/tests');
  await page.click('text=JLPT N5 모의고사');
  await page.click('button:has-text("시험 시작")');

  // 문제 풀이
  await page.click('input[value="option1"]');
  await page.click('button:has-text("다음")');
  
  // 제출
  await page.click('button:has-text("제출")');
  
  // 결과 확인
  await expect(page.locator('text=점수')).toBeVisible();
  await expect(page.locator('text=정답률')).toBeVisible();
});
```

## MSW 설정

### 1. MSW 설치
```bash
npm install --save-dev msw
```

### 2. 핸들러 작성

`src/mocks/handlers.ts`:
```typescript
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/tests', (req, res, ctx) => {
    return res(
      ctx.json({
        tests: [
          { id: 1, title: 'JLPT N5 모의고사', level: 'N5' },
          { id: 2, title: 'JLPT N4 모의고사', level: 'N4' },
        ],
      })
    );
  }),

  rest.post('/api/tests/:id/start', (req, res, ctx) => {
    return res(
      ctx.json({
        testSessionId: 'session-123',
        questions: [
          { id: 1, text: '問題1', options: ['A', 'B', 'C', 'D'] },
        ],
      })
    );
  }),

  rest.post('/api/tests/:id/submit', (req, res, ctx) => {
    return res(
      ctx.json({
        resultId: 'result-123',
        score: 85,
        totalQuestions: 100,
        correctAnswers: 85,
      })
    );
  }),
];
```

### 3. 테스트 환경 설정

`src/mocks/setup.ts`:
```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### 4. 테스트 파일에서 사용

```typescript
import { server } from '../mocks/setup';
import { rest } from 'msw';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('에러 케이스 테스트', async () => {
  server.use(
    rest.get('/api/tests', (req, res, ctx) => {
      return res(ctx.status(500), ctx.json({ error: 'Server Error' }));
    })
  );

  render(<TestList />);
  expect(await screen.findByText('서버 오류가 발생했습니다')).toBeInTheDocument();
});
```

## 테스트 커버리지

- **목표 커버리지**: 최소 80% 코드 커버리지
- **주요 사용자 플로우**: 100% 커버리지 필수
- **커버리지 측정**: Vitest의 `--coverage` 옵션 사용

```bash
npm run test -- --coverage
```

## 테스트 실행

### 개발 중 테스트
```bash
npm run test        # Jest/Vitest watch 모드
npm run test:watch  # 파일 변경 시 자동 재실행
```

### CI/CD 테스트
```bash
npm run test:ci     # 단일 실행, 커버리지 포함
npm run test:e2e    # E2E 테스트 실행
```

## 참고 자료

- [Testing Library 공식 문서](https://testing-library.com/)
- [Vitest 공식 문서](https://vitest.dev/)
- [Playwright 공식 문서](https://playwright.dev/)
- [MSW 공식 문서](https://mswjs.io/)

