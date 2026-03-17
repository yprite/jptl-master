"use client";

import { useActiveStudyProfile } from "@/lib/use-active-study-profile";

export default function ReadingPage() {
  const { isLoading, supportedLevel, userLabel } = useActiveStudyProfile();

  if (isLoading) {
    return <p className="text-center text-gray-500">학습 레벨을 불러오는 중입니다.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">독해</h1>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
            현재 사용자 {userLabel}
          </span>
          <span className="rounded-full bg-green-100 px-3 py-1 font-medium text-green-700">
            설정 레벨 {supportedLevel}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-gray-600">
        <p className="text-lg font-semibold text-gray-900">
          {supportedLevel} 독해 데이터는 아직 비어 있습니다.
        </p>
        <p className="mt-3 leading-7">
          현재 연결된 <span className="font-medium">JLPT 통합덱2 20250908.apkg</span> 원본에는
          독해 노트가 없어 자동으로 문제를 채울 수 없습니다.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          플래시카드, 어휘, 문법은 실제 덱 데이터로 교체했고 독해는 별도 소스가 필요합니다.
        </p>
      </div>
    </div>
  );
}
