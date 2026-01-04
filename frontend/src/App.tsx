import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import TestUI from './components/organisms/TestUI';
import StudyUI from './components/organisms/StudyUI';
import StudyModeUI, { StudyConcept } from './components/organisms/StudyModeUI';
import { allStudyConcepts } from './data/study-concepts';
import ResultUI from './components/organisms/ResultUI';
import LoginUI from './components/organisms/LoginUI';
import UserPerformanceUI from './components/organisms/UserPerformanceUI';
import AnalyticsUI from './components/organisms/AnalyticsUI';
import BadgeEarnedModal from './components/organisms/BadgeEarnedModal';
import BadgeCollectionUI from './components/organisms/BadgeCollectionUI';
import OnboardingUI, { OnboardingData } from './components/organisms/OnboardingUI';
import { ToastContainer, ToastItem } from './components/atoms/ToastContainer';
import { badgeService } from './services/badgeService';
import { Badge } from './types/badges';
import UserHistoryUI from './components/organisms/UserHistoryUI';
import UserProfileUI from './components/organisms/UserProfileUI';
import DailyGoalUI from './components/organisms/DailyGoalUI';
import FlashcardUI from './components/organisms/FlashcardUI';
import VocabularyListUI from './components/organisms/VocabularyListUI';
import VocabularyReviewUI from './components/organisms/VocabularyReviewUI';
import AdminUserManagementUI from './components/organisms/AdminUserManagementUI';
import AdminQuestionManagementUI from './components/organisms/AdminQuestionManagementUI';
import AdminVocabularyManagementUI from './components/organisms/AdminVocabularyManagementUI';
import AdminDashboardUI from './components/organisms/AdminDashboardUI';
import AdminLayout, { AdminPage } from './components/organisms/AdminLayout';
import StudyPlanDashboardUI from './components/organisms/StudyPlanDashboardUI';
import DailyChecklistUI from './components/organisms/DailyChecklistUI';
import { TodaysMissionUI, TodaysMissionData, DailyMission } from './components/organisms/TodaysMissionUI';
import { WrongAnswersUI } from './components/organisms/WrongAnswersUI';
import { SRSReviewListUI } from './components/organisms/SRSReviewListUI';
import { n5StudyPlan } from './data/study-plan-data';
import { MainLayout } from './components/organisms/MainLayout';
import { DashboardUI, DashboardAction, KPIData } from './components/organisms/DashboardUI';
import { SidebarItem } from './components/organisms/Sidebar';
import { Test, Result, UserPerformance, UserHistory, UserProfile, Question, Vocabulary } from './types/api';
import { testApi, resultApi, userApi, studyApi, vocabularyApi, ApiError } from './services/api';
import { authService, User } from './services/auth';

