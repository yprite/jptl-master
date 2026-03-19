"use client";

import { useEffect, useState } from "react";
import JapaneseRubyText from "@/components/japanese-ruby-text";
import StudySessionHero from "@/components/study-session-hero";
import UserSelectionNotice from "@/components/user-selection-notice";
import {
  buildFlashcardId,
  getFlashcardSrsState,
  saveFlashcardSrsState,
  upsertFlashcardPriorities,
} from "@/lib/flashcard-srs-store";
import {
  getReadingNotesState,
  updateReadingMistakeWords,
  upsertReadingMistakeNote,
  type ReadingNotesState,
  type ReadingUnknownWordNote,
} from "@/lib/reading-notes-store";
import type { GeneratedReadingQuestion, StudyFlashcard } from "@/lib/study-data-types";
import { getDailyStudyItems } from "@/lib/study-plan";
import { useAutoCompleteQuest } from "@/lib/use-auto-complete-quest";
import { useActiveStudyProfile } from "@/lib/use-active-study-profile";
import { useStudyData } from "@/lib/use-study-data";

interface FlashcardWithId extends StudyFlashcard {
  cardId: string;
  sourceIndex: number;
}

const EMPTY_READING_QUESTIONS: GeneratedReadingQuestion[] = [];
const EMPTY_FLASHCARDS: StudyFlashcard[] = [];
const EMPTY_READING_NOTES: ReadingNotesState = {
  updatedAt: "",
  notes: {},
};

function hasKanji(text: string): boolean {
  return /[々〆ヶ一-龯]/u.test(text);
}

function collectLinkedFlashcards(
  question: GeneratedReadingQuestion,
  cards: FlashcardWithId[]
): FlashcardWithId[] {
  const source = `${question.passage}\n${question.question}\n${question.choices.join("\n")}`;
  const matches = cards.filter((card) => {
    const word = card.word.trim();
    if (!word) return false;
    if (word.length === 1 && !hasKanji(word)) return false;
    return source.includes(word);
  });

  matches.sort((left, right) => {
    if (left.word.length !== right.word.length) {
      return right.word.length - left.word.length;
    }

    return left.sourceIndex - right.sourceIndex;
  });

  return matches.slice(0, 8);
}

function toUnknownWordNote(card: FlashcardWithId): ReadingUnknownWordNote {
  return {
    cardId: card.cardId,
    word: card.word,
    reading: card.reading,
    meaning: card.meaning,
  };
}

function sortRecentNotes(state: ReadingNotesState) {
  return Object.values(state.notes).sort((left, right) => {
    return Date.parse(right.lastWrongAt) - Date.parse(left.lastWrongAt);
  });
}

