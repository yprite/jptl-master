-- Seed: N4/N3 vocabularies
INSERT INTO vocabularies (word, reading, meaning, level, example) VALUES ('勉強', 'べんきょう', '공부', 'N4', '日本語を勉強します。');
INSERT INTO vocabularies (word, reading, meaning, level, example) VALUES ('旅行', 'りょこう', '여행', 'N4', '旅行に行きます。');
INSERT INTO vocabularies (word, reading, meaning, level, example) VALUES ('病気', 'びょうき', '병', 'N4', '病気になりました。');
INSERT INTO vocabularies (word, reading, meaning, level, example) VALUES ('準備', 'じゅんび', '준비', 'N4', '試験の準備をします。');
INSERT INTO vocabularies (word, reading, meaning, level, example) VALUES ('約束', 'やくそく', '약속', 'N4', '友達と約束しました。');
INSERT INTO vocabularies (word, reading, meaning, level, example) VALUES ('経験', 'けいけん', '경험', 'N4', '良い経験になりました。');
INSERT INTO vocabularies (word, reading, meaning, level, example) VALUES ('練習', 'れんしゅう', '연습', 'N4', '毎日練習します。');
INSERT INTO vocabularies (word, reading, meaning, level, example) VALUES ('質問', 'しつもん', '질문', 'N4', '質問があります。');
INSERT INTO vocabularies (word, reading, meaning, level, example) VALUES ('経験', 'けいけん', '경험', 'N3', '貴重な経験をしました。');
INSERT INTO vocabularies (word, reading, meaning, level, example) VALUES ('影響', 'えいきょう', '영향', 'N3', '環境への影響を考えます。');
INSERT INTO vocabularies (word, reading, meaning, level, example) VALUES ('環境', 'かんきょう', '환경', 'N3', '自然環境を守ります。');
INSERT INTO vocabularies (word, reading, meaning, level, example) VALUES ('開発', 'かいはつ', '개발', 'N3', '新しい技術を開発します。');
INSERT INTO vocabularies (word, reading, meaning, level, example) VALUES ('改善', 'かいぜん', '개선', 'N3', 'サービスを改善します。');

-- Seed: N4/N3 reading questions
INSERT INTO reading_questions (level, passage, question, choices, correct_answer, explanation, difficulty) VALUES ('N4', '昨日、友達と映画を見に行きました。とても面白い映画でした。', '筆者はいつ映画を見ましたか？', '["今日","昨日","一昨日","来週"]', '昨日', '本文によると、筆者は昨日映画を見ました。', 2);
