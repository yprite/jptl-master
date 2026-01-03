import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import TestUI from './components/organisms/TestUI';
import StudyUI from './components/organisms/StudyUI';
import ResultUI from './components/organisms/ResultUI';
import LoginUI from './components/organisms/LoginUI';
import UserPerformanceUI from './components/organisms/UserPerformanceUI';
import UserHistoryUI from './components/organisms/UserHistoryUI';
import UserProfileUI from './components/organisms/UserProfileUI';
import FlashcardUI from './components/organisms/FlashcardUI';
import VocabularyListUI from './components/organisms/VocabularyListUI';
import AdminUserManagementUI from './components/organisms/AdminUserManagementUI';
import AdminQuestionManagementUI from './components/organisms/AdminQuestionManagementUI';
import AdminVocabularyManagementUI from './components/organisms/AdminVocabularyManagementUI';
import AdminDashboardUI from './components/organisms/AdminDashboardUI';
import AdminLayout, { AdminPage } from './components/organisms/AdminLayout';
import StudyPlanDashboardUI from './components/organisms/StudyPlanDashboardUI';
import DailyChecklistUI from './components/organisms/DailyChecklistUI';
import { Test, Result, UserPerformance, UserHistory, UserProfile, Question, Vocabulary } from './types/api';
import { testApi, resultApi, userApi, studyApi, vocabularyApi, ApiError } from './services/api';
import { authService, User } from './services/auth';

type AppState = 'login' | 'initial' | 'study-plan' | 'daily-checklist' | 'study-select' | 'study' | 'wrong-answers' | 'repeat-study' | 'loading' | 'test' | 'submitting' | 'result' | 'performance' | 'history' | 'profile' | 'vocabulary' | 'vocabulary-list' | 'admin-dashboard' | 'admin-users' | 'admin-questions' | 'admin-vocabulary' | 'error';

