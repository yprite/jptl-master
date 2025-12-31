# 변경 이력 (AI 파싱용)

## 메타데이터
형식: Keep a Changelog
현재_버전: Unreleased
마지막_릴리즈: 0.1.0 (2024-12-27)

## Unreleased

### Fixed
어드민_로그인_화면_표시_문제: 어드민 로그인 후 화면 표시 문제 수정 (2025-01-04)
- 백엔드 UserResponse에 is_admin 필드 추가
- /api/v1/users/me 엔드포인트에서 is_admin 필드 반환
- 프론트엔드 userApi.getCurrentUser() 타입에 is_admin 추가
- 어드민 사용자 로그인 시 어드민 버튼이 정상적으로 표시되도록 수정
- E2E 테스트 추가 (어드민 로그인 및 화면 표시 검증)
- 시나리오 테스트 추가 (어드민 플로우 검증)
- 모든 테스트 통과 및 커버리지 92% 유지

어드민_UI_분리: 어드민 페이지에서 일반 사용자 메뉴 숨김 처리 (2025-01-04)
- 어드민 페이지에서는 일반 사용자 헤더 숨김 처리
- 어드민 전용 헤더 추가 (어드민 전용 스타일 및 로그아웃 버튼)
- 어드민 페이지에서 일반 사용자 메뉴(테스트 시작, 성능 분석 등) 완전 분리
- requirements.md에 어드민 UI 분리 요구사항 추가
- 모든 테스트 통과 및 커버리지 92.47% 유지
- 백엔드 UserResponse에 is_admin 필드 추가
- /api/v1/users/me 엔드포인트에서 is_admin 필드 반환
- 프론트엔드 userApi.getCurrentUser() 타입에 is_admin 추가
- 어드민 사용자 로그인 시 어드민 버튼이 정상적으로 표시되도록 수정
- E2E 테스트 추가 (어드민 로그인 및 화면 표시 검증)
- 시나리오 테스트 추가 (어드민 플로우 검증)
- 모든 테스트 통과 및 커버리지 92% 유지

### Added
프론트엔드_어드민_라우팅_및_네비게이션: 어드민 UI 라우팅 및 네비게이션 구현 (2025-01-04)
- AdminLayout 컴포넌트 생성 (권한 체크 및 리다이렉트 기능 포함)
- AdminNavigation 컴포넌트 생성 (대시보드, 사용자 관리, 문제 관리 네비게이션 메뉴)
- App.tsx에 어드민 레이아웃 적용
- 어드민 페이지 간 네비게이션 기능 추가
- AdminLayout 및 AdminNavigation 테스트 작성 (9개 테스트)
- 모든 테스트 통과 및 커버리지 92.58% 유지
프론트엔드_어드민_문제_관리_UI: 어드민 문제 관리 UI 구현 (2025-01-04)
- AdminQuestion 타입 정의 추가 (correct_answer, explanation 필드 포함)
- adminApi 클라이언트에 문제 관리 메서드 추가 (getQuestions, getQuestion, createQuestion, updateQuestion, deleteQuestion)
- AdminQuestionManagementUI 컴포넌트 생성
  - 문제 목록 조회 (테이블 형태, 검색 및 필터링 포함)
  - 문제 상세 조회
  - 문제 생성 (유효성 검증 포함)
  - 문제 수정
  - 문제 삭제 (확인 다이얼로그 포함)
- App.tsx에 어드민 문제 관리 라우팅 추가 (admin-questions 상태)
- AdminQuestionManagementUI 테스트 작성 (26개 테스트)
- 모든 테스트 통과 및 커버리지 92.84% 달성

프론트엔드_어드민_사용자_관리_UI: 어드민 사용자 관리 UI 구현 (2025-01-04)
- AdminUser 타입 정의 추가 (is_admin 필드 포함)
- adminApi 클라이언트 추가 (getUsers, getUser, updateUser, deleteUser)
- AdminUserManagementUI 컴포넌트 생성
  - 사용자 목록 조회 (테이블 형태)
  - 사용자 상세 조회
  - 사용자 정보 수정 (username, target_level)
  - 사용자 삭제 (확인 다이얼로그 포함)
- App.tsx에 어드민 라우팅 추가 (is_admin 체크)
- AdminUserManagementUI 테스트 작성 (10개 테스트)
- 모든 테스트 통과 및 커버리지 93.79% 달성

