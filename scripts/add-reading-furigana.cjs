/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const kuromoji = require("kuromoji");

const ROOT = process.cwd();
const DICT_PATH = path.join(ROOT, "node_modules/kuromoji/dict");
const READING_FILES = [
  "public/study-data/reading-questions-N5.json",
  "public/study-data/reading-questions-N4.json",
  "public/study-data/reading-questions-N3.json",
];

function hasKanji(text) {
  return /[々〆ヶ一-龯]/u.test(text);
}

function toHiragana(katakana) {
  return katakana.replace(/[ァ-ン]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0x60)
  );
}

function annotateText(tokenizer, text) {
  return tokenizer
    .tokenize(text)
    .map((token) => {
      if (!hasKanji(token.surface_form) || !token.reading) {
        return token.surface_form;
      }

      return `{{${token.surface_form}||${toHiragana(token.reading)}}}`;
    })
    .join("");
}

function updateFile(tokenizer, relativePath) {
  const filePath = path.join(ROOT, relativePath);
  const questions = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const nextQuestions = questions.map((question) => ({
    ...question,
    passage_yomigana: annotateText(tokenizer, question.passage),
    question_yomigana: annotateText(tokenizer, question.question),
    choices_yomigana: Array.isArray(question.choices)
      ? question.choices.map((choice) => annotateText(tokenizer, choice))
      : [],
  }));

  fs.writeFileSync(filePath, `${JSON.stringify(nextQuestions, null, 2)}\n`);
  console.log(`updated ${relativePath}`);
}

kuromoji.builder({ dicPath: DICT_PATH }).build((error, tokenizer) => {
  if (error) {
    console.error(error);
    process.exit(1);
  }

  for (const filePath of READING_FILES) {
    updateFile(tokenizer, filePath);
  }
});
