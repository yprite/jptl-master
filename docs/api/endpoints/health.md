# Health Check API 엔드포인트

## 개요

시스템 상태 확인 API 엔드포인트입니다. 헬스 체크 및 준비 상태 확인 기능을 제공합니다.

## Base URL

```
/api/v1/health
```

**참고**: 모든 API 엔드포인트는 `/api/v1` prefix를 사용합니다.

## 엔드포인트 목록

### 1. 헬스 체크

**GET** `/api/v1/health/health`

애플리케이션의 기본 헬스 상태를 확인합니다.

**요청:**
- 파라미터: 없음

**응답:**
```json
{
  "status": "healthy",
  "database": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-01-04T10:00:00"
}
```

**상태 코드:**
- `200 OK`: 애플리케이션이 정상 동작 중

---

### 2. 준비 상태 확인

**GET** `/api/v1/health/ready`

애플리케이션의 준비 상태를 확인합니다. 데이터베이스 연결 등 외부 의존성을 포함하여 확인합니다.

**요청:**
- 파라미터: 없음

**응답:**
```json
{
  "status": "ready"
}
```

**상태 코드:**
- `200 OK`: 모든 의존성이 준비됨
- `503 Service Unavailable`: 일부 의존성이 준비되지 않음

**에러 응답:**
```json
{
  "status": "ready"
}
```

---

## 사용 사례

### Kubernetes Liveness Probe
```yaml
livenessProbe:
  httpGet:
    path: /api/v1/health/health
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10
```

### Kubernetes Readiness Probe
```yaml
readinessProbe:
  httpGet:
    path: /api/v1/health/ready
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 5
```

## 관련 문서

- [시스템 아키텍처](../../architecture/overview.md)

