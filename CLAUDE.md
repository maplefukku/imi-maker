# CLAUDE.md

## ビルド・テスト
npm run dev          # 開発サーバー
npm run build        # ビルド確認
npx vitest           # テスト実行
npx vitest --coverage # カバレッジ確認

## コードスタイル
- TypeScript strict mode
- ES modules (import/export)
- Tailwind CSS + shadcn/ui（カスタマイズ必須、デフォルト禁止）
- framer-motion でアニメーション
- 日本語UI（翻訳くさくない自然な日本語）

## アーキテクチャ
- Next.js App Router (src/app/)
- Supabase (認証 + DB)
- GLM API (LLM) — OpenAI互換、baseURL変更のみ

## デザインルール
- Apple/Notion/Linearレベルの品質
- グレースケール + アクセント1色
- rounded-2xl / shadow-sm / backdrop-blur-xl
- 1画面1意思決定
- ダークモード必須（next-themes）

## 禁止事項
- OpenAI API / GPT 使用禁止（GLM APIのみ）
- グラデーション背景
- shadcn/uiデフォルトそのまま
- テストなしのコード
