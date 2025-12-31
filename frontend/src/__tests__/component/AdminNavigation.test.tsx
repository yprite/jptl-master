/**
 * AdminNavigation 컴포넌트 테스트
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminNavigation from '../../components/organisms/AdminNavigation';

describe('AdminNavigation', () => {
  it('should render all navigation items', () => {
    const mockOnNavigate = jest.fn();

    render(<AdminNavigation currentPage="admin-dashboard" onNavigate={mockOnNavigate} />);

    expect(screen.getByText('대시보드')).toBeInTheDocument();
    expect(screen.getByText('사용자 관리')).toBeInTheDocument();
    expect(screen.getByText('문제 관리')).toBeInTheDocument();
  });

  it('should highlight current page', () => {
    const mockOnNavigate = jest.fn();

    render(<AdminNavigation currentPage="admin-dashboard" onNavigate={mockOnNavigate} />);

    const dashboardButton = screen.getByText('대시보드');
    expect(dashboardButton).toHaveClass('active');
  });

  it('should call onNavigate when navigation item is clicked', () => {
    const mockOnNavigate = jest.fn();

    render(<AdminNavigation currentPage="admin-dashboard" onNavigate={mockOnNavigate} />);

    const usersButton = screen.getByText('사용자 관리');
    fireEvent.click(usersButton);

    expect(mockOnNavigate).toHaveBeenCalledWith('admin-users');
  });

  it('should call onBack when back button is clicked', () => {
    const mockOnNavigate = jest.fn();
    const mockOnBack = jest.fn();

    render(
      <AdminNavigation
        currentPage="admin-dashboard"
        onNavigate={mockOnNavigate}
        onBack={mockOnBack}
      />
    );

    const backButton = screen.getByText('뒤로');
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });
});

