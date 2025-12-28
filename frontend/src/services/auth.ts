/**
 * 인증 관리 서비스
 * 세션 기반 인증 상태 관리
 */

import { authApi, userApi, ApiError } from './api';

export interface User {
  id: number;
  email: string;
  username: string;
  target_level: string;
  current_level: string | null;
  total_tests_taken: number;
  study_streak: number;
}

class AuthService {
  private currentUser: User | null = null;
  private listeners: Array<(user: User | null) => void> = [];

  /**
   * 인증 상태 변경 리스너 등록
   */
  subscribe(listener: (user: User | null) => void): () => void {
    this.listeners.push(listener);
    // 구독 즉시 현재 상태 전달
    listener(this.currentUser);
    
    // 구독 해제 함수 반환
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * 리스너들에게 상태 변경 알림
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.currentUser));
  }

  /**
   * 현재 사용자 정보 가져오기
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * 로그인 상태 확인
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * 로그인
   */
  async login(email: string): Promise<User> {
    try {
      const loginData = await authApi.login(email);
      
      // 사용자 정보 조회
      const user = await userApi.getCurrentUser();
      this.currentUser = user;
      this.notifyListeners();
      
      return user;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('로그인 중 오류가 발생했습니다.');
    }
  }

  /**
   * 로그아웃
   */
  async logout(): Promise<void> {
    try {
      await authApi.logout();
      this.currentUser = null;
      this.notifyListeners();
    } catch (error) {
      // 로그아웃 실패해도 로컬 상태는 초기화
      this.currentUser = null;
      this.notifyListeners();
      throw error;
    }
  }

  /**
   * 현재 사용자 정보 새로고침
   */
  async refreshUser(): Promise<User | null> {
    try {
      const user = await userApi.getCurrentUser();
      this.currentUser = user;
      this.notifyListeners();
      return user;
    } catch (error) {
      // 인증 실패 시 로그아웃 처리
      if (error instanceof ApiError && error.status === 401) {
        this.currentUser = null;
        this.notifyListeners();
      }
      return null;
    }
  }

  /**
   * 초기화 시 사용자 정보 확인
   */
  async initialize(): Promise<void> {
    try {
      await this.refreshUser();
    } catch (error) {
      // 초기화 실패는 무시 (로그인하지 않은 상태일 수 있음)
    }
  }
}

// 싱글톤 인스턴스
export const authService = new AuthService();
