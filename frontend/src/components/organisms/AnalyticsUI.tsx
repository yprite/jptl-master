import React, { useState, useEffect } from 'react';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { Progress } from '../atoms/Progress';
import { UserPerformance } from '../../types/api';
import ShareableReportCard, { ReportCardData } from './ShareableReportCard';
import './AnalyticsUI.css';

export interface WeeklyDelta {
  type: string;
  current: number;
  previous: number;
  delta: number; // 변화량 (양수면 증가, 음수면 감소)
  deltaPercentage: number; // 변화율 (%)
}

export interface RecommendedStudy {
  id: string;
  title: string;
  description: string;
  type: 'vocabulary' | 'grammar' | 'reading' | 'listening';
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

export interface WeakArea {
  type: string;
  accuracy: number;
  totalQuestions: number;
  description?: string;
}

interface AnalyticsUIProps {
  performance: UserPerformance;
  previousPerformance?: UserPerformance; // 이전 주 데이터 (주간 변화 계산용)
  onStartStudy?: (type: string) => void;
  onViewWrongAnswers?: () => void;
}

const AnalyticsUI: React.FC<AnalyticsUIProps> = ({
  performance,
  previousPerformance,
  onStartStudy,
  onViewWrongAnswers
}) => {
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
  const [weeklyDeltas, setWeeklyDeltas] = useState<WeeklyDelta[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedStudy[]>([]);
  const [showShareCard, setShowShareCard] = useState(false);
  const [reportCardData, setReportCardData] = useState<ReportCardData | null>(null);

  useEffect(() => {
    // 약점 TOP3 계산
    calculateWeakAreas();
    // 주간 변화 계산
    calculateWeeklyDeltas();
    // 추천 학습 생성
    generateRecommendations();
  }, [performance, previousPerformance]);

  const calculateWeakAreas = () => {
    const areas: WeakArea[] = Object.entries(performance.type_performance || {})
      .map(([type, data]) => ({
        type: getTypeLabel(type),
        accuracy: data.accuracy,
        totalQuestions: (data as any).total || 0,
        description: performance.weaknesses?.[type]
      }))
      .sort((a, b) => a.accuracy - b.accuracy) // 정확도 낮은 순으로 정렬
      .slice(0, 3); // TOP3

    setWeakAreas(areas);
  };

  const calculateWeeklyDeltas = () => {
    if (!previousPerformance) {
      setWeeklyDeltas([]);
      return;
    }

    const deltas: WeeklyDelta[] = Object.keys(performance.type_performance || {})
      .map(type => {
        const current = performance.type_performance[type]?.accuracy || 0;
        const previous = previousPerformance.type_performance[type]?.accuracy || 0;
        const delta = current - previous;
        const deltaPercentage = previous > 0 ? ((delta / previous) * 100) : (current > 0 ? 100 : 0);

        return {
          type: getTypeLabel(type),
          current,
          previous,
          delta,
          deltaPercentage
        };
      })
      .sort((a, b) => Math.abs(b.deltaPercentage) - Math.abs(a.deltaPercentage)); // 변화가 큰 순으로 정렬

    setWeeklyDeltas(deltas);
  };

  const generateRecommendations = () => {
    const recs: RecommendedStudy[] = [];

    // 약점 기반 추천
    weakAreas.forEach((area, index) => {
      if (recs.length < 3) {
        recs.push({
          id: `weak-${area.type}-${index}`,
          title: `${area.type} 집중 학습`,
          description: `${area.type} 영역의 정확도가 ${area.accuracy.toFixed(1)}%로 낮습니다.`,
          type: getTypeFromLabel(area.type) as any,
          reason: area.description || `${area.type} 영역을 집중적으로 학습하세요.`,
          priority: index === 0 ? 'high' : index === 1 ? 'medium' : 'low'
        });
      }
    });

    // 정확도가 낮은 영역 추가 추천
    const lowAccuracyTypes = Object.entries(performance.type_performance || {})
      .filter(([_, data]) => data.accuracy < 70)
      .sort(([_, a], [__, b]) => a.accuracy - b.accuracy)
      .slice(0, 3 - recs.length);

    lowAccuracyTypes.forEach(([type, data]) => {
      if (recs.length < 3 && !recs.some(r => r.type === getTypeFromLabel(type))) {
        recs.push({
          id: `low-${type}`,
          title: `${getTypeLabel(type)} 보완 학습`,
          description: `${getTypeLabel(type)} 영역의 정확도가 ${data.accuracy.toFixed(1)}%입니다.`,
          type: getTypeFromLabel(type) as any,
          reason: `${getTypeLabel(type)} 영역을 더 연습하세요.`,
          priority: 'medium'
        });
      }
    });

    // 추천이 3개 미만이면 일반 추천 추가
    while (recs.length < 3) {
      const types = ['vocabulary', 'grammar', 'reading', 'listening'];
      const remainingTypes = types.filter(t => !recs.some(r => r.type === t));
      if (remainingTypes.length === 0) break;

      const type = remainingTypes[0];
      recs.push({
        id: `general-${type}`,
        title: `${getTypeLabel(type)} 종합 학습`,
        description: `${getTypeLabel(type)} 영역을 종합적으로 학습하세요.`,
        type: type as any,
        reason: '균형잡힌 학습을 위해 추천합니다.',
        priority: 'low'
      });
    }

    setRecommendations(recs.slice(0, 3));
  };

  const getTypeLabel = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'vocabulary': return '어휘';
      case 'grammar': return '문법';
      case 'reading': return '독해';
      case 'listening': return '청해';
      default: return type;
    }
  };

