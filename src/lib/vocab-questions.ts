/**
 * JLPT 어휘 문제 유형 데이터 (N4/N3)
 */

export type VocabQuestionType =
  | "kanji_reading"    // 한자 읽기
  | "notation"         // 표기 (히라가나 → 한자)
  | "context"          // 문맥 규정
  | "synonym"          // 유의 표현
  | "usage";           // 용법

export interface VocabQuestion {
  type: VocabQuestionType;
  level: "N4" | "N3";
  question: string;
  choices: string[];
  correct_answer: string;
  explanation: string;
}

export const vocabQuestionTypeLabels: Record<VocabQuestionType, string> = {
  kanji_reading: "한자 읽기",
  notation: "표기",
  context: "문맥 규정",
  synonym: "유의 표현",
  usage: "용법",
};

export const vocabQuestions: VocabQuestion[] = [
  // ====== N4 한자 읽기 ======
  {
    type: "kanji_reading",
    level: "N4",
    question: "「経験」の読み方はどれですか？",
    choices: ["けいけん", "けいげん", "きょうけん", "けっけん"],
    correct_answer: "けいけん",
    explanation: "経験（けいけん）は「경험」という意味です。",
  },
  {
    type: "kanji_reading",
    level: "N4",
    question: "「約束」の読み方はどれですか？",
    choices: ["やくそく", "やくぞく", "やそく", "やっそく"],
    correct_answer: "やくそく",
    explanation: "約束（やくそく）は「약속」という意味です。",
  },
  {
    type: "kanji_reading",
    level: "N4",
    question: "「出発」の読み方はどれですか？",
    choices: ["しゅっぱつ", "でっぱつ", "しゅつはつ", "でぱつ"],
    correct_answer: "しゅっぱつ",
    explanation: "出発（しゅっぱつ）は「출발」という意味です。",
  },
  {
    type: "kanji_reading",
    level: "N4",
    question: "「説明」の読み方はどれですか？",
    choices: ["せつめい", "せいめい", "せつみょう", "せっめい"],
    correct_answer: "せつめい",
    explanation: "説明（せつめい）は「설명」という意味です。",
  },
  {
    type: "kanji_reading",
    level: "N4",
    question: "「心配」の読み方はどれですか？",
    choices: ["しんぱい", "しんはい", "こころぱい", "しんぺい"],
    correct_answer: "しんぱい",
    explanation: "心配（しんぱい）は「걱정」という意味です。",
  },
  // ====== N3 한자 읽기 ======
  {
    type: "kanji_reading",
    level: "N3",
    question: "「影響」の読み方はどれですか？",
    choices: ["えいきょう", "えいひびき", "かげひびき", "えいこう"],
    correct_answer: "えいきょう",
    explanation: "影響（えいきょう）は「영향」という意味です。",
  },
  {
    type: "kanji_reading",
    level: "N3",
    question: "「責任」の読み方はどれですか？",
    choices: ["せきにん", "せきじん", "しゃくにん", "さくにん"],
    correct_answer: "せきにん",
    explanation: "責任（せきにん）は「책임」という意味です。",
  },
  {
    type: "kanji_reading",
    level: "N3",
    question: "「環境」の読み方はどれですか？",
    choices: ["かんきょう", "かんけい", "わんきょう", "かんきゅう"],
    correct_answer: "かんきょう",
    explanation: "環境（かんきょう）は「환경」という意味です。",
  },
  {
    type: "kanji_reading",
    level: "N3",
    question: "「判断」の読み方はどれですか？",
    choices: ["はんだん", "ばんだん", "はんたん", "はだん"],
    correct_answer: "はんだん",
    explanation: "判断（はんだん）は「판단」という意味です。",
  },
  {
    type: "kanji_reading",
    level: "N3",
    question: "「経済」の読み方はどれですか？",
    choices: ["けいざい", "けいさい", "きょうざい", "けざい"],
    correct_answer: "けいざい",
    explanation: "経済（けいざい）は「경제」という意味です。",
  },

  // ====== N4 표기 ======
  {
    type: "notation",
    level: "N4",
    question: "「べんきょう」を漢字で書くとどれですか？",
    choices: ["勉強", "勉教", "免強", "勉境"],
    correct_answer: "勉強",
    explanation: "べんきょう → 勉強（공부）",
  },
  {
    type: "notation",
    level: "N4",
    question: "「りょこう」を漢字で書くとどれですか？",
    choices: ["旅行", "旅校", "旅向", "旅考"],
    correct_answer: "旅行",
    explanation: "りょこう → 旅行（여행）",
  },
  {
    type: "notation",
    level: "N4",
    question: "「しんぱい」を漢字で書くとどれですか？",
    choices: ["心配", "新配", "心拝", "進配"],
    correct_answer: "心配",
    explanation: "しんぱい → 心配（걱정）",
  },
  {
    type: "notation",
    level: "N3",
    question: "「けいざい」を漢字で書くとどれですか？",
    choices: ["経済", "計済", "景済", "経斉"],
    correct_answer: "経済",
    explanation: "けいざい → 経済（경제）",
  },
  {
    type: "notation",
    level: "N3",
    question: "「ぎじゅつ」を漢字で書くとどれですか？",
    choices: ["技術", "義術", "疑述", "議術"],
    correct_answer: "技術",
    explanation: "ぎじゅつ → 技術（기술）",
  },

  // ====== N4 문맥 규정 ======
  {
    type: "context",
    level: "N4",
    question: "明日テストがあるから、今日は（　　）しなければならない。",
    choices: ["勉強", "散歩", "旅行", "買い物"],
    correct_answer: "勉強",
    explanation: "테스트가 있으니 '공부'를 해야 합니다.",
  },
  {
    type: "context",
    level: "N4",
    question: "お母さんが（　　）なので、早く病院に連れて行きました。",
    choices: ["病気", "元気", "自由", "安全"],
    correct_answer: "病気",
    explanation: "병원에 데려간 이유는 '병(아프다)'이기 때문입니다.",
  },
  {
    type: "context",
    level: "N4",
    question: "友だちに電話したが、出なかったので（　　）をした。",
    choices: ["連絡", "注意", "反対", "失敗"],
    correct_answer: "連絡",
    explanation: "전화를 다시 한 것이므로 '연락'이 맞습니다.",
  },
  {
    type: "context",
    level: "N3",
    question: "この問題の（　　）がわからないので、調べてみます。",
    choices: ["原因", "結果", "意見", "効果"],
    correct_answer: "原因",
    explanation: "문제의 이유를 모르므로 '원인'이 적절합니다.",
  },
  {
    type: "context",
    level: "N3",
    question: "新しい（　　）を使って、仕事がもっと早くできるようになった。",
    choices: ["技術", "態度", "制度", "対象"],
    correct_answer: "技術",
    explanation: "일이 빨라진 것은 새로운 '기술' 덕분입니다.",
  },

  // ====== N4 유의 표현 ======
  {
    type: "synonym",
    level: "N4",
    question: "「趣味」に意味が近い言葉はどれですか？",
    choices: ["好きなこと", "仕事", "勉強", "約束"],
    correct_answer: "好きなこと",
    explanation: "趣味（취미）= 好きなこと（좋아하는 것）",
  },
  {
    type: "synonym",
    level: "N4",
    question: "「相談する」に意味が近い言葉はどれですか？",
    choices: ["話し合う", "連絡する", "注意する", "準備する"],
    correct_answer: "話し合う",
    explanation: "相談する（상담하다）≒ 話し合う（의논하다）",
  },
  {
    type: "synonym",
    level: "N3",
    question: "「基本」に意味が近い言葉はどれですか？",
    choices: ["もとになること", "結果", "条件", "目的"],
    correct_answer: "もとになること",
    explanation: "基本（기본）= もとになること（기초가 되는 것）",
  },
  {
    type: "synonym",
    level: "N3",
    question: "「状況」に意味が近い言葉はどれですか？",
    choices: ["ようす", "原因", "効果", "関係"],
    correct_answer: "ようす",
    explanation: "状況（상황）≒ ようす（상태, 모양）",
  },

  // ====== N4 용법 ======
  {
    type: "usage",
    level: "N4",
    question: "「予定」の使い方として正しいのはどれですか？",
    choices: [
      "来週の予定を教えてください。",
      "この料理の予定はおいしい。",
      "部屋を予定にしてください。",
      "予定が降っています。",
    ],
    correct_answer: "来週の予定を教えてください。",
    explanation: "予定（예정）은 앞으로의 계획을 의미합니다.",
  },
  {
    type: "usage",
    level: "N4",
    question: "「注意」の使い方として正しいのはどれですか？",
    choices: [
      "車に注意してください。",
      "注意がおいしいです。",
      "注意に住んでいます。",
      "注意を食べました。",
    ],
    correct_answer: "車に注意してください。",
    explanation: "注意（주의）는 조심하라는 의미로 사용합니다.",
  },
  {
    type: "usage",
    level: "N3",
    question: "「影響」の使い方として正しいのはどれですか？",
    choices: [
      "台風は交通に大きな影響を与えた。",
      "影響の天気はいいです。",
      "友だちと影響に行きました。",
      "影響を3つ買いました。",
    ],
    correct_answer: "台風は交通に大きな影響を与えた。",
    explanation: "影響（영향）은 '영향을 주다/미치다'로 사용합니다.",
  },
  {
    type: "usage",
    level: "N3",
    question: "「条件」の使い方として正しいのはどれですか？",
    choices: [
      "この仕事の条件を確認してください。",
      "条件の天気は晴れです。",
      "条件を食べてから出かけます。",
      "条件が高い山です。",
    ],
    correct_answer: "この仕事の条件を確認してください。",
    explanation: "条件（조건）은 어떤 일의 조건/요건을 의미합니다.",
  },
];
