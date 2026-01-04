import React, { useState } from 'react';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { Progress } from '../atoms/Progress';
import { Question } from '../../types/api';
import './StudyModeUI.css';

export interface StudyConcept {
  id: string;
  title: string;
  description: string;
  category: 'vocabulary' | 'grammar' | 'reading' | 'listening';
  examples: Array<{
    text: string;
    translation?: string;
    explanation?: string;
  }>;
  questions: Question[]; // 5개 미니 문제
}

export interface StudyModeUIProps {
  concept: StudyConcept;
  onComplete: (results: {
    correctCount: number;
    totalCount: number;
    answers: Record<number, string>;
  }) => void;
  onNotUnderstood?: () => void;
  onBack?: () => void;
}

type StudyStep = 'concept' | 'examples' | 'questions' | 'results';

const StudyModeUI: React.FC<StudyModeUIProps> = ({
  concept,
  onComplete,
  onNotUnderstood,
  onBack
}) => {
  const [step, setStep] = useState<StudyStep>('concept');
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showFeedback, setShowFeedback] = useState<Record<number, boolean>>({});
  const [results, setResults] = useState<{
    correctCount: number;
    totalCount: number;
  } | null>(null);

  const currentExample = concept.examples[currentExampleIndex];
  const currentQuestion = concept.questions[currentQuestionIndex];
  const totalQuestions = concept.questions.length;

  // 개념 카드에서 다음 단계로
  const handleConceptNext = () => {
    if (concept.examples.length > 0) {
      setStep('examples');
    } else {
      setStep('questions');
    }
  };

  // 예제에서 다음 예제로 또는 문제로
  const handleExampleNext = () => {
    if (currentExampleIndex < concept.examples.length - 1) {
      setCurrentExampleIndex(currentExampleIndex + 1);
    } else {
      setStep('questions');
    }
  };

  // 예제에서 이전 예제로
  const handleExamplePrevious = () => {
    if (currentExampleIndex > 0) {
      setCurrentExampleIndex(currentExampleIndex - 1);
    } else {
      setStep('concept');
    }
  };

  // 문제 답안 선택
  const handleAnswerSelect = (questionId: number, answer: string) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
    // 즉시 피드백 표시
    setShowFeedback({ ...showFeedback, [questionId]: true });
  };

  // 문제에서 다음 문제로
  const handleQuestionNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // 모든 문제 완료 - 결과 계산
      calculateResults();
    }
  };

  // 문제에서 이전 문제로
  const handleQuestionPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      // 첫 번째 문제에서 뒤로가면 예제로
      if (concept.examples.length > 0) {
        setStep('examples');
        setCurrentExampleIndex(concept.examples.length - 1);
      } else {
        setStep('concept');
      }
    }
  };

  // 결과 계산
  const calculateResults = () => {
    let correctCount = 0;
    concept.questions.forEach(question => {
      const userAnswer = answers[question.id];
      if (userAnswer) {
        const answerIndex = userAnswer.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
        const answerText = question.choices[answerIndex];
        if (answerText === question.correct_answer) {
          correctCount++;
        }
      }
    });

    const calculatedResults = {
      correctCount,
      totalCount: totalQuestions
    };

    setResults(calculatedResults);
    setStep('results');
  };

  // 결과 화면에서 완료
  const handleResultsComplete = () => {
    if (results) {
      onComplete({
        correctCount: results.correctCount,
        totalCount: results.totalCount,
        answers
      });
    }
  };

  // 이해 안 됨 버튼 클릭
  const handleNotUnderstood = () => {
    if (onNotUnderstood) {
      onNotUnderstood();
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'vocabulary': return '어휘';
      case 'grammar': return '문법';
      case 'reading': return '독해';
      case 'listening': return '청해';
      default: return category;
    }
  };

  const getCategoryColor = (category: string): 'primary' | 'success' | 'warning' | 'danger' => {
    switch (category) {
      case 'vocabulary': return 'primary';
      case 'grammar': return 'success';
      case 'reading': return 'warning';
      case 'listening': return 'danger';
      default: return 'primary';
    }
  };

  // 개념 카드 단계
  if (step === 'concept') {
    return (
      <div className="study-mode-ui">
        <div className="study-mode-header">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              ← 뒤로
            </Button>
          )}
          <Badge variant={getCategoryColor(concept.category)} size="md">
            {getCategoryLabel(concept.category)}
          </Badge>
        </div>

        <Card className="study-mode-concept-card" variant="elevated" padding="lg">
          <h1 className="study-mode-concept-title">{concept.title}</h1>
          <div className="study-mode-concept-description">
            {concept.description.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        </Card>

        <div className="study-mode-actions">
          <Button variant="outline" onClick={handleNotUnderstood}>
            이해 안 됨
          </Button>
          <Button variant="primary" onClick={handleConceptNext}>
            예제 보기 →
          </Button>
        </div>
      </div>
    );
  }

  // 예제 단계
  if (step === 'examples') {
    return (
      <div className="study-mode-ui">
        <div className="study-mode-header">
          <Button variant="ghost" size="sm" onClick={() => setStep('concept')}>
            ← 개념으로
          </Button>
          <div className="study-mode-progress">
            <span>예제 {currentExampleIndex + 1} / {concept.examples.length}</span>
          </div>
        </div>

        <Card className="study-mode-example-card" variant="elevated" padding="lg">
          <h2 className="study-mode-example-title">예제 {currentExampleIndex + 1}</h2>
          <div className="study-mode-example-content">
            <div className="study-mode-example-text">
              {currentExample.text}
            </div>
            {currentExample.translation && (
              <div className="study-mode-example-translation">
                <strong>번역:</strong> {currentExample.translation}
              </div>
            )}
            {currentExample.explanation && (
              <div className="study-mode-example-explanation">
                <strong>설명:</strong> {currentExample.explanation}
              </div>
            )}
          </div>
        </Card>

        <div className="study-mode-actions">
          <Button
            variant="outline"
            onClick={handleExamplePrevious}
            disabled={currentExampleIndex === 0}
          >
            ← 이전 예제
          </Button>
          {currentExampleIndex < concept.examples.length - 1 ? (
            <Button variant="primary" onClick={handleExampleNext}>
              다음 예제 →
            </Button>
          ) : (
            <Button variant="primary" onClick={handleExampleNext}>
              문제 풀기 →
            </Button>
          )}
        </div>
      </div>
    );
  }

  // 문제 단계
  if (step === 'questions') {
    const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
    const userAnswer = answers[currentQuestion.id];
    const answerIndex = userAnswer ? userAnswer.charCodeAt(0) - 65 : -1;
    const answerText = answerIndex >= 0 ? currentQuestion.choices[answerIndex] : null;
    const isCorrect = answerText === currentQuestion.correct_answer;
    const showCurrentFeedback = showFeedback[currentQuestion.id];

    return (
      <div className="study-mode-ui">
        <div className="study-mode-header">
          <Button variant="ghost" size="sm" onClick={handleQuestionPrevious}>
            ← {concept.examples.length > 0 ? '예제로' : '개념으로'}
          </Button>
          <div className="study-mode-progress">
            <Progress value={progress} variant="primary" size="md" showLabel={false} />
            <span>문제 {currentQuestionIndex + 1} / {totalQuestions}</span>
          </div>
        </div>

        <Card className="study-mode-question-card" variant="elevated" padding="lg">
          <div className="study-mode-question-header">
            <Badge variant={getCategoryColor(concept.category)} size="sm">
              {getCategoryLabel(concept.category)}
            </Badge>
            <Badge variant="primary" size="sm">
              난이도: {currentQuestion.difficulty}
            </Badge>
          </div>

          <div className="study-mode-question-text">
            {currentQuestion.question_text}
          </div>

          {currentQuestion.audio_url && (
            <div className="study-mode-audio">
              <audio controls src={currentQuestion.audio_url}>
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          <div className="study-mode-choices">
            {currentQuestion.choices.map((choice, index) => {
              const choiceLabel = String.fromCharCode(65 + index);
              const isSelected = userAnswer === choiceLabel;
              const isCorrectChoice = choice === currentQuestion.correct_answer;
              let choiceClass = 'study-mode-choice';

              if (showCurrentFeedback) {
                if (isCorrectChoice) {
                  choiceClass += ' study-mode-choice--correct';
                } else if (isSelected && !isCorrectChoice) {
                  choiceClass += ' study-mode-choice--wrong';
                }
              }

              return (
                <label
                  key={index}
                  className={choiceClass}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={choiceLabel}
                    checked={isSelected}
                    onChange={(e) => handleAnswerSelect(currentQuestion.id, e.target.value)}
                    disabled={showCurrentFeedback}
                  />
                  <span className="study-mode-choice-label">{choiceLabel}.</span>
                  <span className="study-mode-choice-text">{choice}</span>
                  {showCurrentFeedback && isCorrectChoice && (
                    <Badge variant="success" size="sm">정답</Badge>
                  )}
                </label>
              );
            })}
          </div>

          {showCurrentFeedback && (
            <div className={`study-mode-feedback ${isCorrect ? 'study-mode-feedback--correct' : 'study-mode-feedback--wrong'}`}>
              <div className="study-mode-feedback-header">
                {isCorrect ? (
                  <>
                    <span className="study-mode-feedback-icon">✓</span>
                    <span className="study-mode-feedback-text">정답입니다!</span>
                  </>
                ) : (
                  <>
                    <span className="study-mode-feedback-icon">✗</span>
                    <span className="study-mode-feedback-text">오답입니다.</span>
                  </>
                )}
              </div>
              {currentQuestion.explanation && (
                <div className="study-mode-feedback-explanation">
                  <strong>해설:</strong> {currentQuestion.explanation}
                </div>
              )}
            </div>
          )}
        </Card>

        <div className="study-mode-actions">
          <Button
            variant="outline"
            onClick={handleQuestionPrevious}
            disabled={currentQuestionIndex === 0}
          >
            ← 이전
          </Button>
          {currentQuestionIndex < totalQuestions - 1 ? (
            <Button
              variant="primary"
              onClick={handleQuestionNext}
              disabled={!userAnswer}
            >
              다음 문제 →
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleQuestionNext}
              disabled={!userAnswer}
            >
              결과 보기 →
            </Button>
          )}
        </div>
      </div>
    );
  }

  // 결과 단계
  if (step === 'results' && results) {
    const accuracy = (results.correctCount / results.totalCount) * 100;
    const isGood = accuracy >= 80;

    return (
      <div className="study-mode-ui">
        <div className="study-mode-header">
          <h2 className="study-mode-results-title">학습 완료!</h2>
        </div>

        <Card className="study-mode-results-card" variant="elevated" padding="lg">
          <div className="study-mode-results-score">
            <div className="study-mode-results-score-value">
              {results.correctCount} / {results.totalCount}
            </div>
            <div className="study-mode-results-score-label">
              정답률 {accuracy.toFixed(1)}%
            </div>
            <Progress
              value={accuracy}
              variant={isGood ? 'success' : 'warning'}
              size="lg"
              showLabel={false}
            />
          </div>

          <div className="study-mode-results-message">
            {isGood ? (
              <p>훌륭합니다! 개념을 잘 이해하셨네요. 다음 학습을 추천합니다.</p>
            ) : (
              <p>일부 문제를 틀리셨네요. 개념을 다시 확인하고 복습해보세요.</p>
            )}
          </div>

          <div className="study-mode-results-actions">
            {!isGood && onNotUnderstood && (
              <Button variant="outline" onClick={handleNotUnderstood}>
                더 쉬운 설명 보기
              </Button>
            )}
            <Button variant="primary" onClick={handleResultsComplete}>
              다음 학습하기
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
};

export default StudyModeUI;

