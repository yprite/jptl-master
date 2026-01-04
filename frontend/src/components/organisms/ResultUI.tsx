import React, { useState, useEffect } from 'react';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { Progress } from '../atoms/Progress';
import { Tabs } from '../atoms/Tabs';
import { Result } from '../../types/api';
import { resultApi } from '../../services/api';
import './ResultUI.css';

export interface AnswerDetail {
  id: number;
  result_id: number;
  question_id: number;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  time_spent_seconds: number;
  difficulty: number;
  question_type: string;
  created_at: string;
}

export interface QuestionWithAnswer {
  id: number;
  question_text: string;
  choices: string[];
  correct_answer: string;
  explanation?: string;
  question_type: string;
  difficulty: number;
  user_answer: string;
  is_correct: boolean;
  time_spent_seconds: number;
}

interface ResultUIProps {
  result: Result;
  testQuestions?: QuestionWithAnswer[]; // 테스트 문제 목록 (선택적)
  onRetry?: () => void;
  onRetryWrongOnly?: () => void;
  onViewWrongAnswers?: () => void;
}

const ResultUI: React.FC<ResultUIProps> = ({
  result,
  testQuestions,
  onRetry,
  onRetryWrongOnly,
  onViewWrongAnswers
}) => {
  const [answerDetails, setAnswerDetails] = useState<AnswerDetail[]>([]);
  const [questionsWithAnswers, setQuestionsWithAnswers] = useState<QuestionWithAnswer[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'wrong-answers'>('overview');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    loadAnswerDetails();
  }, [result.id]);

  const loadAnswerDetails = async () => {
    try {
      setIsLoadingDetails(true);
      // API에서 상세 답안 이력 조회
      const details = await resultApi.getResultDetails(result.id);
      setAnswerDetails(details);

      // 문제 정보와 결합 (testQuestions가 있으면 사용, 없으면 API에서 가져오기)
      if (testQuestions && testQuestions.length > 0) {
        const combined = testQuestions.map(q => ({
          ...q,
          user_answer: details.find(d => d.question_id === q.id)?.user_answer || '',
          is_correct: details.find(d => d.question_id === q.id)?.is_correct ?? false,
          time_spent_seconds: details.find(d => d.question_id === q.id)?.time_spent_seconds || 0
        }));
        setQuestionsWithAnswers(combined);
      }
    } catch (err) {
      console.error('Failed to load answer details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const wrongQuestions = questionsWithAnswers.filter(q => !q.is_correct);
  const correctQuestions = questionsWithAnswers.filter(q => q.is_correct);

  const getPerformanceColor = (level: string) => {
    switch (level) {
      case 'excellent':
        return 'var(--color-success)';
      case 'good':
        return 'var(--color-warning)';
      case 'needs_improvement':
        return 'var(--color-danger)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const getPerformanceLabel = (level: string) => {
    switch (level) {
      case 'excellent':
        return '우수';
      case 'good':
        return '양호';
      case 'needs_improvement':
        return '개선 필요';
      default:
        return level;
    }
  };

  const getQuestionTypeLabel = (type: string): string => {
    switch (type) {
      case 'vocabulary': return '어휘';
      case 'grammar': return '문법';
      case 'reading': return '독해';
      case 'listening': return '청해';
      default: return type;
    }
  };

  const toggleQuestionExpansion = (questionId: number) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const tabs = [
    {
      id: 'overview',
      label: '요약',
      badge: undefined
    },
    {
      id: 'wrong-answers',
      label: '틀린 문제',
      badge: wrongQuestions.length > 0 ? wrongQuestions.length : undefined
    }
  ];

  return (
    <div className="result-ui" data-testid="result-ui">
      {/* Header */}
      <div className="result-ui__header">
        <div className="result-ui__header-content">
          <h1 className="result-ui__title">테스트 결과</h1>
          <Badge
            variant={result.is_passed ? 'success' : 'danger'}
            size="lg"
            data-testid="result-status"
          >
            {result.is_passed ? '합격' : '불합격'}
          </Badge>
        </div>
      </div>

      {/* Score Card */}
      <Card className="result-ui__score-card" variant="elevated" padding="lg">
        <div className="result-ui__score-circle">
          <div className="result-ui__score-value" data-testid="score-value">
            {result.score.toFixed(1)}
          </div>
          <div className="result-ui__score-label">점</div>
          <Progress
            value={result.accuracy_percentage}
            variant={result.is_passed ? 'success' : 'danger'}
            size="lg"
            showLabel={false}
            className="result-ui__score-progress"
          />
        </div>
        <div className="result-ui__score-details">
          <div className="result-ui__score-item">
            <span className="result-ui__score-item-label">정답률</span>
            <span className="result-ui__score-item-value">
              {result.accuracy_percentage.toFixed(1)}%
            </span>
          </div>
          <div className="result-ui__score-item">
            <span className="result-ui__score-item-label">정답 수</span>
            <span className="result-ui__score-item-value">
              {result.correct_answers_count} / {result.total_questions_count}
            </span>
          </div>
          <div className="result-ui__score-item">
            <span className="result-ui__score-item-label">소요 시간</span>
            <span className="result-ui__score-item-value">
              {result.time_taken_minutes}분
            </span>
          </div>
        </div>
      </Card>

      {/* Performance Summary */}
      <div className="result-ui__performance-grid">
        <Card className="result-ui__performance-card" variant="elevated" padding="md">
          <p className="result-ui__performance-label">성취도</p>
          <p
            className="result-ui__performance-value"
            style={{ color: getPerformanceColor(result.performance_level) }}
            data-testid="performance-level"
          >
            {getPerformanceLabel(result.performance_level)}
          </p>
        </Card>
        <Card className="result-ui__performance-card" variant="elevated" padding="md">
          <p className="result-ui__performance-label">평가 레벨</p>
          <p className="result-ui__performance-value" data-testid="assessed-level">
            {result.assessed_level}
          </p>
        </Card>
        <Card className="result-ui__performance-card" variant="elevated" padding="md">
          <p className="result-ui__performance-label">추천 레벨</p>
          <p className="result-ui__performance-value" data-testid="recommended-level">
            {result.recommended_level}
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTabId={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as 'overview' | 'wrong-answers')}
        variant="pills"
        fullWidth
      />

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="result-ui__tab-content">
          {/* Question Type Analysis */}
          {Object.keys(result.question_type_analysis).length > 0 && (
            <Card className="result-ui__analysis-card" variant="elevated" padding="lg">
              <h2 className="result-ui__section-title">문제 유형별 분석</h2>
              <div className="result-ui__analysis-grid">
                {Object.entries(result.question_type_analysis).map(([type, data]) => {
                  const percentage = data.total > 0 ? (data.correct / data.total) * 100 : 0;
                  return (
                    <div key={type} className="result-ui__analysis-item">
                      <div className="result-ui__analysis-header">
                        <span className="result-ui__analysis-type">
                          {getQuestionTypeLabel(type)}
                        </span>
                        <span className="result-ui__analysis-percentage">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <Progress
                        value={percentage}
                        variant={percentage >= 70 ? 'success' : percentage >= 50 ? 'warning' : 'danger'}
                        size="md"
                        showLabel={false}
                        data-testid={`analysis-bar-${type}`}
                      />
                      <div className="result-ui__analysis-details">
                        {data.correct} / {data.total} 정답
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Feedback */}
          <Card className="result-ui__feedback-card" variant="elevated" padding="lg">
            <h2 className="result-ui__section-title">피드백</h2>
            <div className="result-ui__feedback-content">
              {result.feedback.overall_performance && (
                <div className="result-ui__feedback-item">
                  <h3 className="result-ui__feedback-title">전체 성취도</h3>
                  <p className="result-ui__feedback-text">{result.feedback.overall_performance}</p>
                </div>
              )}
              {result.feedback.time_management && (
                <div className="result-ui__feedback-item">
                  <h3 className="result-ui__feedback-title">시간 관리</h3>
                  <p className="result-ui__feedback-text">{result.feedback.time_management}</p>
                </div>
              )}
              {result.feedback.level_recommendation && (
                <div className="result-ui__feedback-item">
                  <h3 className="result-ui__feedback-title">레벨 추천</h3>
                  <p className="result-ui__feedback-text">{result.feedback.level_recommendation}</p>
                </div>
              )}
              {result.feedback.study_suggestions && (
                <div className="result-ui__feedback-item">
                  <h3 className="result-ui__feedback-title">학습 제안</h3>
                  <p className="result-ui__feedback-text">{result.feedback.study_suggestions}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Wrong Answers Tab */}
      {activeTab === 'wrong-answers' && (
        <div className="result-ui__tab-content">
          {isLoadingDetails ? (
            <Card variant="outlined" padding="lg">
              <p>답안 상세 정보를 불러오는 중...</p>
            </Card>
          ) : wrongQuestions.length === 0 ? (
            <Card className="result-ui__empty" variant="outlined" padding="lg">
              <div className="result-ui__empty-content">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="result-ui__empty-icon">
                  <path
                    d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <h3 className="result-ui__empty-title">모든 문제를 맞추셨습니다!</h3>
                <p className="result-ui__empty-description">
                  훌륭합니다! 틀린 문제가 없습니다.
                </p>
              </div>
            </Card>
          ) : (
            <>
              <Card className="result-ui__wrong-summary" variant="elevated" padding="md">
                <div className="result-ui__wrong-summary-content">
                  <div>
                    <h3 className="result-ui__wrong-summary-title">틀린 문제 {wrongQuestions.length}개</h3>
                    <p className="result-ui__wrong-summary-description">
                      아래 문제들을 복습하여 실력을 향상시키세요.
                    </p>
                  </div>
                  <Badge variant="danger" size="lg">
                    {wrongQuestions.length}개
                  </Badge>
                </div>
              </Card>

              <div className="result-ui__wrong-questions">
                {wrongQuestions.map((question) => {
                  const isExpanded = expandedQuestions.has(question.id);
                  const userAnswerIndex = question.choices.findIndex(c => c === question.user_answer);
                  const correctAnswerIndex = question.choices.findIndex(c => c === question.correct_answer);

                  return (
                    <Card
                      key={question.id}
                      className="result-ui__question-card"
                      variant="elevated"
                      padding="md"
                    >
                      <div className="result-ui__question-header">
                        <div className="result-ui__question-meta">
                          <Badge variant="primary" size="sm">
                            {getQuestionTypeLabel(question.question_type)}
                          </Badge>
                          <Badge variant="danger" size="sm">오답</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleQuestionExpansion(question.id)}
                        >
                          {isExpanded ? '해설 숨기기' : '해설 보기'}
                        </Button>
                      </div>

                      <div className="result-ui__question-content">
                        <p className="result-ui__question-text">{question.question_text}</p>

                        {question.choices && question.choices.length > 0 && (
                          <div className="result-ui__question-choices">
                            {question.choices.map((choice, index) => {
                              const isUserAnswer = index === userAnswerIndex;
                              const isCorrectAnswer = index === correctAnswerIndex;

                              return (
                                <div
                                  key={index}
                                  className={`result-ui__choice ${
                                    isCorrectAnswer
                                      ? 'result-ui__choice--correct'
                                      : isUserAnswer
                                      ? 'result-ui__choice--wrong'
                                      : ''
                                  }`}
                                >
                                  <span className="result-ui__choice-label">
                                    {String.fromCharCode(65 + index)}.
                                  </span>
                                  <span className="result-ui__choice-text">{choice}</span>
                                  {isCorrectAnswer && (
                                    <Badge variant="success" size="sm">정답</Badge>
                                  )}
                                  {isUserAnswer && !isCorrectAnswer && (
                                    <Badge variant="danger" size="sm">내 답안</Badge>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {isExpanded && question.explanation && (
                          <div className="result-ui__explanation">
                            <h4 className="result-ui__explanation-title">해설</h4>
                            <p className="result-ui__explanation-text">{question.explanation}</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <Card className="result-ui__actions" variant="elevated" padding="lg">
        <div className="result-ui__actions-content">
          <div className="result-ui__actions-info">
            <p className="result-ui__actions-text">
              {wrongQuestions.length > 0
                ? `틀린 문제 ${wrongQuestions.length}개가 오답 노트에 자동으로 저장되었습니다.`
                : '모든 문제를 맞추셨습니다!'}
            </p>
          </div>
          <div className="result-ui__actions-buttons">
            {onViewWrongAnswers && wrongQuestions.length > 0 && (
              <Button variant="outline" onClick={onViewWrongAnswers}>
                오답 노트 보기
              </Button>
            )}
            {onRetryWrongOnly && wrongQuestions.length > 0 && (
              <Button variant="primary" onClick={onRetryWrongOnly}>
                틀린 문제만 다시 풀기
              </Button>
            )}
            {onRetry && (
              <Button variant="primary" onClick={onRetry}>
                전체 다시 풀기
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ResultUI;
