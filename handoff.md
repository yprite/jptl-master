# Handoff

## 이번 턴에서 한 일

- 기존 진단 테스트 중심 구조 위에 Anki 기반 JLPT 100일 완주용 새 백엔드 축을 추가했다.
- 새 DB 테이블:
  - `content_imports`
  - `learning_items`
- 새 백엔드 파일:
  - `backend/application/services/anki_import_service.py`
  - `backend/application/services/roadmap_service.py`
  - `backend/presentation/controllers/roadmap.py`
  - `scripts/import_apkg_to_roadmap.py`
- 수정한 백엔드 파일:
  - `backend/infrastructure/config/database.py`
  - `backend/presentation/controllers/__init__.py`
  - `backend/main.py`
- 프론트는 기존 테스트/관리 앱 대신 레벨 선택 + 100일 플랜 + Day 배정 대시보드로 교체했다.
- 새 프론트 파일:
  - `frontend/src/services/roadmap.ts`
  - `frontend/src/types/roadmap.ts`
- 수정한 프론트 파일:
  - `frontend/src/App.tsx`
  - `frontend/src/App.css`
  - `frontend/src/index.css`
  - `frontend/src/__tests__/component/App.test.tsx`
- 단위 테스트 초안 추가:
  - `tests/unit/test_roadmap_service.py`

## 실제 데이터 import 결과

`JLPT 통합덱2 20250908.apkg`를 새 스키마로 import했다. 현재 `data/jlpt.db` 안에 들어가 있다.

- N1: vocabulary 3236 / grammar 1095 / total 4331
- N2: vocabulary 2617 / grammar 1409 / total 4026
- N3: vocabulary 1546 / grammar 1305 / total 2851
- N4: vocabulary 1036 / grammar 0 / total 1036
- N5: vocabulary 744 / grammar 1207 / total 1951

총 import 수: `14195`

## 현재 동작하는 것

- `POST /api/v1/roadmap/imports/apkg`
  - 로컬 `.apkg` 경로를 받아 import
- `GET /api/v1/roadmap/levels`
  - 레벨별 카드 수와 권장 신규/복습량 반환
- `POST /api/v1/roadmap/plans/preview`
  - 100일 플랜 계산
- `POST /api/v1/roadmap/plans/day`
  - 특정 Day에 배정될 신규 어휘/문법 카드 반환

## 검증 상태

확인 완료:

- `python3 -m py_compile ...`로 새 파이썬 파일 문법 확인
- 수동 assert로 `RoadmapService` 플랜/Day 배정 확인
- 실제 `.apkg` import 성공 확인
- 실제 N5/N1 플랜 계산 확인

못 한 것:

- `pytest` 미설치
- `httpx` 미설치라 `fastapi.testclient` 사용 불가
- `frontend/node_modules` 없음
- 그래서 프론트 `npm test`, `react-scripts`, 브라우저 실행 검증은 아직 못 했다

## 다음 턴 시작 순서

1. 프론트 의존성 설치
   - `cd frontend && npm install`
2. 백엔드 테스트 런타임 설치
   - 최소 `pytest`, `httpx`
3. 새 API 실제 호출 검증
   - `GET /api/v1/roadmap/levels`
   - `POST /api/v1/roadmap/plans/preview`
   - `POST /api/v1/roadmap/plans/day`
4. 프론트 대시보드 실기동 확인
5. 다음 기능 구현
   - 사용자별 학습 시작일 저장
   - `Again / Hard / Good / Easy` 기반 리뷰 상태 저장
   - `new / learning / review / relearning` 상태 모델 추가
   - 복습 로그 및 일별 진행률 영속화

## 설계 메모

- 지금 구현은 "플랜 프리뷰 + Day 배정"까지다.
- 아직 사용자별 persisted study plan은 없다.
- 아직 실제 SRS 상태 전이와 review log 저장은 없다.
- 지금의 `review_estimate`는 Anki inspired heuristic이다.
- N4는 현재 덱 기준으로 문법 카드가 0개로 집계된다. 덱 데이터 자체를 다시 확인해야 한다.

## 주의할 점

- 현재 워크트리에 `.openchrome/`와 APKG 파일이 untracked 상태다.
- `data/jlpt.db`는 import된 실제 데이터가 들어 있는 상태다.
- 프론트 타입체크는 이번 변경 때문이 아니라, 현재 환경에 `node_modules` 자체가 없는 상태라 실패한다.
