# 今日の意味メーカー - メインUI実装

## プロジェクト概要
AIが今日やったことの「意味」を見つけてくれるアプリ。
若者が自分の行動に意味を見出し、自己肯定感を高める。

---

## UXデザイン（厳守）

### 画面フロー
```
[1. ランディング] → [2. 入力] → [3. 意味表示]
```

### 画面1: ランディング (/)
- ヒーロー見出し: 「今日やったこと、<br/>意味あるかも。」text-4xl bold
- サブテキスト: 「入力するだけ。AIが勝手に意味を見つけます」
- CTAボタン: 「やってみる」rounded-full h-12

### 画面2: 入力 (/input)
- 質問: 「今日、何した？」text-xl font-semibold
- テキストエリア: min-h-[120px] rounded-2xl bg-muted/50
  - placeholder: 「バイトした、授業受けた、友達と話した…なんでもOK」
- 送信ボタン: 「意味を見つける」rounded-full h-12 w-full
- 補足: 「大したことじゃなくて全員OK」

### 画面3: 意味表示 (/meaning)
- 入力引用カード: rounded-2xl bg-muted/30 p-4
- 意味ラベル: ● emerald-500 + 「見つけた意味」
- 意味カード: rounded-2xl border shadow-sm p-6
  - 見出し: AI生成（例: 「人の感情を読む力」）
  - 本文: AI生成（3-4文の解釈）
- 「もう1つ入力する」ボタン

---

## GLM API プロンプト

### システムプロンプト
```
あなたは「意味メーカー」のAIです。ユーザーが今日やったことを入力します。
あなたの仕事は、その行動が将来どう役立つ可能性があるかを、肯定的に・押し付けがましくなく解釈することです。

ルール:
- 見出し（10文字以内）と本文（80-120文字）で返す
- 説教しない。「すごい」「えらい」も言わない
- 「かもね」「〜してるのかも」のような柔らかい語尾
- 具体的なスキルや力に紐づける
- 楽しげに、軽く
- JSON形式で返す: {"title": "...", "body": "..."}
```

---

## DESIGN_SYSTEM.md ルール

### カラー
- ライト: background #FFFFFF, foreground #0A0A0A
- ダーク: background #0A0A0A, foreground #FAFAFA
- アクセントは黒/白のみ
- ステータス色: emerald-500 (成功) / red-500 (エラー)

### タイポグラフィ
- ヒーロー: text-4xl font-bold leading-tight
- セクション: text-xl font-semibold
- 本文: text-base leading-relaxed
- 補足: text-sm text-muted-foreground

### コンポーネント
- ボタン: rounded-full, h-12, w-full (primary)
- カード: rounded-2xl, border, shadow-sm, p-6
- テキストエリア: rounded-2xl, bg-muted/50, border-border/50
- ヘッダー: sticky, backdrop-blur-xl, h-14

### アニメーション
- ページ遷移: opacity 0→1, y 20→0, duration 0.4
- spring: stiffness 500, damping 30
- ボタン active: scale-95

### 禁止事項
1. グラデーション背景
2. 影が濃すぎる (shadow-lg以上禁止)
3. ボーダーが目立ちすぎる (border-border/50)
4. 色を3色以上使う
5. 角丸がバラバラ (rounded-2xl/rounded-full)
6. フォントサイズの乱立
7. 余白が狭い (p-4未満禁止)
8. アイコンだけのボタン
9. 英語のまま残す
10. デフォルトshadcn/uiそのまま

---

## 実装指示

### LLM使用時
- **GLM API (OpenAI互換)** のみ使用
- baseURL: https://api.z.ai/api/coding/paas/v4/
- model: glm-4.7
- OpenAI/GPT/OpenRouter は絶対に使わない

### ダークモード
- next-themes で実装
- システム設定に追従

### テスト駆動開発
- テストを先に書く
- テストが通る最小限の実装
- リファクタリング

### 品質基準
- Apple/Notion/Linear レベルのUI
- 日本語UI（翻訳くさくない）
- 320px幅で崩れない
- 全テストパス
- npm run build 成功

---

## 背景と意図
このプロダクトは「若者から世界をよくする」という信念のもと開発している。
ターゲットは日本の若者（大学生・20代前半）。
Apple/Notion/Linearレベルのデザイン品質で、人間が「使いたい」と思うプロダクトを作る。
