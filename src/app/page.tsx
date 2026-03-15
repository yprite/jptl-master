import Link from "next/link";

const sections = [
  {
    href: "/flashcard",
    title: "단어 암기",
    desc: "Anki 스타일 플래시카드로 단어를 외우세요. 간격 반복으로 효율적으로 암기합니다.",
    color: "hover:border-blue-400 dark:hover:border-blue-600",
    badge: "SM-2",
    badgeColor: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  },
  {
    href: "/vocabulary",
    title: "어휘 문제",
    desc: "한자 읽기, 표기, 문맥 규정, 유의 표현, 용법 등 JLPT 어휘 문제를 풀어보세요.",
    color: "hover:border-indigo-400 dark:hover:border-indigo-600",
    badge: "5유형",
    badgeColor: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400",
  },
  {
    href: "/grammar",
    title: "문법 문제",
    desc: "문장 문법, 문장 조립, 글 속 문법 등 JLPT 문법 문제를 풀어보세요.",
    color: "hover:border-amber-400 dark:hover:border-amber-600",
    badge: "3유형",
    badgeColor: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  },
  {
    href: "/reading",
    title: "독해",
    desc: "단문/중문 독해와 정보 검색 문제를 풀어보세요. 정답과 해설이 제공됩니다.",
    color: "hover:border-green-400 dark:hover:border-green-600",
    badge: "독해+정보검색",
    badgeColor: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  },
  {
    href: "/plan",
    title: "학습 계획",
    desc: "기간별 학습 계획을 세우고 매일 진도를 확인하세요.",
    color: "hover:border-purple-400 dark:hover:border-purple-600",
    badge: "플래너",
    badgeColor: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold">JPTL</h1>
        <p className="text-gray-600 dark:text-gray-400">
          JLPT N4/N3 종합 학습 (청해 제외)
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className={`block p-6 rounded-xl border border-gray-200 dark:border-gray-800 ${s.color} transition-colors`}
          >
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-semibold">{s.title}</h2>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.badgeColor}`}
              >
                {s.badge}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {s.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
