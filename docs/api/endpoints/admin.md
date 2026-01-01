# 어드민 API 엔드포인트

## 개요

어드민 API는 어드민 권한이 있는 사용자만 접근할 수 있는 관리 기능을 제공합니다.

## Base URL

```
/api/v1/admin
```

## 인증

모든 어드민 API 엔드포인트는 어드민 권한이 필요합니다:

1. `/api/v1/auth/login` 엔드포인트로 어드민 계정으로 로그인
2. 세션 쿠키가 자동으로 설정됨
3. 어드민 API 엔드포인트에 접근 시 어드민 권한이 자동으로 확인됨

**에러 응답:**
- `401 Unauthorized`: 인증되지 않은 경우
- `403 Forbidden`: 어드민 권한이 없는 경우

## 사용자 관리 API

### 전체 사용자 목록 조회

**엔드포인트:** `GET /api/v1/admin/users`

**설명:** 어드민이 전체 사용자 목록을 조회합니다.

**인증:** 어드민 권한 필요

**응답 예시:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "username": "user",
      "target_level": "N5",
      "current_level": null,
      "total_tests_taken": 0,
      "study_streak": 0,
      "is_admin": false
    }
  ],
  "message": "사용자 목록 조회 성공"
}
```

### 특정 사용자 조회

**엔드포인트:** `GET /api/v1/admin/users/{user_id}`

**설명:** 어드민이 특정 사용자의 상세 정보를 조회합니다.

**인증:** 어드민 권한 필요

**경로 파라미터:**
- `user_id` (int): 사용자 ID

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "username": "user",
    "target_level": "N5",
    "current_level": null,
    "total_tests_taken": 0,
    "study_streak": 0,
    "is_admin": false
  },
  "message": "사용자 정보 조회 성공"
}
```

**에러 응답:**
- `404 Not Found`: 사용자를 찾을 수 없는 경우

### 사용자 정보 수정

**엔드포인트:** `PUT /api/v1/admin/users/{user_id}`

**설명:** 어드민이 사용자 정보를 수정합니다.

**인증:** 어드민 권한 필요

**경로 파라미터:**
- `user_id` (int): 사용자 ID

**요청 본문:**

```json
{
  "username": "updated_user",
  "target_level": "N4"
}
```

**요청 필드:**
- `username` (string, optional): 사용자명
- `target_level` (string, optional): 목표 레벨 (N1, N2, N3, N4, N5)

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "username": "updated_user",
    "target_level": "N4",
    "current_level": null,
    "total_tests_taken": 0,
    "study_streak": 0,
    "is_admin": false
  },
  "message": "사용자 정보가 성공적으로 업데이트되었습니다"
}
```

**에러 응답:**
- `400 Bad Request`: 사용자명 중복 등 유효성 검증 실패
- `404 Not Found`: 사용자를 찾을 수 없는 경우

### 사용자 삭제

**엔드포인트:** `DELETE /api/v1/admin/users/{user_id}`

**설명:** 어드민이 사용자를 삭제합니다.

**인증:** 어드민 권한 필요

**경로 파라미터:**
- `user_id` (int): 사용자 ID

**응답 예시:**

```json
{
  "success": true,
  "message": "사용자가 성공적으로 삭제되었습니다"
}
```

**에러 응답:**
- `404 Not Found`: 사용자를 찾을 수 없는 경우

## 문제 관리 API

### 전체 문제 목록 조회

**엔드포인트:** `GET /api/v1/admin/questions`

**설명:** 어드민이 전체 문제 목록을 조회합니다.

**인증:** 어드민 권한 필요

**응답 예시:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "level": "N5",
      "question_type": "vocabulary",
      "question_text": "問題",
      "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
      "correct_answer": "選択肢1",
      "explanation": "説明",
      "difficulty": 1
    }
  ],
  "message": "문제 목록 조회 성공"
}
```

### 문제 생성

**엔드포인트:** `POST /api/v1/admin/questions`

**설명:** 어드민이 새로운 문제를 생성합니다.