export default function ReadingPage() {
  const {
    isLoading: isProfileLoading,
    supportedLevel,
    userId,
    userLabel,
    requiresSelection,
    plan,
    currentDay,
  } = useActiveStudyProfile();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [stats, setStats] = useState({ total: 0, correct: 0 });
  const [readingNotesState, setReadingNotesState] =
    useState<ReadingNotesState>(EMPTY_READING_NOTES);
  const [selectedUnknownCardIds, setSelectedUnknownCardIds] = useState<string[]>([]);
  const [isQueueingWords, setIsQueueingWords] = useState(false);
  const [queueMessage, setQueueMessage] = useState<string | null>(null);
  const [queueError, setQueueError] = useState<string | null>(null);
  const { data: questions, error, isLoading: isStudyLoading } = useStudyData<
    GeneratedReadingQuestion[]
  >(
    isProfileLoading ? null : `reading-questions-${supportedLevel}.json`,
    EMPTY_READING_QUESTIONS
  );
  const { data: flashcards, isLoading: isFlashcardLoading } = useStudyData<StudyFlashcard[]>(
    isProfileLoading ? null : `flashcards-${supportedLevel}.json`,
    EMPTY_FLASHCARDS
  );

  useEffect(() => {
    if (!userId) {
      setReadingNotesState(EMPTY_READING_NOTES);
      return;
    }

    setReadingNotesState(getReadingNotesState(userId));
  }, [userId]);

  const dailyQuestions = plan
    ? getDailyStudyItems(questions, currentDay, plan.dailyReading)
    : questions;
  const isSessionComplete = dailyQuestions.length > 0 && currentIndex >= dailyQuestions.length;
  const current = isSessionComplete ? null : dailyQuestions[currentIndex] ?? null;
  const answeredCount = Math.min(stats.total, dailyQuestions.length);
  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
  const remainingCount = Math.max(dailyQuestions.length - answeredCount, 0);
  const progressPercent =
    dailyQuestions.length > 0
      ? Math.min(100, Math.round((answeredCount / dailyQuestions.length) * 100))
      : 0;
  const flashcardsWithId: FlashcardWithId[] = flashcards.map((card, index) => ({
    ...card,
    cardId: buildFlashcardId(card, index),
    sourceIndex: index,
  }));
  const linkedFlashcards = current ? collectLinkedFlashcards(current, flashcardsWithId) : [];
  const recentNotes = sortRecentNotes(readingNotesState).slice(0, 3);
  const isWrongAnswer = Boolean(
    current && showResult && selectedAnswer && selectedAnswer !== current.correct_answer
  );

  useAutoCompleteQuest({
    enabled: isSessionComplete,
    quest: "reading",
    userId,
  });

  const handleAnswer = (choice: string) => {
    if (showResult || !current || !userId) return;

    setSelectedAnswer(choice);
    setShowResult(true);
    setQueueMessage(null);
    setQueueError(null);
    setStats((prev) => ({
      total: prev.total + 1,
      correct:
        choice === current.correct_answer ? prev.correct + 1 : prev.correct,
    }));

    if (choice !== current.correct_answer) {
      const saved = upsertReadingMistakeNote(userId, {
        questionId: current.id,
        level: current.level,
        question: current.question,
        passage: current.passage,
        correctAnswer: current.correct_answer,
        selectedAnswer: choice,
        explanation: current.explanation,
      });
      setReadingNotesState(saved);
      const existingWords = saved.notes[current.id]?.unknownWords ?? [];
      setSelectedUnknownCardIds(existingWords.map((word) => word.cardId));
    } else {
      setSelectedUnknownCardIds([]);
    }
  };

  const handleNext = () => {
    if (dailyQuestions.length === 0) return;
    setSelectedAnswer(null);
    setShowResult(false);
    setSelectedUnknownCardIds([]);
    setQueueMessage(null);
    setQueueError(null);
    setCurrentIndex((prev) =>
      prev + 1 >= dailyQuestions.length ? dailyQuestions.length : prev + 1
    );
  };

  const restartSession = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setSelectedUnknownCardIds([]);
    setQueueMessage(null);
    setQueueError(null);
    setStats({ total: 0, correct: 0 });
  };

  const handleToggleUnknownWord = (card: FlashcardWithId) => {
    if (!userId || !current) {
      return;
    }

    setQueueMessage(null);
    setQueueError(null);
    const nextIds = selectedUnknownCardIds.includes(card.cardId)
      ? selectedUnknownCardIds.filter((cardId) => cardId !== card.cardId)
      : [...selectedUnknownCardIds, card.cardId];
    const nextWords = linkedFlashcards
      .filter((linkedCard) => nextIds.includes(linkedCard.cardId))
      .map(toUnknownWordNote);
    setSelectedUnknownCardIds(nextIds);
    setReadingNotesState(updateReadingMistakeWords(userId, current.id, nextWords));
  };

  const handleQueueUnknownWords = async () => {
    if (!userId || !current || selectedUnknownCardIds.length === 0) {
      return;
    }

    setIsQueueingWords(true);
    setQueueError(null);
    setQueueMessage(null);

    try {
      const selectedCards = linkedFlashcards.filter((card) =>
        selectedUnknownCardIds.includes(card.cardId)
      );
      const unknownWords = selectedCards.map(toUnknownWordNote);
      setReadingNotesState(updateReadingMistakeWords(userId, current.id, unknownWords));

      const state = await getFlashcardSrsState(userId, supportedLevel);
      const nextState = upsertFlashcardPriorities(
        state,
        selectedCards.map((card) => ({
          cardId: card.cardId,
          questionId: current.id,
          source: "reading-unknown-word",
        }))
      );
      await saveFlashcardSrsState(userId, supportedLevel, nextState);
      setQueueMessage(
        `${selectedCards.length}개 단어를 단어 카드 우선 복습으로 올렸습니다.`
      );
    } catch (queueWordError) {
      setQueueError(
        queueWordError instanceof Error
          ? queueWordError.message
          : "단어 카드를 우선 복습 목록에 올리지 못했습니다."
      );
    } finally {
      setIsQueueingWords(false);
    }
  };

  if (isProfileLoading || isStudyLoading || isFlashcardLoading) {
    return <p className="text-center text-gray-500">학습 레벨을 불러오는 중입니다.</p>;
  }

  if (requiresSelection || !userLabel) {
    return <UserSelectionNotice />;
  }

  const sessionDescription = plan
    ? `${userLabel}의 ${currentDay}일차 독해 ${dailyQuestions.length}개를 풉니다. 지문에 요미가나를 함께 붙였고, 틀리면 바로 오답노트와 단어 복습으로 이어집니다.`
    : `${userLabel}의 현재 레벨 독해 문제를 바로 이어서 풉니다. 지문을 읽고 틀린 문항은 오답노트와 단어 복습으로 연결됩니다.`;
  const heroBadges = [
    {
      label: `현재 사용자 ${userLabel}`,
      className: "bg-stone-900 text-white",
    },
    {
      label: `설정 레벨 ${supportedLevel}`,
      className: "bg-white text-stone-700",
    },
    ...(plan
      ? [
          {
            label: `${currentDay}일차`,
            className: "bg-emerald-100 text-emerald-700",
          },
          {
            label: `오늘 분량 ${dailyQuestions.length}개`,
            className: "bg-amber-100 text-amber-700",
          },
        ]
      : []),
    {
      label: "지문 요미가나",
      className: "bg-green-100 text-green-700",
    },
  ];
  const summaryItems = [
    {
      label: "세션",
      value: `${answeredCount}/${dailyQuestions.length}문제`,
      detail:
        dailyQuestions.length > 0
          ? `현재 ${Math.min(currentIndex + 1, dailyQuestions.length)}번 문제`
          : "오늘 묶음 기준",
    },
    {
      label: "정답",
      value: `${accuracy}%`,
      detail: `${stats.correct}/${stats.total}`,
    },
    {
      label: "오답노트",
      value: `${Object.keys(readingNotesState.notes).length}개`,
      detail: "누적 독해 오답",
    },
    {
      label: "남은",
      value: `${remainingCount}문제`,
      detail: `오늘 묶음 ${dailyQuestions.length}개`,
    },
  ];

  return (
    <div className="space-y-4">
      <StudySessionHero
        eyebrow="독해 세션"
        title="독해"
        description={sessionDescription}
        progressLabel={`${answeredCount}/${dailyQuestions.length}`}
        progressDetail={`완료율 ${progressPercent}%`}
        progressPercent={progressPercent}
        badges={heroBadges}
        summaryItems={summaryItems}
      />

      {recentNotes.length > 0 && (
        <section className="rounded-[1.8rem] border border-rose-200/80 bg-rose-50/70 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">
                최근 오답 노트
              </p>
              <h2 className="mt-2 text-lg font-semibold text-stone-900">
                최근에 틀린 독해를 다시 볼 수 있습니다.
              </h2>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-rose-700 shadow-sm">
              총 {Object.keys(readingNotesState.notes).length}개
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {recentNotes.map((note) => (
              <div
                key={note.questionId}
                className="rounded-[1.35rem] border border-white/70 bg-white/90 px-4 py-4 shadow-[0_12px_30px_rgba(114,56,72,0.06)]"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                  <span className="rounded-full bg-rose-100 px-2.5 py-1 font-medium text-rose-700">
                    {note.level}
                  </span>
                  <span>{note.wrongCount}회 틀림</span>
                </div>
                <p className="mt-2 text-sm font-semibold leading-6 text-stone-900">
                  {note.question}
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  정답: {note.correctAnswer}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {note.unknownWords.length > 0 ? (
                    note.unknownWords.map((word) => (
                      <span
                        key={word.cardId}
                        className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700"
                      >
                        {word.word}
                        {word.reading ? ` · ${word.reading}` : ""}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-500">
                      모르는 단어가 아직 선택되지 않았습니다.
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {error && (
        <p className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </p>
      )}

      {!current ? (
        isSessionComplete ? (
          <div className="space-y-4 rounded-[1.8rem] border border-emerald-200 bg-emerald-50 px-6 py-8 text-center">
            <p className="text-lg font-semibold text-emerald-900">
              오늘 독해 분량을 모두 풀었습니다.
            </p>
            <p className="text-sm text-emerald-700">
              {currentDay}일차 목표 {dailyQuestions.length}개를 마쳤습니다.
            </p>
            <button
              onClick={restartSession}
              className="mx-auto inline-flex rounded-[1.2rem] bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              오늘 분량 다시 풀기
            </button>
          </div>
        ) : (
          <div className="rounded-[1.8rem] border border-dashed border-stone-300 bg-white/72 px-6 py-10 text-center text-stone-600">
            <p className="text-lg font-semibold text-stone-900">
              {supportedLevel} 독해 데이터는 아직 비어 있습니다.
            </p>
            <p className="mt-3 leading-7">
              사용할 수 있는 독해 문제가 아직 생성되지 않았습니다.
            </p>
          </div>
        )
      ) : (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-stone-600">
            <span className="rounded-full bg-green-100 px-3 py-1 font-medium text-green-700">
              문제 {Math.min(currentIndex + 1, dailyQuestions.length)}/{dailyQuestions.length}
            </span>
            <span className="rounded-full bg-white px-3 py-1 font-medium text-stone-700 shadow-sm">
              정답률 {accuracy}% ({stats.correct}/{stats.total})
            </span>
            <span className="rounded-full bg-stone-100 px-3 py-1 font-medium text-stone-600">
              지문과 질문 묶음
            </span>
          </div>

          <div className="rounded-[1.8rem] border border-stone-200/80 bg-white/88 p-6 shadow-[0_18px_45px_rgba(92,71,47,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500">
              지문
            </p>
            <p className="mt-3 whitespace-pre-wrap text-lg leading-relaxed text-stone-900">
              <JapaneseRubyText text={current.passage_yomigana ?? current.passage} />
            </p>

            <div className="mt-6 rounded-[1.4rem] border border-emerald-200 bg-emerald-50/70 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                질문
              </p>
              <h2 className="mt-2 text-lg font-semibold leading-relaxed text-stone-900">
                <JapaneseRubyText text={current.question_yomigana ?? current.question} />
              </h2>
            </div>
          </div>

          <div className="space-y-2">
            {current.choices.map((choice, i) => {
              let style = "border border-stone-200 bg-white/82 hover:border-green-400 hover:bg-white";

              if (showResult) {
                if (choice === current.correct_answer) {
                  style = "border-2 border-green-500 bg-green-50";
                } else if (
                  choice === selectedAnswer &&
                  choice !== current.correct_answer
                ) {
                  style = "border-2 border-red-500 bg-red-50";
                } else {
                  style = "border border-stone-200 bg-white/60 opacity-50";
                }
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(choice)}
                  disabled={showResult}
                  className={`w-full rounded-[1.3rem] p-4 text-left transition-colors ${style}`}
                >
                  <span className="mr-2 text-sm font-medium text-stone-400">
                    {i + 1}.
                  </span>
                  <JapaneseRubyText
                    text={current.choices_yomigana?.[i] ?? choice}
                    className="whitespace-pre-wrap"
                  />
                </button>
              );
            })}
          </div>

          {showResult && (
            <div className="space-y-3">
              <div
                className={`rounded-[1.4rem] p-4 text-sm ${
                  selectedAnswer === current.correct_answer
                    ? "bg-green-50 text-green-800"
                    : "bg-red-50 text-red-800"
                }`}
              >
                <p className="mb-1 font-semibold">
                  {selectedAnswer === current.correct_answer
                    ? "정답입니다!"
                    : `오답입니다. 정답: ${current.correct_answer}`}
                </p>
                <p>{current.explanation}</p>
              </div>

              {isWrongAnswer && (
                <div className="space-y-3 rounded-[1.45rem] border border-rose-200 bg-rose-50/70 px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-rose-900">
                        오답 노트에 저장했습니다.
                      </p>
                      <p className="mt-1 text-sm text-rose-700">
                        모르는 단어를 고르면 단어 카드에서 먼저 다시 보게 됩니다.
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-rose-700 shadow-sm">
                      연결 가능한 단어 {linkedFlashcards.length}개
                    </span>
                  </div>

                  {linkedFlashcards.length > 0 ? (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {linkedFlashcards.map((card) => {
                          const selected = selectedUnknownCardIds.includes(card.cardId);

                          return (
                            <button
                              key={card.cardId}
                              onClick={() => handleToggleUnknownWord(card)}
                              className={`rounded-[1.1rem] border px-3 py-2 text-left transition-colors ${
                                selected
                                  ? "border-rose-400 bg-white text-rose-900"
                                  : "border-rose-100 bg-white/80 text-stone-700 hover:border-rose-300"
                              }`}
                            >
                              <span className="block text-sm font-semibold">{card.word}</span>
                              {card.reading && (
                                <span className="mt-0.5 block text-xs text-stone-500">
                                  {card.reading}
                                </span>
                              )}
                              <span className="mt-1 block text-xs text-sky-700">
                                {card.meaning}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {queueMessage && (
                        <p className="rounded-[1rem] bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                          {queueMessage}
                        </p>
                      )}

                      {queueError && (
                        <p className="rounded-[1rem] bg-red-50 px-3 py-2 text-sm text-red-700">
                          {queueError}
                        </p>
                      )}

                      <button
                        onClick={() => void handleQueueUnknownWords()}
                        disabled={isQueueingWords || selectedUnknownCardIds.length === 0}
                        className="w-full rounded-[1.2rem] bg-rose-600 py-3 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                      >
                        {isQueueingWords
                          ? "우선 복습 목록에 올리는 중입니다."
                          : `선택 단어 ${selectedUnknownCardIds.length}개를 단어 카드 우선 복습에 추가`}
                      </button>
                    </>
                  ) : (
                    <p className="rounded-[1rem] bg-white/80 px-3 py-3 text-sm text-stone-600">
                      이 문항에서는 현재 단어 카드와 바로 연결되는 단어가 아직 없습니다.
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={handleNext}
                className="w-full rounded-[1.3rem] bg-green-600 py-3 font-medium text-white transition-colors hover:bg-green-700"
              >
                다음 문제
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
