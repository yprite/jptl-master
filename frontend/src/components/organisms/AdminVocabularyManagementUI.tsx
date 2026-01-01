/**
 * 어드민 단어 관리 UI 컴포넌트
 * 단어 목록 조회, 상세 조회, 생성, 수정, 삭제 기능 제공
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Vocabulary } from '../../types/api';
import { adminApi, ApiError } from '../../services/api';
import './AdminVocabularyManagementUI.css';

type ViewMode = 'list' | 'detail' | 'edit' | 'create';

interface AdminVocabularyManagementUIProps {
  onBack?: () => void;
}

const AdminVocabularyManagementUI: React.FC<AdminVocabularyManagementUIProps> = ({ onBack }) => {
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
  const [selectedVocabulary, setSelectedVocabulary] = useState<Vocabulary | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [editForm, setEditForm] = useState<{
    word: string;
    reading: string;
    meaning: string;
    level: string;
    example_sentence: string;
  }>({
    word: '',
    reading: '',
    meaning: '',
    level: 'N5',
    example_sentence: '',
  });

  // 단어 목록 로드
  useEffect(() => {
    if (viewMode === 'list') {
      loadVocabularies();
    }
  }, [viewMode]);

  // 선택된 단어 변경 시 폼 업데이트
  useEffect(() => {
    if (selectedVocabulary) {
      setEditForm({
        word: selectedVocabulary.word,
        reading: selectedVocabulary.reading,
        meaning: selectedVocabulary.meaning,
        level: selectedVocabulary.level,
        example_sentence: selectedVocabulary.example_sentence || '',
      });
    }
  }, [selectedVocabulary]);

  // 필터링된 단어 목록
  const filteredVocabularies = useMemo(() => {
    return vocabularies.filter((v) => {
      const matchesSearch = searchText === '' || 
        v.word.toLowerCase().includes(searchText.toLowerCase()) ||
        v.reading.toLowerCase().includes(searchText.toLowerCase()) ||
        v.meaning.toLowerCase().includes(searchText.toLowerCase());
      const matchesLevel = levelFilter === 'all' || v.level === levelFilter;
      return matchesSearch && matchesLevel;
    });
  }, [vocabularies, searchText, levelFilter]);

  const loadVocabularies = async () => {
    setLoading(true);
    setError(null);
    try {
      const vocabularyList = await adminApi.getVocabularies();
      setVocabularies(vocabularyList);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('단어 목록을 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVocabularyClick = async (vocabularyId: number) => {
    setLoading(true);
    setError(null);
    try {
      const vocabulary = await adminApi.getVocabulary(vocabularyId);
      setSelectedVocabulary(vocabulary);
      setViewMode('detail');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('단어를 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      await adminApi.createVocabulary({
        word: editForm.word,
        reading: editForm.reading,
        meaning: editForm.meaning,
        level: editForm.level,
        example_sentence: editForm.example_sentence || undefined,
      });
      await loadVocabularies();
      setViewMode('list');
      setEditForm({
        word: '',
        reading: '',
        meaning: '',
        level: 'N5',
        example_sentence: '',
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('단어 생성 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedVocabulary) return;
    
    setLoading(true);
    setError(null);
    try {
      await adminApi.updateVocabulary(selectedVocabulary.id, {
        word: editForm.word,
        reading: editForm.reading,
        meaning: editForm.meaning,
        level: editForm.level,
        example_sentence: editForm.example_sentence || undefined,
      });
      await loadVocabularies();
      setViewMode('list');
      setSelectedVocabulary(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('단어 수정 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedVocabulary) return;
    
    if (!window.confirm('정말 이 단어를 삭제하시겠습니까?')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await adminApi.deleteVocabulary(selectedVocabulary.id);
      await loadVocabularies();
      setViewMode('list');
      setSelectedVocabulary(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('단어 삭제 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not_memorized':
        return '미암기';
      case 'learning':
        return '학습중';
      case 'memorized':
        return '암기완료';
      default:
        return status;
    }
  };

  if (loading && vocabularies.length === 0) {
    return <div className="admin-vocabulary-management">로딩 중...</div>;
  }

  return (
    <div className="admin-vocabulary-management" data-testid="admin-vocabulary-management">
      {error && (
        <div className="admin-error-message" role="alert">
          {error}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="admin-vocabulary-list">
          <div className="admin-vocabulary-header">
            <h2>단어 관리</h2>
            <button
              onClick={() => {
                setSelectedVocabulary(null);
                setEditForm({
                  word: '',
                  reading: '',
                  meaning: '',
                  level: 'N5',
                  example_sentence: '',
                });
                setViewMode('create');
              }}
              className="admin-create-button"
            >
              새 단어 추가
            </button>
          </div>

          <div className="admin-vocabulary-filters">
            <input
              type="text"
              placeholder="단어, 읽기, 의미로 검색..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="admin-search-input"
            />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="admin-filter-select"
            >
              <option value="all">전체 레벨</option>
              <option value="N5">N5</option>
              <option value="N4">N4</option>
              <option value="N3">N3</option>
              <option value="N2">N2</option>
              <option value="N1">N1</option>
            </select>
          </div>

          <div className="admin-vocabulary-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>단어</th>
                  <th>읽기</th>
                  <th>의미</th>
                  <th>레벨</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredVocabularies.map((vocabulary) => (
                  <tr key={vocabulary.id}>
                    <td>{vocabulary.id}</td>
                    <td>{vocabulary.word}</td>
                    <td>{vocabulary.reading}</td>
                    <td>{vocabulary.meaning}</td>
                    <td>{vocabulary.level}</td>
                    <td>
                      <button
                        onClick={() => handleVocabularyClick(vocabulary.id)}
                        className="admin-view-button"
                      >
                        보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredVocabularies.length === 0 && (
              <div className="admin-empty-state">
                <p>표시할 단어가 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === 'detail' && selectedVocabulary && (
        <div className="admin-vocabulary-detail">
          <div className="admin-detail-header">
            <h2>단어 상세</h2>
            <div className="admin-detail-actions">
              <button
                onClick={() => setViewMode('edit')}
                className="admin-edit-button"
              >
                수정
              </button>
              <button
                onClick={handleDelete}
                className="admin-delete-button"
              >
                삭제
              </button>
              <button
                onClick={() => {
                  setViewMode('list');
                  setSelectedVocabulary(null);
                }}
                className="admin-back-button"
              >
                목록으로
              </button>
            </div>
          </div>
          <div className="admin-detail-content">
            <div className="admin-detail-field">
              <label>ID:</label>
              <span>{selectedVocabulary.id}</span>
            </div>
            <div className="admin-detail-field">
              <label>단어:</label>
              <span>{selectedVocabulary.word}</span>
            </div>
            <div className="admin-detail-field">
              <label>읽기:</label>
              <span>{selectedVocabulary.reading}</span>
            </div>
            <div className="admin-detail-field">
              <label>의미:</label>
              <span>{selectedVocabulary.meaning}</span>
            </div>
            <div className="admin-detail-field">
              <label>레벨:</label>
              <span>{selectedVocabulary.level}</span>
            </div>
            {selectedVocabulary.example_sentence && (
              <div className="admin-detail-field">
                <label>예문:</label>
                <span>{selectedVocabulary.example_sentence}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {(viewMode === 'create' || viewMode === 'edit') && (
        <div className="admin-vocabulary-form">
          <div className="admin-form-header">
            <h2>{viewMode === 'create' ? '새 단어 추가' : '단어 수정'}</h2>
            <button
              onClick={() => {
                setViewMode('list');
                setSelectedVocabulary(null);
              }}
              className="admin-back-button"
            >
              목록으로
            </button>
          </div>
          <div className="admin-form-content">
            <div className="admin-form-field">
              <label htmlFor="word">단어 *</label>
              <input
                id="word"
                type="text"
                value={editForm.word}
                onChange={(e) => setEditForm({ ...editForm, word: e.target.value })}
                placeholder="일본어 단어"
                required
              />
            </div>
            <div className="admin-form-field">
              <label htmlFor="reading">읽기 *</label>
              <input
                id="reading"
                type="text"
                value={editForm.reading}
                onChange={(e) => setEditForm({ ...editForm, reading: e.target.value })}
                placeholder="히라가나/가타카나"
                required
              />
            </div>
            <div className="admin-form-field">
              <label htmlFor="meaning">의미 *</label>
              <input
                id="meaning"
                type="text"
                value={editForm.meaning}
                onChange={(e) => setEditForm({ ...editForm, meaning: e.target.value })}
                placeholder="한국어 의미"
                required
              />
            </div>
            <div className="admin-form-field">
              <label htmlFor="level">레벨 *</label>
              <select
                id="level"
                value={editForm.level}
                onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}
                required
              >
                <option value="N5">N5</option>
                <option value="N4">N4</option>
                <option value="N3">N3</option>
                <option value="N2">N2</option>
                <option value="N1">N1</option>
              </select>
            </div>
            <div className="admin-form-field">
              <label htmlFor="example_sentence">예문</label>
              <textarea
                id="example_sentence"
                value={editForm.example_sentence}
                onChange={(e) => setEditForm({ ...editForm, example_sentence: e.target.value })}
                placeholder="예문 (선택적)"
                rows={3}
              />
            </div>
            <div className="admin-form-actions">
              <button
                onClick={viewMode === 'create' ? handleCreate : handleUpdate}
                className="admin-save-button"
                disabled={loading}
              >
                {viewMode === 'create' ? '생성' : '수정'}
              </button>
              <button
                onClick={() => {
                  setViewMode('list');
                  setSelectedVocabulary(null);
                }}
                className="admin-cancel-button"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVocabularyManagementUI;

