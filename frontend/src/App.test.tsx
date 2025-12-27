import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders JLPT app title', () => {
  render(<App />);
  const titleElement = screen.getByText(/JLPT 자격 검증 프로그램/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders test UI section', () => {
  render(<App />);
  const testSection = screen.getByText(/테스트 UI 예제/i);
  expect(testSection).toBeInTheDocument();
});

test('renders result UI section', () => {
  render(<App />);
  const resultSection = screen.getByText(/결과 UI 예제/i);
  expect(resultSection).toBeInTheDocument();
});
