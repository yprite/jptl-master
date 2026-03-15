/**
 * JLPT 문법 문제 유형 데이터 (N4/N3)
 */

export type GrammarQuestionType =
  | "sentence_grammar"  // 문장 문법 (빈칸 채우기)
  | "sentence_order"    // 문장 조립 (어순 배열)
  | "passage_grammar";  // 글 속 문법

export interface GrammarQuestion {
  type: GrammarQuestionType;
  level: "N4" | "N3";
  question: string;
  // sentence_order일 때 사용: 올바른 순서
  order_parts?: string[];
  choices: string[];
  correct_answer: string;
  explanation: string;
}

export const grammarQuestionTypeLabels: Record<GrammarQuestionType, string> = {
  sentence_grammar: "문장 문법",
  sentence_order: "문장 조립",
  passage_grammar: "글 속 문법",
};

export const grammarQuestions: GrammarQuestion[] = [
  // ====== N4 문장 문법 ======
  {
    type: "sentence_grammar",
    level: "N4",
    question: "日本語が上手に（　　）なりたいです。",
    choices: ["話せるように", "話すように", "話したように", "話せたように"],
    correct_answer: "話せるように",
    explanation: "〜ようになる: ~하게 되다. 가능형 + ようになる = '할 수 있게 되다'",
  },
  {
    type: "sentence_grammar",
    level: "N4",
    question: "母に野菜を（　　）食べさせられました。",
    choices: ["無理に", "無理で", "無理な", "無理く"],
    correct_answer: "無理に",
    explanation: "無理に: 억지로. な형용사의 부사 형태는 〜に입니다.",
  },
  {
    type: "sentence_grammar",
    level: "N4",
    question: "先生が話している（　　）、静かにしてください。",
    choices: ["間は", "間に", "前は", "後で"],
    correct_answer: "間は",
    explanation: "〜間は: ~하는 동안은. 지속적인 상태에서의 행동을 나타냅니다.",
  },
  {
    type: "sentence_grammar",
    level: "N4",
    question: "薬を飲んだ（　　）、熱が下がりました。",
    choices: ["おかげで", "せいで", "ように", "ために"],
    correct_answer: "おかげで",
    explanation: "〜おかげで: ~덕분에. 좋은 결과의 원인을 나타냅니다.",
  },
  {
    type: "sentence_grammar",
    level: "N4",
    question: "あの映画は何度見（　　）面白いです。",
    choices: ["ても", "たら", "ると", "てから"],
    correct_answer: "ても",
    explanation: "〜ても: ~해도. '몇 번 봐도 재미있다'는 의미입니다.",
  },
  // ====== N3 문장 문법 ======
  {
    type: "sentence_grammar",
    level: "N3",
    question: "この問題は複雑で、簡単には解決（　　）。",
    choices: ["できない", "しない", "ならない", "いけない"],
    correct_answer: "できない",
    explanation: "解決できない: 해결할 수 없다. 가능 표현의 부정형입니다.",
  },
  {
    type: "sentence_grammar",
    level: "N3",
    question: "努力した（　　）、いい結果が出なかった。",
    choices: ["にもかかわらず", "おかげで", "ために", "ように"],
    correct_answer: "にもかかわらず",
    explanation: "〜にもかかわらず: ~에도 불구하고. 예상과 다른 결과를 나타냅니다.",
  },
  {
    type: "sentence_grammar",
    level: "N3",
    question: "このレストランは値段（　　）味もいいです。",
    choices: ["だけでなく", "しか", "ばかり", "だけ"],
    correct_answer: "だけでなく",
    explanation: "〜だけでなく: ~뿐만 아니라. 가격뿐 아니라 맛도 좋다는 의미.",
  },
  {
    type: "sentence_grammar",
    level: "N3",
    question: "天気予報（　　）、明日は雨が降るそうです。",
    choices: ["によると", "について", "に対して", "にとって"],
    correct_answer: "によると",
    explanation: "〜によると: ~에 의하면. 정보의 출처를 나타냅니다.",
  },
  {
    type: "sentence_grammar",
    level: "N3",
    question: "子どもが安全に遊べる（　　）公園を作りました。",
    choices: ["ような", "ように", "ようで", "ようだ"],
    correct_answer: "ような",
    explanation: "〜ような + 명사: ~와 같은. 명사를 수식할 때 ような를 씁니다.",
  },

  // ====== N4 문장 조립 ======
  {
    type: "sentence_order",
    level: "N4",
    question: "次の言葉を正しい順番に並べてください。「私は ___＿★＿___ 思います。」",
    order_parts: ["日本に", "行きたいと", "いつか"],
    choices: [
      "いつか 日本に 行きたいと",
      "日本に いつか 行きたいと",
      "行きたいと いつか 日本に",
      "いつか 行きたいと 日本に",
    ],
    correct_answer: "いつか 日本に 行きたいと",
    explanation: "私はいつか日本に行きたいと思います。(언젠가 일본에 가고 싶다고 생각합니다)",
  },
  {
    type: "sentence_order",
    level: "N4",
    question: "次の言葉を正しい順番に並べてください。「彼は ___＿★＿___ 来ませんでした。」",
    order_parts: ["約束した", "のに", "パーティーに"],
    choices: [
      "約束した のに パーティーに",
      "パーティーに 約束した のに",
      "のに 約束した パーティーに",
      "パーティーに のに 約束した",
    ],
    correct_answer: "約束した のに パーティーに",
    explanation: "彼は約束したのにパーティーに来ませんでした。(약속했는데도 파티에 오지 않았습니다)",
  },
  {
    type: "sentence_order",
    level: "N3",
    question: "次の言葉を正しい順番に並べてください。「この本は ___＿★＿___ 書かれています。」",
    order_parts: ["わかりやすく", "だれにでも", "読めるように"],
    choices: [
      "だれにでも 読めるように わかりやすく",
      "わかりやすく だれにでも 読めるように",
      "読めるように だれにでも わかりやすく",
      "だれにでも わかりやすく 読めるように",
    ],
    correct_answer: "だれにでも 読めるように わかりやすく",
    explanation: "この本はだれにでも読めるようにわかりやすく書かれています。(누구나 읽을 수 있도록 알기 쉽게 쓰여 있습니다)",
  },
  {
    type: "sentence_order",
    level: "N3",
    question: "次の言葉を正しい順番に並べてください。「彼女は ___＿★＿___ 有名です。」",
    order_parts: ["ピアノが", "上手な", "ことで"],
    choices: [
      "ピアノが 上手な ことで",
      "上手な ピアノが ことで",
      "ことで ピアノが 上手な",
      "ピアノが ことで 上手な",
    ],
    correct_answer: "ピアノが 上手な ことで",
    explanation: "彼女はピアノが上手なことで有名です。(그녀는 피아노를 잘 치는 것으로 유명합니다)",
  },

  // ====== N4 글 속 문법 ======
  {
    type: "passage_grammar",
    level: "N4",
    question: "私は毎日日本語を勉強しています。来月試験が【①】ので、もっと頑張らなければなりません。友だちに教えて【②】こともあります。一人で勉強する【③】、友だちと一緒のほうが楽しいです。\n\n①に入るのはどれですか？",
    choices: ["ある", "いる", "する", "なる"],
    correct_answer: "ある",
    explanation: "試験がある: 시험이 있다. 존재를 나타내는 'ある'가 적절합니다.",
  },
  {
    type: "passage_grammar",
    level: "N4",
    question: "私は毎日日本語を勉強しています。来月試験があるので、もっと頑張らなければなりません。友だちに教えて【②】こともあります。一人で勉強するより、友だちと一緒のほうが楽しいです。\n\n②に入るのはどれですか？",
    choices: ["もらう", "あげる", "くれる", "やる"],
    correct_answer: "もらう",
    explanation: "教えてもらう: 가르침을 받다. 수수표현에서 자신이 받는 행위입니다.",
  },
  {
    type: "passage_grammar",
    level: "N3",
    question: "最近、日本では外国人観光客が増えている。観光客が増えた【①】、ホテルの数も増えた。しかし、マナーの問題が起きる【②】もある。文化が違う【③】、理解し合うことが大切だ。\n\n①に入るのはどれですか？",
    choices: ["ことから", "ことに", "ことで", "ことが"],
    correct_answer: "ことから",
    explanation: "〜ことから: ~한 것으로부터. 원인/이유를 나타냅니다.",
  },
  {
    type: "passage_grammar",
    level: "N3",
    question: "最近、日本では外国人観光客が増えている。観光客が増えたことから、ホテルの数も増えた。しかし、マナーの問題が起きる【②】もある。文化が違うからこそ、理解し合うことが大切だ。\n\n②に入るのはどれですか？",
    choices: ["こと", "もの", "ため", "わけ"],
    correct_answer: "こと",
    explanation: "〜こともある: ~하는 경우도 있다. 가능성을 나타냅니다.",
  },
];
