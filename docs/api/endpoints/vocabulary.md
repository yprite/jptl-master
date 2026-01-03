# 단어 학습 API

## 개요

단어 학습 API는 JLPT 단어 학습을 위한 엔드포인트를 제공합니다. 플래시카드 학습, 단어 목록 조회, 암기 상태 관리 등의 기능을 제공합니다.

## Base URL

```
/api/v1/vocabulary
```

## 인증

모든 엔드포인트는 세션 기반 인증이 필요합니다.

## 엔드포인트

### 단어 목록 조회

**GET** `/api/v1/vocabulary/`

단어 목록을 조회합니다.

**Query Parameters:**
- `level` (optional): JLPT 레벨 필터 (N5, N4, N3, N2, N1)
- `status` (optional): 암기 상태 필터 (not_memorized, learning, memorized)
- `search` (optional): 검색어 (단어, 읽기, 의미로 검색)

**Response 200:**
```json
[
  {
    "id": 1,
    "word": "ありがとう",
    "reading": "ありがとう",
    "meaning": "감사합니다",
    "level": "N5",
    "memorization_status": "not_memorized",
    "example_sentence": "ありがとうございます。"
  }
]
```

### 특정 단어 조회

**GET** `/api/v1/vocabulary/{vocabulary_id}`

특정 단어를 조회합니다.

**Path Parameters:**
- `vocabulary_id` (required): 단어 ID

**Response 200:**
```json
{
  "id": 1,
  "word": "ありがとう",
  "reading": "ありがとう",
  "meaning": "감사합니다",
  "level": "N5",
  "memorization_status": "not_memorized",
  "example_sentence": "ありがとうございます。"
}
```

**Response 404:**
```json
{
  "detail": "단어를 찾을 수 없습니다"
}
```

### 단어 생성

**POST** `/api/v1/vocabulary/`

새로운 단어를 생성합니다.

**Request Body:**
```json
{
  "word": "ありがとう",
  "reading": "ありがとう",
  "meaning": "감사합니다",
  "level": "N5",
  "example_sentence": "ありがとうございます。"
}
```

**Response 200:**
```json
{
  "id": 1,
  "word": "ありがとう",
  "reading": "ありがとう",
  "meaning": "감사합니다",
  "level": "N5",
  "memorization_status": "not_memorized",
  "example_sentence": "ありがとうございます。"
}
```

### 단어 수정

**PUT** `/api/v1/vocabulary/{vocabulary_id}`

단어 정보를 수정합니다.

**Path Parameters:**
- `vocabulary_id` (required): 단어 ID

**Request Body:**
```json
{
  "word": "ありがとう",
  "reading": "ありがとう",
  "meaning": "고맙습니다",
  "level": "N5",
  "example_sentence": "ありがとうございます。"
}
```

**Response 200:**
```json
{
  "id": 1,
  "word": "ありがとう",
  "reading": "ありがとう",
  "meaning": "고맙습니다",
  "level": "N5",
  "memorization_status": "not_memorized",
  "example_sentence": "ありがとうございます。"
}
```

### 단어 삭제

**DELETE** `/api/v1/vocabulary/{vocabulary_id}`

단어를 삭제합니다.

**Path Parameters:**
- `vocabulary_id` (required): 단어 ID

**Response 200:**
```json
{
  "success": true,
  "message": "단어가 삭제되었습니다"
}
```

### 단어 학습 (암기 상태 업데이트)

**POST** `/api/v1/vocabulary/{vocabulary_id}/study`

단어의 암기 상태를 업데이트합니다.

**Path Parameters:**
- `vocabulary_id` (required): 단어 ID

**Request Body:**
```json
{
  "memorization_status": "memorized"
}
```

**Response 200:**
```json
{
  "id": 1,
  "word": "ありがとう",
  "reading": "ありがとう",
  "meaning": "감사합니다",
  "level": "N5",
  "memorization_status": "memorized",
  "example_sentence": "ありがとうございます。"
}
```

## 암기 상태 값

- `not_memorized`: 미암기
- `learning`: 학습중
- `memorized`: 암기완료

## 관련 문서

- [어드민 단어 관리 API](./admin.md#단어-관리) - 어드민 전용 단어 관리 기능
- [API 스키마](../schemas/README.md) - 요청/응답 스키마 정의