백엔드_어드민_API_엔드포인트: 백엔드 어드민 API 엔드포인트 구현 (2025-01-04)
- 어드민 사용자 관리 API 구현 (GET, PUT, DELETE /admin/users)
  - GET /api/v1/admin/users: 전체 사용자 목록 조회
  - GET /api/v1/admin/users/{user_id}: 특정 사용자 조회
  - PUT /api/v1/admin/users/{user_id}: 사용자 정보 수정
  - DELETE /api/v1/admin/users/{user_id}: 사용자 삭제
- 어드민 문제 관리 API 구현 (GET, POST, PUT, DELETE /admin/questions)
  - GET /api/v1/admin/questions: 전체 문제 목록 조회
  - POST /api/v1/admin/questions: 문제 생성
  - GET /api/v1/admin/questions/{question_id}: 특정 문제 조회
  - PUT /api/v1/admin/questions/{question_id}: 문제 수정
  - DELETE /api/v1/admin/questions/{question_id}: 문제 삭제
- 어드민 권한 체크 미들웨어 적용 (get_admin_user 의존성 함수)
- Question 엔티티 필드 수정 시 유효성 검증 추가
- 모든 어드민 API 엔드포인트에 대한 단위 테스트 작성 (15개 테스트)
- 어드민 API 문서 작성 (docs/api/endpoints/admin.md)
- 모든 테스트 통과 및 기존 테스트와 호환성 확인

어드민_인증_및_권한_관리: 어드민 인증 및 권한 관리 구현 (2025-01-04)
- User 엔티티에 is_admin 필드 추가 (기본값: False)
- 데이터베이스 users 테이블에 is_admin 컬럼 추가 및 마이그레이션
- UserMapper에 is_admin 필드 매핑 추가
- UserRepository에 is_admin 필드 저장/조회 로직 추가
- get_admin_user 의존성 함수 추가 (어드민 권한 체크)
- 어드민 권한 체크 테스트 작성 (일반 사용자 403 에러, 어드민 사용자 성공)
- User 엔티티 is_admin 필드 테스트 작성
- UserRepository is_admin 필드 저장/조회 테스트 작성
- 모든 테스트 통과 및 커버리지 92% 유지

### Changed
스프린트_관리: 스프린트 005 종료 및 스프린트 006 시작 (2025-12-28)
- 스프린트 JLPT-SPRINT-005 종료 처리 (100% 완료, 83/81 포인트)
- 스프린트 JLPT-SPRINT-006 시작 (2025-12-28 ~ 2026-01-04)
- 어드민 기능 태스크 6개 추가 (총 34포인트):
  - P0-JLPT-031: 어드민 인증 및 권한 관리 구현 (5포인트)
  - P0-JLPT-032: 백엔드 어드민 API 엔드포인트 구현 (8포인트)
  - P0-JLPT-033: 어드민 사용자 관리 UI 구현 (5포인트)
  - P0-JLPT-034: 어드민 문제 관리 UI 구현 (8포인트)
  - P1-JLPT-030: 어드민 통계 및 대시보드 구현 (5포인트)
  - P0-JLPT-035: 어드민 UI 라우팅 및 네비게이션 구현 (3포인트)
- 태스크 관리 문서 업데이트 (current-sprint.md, backlog.md)

### Added
프론트엔드_사용자_학습_이력_UI: 프론트엔드 사용자 학습 이력 UI 구현 (2025-01-04)
- UserHistory 타입 정의 추가 (types/api.ts)
- userApi.getUserHistory 메서드 추가 및 테스트 작성
- UserHistoryUI 컴포넌트 생성 (전체 통계, 시간대별 학습 패턴, 날짜별 학습 이력 표시)
- App.tsx에 학습 이력 화면 추가 (학습 이력 보기 버튼, 학습 이력 화면 표시)
- UserHistoryUI 컴포넌트 테스트 작성 (9개 테스트)
- App.tsx 학습 이력 관련 테스트 추가 (1개 테스트)
- 모든 테스트 통과 및 커버리지 84.84% 달성

프론트엔드_사용자_프로필_관리_UI: 프론트엔드 사용자 프로필 관리 UI 구현 (2025-01-04)
- UserProfile 타입 정의 추가 (types/api.ts)
- UserProfileUI 컴포넌트 생성 (프로필 조회 및 수정 기능)
- 프로필 수정 기능 (username, target_level 수정 지원)
- 프로필 정보 표시 (이메일, 사용자명, 목표 레벨, 현재 레벨, 테스트 횟수, 연속 학습일)
- App.tsx에 프로필 관리 화면 추가 (프로필 관리 버튼, 프로필 관리 화면 표시)
- UserProfileUI 컴포넌트 테스트 작성 (11개 테스트)
- App.tsx 프로필 관리 관련 테스트 추가 (1개 테스트)
- 모든 테스트 통과 및 커버리지 84.84% 달성

