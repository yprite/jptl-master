import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold">JPTL</h1>
        <p className="text-gray-600 dark:text-gray-400">
          JLPT N4/N3 단어 & 독해 학습
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/flashcard"
          className="block p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">단어 학습</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Anki 스타일 플래시카드로 단어를 외우세요. 간격 반복으로 효율적으로
            암기합니다.
          </p>
        </Link>

        <Link
          href="/reading"
          className="block p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-green-400 dark:hover:border-green-600 transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">독해</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            레벨에 맞는 독해 지문과 문제를 풀어보세요. 정답과 해설이
            제공됩니다.
          </p>
        </Link>

        <Link
          href="/plan"
          className="block p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-purple-400 dark:hover:border-purple-600 transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">학습 계획</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            기간별 학습 계획을 세우고 매일 진도를 확인하세요.
          </p>
        </Link>
      </div>
    </div>
  );
}
