import React, { startTransition, useEffect, useState } from 'react';
import './App.css';
import { roadmapApi, RoadmapApiError } from './services/roadmap';
import { DayAssignment, LevelOverview, PlanPreview } from './types/roadmap';

const DEFAULT_TARGET_DAYS = 100;

function App() {
  const [levels, setLevels] = useState<LevelOverview[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [targetDays, setTargetDays] = useState<number>(DEFAULT_TARGET_DAYS);
  const [dailyNewCards, setDailyNewCards] = useState<number>(12);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [plan, setPlan] = useState<PlanPreview | null>(null);
  const [assignment, setAssignment] = useState<DayAssignment | null>(null);
  const [loadingLevels, setLoadingLevels] = useState<boolean>(true);
  const [loadingPlan, setLoadingPlan] = useState<boolean>(false);
  const [loadingDay, setLoadingDay] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [importPath, setImportPath] = useState<string>('');
  const [importMessage, setImportMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadLevels = async () => {
      setLoadingLevels(true);
      setError(null);

      try {
        const response = await roadmapApi.getLevels();
        setLevels(response);

        if (response.length > 0) {
          const initialLevel = response[0];
          setSelectedLevel(initialLevel.level);
          setDailyNewCards(initialLevel.recommended_daily_new_cards);
        }
      } catch (err) {
        setError(getErrorMessage(err, '레벨 현황을 불러오지 못했습니다.'));
      } finally {
        setLoadingLevels(false);
      }
    };

    loadLevels();
  }, []);

  useEffect(() => {
    if (!selectedLevel) {
      return;
    }

    let active = true;
    setLoadingPlan(true);
    setError(null);

    roadmapApi.previewPlan({
      level: selectedLevel,
      target_days: targetDays,
      daily_new_cards: dailyNewCards,
    }).then((response) => {
      if (!active) {
        return;
      }
      setPlan(response);
      setSelectedDay((current) => Math.min(current, response.target_days));
    }).catch((err) => {
      if (!active) {
        return;
      }
      setError(getErrorMessage(err, '플랜을 생성하지 못했습니다.'));
      setPlan(null);
    }).finally(() => {
      if (active) {
        setLoadingPlan(false);
      }
    });

    return () => {
      active = false;
    };
  }, [selectedLevel, targetDays, dailyNewCards]);

  useEffect(() => {
    if (!selectedLevel || !plan) {
      return;
    }

    let active = true;
    setLoadingDay(true);

    roadmapApi.previewDay({
      level: selectedLevel,
      day_number: selectedDay,
      target_days: targetDays,
      daily_new_cards: dailyNewCards,
    }).then((response) => {
      if (active) {
        setAssignment(response);
      }
    }).catch((err) => {
      if (active) {
        setError(getErrorMessage(err, 'Day 배정을 불러오지 못했습니다.'));
        setAssignment(null);
      }
    }).finally(() => {
      if (active) {
        setLoadingDay(false);
      }
    });

    return () => {
      active = false;
    };
  }, [selectedLevel, plan, selectedDay, targetDays, dailyNewCards]);

  const handleLevelSelect = (level: LevelOverview) => {
    startTransition(() => {
      setSelectedLevel(level.level);
      setDailyNewCards(level.recommended_daily_new_cards);
      setSelectedDay(1);
    });
  };

  const handleImport = async () => {
    if (!importPath.trim()) {
      setError('APKG 경로를 입력하세요.');
      return;
    }

    setImportMessage(null);
    setError(null);

    try {
      const result = await roadmapApi.importApkg({
        file_path: importPath.trim(),
        overwrite: true,
      });
      setImportMessage(`${result.source_name}에서 ${result.item_count.toLocaleString()}개 카드를 불러왔습니다.`);

      const refreshedLevels = await roadmapApi.getLevels();
      setLevels(refreshedLevels);
      if (refreshedLevels.length > 0) {
        setSelectedLevel(refreshedLevels[0].level);
        setDailyNewCards(refreshedLevels[0].recommended_daily_new_cards);
        setSelectedDay(1);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'APKG import에 실패했습니다.'));
    }
  };

  const highlightedDays = plan
    ? Array.from(new Set([1, 7, 14, 30, 60, 100, selectedDay].filter((day) => day <= plan.target_days))).sort((left, right) => left - right)
    : [];

  return (
    <div className="app-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">JLPT 100-Day Roadmap</p>
          <h1>단어와 문법을 100일 안에 끝내는 Anki 학습 대시보드</h1>
          <p className="hero-description">
            레벨별 덱 수량을 기준으로 하루 신규 카드와 복습량을 자동 분배합니다.
            초반에는 신규 카드, 후반에는 버퍼 리뷰에 집중하도록 설계했습니다.
          </p>
        </div>

        <div className="hero-metrics">
          <div className="metric-card">
            <span className="metric-label">선택 레벨</span>
            <strong>{selectedLevel || '미선택'}</strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">하루 신규</span>
            <strong>{dailyNewCards}장</strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">목표 기간</span>
            <strong>{targetDays}일</strong>
          </div>
        </div>
      </header>

      {error && (
        <section className="alert error-alert" role="alert">
          {error}
        </section>
      )}

      {importMessage && (
        <section className="alert success-alert">
          {importMessage}
        </section>
      )}

      {loadingLevels ? (
        <main className="panel loading-panel">
          <p>레벨 데이터를 불러오는 중입니다...</p>
        </main>
      ) : levels.length === 0 ? (
        <main className="panel empty-panel">
          <h2>아직 import된 JLPT 카드가 없습니다.</h2>
          <p>로컬 APKG 경로를 입력하면 어휘/문법 덱을 바로 가져와 100일 플랜을 계산합니다.</p>
          <div className="import-form">
            <input
              aria-label="apkg-path"
              className="path-input"
              value={importPath}
              onChange={(event) => setImportPath(event.target.value)}
              placeholder="/absolute/path/to/deck.apkg"
            />
            <button className="primary-button" onClick={handleImport}>
              APKG import
            </button>
          </div>
        </main>
      ) : (
        <main className="dashboard">
          <section className="panel level-panel">
            <div className="section-head">
              <h2>레벨별 완주 코스</h2>
              <p>현재 import된 카드 수를 기반으로 권장 속도를 제시합니다.</p>
            </div>

            <div className="level-grid">
              {levels.map((level) => (
                <button
                  key={level.level}
                  className={`level-card ${selectedLevel === level.level ? 'active' : ''}`}
                  onClick={() => handleLevelSelect(level)}
                >
                  <span className="level-name">{level.level}</span>
                  <strong>{level.total_count.toLocaleString()} cards</strong>
                  <span>어휘 {level.vocabulary_count.toLocaleString()} · 문법 {level.grammar_count.toLocaleString()}</span>
                  <span>권장 신규 {level.recommended_daily_new_cards}장</span>
                </button>
              ))}
            </div>
          </section>

          <section className="panel planner-panel">
            <div className="section-head">
              <h2>플랜 빌더</h2>
              <p>속도를 조정하면 100일 안에 신규 카드가 끝나는지 바로 확인합니다.</p>
            </div>

            <div className="planner-controls">
              <label>
                하루 신규 카드
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={dailyNewCards}
                  onChange={(event) => setDailyNewCards(Number(event.target.value))}
                />
              </label>

              <label>
                목표 일수
                <input
                  type="number"
                  min={14}
                  max={180}
                  value={targetDays}
                  onChange={(event) => setTargetDays(Number(event.target.value))}
                />
              </label>
            </div>

            {loadingPlan || !plan ? (
              <div className="planner-placeholder">플랜을 계산하는 중입니다...</div>
            ) : (
              <>
                <div className="summary-grid">
                  <div className="summary-card">
                    <span>실제 신규 투입 기간</span>
                    <strong>{plan.required_active_days}일</strong>
                  </div>
                  <div className="summary-card">
                    <span>버퍼 리뷰 기간</span>
                    <strong>{plan.buffer_days}일</strong>
                  </div>
                  <div className="summary-card">
                    <span>권장 복습량</span>
                    <strong>{plan.recommended_daily_review_cards}장</strong>
                  </div>
                </div>

                <div className="timeline-strip" aria-label="100-day timeline">
                  {plan.days.map((day) => (
                    <button
                      key={day.day_number}
                      className={`timeline-cell ${day.phase} ${selectedDay === day.day_number ? 'selected' : ''}`}
                      title={`Day ${day.day_number}: 신규 ${day.new_cards}, 복습 ${day.review_estimate}`}
                      onClick={() => startTransition(() => setSelectedDay(day.day_number))}
                    />
                  ))}
                </div>

                <div className="milestone-list">
                  {plan.milestones.map((milestone) => (
                    <button
                      key={milestone.day_number}
                      className={`milestone-card ${selectedDay === milestone.day_number ? 'active' : ''}`}
                      onClick={() => startTransition(() => setSelectedDay(milestone.day_number))}
                    >
                      <span>{milestone.label}</span>
                      <strong>{milestone.progress_percent}%</strong>
                      <small>{milestone.focus}</small>
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>

          <section className="panel today-panel">
            <div className="section-head">
              <h2>Day {selectedDay} 배정</h2>
              <p>Anki식 초기 복습 리듬을 고려한 신규 카드 샘플입니다.</p>
            </div>

            <div className="day-switcher">
              {highlightedDays.map((day) => (
                <button
                  key={day}
                  className={selectedDay === day ? 'selected' : ''}
                  onClick={() => startTransition(() => setSelectedDay(day))}
                >
                  Day {day}
                </button>
              ))}
            </div>

            {loadingDay || !assignment ? (
              <div className="planner-placeholder">Day 배정을 계산하는 중입니다...</div>
            ) : (
              <>
                <div className="day-summary">
                  <div>
                    <span>오늘 포커스</span>
                    <strong>{assignment.summary.focus}</strong>
                  </div>
                  <div>
                    <span>신규 카드</span>
                    <strong>{assignment.summary.new_cards}장</strong>
                  </div>
                  <div>
                    <span>예상 복습량</span>
                    <strong>{assignment.summary.review_estimate}장</strong>
                  </div>
                </div>

                <div className="card-columns">
                  <article className="study-column">
                    <div className="column-head">
                      <h3>어휘</h3>
                      <span>{assignment.vocabulary.length}장</span>
                    </div>
                    <div className="study-stack">
                      {assignment.vocabulary.map((item) => (
                        <div key={item.id} className="study-card">
                          <div className="study-card-head">
                            <strong>{item.title}</strong>
                            {item.reading && <span>{item.reading}</span>}
                          </div>
                          <p>{item.answer}</p>
                          {item.extra_text && <small>{item.extra_text}</small>}
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="study-column">
                    <div className="column-head">
                      <h3>문법</h3>
                      <span>{assignment.grammar.length}장</span>
                    </div>
                    <div className="study-stack">
                      {assignment.grammar.map((item) => (
                        <div key={item.id} className="study-card">
                          <div className="study-card-head">
                            <strong>{item.title}</strong>
                            {item.source_reference && <span>No. {item.source_reference}</span>}
                          </div>
                          <p>{item.answer}</p>
                          {item.example_jp && <small>JP: {item.example_jp}</small>}
                          {item.example_kr && <small>KR: {item.example_kr}</small>}
                        </div>
                      ))}
                    </div>
                  </article>
                </div>
              </>
            )}
          </section>

          <section className="panel cadence-panel">
            <div className="section-head">
              <h2>첫 14일 러닝 페이스</h2>
              <p>초반 2주가 Anki 습관 형성 구간입니다. 여기서 무너지지 않도록 복습량을 같이 봅니다.</p>
            </div>

            {plan && (
              <div className="day-list">
                {plan.days.slice(0, 14).map((day) => (
                  <button
                    key={day.day_number}
                    className={`day-row ${selectedDay === day.day_number ? 'active' : ''}`}
                    onClick={() => startTransition(() => setSelectedDay(day.day_number))}
                  >
                    <span>Day {day.day_number}</span>
                    <span>신규 {day.new_cards}</span>
                    <span>복습 {day.review_estimate}</span>
                    <strong>{day.focus}</strong>
                  </button>
                ))}
              </div>
            )}
          </section>
        </main>
      )}
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof RoadmapApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export default App;
