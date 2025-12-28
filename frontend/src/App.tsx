import React, { useState, useEffect } from 'react';
import './App.css';
import TestUI from './components/organisms/TestUI';
import ResultUI from './components/organisms/ResultUI';
import { Test, Result } from './types/api';
import { testApi, resultApi, ApiError } from './services/api';
import { authService, User } from './services/auth';

type AppState = 'initial' | 'loading' | 'test' | 'submitting' | 'result' | 'error';

function App() {
  const [state, setState] = useState<AppState>('initial');
  const [currentTest, setCurrentTest] = useState<Test | null>(null);
  const [currentResult, setCurrentResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // 인증 상태 구독
  useEffect(() => {
    const unsubscribe = authService.subscribe((currentUser) => {
      setUser(currentUser);
    });

    // 초기화 시 사용자 정보 확인
    authService.initialize();

    return unsubscribe;
  }, []);

  // N5 진단 테스트 생성 및 시작
  const handleStartTest = async () => {
    setState('loading');
    setError(null);

    try {
      // N5 진단 테스트 생성
      const test = await testApi.createN5DiagnosticTest();
      
      // 테스트 시작
      const startedTest = await testApi.startTest(test.id);
      
      setCurrentTest(startedTest);
      setState('test');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('테스트를 시작하는 중 오류가 발생했습니다.');
      }
      setState('error');
    }
  };

  // 테스트 제출
  const handleSubmitTest = async (answers: Record<number, string>) => {
    if (!currentTest) return;

    setState('submitting');
    setError(null);

    try {
      // 테스트 제출
      const submitResult = await testApi.submitTest(currentTest.id, answers);
      
      // 결과 조회
      const result = await resultApi.getResult(submitResult.result_id);
      
      setCurrentResult(result);
      setState('result');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('테스트 제출 중 오류가 발생했습니다.');
      }
      setState('error');
    }
  };

  // 다시 시작
  const handleRestart = () => {
    setCurrentTest(null);
    setCurrentResult(null);
    setError(null);
    setState('initial');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>JLPT 자격 검증 프로그램</h1>
        {user && (
          <div className="user-info">
            <span>안녕하세요, {user.username}님</span>
          </div>
        )}
      </header>
      <main className="App-main">
        {state === 'initial' && (
          <section className="initial-section">
            <h2>N5 진단 테스트</h2>
            <p>JLPT N5 레벨 진단 테스트를 시작하세요.</p>
            <button
              onClick={handleStartTest}
              className="start-button"
            >
              테스트 시작
            </button>
          </section>
        )}

        {state === 'loading' && (
          <section className="loading-section">
            <div className="loading-spinner">테스트를 준비하는 중...</div>
          </section>
        )}

        {state === 'test' && currentTest && (
          <section className="test-section">
            <TestUI test={currentTest} onSubmit={handleSubmitTest} />
          </section>
        )}

        {state === 'submitting' && (
          <section className="loading-section">
            <div className="loading-spinner">결과를 처리하는 중...</div>
          </section>
        )}

        {state === 'result' && currentResult && (
          <section className="result-section">
            <ResultUI result={currentResult} />
            <div className="result-actions">
              <button onClick={handleRestart} className="restart-button">
                다시 시작
              </button>
            </div>
          </section>
        )}

        {state === 'error' && (
          <section className="error-section">
            <div className="error-message">
              <h2>오류가 발생했습니다</h2>
              <p>{error || '알 수 없는 오류가 발생했습니다.'}</p>
              <button onClick={handleRestart} className="retry-button">
                다시 시도
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