**인증:** 어드민 권한 필요

**요청 본문:**

```json
{
  "level": "N5",
  "question_type": "vocabulary",
  "question_text": "新しい問題",
  "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
  "correct_answer": "選択肢1",
  "explanation": "説明",
  "difficulty": 1
}
```

**요청 필드:**
- `level` (string, required): JLPT 레벨 (N1, N2, N3, N4, N5)
- `question_type` (string, required): 문제 유형 (vocabulary, grammar, reading, listening)
- `question_text` (string, required): 문제 내용
- `choices` (array, required): 선택지 목록 (최소 2개, 최대 6개)
- `correct_answer` (string, required): 정답 (choices 중 하나여야 함)
- `explanation` (string, required): 해설
- `difficulty` (int, required): 난이도 (1-5)

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "level": "N5",
    "question_type": "vocabulary",
    "question_text": "新しい問題",
    "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
    "correct_answer": "選択肢1",
    "explanation": "説明",
    "difficulty": 1,
    "audio_url": null
  },
  "message": "문제가 성공적으로 생성되었습니다"
}
```

**특별 동작:**
- **자동 TTS 생성**: `question_type`이 `listening`인 경우, 문제 생성 시 자동으로 TTS 오디오가 생성되어 `audio_url` 필드에 저장됩니다.
- TTS 생성 실패 시에도 문제 생성은 성공하며, 오디오는 나중에 수동으로 업로드할 수 있습니다.

**에러 응답:**
- `400 Bad Request`: 유효성 검증 실패 (예: 정답이 choices에 없음, 선택지 중복 등)

### 특정 문제 조회

**엔드포인트:** `GET /api/v1/admin/questions/{question_id}`

**설명:** 어드민이 특정 문제의 상세 정보를 조회합니다.

**인증:** 어드민 권한 필요

**경로 파라미터:**
- `question_id` (int): 문제 ID

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "level": "N5",
    "question_type": "listening",
    "question_text": "問題",
    "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
    "correct_answer": "選択肢1",
    "explanation": "説明",
    "difficulty": 1,
    "audio_url": "/static/audio/tts/tts_abc123def456.mp3"
  },
  "message": "문제 정보 조회 성공"
}
```

**특별 기능:**
- **오디오 재생**: 리스닝 문제(`question_type`이 `listening`)이고 `audio_url`이 있는 경우, 어드민 UI에서 오디오 플레이어가 자동으로 표시됩니다.
- 오디오 파일은 `http://localhost:8000{audio_url}` 형식으로 접근 가능합니다.

**에러 응답:**
- `404 Not Found`: 문제를 찾을 수 없는 경우

### 문제 수정

**엔드포인트:** `PUT /api/v1/admin/questions/{question_id}`

**설명:** 어드민이 문제 정보를 수정합니다.

**인증:** 어드민 권한 필요

**경로 파라미터:**
- `question_id` (int): 문제 ID

**요청 본문:**

```json
{
  "question_text": "更新された問題",
  "difficulty": 2
}
```

**요청 필드 (모두 optional):**
- `level` (string, optional): JLPT 레벨
- `question_type` (string, optional): 문제 유형
- `question_text` (string, optional): 문제 내용

