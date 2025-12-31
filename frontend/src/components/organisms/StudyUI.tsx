/**
 * Study UI 컴포넌트
 * 학습 모드에서 문제를 표시하고 즉시 피드백을 제공하는 컴포넌트
 */

import React, { useState, useEffect } from 'react';
import { Question } from '../../types/api';
import './StudyUI.css';

interface StudyUIProps {
  questions: Question[];
  onAnswerSelect?: (questionId: number, answer: string) => void;
  onSubmit?: (answers: Record<number, string>) => void;
  userAnswers?: Record<number, string>;
  readonly?: boolean;
}

interface QuestionResult {
  questionId: number;
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
}

const StudyUI: React.FC<StudyUIProps> = ({
  questions,
  onAnswerSelect,
  onSubmit,
  userAnswers = {},
  readonly = false,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>(userAnswers);
  const [results, setResults] = useState<Record<number, QuestionResult>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [startTime] = useState(Date.now());

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.values(results).filter(r => r.isCorrect).length;
  const accuracy = answeredCount > 0 ? (correctCount / answeredCount) * 100 : 0;

  // 답안 선택 시 즉시 피드백
  const handleAnswerChange = (questionId: number, answer: string) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);

    // 즉시 정답 확인
    const question = questions.find(q => q.id === questionId);
    if (question) {
      const isCorrect = question.correct_answer === answer;
      setResults(prev => ({
        ...prev,
        [questionId]: {
          questionId,
          isCorrect,
          userAnswer: answer,
          correctAnswer: question.correct_answer,
        },
      }));
      // 해설 자동 표시
      setShowExplanation(prev => ({ ...prev, [questionId]: true }));
    }

    if (onAnswerSelect) {
      onAnswerSelect(questionId, answer);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    if (onSubmit) {
      const timeSpentMinutes = Math.max(1, Math.floor((Date.now() - startTime) / 60000));
      onSubmit(answers);
    }
  };

  const toggleExplanation = (questionId: number) => {
    setShowExplanation(prev => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const currentResult = results[currentQuestion.id];
  const isAnswered = answers[currentQuestion.id] !== undefined;
  const showCurrentExplanation = showExplanation[currentQuestion.id] || false;

  if (!currentQuestion) {
    return <div className="study-ui">학습할 문제가 없습니다.</div>;
  }

  return (
    <div className="study-ui" data-testid="study-ui">
      <div className="study-ui-header">
        <h2 className="study-title">학습 모드</h2>
        <div className="study-meta">
          <span className="study-progress-info">
            진행: {answeredCount} / {totalQuestions} 문제
          </span>
          <span className="study-accuracy">
            정확도: {accuracy.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="study-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
            data-testid="progress-bar"
          />
        </div>
        <div className="progress-text">
          문제 {currentQuestionIndex + 1} / {totalQuestions}
        </div>
      </div>

      <div className="question-container">
        <div className="question-header">
          <span className="question-type">{currentQuestion.question_type}</span>
          <span className="question-difficulty">
            난이도: {currentQuestion.difficulty}
          </span>
        </div>
        {currentQuestion.audio_url && (
          <div className="audio-player-container" data-testid="audio-player">
            <audio
              controls
              src={`http://localhost:8000${currentQuestion.audio_url}`}
              onPlay={() => setAudioPlaying(true)}
              onPause={() => setAudioPlaying(false)}
              onEnded={() => setAudioPlaying(false)}
              data-testid="audio-element"
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
        <div className="question-text">{currentQuestion.question_text}</div>
        <div className="question-choices">
          {currentQuestion.choices.map((choice, index) => {
            const isSelected = answers[currentQuestion.id] === choice;
            const isCorrect = choice === currentQuestion.correct_answer;
            const isWrong = isSelected && !isCorrect && isAnswered;
            
            return (
              <label
                key={index}
                className={`choice-option ${
                  isSelected ? 'selected' : ''
                } ${isAnswered && isCorrect ? 'correct' : ''} ${
                  isWrong ? 'wrong' : ''
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value={choice}
                  checked={isSelected}
                  onChange={(e) =>
                    handleAnswerChange(currentQuestion.id, e.target.value)
                  }
                  disabled={readonly || isAnswered}
                  data-testid={`choice-${currentQuestion.id}-${index}`}
                />
                <span className="choice-text">{choice}</span>
                {isAnswered && isCorrect && (
                  <span className="feedback-icon correct-icon">✓</span>
                )}
                {isWrong && (
                  <span className="feedback-icon wrong-icon">✗</span>
                )}
              </label>
            );
          })}
        </div>

        {isAnswered && currentResult && (
          <div className={`feedback-container ${currentResult.isCorrect ? 'correct' : 'wrong'}`}>
            <div className="feedback-message">
              {currentResult.isCorrect ? (
                <span className="correct-message">정답입니다! ✓</span>
              ) : (
                <span className="wrong-message">
                  오답입니다. 정답은 "{currentResult.correctAnswer}"입니다.
                </span>
              )}
            </div>
            {currentQuestion.explanation && (
              <div className="explanation-section">
                <button
                  className="explanation-toggle"
                  onClick={() => toggleExplanation(currentQuestion.id)}
                >
                  {showCurrentExplanation ? '해설 숨기기' : '해설 보기'}
                </button>
                {showCurrentExplanation && (
                  <div className="explanation-text">
                    {currentQuestion.explanation}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="study-navigation">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0 || readonly}
          className="nav-button prev-button"
          data-testid="prev-button"
        >
          이전
        </button>
        <div className="question-indicators">
          {questions.map((q, index) => {
            const isAnswered = answers[q.id] !== undefined;
            const result = results[q.id];
            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(index)}
                disabled={readonly}
                className={`question-indicator ${
                  isAnswered ? 'answered' : ''
                } ${result?.isCorrect ? 'correct' : ''} ${
                  result && !result.isCorrect ? 'wrong' : ''
                } ${index === currentQuestionIndex ? 'current' : ''}`}
                data-testid={`question-indicator-${q.id}`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
        {currentQuestionIndex < totalQuestions - 1 ? (
          <button
            onClick={handleNext}
            disabled={readonly}
            className="nav-button next-button"
            data-testid="next-button"
          >
            다음
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={readonly}
            className="nav-button submit-button"
            data-testid="submit-button"
          >
            학습 완료
          </button>
        )}
      </div>
    </div>
  );
};

export default StudyUI;

