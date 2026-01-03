/**
 * Study UI 컴포넌트
 * 학습 모드에서 문제를 표시하고 관리하는 컴포넌트
 * 테스트 모드와 달리 즉시 피드백과 해설을 제공
 */

import React, { useState } from 'react';
import { Question } from '../../types/api';
import './StudyUI.css';

interface StudyUIProps {
  questions: Question[];
  onSubmit?: (answers: Record<number, string>) => void;
}

const StudyUI: React.FC<StudyUIProps> = ({
  questions,
  onSubmit,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showFeedback, setShowFeedback] = useState<Record<number, boolean>>({});
  const [audioPlaying, setAudioPlaying] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const handleAnswerChange = (questionId: number, answer: string) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
    // 답안 선택 시 즉시 피드백 표시
    setShowFeedback({ ...showFeedback, [questionId]: true });
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

  const isAllAnswered = questions.every((q) => answers[q.id]);
  const currentAnswer = answers[currentQuestion?.id] || '';
  // currentAnswer는 A, B, C, D 라벨이고, correct_answer는 실제 선택지 텍스트이므로 변환 필요
  const getAnswerText = (label: string): string | null => {
    if (!currentQuestion || !label) return null;
    const index = label.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
    return currentQuestion.choices[index] || null;
  };
  const currentAnswerText = getAnswerText(currentAnswer);
  const isCorrect = currentQuestion && currentAnswerText === currentQuestion.correct_answer;
  const showCurrentFeedback = currentQuestion && showFeedback[currentQuestion.id];

  if (!currentQuestion) {
    return <div className="study-ui">학습할 문제가 없습니다.</div>;
  }

  return (
    <div className="study-ui" data-testid="study-ui">
      <div className="study-header">
        <h2>학습 모드</h2>
        <div className="study-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="progress-text">
            {currentQuestionIndex + 1} / {totalQuestions}
          </span>
        </div>
      </div>

      <div className="study-question">
        <div className="question-header">
          <span className="question-type">{currentQuestion.question_type}</span>
          <span className="question-level">{currentQuestion.level}</span>
          <span className="question-difficulty">난이도: {currentQuestion.difficulty}</span>
        </div>

        <div className="question-text">{currentQuestion.question_text}</div>

        {currentQuestion.audio_url && (
          <div className="audio-player">
            <audio
              src={currentQuestion.audio_url}
              controls
              onPlay={() => setAudioPlaying(true)}
              onPause={() => setAudioPlaying(false)}
              onEnded={() => setAudioPlaying(false)}
            />
          </div>
        )}

        <div className="choices">
          {currentQuestion.choices.map((choice, index) => {
            const choiceLabel = String.fromCharCode(65 + index); // A, B, C, D
            const isSelected = currentAnswer === choiceLabel;
            const isCorrectChoice = choice === currentQuestion.correct_answer;
            let choiceClass = 'choice';
            
            if (showCurrentFeedback) {
              if (isCorrectChoice) {
                choiceClass += ' correct';
              } else if (isSelected && !isCorrectChoice) {
                choiceClass += ' incorrect';
              }
            }

            return (
              <label key={index} className={choiceClass}>
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value={choiceLabel}
                  checked={isSelected}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  disabled={showCurrentFeedback}
                />
                <span className="choice-label">{choiceLabel}.</span>
                <span className="choice-text">{choice}</span>
              </label>
            );
          })}
        </div>

        {showCurrentFeedback && (
          <div className={`feedback ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`}>
            <div className="feedback-header">
              {isCorrect ? (
                <span className="feedback-icon">✓</span>
              ) : (
                <span className="feedback-icon">✗</span>
              )}
              <span className="feedback-text">
                {isCorrect ? '정답입니다!' : (() => {
                  // 정답의 인덱스를 찾아서 라벨로 변환
                  const correctIndex = currentQuestion.choices.findIndex(c => c === currentQuestion.correct_answer);
                  const correctLabel = correctIndex >= 0 ? String.fromCharCode(65 + correctIndex) : '?';
                  return `오답입니다. 정답은 ${correctLabel}입니다.`;
                })()}
              </span>
            </div>
            {currentQuestion.explanation && (
              <div className="explanation">
                <strong>해설:</strong> {currentQuestion.explanation}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="study-navigation">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="nav-button prev-button"
        >
          이전
        </button>
        {currentQuestionIndex < totalQuestions - 1 ? (
          <button
            onClick={handleNext}
            className="nav-button next-button"
          >
            다음
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!isAllAnswered}
            className="nav-button submit-button"
          >
            제출
          </button>
        )}
      </div>
    </div>
  );
};

export default StudyUI;

