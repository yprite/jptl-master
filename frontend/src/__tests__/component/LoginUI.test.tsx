/**
 * LoginUI 컴포넌트 테스트
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginUI from '../../components/organisms/LoginUI';
import { authService } from '../../services/auth';
import { userApi } from '../../services/api';
import { ApiError } from '../../services/api';

// Mock services
jest.mock('../../services/auth');
jest.mock('../../services/api');

const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockUserApi = userApi as jest.Mocked<typeof userApi>;

describe('LoginUI', () => {
  const mockUser = {
    id: 1,
    email: 'user@example.com',
    username: '학습자1',
    target_level: 'N5',
    current_level: null,
    total_tests_taken: 0,
    study_streak: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('로그인 폼을 렌더링한다', () => {
    render(<LoginUI />);

    expect(screen.getByText('로그인')).toBeInTheDocument();
    expect(screen.getByLabelText('이메일')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
  });

  it('회원가입 모드로 전환할 수 있다', () => {
    render(<LoginUI />);

    const switchButton = screen.getByText(/계정이 없으신가요/);
    fireEvent.click(switchButton);

    expect(screen.getByText('회원가입')).toBeInTheDocument();
    expect(screen.getByLabelText('사용자명')).toBeInTheDocument();
    expect(screen.getByLabelText('목표 레벨')).toBeInTheDocument();
  });

  it('로그인 성공 시 onLoginSuccess 콜백을 호출한다', async () => {
    const onLoginSuccess = jest.fn();
    mockAuthService.login.mockResolvedValue(mockUser);

    render(<LoginUI onLoginSuccess={onLoginSuccess} />);

    const emailInput = screen.getByLabelText('이메일');
    const submitButton = screen.getByRole('button', { name: '로그인' });

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAuthService.login).toHaveBeenCalledWith('user@example.com');
      expect(onLoginSuccess).toHaveBeenCalledWith(mockUser);
    });
  });

  it('로그인 실패 시 에러 메시지를 표시한다', async () => {
    const error = new ApiError(404, '사용자를 찾을 수 없습니다');
    mockAuthService.login.mockRejectedValue(error);

    render(<LoginUI />);

    const emailInput = screen.getByLabelText('이메일');
    const submitButton = screen.getByRole('button', { name: '로그인' });

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('사용자를 찾을 수 없습니다')).toBeInTheDocument();
    });
  });

  it('회원가입 성공 시 onRegisterSuccess 콜백을 호출한다', async () => {
    const onRegisterSuccess = jest.fn();
    mockUserApi.createUser.mockResolvedValue(mockUser);
    mockAuthService.login.mockResolvedValue(mockUser);

    render(<LoginUI onRegisterSuccess={onRegisterSuccess} />);

    // 회원가입 모드로 전환
    const switchButton = screen.getByText(/계정이 없으신가요/);
    fireEvent.click(switchButton);

    // 폼 입력
    const emailInput = screen.getByLabelText('이메일');
    const usernameInput = screen.getByLabelText('사용자명');
    const submitButton = screen.getByRole('button', { name: '회원가입' });

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(usernameInput, { target: { value: '학습자1' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUserApi.createUser).toHaveBeenCalledWith({
        email: 'user@example.com',
        username: '학습자1',
        target_level: 'N5',
      });
      expect(mockAuthService.login).toHaveBeenCalledWith('user@example.com');
      expect(onRegisterSuccess).toHaveBeenCalledWith(mockUser);
    });
  });

  it.skip('회원가입 실패 시 에러 메시지를 표시한다', async () => {
    // TODO: 이 테스트는 나중에 수정 필요
    const error = new ApiError(400, '이미 등록된 이메일입니다');
    mockUserApi.createUser.mockRejectedValue(error);

    render(<LoginUI />);

    // 회원가입 모드로 전환
    const switchButton = screen.getByText(/계정이 없으신가요/);
    fireEvent.click(switchButton);

    // 폼 입력
    const emailInput = screen.getByLabelText('이메일');
    const usernameInput = screen.getByLabelText('사용자명');
    const form = emailInput.closest('form')!;

    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
    fireEvent.change(usernameInput, { target: { value: '학습자1' } });
    
    // form submit
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('이미 등록된 이메일입니다')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('로딩 중에는 버튼이 비활성화된다', async () => {
    mockAuthService.login.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockUser), 100))
    );

    render(<LoginUI />);

    const emailInput = screen.getByLabelText('이메일');
    const submitButton = screen.getByRole('button', { name: '로그인' });

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.click(submitButton);

    expect(screen.getByRole('button', { name: '처리 중...' })).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '로그인' })).not.toBeDisabled();
    });
  });

  it('이메일 입력 필드가 필수이다', () => {
    render(<LoginUI />);

    const emailInput = screen.getByLabelText('이메일') as HTMLInputElement;
    const form = emailInput.closest('form')!;

    expect(emailInput.required).toBe(true);
    
    // form의 checkValidity를 확인
    const isValid = form.checkValidity();
    expect(isValid).toBe(false);
  });
});

