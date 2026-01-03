/**
 * UserProfileUI 컴포넌트 테스트
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import UserProfileUI from '../../components/organisms/UserProfileUI';
import { UserProfile } from '../../types/api';

const mockProfile: UserProfile = {
  id: 1,
  email: 'test@example.com',
  username: 'testuser',
  target_level: 'N5',
  current_level: 'N5',
  total_tests_taken: 10,
  study_streak: 5,
};

describe('UserProfileUI', () => {
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    mockOnUpdate.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render profile title', () => {
    render(<UserProfileUI profile={mockProfile} onUpdate={mockOnUpdate} />);
    expect(screen.getByText('프로필 관리')).toBeInTheDocument();
  });

  it('should display profile information', () => {
    render(<UserProfileUI profile={mockProfile} onUpdate={mockOnUpdate} />);
    expect(screen.getByText('이메일')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('사용자명')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('목표 레벨')).toBeInTheDocument();
    // N5는 목표 레벨과 현재 레벨 모두에 나타나므로 getAllByText 사용
    const n5Elements = screen.getAllByText('N5');
    expect(n5Elements.length).toBeGreaterThan(0);
    expect(screen.getByText('현재 레벨')).toBeInTheDocument();
    expect(screen.getByText('테스트 횟수')).toBeInTheDocument();
    expect(screen.getByText('10회')).toBeInTheDocument();
    expect(screen.getByText('연속 학습일')).toBeInTheDocument();
    expect(screen.getByText('5일')).toBeInTheDocument();
  });

  it('should display edit button', () => {
    render(<UserProfileUI profile={mockProfile} onUpdate={mockOnUpdate} />);
    const editButton = screen.getByRole('button', { name: /수정/i });
    expect(editButton).toBeInTheDocument();
  });

  it('should switch to edit mode when edit button is clicked', async () => {
    render(<UserProfileUI profile={mockProfile} onUpdate={mockOnUpdate} />);
    
    const editButton = screen.getByRole('button', { name: /수정/i });
    fireEvent.click(editButton);

    expect(screen.getByLabelText(/사용자명 입력/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/목표 레벨 선택/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /저장/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /취소/i })).toBeInTheDocument();
  });

  it('should allow editing username', async () => {
    render(<UserProfileUI profile={mockProfile} onUpdate={mockOnUpdate} />);
    
    const editButton = screen.getByRole('button', { name: /수정/i });
    fireEvent.click(editButton);

    const usernameInput = screen.getByLabelText(/사용자명 입력/i) as HTMLInputElement;
    fireEvent.change(usernameInput, { target: { value: 'newusername' } });

    expect(usernameInput.value).toBe('newusername');
  });

  it('should allow editing target level', async () => {
    render(<UserProfileUI profile={mockProfile} onUpdate={mockOnUpdate} />);
    
    const editButton = screen.getByRole('button', { name: /수정/i });
    fireEvent.click(editButton);

    const targetLevelSelect = screen.getByLabelText(/목표 레벨 선택/i) as HTMLSelectElement;
    fireEvent.change(targetLevelSelect, { target: { value: 'N4' } });

    expect(targetLevelSelect.value).toBe('N4');
  });

  it('should call onUpdate when save button is clicked', async () => {
    render(<UserProfileUI profile={mockProfile} onUpdate={mockOnUpdate} />);
    
    const editButton = screen.getByRole('button', { name: /수정/i });
    fireEvent.click(editButton);

    const usernameInput = screen.getByLabelText(/사용자명 입력/i) as HTMLInputElement;
    fireEvent.change(usernameInput, { target: { value: 'newusername' } });

    const saveButton = screen.getByRole('button', { name: /저장/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith({ username: 'newusername' });
    });
  });

  it('should not call onUpdate when no changes are made', async () => {
    render(<UserProfileUI profile={mockProfile} onUpdate={mockOnUpdate} />);
    
    const editButton = screen.getByRole('button', { name: /수정/i });
    fireEvent.click(editButton);

    const saveButton = screen.getByRole('button', { name: /저장/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnUpdate).not.toHaveBeenCalled();
    });
  });

  it('should cancel editing when cancel button is clicked', async () => {
    render(<UserProfileUI profile={mockProfile} onUpdate={mockOnUpdate} />);
    
    const editButton = screen.getByRole('button', { name: /수정/i });
    fireEvent.click(editButton);

    const usernameInput = screen.getByLabelText(/사용자명 입력/i) as HTMLInputElement;
    fireEvent.change(usernameInput, { target: { value: 'newusername' } });

    const cancelButton = screen.getByRole('button', { name: /취소/i });
    fireEvent.click(cancelButton);

    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('should display error message when update fails', async () => {
    const errorOnUpdate = jest.fn().mockRejectedValue(new Error('Update failed'));
    render(<UserProfileUI profile={mockProfile} onUpdate={errorOnUpdate} />);
    
    const editButton = screen.getByRole('button', { name: /수정/i });
    fireEvent.click(editButton);

    const usernameInput = screen.getByLabelText(/사용자명 입력/i) as HTMLInputElement;
    fireEvent.change(usernameInput, { target: { value: 'newusername' } });

    const saveButton = screen.getByRole('button', { name: /저장/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Update failed/i)).toBeInTheDocument();
    });
  });

  it('should display success message when update succeeds', async () => {
    render(<UserProfileUI profile={mockProfile} onUpdate={mockOnUpdate} />);
    
    const editButton = screen.getByRole('button', { name: /수정/i });
    fireEvent.click(editButton);

    const usernameInput = screen.getByLabelText(/사용자명 입력/i) as HTMLInputElement;
    fireEvent.change(usernameInput, { target: { value: 'newusername' } });

    const saveButton = screen.getByRole('button', { name: /저장/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/프로필이 성공적으로 업데이트되었습니다/i)).toBeInTheDocument();
    });
  });

  it('should handle null current_level', () => {
    const profileWithNullLevel: UserProfile = {
      ...mockProfile,
      current_level: null,
    };
    render(<UserProfileUI profile={profileWithNullLevel} onUpdate={mockOnUpdate} />);
    expect(screen.getByText('미정')).toBeInTheDocument();
  });

  it('should disable save button while saving', async () => {
    let resolveUpdate: () => void;
    const pendingUpdate = new Promise<void>((resolve) => {
      resolveUpdate = resolve;
    });
    const pendingOnUpdate = jest.fn().mockReturnValue(pendingUpdate);
    
    render(<UserProfileUI profile={mockProfile} onUpdate={pendingOnUpdate} />);
    
    const editButton = screen.getByRole('button', { name: /수정/i });
    fireEvent.click(editButton);

    const usernameInput = screen.getByLabelText(/사용자명 입력/i) as HTMLInputElement;
    fireEvent.change(usernameInput, { target: { value: 'newusername' } });

    const saveButton = screen.getByRole('button', { name: /저장/i });
    fireEvent.click(saveButton);

    expect(saveButton).toBeDisabled();
    expect(saveButton).toHaveTextContent('저장 중...');

    resolveUpdate!();
    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });
  });
});

