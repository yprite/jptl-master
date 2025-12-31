/**
 * 어드민 문제 관리 UI 컴포넌트
 * 문제 목록 조회, 상세 조회, 생성, 수정, 삭제 기능 제공
 */

import React, { useState, useEffect, useMemo } from 'react';
import { AdminQuestion } from '../../types/api';
import { adminApi, ApiError } from '../../services/api';
import './AdminQuestionManagementUI.css';

type ViewMode = 'list' | 'detail' | 'edit' | 'create';

interface AdminQuestionManagementUIProps {
  onBack?: () => void;
}

const AdminQuestionManagementUI: React.FC<AdminQuestionManagementUIProps> = ({ onBack }) => {
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<AdminQuestion | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [editForm, setEditForm] = useState<{
    level: string;
    question_type: string;
    question_text: string;
    choices: string[];
    correct_answer: string;
    explanation: string;
    difficulty: number;
  }>({
    level: 'N5',
    question_type: 'vocabulary',
    question_text: '',
    choices: ['', '', '', ''],
    correct_answer: '',
    explanation: '',
    difficulty: 1,
  });

  // 문제 목록 로드
  useEffect(() => {
    if (viewMode === 'list') {
      loadQuestions();
    }
  }, [viewMode]);

  // 선택된 문제 변경 시 폼 업데이트
  useEffect(() => {
    if (selectedQuestion) {
      setEditForm({
        level: selectedQuestion.level,
        question_type: selectedQuestion.question_type,
        question_text: selectedQuestion.question_text,
        choices: [...selectedQuestion.choices],
        correct_answer: selectedQuestion.correct_answer,
        explanation: selectedQuestion.explanation,
        difficulty: selectedQuestion.difficulty,
      });
    }
  }, [selectedQuestion]);

  // 필터링된 문제 목록
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesSearch = searchText === '' || 
        q.question_text.toLowerCase().includes(searchText.toLowerCase()) ||
        q.explanation.toLowerCase().includes(searchText.toLowerCase());
      const matchesLevel = levelFilter === 'all' || q.level === levelFilter;
      const matchesType = typeFilter === 'all' || q.question_type === typeFilter;
      return matchesSearch && matchesLevel && matchesType;
    });
  }, [questions, searchText, levelFilter, typeFilter]);

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const questionList = await adminApi.getQuestions();
      setQuestions(questionList);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('문제 목록을 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionClick = async (questionId: number) => {
    setLoading(true);
    setError(null);
    try {
      const question = await adminApi.getQuestion(questionId);
      setSelectedQuestion(question);
      setViewMode('detail');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('문제 정보를 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedQuestion(null);
    setEditForm({
      level: 'N5',
      question_type: 'vocabulary',
      question_text: '',
      choices: ['', '', '', ''],
      correct_answer: '',
      explanation: '',
      difficulty: 1,
    });
    setViewMode('create');
  };

  const handleEdit = () => {
    setViewMode('edit');
  };

  const handleSave = async () => {
    if (!selectedQuestion) return;

    setLoading(true);
    setError(null);
    try {
      const updatedQuestion = await adminApi.updateQuestion(selectedQuestion.id, {
        level: editForm.level,
        question_type: editForm.question_type,
        question_text: editForm.question_text,
        choices: editForm.choices.filter((c) => c.trim() !== ''),
        correct_answer: editForm.correct_answer,
        explanation: editForm.explanation,
        difficulty: editForm.difficulty,
      });
      setSelectedQuestion(updatedQuestion);
      setViewMode('detail');
      // 목록도 업데이트
      await loadQuestions();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('문제 정보를 수정하는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async () => {
    setLoading(true);
    setError(null);
    try {
      // 유효성 검증
      if (!editForm.question_text.trim()) {
        setError('문제 내용을 입력하세요.');
        setLoading(false);
        return;
      }
      if (editForm.choices.filter((c) => c.trim() !== '').length < 2) {
        setError('최소 2개 이상의 선택지를 입력하세요.');
        setLoading(false);
        return;
      }
      if (!editForm.correct_answer.trim()) {
        setError('정답을 입력하세요.');
        setLoading(false);
        return;
      }
      if (!editForm.explanation.trim()) {
        setError('해설을 입력하세요.');
        setLoading(false);
        return;
      }
      const validChoices = editForm.choices.filter((c) => c.trim() !== '');
      if (!validChoices.includes(editForm.correct_answer)) {
        setError('정답은 선택지 중 하나여야 합니다.');
        setLoading(false);
        return;
      }

      await adminApi.createQuestion({
        level: editForm.level,
        question_type: editForm.question_type,
        question_text: editForm.question_text,
        choices: validChoices,
        correct_answer: editForm.correct_answer,
        explanation: editForm.explanation,
        difficulty: editForm.difficulty,
      });
      setViewMode('list');
      await loadQuestions();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('문제를 생성하는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedQuestion) return;

    if (!window.confirm(`정말로 문제 #${selectedQuestion.id}을(를) 삭제하시겠습니까?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await adminApi.deleteQuestion(selectedQuestion.id);
      setSelectedQuestion(null);
      setViewMode('list');
      await loadQuestions();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('문제를 삭제하는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (selectedQuestion) {
      setEditForm({
        level: selectedQuestion.level,
        question_type: selectedQuestion.question_type,
        question_text: selectedQuestion.question_text,
        choices: [...selectedQuestion.choices],
        correct_answer: selectedQuestion.correct_answer,
        explanation: selectedQuestion.explanation,
        difficulty: selectedQuestion.difficulty,
      });
      setViewMode('detail');
    } else {
      setViewMode('list');
    }
  };

  const handleBackToList = () => {
    setSelectedQuestion(null);
    setViewMode('list');
    setError(null);
  };

  const handleChoiceChange = (index: number, value: string) => {
    const newChoices = [...editForm.choices];
    newChoices[index] = value;
    setEditForm({ ...editForm, choices: newChoices });
  };

  const handleAddChoice = () => {
    if (editForm.choices.length < 6) {
      setEditForm({
        ...editForm,
        choices: [...editForm.choices, ''],
      });
    }
  };

  const handleRemoveChoice = (index: number) => {
    if (editForm.choices.length > 2) {
      const newChoices = editForm.choices.filter((_, i) => i !== index);
      setEditForm({ ...editForm, choices: newChoices });
    }
  };

  if (loading && viewMode === 'list' && questions.length === 0) {
    return (
      <div className="admin-question-management">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="admin-question-management">
      <div className="admin-question-header">
        <h2>문제 관리</h2>
        {onBack && (
          <button className="btn-back" onClick={onBack}>
            뒤로 가기
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {viewMode === 'list' && (
        <div className="question-list">
          <div className="question-list-header">
            <h3>전체 문제 목록</h3>
            <div className="question-list-actions">
              <button className="btn-create" onClick={handleCreate}>
                새 문제 생성
              </button>
              <button className="btn-refresh" onClick={loadQuestions} disabled={loading}>
                새로고침
              </button>
            </div>
          </div>
          <div className="question-list-filters">
            <input
              type="text"
              placeholder="문제 검색..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="search-input"
            />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="filter-select"
              aria-label="레벨 필터"
            >
              <option value="all">모든 레벨</option>
              <option value="N5">N5</option>
              <option value="N4">N4</option>
              <option value="N3">N3</option>
              <option value="N2">N2</option>
              <option value="N1">N1</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="filter-select"
              aria-label="유형 필터"
            >
              <option value="all">모든 유형</option>
              <option value="vocabulary">어휘</option>
              <option value="grammar">문법</option>
              <option value="reading">독해</option>
              <option value="listening">청해</option>
            </select>
          </div>
          {loading && <div className="loading">로딩 중...</div>}
          {filteredQuestions.length === 0 ? (
            <div className="empty-message">등록된 문제가 없습니다.</div>
          ) : (
            <table className="question-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>레벨</th>
                  <th>유형</th>
                  <th>문제 내용</th>
                  <th>난이도</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuestions.map((question) => (
                  <tr key={question.id}>
                    <td>{question.id}</td>
                    <td>{question.level}</td>
                    <td>{question.question_type}</td>
                    <td className="question-text-cell">
                      {question.question_text.length > 50
                        ? `${question.question_text.substring(0, 50)}...`
                        : question.question_text}
                    </td>
                    <td>{question.difficulty}</td>
                    <td>
                      <button
                        className="btn-view"
                        onClick={() => handleQuestionClick(question.id)}
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

      {viewMode === 'detail' && selectedQuestion && (
        <div className="question-detail">
          <div className="question-detail-header">
            <h3>문제 상세 정보</h3>
            <div className="question-detail-actions">
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
          <div className="question-detail-content">
            <div className="detail-row">
              <label>ID:</label>
              <span>{selectedQuestion.id}</span>
            </div>
            <div className="detail-row">
              <label>레벨:</label>
              <span>{selectedQuestion.level}</span>
            </div>
            <div className="detail-row">
              <label>유형:</label>
              <span>{selectedQuestion.question_type}</span>
            </div>
            <div className="detail-row">
              <label>문제 내용:</label>
              <span>{selectedQuestion.question_text}</span>
            </div>
            <div className="detail-row">
              <label>선택지:</label>
              <ul className="choices-list">
                {selectedQuestion.choices.map((choice, index) => (
                  <li key={index} className={choice === selectedQuestion.correct_answer ? 'correct' : ''}>
                    {choice} {choice === selectedQuestion.correct_answer && '(정답)'}
                  </li>
                ))}
              </ul>
            </div>
            <div className="detail-row">
              <label>정답:</label>
              <span>{selectedQuestion.correct_answer}</span>
            </div>
            <div className="detail-row">
              <label>해설:</label>
              <span>{selectedQuestion.explanation}</span>
            </div>
            <div className="detail-row">
              <label>난이도:</label>
              <span>{selectedQuestion.difficulty}</span>
            </div>
          </div>
        </div>
      )}

      {(viewMode === 'edit' || viewMode === 'create') && (
        <div className="question-edit">
          <div className="question-edit-header">
            <h3>{viewMode === 'create' ? '새 문제 생성' : '문제 정보 수정'}</h3>
            <div className="question-edit-actions">
              <button
                className="btn-save"
                onClick={viewMode === 'create' ? handleCreateQuestion : handleSave}
                disabled={loading}
              >
                {viewMode === 'create' ? '생성' : '저장'}
              </button>
              <button className="btn-cancel" onClick={handleCancel} disabled={loading}>
                취소
              </button>
            </div>
          </div>
          <div className="question-edit-content">
            <div className="form-group">
              <label htmlFor="level">레벨:</label>
              <select
                id="level"
                value={editForm.level}
                onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}
                disabled={loading}
              >
                <option value="N5">N5</option>
                <option value="N4">N4</option>
                <option value="N3">N3</option>
                <option value="N2">N2</option>
                <option value="N1">N1</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="question_type">유형:</label>
              <select
                id="question_type"
                value={editForm.question_type}
                onChange={(e) => setEditForm({ ...editForm, question_type: e.target.value })}
                disabled={loading}
              >
                <option value="vocabulary">어휘</option>
                <option value="grammar">문법</option>
                <option value="reading">독해</option>
                <option value="listening">청해</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="question_text">문제 내용:</label>
              <textarea
                id="question_text"
                value={editForm.question_text}
                onChange={(e) => setEditForm({ ...editForm, question_text: e.target.value })}
                disabled={loading}
                placeholder="문제 내용을 입력하세요"
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>선택지:</label>
              {editForm.choices.map((choice, index) => (
                <div key={index} className="choice-input-group">
                  <input
                    type="text"
                    value={choice}
                    onChange={(e) => handleChoiceChange(index, e.target.value)}
                    disabled={loading}
                    placeholder={`선택지 ${index + 1}`}
                  />
                  {editForm.choices.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveChoice(index)}
                      disabled={loading}
                      className="btn-remove-choice"
                    >
                      삭제
                    </button>
                  )}
                </div>
              ))}
              {editForm.choices.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddChoice}
                  disabled={loading}
                  className="btn-add-choice"
                >
                  선택지 추가
                </button>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="correct_answer">정답:</label>
              <select
                id="correct_answer"
                value={editForm.correct_answer}
                onChange={(e) => setEditForm({ ...editForm, correct_answer: e.target.value })}
                disabled={loading}
              >
                <option value="">선택하세요</option>
                {editForm.choices
                  .filter((c) => c.trim() !== '')
                  .map((choice, index) => (
                    <option key={index} value={choice}>
                      {choice}
                    </option>
                  ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="explanation">해설:</label>
              <textarea
                id="explanation"
                value={editForm.explanation}
                onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
                disabled={loading}
                placeholder="해설을 입력하세요"
                rows={3}
              />
            </div>
            <div className="form-group">
              <label htmlFor="difficulty">난이도:</label>
              <input
                id="difficulty"
                type="number"
                min="1"
                max="5"
                value={editForm.difficulty}
                onChange={(e) =>
                  setEditForm({ ...editForm, difficulty: parseInt(e.target.value) || 1 })
                }
                disabled={loading}
              />
            </div>
            {loading && <div className="loading">저장 중...</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuestionManagementUI;

