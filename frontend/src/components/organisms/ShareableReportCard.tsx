import React, { useRef, useState } from 'react';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { Progress } from '../atoms/Progress';
import { Modal } from '../atoms/Modal';
import './ShareableReportCard.css';

export interface ReportCardData {
  userName: string;
  level: string;
  score: number;
  accuracy: number;
  totalQuestions: number;
  correctAnswers: number;
  studyStreak: number;
  totalStudyDays: number;
  weakAreas: Array<{
    type: string;
    accuracy: number;
  }>;
  achievements: string[];
  period: {
    start: string;
    end: string;
  };
}

interface ShareableReportCardProps {
  data: ReportCardData;
  onClose?: () => void;
}

const ShareableReportCard: React.FC<ShareableReportCardProps> = ({
  data,
  onClose
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
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

  const getTypeColor = (type: string): 'primary' | 'success' | 'warning' | 'danger' => {
    switch (type.toLowerCase()) {
      case 'vocabulary': return 'primary';
      case 'grammar': return 'success';
      case 'reading': return 'warning';
      case 'listening': return 'danger';
      default: return 'primary';
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;

    setIsSharing(true);
    setShareError(null);

    try {
      // Canvas를 사용하여 이미지 생성
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context를 가져올 수 없습니다.');
      }

      // 카드 크기 설정
      const width = 800;
      const height = 1200;
      canvas.width = width;
      canvas.height = height;

      // 배경 그리기
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // 그라데이션 배경
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, 200);

      // 제목
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('JLPT 학습 리포트', width / 2, 80);

      // 사용자 정보
      ctx.font = '32px sans-serif';
      ctx.fillText(`${data.userName}님의 학습 성과`, width / 2, 140);

      // 메인 카드 영역
      const cardY = 250;
      ctx.fillStyle = '#f9fafb';
      ctx.fillRect(40, cardY, width - 80, height - cardY - 40);

      // 점수 표시
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 72px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${data.score.toFixed(1)}점`, width / 2, cardY + 120);

      ctx.font = '24px sans-serif';
      ctx.fillStyle = '#6b7280';
      ctx.fillText(`정답률 ${data.accuracy.toFixed(1)}%`, width / 2, cardY + 160);
      ctx.fillText(`${data.correctAnswers} / ${data.totalQuestions} 문제 정답`, width / 2, cardY + 190);

      // 통계 정보
      let yPos = cardY + 280;
      ctx.font = 'bold 28px sans-serif';
      ctx.fillStyle = '#111827';
      ctx.textAlign = 'left';
      ctx.fillText('학습 통계', 80, yPos);

      yPos += 50;
      ctx.font = '24px sans-serif';
      ctx.fillStyle = '#6b7280';
      ctx.fillText(`연속 학습: ${data.studyStreak}일`, 80, yPos);
      yPos += 40;
      ctx.fillText(`총 학습일: ${data.totalStudyDays}일`, 80, yPos);
      yPos += 40;
      ctx.fillText(`레벨: ${data.level}`, 80, yPos);

      // 약점 영역
      yPos += 60;
      ctx.font = 'bold 28px sans-serif';
      ctx.fillStyle = '#111827';
      ctx.fillText('약점 영역', 80, yPos);

      yPos += 50;
      data.weakAreas.forEach((area, index) => {
        ctx.font = '24px sans-serif';
        ctx.fillStyle = '#6b7280';
        ctx.fillText(`${index + 1}. ${getTypeLabel(area.type)}: ${area.accuracy.toFixed(1)}%`, 80, yPos);
        yPos += 40;
      });

      // 기간
      yPos += 40;
      ctx.font = '20px sans-serif';
      ctx.fillStyle = '#9ca3af';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${formatDate(data.period.start)} ~ ${formatDate(data.period.end)}`,
        width / 2,
        yPos
      );

      // Canvas를 Blob으로 변환
      canvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error('이미지 생성에 실패했습니다.');
        }

        const file = new File([blob], 'report-card.png', { type: 'image/png' });

        // Web Share API 사용
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: `${data.userName}님의 JLPT 학습 리포트`,
              text: `JLPT ${data.level} 학습 리포트 - 점수: ${data.score.toFixed(1)}점, 정답률: ${data.accuracy.toFixed(1)}%`,
              files: [file]
            });
          } catch (err: any) {
            if (err.name !== 'AbortError') {
              // 사용자가 취소한 경우가 아니면 fallback 사용
              fallbackShare(blob);
            }
          }
        } else {
          // Web Share API를 지원하지 않으면 fallback 사용
          fallbackShare(blob);
        }
      }, 'image/png');
    } catch (err: any) {
      console.error('Share error:', err);
      setShareError(err.message || '공유 중 오류가 발생했습니다.');
    } finally {
      setIsSharing(false);
    }
  };

  const fallbackShare = (blob: Blob) => {
    // 다운로드 링크 생성
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jlpt-report-${data.userName}-${new Date().toISOString().split('T')[0]}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;

    setIsSharing(true);
    setShareError(null);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context를 가져올 수 없습니다.');
      }

      const width = 800;
      const height = 1200;
      canvas.width = width;
      canvas.height = height;

      // 배경
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // 그라데이션 배경
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, 200);

      // 제목
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('JLPT 학습 리포트', width / 2, 80);

      // 사용자 정보
      ctx.font = '32px sans-serif';
      ctx.fillText(`${data.userName}님의 학습 성과`, width / 2, 140);

      // 메인 카드 영역
      const cardY = 250;
      ctx.fillStyle = '#f9fafb';
      ctx.fillRect(40, cardY, width - 80, height - cardY - 40);

      // 점수 표시
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 72px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${data.score.toFixed(1)}점`, width / 2, cardY + 120);

      ctx.font = '24px sans-serif';
      ctx.fillStyle = '#6b7280';
      ctx.fillText(`정답률 ${data.accuracy.toFixed(1)}%`, width / 2, cardY + 160);
      ctx.fillText(`${data.correctAnswers} / ${data.totalQuestions} 문제 정답`, width / 2, cardY + 190);

      // 통계 정보
      let yPos = cardY + 280;
      ctx.font = 'bold 28px sans-serif';
      ctx.fillStyle = '#111827';
      ctx.textAlign = 'left';
      ctx.fillText('학습 통계', 80, yPos);

      yPos += 50;
      ctx.font = '24px sans-serif';
      ctx.fillStyle = '#6b7280';
      ctx.fillText(`연속 학습: ${data.studyStreak}일`, 80, yPos);
      yPos += 40;
      ctx.fillText(`총 학습일: ${data.totalStudyDays}일`, 80, yPos);
      yPos += 40;
      ctx.fillText(`레벨: ${data.level}`, 80, yPos);

      // 약점 영역
      yPos += 60;
      ctx.font = 'bold 28px sans-serif';
      ctx.fillStyle = '#111827';
      ctx.fillText('약점 영역', 80, yPos);

      yPos += 50;
      data.weakAreas.forEach((area, index) => {
        ctx.font = '24px sans-serif';
        ctx.fillStyle = '#6b7280';
        ctx.fillText(`${index + 1}. ${getTypeLabel(area.type)}: ${area.accuracy.toFixed(1)}%`, 80, yPos);
        yPos += 40;
      });

      // 기간
      yPos += 40;
      ctx.font = '20px sans-serif';
      ctx.fillStyle = '#9ca3af';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${formatDate(data.period.start)} ~ ${formatDate(data.period.end)}`,
        width / 2,
        yPos
      );

      // 다운로드
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jlpt-report-${data.userName}-${new Date().toISOString().split('T')[0]}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (err: any) {
      console.error('Download error:', err);
      setShareError(err.message || '다운로드 중 오류가 발생했습니다.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose || (() => {})}
      title="학습 리포트 공유"
      size="lg"
    >
      <div className="shareable-report-card">
        <div ref={cardRef} className="report-card-preview">
          <div className="report-card-header">
            <h2 className="report-card-title">JLPT 학습 리포트</h2>
            <p className="report-card-subtitle">{data.userName}님의 학습 성과</p>
          </div>

          <div className="report-card-content">
            <div className="report-card-score">
              <div className="report-card-score-value">{data.score.toFixed(1)}점</div>
              <div className="report-card-score-details">
                <span>정답률 {data.accuracy.toFixed(1)}%</span>
                <span>{data.correctAnswers} / {data.totalQuestions} 문제 정답</span>
              </div>
            </div>

            <div className="report-card-stats">
              <h3 className="report-card-section-title">학습 통계</h3>
              <div className="report-card-stat-item">
                <span className="stat-label">연속 학습</span>
                <span className="stat-value">{data.studyStreak}일</span>
              </div>
              <div className="report-card-stat-item">
                <span className="stat-label">총 학습일</span>
                <span className="stat-value">{data.totalStudyDays}일</span>
              </div>
              <div className="report-card-stat-item">
                <span className="stat-label">레벨</span>
                <Badge variant="primary" size="md">{data.level}</Badge>
              </div>
            </div>

            {data.weakAreas.length > 0 && (
              <div className="report-card-weak-areas">
                <h3 className="report-card-section-title">약점 영역</h3>
                {data.weakAreas.map((area, index) => (
                  <div key={index} className="report-card-weak-area-item">
                    <Badge variant={getTypeColor(area.type)} size="sm">
                      {getTypeLabel(area.type)}
                    </Badge>
                    <span className="weak-area-accuracy">{area.accuracy.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            )}

            <div className="report-card-period">
              {formatDate(data.period.start)} ~ {formatDate(data.period.end)}
            </div>
          </div>
        </div>

        {shareError && (
          <div className="report-card-error">
            <p>{shareError}</p>
          </div>
        )}

        <div className="report-card-actions">
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={isSharing}
          >
            이미지 다운로드
          </Button>
          <Button
            variant="primary"
            onClick={handleShare}
            disabled={isSharing}
          >
            {isSharing ? '공유 중...' : '공유하기'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ShareableReportCard;