**특별 동작:**
- **자동 TTS 재생성**: `question_type`이 `listening`으로 변경되거나 `question_text`가 변경된 경우, 자동으로 TTS 오디오가 생성/재생성되어 `audio_url` 필드에 저장됩니다.
- 기존 TTS 파일이 있으면 자동으로 삭제되고 새 파일이 생성됩니다.
- TTS 생성 실패 시에도 문제 수정은 성공하며, 오디오는 나중에 수동으로 업로드할 수 있습니다.
- `choices` (array, optional): 선택지 목록
- `correct_answer` (string, optional): 정답
- `explanation` (string, optional): 해설
- `difficulty` (int, optional): 난이도

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "level": "N5",
    "question_type": "vocabulary",
    "question_text": "更新された問題",
    "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
    "correct_answer": "選択肢1",
    "explanation": "説明",
    "difficulty": 2
  },
  "message": "문제가 성공적으로 업데이트되었습니다"
}
```

**에러 응답:**
- `400 Bad Request`: 유효성 검증 실패 (예: 정답이 choices에 없음)
- `404 Not Found`: 문제를 찾을 수 없는 경우

### 문제 삭제

**엔드포인트:** `DELETE /api/v1/admin/questions/{question_id}`

**설명:** 어드민이 문제를 삭제합니다.

**인증:** 어드민 권한 필요

**경로 파라미터:**
- `question_id` (int): 문제 ID

**응답 예시:**

```json
{
  "success": true,
  "message": "문제가 성공적으로 삭제되었습니다"
}
```

**에러 응답:**
- `404 Not Found`: 문제를 찾을 수 없는 경우

## 단어 관리 API

### 전체 단어 목록 조회

**엔드포인트:** `GET /api/v1/admin/vocabulary`

**설명:** 어드민이 전체 단어 목록을 조회합니다.

**Query Parameters:**
- `level` (optional): JLPT 레벨 필터 (N5, N4, N3, N2, N1)
- `status` (optional): 암기 상태 필터 (not_memorized, learning, memorized)
- `search` (optional): 검색어 (단어, 읽기, 의미로 검색)

**인증:** 어드민 권한 필요

**응답 예시:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "word": "ありがとう",
      "reading": "ありがとう",
      "meaning": "감사합니다",
      "level": "N5",
      "memorization_status": "not_memorized",
      "example_sentence": "ありがとうございます。"
    }
  ],
  "message": "단어 목록 조회 성공"
}
```

### 특정 단어 조회

**엔드포인트:** `GET /api/v1/admin/vocabulary/{vocabulary_id}`

**설명:** 어드민이 특정 단어를 조회합니다.

**Path Parameters:**
- `vocabulary_id` (required): 단어 ID

**인증:** 어드민 권한 필요

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "word": "ありがとう",
    "reading": "ありがとう",
    "meaning": "감사합니다",
    "level": "N5",
    "memorization_status": "not_memorized",
    "example_sentence": "ありがとうございます。"
  },
  "message": "단어 조회 성공"
}
```

### 단어 생성

**엔드포인트:** `POST /api/v1/admin/vocabulary`

**설명:** 어드민이 새로운 단어를 생성합니다.

**인증:** 어드민 권한 필요

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

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "word": "ありがとう",
    "reading": "ありがとう",
    "meaning": "감사합니다",
    "level": "N5",
    "memorization_status": "not_memorized",
    "example_sentence": "ありがとうございます。"
  },
  "message": "단어 생성 성공"
}
```

### 단어 수정

**엔드포인트:** `PUT /api/v1/admin/vocabulary/{vocabulary_id}`

**설명:** 어드민이 단어 정보를 수정합니다.

**Path Parameters:**
- `vocabulary_id` (required): 단어 ID

**인증:** 어드민 권한 필요

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

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "word": "ありがとう",
    "reading": "ありがとう",
    "meaning": "고맙습니다",
    "level": "N5",
    "memorization_status": "not_memorized",
    "example_sentence": "ありがとうございます。"
  },
  "message": "단어 수정 성공"
}
```

### 단어 삭제

**엔드포인트:** `DELETE /api/v1/admin/vocabulary/{vocabulary_id}`

**설명:** 어드민이 단어를 삭제합니다.

**Path Parameters:**
- `vocabulary_id` (required): 단어 ID

**인증:** 어드민 권한 필요

**응답 예시:**

```json
{
  "success": true,
  "message": "단어 삭제 성공"
}
```

## 문제/단어 생성 및 임포트 API

### 문제 대량 생성

**엔드포인트:** `POST /api/v1/admin/questions/generate`

**설명:** 어드민이 문제를 대량 생성합니다. 샘플 데이터를 기반으로 자동 생성됩니다.

**인증:** 어드민 권한 필요

**요청 본문:**

```json
{
  "level": "N5",
  "question_type": "vocabulary",
  "count": 10
}
```

**요청 필드:**
- `level` (string, required): JLPT 레벨 (N1-N5)
- `question_type` (string, optional): 문제 유형 (vocabulary, grammar, reading, listening). None이면 모든 유형 생성
- `count` (int, required): 생성할 문제 수

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "count": 10,
    "questions": [
      {
        "id": 1,
        "level": "N5",
        "question_type": "vocabulary",
        "question_text": "「こんにちは」の意味は何ですか？",
        "choices": ["안녕하세요", "감사합니다", "실례합니다", "죄송합니다"],
        "correct_answer": "안녕하세요",
        "explanation": "説明",
        "difficulty": 1,
        "audio_url": null
      }
    ]
  },
  "message": "10개의 문제가 생성되었습니다"
}
```

