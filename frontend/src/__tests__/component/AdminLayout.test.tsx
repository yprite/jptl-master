/**
 * AdminLayout 컴포넌트 테스트
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminLayout from '../../components/organisms/AdminLayout';
import { authService } from '../../services/auth';

// authService 모킹
jest.mock('../../services/auth', () => ({
  authService: {
    getCurrentUser: jest.fn(),
    isAuthenticated: jest.fn(),
  },
}));

describe('AdminLayout', () => {
  const mockGetCurrentUser = authService.getCurrentUser as jest.Mock;
  const mockIsAuthenticated = authService.isAuthenticated as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when user is admin', () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockGetCurrentUser.mockReturnValue({
      id: 1,
      email: 'admin@test.com',
      username: 'admin',
      is_admin: true,
    });

    const mockOnNavigate = jest.fn();

    render(
      <AdminLayout currentPage="admin-dashboard" onNavigate={mockOnNavigate}>
        <div>Admin Content</div>
      </AdminLayout>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('should render navigation menu when user is admin', () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockGetCurrentUser.mockReturnValue({
      id: 1,
      email: 'admin@test.com',
      username: 'admin',
      is_admin: true,
    });

    const mockOnNavigate = jest.fn();

    render(
      <AdminLayout currentPage="admin-dashboard" onNavigate={mockOnNavigate}>
        <div>Admin Content</div>
      </AdminLayout>
    );

    expect(screen.getByText('대시보드')).toBeInTheDocument();
    expect(screen.getByText('사용자 관리')).toBeInTheDocument();
    expect(screen.getByText('문제 관리')).toBeInTheDocument();
  });

  it('should redirect to login when user is not authenticated', () => {
    mockIsAuthenticated.mockReturnValue(false);
    mockGetCurrentUser.mockReturnValue(null);

    const mockOnNavigate = jest.fn();
    const mockOnBack = jest.fn();

    const { container } = render(
      <AdminLayout
        currentPage="admin-dashboard"
        onNavigate={mockOnNavigate}
        onBack={mockOnBack}
      >
        <div>Admin Content</div>
      </AdminLayout>
    );

    // 리다이렉트가 발생하면 children이 렌더링되지 않음
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    // onBack이 호출되어야 함
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('should redirect to initial page when user is not admin', () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockGetCurrentUser.mockReturnValue({
      id: 1,
      email: 'user@test.com',
      username: 'user',
      is_admin: false,
    });

    const mockOnNavigate = jest.fn();
    const mockOnBack = jest.fn();

    const { container } = render(
      <AdminLayout
        currentPage="admin-dashboard"
        onNavigate={mockOnNavigate}
        onBack={mockOnBack}
      >
        <div>Admin Content</div>
      </AdminLayout>
    );

    // 리다이렉트가 발생하면 children이 렌더링되지 않음
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    // onBack이 호출되어야 함
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('should call onNavigate when navigation item is clicked', () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockGetCurrentUser.mockReturnValue({
      id: 1,
      email: 'admin@test.com',
      username: 'admin',
      is_admin: true,
    });

    const mockOnNavigate = jest.fn();

    render(
      <AdminLayout currentPage="admin-dashboard" onNavigate={mockOnNavigate}>
        <div>Admin Content</div>
      </AdminLayout>
    );

    const usersButton = screen.getByText('사용자 관리');
    usersButton.click();

    expect(mockOnNavigate).toHaveBeenCalledWith('admin-users');
  });
});

