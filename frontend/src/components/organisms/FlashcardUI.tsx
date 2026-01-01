/**
 * Flashcard UI 컴포넌트
 * 단어 학습을 위한 플래시카드 기능 제공
 */

import React, { useState, useEffect } from 'react';
import { Vocabulary } from '../../types/api';
import './FlashcardUI.css';

interface FlashcardUIProps {
  vocabularies: Vocabulary[];
  onStatusUpdate?: (vocabularyId: number, status: string) => void;
}

const FlashcardUI: React.FC<FlashcardUIProps> = ({
  vocabularies,
  onStatusUpdate,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studiedIds, setStudiedIds] = useState<Set<number>>(new Set());

  const currentVocabulary = vocabularies[currentIndex];
  const totalVocabularies = vocabularies.length;
  const progress = totalVocabularies > 0 ? ((currentIndex + 1) / totalVocabularies) * 100 : 0;

  useEffect(() => {
    // 카드가 변경되면 뒤집기 상태 초기화
    setIsFlipped(false);
  }, [currentIndex]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentIndex < totalVocabularies - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleStatusUpdate = (status: string) => {
    if (currentVocabulary && onStatusUpdate) {
      onStatusUpdate(currentVocabulary.id, status);
      const newStudiedIds = new Set(studiedIds);
      newStudiedIds.add(currentVocabulary.id);
      setStudiedIds(newStudiedIds);
    }
  };

  if (!currentVocabulary) {
    return (
      <div className="flashcard-ui" data-testid="flashcard-ui">
        <div className="flashcard-empty">
          <p>학습할 단어가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flashcard-ui" data-testid="flashcard-ui">
      <div className="flashcard-header">
        <h2>플래시카드 학습</h2>
        <div className="flashcard-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="progress-text">
            {currentIndex + 1} / {totalVocabularies}
          </span>
        </div>
      </div>

      <div className="flashcard-container">
        <div
          className={`flashcard ${isFlipped ? 'flipped' : ''}`}
          onClick={handleFlip}
        >
          <div className="flashcard-front">
            <div className="flashcard-level">{currentVocabulary.level}</div>
            <div className="flashcard-word">{currentVocabulary.word}</div>
            <div className="flashcard-reading">{currentVocabulary.reading}</div>
            <div className="flashcard-hint">카드를 클릭하여 뒤집기</div>
          </div>
          <div className="flashcard-back">
            <div className="flashcard-level">{currentVocabulary.level}</div>
            <div className="flashcard-meaning">{currentVocabulary.meaning}</div>
            {currentVocabulary.example_sentence && (
              <div className="flashcard-example">
                <div className="example-label">예문:</div>
                <div className="example-text">{currentVocabulary.example_sentence}</div>
              </div>
            )}
            <div className="flashcard-hint">카드를 클릭하여 다시 뒤집기</div>
          </div>
        </div>
      </div>

      <div className="flashcard-controls">
        <button
          className="btn btn-secondary"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          이전
        </button>
        <div className="status-buttons">
          <button
            className="btn btn-status-not-memorized"
            onClick={() => handleStatusUpdate('not_memorized')}
          >
            미암기
          </button>
          <button
            className="btn btn-status-learning"
            onClick={() => handleStatusUpdate('learning')}
          >
            학습중
          </button>
          <button
            className="btn btn-status-memorized"
            onClick={() => handleStatusUpdate('memorized')}
          >
            암기완료
          </button>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleNext}
          disabled={currentIndex === totalVocabularies - 1}
        >
          다음
        </button>
      </div>
    </div>
  );
};

export default FlashcardUI;