  const getTypeFromLabel = (label: string): string => {
    switch (label.toLowerCase()) {
      case '어휘': return 'vocabulary';
      case '문법': return 'grammar';
      case '독해': return 'reading';
      case '청해': return 'listening';
      default: return label.toLowerCase();
    }
  };

  const getPriorityColor = (priority: string): 'danger' | 'warning' | 'primary' => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'primary';
      default: return 'primary';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleShareReport = () => {
    // 리포트 카드 데이터 생성
    const cardData: ReportCardData = {
      userName: '사용자', // TODO: 실제 사용자 이름 가져오기
      level: Object.keys(performance.level_progression || {})[0] || 'N5',
      score: Object.values(performance.level_progression || {})[0]
        ? (Object.values(performance.level_progression)[0] as any).average_score || 0
        : 0,
      accuracy: Object.values(performance.type_performance || {})[0]?.accuracy || 0,
      totalQuestions: Object.values(performance.type_performance || {}).reduce(
        (sum, data) => sum + ((data as any).total || 0),
        0
      ),
      correctAnswers: Math.round(
        Object.values(performance.type_performance || {}).reduce(
          (sum, data) => sum + ((data as any).total || 0) * (data.accuracy / 100),
          0
        )
      ),
      studyStreak: 0, // TODO: 실제 연속 학습일 가져오기
      totalStudyDays: 0, // TODO: 실제 총 학습일 가져오기
      weakAreas: weakAreas.map(area => ({
        type: area.type,
        accuracy: area.accuracy
      })),
      achievements: [], // TODO: 실제 달성 배지 가져오기
      period: {
        start: performance.analysis_period_start,
        end: performance.analysis_period_end
      }
    };

    setReportCardData(cardData);
    setShowShareCard(true);
  };

