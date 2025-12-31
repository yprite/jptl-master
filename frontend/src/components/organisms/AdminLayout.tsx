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
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentPage,
  onNavigate,
  onBack,
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

