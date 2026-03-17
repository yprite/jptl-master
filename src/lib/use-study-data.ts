"use client";

import { useEffect, useState } from "react";

interface UseStudyDataResult<T> {
  data: T;
  error: string | null;
  isLoading: boolean;
}

export function useStudyData<T>(filename: string | null, fallback: T): UseStudyDataResult<T> {
  const [data, setData] = useState<T>(fallback);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(filename));

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!filename) {
        setData(fallback);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/study-data/${filename}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`학습 데이터를 불러오지 못했습니다: ${response.status}`);
        }

        const payload = (await response.json()) as T;
        if (!cancelled) {
          setData(payload);
          setIsLoading(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          setData(fallback);
          setError(loadError instanceof Error ? loadError.message : "학습 데이터를 불러오지 못했습니다.");
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [fallback, filename]);

  return { data, error, isLoading };
}
