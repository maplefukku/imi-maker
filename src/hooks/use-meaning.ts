"use client";

import { useState, useCallback } from "react";
import type { MeaningResponse } from "@/types";

interface UseMeaningReturn {
  result: MeaningResponse | null;
  isLoading: boolean;
  error: string | null;
  fetchMeaning: (action: string) => Promise<void>;
  reset: () => void;
}

export function useMeaning(): UseMeaningReturn {
  const [result, setResult] = useState<MeaningResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMeaning = useCallback(async (action: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/meaning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        throw new Error("API request failed");
      }

      const data: MeaningResponse = await res.json();
      setResult(data);
    } catch {
      setError("うまくいかなかった。もう一回試してみて");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { result, isLoading, error, fetchMeaning, reset };
}
