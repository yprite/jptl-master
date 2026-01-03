/**
 * Vocabulary Review UI 컴포넌트
 * Anki 스타일 간격 반복 학습을 위한 복습 UI
 */

import React, { useState, useEffect } from 'react';
import { VocabularyReview, ReviewStatistics } from '../../types/api';
import { vocabularyApi } from '../../services/api';
import './VocabularyReviewUI.css';

interface VocabularyReviewUIProps {
  onBack?: () => void;
}

const VocabularyReviewUI: React.FC<VocabularyReviewUIProps> = ({ onBack }) => {
  const [vocabularies, setVocabularies] = useState<VocabularyReview[]>([]);
  const [statistics, setStatistics] = useState<ReviewStatistics | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewedCount, setReviewedCount] = useState(0);

  useEffect(() => {
    loadReviewData();
  }, []);

  const loadReviewData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [reviewVocabs, stats] = await Promise.all([
        vocabularyApi.getReviewVocabularies(),
        vocabularyApi.getReviewStatistics()
      ]);
      setVocabularies(reviewVocabs);
      setStatistics(stats);
    } catch (err) {
      setError('복습 데이터를 불러오는데 실패했습니다.');
      console.error('Failed to load review data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const currentVocabulary = vocabularies[currentIndex];
  const totalVocabularies = vocabularies.length;
  const progress = totalVocabularies > 0 
    ? ((currentIndex + 1) / totalVocabularies) * 100 
    : 0;
  const remainingCount = totalVocabularies - currentIndex;

  useEffect(() => {
    // 카드가 변경되면 뒤집기 상태 초기화
    setIsFlipped(false);
  }, [currentIndex]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleReview = async (difficulty: 'easy' | 'normal' | 'hard') => {
    if (!currentVocabulary) return;

    try {
      // 복습 처리
      await vocabularyApi.reviewVocabulary(currentVocabulary.id, difficulty);
      
      // 복습한 단어 제거
      const newVocabularies = vocabularies.filter(
        (v) => v.id !== currentVocabulary.id
      );
      setVocabularies(newVocabularies);
      setReviewedCount(reviewedCount + 1);

      // 통계 업데이트
      const stats = await vocabularyApi.getReviewStatistics();
      setStatistics(stats);

      // 다음 단어로 이동 (인덱스 조정)
      if (currentIndex >= newVocabularies.length && newVocabularies.length > 0) {
        setCurrentIndex(newVocabularies.length - 1);
      } else if (newVocabularies.length === 0) {
        // 모든 복습 완료
        setCurrentIndex(0);
      }
    } catch (err) {
      setError('복습 처리에 실패했습니다.');
      console.error('Failed to review vocabulary:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="vocabulary-review-ui" data-testid="vocabulary-review-ui">
        <div className="review-loading">
          <p>복습 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vocabulary-review-ui" data-testid="vocabulary-review-ui">
        <div className="review-error">
          <p>{error}</p>
          <button onClick={loadReviewData} className="btn btn-primary">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (vocabularies.length === 0) {
    return (
      <div className="vocabulary-review-ui" data-testid="vocabulary-review-ui">
        <div className="review-header">
          <h2>복습</h2>
          {onBack && (
            <button onClick={onBack} className="back-button">
              뒤로 가기
            </button>
          )}
        </div>
        <div className="review-empty">
          <p>오늘 복습할 단어가 없습니다! 🎉</p>
          {statistics && (
            <div className="review-statistics">
              <div className="stat-item">
                <span className="stat-label">오늘 복습한 단어:</span>
                <span className="stat-value">{statistics.reviewed_today}개</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">복습 성공률:</span>
                <span className="stat-value">{statistics.success_rate}%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="vocabulary-review-ui" data-testid="vocabulary-review-ui">
      <div className="review-header">
        <h2>복습</h2>
        {onBack && (
          <button onClick={onBack} className="back-button">
            뒤로 가기
          </button>
        )}
      </div>

      {statistics && (
        <div className="review-stats-bar">
          <div className="stat-item">
            <span className="stat-label">대기 중:</span>
            <span className="stat-value">{statistics.total_due}개</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">오늘 복습:</span>
            <span className="stat-value">{statistics.reviewed_today}개</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">성공률:</span>
            <span className="stat-value">{statistics.success_rate}%</span>
          </div>
        </div>
      )}

      <div className="review-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <span className="progress-text">
          {currentIndex + 1} / {totalVocabularies} ({remainingCount}개 남음)
        </span>
      </div>

      <div className="review-container">
        <div
          className={`review-card ${isFlipped ? 'flipped' : ''}`}
          onClick={handleFlip}
        >
          <div className="review-card-front">
            <div className="card-level">{currentVocabulary.level}</div>
            <div className="card-word">{currentVocabulary.word}</div>
            <div className="card-reading">{currentVocabulary.reading}</div>
            <div className="card-hint">카드를 클릭하여 뒤집기</div>
            {currentVocabulary.review_count > 0 && (
              <div className="card-meta">
                <span>복습 횟수: {currentVocabulary.review_count}회</span>
                {currentVocabulary.next_review_date && (
                  <span>
                    다음 복습: {new Date(currentVocabulary.next_review_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="review-card-back">
            <div className="card-level">{currentVocabulary.level}</div>
            <div className="card-meaning">{currentVocabulary.meaning}</div>
            {currentVocabulary.example_sentence && (
              <div className="card-example">
                <div className="example-label">예문:</div>
                <div className="example-text">{currentVocabulary.example_sentence}</div>
              </div>
            )}
            <div className="card-hint">카드를 클릭하여 다시 뒤집기</div>
          </div>
        </div>
      </div>

      <div className="review-controls">
        <div className="difficulty-buttons">
          <button
            className="btn btn-difficulty-hard"
            onClick={() => handleReview('hard')}
            disabled={!isFlipped}
          >
            어려움
          </button>
          <button
            className="btn btn-difficulty-normal"
            onClick={() => handleReview('normal')}
            disabled={!isFlipped}
          >
            보통
          </button>
          <button
            className="btn btn-difficulty-easy"
            onClick={() => handleReview('easy')}
            disabled={!isFlipped}
          >
            쉬움
          </button>
        </div>
      </div>
    </div>
  );
};

export default VocabularyReviewUI;