function App() {
  const [state, setState] = useState<AppState>('login');
  const [currentTest, setCurrentTest] = useState<Test | null>(null);
  const [currentStudyQuestions, setCurrentStudyQuestions] = useState<Question[]>([]);
  const [studyLevel, setStudyLevel] = useState<string>('N5');
  const [studyQuestionTypes, setStudyQuestionTypes] = useState<string[]>([]);
  const [studySessions, setStudySessions] = useState<Array<{
    id: number;
    study_date: string;
    study_hour: number;
    total_questions: number;
    correct_count: number;
    accuracy: number;
    time_spent_minutes: number;
    level: string | null;
    question_types: string[] | null;
    question_count: number;
    created_at: string;
  }>>([]);
  const [currentResult, setCurrentResult] = useState<Result | null>(null);
  const [currentPerformance, setCurrentPerformance] = useState<UserPerformance | null>(null);
  const [currentHistory, setCurrentHistory] = useState<UserHistory[]>([]);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [currentVocabularies, setCurrentVocabularies] = useState<Vocabulary[]>([]);
  const [vocabularyLevel, setVocabularyLevel] = useState<string>('N5');
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  
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
      // 사용자가 있으면 초기 화면으로 (admin 사용자는 admin-dashboard로)
      if (!isInitializingRef.current && currentUser && stateRef.current === 'login') {
        if (currentUser.is_admin) {
          setState('admin-dashboard');
        } else {
          setState('initial');
        }
      }
    });

    // 초기화 시 사용자 정보 확인
    authService.initialize().finally(() => {
      if (!isMounted) return;
      
      setIsInitializing(false);
      // 초기화 후 사용자 상태에 따라 화면 설정
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        if (currentUser.is_admin) {
          setState('admin-dashboard');
        } else {
          setState('initial');
        }
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
    if (loggedInUser.is_admin) {
      setState('admin-dashboard');
    } else {
      setState('initial');
    }
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
      
      // 일일 체크리스트에서 모의고사를 시작한 경우, 결과 확인 후 체크리스트로 복귀
      // (handleRestart에서 처리됨)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('테스트 제출 중 오류가 발생했습니다.');
      }
      setState('error');
    }
  };

  // 학습 모드 선택 화면으로 이동
  const handleStartStudy = () => {
    setState('study-select');
  };

  // 학습 모드 시작
  const handleStartStudyMode = async (level: string, questionTypes: string[], questionCount: number = 20) => {
    // 인증 확인
    if (!authService.isAuthenticated()) {
      setState('login');
      return;
    }

    setState('loading');
    setError(null);

    try {
      const questions = await studyApi.getStudyQuestions({
        level,
        question_types: questionTypes.length > 0 ? questionTypes : undefined,
        question_count: questionCount,
      });
      
      // 문제가 없는 경우 에러 처리
      if (!questions || questions.length === 0) {
        setError('해당 유형의 문제가 없습니다. 관리자에게 문의해주세요.');
        setState('error');
        return;
      }
      
      setCurrentStudyQuestions(questions);
      setStudyLevel(level);
      setStudyQuestionTypes(questionTypes);
      setState('study');
    } catch (err) {
      // 에러 발생 시 로딩 상태 해제
      setState('error');
      
      if (err instanceof ApiError) {
        // 401 에러인 경우 로그인 화면으로
        if (err.status === 401) {
          setState('login');
        } else if (err.status === 404) {
          setError('해당 유형의 문제를 찾을 수 없습니다.');
        } else if (err.status === 500) {
          setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } else {
          setError(err.message || '학습 모드를 시작하는 중 오류가 발생했습니다.');
        }
      } else if (err instanceof Error) {
        // 네트워크 에러 등
        if (err.message.includes('fetch') || err.message.includes('network')) {
          setError('네트워크 연결을 확인해주세요.');
        } else {
          setError(err.message || '학습 모드를 시작하는 중 오류가 발생했습니다.');
        }
      } else {
        setError('학습 모드를 시작하는 중 오류가 발생했습니다.');
      }
    }
  };

  // 학습 모드 제출
  const handleSubmitStudy = async (answers: Record<number, string>) => {
    if (!currentStudyQuestions.length) return;

    setState('submitting');
    setError(null);

    try {
      const timeSpentMinutes = Math.max(1, Math.floor((Date.now() - Date.now()) / 60000) + 1);
      await studyApi.submitStudySession({
        answers,
        level: studyLevel,
        question_types: studyQuestionTypes.length > 0 ? studyQuestionTypes : undefined,
        time_spent_minutes: timeSpentMinutes,
      });
      
      // 학습 완료 후 이전 화면으로
      setCurrentStudyQuestions([]);
      
      // 일일 체크리스트에서 온 경우 체크리스트 상태 업데이트
      if (state === 'study' && selectedDay > 0) {
        // 학습한 문제 유형에 따라 체크리스트 상태 업데이트
        if (studyQuestionTypes.includes('grammar')) {
          const saved = localStorage.getItem(`studyPlan_day${selectedDay}_completed`);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              parsed.grammar = true;
              localStorage.setItem(`studyPlan_day${selectedDay}_completed`, JSON.stringify(parsed));
            } catch (e) {
              // 파싱 실패 시 새로 생성
              localStorage.setItem(`studyPlan_day${selectedDay}_completed`, JSON.stringify({ grammar: true }));
            }
          } else {
            localStorage.setItem(`studyPlan_day${selectedDay}_completed`, JSON.stringify({ grammar: true }));
          }
        } else if (studyQuestionTypes.includes('reading')) {
          const saved = localStorage.getItem(`studyPlan_day${selectedDay}_completed`);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              parsed.reading = true;
              localStorage.setItem(`studyPlan_day${selectedDay}_completed`, JSON.stringify(parsed));
            } catch (e) {
              localStorage.setItem(`studyPlan_day${selectedDay}_completed`, JSON.stringify({ reading: true }));
            }
          } else {
            localStorage.setItem(`studyPlan_day${selectedDay}_completed`, JSON.stringify({ reading: true }));
          }
        } else if (studyQuestionTypes.includes('listening')) {
          const saved = localStorage.getItem(`studyPlan_day${selectedDay}_completed`);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              parsed.listening = true;
              localStorage.setItem(`studyPlan_day${selectedDay}_completed`, JSON.stringify(parsed));
            } catch (e) {
              localStorage.setItem(`studyPlan_day${selectedDay}_completed`, JSON.stringify({ listening: true }));
            }
          } else {
            localStorage.setItem(`studyPlan_day${selectedDay}_completed`, JSON.stringify({ listening: true }));
          }
        }
        setState('daily-checklist');
      } else {
        setState('study-plan');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('학습 세션 제출 중 오류가 발생했습니다.');
      }
      setState('error');
    }
  };

  // 다시 시작
  const handleRestart = () => {
    const wasFromDailyChecklist = selectedDay > 0 && state === 'result';
    
    setCurrentTest(null);
    setCurrentStudyQuestions([]);
    setCurrentResult(null);
    setCurrentPerformance(null);
    setCurrentHistory([]);
    setCurrentProfile(null);
    setError(null);
    setSelectedDay(0);
    setSelectedWeek(1);
    
    // 일일 체크리스트에서 모의고사를 시작한 경우 체크리스트로 복귀
    if (wasFromDailyChecklist) {
      setState('daily-checklist');
    } else if (user?.is_admin) {
      setState('admin-dashboard');
    } else {
      setState('initial');
    }
  };

  // 학습 계획에서 일일 체크리스트로 이동
  const handleViewDayDetail = (day: number, week: number) => {
    setSelectedDay(day);
    setSelectedWeek(week);
    setState('daily-checklist');
  };

  // 일일 체크리스트에서 학습 시작
  const handleStartDailyStudy = async (taskType: 'vocabulary' | 'grammar' | 'reading' | 'listening' | 'mockTest', taskCount?: number) => {
    // 인증 확인
    if (!authService.isAuthenticated()) {
      setState('login');
      return;
    }

    // 모의고사인 경우 테스트 모드로 시작
    if (taskType === 'mockTest') {
      try {
        await handleStartTest();
      } catch (err) {
        // handleStartTest에서 이미 에러 처리를 하므로 여기서는 추가 처리 불필요
        console.error('모의고사 시작 중 오류:', err);
      }
      return;
    }

    // 단어 학습인 경우 FlashcardUI로 이동
    if (taskType === 'vocabulary') {
      setState('loading');
      setError(null);

      try {
        const vocabularies = await vocabularyApi.getVocabularies({ level: 'N5' });
        if (vocabularies.length === 0) {
          setError('해당 레벨의 단어가 없습니다.');
          setState('error');
          return;
        }
        // taskCount만큼만 단어 가져오기
        const limitedVocabularies = taskCount ? vocabularies.slice(0, taskCount) : vocabularies;
        setCurrentVocabularies(limitedVocabularies);
        setVocabularyLevel('N5');
        setState('vocabulary');
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.status === 401) {
            setState('login');
          } else {
            setError(err.message);
          }
        } else {
          setError('단어 학습을 시작하는 중 오류가 발생했습니다.');
        }
        setState('error');
      }
      return;
    }

    setState('loading');
    setError(null);

    try {
      const level = 'N5';
      let questionTypes: string[] = [];
      
      if (taskType === 'grammar') {
        questionTypes = ['grammar'];
      } else if (taskType === 'reading') {
        questionTypes = ['reading'];
      } else if (taskType === 'listening') {
        questionTypes = ['listening'];
      }

      // taskCount가 있으면 그만큼만, 없으면 기본값 20개
      const questionCount = taskCount || 20;

      const questions = await studyApi.getStudyQuestions({
        level,
        question_types: questionTypes.length > 0 ? questionTypes : undefined,
        question_count: questionCount,
      });
      
      // 문제가 없는 경우 에러 처리
      if (!questions || questions.length === 0) {
        setError('해당 유형의 문제가 없습니다. 관리자에게 문의해주세요.');
        setState('error');
        return;
      }
      
      setCurrentStudyQuestions(questions);
      setStudyLevel(level);
      setStudyQuestionTypes(questionTypes);
      setState('study');
    } catch (err) {
      // 에러 발생 시 로딩 상태 해제
      setState('error');
      
      if (err instanceof ApiError) {
        // 401 에러인 경우 로그인 화면으로
        if (err.status === 401) {
          setState('login');
        } else if (err.status === 404) {
          setError('해당 유형의 문제를 찾을 수 없습니다.');
        } else if (err.status === 500) {
          setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } else {
          setError(err.message || '학습 모드를 시작하는 중 오류가 발생했습니다.');
        }
      } else if (err instanceof Error) {
        // 네트워크 에러 등
        if (err.message.includes('fetch') || err.message.includes('network')) {
          setError('네트워크 연결을 확인해주세요.');
        } else {
          setError(err.message || '학습 모드를 시작하는 중 오류가 발생했습니다.');
        }
      } else {
        setError('학습 모드를 시작하는 중 오류가 발생했습니다.');
      }
    }
  };

  // 학습 계획에서 오늘 학습 시작
  const handleStartTodayStudy = async (day: number, week: number) => {
    setSelectedDay(day);
    setSelectedWeek(week);
    setState('daily-checklist');
  };

  // 어드민 페이지 네비게이션
  const handleAdminNavigate = (page: AdminPage) => {
    setState(page);
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

  // 오답 노트 조회
  const handleViewWrongAnswers = async () => {
    // 인증 확인
    if (!authService.isAuthenticated()) {
      setState('login');
      return;
    }

    setState('loading');
    setError(null);

    try {
      const questions = await studyApi.getWrongAnswerQuestions();
      setCurrentStudyQuestions(questions);
      setState('wrong-answers');
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
        setError('오답 노트를 불러오는 중 오류가 발생했습니다.');
        setState('error');
      }
    }
  };

  // 오답 노트로 학습 시작
  const handleStartWrongAnswerStudy = async (questionCount: number = 20) => {
    // 인증 확인
    if (!authService.isAuthenticated()) {
      setState('login');
      return;
    }

    setState('loading');
    setError(null);

    try {
      const questions = await studyApi.getWrongAnswerQuestionsForStudy(questionCount);
      setCurrentStudyQuestions(questions);
      setState('study');
    } catch (err) {
      if (err instanceof ApiError) {
        // 401 에러인 경우 로그인 화면으로
        if (err.status === 401) {
          setState('login');
        } else if (err.status === 404) {
          setError('틀린 문제가 없습니다. 먼저 테스트를 응시해주세요.');
          setState('error');
        } else {
          setError(err.message);
          setState('error');
        }
      } else {
        setError('오답 노트 학습을 시작하는 중 오류가 발생했습니다.');
        setState('error');
      }
    }
  };

  // 반복 학습 세션 목록 조회
  const handleViewRepeatStudy = async () => {
    // 인증 확인
    if (!authService.isAuthenticated()) {
      setState('login');
      return;
    }

    setState('loading');
    setError(null);

    try {
      const sessions = await studyApi.getStudySessions();
      setStudySessions(sessions);
      setState('repeat-study');
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
        setError('학습 세션 목록을 불러오는 중 오류가 발생했습니다.');
        setState('error');
      }
    }
  };

  // 반복 학습 시작
  const handleStartRepeatStudy = async (sessionId: number) => {
    // 인증 확인
    if (!authService.isAuthenticated()) {
      setState('login');
      return;
    }

    setState('loading');
    setError(null);

    try {
      const questions = await studyApi.getStudySessionQuestions(sessionId);
      setCurrentStudyQuestions(questions);
      setState('study');
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
        setError('반복 학습을 시작하는 중 오류가 발생했습니다.');
        setState('error');
      }
    }
  };

  // 단어 학습 시작
  const handleStartVocabulary = async () => {
    // 인증 확인
    if (!authService.isAuthenticated()) {
      setState('login');
      return;
    }

    setState('loading');
    setError(null);

    try {
      const vocabularies = await vocabularyApi.getVocabularies({ level: vocabularyLevel });
      if (vocabularies.length === 0) {
        setError('해당 레벨의 단어가 없습니다.');
        setState('error');
        return;
      }
      setCurrentVocabularies(vocabularies);
      setState('vocabulary');
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
        setError('단어 학습을 시작하는 중 오류가 발생했습니다.');
        setState('error');
      }
    }
  };

  // 단어 목록 보기
  const handleViewVocabularyList = async () => {
    // 인증 확인
    if (!authService.isAuthenticated()) {
      setState('login');
      return;
    }

    setState('loading');
    setError(null);

    try {
      const vocabularies = await vocabularyApi.getVocabularies();
      setCurrentVocabularies(vocabularies);
      setState('vocabulary-list');
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
        setError('단어 목록을 불러오는 중 오류가 발생했습니다.');
        setState('error');
      }
    }
  };

  // 단어 암기 상태 업데이트
  const handleVocabularyStatusUpdate = async (vocabularyId: number, status: string) => {
    try {
      await vocabularyApi.studyVocabulary(vocabularyId, status);
      // 목록 업데이트
      const updatedVocabularies = currentVocabularies.map(v =>
        v.id === vocabularyId ? { ...v, memorization_status: status } : v
      );
      setCurrentVocabularies(updatedVocabularies);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('암기 상태 업데이트 중 오류가 발생했습니다.');
      }
    }
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

  // 어드민 페이지인지 확인
  const isAdminPage = state === 'admin-dashboard' || state === 'admin-users' || state === 'admin-questions' || state === 'admin-vocabulary';

  return (
    <div className="App">
      {/* 어드민 페이지가 아닐 때만 일반 헤더 표시 */}
      {!isAdminPage && (
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
      )}
      <main className="App-main">
        {state === 'login' && (
          <section className="login-section">
            <LoginUI onLoginSuccess={handleLoginSuccess} />
          </section>
        )}

        {state === 'study-plan' && !user?.is_admin && (
          <section className="study-plan-section">
            <StudyPlanDashboardUI
              onStartStudy={handleStartTodayStudy}
              onViewDayDetail={handleViewDayDetail}
            />
            <div className="study-plan-actions">
              <button
                onClick={() => setState('initial')}
                className="menu-button"
              >
                메뉴
              </button>
            </div>
          </section>
        )}

        {state === 'daily-checklist' && !user?.is_admin && (
          <section className="daily-checklist-section">
            <DailyChecklistUI
              day={selectedDay}
              week={selectedWeek}
              onStartStudy={handleStartDailyStudy}
              onBack={() => setState('study-plan')}
            />
          </section>
        )}

        {state === 'initial' && (
          <section className="initial-section" data-testid="initial-ui">
            <h2>JLPT 학습 플랫폼</h2>
            <p>테스트 모드와 학습 모드 중 선택하세요.</p>
            <div className="initial-actions">
              <button
                onClick={() => setState('study-plan')}
                className="study-plan-button"
              >
                6주 학습 계획
              </button>
              <button
                onClick={handleStartTest}
                className="start-button"
              >
                테스트 모드
              </button>
              <button
                onClick={handleStartStudy}
                className="study-button"
              >
                학습 모드
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
              <button
                onClick={handleViewWrongAnswers}
                className="wrong-answers-button"
              >
                오답 노트
              </button>
              <button
                onClick={handleViewRepeatStudy}
                className="repeat-study-button"
              >
                반복 학습
              </button>
              <button
                onClick={handleStartVocabulary}
                className="vocabulary-button"
              >
                단어 학습
              </button>
            </div>
          </section>
        )}

        {state === 'study-select' && (
          <section className="study-select-section">
            <h2>학습 모드 설정</h2>
            <div className="study-select-form">
              <div className="form-group">
                <label>레벨 선택:</label>
                <select
                  value={studyLevel}
                  onChange={(e) => setStudyLevel(e.target.value)}
                  className="form-select"
                >
                  <option value="N5">N5</option>
                  <option value="N4">N4</option>
                  <option value="N3">N3</option>
                  <option value="N2">N2</option>
                  <option value="N1">N1</option>
                </select>
              </div>
              <div className="form-group">
                <label>문제 유형 선택 (복수 선택 가능):</label>
                <div className="checkbox-group">
                  {['vocabulary', 'grammar', 'reading', 'listening'].map((type) => (
                    <label key={type} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={studyQuestionTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setStudyQuestionTypes([...studyQuestionTypes, type]);
                          } else {
                            setStudyQuestionTypes(studyQuestionTypes.filter(t => t !== type));
                          }
                        }}
                      />
                      {type === 'vocabulary' ? '어휘' : 
                       type === 'grammar' ? '문법' : 
                       type === 'reading' ? '독해' : '청해'}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-actions">
                <button
                  onClick={() => handleStartStudyMode(studyLevel, studyQuestionTypes, 20)}
                  className="start-button"
                >
                  학습 시작
                </button>
                <button
                  onClick={() => setState('initial')}
                  className="back-button"
                >
                  돌아가기
                </button>
              </div>
            </div>
          </section>
        )}

        {state === 'loading' && (
          <section className="loading-section">
            <div className="loading-spinner">테스트를 준비하는 중...</div>
          </section>
        )}

        {state === 'study' && currentStudyQuestions.length > 0 && (
          <section className="study-section">
            <StudyUI 
              questions={currentStudyQuestions} 
              onSubmit={handleSubmitStudy} 
            />
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

        {state === 'wrong-answers' && (
          <section className="wrong-answers-section">
            <h2>오답 노트</h2>
            {currentStudyQuestions.length === 0 ? (
              <div className="empty-state">
                <p>틀린 문제가 없습니다. 먼저 테스트를 응시해주세요.</p>
                <button onClick={handleRestart} className="back-button">
                  돌아가기
                </button>
              </div>
            ) : (
              <div className="wrong-answers-content">
                <p>총 {currentStudyQuestions.length}개의 틀린 문제가 있습니다.</p>
                <div className="wrong-answers-actions">
                  <button
                    onClick={() => handleStartWrongAnswerStudy(20)}
                    className="start-button"
                  >
                    틀린 문제 20개로 학습 시작
                  </button>
                  <button
                    onClick={() => handleStartWrongAnswerStudy(Math.min(currentStudyQuestions.length, 50))}
                    className="start-button"
                  >
                    틀린 문제 전체로 학습 시작
                  </button>
                  <button onClick={handleRestart} className="back-button">
                    돌아가기
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {state === 'repeat-study' && (
          <section className="repeat-study-section">
            <h2>반복 학습</h2>
            {studySessions.length === 0 ? (
              <div className="empty-state">
                <p>저장된 학습 세션이 없습니다. 먼저 학습 모드로 문제를 풀어주세요.</p>
                <button onClick={handleRestart} className="back-button">
                  돌아가기
                </button>
              </div>
            ) : (
              <div className="repeat-study-content">
                <p>총 {studySessions.length}개의 학습 세션이 있습니다.</p>
                <div className="study-sessions-list">
                  {studySessions.map((session) => (
                    <div key={session.id} className="study-session-item">
                      <div className="session-info">
                        <p><strong>날짜:</strong> {new Date(session.study_date).toLocaleDateString()}</p>
                        <p><strong>문제 수:</strong> {session.total_questions}개</p>
                        <p><strong>정답:</strong> {session.correct_count}개</p>
                        <p><strong>정확도:</strong> {session.accuracy.toFixed(1)}%</p>
                        <p><strong>소요 시간:</strong> {session.time_spent_minutes}분</p>
                        {session.level && <p><strong>레벨:</strong> {session.level}</p>}
                      </div>
                      <button
                        onClick={() => handleStartRepeatStudy(session.id)}
                        className="start-button"
                        disabled={session.question_count === 0}
                      >
                        다시 학습하기
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={handleRestart} className="back-button">
                  돌아가기
                </button>
              </div>
            )}
          </section>
        )}

        {state === 'vocabulary' && currentVocabularies.length > 0 && (
          <section className="vocabulary-section">
            <div className="vocabulary-controls">
              <button
                onClick={() => {
                  // 일일 체크리스트에서 온 경우 체크리스트 상태 업데이트
                  if (selectedDay > 0) {
                    const saved = localStorage.getItem(`studyPlan_day${selectedDay}_completed`);
                    if (saved) {
                      try {
                        const parsed = JSON.parse(saved);
                        parsed.vocabulary = true;
                        localStorage.setItem(`studyPlan_day${selectedDay}_completed`, JSON.stringify(parsed));
                      } catch (e) {
                        localStorage.setItem(`studyPlan_day${selectedDay}_completed`, JSON.stringify({ vocabulary: true }));
                      }
                    } else {
                      localStorage.setItem(`studyPlan_day${selectedDay}_completed`, JSON.stringify({ vocabulary: true }));
                    }
                    setState('daily-checklist');
                  } else {
                    setState('initial');
                  }
                }}
                className="back-button"
              >
                뒤로 가기
              </button>
              <button
                onClick={handleViewVocabularyList}
                className="list-button"
              >
                단어 목록 보기
              </button>
            </div>
            <FlashcardUI
              vocabularies={currentVocabularies}
              onStatusUpdate={handleVocabularyStatusUpdate}
            />
          </section>
        )}

        {state === 'vocabulary-list' && (
          <section className="vocabulary-list-section">
            <div className="vocabulary-controls">
              <button
                onClick={() => setState('initial')}
                className="back-button"
              >
                뒤로 가기
              </button>
              <button
                onClick={handleStartVocabulary}
                className="flashcard-button"
              >
                플래시카드 학습
              </button>
            </div>
            <VocabularyListUI
              vocabularies={currentVocabularies}
              onStatusUpdate={handleVocabularyStatusUpdate}
            />
          </section>
        )}

        {(state === 'admin-dashboard' || state === 'admin-users' || state === 'admin-questions' || state === 'admin-vocabulary') && (
          <AdminLayout
            currentPage={state as AdminPage}
            onNavigate={handleAdminNavigate}
            onBack={handleRestart}
            onLogout={handleLogout}
          >
            {state === 'admin-dashboard' && <AdminDashboardUI />}
            {state === 'admin-users' && <AdminUserManagementUI />}
            {state === 'admin-questions' && <AdminQuestionManagementUI />}
            {state === 'admin-vocabulary' && <AdminVocabularyManagementUI />}
          </AdminLayout>
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
