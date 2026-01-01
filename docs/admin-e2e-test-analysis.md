# Admin E2E 테스트 문제점 분석 및 보완

## 문제점 분석

### 1. Admin 계정 존재 확인 부족
**문제**: E2E 테스트는 실제 서버를 사용하는데, `admin@example.com` 계정이 실제로 존재하는지 확인하지 않음
- 테스트가 실패할 수 있음
- 실제 서버에서 admin 계정이 없거나 `is_admin=false`일 수 있음

**해결**: E2E 테스트 전에 admin 계정이 존재하는지 확인하고, 없으면 생성하는 로직 추가

### 2. API 호출 실패 케이스 테스트 부족
**문제**: 다음 케이스들이 테스트되지 않음
- 로그인 실패 (404 Not Found)
- 권한 부족 (403 Forbidden)
- 네트워크 에러
- API 응답 지연

**해결**: 각 에러 케이스에 대한 테스트 추가

### 3. AdminLayout 권한 체크 로직 테스트 부족
**문제**: 일반 사용자가 admin 페이지에 접근하려고 할 때 제대로 리다이렉트되는지 테스트하지 않음

**해결**: 일반 사용자가 admin 페이지 접근 시도 테스트 추가

### 4. 실제 API 호출 결과 검증 부족
**문제**: 
- 로그인 후 사용자 정보가 제대로 로드되었는지 확인하지 않음
- `is_admin` 필드가 올바르게 설정되었는지 확인하지 않음

**해결**: API 응답을 검증하는 테스트 추가

### 5. 에러 상태 처리 테스트 부족
**문제**: AdminDashboardUI에서 API 호출 실패 시 에러 메시지가 표시되는지 테스트하지 않음

**해결**: API 에러 처리 테스트 추가

## 보완 사항

### 1. Admin 계정 자동 생성
- `run_tests.sh`에 E2E 테스트 전 admin 계정 확인 및 생성 로직 추가
- `scripts/create_admin_user.py`에 `--non-interactive` 옵션 추가

### 2. 추가된 테스트 케이스
1. **Admin 로그인 실패 (404)**: 존재하지 않는 admin 계정으로 로그인 시도
2. **일반 사용자 admin 페이지 접근**: 일반 사용자가 admin 페이지에 접근할 수 없음을 확인
3. **Admin 사용자 데이터 검증**: 로그인 후 API 응답에서 `is_admin=true` 확인
4. **Admin Dashboard API 에러 처리**: API 호출 실패 시 에러 메시지 표시 확인
5. **Admin API 403 Forbidden**: 일반 사용자가 admin API에 접근 시도 시 403 응답 확인

## 테스트 실행 방법

```bash
# E2E 테스트만 실행
./run_tests.sh --frontend-e2e

# 모든 테스트 실행
./run_tests.sh
```

## 예상 결과

모든 테스트가 통과하고, 실제 서버에서도 동일하게 동작해야 합니다.

## 테스트 데이터 정리

### 문제점
E2E 테스트 후 테스트 데이터가 데이터베이스에 계속 쌓이는 문제가 있었습니다.

### 해결 방법
1. **테스트 데이터 정리 스크립트 추가** (`scripts/cleanup_test_data.py`)
   - `test-`로 시작하는 이메일 패턴의 사용자 자동 삭제
   - 관련 데이터 자동 삭제: answer_details, learning_history, user_performance, results, test_attempts, tests
   - 외래키 제약조건을 고려한 삭제 순서

2. **run_tests.sh에 정리 로직 통합**
   - E2E 테스트 전: 이전 테스트 데이터 정리
   - E2E 테스트 후: 현재 테스트 데이터 정리

### 사용 방법
```bash
# 모든 테스트 데이터 정리
python scripts/cleanup_test_data.py --all

# 특정 패턴의 테스트 데이터 정리
python scripts/cleanup_test_data.py --email-pattern "test-%@example.com"
```

### 삭제되는 데이터
- 테스트 사용자 (test-로 시작하는 이메일)
- 사용자 관련 answer_details
- 사용자 관련 learning_history
- 사용자 관련 user_performance
- 사용자 관련 results
- 사용자 관련 test_attempts
- 사용자가 생성한 tests