프론트엔드_사용자_성능_분석_UI: 프론트엔드 사용자 성능 분석 UI 구현 (2025-01-04)
- UserPerformance 타입 정의 추가 (types/api.ts)
- userApi.getUserPerformance 메서드 추가 및 테스트 작성
- UserPerformanceUI 컴포넌트 생성 (유형별 성취도, 난이도별 성취도, 레벨별 성취도 추이, 반복 오답 문제, 약점 분석 표시)
- App.tsx에 성능 분석 화면 추가 (성능 분석 보기 버튼, 성능 분석 화면 표시)
- 백엔드 API 응답 형식 표준화 (get_user_performance 엔드포인트)
- UserPerformanceUI 컴포넌트 테스트 작성 (11개 테스트)
- App.tsx 성능 분석 관련 테스트 추가 (2개 테스트)
- 모든 테스트 통과 및 커버리지 80.89% 달성 (요구사항 80% 충족)

백엔드_Users_API_엔드포인트_완성: 백엔드 Users API 엔드포인트 완성 (2025-01-04)
- GET /api/v1/users/ - 사용자 목록 조회 엔드포인트 구현
- GET /api/v1/users/{user_id} - 특정 사용자 조회 엔드포인트 구현
- PUT /api/v1/users/{user_id} - 사용자 정보 수정 엔드포인트 구현
- DELETE /api/v1/users/{user_id} - 사용자 삭제 엔드포인트 구현
- 각 엔드포인트에 대한 단위 테스트 작성 (9개 테스트)
- 시나리오 테스트 업데이트 (사용자 API 상호작용 플로우)
- API 문서 업데이트 (실제 구현과 일치하도록 응답 형식 수정)
- 모든 테스트 통과 및 커버리지 92% 유지

사용자_성능_분석_서비스: 사용자 성능 분석 서비스 구현 (2025-01-04)
- UserPerformanceAnalysisService Domain Service 구현
- 유형별 성취도 집계 기능 (analyze_type_performance)
- 난이도별 성취도 집계 기능 (analyze_difficulty_performance)
- 반복 오답 문제 식별 기능 (identify_repeated_mistakes)
- 약점 영역 분석 기능 (identify_weaknesses)
- AnswerDetailRepository에 find_by_user_id_and_period 메서드 추가
- submit_test 컨트롤러에 UserPerformanceAnalysisService 통합
- 기간 내의 모든 AnswerDetail을 기반으로 정확한 성능 분석 수행

문제_유형별_필터링_개선: 문제 유형별 필터링 개선 기능 추가 (2025-01-04)
- TestCreateRequest에 question_type_counts 필드 추가
- 유형별 문제 수 조정 기능 구현 (예: vocabulary 10개, grammar 5개, reading 5개)
- QuestionRepository에 find_random_by_level_and_type_counts 메서드 추가
- 유형별 문제 수 부족 시 에러 처리
- API 문서에 question_type_counts 필드 설명 추가

프론트엔드_사용자_인증_플로우: 프론트엔드 사용자 인증 플로우 구현 (2025-01-04)
- LoginUI 컴포넌트 생성 (로그인/회원가입 UI)
- App.tsx에 인증 플로우 통합
- 보호된 라우트 구현 (테스트 시작 전 로그인 필요)
- 로그아웃 기능 추가
- LoginUI 컴포넌트 테스트 작성
- App.tsx 테스트 보완 (로그인 플로우 포함)

API_문서화_완성: API 문서화 완성 및 OpenAPI 스펙 동기화 (2025-01-04)
- 모든 엔드포인트 문서의 Base URL을 /api/v1로 수정
- 실제 구현과 일치하도록 응답 형식 업데이트
- auth 엔드포인트 문서 수정 (이메일만 사용, 비밀번호 제거)
- tests 엔드포인트 문서 수정 (N5 진단 테스트 요청 본문 없음)
- submit_test 응답 형식 상세화
- health 엔드포인트 응답 형식 수정
- API 엔드포인트 README 추가 (docs/api/endpoints/README.md)
- API 스키마 README 추가 (docs/api/schemas/README.md)
- 모든 스키마 문서의 예제 URL을 /api/v1로 수정

