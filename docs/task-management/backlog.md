# JLPT 백로그 상태 (AI 파싱용)

## 메타데이터
프로젝트: JLPT 자격 검증 프로그램
총_태스크_수: 74
완료_포인트: 141
남은_포인트: 18
진행률: 89%
MVP_예상: Sprint_5_완료시

## 에픽_상태
EPIC-JLPT-001: 사용자_관리_및_인증 (P0, 진행중, 완료율: 80%)
EPIC-JLPT-002: N5_진단_테스트_시스템 (P0, 완료, 완료율: 100%)
EPIC-JLPT-003: 웹_기반_UI (P0, 준비, 완료율: 0%)

## 사용자_스토리 (P0-P2)
US-JLPT-001: 학습자_등록_및_목표_설정 (P0, 완료, 포인트: 3)
US-JLPT-002: N5_진단_테스트_응시 (P0, 준비, 포인트: 8)
US-JLPT-003: 학습_진전_추적 (P1, 백로그, 포인트: 5)
US-JLPT-004: 문제_유형별_분석 (P1, 백로그, 포인트: 6)
US-JLPT-005: 모바일_UI (P2, 백로그, 포인트: 4)

## 기술_태스크
TECH-JLPT-001: SQLite_리포지토리 (P0, 준비, 포인트: 8)
TECH-JLPT-002: Flask_REST_API (P0, 진행중, 포인트: 8)
TECH-JLPT-003: 세션_인증 (P0, 완료, 포인트: 5)
TECH-JLPT-004: Vanilla_JS_UI (P0, 준비, 포인트: 12)
TECH-JLPT-005: N5_문제_데이터 (P0, 준비, 포인트: 4)

## 우선순위_분포
P0_태스크: 10개 (총_포인트: 55)
P1_태스크: 4개 (총_포인트: 19)
P2_태스크: 3개 (총_포인트: 14)
P3_태스크: 3개 (총_포인트: 7)

## 새로_추가된_태스크 (우선순위별)

### P0 (Critical) - 즉시 필요
P0-JLPT-014: 학습 데이터 수집 엔티티 구현 (AnswerDetail, LearningHistory, UserPerformance) (포인트: 8, 상태: 완료)
- AnswerDetail 엔티티 및 Repository 구현 ✅
- LearningHistory 엔티티 및 Repository 구현 ✅
- UserPerformance 엔티티 및 Repository 구현 ✅
- 데이터베이스 테이블 생성 및 마이그레이션 ✅
- 수용_기준: 모든 엔티티 TDD 구현 완료, 커버리지 80% 이상 ✅

P0-JLPT-015: 프론트엔드-백엔드 API 통합 (포인트: 8, 상태: 완료)
- React 컴포넌트와 FastAPI 백엔드 연결 ✅
- API 클라이언트 서비스 구현 ✅
- 인증 토큰/세션 관리 ✅
- 에러 처리 및 로딩 상태 관리 ✅
- 수용_기준: 모든 주요 플로우가 실제 API와 연동되어 동작 ✅

P0-JLPT-016: 테스트 제출 시 학습 데이터 자동 수집 (포인트: 5, 상태: 완료)
- 테스트 제출 시 AnswerDetail 자동 생성
- LearningHistory 자동 기록
- UserPerformance 업데이트 로직
- 수용_기준: 테스트 제출 시 모든 학습 데이터가 자동으로 수집됨

P0-JLPT-023: SessionMiddleware 관련 테스트 실패 수정 (포인트: 3, 상태: 완료)
- test_get_current_user_not_implemented 테스트 실패 수정 ✅
- test_update_current_user_not_implemented 테스트 실패 수정 ✅
- test_start_test_success 테스트 실패 수정 ✅
- test_scenario_user_takes_test_and_views_result 시나리오 테스트 실패 수정 ✅
- test_scenario_user_tracks_progress_over_multiple_tests 시나리오 테스트 실패 수정 ✅
- SessionMiddleware가 테스트 환경에서 제대로 설정되도록 수정 ✅
- 수용_기준: 모든 테스트가 통과하고 run_tests.sh가 성공적으로 완료됨 ✅

P0-JLPT-024: 테스트 구조 재구성 (포인트: 5, 상태: 완료)
- Unit 테스트를 코드와 동일한 폴더 구조로 재구성 (tests/unit/) ✅
- Scenario 테스트를 시나리오별로 분리하여 scenario/ 폴더에 구성 ✅
- Acceptance 테스트 폴더 구조 준비 (tests/acceptance/) ✅
- run_tests.sh 스크립트를 새 구조에 맞게 수정 ✅
- 모든 테스트가 새 구조에서 정상 실행되는지 검증 ✅
- 수용_기준: 모든 테스트가 새 구조에서 통과하고, run_tests.sh가 성공적으로 완료됨 ✅

