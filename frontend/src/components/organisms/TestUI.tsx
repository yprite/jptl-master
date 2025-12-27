/**
 * Test UI 컴포넌트
 * JLPT 테스트를 표시하고 관리하는 컴포넌트
 */

import React, { useState } from 'react';
import { Test, Question } from '../../types/api';
import './TestUI.css';

interface TestUIProps {
  test: Test;
  onAnswerSelect?: (questionId: number, answer: string) => void;
  onSubmit?: (answers: Record<number, string>) => void;
  userAnswers?: Record<number, string>;
  readonly?: boolean;
}

const TestUI: React.FC<TestUIProps> = ({
  test,
  onAnswerSelect,
  onSubmit,
  userAnswers = {},
  readonly = false,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>(userAnswers);

  const currentQuestion = test.questions[currentQuestionIndex];
  const totalQuestions = test.questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const handleAnswerChange = (questionId: number, answer: string) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
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
      onSubmit(answers);
    }
  };

  const isAllAnswered = test.questions.every((q) => answers[q.id]);

  if (!currentQuestion) {
    return <div className="test-ui">테스트에 문제가 없습니다.</div>;
  }

  return (
    <div className="test-ui" data-testid="test-ui">
      <div className="test-ui-header">
        <h2 className="test-title">{test.title}</h2>
        <div className="test-meta">
          <span className="test-level">레벨: {test.level}</span>
          <span className="test-status">상태: {test.status}</span>
          <span className="test-time-limit">
            제한 시간: {test.time_limit_minutes}분
          </span>
        </div>
      </div>

      <div className="test-progress">
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
        <div className="question-text">{currentQuestion.question_text}</div>
        <div className="question-choices">
          {currentQuestion.choices.map((choice, index) => (
            <label
              key={index}
              className={`choice-option ${
                answers[currentQuestion.id] === choice ? 'selected' : ''
              }`}
            >
              <input
                type="radio"
                name={`question-${currentQuestion.id}`}
                value={choice}
                checked={answers[currentQuestion.id] === choice}
                onChange={(e) =>
                  handleAnswerChange(currentQuestion.id, e.target.value)
                }
                disabled={readonly}
                data-testid={`choice-${currentQuestion.id}-${index}`}
              />
              <span className="choice-text">{choice}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="test-navigation">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0 || readonly}
          className="nav-button prev-button"
          data-testid="prev-button"
        >
          이전
        </button>
        <div className="question-indicators">
          {test.questions.map((q, index) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestionIndex(index)}
              disabled={readonly}
              className={`question-indicator ${
                answers[q.id] ? 'answered' : ''
              } ${index === currentQuestionIndex ? 'current' : ''}`}
              data-testid={`question-indicator-${q.id}`}
            >
              {index + 1}
            </button>
          ))}
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
            disabled={!isAllAnswered || readonly}
            className="nav-button submit-button"
            data-testid="submit-button"
          >
            제출
          </button>
        )}
      </div>
    </div>
  );
};

export default TestUI;

