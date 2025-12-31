import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import TestUI from './components/organisms/TestUI';
import ResultUI from './components/organisms/ResultUI';
import LoginUI from './components/organisms/LoginUI';
import UserPerformanceUI from './components/organisms/UserPerformanceUI';
import UserHistoryUI from './components/organisms/UserHistoryUI';
import UserProfileUI from './components/organisms/UserProfileUI';
import AdminUserManagementUI from './components/organisms/AdminUserManagementUI';
import AdminQuestionManagementUI from './components/organisms/AdminQuestionManagementUI';
import { Test, Result, UserPerformance, UserHistory, UserProfile } from './types/api';
import { testApi, resultApi, userApi, ApiError } from './services/api';
import { authService, User } from './services/auth';

type AppState = 'login' | 'initial' | 'loading' | 'test' | 'submitting' | 'result' | 'performance' | 'history' | 'profile' | 'admin-users' | 'admin-questions' | 'error';

function App() {
  const [state, setState] = useState<AppState>('login');
  const [currentTest, setCurrentTest] = useState<Test | null>(null);
  const [currentResult, setCurrentResult] = useState<Result | null>(null);
  const [currentPerformance, setCurrentPerformance] = useState<UserPerformance | null>(null);
  const [currentHistory, setCurrentHistory] = useState<UserHistory[]>([]);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // 최신 상태를 참조하기 위한 ref
  const stateRef = useRef(state);
  const isInitializingRef = useRef(isInitializing);
  
  // ref 업데이트
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  
  useEffect(() => {
    isInitializingRef.current = isInitializing;
  }, [isInitializing]);

  // 인증 상태 구독
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = authService.subscribe((currentUser) => {
      if (!isMounted) return;
      
      setUser(currentUser);
      // 초기화 중이 아니고 사용자가 없으면 로그인 화면으로
      if (!isInitializingRef.current && !currentUser && stateRef.current !== 'login') {
        setState('login');
      }
      // 사용자가 있으면 초기 화면으로
      if (!isInitializingRef.current && currentUser && stateRef.current === 'login') {
        setState('initial');
      }
    });

    // 초기화 시 사용자 정보 확인
    authService.initialize().finally(() => {
      if (!isMounted) return;
      
      setIsInitializing(false);
      // 초기화 후 사용자 상태에 따라 화면 설정
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setState('initial');
      } else {
        setState('login');
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // 로그인 성공 핸들러
  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setState('initial');
  };

  // 로그아웃 핸들러
  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setCurrentTest(null);
      setCurrentResult(null);
      setError(null);
      setState('login');
    } catch (err) {
      // 로그아웃 실패해도 로그인 화면으로 이동
      setUser(null);
      setState('login');
    }
  };

  // N5 진단 테스트 생성 및 시작
  const handleStartTest = async () => {
    // 인증 확인
    if (!authService.isAuthenticated()) {
      setState('login');
      return;
    }

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
        // 401 에러인 경우 로그인 화면으로
        if (err.status === 401) {
          setState('login');
        } else {
          setError(err.message);
          setState('error');
        }
      } else {
        setError('테스트를 시작하는 중 오류가 발생했습니다.');
        setState('error');
      }
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
    setCurrentPerformance(null);
    setCurrentHistory([]);
    setCurrentProfile(null);
    setError(null);
    setState('initial');
  };

  // 성능 분석 조회
  const handleViewPerformance = async () => {
    // 인증 확인
    if (!authService.isAuthenticated() || !user) {
      setState('login');
      return;
    }

    setState('loading');
    setError(null);

    try {
      const performance = await userApi.getUserPerformance(user.id);
      setCurrentPerformance(performance);
      setState('performance');
    } catch (err) {
      if (err instanceof ApiError) {
        // 401 에러인 경우 로그인 화면으로
        if (err.status === 401) {
          setState('login');
        } else if (err.status === 404) {
          const nowIso = new Date().toISOString();
          setCurrentPerformance({
            id: 0,
            user_id: user.id,
            analysis_period_start: nowIso,
            analysis_period_end: nowIso,
            type_performance: {},
            difficulty_performance: {},
            level_progression: {},
            repeated_mistakes: [],
            weaknesses: {},
            created_at: nowIso,
            updated_at: nowIso,
          });
          setState('performance');
        } else {
          setError(err.message);
          setState('error');
        }
      } else {
        setError('성능 분석 데이터를 불러오는 중 오류가 발생했습니다.');
        setState('error');
      }
    }
  };

  // 학습 이력 조회
  const handleViewHistory = async () => {
    // 인증 확인
    if (!authService.isAuthenticated() || !user) {
      setState('login');
      return;
    }

    setState('loading');
    setError(null);

    try {
      const history = await userApi.getUserHistory(user.id);
      setCurrentHistory(history);
      setState('history');
    } catch (err) {
      if (err instanceof ApiError) {
        // 401 에러인 경우 로그인 화면으로
        if (err.status === 401) {
          setState('login');
        } else {
          setError(err.message);
          setState('error');
        }
      } else {
        setError('학습 이력을 불러오는 중 오류가 발생했습니다.');
        setState('error');
      }
    }
  };

  // 프로필 조회
  const handleViewProfile = async () => {
    // 인증 확인
    if (!authService.isAuthenticated() || !user) {
      setState('login');
      return;
    }

    setState('loading');
    setError(null);

    try {
      const profile = await userApi.getCurrentUser();
      setCurrentProfile(profile);
      setState('profile');
    } catch (err) {
      if (err instanceof ApiError) {
        // 401 에러인 경우 로그인 화면으로
        if (err.status === 401) {
          setState('login');
        } else {
          setError(err.message);
          setState('error');
        }
      } else {
        setError('프로필을 불러오는 중 오류가 발생했습니다.');
        setState('error');
      }
    }
  };

  // 프로필 업데이트
  const handleProfileUpdate = async (updates: { username?: string; target_level?: string }) => {
    if (!user) {
      throw new Error('사용자 정보가 없습니다.');
    }

    const updatedProfile = await userApi.updateCurrentUser(updates);
    setCurrentProfile(updatedProfile);
    // 사용자 정보도 업데이트
    setUser({
      id: updatedProfile.id,
      email: updatedProfile.email,
      username: updatedProfile.username,
      target_level: updatedProfile.target_level,
      current_level: updatedProfile.current_level,
      total_tests_taken: updatedProfile.total_tests_taken,
      study_streak: updatedProfile.study_streak,
    });
  };

  // 초기화 중이면 로딩 표시
  if (isInitializing) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>JLPT 자격 검증 프로그램</h1>
        </header>
        <main className="App-main">
          <section className="loading-section">
            <div className="loading-spinner">로딩 중...</div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>JLPT 자격 검증 프로그램</h1>
        {user && (
          <div className="user-info">
            <span>안녕하세요, {user.username}님</span>
            <button
              onClick={handleLogout}
              className="logout-button"
              aria-label="로그아웃"
            >
              로그아웃
            </button>
          </div>
        )}
      </header>
      <main className="App-main">
        {state === 'login' && (
          <section className="login-section">
            <LoginUI onLoginSuccess={handleLoginSuccess} />
          </section>
        )}

        {state === 'initial' && (
          <section className="initial-section">
            <h2>N5 진단 테스트</h2>
            <p>JLPT N5 레벨 진단 테스트를 시작하세요.</p>
            <div className="initial-actions">
              <button
                onClick={handleStartTest}
                className="start-button"
              >
                테스트 시작
              </button>
              <button
                onClick={handleViewPerformance}
                className="performance-button"
              >
                성능 분석 보기
              </button>
              <button
                onClick={handleViewHistory}
                className="history-button"
              >
                학습 이력 보기
              </button>
              <button
                onClick={handleViewProfile}
                className="profile-button"
              >
                프로필 관리
              </button>
              {user?.is_admin && (
                <>
                  <button
                    onClick={() => setState('admin-users')}
                    className="admin-button"
                  >
                    어드민 - 사용자 관리
                  </button>
                  <button
                    onClick={() => setState('admin-questions')}
                    className="admin-button"
                  >
                    어드민 - 문제 관리
                  </button>
                </>
              )}
            </div>
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

        {state === 'performance' && currentPerformance && (
          <section className="performance-section">
            <UserPerformanceUI performance={currentPerformance} />
            <div className="performance-actions">
              <button onClick={handleRestart} className="back-button">
                돌아가기
              </button>
            </div>
          </section>
        )}

        {state === 'history' && (
          <section className="history-section">
            <UserHistoryUI history={currentHistory} />
            <div className="history-actions">
              <button onClick={handleRestart} className="back-button">
                돌아가기
              </button>
            </div>
          </section>
        )}

        {state === 'profile' && currentProfile && (
          <section className="profile-section">
            <UserProfileUI profile={currentProfile} onUpdate={handleProfileUpdate} />
            <div className="profile-actions">
              <button onClick={handleRestart} className="back-button">
                돌아가기
              </button>
            </div>
          </section>
        )}

        {state === 'admin-users' && (
          <section className="admin-section">
            <AdminUserManagementUI onBack={handleRestart} />
          </section>
        )}

        {state === 'admin-questions' && (
          <section className="admin-section">
            <AdminQuestionManagementUI onBack={handleRestart} />
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
