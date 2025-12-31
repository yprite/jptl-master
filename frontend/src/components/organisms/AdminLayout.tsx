/**
 * 어드민 레이아웃 컴포넌트
 * 어드민 페이지들을 감싸는 공통 레이아웃 및 권한 체크
 */

import React, { useEffect } from 'react';
import AdminNavigation from './AdminNavigation';
import type { AdminPage } from './AdminNavigation';
import { authService } from '../../services/auth';
import './AdminLayout.css';

interface AdminLayoutProps {
  currentPage: AdminPage;
  onNavigate: (page: AdminPage) => void;
  onBack?: () => void;
  onLogout?: () => void;
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentPage,
  onNavigate,
  onBack,
  onLogout,
  children,
}) => {
  const user = authService.getCurrentUser();
  const isAuthenticated = authService.isAuthenticated();
  const isAdmin = user?.is_admin === true;

  // 권한 체크 및 리다이렉트
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      // 권한이 없으면 초기 페이지로 리다이렉트
      if (onBack) {
        onBack();
      }
    }
  }, [isAuthenticated, isAdmin, onBack]);

  // 권한이 없으면 렌더링하지 않음
  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <h1>JLPT 자격 검증 프로그램 - 어드민</h1>
        {user && (
          <div className="admin-user-info">
            <span>어드민: {user.username}님</span>
            {onBack && (
              <button
                onClick={onBack}
                className="admin-back-button"
                aria-label="일반 페이지로 돌아가기"
              >
                일반 페이지로
              </button>
            )}
            {onLogout && (
              <button
                onClick={onLogout}
                className="admin-logout-button"
                aria-label="로그아웃"
              >
                로그아웃
              </button>
            )}
          </div>
        )}
      </header>
      <AdminNavigation
        currentPage={currentPage}
        onNavigate={onNavigate}
        onBack={onBack}
      />
      <div className="admin-layout-content">{children}</div>
    </div>
  );
};

export type { AdminPage };
export default AdminLayout;

