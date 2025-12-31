# TTS (Text-to-Speech) 도메인 서비스

## 개요

`TTSService`는 텍스트를 오디오 파일로 변환하는 도메인 서비스입니다. gTTS(Google Text-to-Speech)를 사용하여 일본어 텍스트를 음성으로 변환합니다.

## 책임

- 텍스트를 오디오 파일로 변환
- 자동 캐싱 (같은 텍스트는 재생성하지 않음)
- 오디오 파일 삭제

## 위치

```
backend/domain/services/tts_service.py
```

## 주요 메서드

### `generate_audio(text, language='ja', slow=False, output_dir=None) -> str`

텍스트를 오디오 파일로 변환합니다.

**파라미터:**
- `text` (str): 변환할 텍스트
- `language` (str): 언어 코드 ('ja' for Japanese, 'ko' for Korean, 'en' for English)
- `slow` (bool): 느린 속도로 재생할지 여부
- `output_dir` (str, optional): 출력 디렉토리 (없으면 기본 경로 사용)

**반환값:**
- `str`: 생성된 오디오 파일의 상대 경로 (`/static/audio/tts/...`)

**특징:**
- 자동 캐싱: 같은 텍스트, 언어, 속도 조합은 해시 기반으로 캐싱되어 재생성하지 않음
- 파일명: `tts_{text_hash}.mp3` 형식으로 생성

**예외:**
- `ValueError`: 텍스트가 비어있거나 유효하지 않은 경우
- `Exception`: gTTS API 호출 실패 시

**사용 예시:**
```python
from backend.domain.services.tts_service import TTSService

# 일본어 텍스트를 오디오로 변환
audio_url = TTSService.generate_audio(
    text="こんにちは",
    language='ja',
    slow=False
)
# 반환값: "/static/audio/tts/tts_abc123def456.mp3"
```

### `delete_audio(audio_url) -> bool`

오디오 파일을 삭제합니다.

**파라미터:**
- `audio_url` (str): 삭제할 오디오 파일의 URL (`/static/audio/tts/...`)

**반환값:**
- `bool`: 삭제 성공 여부

**사용 예시:**
```python
from backend.domain.services.tts_service import TTSService

# 오디오 파일 삭제
success = TTSService.delete_audio("/static/audio/tts/tts_abc123def456.mp3")
```

## 자동 TTS 생성

리스닝 문제 생성/수정 시 자동으로 TTS 오디오가 생성됩니다:

1. **문제 생성 시**: `question_type`이 `LISTENING`인 경우 자동으로 TTS 생성
2. **문제 수정 시**: `question_type`이 `LISTENING`으로 변경되거나 `question_text`가 변경된 경우 자동으로 TTS 재생성

## 파일 저장 위치

오디오 파일은 다음 위치에 저장됩니다:

```
backend/static/audio/tts/tts_{hash}.mp3
```

정적 파일 서빙을 통해 다음 URL로 접근 가능합니다:

```
http://localhost:8000/static/audio/tts/tts_{hash}.mp3
```

## 의존성

- `gtts>=2.5.0`: Google Text-to-Speech 라이브러리
- 인터넷 연결 필요 (gTTS는 Google 서비스를 사용)

## 제한사항

- gTTS는 일일 사용량 제한이 있을 수 있음 (약 50-100회)
- 인터넷 연결이 필요함
- TTS 생성 실패 시에도 문제 생성/수정은 성공 (오디오는 나중에 수동 업로드 가능)

## 테스트

단위 테스트 위치: `tests/unit/domain/services/test_tts_service.py`

테스트 커버리지:
- 오디오 생성 성공
- 빈 텍스트 에러 처리
- 캐싱 기능 검증
- 다른 언어 지원
- 느린 속도 옵션
- 오디오 파일 삭제

## 어드민 UI 통합

### 오디오 재생 기능

어드민 문제 관리 UI에서 리스닝 문제의 오디오를 재생할 수 있습니다:

1. **문제 상세 보기**: 문제 목록에서 리스닝 문제를 클릭하면 상세 보기로 이동
2. **자동 오디오 플레이어 표시**: 
   - `question_type`이 `listening`이고
   - `audio_url`이 있는 경우
   - 오디오 플레이어가 자동으로 표시됩니다
3. **오디오 재생**: HTML5 audio 요소를 사용하여 재생/일시정지/볼륨 조절 가능

**구현 위치:**
- `frontend/src/components/organisms/AdminQuestionManagementUI.tsx`
- `frontend/src/components/organisms/AdminQuestionManagementUI.css`

**사용자 경험:**
- 어드민이 리스닝 문제를 생성하면 자동으로 TTS 오디오가 생성됨
- 문제 상세 보기에서 오디오를 바로 재생하여 확인 가능
- 문제 수정 시 텍스트가 변경되면 자동으로 오디오가 재생성됨

