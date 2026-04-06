"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const MAX_LENGTH = 1000;

interface MeaningFormProps {
  onSubmit: (action: string) => void;
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
}

export function MeaningForm({
  onSubmit,
  isLoading,
  error,
  onBack,
}: MeaningFormProps) {
  const [text, setText] = useState("");

  const isTooLong = text.length > MAX_LENGTH;
  const isEmpty = text.trim().length === 0;
  const isDisabled = isEmpty || isTooLong || isLoading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDisabled) {
      onSubmit(text.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex w-full flex-col gap-6"
    >
      <header className="sticky top-0 z-10 flex h-14 items-center backdrop-blur-xl bg-background/80">
        <Button
          variant="ghost"
          onClick={onBack}
          className="rounded-full"
        >
          ← 戻る
        </Button>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-4">
        <h2 className="text-xl font-semibold">今日、何した？</h2>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="バイトした、授業受けた、友達と話した…なんでもOK"
          className="min-h-[120px] rounded-2xl bg-muted/50 border-border/50 text-base leading-relaxed focus-visible:border-foreground focus-visible:ring-0 p-4"
          aria-label="今日やったこと"
        />

        {isTooLong && (
          <p className="text-sm text-destructive" role="alert">
            もう少し短くしてみて
          </p>
        )}

        <Button
          type="submit"
          disabled={isDisabled}
          className="h-12 w-full rounded-full text-base font-medium active:scale-95 transition-transform"
        >
          {isLoading ? "意味を見つけてる..." : "意味を見つける"}
        </Button>

        {error && (
          <p className="text-sm text-destructive text-center" role="alert">
            {error}
          </p>
        )}

        <p className="text-sm text-muted-foreground text-center">
          大したことじゃなくて全然OK
        </p>
      </form>
    </motion.div>
  );
}
