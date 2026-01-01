/**
 * 어드민 네비게이션 컴포넌트
 */

import React from 'react';
import './AdminNavigation.css';

export type AdminPage = 'admin-dashboard' | 'admin-users' | 'admin-questions' | 'admin-vocabulary';

interface AdminNavigationProps {
  currentPage: AdminPage;
  onNavigate: (page: AdminPage) => void;
  onBack?: () => void;
}

const AdminNavigation: React.FC<AdminNavigationProps> = ({
  currentPage,
  onNavigate,
  onBack,
}) => {
  const navigationItems: Array<{ key: AdminPage; label: string }> = [
    { key: 'admin-dashboard', label: '대시보드' },
    { key: 'admin-users', label: '사용자 관리' },
    { key: 'admin-questions', label: '문제 관리' },
    { key: 'admin-vocabulary', label: '단어 관리' },
  ];

  return (
    <nav className="admin-navigation" role="navigation" aria-label="어드민 메뉴">
      <div className="admin-navigation-header">
        <h2>어드민 관리</h2>
        {onBack && (
          <button
            onClick={onBack}
            className="admin-navigation-back"
            aria-label="뒤로 가기"
          >
            뒤로
          </button>
        )}
      </div>
      <ul className="admin-navigation-menu">
        {navigationItems.map((item) => (
          <li key={item.key}>
            <button
              onClick={() => onNavigate(item.key)}
              className={`admin-navigation-item ${
                currentPage === item.key ? 'active' : ''
              }`}
              aria-current={currentPage === item.key ? 'page' : undefined}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default AdminNavigation;

