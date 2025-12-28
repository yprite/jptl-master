# API 스키마 문서

## 개요

이 디렉토리에는 JLPT 자격 검증 프로그램의 모든 API 요청 및 응답 스키마 문서가 포함되어 있습니다.

## 스키마 목록

### 인증 (Authentication)
- [인증 스키마](./auth.md) - 로그인, 로그아웃 요청/응답 스키마

### 사용자 (User)
- [사용자 스키마](./user.md) - 사용자 등록, 수정, 조회 요청/응답 스키마

### 테스트 (Test)
- [테스트 스키마](./test.md) - 테스트 생성, 시작, 제출 요청/응답 스키마

### 결과 (Result)
- [결과 스키마](./result.md) - 결과 조회, 분석 리포트 응답 스키마

## 스키마 정의 원칙

### 요청 스키마
- 모든 필드는 타입과 필수 여부가 명시됩니다
- 선택적 필드는 기본값이 제공됩니다
- 유효성 검증 규칙이 명시됩니다

### 응답 스키마
- 성공 응답과 에러 응답이 구분됩니다
- 모든 필드의 타입과 설명이 포함됩니다
- 열거형 값의 가능한 값이 명시됩니다

## 데이터 타입

### 기본 타입
- `string`: 문자열
- `integer`: 정수
- `number`: 실수
- `boolean`: 불리언
- `array`: 배열
- `object`: 객체
- `null`: null 값

### 열거형 (Enum)
- `JLPTLevel`: `"N1"`, `"N2"`, `"N3"`, `"N4"`, `"N5"`
- `TestStatus`: `"CREATED"`, `"IN_PROGRESS"`, `"COMPLETED"`
- `QuestionType`: `"VOCABULARY"`, `"GRAMMAR"`, `"READING"`, `"LISTENING"`

## 관련 문서

- [API 엔드포인트 문서](../endpoints/README.md) - API 엔드포인트 상세 문서
- [아키텍처 개요](../../architecture/overview.md) - 시스템 아키텍처
- [도메인 엔티티](../../architecture/domain/) - 도메인 모델 정의