### 기출문제 임포트 (JSON)

**엔드포인트:** `POST /api/v1/admin/questions/import`

**설명:** 어드민이 JSON 형식으로 기출문제를 임포트합니다.

**인증:** 어드민 권한 필요

**요청 본문:**

```json
{
  "questions": [
    {
      "level": "N5",
      "question_type": "vocabulary",
      "question_text": "「ありがとう」の意味は何ですか？",
      "choices": ["안녕하세요", "감사합니다", "실례합니다", "죄송합니다"],
      "correct_answer": "감사합니다",
      "explanation": "説明",
      "difficulty": 2,
      "audio_url": null
    }
  ]
}
```

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "imported": 1,
    "total": 1,
    "questions": [...]
  },
  "message": "1/1개의 문제가 임포트되었습니다"
}
```

### 기출문제 파일 임포트

**엔드포인트:** `POST /api/v1/admin/questions/import-file`

**설명:** 어드민이 JSON 또는 CSV 파일로 기출문제를 임포트합니다.

**인증:** 어드민 권한 필요

**요청 형식:** `multipart/form-data`

**요청 필드:**
- `file` (file, required): JSON 또는 CSV 파일

**JSON 파일 형식:**

```json
[
  {
    "level": "N5",
    "question_type": "vocabulary",
    "question_text": "問題",
    "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
    "correct_answer": "選択肢1",
    "explanation": "説明",
    "difficulty": 2,
    "audio_url": null
  }
]
```

**CSV 파일 형식:**

```csv
level,question_type,question_text,choices,correct_answer,explanation,difficulty,audio_url
N5,vocabulary,問題,"選択肢1,選択肢2,選択肢3,選択肢4",選択肢1,説明,2,
```

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "imported": 10,
    "total": 10,
    "questions": [...]
  },
  "message": "10/10개의 문제가 임포트되었습니다"
}
```

### 단어 대량 생성

**엔드포인트:** `POST /api/v1/admin/vocabulary/generate`

**설명:** 어드민이 단어를 대량 생성합니다. 샘플 데이터를 기반으로 자동 생성됩니다.

**인증:** 어드민 권한 필요

**요청 본문:**

```json
{
  "level": "N5",
  "count": 10
}
```

**요청 필드:**
- `level` (string, required): JLPT 레벨 (N1-N5)
- `count` (int, required): 생성할 단어 수

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "count": 10,
    "vocabularies": [
      {
        "id": 1,
        "word": "こんにちは",
        "reading": "こんにちは",
        "meaning": "안녕하세요",
        "level": "N5",
        "memorization_status": "not_memorized",
        "example_sentence": "こんにちは、元気ですか？"
      }
    ]
  },
  "message": "10개의 단어가 생성되었습니다"
}
```

### 기출단어 임포트 (JSON)

**엔드포인트:** `POST /api/v1/admin/vocabulary/import`

**설명:** 어드민이 JSON 형식으로 기출단어를 임포트합니다.

**인증:** 어드민 권한 필요

**요청 본문:**

```json
{
  "vocabularies": [
    {
      "word": "ありがとう",
      "reading": "ありがとう",
      "meaning": "감사합니다",
      "level": "N5",
      "memorization_status": "not_memorized",
      "example_sentence": "ありがとうございます。"
    }
  ]
}
```

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "imported": 1,
    "total": 1,
    "vocabularies": [...]
  },
  "message": "1/1개의 단어가 임포트되었습니다"
}
```

