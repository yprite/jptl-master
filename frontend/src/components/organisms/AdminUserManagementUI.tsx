/**
 * 어드민 사용자 관리 UI 컴포넌트
 * 사용자 목록 조회, 상세 조회, 수정, 삭제 기능 제공
 */

import React, { useState, useEffect } from 'react';
import { AdminUser } from '../../types/api';
import { adminApi, ApiError } from '../../services/api';
import './AdminUserManagementUI.css';

type ViewMode = 'list' | 'detail' | 'edit';

interface AdminUserManagementUIProps {
  onBack?: () => void;
}

const AdminUserManagementUI: React.FC<AdminUserManagementUIProps> = ({ onBack }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ username: string; target_level: string }>({
    username: '',
    target_level: 'N5',
  });

  // 사용자 목록 로드
  useEffect(() => {
    if (viewMode === 'list') {
      loadUsers();
    }
  }, [viewMode]);

  // 선택된 사용자 변경 시 폼 업데이트
  useEffect(() => {
    if (selectedUser) {
      setEditForm({
        username: selectedUser.username,
        target_level: selectedUser.target_level,
      });
    }
  }, [selectedUser]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const userList = await adminApi.getUsers();
      setUsers(userList);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('사용자 목록을 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = async (userId: number) => {
    setLoading(true);
    setError(null);
    try {
      const user = await adminApi.getUser(userId);
      setSelectedUser(user);
      setViewMode('detail');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('사용자 정보를 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setViewMode('edit');
  };

  const handleSave = async () => {
    if (!selectedUser) return;

    setLoading(true);
    setError(null);
    try {
      const updatedUser = await adminApi.updateUser(selectedUser.id, {
        username: editForm.username,
        target_level: editForm.target_level,
      });
      setSelectedUser(updatedUser);
      setViewMode('detail');
      // 목록도 업데이트
      await loadUsers();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('사용자 정보를 수정하는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    if (!window.confirm(`정말로 사용자 "${selectedUser.username}"을(를) 삭제하시겠습니까?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await adminApi.deleteUser(selectedUser.id);
      setSelectedUser(null);
      setViewMode('list');
      await loadUsers();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('사용자를 삭제하는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (selectedUser) {
      setEditForm({
        username: selectedUser.username,
        target_level: selectedUser.target_level,
      });
    }
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setSelectedUser(null);
    setViewMode('list');
    setError(null);
  };

  if (loading && viewMode === 'list' && users.length === 0) {
    return (
      <div className="admin-user-management">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="admin-user-management">
      <div className="admin-user-header">
        <h2>사용자 관리</h2>
        {onBack && (
          <button className="btn-back" onClick={onBack}>
            뒤로 가기
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {viewMode === 'list' && (
        <div className="user-list">
          <div className="user-list-header">
            <h3>전체 사용자 목록</h3>
            <button className="btn-refresh" onClick={loadUsers} disabled={loading}>
              새로고침
            </button>
          </div>
          {loading && <div className="loading">로딩 중...</div>}
          {users.length === 0 ? (
            <div className="empty-message">등록된 사용자가 없습니다.</div>
          ) : (
            <table className="user-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>이메일</th>
                  <th>사용자명</th>
                  <th>목표 레벨</th>
                  <th>현재 레벨</th>
                  <th>테스트 횟수</th>
                  <th>연속 학습일</th>
                  <th>어드민</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.email}</td>
                    <td>{user.username}</td>
                    <td>{user.target_level}</td>
                    <td>{user.current_level || '-'}</td>
                    <td>{user.total_tests_taken}</td>
                    <td>{user.study_streak}</td>
                    <td>{user.is_admin ? '✓' : '-'}</td>
                    <td>
                      <button
                        className="btn-view"
                        onClick={() => handleUserClick(user.id)}
                      >
                        상세보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {viewMode === 'detail' && selectedUser && (
        <div className="user-detail">
          <div className="user-detail-header">
            <h3>사용자 상세 정보</h3>
            <div className="user-detail-actions">
              <button className="btn-edit" onClick={handleEdit}>
                수정
              </button>
              <button className="btn-delete" onClick={handleDelete} disabled={loading}>
                삭제
              </button>
              <button className="btn-back" onClick={handleBackToList}>
                목록으로
              </button>
            </div>
          </div>
          <div className="user-detail-content">
            <div className="detail-row">
              <label>ID:</label>
              <span>{selectedUser.id}</span>
            </div>
            <div className="detail-row">
              <label>이메일:</label>
              <span>{selectedUser.email}</span>
            </div>
            <div className="detail-row">
              <label>사용자명:</label>
              <span>{selectedUser.username}</span>
            </div>
            <div className="detail-row">
              <label>목표 레벨:</label>
              <span>{selectedUser.target_level}</span>
            </div>
            <div className="detail-row">
              <label>현재 레벨:</label>
              <span>{selectedUser.current_level || '-'}</span>
            </div>
            <div className="detail-row">
              <label>테스트 횟수:</label>
              <span>{selectedUser.total_tests_taken}</span>
            </div>
            <div className="detail-row">
              <label>연속 학습일:</label>
              <span>{selectedUser.study_streak}</span>
            </div>
            <div className="detail-row">
              <label>어드민:</label>
              <span>{selectedUser.is_admin ? '예' : '아니오'}</span>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'edit' && selectedUser && (
        <div className="user-edit">
          <div className="user-edit-header">
            <h3>사용자 정보 수정</h3>
            <div className="user-edit-actions">
              <button className="btn-save" onClick={handleSave} disabled={loading}>
                저장
              </button>
              <button className="btn-cancel" onClick={handleCancel} disabled={loading}>
                취소
              </button>
            </div>
          </div>
          <div className="user-edit-content">
            <div className="form-group">
              <label htmlFor="username">사용자명:</label>
              <input
                id="username"
                type="text"
                value={editForm.username}
                onChange={(e) =>
                  setEditForm({ ...editForm, username: e.target.value })
                }
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="target_level">목표 레벨:</label>
              <select
                id="target_level"
                value={editForm.target_level}
                onChange={(e) =>
                  setEditForm({ ...editForm, target_level: e.target.value })
                }
                disabled={loading}
              >
                <option value="N5">N5</option>
                <option value="N4">N4</option>
                <option value="N3">N3</option>
                <option value="N2">N2</option>
                <option value="N1">N1</option>
              </select>
            </div>
            {loading && <div className="loading">저장 중...</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagementUI;

