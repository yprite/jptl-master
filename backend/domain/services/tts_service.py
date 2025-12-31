"""
TTS (Text-to-Speech) 도메인 서비스
gTTS를 사용하여 텍스트를 오디오 파일로 변환하는 비즈니스 로직
"""

import hashlib
from pathlib import Path
from typing import Optional
from gtts import gTTS


class TTSService:
    """
    TTS 도메인 서비스
    
    텍스트를 오디오 파일로 변환하는 비즈니스 로직을 담당합니다.
    gTTS를 사용하여 일본어 텍스트를 음성으로 변환합니다.
    
    특징:
    - 자동 캐싱: 같은 텍스트는 재생성하지 않음 (해시 기반)
    - 일본어 지원: JLPT 문제에 최적화
    - 에러 처리: TTS 생성 실패 시 예외 발생
    """
    
    @staticmethod
    def generate_audio(
        text: str,
        language: str = 'ja',
        slow: bool = False,
        output_dir: Optional[str] = None
    ) -> str:
        """
        텍스트를 오디오 파일로 변환
        
        Args:
            text: 변환할 텍스트
            language: 언어 코드 ('ja' for Japanese, 'ko' for Korean, 'en' for English)
            slow: 느린 속도로 재생할지 여부
            output_dir: 출력 디렉토리 (없으면 기본 경로 사용)
        
        Returns:
            str: 생성된 오디오 파일의 상대 경로 (/static/audio/tts/...)
        
        Raises:
            ValueError: 텍스트가 비어있거나 유효하지 않은 경우
            Exception: gTTS API 호출 실패 시
        """
        if not text or not text.strip():
            raise ValueError("텍스트는 비어있을 수 없습니다")
        
        # 출력 디렉토리 설정
        if output_dir is None:
            backend_dir = Path(__file__).parent.parent.parent
            output_dir = backend_dir / "static" / "audio" / "tts"
        else:
            output_dir = Path(output_dir)
        
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # 파일명 생성 (텍스트 해시 기반으로 중복 방지 및 캐싱)
        text_hash = hashlib.md5(f"{text}_{language}_{slow}".encode()).hexdigest()
        filename = f"tts_{text_hash}.mp3"
        file_path = output_dir / filename
        
        # 이미 존재하는 파일이면 재생성하지 않음 (캐싱)
        if file_path.exists():
            return f"/static/audio/tts/{filename}"
        
        # TTS 생성
        try:
            tts = gTTS(text=text, lang=language, slow=slow)
            tts.save(str(file_path))
        except Exception as e:
            raise Exception(f"TTS 생성 실패: {str(e)}")
        
        # 상대 경로 반환
        return f"/static/audio/tts/{filename}"
    
    @staticmethod
    def delete_audio(audio_url: str) -> bool:
        """
        오디오 파일 삭제
        
        Args:
            audio_url: 삭제할 오디오 파일의 URL (/static/audio/tts/...)
        
        Returns:
            bool: 삭제 성공 여부
        """
        try:
            backend_dir = Path(__file__).parent.parent.parent
            file_path = backend_dir / "static" / audio_url.lstrip("/static/")
            
            if file_path.exists():
                file_path.unlink()
                return True
            return False
        except Exception:
            return False

