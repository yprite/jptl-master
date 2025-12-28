# 변경 이력 (AI 파싱용)

## 메타데이터
형식: Keep a Changelog
현재_버전: Unreleased
마지막_릴리즈: 0.1.0 (2024-12-27)

## Unreleased

### Fixed
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