  return (
    <div className="analytics-ui">
      {/* Header */}
      <div className="analytics-header">
        <h1 className="analytics-title">성능 분석</h1>
        <div className="analytics-period">
          <span>
            {formatDate(performance.analysis_period_start)} ~ {formatDate(performance.analysis_period_end)}
          </span>
        </div>
      </div>

      {/* 약점 TOP3 */}
      <Card className="analytics-section" variant="elevated" padding="lg">
        <h2 className="analytics-section-title">약점 영역 TOP3</h2>
        {weakAreas.length === 0 ? (
          <div className="analytics-empty">
            <p>약점 데이터가 없습니다.</p>
          </div>
        ) : (
          <div className="analytics-weak-areas">
            {weakAreas.map((area, index) => (
              <Card
                key={index}
                className="analytics-weak-area-card"
                variant="outlined"
                padding="md"
              >
                <div className="analytics-weak-area-header">
                  <Badge variant="danger" size="lg">
                    {index + 1}위
                  </Badge>
                  <h3 className="analytics-weak-area-title">{area.type}</h3>
                </div>
                <div className="analytics-weak-area-content">
                  <div className="analytics-weak-area-accuracy">
                    <span className="analytics-weak-area-value">{area.accuracy.toFixed(1)}%</span>
                    <span className="analytics-weak-area-label">정확도</span>
                  </div>
                  <Progress
                    value={area.accuracy}
                    variant={area.accuracy < 50 ? 'danger' : area.accuracy < 70 ? 'warning' : 'success'}
                    size="md"
                    showLabel={false}
                  />
                  {area.description && (
                    <p className="analytics-weak-area-description">{area.description}</p>
                  )}
                  {area.totalQuestions > 0 && (
                    <p className="analytics-weak-area-count">
                      총 {area.totalQuestions}문제 중 {Math.round((area.totalQuestions * area.accuracy) / 100)}문제 정답
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* 파트별 정확도 */}
      <Card className="analytics-section" variant="elevated" padding="lg">
        <h2 className="analytics-section-title">파트별 정확도</h2>
        <div className="analytics-part-accuracy">
          {Object.entries(performance.type_performance || {}).map(([type, data]) => {
            const accuracy = data.accuracy;
            return (
              <div key={type} className="analytics-part-item">
                <div className="analytics-part-header">
                  <span className="analytics-part-label">{getTypeLabel(type)}</span>
                  <span className="analytics-part-value">{accuracy.toFixed(1)}%</span>
                </div>
                <Progress
                  value={accuracy}
                  variant={accuracy >= 80 ? 'success' : accuracy >= 60 ? 'warning' : 'danger'}
                  size="lg"
                  showLabel={false}
                />
                {(data as any).total && (
                  <div className="analytics-part-details">
                    총 {(data as any).total}문제
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* 주간 변화 */}
      {weeklyDeltas.length > 0 && (
        <Card className="analytics-section" variant="elevated" padding="lg">
          <h2 className="analytics-section-title">주간 변화</h2>
          <div className="analytics-weekly-deltas">
            {weeklyDeltas.map((delta, index) => (
              <div key={index} className="analytics-delta-item">
                <div className="analytics-delta-header">
                  <span className="analytics-delta-label">{delta.type}</span>
                  <Badge
                    variant={delta.delta >= 0 ? 'success' : 'danger'}
                    size="sm"
                  >
                    {delta.delta >= 0 ? '+' : ''}{delta.deltaPercentage.toFixed(1)}%
                  </Badge>
                </div>
                <div className="analytics-delta-content">
                  <div className="analytics-delta-values">
                    <div className="analytics-delta-value">
                      <span className="analytics-delta-value-label">이번 주</span>
                      <span className="analytics-delta-value-number">{delta.current.toFixed(1)}%</span>
                    </div>
                    <div className="analytics-delta-value">
                      <span className="analytics-delta-value-label">지난 주</span>
                      <span className="analytics-delta-value-number">{delta.previous.toFixed(1)}%</span>
                    </div>
                  </div>
                  <Progress
                    value={delta.current}
                    variant={delta.delta >= 0 ? 'success' : 'danger'}
                    size="md"
                    showLabel={false}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 다음 추천 학습 */}
      <Card className="analytics-section" variant="elevated" padding="lg">
        <h2 className="analytics-section-title">다음 추천 학습</h2>
        <div className="analytics-recommendations">
          {recommendations.map((rec) => (
            <Card
              key={rec.id}
              className="analytics-recommendation-card"
              variant="outlined"
              padding="md"
            >
              <div className="analytics-recommendation-header">
                <Badge variant={getPriorityColor(rec.priority)} size="sm">
                  {rec.priority === 'high' ? '높음' : rec.priority === 'medium' ? '보통' : '낮음'}
                </Badge>
                <h3 className="analytics-recommendation-title">{rec.title}</h3>
              </div>
              <p className="analytics-recommendation-description">{rec.description}</p>
              <p className="analytics-recommendation-reason">{rec.reason}</p>
              {onStartStudy && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onStartStudy(rec.type)}
                  className="analytics-recommendation-button"
                >
                  학습 시작하기
                </Button>
              )}
            </Card>
          ))}
        </div>
      </Card>

      {/* 액션 버튼 */}
      <div className="analytics-actions">
        <Button variant="primary" onClick={handleShareReport}>
          리포트 카드 공유하기
        </Button>
        {onViewWrongAnswers && (
          <Button variant="outline" onClick={onViewWrongAnswers}>
            오답 노트 보기
          </Button>
        )}
      </div>

      {/* 공유 가능한 리포트 카드 모달 */}
      {showShareCard && reportCardData && (
        <ShareableReportCard
          data={reportCardData}
          onClose={() => {
            setShowShareCard(false);
            setReportCardData(null);
          }}
        />
      )}
    </div>
  );
};

export default AnalyticsUI;