### 기출단어 파일 임포트

**엔드포인트:** `POST /api/v1/admin/vocabulary/import-file`

**설명:** 어드민이 JSON 또는 CSV 파일로 기출단어를 임포트합니다.

**인증:** 어드민 권한 필요

**요청 형식:** `multipart/form-data`

**요청 필드:**
- `file` (file, required): JSON 또는 CSV 파일

**JSON 파일 형식:**

```json
[
  {
    "word": "単語",
    "reading": "たんご",
    "meaning": "단어",
    "level": "N5",
    "memorization_status": "not_memorized",
    "example_sentence": "これは単語です。"
  }
]
```

**CSV 파일 형식:**

```csv
word,reading,meaning,level,memorization_status,example_sentence
単語,たんご,단어,N5,not_memorized,これは単語です。
```

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "imported": 10,
    "total": 10,
    "vocabularies": [...]
  },
  "message": "10/10개의 단어가 임포트되었습니다"
}
```

## 통계 API

### 통계 조회

**엔드포인트:** `GET /api/v1/admin/statistics`

**설명:** 어드민이 전체 시스템 통계를 조회합니다.

**인증:** 어드민 권한 필요

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "users": {
      "total_users": 10,
      "active_users": 7
    },
    "tests": {
      "total_tests": 25,
      "average_score": 75.5
    },
    "questions": {
      "total_questions": 50,
      "by_level": {
        "N5": 20,
        "N4": 15,
        "N3": 10,
        "N2": 5
      }
    },
    "learning_data": {
      "total_results": 25
    }
  },
  "message": "통계 조회 성공"
}
```

**응답 필드:**
- `users.total_users` (int): 전체 사용자 수
- `users.active_users` (int): 활성 사용자 수 (테스트를 한 번 이상 받은 사용자)
- `tests.total_tests` (int): 전체 테스트 수
- `tests.average_score` (float): 평균 점수
- `questions.total_questions` (int): 전체 문제 수
- `questions.by_level` (object): 레벨별 문제 수 (레벨을 키로 하는 객체)
- `learning_data.total_results` (int): 전체 결과 수

**에러 응답:**
- `401 Unauthorized`: 인증되지 않은 경우
- `403 Forbidden`: 어드민 권한이 없는 경우

## 어드민 UI 기능

### 리스닝 문제 오디오 재생

어드민 문제 관리 UI에서 리스닝 문제의 오디오를 재생할 수 있습니다:

1. **문제 목록에서 문제 클릭**: 문제 상세 보기로 이동
2. **오디오 플레이어 자동 표시**: 
   - `question_type`이 `listening`이고
   - `audio_url`이 있는 경우
   - 오디오 플레이어가 자동으로 표시됩니다
3. **오디오 재생**: HTML5 audio 요소를 사용하여 재생/일시정지/볼륨 조절 가능

**오디오 파일 접근:**
- 오디오 파일은 `http://localhost:8000{audio_url}` 형식으로 접근 가능합니다
- 예: `http://localhost:8000/static/audio/tts/tts_abc123def456.mp3`

**자동 TTS 생성:**
- 리스닝 문제 생성 시 자동으로 TTS 오디오가 생성됩니다
- 문제 수정 시 텍스트가 변경되면 자동으로 TTS가 재생성됩니다
- 자세한 내용은 [TTS 서비스 문서](../../architecture/domain/tts_service.md)를 참고하세요

## 관련 문서

- [인증 API](./auth.md) - 로그인 및 권한 관리
- [사용자 API](./users.md) - 일반 사용자 API
- [테스트 API](./tests.md) - 테스트 관리 API
- [TTS 서비스](../../architecture/domain/tts_service.md) - TTS 자동 생성 기능
- [API 스키마](../schemas/README.md) - 요청/응답 스키마 정의

