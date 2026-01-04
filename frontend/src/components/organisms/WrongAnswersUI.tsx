import React, { useState, useEffect } from 'react';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { Question } from '../../types/api';
import { studyApi } from '../../services/api';
import './WrongAnswersUI.css';

export type FilterType = 'all' | 'vocabulary' | 'grammar' | 'reading' | 'listening';
export type SortType = 'recent' | 'lowest-accuracy' | 'difficulty';

export interface WrongAnswersUIProps {
  questions: Question[];
  onStartStudy: (questionCount: number) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export const WrongAnswersUI: React.FC<WrongAnswersUIProps> = ({
  questions: initialQuestions,
  onStartStudy,
  onBack,
  isLoading = false
}) => {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('recent');
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setQuestions(initialQuestions);
  }, [initialQuestions]);

  // Filter questions
  const filteredQuestions = React.useMemo(() => {
    let filtered = [...questions];

    // Apply type filter
    if (filter !== 'all') {
      filtered = filtered.filter(q => q.question_type === filter);
    }

    // Apply sort
    const sorted = [...filtered];
    switch (sort) {
      case 'recent':
        // Most recent first (assuming questions are already in order)
        break;
      case 'lowest-accuracy':
        // Sort by difficulty (lower difficulty = lower accuracy typically)
        sorted.sort((a, b) => (a.difficulty || 0) - (b.difficulty || 0));
        break;
      case 'difficulty':
        // Sort by difficulty (higher first)
        sorted.sort((a, b) => (b.difficulty || 0) - (a.difficulty || 0));
        break;
    }

    return sorted;
  }, [questions, filter, sort]);

  const toggleExplanation = (questionId: number) => {
    setShowExplanation(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
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

  const getDifficultyLabel = (difficulty?: number): string => {
    if (!difficulty) return 'N/A';
    if (difficulty <= 2) return '쉬움';
    if (difficulty <= 4) return '보통';
    return '어려움';
  };

  const getDifficultyColor = (difficulty?: number): 'success' | 'warning' | 'danger' | 'neutral' => {
    if (!difficulty) return 'neutral';
    if (difficulty <= 2) return 'success';
    if (difficulty <= 4) return 'warning';
    return 'danger';
  };

  if (isLoading) {
    return (
      <div className="wrong-answers">
        <div className="wrong-answers__loading">
          <p>오답 노트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="wrong-answers">
        <div className="wrong-answers__header">
          <Button variant="ghost" onClick={onBack} size="sm">
            ← 뒤로가기
          </Button>
          <h1 className="wrong-answers__title">오답 노트</h1>
        </div>
        <Card className="wrong-answers__empty" variant="outlined" padding="lg">
          <div className="wrong-answers__empty-content">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="wrong-answers__empty-icon">
              <path
                d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h2 className="wrong-answers__empty-title">틀린 문제가 없습니다</h2>
            <p className="wrong-answers__empty-description">
              먼저 테스트를 응시해주세요. 틀린 문제는 자동으로 오답 노트에 저장됩니다.
            </p>
            <Button variant="primary" onClick={() => onBack()}>
              대시보드로 돌아가기
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="wrong-answers">
      <div className="wrong-answers__header">
        <Button variant="ghost" onClick={onBack} size="sm">
          ← 뒤로가기
        </Button>
        <h1 className="wrong-answers__title">오답 노트</h1>
        <Badge variant="danger" size="lg">
          총 {questions.length}개
        </Badge>
      </div>

      {/* Filters and Actions */}
      <Card className="wrong-answers__toolbar" variant="elevated" padding="md">
        <div className="wrong-answers__filters">
          <div className="wrong-answers__filter-group">
            <label className="wrong-answers__filter-label">유형 필터:</label>
            <div className="wrong-answers__filter-buttons">
              {(['all', 'vocabulary', 'grammar', 'reading', 'listening'] as FilterType[]).map((type) => (
                <Button
                  key={type}
                  variant={filter === type ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(type)}
                >
                  {type === 'all' ? '전체' : getQuestionTypeLabel(type)}
                </Button>
              ))}
            </div>
          </div>

          <div className="wrong-answers__filter-group">
            <label className="wrong-answers__filter-label">정렬:</label>
            <div className="wrong-answers__filter-buttons">
              {(['recent', 'lowest-accuracy', 'difficulty'] as SortType[]).map((sortType) => (
                <Button
                  key={sortType}
                  variant={sort === sortType ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSort(sortType)}
                >
                  {sortType === 'recent' ? '최근순' : 
                   sortType === 'lowest-accuracy' ? '정확도 낮은순' : 
                   '난이도순'}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="wrong-answers__actions">
          <Button
            variant="primary"
            onClick={() => onStartStudy(Math.min(filteredQuestions.length, 20))}
          >
            20개로 학습 시작
          </Button>
          <Button
            variant="outline"
            onClick={() => onStartStudy(filteredQuestions.length)}
          >
            전체로 학습 시작
          </Button>
        </div>
      </Card>

      {/* Questions List */}
      <div className="wrong-answers__list">
        {filteredQuestions.length === 0 ? (
          <Card className="wrong-answers__empty-filter" variant="outlined" padding="lg">
            <p>선택한 필터에 맞는 문제가 없습니다.</p>
          </Card>
        ) : (
          filteredQuestions.map((question) => (
            <Card
              key={question.id}
              className="wrong-answers__question-card"
              variant="elevated"
              padding="md"
            >
              <div className="wrong-answers__question-header">
                <div className="wrong-answers__question-meta">
                  <Badge variant="primary" size="sm">
                    {getQuestionTypeLabel(question.question_type)}
                  </Badge>
                  <Badge variant={getDifficultyColor(question.difficulty)} size="sm">
                    {getDifficultyLabel(question.difficulty)}
                  </Badge>
                  {question.level && (
                    <Badge variant="neutral" size="sm">
                      {question.level}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExplanation(question.id)}
                >
                  {showExplanation[question.id] ? '해설 숨기기' : '해설 보기'}
                </Button>
              </div>

              <div className="wrong-answers__question-content">
                <p className="wrong-answers__question-text">{question.question_text}</p>
                
                {question.choices && question.choices.length > 0 && (
                  <div className="wrong-answers__question-choices">
                    {question.choices.map((choice, index) => (
                      <div
                        key={index}
                        className={`wrong-answers__choice ${
                          choice === question.correct_answer
                            ? 'wrong-answers__choice--correct'
                            : ''
                        }`}
                      >
                        <span className="wrong-answers__choice-label">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span className="wrong-answers__choice-text">{choice}</span>
                        {choice === question.correct_answer && (
                          <Badge variant="success" size="sm">정답</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {showExplanation[question.id] && question.explanation && (
                  <div className="wrong-answers__explanation">
                    <h4 className="wrong-answers__explanation-title">해설</h4>
                    <p className="wrong-answers__explanation-text">{question.explanation}</p>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

