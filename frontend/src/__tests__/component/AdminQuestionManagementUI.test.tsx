/**
 * AdminQuestionManagementUI 컴포넌트 테스트
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import AdminQuestionManagementUI from '../../components/organisms/AdminQuestionManagementUI';
import { AdminQuestion } from '../../types/api';

// fetch 모킹
global.fetch = jest.fn() as jest.Mock;

const mockQuestions: AdminQuestion[] = [
  {
    id: 1,
    level: 'N5',
    question_type: 'vocabulary',
    question_text: '問題1',
    choices: ['選択肢1', '選択肢2', '選択肢3', '選択肢4'],
    correct_answer: '選択肢1',
    explanation: '説明1',
    difficulty: 1,
  },
  {
    id: 2,
    level: 'N4',
    question_type: 'grammar',
    question_text: '問題2',
    choices: ['選択肢A', '選択肢B', '選択肢C', '選択肢D'],
    correct_answer: '選択肢B',
    explanation: '説明2',
    difficulty: 2,
  },
];

describe('AdminQuestionManagementUI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockQuestions }),
      headers: new Headers({ 'content-type': 'application/json' }),
    });
  });

  it('should display question list on initial load', async () => {
    render(<AdminQuestionManagementUI />);

    await waitFor(() => {
      expect(screen.getByText('문제 관리')).toBeInTheDocument();
      expect(screen.getByText('전체 문제 목록')).toBeInTheDocument();
    });

    // 문제 목록 테이블 확인
    expect(screen.getByText('問題1')).toBeInTheDocument();
    expect(screen.getByText('問題2')).toBeInTheDocument();
  });

  it('should display question details when clicking view button', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockQuestions }),
      headers: new Headers({ 'content-type': 'application/json' }),
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockQuestions[0] }),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    render(<AdminQuestionManagementUI />);

    await waitFor(() => {
      expect(screen.getByText('問題1')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText('상세보기');
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('문제 상세 정보')).toBeInTheDocument();
      expect(screen.getByText('問題1')).toBeInTheDocument();
      expect(screen.getByText('選択肢1')).toBeInTheDocument();
    });
  });

  it('should switch to edit mode when clicking edit button', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockQuestions }),
      headers: new Headers({ 'content-type': 'application/json' }),
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockQuestions[0] }),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    render(<AdminQuestionManagementUI />);

    await waitFor(() => {
      expect(screen.getByText('問題1')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText('상세보기');
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('문제 상세 정보')).toBeInTheDocument();
    });

    const editButton = screen.getByText('수정');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('문제 정보 수정')).toBeInTheDocument();
      expect(screen.getByDisplayValue('問題1')).toBeInTheDocument();
    });
  });

  it('should update question when saving edit form', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockQuestions }),
        headers: new Headers({ 'content-type': 'application/json' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockQuestions[0] }),
        headers: new Headers({ 'content-type': 'application/json' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { ...mockQuestions[0], question_text: '更新された問題' },
        }),
        headers: new Headers({ 'content-type': 'application/json' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockQuestions }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

    render(<AdminQuestionManagementUI />);

    await waitFor(() => {
      expect(screen.getByText('問題1')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText('상세보기');
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('문제 상세 정보')).toBeInTheDocument();
    });

    const editButton = screen.getByText('수정');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('문제 정보 수정')).toBeInTheDocument();
    });

    const questionTextInput = screen.getByDisplayValue('問題1') as HTMLInputElement;
    fireEvent.change(questionTextInput, { target: { value: '更新された問題' } });

    const saveButton = screen.getByText('저장');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('문제 상세 정보')).toBeInTheDocument();
      expect(screen.getByText('更新された問題')).toBeInTheDocument();
    });
  });

  it('should delete question when clicking delete button and confirming', async () => {
    window.confirm = jest.fn(() => true);

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockQuestions }),
        headers: new Headers({ 'content-type': 'application/json' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockQuestions[0] }),
        headers: new Headers({ 'content-type': 'application/json' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: '문제가 성공적으로 삭제되었습니다' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockQuestions }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

    render(<AdminQuestionManagementUI />);

    await waitFor(() => {
      expect(screen.getByText('問題1')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText('상세보기');
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('문제 상세 정보')).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('삭제');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('정말로 문제 #1을(를) 삭제하시겠습니까?');
    });

    await waitFor(() => {
      expect(screen.getByText('전체 문제 목록')).toBeInTheDocument();
    });
  });

  it('should create new question when clicking create button', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockQuestions }),
        headers: new Headers({ 'content-type': 'application/json' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 3,
            level: 'N5',
            question_type: 'vocabulary',
            question_text: '新しい問題',
            choices: ['選択肢1', '選択肢2', '選択肢3', '選択肢4'],
            correct_answer: '選択肢1',
            explanation: '新しい説明',
            difficulty: 1,
          },
        }),
        headers: new Headers({ 'content-type': 'application/json' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [...mockQuestions, {
          id: 3,
          level: 'N5',
          question_type: 'vocabulary',
          question_text: '新しい問題',
          choices: ['選択肢1', '選択肢2', '選択肢3', '選択肢4'],
          correct_answer: '選択肢1',
          explanation: '新しい説明',
          difficulty: 1,
        }] }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

    render(<AdminQuestionManagementUI />);

    await waitFor(() => {
      expect(screen.getByText('問題1')).toBeInTheDocument();
    });

    const createButton = screen.getByText('새 문제 생성');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('새 문제 생성')).toBeInTheDocument();
    });

    const questionTextInput = screen.getByPlaceholderText('문제 내용을 입력하세요') as HTMLInputElement;
    fireEvent.change(questionTextInput, { target: { value: '新しい問題' } });

    const saveButton = screen.getByText('생성');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('전체 문제 목록')).toBeInTheDocument();
    });
  });

  it('should filter questions by level', async () => {
    render(<AdminQuestionManagementUI />);

    await waitFor(() => {
      expect(screen.getByText('問題1')).toBeInTheDocument();
      expect(screen.getByText('問題2')).toBeInTheDocument();
    });

    const levelFilter = screen.getByLabelText('레벨 필터') as HTMLSelectElement;
    fireEvent.change(levelFilter, { target: { value: 'N5' } });

    await waitFor(() => {
      expect(screen.getByText('問題1')).toBeInTheDocument();
      expect(screen.queryByText('問題2')).not.toBeInTheDocument();
    });
  });

  it('should filter questions by question type', async () => {
    render(<AdminQuestionManagementUI />);

    await waitFor(() => {
      expect(screen.getByText('問題1')).toBeInTheDocument();
      expect(screen.getByText('問題2')).toBeInTheDocument();
    });

    const typeFilter = screen.getByLabelText('유형 필터') as HTMLSelectElement;
    fireEvent.change(typeFilter, { target: { value: 'vocabulary' } });

    await waitFor(() => {
      expect(screen.getByText('問題1')).toBeInTheDocument();
      expect(screen.queryByText('問題2')).not.toBeInTheDocument();
    });
  });

  it('should search questions by text', async () => {
    render(<AdminQuestionManagementUI />);

    await waitFor(() => {
      expect(screen.getByText('問題1')).toBeInTheDocument();
      expect(screen.getByText('問題2')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('문제 검색...') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: '問題1' } });

    await waitFor(() => {
      expect(screen.getByText('問題1')).toBeInTheDocument();
      expect(screen.queryByText('問題2')).not.toBeInTheDocument();
    });
  });

  it('should display error message when API call fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ detail: '서버 오류가 발생했습니다' }),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    render(<AdminQuestionManagementUI />);

    await waitFor(() => {
      expect(screen.getByText(/서버 오류가 발생했습니다|오류가 발생했습니다/)).toBeInTheDocument();
    });
  });

  it('should refresh question list when clicking refresh button', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockQuestions }),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    render(<AdminQuestionManagementUI />);

    await waitFor(() => {
      expect(screen.getByText('問題1')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('새로고침');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(screen.getByText('問題1')).toBeInTheDocument();
    });
  });

  it('should navigate back to list from detail view', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockQuestions }),
        headers: new Headers({ 'content-type': 'application/json' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockQuestions[0] }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

    render(<AdminQuestionManagementUI />);

    await waitFor(() => {
      expect(screen.getByText('問題1')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText('상세보기');
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('문제 상세 정보')).toBeInTheDocument();
    });

    const backButton = screen.getByText('목록으로');
    fireEvent.click(backButton);

    await waitFor(() => {
      expect(screen.getByText('전체 문제 목록')).toBeInTheDocument();
    });
  });

  it('should call onBack callback when provided', async () => {
    const onBack = jest.fn();

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockQuestions }),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    render(<AdminQuestionManagementUI onBack={onBack} />);

    await waitFor(() => {
      expect(screen.getByText('문제 관리')).toBeInTheDocument();
    });

    const backButton = screen.getByText('뒤로 가기');
    fireEvent.click(backButton);

    expect(onBack).toHaveBeenCalled();
  });

  it('should display empty message when no questions exist', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] }),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    render(<AdminQuestionManagementUI />);

    await waitFor(() => {
      expect(screen.getByText('등록된 문제가 없습니다.')).toBeInTheDocument();
    });
  });

  it('should cancel edit and return to detail view', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockQuestions }),
        headers: new Headers({ 'content-type': 'application/json' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockQuestions[0] }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

    render(<AdminQuestionManagementUI />);

    await waitFor(() => {
      expect(screen.getByText('問題1')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText('상세보기');
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('문제 상세 정보')).toBeInTheDocument();
    });

    const editButton = screen.getByText('수정');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('문제 정보 수정')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('취소');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText('문제 상세 정보')).toBeInTheDocument();
    });
  });

  it('should cancel create and return to list view', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockQuestions }),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    render(<AdminQuestionManagementUI />);

    await waitFor(() => {
      expect(screen.getByText('問題1')).toBeInTheDocument();
    });

    const createButton = screen.getByText('새 문제 생성');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('새 문제 생성')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('취소');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText('전체 문제 목록')).toBeInTheDocument();
    });
  });
});

