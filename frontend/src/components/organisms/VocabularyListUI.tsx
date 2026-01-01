/**
 * Vocabulary List UI 컴포넌트
 * 단어 목록 조회, 검색, 필터링 기능 제공
 */

import React, { useState, useEffect } from 'react';
import { Vocabulary } from '../../types/api';
import './VocabularyListUI.css';

interface VocabularyListUIProps {
  vocabularies: Vocabulary[];
  onVocabularyClick?: (vocabulary: Vocabulary) => void;
  onStatusUpdate?: (vocabularyId: number, status: string) => void;
}

const VocabularyListUI: React.FC<VocabularyListUIProps> = ({
  vocabularies,
  onVocabularyClick,
  onStatusUpdate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [filteredVocabularies, setFilteredVocabularies] = useState<Vocabulary[]>(vocabularies);

  useEffect(() => {
    let filtered = [...vocabularies];

    // 레벨 필터
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(v => v.level === selectedLevel);
    }

    // 상태 필터
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(v => v.memorization_status === selectedStatus);
    }

    // 검색 필터
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(v =>
        v.word.toLowerCase().includes(term) ||
        v.reading.toLowerCase().includes(term) ||
        v.meaning.toLowerCase().includes(term)
      );
    }

    setFilteredVocabularies(filtered);
  }, [vocabularies, searchTerm, selectedLevel, selectedStatus]);

  const handleStatusChange = (vocabularyId: number, newStatus: string) => {
    if (onStatusUpdate) {
      onStatusUpdate(vocabularyId, newStatus);
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

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'not_memorized':
        return 'status-not-memorized';
      case 'learning':
        return 'status-learning';
      case 'memorized':
        return 'status-memorized';
      default:
        return '';
    }
  };

  return (
    <div className="vocabulary-list-ui" data-testid="vocabulary-list-ui">
      <div className="vocabulary-list-header">
        <h2>단어 목록</h2>
        <div className="vocabulary-stats">
          전체: {vocabularies.length}개 | 표시: {filteredVocabularies.length}개
        </div>
      </div>

      <div className="vocabulary-filters">
        <div className="filter-group">
          <label htmlFor="search">검색:</label>
          <input
            id="search"
            type="text"
            placeholder="단어, 읽기, 의미로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="level">레벨:</label>
          <select
            id="level"
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="filter-select"
          >
            <option value="all">전체</option>
            <option value="N5">N5</option>
            <option value="N4">N4</option>
            <option value="N3">N3</option>
            <option value="N2">N2</option>
            <option value="N1">N1</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="status">상태:</label>
          <select
            id="status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">전체</option>
            <option value="not_memorized">미암기</option>
            <option value="learning">학습중</option>
            <option value="memorized">암기완료</option>
          </select>
        </div>
      </div>

      <div className="vocabulary-list">
        {filteredVocabularies.length === 0 ? (
          <div className="vocabulary-empty">
            <p>표시할 단어가 없습니다.</p>
          </div>
        ) : (
          filteredVocabularies.map((vocabulary) => (
            <div
              key={vocabulary.id}
              className="vocabulary-item"
              onClick={() => onVocabularyClick && onVocabularyClick(vocabulary)}
            >
              <div className="vocabulary-main">
                <div className="vocabulary-word-section">
                  <div className="vocabulary-word">{vocabulary.word}</div>
                  <div className="vocabulary-reading">{vocabulary.reading}</div>
                </div>
                <div className="vocabulary-meaning">{vocabulary.meaning}</div>
              </div>
              <div className="vocabulary-meta">
                <span className={`vocabulary-level level-${vocabulary.level.toLowerCase()}`}>
                  {vocabulary.level}
                </span>
                <select
                  className={`vocabulary-status ${getStatusClass(vocabulary.memorization_status)}`}
                  value={vocabulary.memorization_status}
                  onChange={(e) => handleStatusChange(vocabulary.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="not_memorized">미암기</option>
                  <option value="learning">학습중</option>
                  <option value="memorized">암기완료</option>
                </select>
              </div>
              {vocabulary.example_sentence && (
                <div className="vocabulary-example">
                  <span className="example-label">예문:</span>
                  <span className="example-text">{vocabulary.example_sentence}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VocabularyListUI;