### Added
TypeScript_타입_체크_필수화: 프론트엔드 TypeScript 타입 체크 필수화 (2025-01-04)
- package.json에 `typecheck` 스크립트 추가 (`tsc --noEmit`)
- `test:ci` 스크립트에 타입 체크 자동 포함
- `run_tests.sh`에 프론트엔드 타입 체크 단계 추가 (테스트 실행 전 필수)
- .cursorrules에 규칙 20-2 추가: TypeScript 타입 체크 필수 요구사항
- DEVELOPMENT_GUIDELINES.md에 타입 체크 섹션 추가 (3.3-1)
- frontend-testing.md에 타입 체크 가이드 추가
- 타입 에러 시 작업 완료 금지 규칙 명시

### Fixed
프론트엔드_E2E_안정화: run_tests.sh의 프론트엔드 E2E 테스트 안정화 및 통과 보장 (2025-12-28)
- run_tests.sh에서 E2E 실행 전 N5 문제 시딩을 비대화형으로 수행 (최소 20개 보장)
- 프론트엔드 API 클라이언트가 비래핑(raw) 응답과 FastAPI 기본 에러(detail)를 모두 처리
- 성능 분석 UI가 백엔드 데이터 구조(level_progression/weaknesses) 차이를 안전하게 처리
- Playwright E2E에서 중복 사용자명/strict locator 이슈를 해결하여 flake 제거
프론트엔드_테스트_커버리지_80%_달성: 프론트엔드 테스트 커버리지 80% 이상 달성 (2025-01-04)
- Jest 설정 추가하여 불필요한 파일 커버리지에서 제외 (index.tsx, reportWebVitals.ts, setupTestsPolyfill.ts, mocks/, types/)
- App.test.tsx에 추가 테스트 작성 (사용자 정보 표시, 결과 표시, 재시작 버튼, 에러 처리 등)
- run_tests.sh에서 coverage-final.json을 사용하여 프론트엔드 커버리지 계산
- 프론트엔드 커버리지 96.77% 달성 (요구사항: 80% 이상)
프론트엔드_테스트_실패_수정: 프론트엔드 테스트 실패 수정 및 커버리지 70% 달성 (2025-01-04)
- auth.test.ts: 로그인 실패 시 currentUser null 설정 추가
- api.test.ts: 404 에러 메시지 처리 개선 및 중복 호출 제거
- App.test.tsx: authService 모킹 추가 및 에러 메시지 처리 개선

### Added
프론트엔드_테스트_커버리지_향상: 프론트엔드 테스트 커버리지 향상 (2025-01-04)
- JSON 파싱 에러 처리 테스트 추가
- content-type 체크 테스트 추가
- resultApi, userApi, authApi 추가 메서드 테스트 추가
- 커버리지 71.98% 달성 (목표 70%)
학습_분석_API_엔드포인트: 학습 분석 API 엔드포인트 구현 (2025-01-04)
- GET /api/results/{id}/details: 상세 답안 이력 조회 엔드포인트 추가
- GET /api/users/{id}/performance: 사용자 성능 분석 조회 엔드포인트 추가
- GET /api/users/{id}/history: 학습 이력 조회 엔드포인트 추가
- 모든 엔드포인트에 대한 단위 테스트 작성 및 통과
- API 엔드포인트 문서 업데이트 (results.md, users.md)
레벨_추천_로직: 점수 기반 JLPT 레벨 추천 Domain Service 구현 (2025-01-04)
- LevelRecommendationService 도메인 서비스 구현
- 테스트 점수와 테스트 레벨을 기반으로 다음 학습 레벨 추천
- 90점 이상: 다음 레벨로 상향 추천, 70-89점: 현재 레벨 유지, 70점 미만: 이전 레벨로 하향 추천
- submit_test 컨트롤러에 레벨 추천 로직 적용
- 설계 문서에 Domain Service 섹션 추가
브랜치_최신화_규칙: 모든 작업 시작 전 브랜치 최신화 필수 규칙 추가 (2025-01-04)
- 규칙 10-1 추가: 브랜치 최신화 필수 규칙 (강제)
- 규칙 14-1 업데이트: Git 작업 자동화 프로세스에 브랜치 최신화 단계 명시
- 규칙 3-1 업데이트: 브랜치 자동 생성 규칙에 규칙 10-1 참조 추가
설계_문서_작성: Domain 엔티티 및 API 문서 작성 완료 (2025-01-04)
- Domain 엔티티 문서 7개 작성 (User, Question, Test, Result, AnswerDetail, LearningHistory, UserPerformance)
- API 엔드포인트 문서 5개 작성 (Users, Auth, Tests, Results, Health)
- API 스키마 문서 4개 작성 (User, Auth, Test, Result)
백로그_업데이트: 부족한 부분 분석 및 우선순위별 태스크 추가 (2025-01-04)
- P0: 학습 데이터 수집 엔티티 구현 (AnswerDetail, LearningHistory, UserPerformance)
- P0: 프론트엔드-백엔드 API 통합
- P0: 테스트 제출 시 학습 데이터 자동 수집
- P1: 레벨 추천 로직 구현
- P1: 학습 분석 API 엔드포인트 구현
- P1: API 문서화 완성
- P2: 문제 유형별 필터링 개선
- P2: 사용자 성능 분석 서비스 구현
- P2: 프론트엔드 사용자 인증 플로우 구현
스프린트_005_시작: JLPT-SPRINT-005 시작 - 학습 데이터 수집 시스템 구축 (2025-01-04)

