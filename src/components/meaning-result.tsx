"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { MeaningResponse } from "@/types";

interface MeaningResultProps {
  action: string;
  result: MeaningResponse | null;
  isLoading: boolean;
  onAnother: () => void;
  onHome: () => void;
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-4">
      <div className="rounded-2xl bg-muted/30 p-4">
        <Skeleton className="h-4 w-3/4 animate-shimmer" />
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-sm text-muted-foreground">意味を見つけてる...</span>
      </div>
      <div className="rounded-2xl border border-border/50 shadow-sm p-6">
        <Skeleton className="mb-3 h-6 w-1/2 animate-shimmer" />
        <Skeleton className="h-4 w-full animate-shimmer" />
        <Skeleton className="mt-2 h-4 w-5/6 animate-shimmer" />
        <Skeleton className="mt-2 h-4 w-4/6 animate-shimmer" />
      </div>
    </div>
  );
}

export function MeaningResult({
  action,
  result,
  isLoading,
  onAnother,
  onHome,
}: MeaningResultProps) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex w-full flex-col gap-6"
      >
        <LoadingSkeleton />
      </motion.div>
    );
  }

  if (!result) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex w-full flex-col gap-6 px-4"
    >
      <div className="rounded-2xl bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">やったこと</p>
        <p className="mt-1 text-base leading-relaxed">{action}</p>
      </div>

      <div className="flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-medium tracking-wider text-muted-foreground">
          見つけた意味
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.4, type: "spring", stiffness: 500, damping: 30 }}
        className="rounded-2xl border border-border/50 shadow-sm p-6"
      >
        <h3 className="text-xl font-semibold">{result.title}</h3>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {result.body}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        className="flex flex-col gap-3 pt-4"
      >
        <Button
          onClick={onAnother}
          className="h-12 w-full rounded-full text-base font-medium active:scale-95 transition-transform"
        >
          もう1つ入力する
        </Button>
        <Button
          variant="ghost"
          onClick={onHome}
          className="h-12 w-full rounded-full text-base font-medium"
        >
          最初に戻る
        </Button>
      </motion.div>
    </motion.div>
  );
}
