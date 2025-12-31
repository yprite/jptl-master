/**
 * AdminUserManagementUI 컴포넌트 테스트
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import AdminUserManagementUI from '../../components/organisms/AdminUserManagementUI';
import { AdminUser } from '../../types/api';

// fetch 모킹
global.fetch = jest.fn() as jest.Mock;

const mockUsers: AdminUser[] = [
  {
    id: 1,
    email: 'user1@example.com',
    username: 'user1',
    target_level: 'N5',
    current_level: null,
    total_tests_taken: 0,
    study_streak: 0,
    is_admin: false,
  },
  {
    id: 2,
    email: 'admin@example.com',
    username: 'admin',
    target_level: 'N3',
    current_level: 'N4',
    total_tests_taken: 5,
    study_streak: 3,
    is_admin: true,
  },
];

describe('AdminUserManagementUI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockUsers }),
      headers: new Headers({ 'content-type': 'application/json' }),
    });
  });

  it('should display user list on initial load', async () => {
    render(<AdminUserManagementUI />);

    await waitFor(() => {
      expect(screen.getByText('사용자 관리')).toBeInTheDocument();
      expect(screen.getByText('전체 사용자 목록')).toBeInTheDocument();
    });

    // 사용자 목록 테이블 확인
    expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
  });

  it('should display user details when clicking view button', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockUsers }),
      headers: new Headers({ 'content-type': 'application/json' }),
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockUsers[0] }),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    render(<AdminUserManagementUI />);

    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText('상세보기');
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('사용자 상세 정보')).toBeInTheDocument();
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      expect(screen.getByText('user1')).toBeInTheDocument();
    });
  });

  it('should switch to edit mode when clicking edit button', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockUsers }),
      headers: new Headers({ 'content-type': 'application/json' }),
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockUsers[0] }),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    render(<AdminUserManagementUI />);

    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText('상세보기');
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('사용자 상세 정보')).toBeInTheDocument();
    });

    const editButton = screen.getByText('수정');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('사용자 정보 수정')).toBeInTheDocument();
      expect(screen.getByDisplayValue('user1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('N5')).toBeInTheDocument();
    });
  });

  it('should update user when saving edit form', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUsers }),
        headers: new Headers({ 'content-type': 'application/json' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUsers[0] }),
        headers: new Headers({ 'content-type': 'application/json' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { ...mockUsers[0], username: 'updated_user', target_level: 'N4' },
        }),
        headers: new Headers({ 'content-type': 'application/json' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUsers }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

    render(<AdminUserManagementUI />);

    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText('상세보기');
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('사용자 상세 정보')).toBeInTheDocument();
    });

    const editButton = screen.getByText('수정');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('사용자 정보 수정')).toBeInTheDocument();
    });

    const usernameInput = screen.getByDisplayValue('user1') as HTMLInputElement;
    fireEvent.change(usernameInput, { target: { value: 'updated_user' } });

    const levelSelect = screen.getByDisplayValue('N5') as HTMLSelectElement;
    fireEvent.change(levelSelect, { target: { value: 'N4' } });

    const saveButton = screen.getByText('저장');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('사용자 상세 정보')).toBeInTheDocument();
      expect(screen.getByText('updated_user')).toBeInTheDocument();
    });
  });

  it('should delete user when clicking delete button and confirming', async () => {
    window.confirm = jest.fn(() => true);

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUsers }),
        headers: new Headers({ 'content-type': 'application/json' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUsers[0] }),
        headers: new Headers({ 'content-type': 'application/json' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: '사용자가 성공적으로 삭제되었습니다' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUsers }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

    render(<AdminUserManagementUI />);

    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText('상세보기');
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('사용자 상세 정보')).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('삭제');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('정말로 사용자 "user1"을(를) 삭제하시겠습니까?');
    });

    await waitFor(() => {
      expect(screen.getByText('전체 사용자 목록')).toBeInTheDocument();
    });
  });

  it('should display error message when API call fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ detail: '서버 오류가 발생했습니다' }),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    render(<AdminUserManagementUI />);

    await waitFor(() => {
      expect(screen.getByText(/서버 오류가 발생했습니다|오류가 발생했습니다/)).toBeInTheDocument();
    });
  });

  it('should refresh user list when clicking refresh button', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockUsers }),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    render(<AdminUserManagementUI />);

    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('새로고침');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    });
  });

  it('should navigate back to list from detail view', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUsers }),
        headers: new Headers({ 'content-type': 'application/json' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUsers[0] }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

    render(<AdminUserManagementUI />);

    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText('상세보기');
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('사용자 상세 정보')).toBeInTheDocument();
    });

    const backButton = screen.getByText('목록으로');
    fireEvent.click(backButton);

    await waitFor(() => {
      expect(screen.getByText('전체 사용자 목록')).toBeInTheDocument();
    });
  });

  it('should call onBack callback when provided', async () => {
    const onBack = jest.fn();

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockUsers }),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    render(<AdminUserManagementUI onBack={onBack} />);

    await waitFor(() => {
      expect(screen.getByText('사용자 관리')).toBeInTheDocument();
    });

    const backButton = screen.getByText('뒤로 가기');
    fireEvent.click(backButton);

    expect(onBack).toHaveBeenCalled();
  });

  it('should display empty message when no users exist', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] }),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    render(<AdminUserManagementUI />);

    await waitFor(() => {
      expect(screen.getByText('등록된 사용자가 없습니다.')).toBeInTheDocument();
    });
  });

  it('should cancel edit and return to detail view', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUsers }),
        headers: new Headers({ 'content-type': 'application/json' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUsers[0] }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

    render(<AdminUserManagementUI />);

    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText('상세보기');
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('사용자 상세 정보')).toBeInTheDocument();
    });

    const editButton = screen.getByText('수정');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('사용자 정보 수정')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('취소');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText('사용자 상세 정보')).toBeInTheDocument();
    });
  });
});

