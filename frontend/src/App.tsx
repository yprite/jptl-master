import React from 'react';
import './App.css';
import TestUI from './components/organisms/TestUI';
import ResultUI from './components/organisms/ResultUI';
import { Test, Result } from './types/api';

function App() {
  // 예제 데이터 (실제로는 API에서 가져옴)
  const exampleTest: Test = {
    id: 1,
    title: 'N5 진단 테스트',
    level: 'N5',
    status: 'in_progress',
    time_limit_minutes: 30,
    questions: [
      {
        id: 1,
        level: 'N5',
        question_type: 'vocabulary',
        question_text: '「こんにちは」の意味は何ですか？',
        choices: ['안녕하세요', '감사합니다', '실례합니다', '죄송합니다'],
        difficulty: 1,
      },
    ],
  };

  const exampleResult: Result = {
    id: 1,
    test_id: 1,
    user_id: 1,
    score: 85.5,
    assessed_level: 'N5',
    recommended_level: 'N4',
    correct_answers_count: 17,
    total_questions_count: 20,
    time_taken_minutes: 25,
    performance_level: 'excellent',
    is_passed: true,
    accuracy_percentage: 85.5,
    time_efficiency: 'efficient',
    level_progression: 'level_up',
    question_type_analysis: {
      vocabulary: { correct: 5, total: 6 },
      grammar: { correct: 6, total: 7 },
    },
    feedback: {
      overall_performance: 'Outstanding performance!',
      time_management: 'Excellent time management.',
      level_recommendation: 'Great progress! Consider advancing to JLPT N4.',
      study_suggestions: 'Maintain your excellent performance.',
    },
    created_at: '2025-01-03T10:00:00Z',
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>JLPT 자격 검증 프로그램</h1>
      </header>
      <main className="App-main">
        <section className="test-section">
          <h2>테스트 UI 예제</h2>
          <TestUI
            test={exampleTest}
            onSubmit={(answers) => {
              console.log('Submitted answers:', answers);
            }}
          />
        </section>
        <section className="result-section">
          <h2>결과 UI 예제</h2>
          <ResultUI result={exampleResult} />
        </section>
      </main>
    </div>
  );
}

export default App;
