/**
 * UserProfile UI 컴포넌트
 * 사용자 프로필 조회 및 수정 UI
 */

import React, { useState } from 'react';
import { UserProfile } from '../../types/api';
import './UserProfileUI.css';

interface UserProfileUIProps {
  profile: UserProfile;
  onUpdate: (updates: { username?: string; target_level?: string }) => Promise<void>;
}

const UserProfileUI: React.FC<UserProfileUIProps> = ({ profile, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(profile.username);
  const [targetLevel, setTargetLevel] = useState(profile.target_level);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setUsername(profile.username);
    setTargetLevel(profile.target_level);
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updates: { username?: string; target_level?: string } = {};
      if (username !== profile.username) {
        updates.username = username;
      }
      if (targetLevel !== profile.target_level) {
        updates.target_level = targetLevel;
      }

      if (Object.keys(updates).length === 0) {
        setIsEditing(false);
        setIsSaving(false);
        return;
      }

      await onUpdate(updates);
      setSuccess('프로필이 성공적으로 업데이트되었습니다.');
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '프로필 업데이트 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatLevel = (level: string | null) => {
    if (!level) return '미정';
    return level;
  };

  return (
    <div className="user-profile-ui" data-testid="user-profile-ui">
      <h2>프로필 관리</h2>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message" role="alert">
          {success}
        </div>
      )}

      <div className="profile-section">
        {!isEditing ? (
          <>
            <div className="profile-info">
              <div className="profile-item">
                <label className="profile-label">이메일</label>
                <div className="profile-value">{profile.email}</div>
              </div>

              <div className="profile-item">
                <label className="profile-label">사용자명</label>
                <div className="profile-value">{profile.username}</div>
              </div>

              <div className="profile-item">
                <label className="profile-label">목표 레벨</label>
                <div className="profile-value">{formatLevel(profile.target_level)}</div>
              </div>

              <div className="profile-item">
                <label className="profile-label">현재 레벨</label>
                <div className="profile-value">{formatLevel(profile.current_level)}</div>
              </div>

              <div className="profile-item">
                <label className="profile-label">테스트 횟수</label>
                <div className="profile-value">{profile.total_tests_taken}회</div>
              </div>

              <div className="profile-item">
                <label className="profile-label">연속 학습일</label>
                <div className="profile-value">{profile.study_streak}일</div>
              </div>
            </div>

            <div className="profile-actions">
              <button
                onClick={handleEdit}
                className="edit-button"
                aria-label="프로필 수정"
              >
                수정
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="profile-edit">
              <div className="profile-item">
                <label className="profile-label">이메일</label>
                <div className="profile-value-readonly">{profile.email}</div>
                <p className="profile-hint">이메일은 변경할 수 없습니다.</p>
              </div>

              <div className="profile-item">
                <label htmlFor="username" className="profile-label">
                  사용자명
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="profile-input"
                  aria-label="사용자명 입력"
                />
              </div>

              <div className="profile-item">
                <label htmlFor="target_level" className="profile-label">
                  목표 레벨
                </label>
                <select
                  id="target_level"
                  value={targetLevel}
                  onChange={(e) => setTargetLevel(e.target.value)}
                  className="profile-select"
                  aria-label="목표 레벨 선택"
                >
                  <option value="N5">N5</option>
                  <option value="N4">N4</option>
                  <option value="N3">N3</option>
                  <option value="N2">N2</option>
                  <option value="N1">N1</option>
                </select>
              </div>

              <div className="profile-item">
                <label className="profile-label">현재 레벨</label>
                <div className="profile-value-readonly">{formatLevel(profile.current_level)}</div>
                <p className="profile-hint">현재 레벨은 테스트 결과에 따라 자동으로 업데이트됩니다.</p>
              </div>

              <div className="profile-item">
                <label className="profile-label">테스트 횟수</label>
                <div className="profile-value-readonly">{profile.total_tests_taken}회</div>
              </div>

              <div className="profile-item">
                <label className="profile-label">연속 학습일</label>
                <div className="profile-value-readonly">{profile.study_streak}일</div>
              </div>
            </div>

            <div className="profile-actions">
              <button
                onClick={handleSave}
                className="save-button"
                disabled={isSaving}
                aria-label="프로필 저장"
              >
                {isSaving ? '저장 중...' : '저장'}
              </button>
              <button
                onClick={handleCancel}
                className="cancel-button"
                disabled={isSaving}
                aria-label="취소"
              >
                취소
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserProfileUI;