type AppState = 'login' | 'onboarding' | 'initial' | 'study-plan' | 'todays-mission' | 'daily-checklist' | 'study-select' | 'study' | 'study-mode' | 'wrong-answers' | 'srs-review' | 'repeat-study' | 'loading' | 'test' | 'submitting' | 'result' | 'performance' | 'history' | 'profile' | 'daily-goal' | 'vocabulary' | 'vocabulary-list' | 'vocabulary-review' | 'admin-dashboard' | 'admin-users' | 'admin-questions' | 'admin-vocabulary' | 'error';

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
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [currentBadge, setCurrentBadge] = useState<Badge | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [showBadgeCollection, setShowBadgeCollection] = useState(false);
  
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
          // 온보딩 완료 여부 확인
          const onboardingCompleted = localStorage.getItem('onboarding_completed');
          if (!onboardingCompleted) {
            setState('onboarding');
          } else {
            setState('initial');
          }
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
      // 온보딩 완료 여부 확인
      const onboardingCompleted = localStorage.getItem('onboarding_completed');
      if (!onboardingCompleted) {
        setState('onboarding');
      } else {
        setState('initial');
      }
    }
  };

  // 온보딩 완료
  const handleOnboardingComplete = (data: OnboardingData) => {
    // 온보딩 데이터 저장
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('onboarding_data', JSON.stringify(data));
    
    // Today Mission으로 이동
    setSelectedWeek(1);
    setSelectedDay(1);
    setState('todays-mission');
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
        // 401 에러인 경우 로그인 화면으로
        if (err.status === 401) {
          setState('login');
        } else if (err.status === 400) {
          setError(err.message || '잘못된 요청입니다.');
          setState('error');
        } else if (err.status === 500) {
          setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
          setState('error');
        } else {
          setError(err.message || '학습 세션 제출 중 오류가 발생했습니다.');
          setState('error');
        }
      } else if (err instanceof Error) {
        // 네트워크 에러 등
        if (err.message.includes('fetch') || err.message.includes('network')) {
          setError('네트워크 연결을 확인해주세요.');
        } else {
          setError(err.message || '학습 세션 제출 중 오류가 발생했습니다.');
        }
        setState('error');
      } else {
        setError('학습 세션 제출 중 오류가 발생했습니다.');
        setState('error');
      }
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

  // 일일 목표 조회
  const handleViewDailyGoal = async () => {
    // 인증 확인
    if (!authService.isAuthenticated() || !user) {
      setState('login');
      return;
    }

    setState('daily-goal');
  };

  // 프로필 업데이트
  const handleProfileUpdate = async (updates: { username?: string; target_level?: string }) => {
    if (!user) {
      setError('사용자 정보가 없습니다.');
      setState('error');
      return;
    }

    setError(null);

    try {
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
    } catch (err) {
      if (err instanceof ApiError) {
        // 401 에러인 경우 로그인 화면으로
        if (err.status === 401) {
          setState('login');
        } else if (err.status === 400) {
          setError(err.message || '잘못된 요청입니다.');
        } else if (err.status === 500) {
          setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } else {
          setError(err.message || '프로필 업데이트 중 오류가 발생했습니다.');
        }
      } else if (err instanceof Error) {
        // 네트워크 에러 등
        if (err.message.includes('fetch') || err.message.includes('network')) {
          setError('네트워크 연결을 확인해주세요.');
        } else {
          setError(err.message || '프로필 업데이트 중 오류가 발생했습니다.');
        }
      } else {
        setError('프로필 업데이트 중 오류가 발생했습니다.');
      }
      setState('error');
    }
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

  // SRS 복습 리스트로 학습 시작
  const handleStartSRSReview = async (questions: Question[]) => {
    setCurrentStudyQuestions(questions);
    setState('study');
  };

  // SRS 복습 리스트 조회
  const handleViewSRSReview = () => {
    setState('srs-review');
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
        if (err.status === 401) {
          setState('login');
        } else if (err.status === 404) {
          setError('단어를 찾을 수 없습니다.');
        } else if (err.status === 500) {
          setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } else {
          setError(err.message || '암기 상태 업데이트 중 오류가 발생했습니다.');
        }
      } else if (err instanceof Error) {
        if (err.message.includes('fetch') || err.message.includes('network')) {
          setError('네트워크 연결을 확인해주세요.');
        } else {
          setError(err.message || '암기 상태 업데이트 중 오류가 발생했습니다.');
        }
      } else {
        setError('암기 상태 업데이트 중 오류가 발생했습니다.');
      }
      setState('error');
    }
  };

  // Helper: Generate sidebar items
  const getSidebarItems = (): SidebarItem[] => {
    const iconStyle = { width: 20, height: 20 };
    return [
      {
        id: 'dashboard',
        label: '대시보드',
        icon: (
          <svg {...iconStyle} viewBox="0 0 24 24" fill="none">
            <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" stroke="currentColor" strokeWidth="2" fill="currentColor" />
          </svg>
        ),
        onClick: () => setState('initial'),
        active: state === 'initial'
      },
      {
        id: 'study-plan',
        label: '6주 학습 계획',
        icon: (
          <svg {...iconStyle} viewBox="0 0 24 24" fill="none">
            <path d="M9 11L12 14L22 4M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
        onClick: () => setState('study-plan'),
        active: state === 'study-plan' || state === 'daily-checklist'
      },
      {
        id: 'test',
        label: '테스트 모드',
        icon: (
          <svg {...iconStyle} viewBox="0 0 24 24" fill="none">
            <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M12 12H15M12 16H15M9 12H9.01M9 16H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ),
        onClick: handleStartTest,
        active: state === 'test' || state === 'result'
      },
      {
        id: 'study',
        label: '학습 모드',
        icon: (
          <svg {...iconStyle} viewBox="0 0 24 24" fill="none">
            <path d="M12 6.253V13.5L15.5 15.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
        onClick: handleStartStudy,
        active: state === 'study' || state === 'study-select'
      },
      {
        id: 'vocabulary',
        label: '단어 학습',
        icon: (
          <svg {...iconStyle} viewBox="0 0 24 24" fill="none">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6.5 2H20V22H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
        onClick: handleStartVocabulary,
        active: state === 'vocabulary' || state === 'vocabulary-list' || state === 'vocabulary-review'
      },
      {
        id: 'grammar',
        label: '문법 학습',
        icon: (
          <svg {...iconStyle} viewBox="0 0 24 24" fill="none">
            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ),
        onClick: () => handleStartStudyMode('N5', ['grammar'], 20),
        active: false
      },
      {
        id: 'wrong-answers',
        label: '오답 노트',
        icon: (
          <svg {...iconStyle} viewBox="0 0 24 24" fill="none">
            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
        onClick: handleViewWrongAnswers,
        active: state === 'wrong-answers' || state === 'srs-review'
      },
      {
        id: 'analytics',
        label: '성능 분석',
        icon: (
          <svg {...iconStyle} viewBox="0 0 24 24" fill="none">
            <path d="M3 3V21H21M7 16L12 11L16 15L21 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 10H16V15H21V10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
        onClick: handleViewPerformance,
        active: state === 'performance'
      },
      {
        id: 'profile',
        label: '프로필/설정',
        icon: (
          <svg {...iconStyle} viewBox="0 0 24 24" fill="none">
            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
        onClick: handleViewProfile,
        active: state === 'profile' || state === 'daily-goal' || state === 'history'
      }
    ];
  };

  // Helper: Generate dashboard actions
  const getDashboardActions = (): DashboardAction[] => {
    const iconStyle = { width: 24, height: 24 };
    return [
      {
        id: 'study-plan',
        title: '6주 학습 계획',
        description: '오늘의 미션 시작',
        icon: (
          <svg {...iconStyle} viewBox="0 0 24 24" fill="none">
            <path d="M9 11L12 14L22 4M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
        onClick: () => setState('study-plan')
      },
      {
        id: 'test',
        title: '테스트 모드',
        description: 'N5 진단 테스트',
        icon: (
          <svg {...iconStyle} viewBox="0 0 24 24" fill="none">
            <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ),
        onClick: handleStartTest
      },
      {
        id: 'study',
        title: '학습 모드',
        description: '유형별 문제 학습',
        icon: (
          <svg {...iconStyle} viewBox="0 0 24 24" fill="none">
            <path d="M12 6.253V13.5L15.5 15.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
        onClick: handleStartStudy
      },
      {
        id: 'analytics',
        title: '성능 분석 보기',
        description: '학습 통계 확인',
        icon: (
          <svg {...iconStyle} viewBox="0 0 24 24" fill="none">
            <path d="M3 3V21H21M7 16L12 11L16 15L21 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
        onClick: handleViewPerformance
      },
      {
        id: 'vocabulary',
        title: '단어 학습',
        description: '플래시카드 학습',
        icon: (
          <svg {...iconStyle} viewBox="0 0 24 24" fill="none">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6.5 2H20V22H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
        onClick: handleStartVocabulary
      },
      {
        id: 'grammar',
        title: '문법 학습',
        description: '문법 패턴 연습',
        icon: (
          <svg {...iconStyle} viewBox="0 0 24 24" fill="none">
            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
        onClick: () => handleStartStudyMode('N5', ['grammar'], 20)
      },
      {
        id: 'history',
        title: '학습 이력 보기',
        description: '과거 학습 기록',
        icon: (
          <svg {...iconStyle} viewBox="0 0 24 24" fill="none">
            <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
        onClick: handleViewHistory
      },
      {
        id: 'wrong-answers',
        title: '오답 노트',
        description: '틀린 문제 복습',
        icon: (
          <svg {...iconStyle} viewBox="0 0 24 24" fill="none">
            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
        onClick: handleViewWrongAnswers
      }
    ];
  };

  // Helper: Get KPI data (mock for now, will be replaced with real data)
  const getKPIData = (): KPIData => {
    return {
      recentScore: currentResult?.score,
      streakDays: user?.study_streak || 0,
      totalStudyCount: currentHistory.length || 0,
      weeklyStudyTime: 120, // TODO: Calculate from history
      weeklyGoalMinutes: 180,
      weeklyGoalAchievement: 67 // TODO: Calculate from actual data
    };
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
  
  // Pages that should use MainLayout
  const shouldUseMainLayout = !isAdminPage && state !== 'login' && state !== 'loading' && user && !user.is_admin;

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

        {state === 'onboarding' && (
          <section className="onboarding-section">
            <OnboardingUI onComplete={handleOnboardingComplete} />
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

        {state === 'daily-checklist' && !user?.is_admin && shouldUseMainLayout && (
          <MainLayout
            sidebarItems={getSidebarItems()}
            headerProps={{
              title: `${selectedWeek}주차 ${selectedDay}일차 미션`,
              user: user ? { username: user.username } : undefined,
              onProfileClick: handleViewProfile,
              onNotificationClick: () => setState('study-plan'),
            }}
          >
            <TodaysMissionUI
              data={(() => {
                const weekPlan = n5StudyPlan.weeks.find(w => w.week === selectedWeek);
                const dailyTask = weekPlan?.dailyTasks.find(t => t.day === selectedDay);
                if (!dailyTask) {
                  return {
                    week: selectedWeek,
                    day: selectedDay,
                    totalMissions: 0,
                    completedMissions: 0,
                    missions: [],
                    recoveryPlanAvailable: false
                  };
                }

                // Get completion status from localStorage
                const saved = localStorage.getItem(`studyPlan_day${selectedDay}_completed`);
                let completedTasks: any = {};
                if (saved) {
                  try {
                    completedTasks = JSON.parse(saved);
                  } catch (e) {
                    // Ignore parse errors
                  }
                }

                const missions: DailyMission[] = [];
                
                // Vocabulary mission
                if (dailyTask.tasks.vocabulary) {
                  missions.push({
                    id: 'vocabulary',
                    type: 'vocabulary',
                    title: '단어 학습',
                    count: dailyTask.tasks.vocabulary,
                    estimatedMinutes: Math.ceil(dailyTask.tasks.vocabulary / 2),
                    completed: completedTasks.vocabulary || false,
                    onClick: () => handleStartDailyStudy('vocabulary', dailyTask.tasks.vocabulary)
                  });
                }

                // Grammar mission
                if (dailyTask.tasks.grammar) {
                  missions.push({
                    id: 'grammar',
                    type: 'grammar',
                    title: '문법 학습',
                    count: dailyTask.tasks.grammar,
                    estimatedMinutes: dailyTask.tasks.grammar * 5,
                    completed: completedTasks.grammar || false,
                    onClick: () => handleStartDailyStudy('grammar', dailyTask.tasks.grammar)
                  });
                }

                // Reading mission
                if (dailyTask.tasks.reading) {
                  missions.push({
                    id: 'reading',
                    type: 'reading',
                    title: '독해 연습',
                    count: dailyTask.tasks.reading,
                    estimatedMinutes: dailyTask.tasks.reading * 3,
                    completed: completedTasks.reading || false,
                    onClick: () => handleStartDailyStudy('reading', dailyTask.tasks.reading)
                  });
                }

                // Listening mission
                if (dailyTask.tasks.listening) {
                  missions.push({
                    id: 'listening',
                    type: 'listening',
                    title: '청해 연습',
                    count: dailyTask.tasks.listening,
                    estimatedMinutes: dailyTask.tasks.listening * 4,
                    completed: completedTasks.listening || false,
                    onClick: () => handleStartDailyStudy('listening', dailyTask.tasks.listening)
                  });
                }

                // Mock test mission
                if (dailyTask.tasks.mockTest) {
                  missions.push({
                    id: 'test',
                    type: 'test',
                    title: '미니 테스트',
                    count: 10,
                    estimatedMinutes: 15,
                    completed: completedTasks.mockTest || false,
                    onClick: () => handleStartDailyStudy('mockTest')
                  });
                }

                const completedMissions = missions.filter(m => m.completed).length;
                const totalMissions = missions.length;

                // Check if recovery plan is needed (less than 50% completed and it's past the current day)
                const currentDay = parseInt(localStorage.getItem('studyPlan_currentDay') || '1', 10);
                const recoveryPlanAvailable = selectedDay < currentDay && completedMissions < totalMissions / 2;

                return {
                  week: selectedWeek,
                  day: selectedDay,
                  totalMissions,
                  completedMissions,
                  missions,
                  recoveryPlanAvailable
                };
              })()}
              onStartMission={(missionId) => {
                const weekPlan = n5StudyPlan.weeks.find(w => w.week === selectedWeek);
                const dailyTask = weekPlan?.dailyTasks.find(t => t.day === selectedDay);
                if (!dailyTask) return;

                if (missionId === 'vocabulary') {
                  handleStartDailyStudy('vocabulary', dailyTask.tasks.vocabulary);
                } else if (missionId === 'grammar') {
                  handleStartDailyStudy('grammar', dailyTask.tasks.grammar);
                } else if (missionId === 'reading') {
                  handleStartDailyStudy('reading', dailyTask.tasks.reading);
                } else if (missionId === 'listening') {
                  handleStartDailyStudy('listening', dailyTask.tasks.listening);
                } else if (missionId === 'test') {
                  handleStartDailyStudy('mockTest');
                }
              }}
              onStartRecoveryPlan={() => {
                // Recovery plan: minimal catch-up mission
                handleStartDailyStudy('vocabulary', 10);
              }}
              onBack={() => setState('study-plan')}
            />
          </MainLayout>
        )}

        {/* Fallback to old DailyChecklistUI for non-layout pages */}
        {state === 'daily-checklist' && !user?.is_admin && !shouldUseMainLayout && (
          <section className="daily-checklist-section">
            <DailyChecklistUI
              day={selectedDay}
              week={selectedWeek}
              onStartStudy={handleStartDailyStudy}
              onBack={() => setState('study-plan')}
            />
          </section>
        )}

        {state === 'initial' && shouldUseMainLayout && (
          <MainLayout
            sidebarItems={getSidebarItems()}
            headerProps={{
              title: '대시보드',
              user: user ? { username: user.username } : undefined,
              onProfileClick: handleViewProfile,
              onNotificationClick: () => setState('study-plan'),
              onSearch: (query) => {
                // TODO: Implement search
                console.log('Search:', query);
              }
            }}
          >
            <DashboardUI
              kpiData={getKPIData()}
              actions={getDashboardActions()}
              onStartStudy={() => setState('study-plan')}
            />
          </MainLayout>
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
            <ResultUI
              result={currentResult}
              testQuestions={currentTest?.questions.map(q => ({
                id: q.id,
                question_text: q.question_text,
                choices: q.choices,
                correct_answer: q.correct_answer || '',
                explanation: q.explanation,
                question_type: q.question_type,
                difficulty: q.difficulty,
                user_answer: '', // Will be filled from answer details
                is_correct: false, // Will be filled from answer details
                time_spent_seconds: 0 // Will be filled from answer details
              }))}
              onRetry={() => {
                if (currentTest) {
                  handleStartTest();
                }
              }}
              onRetryWrongOnly={() => {
                // 틀린 문제만 다시 풀기 - 추후 구현
                handleRestart();
              }}
              onViewWrongAnswers={() => {
                setState('wrong-answers');
              }}
            />
          </section>
        )}

        {state === 'performance' && currentPerformance && (
          <section className="performance-section">
            <AnalyticsUI
              performance={currentPerformance}
              previousPerformance={undefined} // TODO: 이전 주 데이터 가져오기
              onStartStudy={(type) => {
                handleStartStudyMode('N5', [type], 20);
              }}
              onViewWrongAnswers={() => {
                setState('wrong-answers');
              }}
            />
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

        {state === 'daily-goal' && user && (
          <section className="daily-goal-section">
            <DailyGoalUI userId={user.id} />
            <div className="daily-goal-actions">
              <button onClick={handleRestart} className="back-button">
                돌아가기
              </button>
            </div>
          </section>
        )}

        {state === 'wrong-answers' && shouldUseMainLayout && (
          <MainLayout
            sidebarItems={getSidebarItems()}
            headerProps={{
              title: '오답 노트',
              user: user ? { username: user.username } : undefined,
              onProfileClick: handleViewProfile,
              onNotificationClick: () => setState('study-plan'),
            }}
          >
            <WrongAnswersUI
              questions={currentStudyQuestions}
              onStartStudy={handleStartWrongAnswerStudy}
              onViewSRSReview={handleViewSRSReview}
              onBack={() => setState('initial')}
              isLoading={false}
            />
          </MainLayout>
        )}

        {/* Fallback for non-layout pages */}
        {state === 'wrong-answers' && !shouldUseMainLayout && (
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

        {state === 'vocabulary-review' && (
          <section className="vocabulary-review-section">
            <VocabularyReviewUI
              onBack={() => setState('initial')}
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
