import React, { useState } from 'react';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { Progress } from '../atoms/Progress';
import { Input } from '../atoms/Input';
import './OnboardingUI.css';

export interface OnboardingData {
  targetExamDate: string; // YYYY-MM-DD
  dailyStudyMinutes: number;
  currentLevel: 'beginner' | 'elementary' | 'intermediate' | 'advanced';
}

interface OnboardingUIProps {
  onComplete: (data: OnboardingData) => void;
}

type OnboardingStep = 1 | 2 | 3;

const OnboardingUI: React.FC<OnboardingUIProps> = ({ onComplete }) => {
  const [step, setStep] = useState<OnboardingStep>(1);
  const [targetExamDate, setTargetExamDate] = useState<string>('');
  const [dailyStudyMinutes, setDailyStudyMinutes] = useState<number>(30);
  const [currentLevel, setCurrentLevel] = useState<OnboardingData['currentLevel']>('beginner');

  const progress = (step / 3) * 100;

  const handleNext = () => {
    if (step < 3) {
      setStep((step + 1) as OnboardingStep);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep((step - 1) as OnboardingStep);
    }
  };

  const handleComplete = () => {
    if (!targetExamDate) {
      alert('목표 시험일을 선택해주세요.');
      return;
    }

    onComplete({
      targetExamDate,
      dailyStudyMinutes,
      currentLevel
    });
  };

  const getLevelLabel = (level: OnboardingData['currentLevel']): string => {
    switch (level) {
      case 'beginner': return '초급 (N5)';
      case 'elementary': return '기초 (N4)';
      case 'intermediate': return '중급 (N3)';
      case 'advanced': return '고급 (N2-N1)';
      default: return level;
    }
  };

  const getLevelDescription = (level: OnboardingData['currentLevel']): string => {
    switch (level) {
      case 'beginner': return '일본어를 처음 배우시는 분';
      case 'elementary': return '기본 문법과 어휘를 알고 계신 분';
      case 'intermediate': return '일상 대화가 가능한 수준';
      case 'advanced': return '비즈니스나 고급 독해가 가능한 수준';
      default: return '';
    }
  };

  // Step 1: 목표 시험일
  if (step === 1) {
    const today = new Date().toISOString().split('T')[0];
    const minDate = today;
    const maxDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 1년 후

    return (
      <div className="onboarding-ui">
        <div className="onboarding-header">
          <Progress value={progress} variant="primary" size="lg" showLabel={false} />
          <span className="onboarding-step">1 / 3</span>
        </div>

        <Card className="onboarding-card" variant="elevated" padding="lg">
          <h1 className="onboarding-title">목표 시험일을 선택해주세요</h1>
          <p className="onboarding-description">
            목표 시험일을 설정하면 맞춤형 학습 계획을 제공합니다.
          </p>

          <div className="onboarding-content">
            <Input
              type="date"
              label="목표 시험일"
              value={targetExamDate}
              onChange={(e) => setTargetExamDate(e.target.value)}
              min={minDate}
              max={maxDate}
              fullWidth
              size="lg"
            />

            {targetExamDate && (
              <div className="onboarding-preview">
                <p className="preview-text">
                  목표까지 <strong>{Math.ceil((new Date(targetExamDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}일</strong> 남았습니다.
                </p>
              </div>
            )}
          </div>
        </Card>

        <div className="onboarding-actions">
          <Button
            variant="primary"
            size="lg"
            onClick={handleNext}
            disabled={!targetExamDate}
            fullWidth
          >
            다음
          </Button>
        </div>
      </div>
    );
  }

  // Step 2: 하루 공부 가능 시간
  if (step === 2) {
    const timeOptions = [
      { value: 15, label: '15분', description: '짧은 시간 집중 학습' },
      { value: 30, label: '30분', description: '일반적인 학습 시간' },
      { value: 60, label: '1시간', description: '충분한 학습 시간' },
      { value: 90, label: '1.5시간', description: '집중 학습' },
      { value: 120, label: '2시간', description: '완전 집중 학습' }
    ];

    return (
      <div className="onboarding-ui">
        <div className="onboarding-header">
          <Progress value={progress} variant="primary" size="lg" showLabel={false} />
          <span className="onboarding-step">2 / 3</span>
        </div>

        <Card className="onboarding-card" variant="elevated" padding="lg">
          <h1 className="onboarding-title">하루에 공부할 수 있는 시간은?</h1>
          <p className="onboarding-description">
            매일 학습할 수 있는 시간을 선택해주세요. 이에 맞춰 학습 계획을 조정합니다.
          </p>

          <div className="onboarding-content">
            <div className="onboarding-options">
              {timeOptions.map((option) => (
                <button
                  key={option.value}
                  className={`onboarding-option ${dailyStudyMinutes === option.value ? 'selected' : ''}`}
                  onClick={() => setDailyStudyMinutes(option.value)}
                >
                  <div className="option-label">{option.label}</div>
                  <div className="option-description">{option.description}</div>
                </button>
              ))}
            </div>
          </div>
        </Card>

        <div className="onboarding-actions">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePrevious}
          >
            이전
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleNext}
            fullWidth
          >
            다음
          </Button>
        </div>
      </div>
    );
  }

  // Step 3: 현재 수준
  if (step === 3) {
    const levels: Array<{ value: OnboardingData['currentLevel']; label: string; description: string }> = [
      { value: 'beginner', label: '초급 (N5)', description: '일본어를 처음 배우시는 분' },
      { value: 'elementary', label: '기초 (N4)', description: '기본 문법과 어휘를 알고 계신 분' },
      { value: 'intermediate', label: '중급 (N3)', description: '일상 대화가 가능한 수준' },
      { value: 'advanced', label: '고급 (N2-N1)', description: '비즈니스나 고급 독해가 가능한 수준' }
    ];

    return (
      <div className="onboarding-ui">
        <div className="onboarding-header">
          <Progress value={progress} variant="primary" size="lg" showLabel={false} />
          <span className="onboarding-step">3 / 3</span>
        </div>

        <Card className="onboarding-card" variant="elevated" padding="lg">
          <h1 className="onboarding-title">현재 일본어 수준은?</h1>
          <p className="onboarding-description">
            현재 수준을 선택하면 적절한 학습 콘텐츠를 추천해드립니다.
          </p>

          <div className="onboarding-content">
            <div className="onboarding-options">
              {levels.map((level) => (
                <button
                  key={level.value}
                  className={`onboarding-option ${currentLevel === level.value ? 'selected' : ''}`}
                  onClick={() => setCurrentLevel(level.value)}
                >
                  <div className="option-label">{level.label}</div>
                  <div className="option-description">{level.description}</div>
                </button>
              ))}
            </div>
          </div>
        </Card>

        <div className="onboarding-actions">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePrevious}
          >
            이전
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleComplete}
            fullWidth
          >
            시작하기
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default OnboardingUI;