### Changed
프론트엔드_테스트_커버리지_목표_변경: 프론트엔드 테스트 커버리지 목표를 70%에서 80%로 상향 조정 (2025-01-04)
- .cursorrules: 프론트엔드 커버리지 요구사항 70% → 80%로 변경
- run_tests.sh: FRONTEND_COVERAGE_THRESHOLD 70 → 80으로 변경
- frontend/package.json: coverageThreshold 70 → 80으로 변경
- DEVELOPMENT_GUIDELINES.md: 프론트엔드 커버리지 목표 70% → 80%로 변경
- 관련 문서 업데이트: frontend-testing.md, pr-workflow.md, README.md
백로그_재구성: 부족한 부분을 우선순위별로 정리하여 백로그 업데이트 (2025-01-04)
스프린트_계획: 새로운 스프린트 목표 및 태스크 할당 (2025-01-04)

### Added
프로젝트_초기_설정: DDD 기반 아키텍처 설계 및 개발 환경 구성 (2024-12-27)
문서화_구조: AI 친화적 문서 포맷으로 전체 문서 재구성 (2024-12-27)
태스크_관리: AI 파싱 최적화된 스프린트 및 백로그 시스템 구축 (2024-12-27)
유형별_문제_풀이_요구사항: JLPT 유형별 문제 풀이 기능 요구사항 정의 (2024-12-27)
개인_데이터_수집_설계: AnswerDetail, LearningHistory, UserPerformance 엔티티 설계 (2024-12-27)
학습_분석_시스템_문서: 학습 분석 시스템 상세 설계 문서 추가 (2024-12-27)
ChatGPT_분석_준비: ChatGPT API 기반 분석을 위한 데이터 구조 설계 (2024-12-27)
배치_분석_설계: 주기적 배치 분석 작업 설계 (2024-12-27)
시나리오_테스트: 사용자 시험 응시 및 결과 추적 플로우 시나리오 테스트 구현 (2025-01-03)
React_프론트엔드: React TypeScript 기반 프론트엔드 구조 설정 (2025-01-03)
TestUI_컴포넌트: 테스트 문제 표시 및 답안 선택 UI 컴포넌트 구현 (2025-01-03)
ResultUI_컴포넌트: 테스트 결과 표시 및 분석 UI 컴포넌트 구현 (2025-01-03)
프로젝트_README: 프로젝트 루트 README.md 작성 및 문서화 (2025-01-03)

### Changed
문서_포맷: 사람이 읽기 쉬운 형식에서 AI 파싱 최적화 포맷으로 전환 (2024-12-27)
요구사항_문서: 유형별 문제 풀이 및 개인 데이터 수집 요구사항 추가 (2024-12-27)
아키텍처_문서: 새로운 엔티티 및 데이터베이스 스키마 업데이트 (2024-12-27)
프로젝트_문서: README 및 CHANGELOG 업데이트, 최신 기능 반영 (2025-01-03)

## 0.1.0 (2024-12-27)

### Added
프로젝트_초기화: 기본 폴더 구조 및 설정 파일 생성
테스트_환경: pytest 기반 테스트 인프라 구축
도메인_모델링: User, Test, Question, Result 엔티티 TDD 구현

## 버전_관리_규칙
MAJOR: 호환되지_않는_변경
MINOR: 새로운_기능_하위_호환
PATCH: 버그_수정_하위_호환

## 변경_유형
Added: 새로운_기능
Changed: 기존_기능_변경
Deprecated: 곧_제거될_기능
Removed: 기능_제거
Fixed: 버그_수정
Security: 보안_관련_수정