P0-JLPT-025: 작업 완료 기준에 설계 문서 업데이트 필수 규칙 추가 (포인트: 2, 상태: 완료)
- 규칙 21(작업 완료 기준)에 설계 문서 업데이트 항목 추가 ✅
- 규칙 14-1(작업 완료 시 체크리스트)에 설계 문서 업데이트 항목 추가 ✅
- Backend/Frontend 변경 시 관련 문서 업데이트 가이드라인 명시 ✅
- CHANGELOG.md 업데이트 필수화 ✅
- 수용_기준: 모든 작업 완료 시 설계 문서 업데이트가 필수 항목으로 포함됨 ✅

P0-JLPT-027: 프론트엔드 테스트 구조 재구성 및 테스트 추가 (포인트: 8, 상태: 진행중)
- tests/frontend/ 디렉토리 구조 생성 (unit, component, e2e) ✅
- 기존 테스트 파일을 tests/frontend/component/로 이동 ✅
- MSW 및 Playwright 설치 및 설정 ✅
- 유닛 테스트 작성 (api.test.ts, auth.test.ts) ✅
- 컴포넌트 테스트 개선 (MSW 사용) ✅
- E2E 테스트 작성 (Playwright) ✅
- run_tests.sh에 프론트엔드 테스트 추가 ✅
- Jest 설정 파일 추가 ✅
- 커버리지 임계값 70% 설정 ✅
- 테스트 실행 및 커버리지 확인 (진행중)
- 수용_기준: 모든 프론트엔드 테스트가 통과하고 커버리지 70% 이상 달성

### P1 (High Priority) - 높은 우선순위
P1-JLPT-017: 레벨 추천 로직 구현 (포인트: 3, 상태: 완료)
- 점수 기반 JLPT 레벨 추천 알고리즘 ✅
- 테스트 결과에 recommended_level 자동 계산 ✅
- 수용_기준: 점수에 따라 적절한 레벨이 추천됨 ✅

P1-JLPT-018: 학습 분석 API 엔드포인트 구현 (포인트: 5, 상태: 완료)
- GET /api/results/{id}/details - 상세 답안 이력 조회 ✅
- GET /api/users/{id}/performance - 사용자 성능 분석 조회 ✅
- GET /api/users/{id}/history - 학습 이력 조회 ✅
- 수용_기준: 모든 엔드포인트가 정상 동작하고 테스트 통과 ✅

P1-JLPT-019: API 문서화 완성 (포인트: 3, 상태: 백로그)
- docs/api/endpoints/ 폴더에 모든 엔드포인트 문서 작성
- docs/api/schemas/ 폴더에 모든 스키마 문서 작성
- OpenAPI 스펙과 동기화
- 수용_기준: 모든 API 엔드포인트가 문서화됨

P1-JLPT-026: 설계 문서 작성 (포인트: 6, 상태: 완료)
- docs/architecture/domain/ 폴더에 모든 Domain 엔티티 문서 작성 ✅
- docs/api/endpoints/ 폴더에 모든 API 엔드포인트 문서 작성 ✅
- docs/api/schemas/ 폴더에 모든 API 스키마 문서 작성 ✅
- 수용_기준: 모든 Domain 엔티티와 API가 문서화됨 ✅

### P2 (Medium Priority) - 중간 우선순위
P2-JLPT-020: 문제 유형별 필터링 개선 (포인트: 3, 상태: 백로그)
- 테스트 생성 시 여러 유형 조합 지원
- 유형별 문제 수 조정 가능
- 수용_기준: 유형별 필터링이 정상 동작

P2-JLPT-021: 사용자 성능 분석 서비스 구현 (포인트: 5, 상태: 백로그)
- 유형별 성취도 집계
- 난이도별 성취도 집계
- 반복 오답 문제 식별
- 약점 영역 분석
- 수용_기준: 성능 분석 데이터가 정확히 집계됨

P2-JLPT-022: 프론트엔드 사용자 인증 플로우 구현 (포인트: 3, 상태: 백로그)
- 로그인/로그아웃 UI
- 세션 상태 관리
- 보호된 라우트 구현
- 수용_기준: 인증 플로우가 완전히 동작

## 현재_스프린트_태스크 (JLPT-SPRINT-005)
P0-JLPT-014: 학습 데이터 수집 엔티티 구현 (포인트: 8, 상태: 완료)
P0-JLPT-015: 프론트엔드-백엔드 API 통합 (포인트: 8, 상태: 완료)
P0-JLPT-016: 테스트 제출 시 학습 데이터 자동 수집 (포인트: 5, 상태: 완료)
P0-JLPT-025: 작업 완료 기준에 설계 문서 업데이트 필수 규칙 추가 (포인트: 2, 상태: 완료)
총_포인트: 23
완료_포인트: 23

## 다음_스프린트_목표
Sprint_5: 학습 데이터 수집 시스템 구축 및 프론트엔드 통합
예상_완료_포인트: 16
MVP_출시_가능: 부분적 (핵심 기능 동작)
