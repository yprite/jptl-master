/**
 * AdminVocabularyManagementUI 컴포넌트 테스트
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import AdminVocabularyManagementUI from '../../components/organisms/AdminVocabularyManagementUI';
import { Vocabulary } from '../../types/api';

// fetch 모킹
global.fetch = jest.fn() as jest.Mock;

const mockVocabularies: Vocabulary[] = [
  {
    id: 1,
    word: 'こんにちは',
    reading: 'こんにちは',
    meaning: '안녕하세요',
    level: 'N5',
    memorization_status: 'not_memorized',
    example_sentence: 'こんにちは、元気ですか？',
  },
  {
    id: 2,
    word: 'ありがとう',
    reading: 'ありがとう',
    meaning: '감사합니다',
    level: 'N5',
    memorization_status: 'learning',
  },
  {
    id: 3,
    word: 'さようなら',
    reading: 'さようなら',
    meaning: '안녕히 가세요',
    level: 'N4',
    memorization_status: 'memorized',
  },
];

describe('AdminVocabularyManagementUI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockVocabularies }),
      headers: new Headers({ 'content-type': 'application/json' }),
    });
  });

  it('should display vocabulary list on initial load', async () => {
    render(<AdminVocabularyManagementUI />);

    await waitFor(() => {
      expect(screen.getByText('단어 관리')).toBeInTheDocument();
    });

    // 단어 목록 확인
    await waitFor(() => {
      expect(screen.getByText('안녕하세요')).toBeInTheDocument();
      expect(screen.getByText('감사합니다')).toBeInTheDocument();
    });
  });

  it('should display vocabulary details when clicking vocabulary item', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockVocabularies }),
      headers: new Headers({ 'content-type': 'application/json' }),
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockVocabularies[0] }),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    render(<AdminVocabularyManagementUI />);

    await waitFor(() => {
      expect(screen.getByText('안녕하세요')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText('보기');
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('단어 상세')).toBeInTheDocument();
      expect(screen.getByText('안녕하세요')).toBeInTheDocument();
    });
  });

  it('should filter vocabularies by search text', async () => {
    render(<AdminVocabularyManagementUI />);

    await waitFor(() => {
      expect(screen.getByText('안녕하세요')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('단어, 읽기, 의미로 검색...');
    fireEvent.change(searchInput, { target: { value: '안녕' } });

    await waitFor(() => {
      expect(screen.getByText('안녕하세요')).toBeInTheDocument();
      expect(screen.queryByText('감사합니다')).not.toBeInTheDocument();
    });
  });

  it('should filter vocabularies by level', async () => {
    render(<AdminVocabularyManagementUI />);

    await waitFor(() => {
      expect(screen.getByText('안녕하세요')).toBeInTheDocument();
    });

    const levelSelect = screen.getByRole('combobox');
    fireEvent.change(levelSelect, { target: { value: 'N4' } });

    await waitFor(() => {
      expect(screen.queryByText('안녕하세요')).not.toBeInTheDocument();
      expect(screen.getByText('안녕히 가세요')).toBeInTheDocument();
    });
  });

  it('should switch to create mode when clicking create button', async () => {
    render(<AdminVocabularyManagementUI />);

    await waitFor(() => {
      expect(screen.getByText('단어 관리')).toBeInTheDocument();
    });

    const createButton = screen.getByText('새 단어 추가');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('새 단어 추가')).toBeInTheDocument();
      expect(screen.getByLabelText('단어 *')).toBeInTheDocument();
    });
  });

  it('should switch to edit mode when clicking edit button', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockVocabularies }),
      headers: new Headers({ 'content-type': 'application/json' }),
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockVocabularies[0] }),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    render(<AdminVocabularyManagementUI />);

    await waitFor(() => {
      expect(screen.getByText('안녕하세요')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText('보기');
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('단어 상세')).toBeInTheDocument();
    });

    const editButton = screen.getByText('수정');
    await act(async () => {
      fireEvent.click(editButton);
    });

    // edit 모드로 전환되었는지 확인
    await waitFor(() => {
      // "단어 수정" 텍스트가 있는지 확인 (h2 태그 내부)
      expect(screen.getByText('단어 수정')).toBeInTheDocument();
    });

    // input 값 확인 (useEffect로 폼이 업데이트될 때까지 대기)
    await waitFor(() => {
      const wordInput = screen.getByLabelText('단어 *');
      expect(wordInput).toBeInTheDocument();
      expect((wordInput as HTMLInputElement).value).toBe('こんにちは');
    }, { timeout: 3000 });
  });

  it('should handle error when loading vocabularies fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ detail: 'Internal Server Error' }),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    render(<AdminVocabularyManagementUI />);

    await waitFor(() => {
      expect(screen.getByText(/오류|에러|error/i)).toBeInTheDocument();
    });
  });
});

