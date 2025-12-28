/**
 * Login UI 컴포넌트
 * 사용자 로그인 및 등록을 처리하는 컴포넌트
 */

import React, { useState } from 'react';
import { authService, User } from '../../services/auth';
import { userApi, ApiError } from '../../services/api';
import './LoginUI.css';

interface LoginUIProps {
  onLoginSuccess?: (user: User) => void;
  onRegisterSuccess?: (user: User) => void;
}

const LoginUI: React.FC<LoginUIProps> = ({
  onLoginSuccess,
  onRegisterSuccess,
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [targetLevel, setTargetLevel] = useState('N5');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await authService.login(email);
      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 사용자 등록
      const newUser = await userApi.createUser({
        email,
        username,
        target_level: targetLevel,
      });

      // 등록 후 자동 로그인
      const user = await authService.login(email);
      if (onRegisterSuccess) {
        onRegisterSuccess(user);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('회원가입 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (isRegisterMode) {
      handleRegister(e);
    } else {
      handleLogin(e);
    }
  };

  return (
    <div className="login-ui">
      <div className="login-container">
        <h2>{isRegisterMode ? '회원가입' : '로그인'}</h2>
        
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="user@example.com"
            />
          </div>

          {isRegisterMode && (
            <>
              <div className="form-group">
                <label htmlFor="username">사용자명</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="학습자1"
                  minLength={1}
                  maxLength={50}
                />
              </div>

              <div className="form-group">
                <label htmlFor="targetLevel">목표 레벨</label>
                <select
                  id="targetLevel"
                  value={targetLevel}
                  onChange={(e) => setTargetLevel(e.target.value)}
                  disabled={loading}
                >
                  <option value="N5">N5</option>
                  <option value="N4">N4</option>
                  <option value="N3">N3</option>
                  <option value="N2">N2</option>
                  <option value="N1">N1</option>
                </select>
              </div>
            </>
          )}

          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? '처리 중...' : isRegisterMode ? '회원가입' : '로그인'}
          </button>
        </form>

        <div className="mode-switch">
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setError(null);
            }}
            disabled={loading}
          >
            {isRegisterMode
              ? '이미 계정이 있으신가요? 로그인'
              : '계정이 없으신가요? 회원가입'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginUI;

