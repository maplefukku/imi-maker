# 今日の意味メーカー (imi-maker) - 実装プロンプト

## プロダクト概要
ユーザーが「今日やったこと」を入力すると、AIがその行動の意味（将来どう役立つか）を解釈してくれるアプリ。

**ターゲット**: 日本の若者（大学生・20代前半）
**信念**: 若者が自分の人生を自分で決められていない構造を壊す
**レベル**: Apple/Notion/Linear品質

---

## 技術スタック
- **Framework**: Next.js 16 (App Router, TypeScript, Tailwind CSS)
- **UI Components**: shadcn/ui (カスタマイズ必須)
- **Animation**: framer-motion
- **Auth + DB**: Supabase
- **LLM**: GLM API (glm-4.7, OpenAI互換) — **OpenAI/GPT禁止**

---

## 画面構成（3画面のみ）

### 1. ランディング (/)
**目的**: 「使ってみる」を押す
**感情**: 好奇心 → 安心・気軽さ

**コンポーネント**:
```
┌─────────────────────────────┐
│  (sticky header)            │
│  意味メーカー (text-lg)      │
│                              │
│  ────────────────────────   │
│  ヒーロー見出し              │
│  「今日やったこと、          │
│   意味あるかも。」           │
│  text-4xl font-bold         │
│                              │
│  サブテキスト                │
│  「入力するだけ。            │
│   AIが勝手に意味を見つけます」│
│  text-lg text-muted-foreground│
│                              │
│  [やってみる]                │
│  Button rounded-full h-12   │
│                              │
└─────────────────────────────┘
```

**アニメーション**:
- ページ表示: `opacity: 0, y: 20` → `opacity: 1, y: 0` (duration: 0.4, Apple的イージング)
- Stagger: 見出し → サブテキスト → ボタン (delay: 0.1s each)
- ボタン hover/active: `hover:bg-accent/90`, `active:scale-95`

### 2. 入力 (/input)
**目的**: 今日やったことを書いて送信する
**感情**: 迷いがない → 期待感

**コンポーネント**:
```
┌─────────────────────────────┐
│  (sticky header)            │
│  ← 戻る    意味メーカー      │
│                              │
│  「今日、何した？」          │
│  text-xl font-semibold      │
│                              │
│  ┌───────────────────────┐  │
│  │ Textarea              │  │
│  │ min-h-[120px]         │  │
│  │ rounded-2xl           │  │
│  │ bg-muted/50           │  │
│  │ placeholder:          │  │
│  │ 「バイトした、授業受けた│  │
│  │  友達と話した…         │  │
│  │  なんでもOK」          │  │
│  └───────────────────────┘  │
│                              │
│  [意味を見つける]            │
│  Button rounded-full h-12   │
│  (空の時はdisabled)          │
│                              │
│  「大したことじゃなくて      │
│   全然OK」                   │
│  text-sm text-muted-foreground│
└─────────────────────────────┘
```

**バリデーション**:
- テキストが空 → 送信ボタン disabled
- テキストが1000文字超 → 「もう少し短くしてみて」表示
- API通信中 → ボタン「意味を見つけてる...」+ loading state

### 3. 意味表示 (/meaning)
**目的**: AIが見つけた「意味」を読む
**感情**: 発見・驚き → 自己肯定感 → 能動性

**コンポーネント**:
```
┌─────────────────────────────┐
│  (sticky header)            │
│  ← 戻る    意味メーカー      │
│                              │
│  あなたがやったこと          │
│  text-sm text-muted-foreground│
│  ┌───────────────────────┐  │
│  │ "バイトした"           │  │
│  │ rounded-2xl bg-muted/30│  │
│  │ p-4                   │  │
│  └───────────────────────┘  │
│                              │
│  ● 見つけた意味              │
│  text-xs uppercase tracking │
│  (emerald-500 dot)          │
│                              │
│  ┌───────────────────────┐  │
│  │ 見出し                 │  │
│  │ 「人の感情を読む力」    │  │
│  │ text-lg font-semibold │  │
│  │                       │  │
│  │ 本文                   │  │
│  │ 「接客って、相手が      │  │
│  │  何を求めてるかを       │  │
│  │  一瞬で読む            │  │
│  │  トレーニング...」      │  │
│  │ text-base leading-relaxed│
│  │ text-muted-foreground │  │
│  └───────────────────────┘  │
│                              │
│  [もう1つ入力する]           │
│  Button rounded-full h-12   │
│                              │
│  [最初に戻る]                │
│  Button variant="ghost"     │
└─────────────────────────────┘
```

**アニメーション**:
- 入力引用カード: 即座に表示
- 意味ラベル + 意味カード: 遅延表示 (delay: 0.3s)
- 意味カード: `opacity: 0, scale: 0.95` → `opacity: 1, scale: 1` (spring: stiffness 500, damping 30)
- emeraldドット: `animate-pulse`
- 「もう1つ入力する」ボタン: 意味カード表示から0.5s後にフェードイン

**ローディング状態**:
- スケルトンUI (シマーエフェクト)
- ラベル: 「意味を見つけてる...」
- ボタン非表示

---

## API Routes実装

### POST /api/meaning
GLM APIを呼び出して意味を生成

**Request**:
```json
{
  "action": "コンビニで接客した"
}
```

**Response**:
```json
{
  "meaning": {
    "title": "人の感情を読む力",
    "body": "接客って、相手が何を求めてるかを一瞬で読むトレーニングなんだよね..."
  },
  "suggestions": ["人の反応を観察してみる", "苦手な客層を分析してみる"]
}
```

**GLM API System Prompt**:
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

**実装例** (src/lib/glm.ts):
```typescript
const GLM_BASE_URL = process.env.GLM_BASE_URL || 'https://api.z.ai/api/coding/paas/v4/';
const GLM_API_KEY = process.env.GLM_API_KEY;
const GLM_MODEL = process.env.GLM_MODEL || 'glm-4.7';

export async function generateMeaning(action: string): Promise<{ title: string; body: string }> {
  const systemPrompt = `あなたは「意味メーカー」のAIです...（上記参照）`;
  
  const response = await fetch(`${GLM_BASE_URL}chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: GLM_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `今日やったこと: ${action}` },
      ],
      temperature: 0.8,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(`GLM API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  try {
    return JSON.parse(content);
  } catch {
    return {
      title: '見つけた意味',
      body: content || '意味を見つけることができませんでした。',
    };
  }
}
```

### GET /api/meanings
ユーザーの履歴を取得（認証必須）

### POST /api/meanings
意味を保存（認証必須）

### DELETE /api/meanings/[id]
意味を削除（認証必須）

### GET /api/auth/callback
Supabase認証コールバック

---

## DB Schema (Supabase)

### profiles テーブル
```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### meanings テーブル
```sql
CREATE TABLE public.meanings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  meaning JSONB NOT NULL,  -- {title: string, body: string}
  suggestions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meanings_user_id ON public.meanings(user_id);
CREATE INDEX idx_meanings_created_at ON public.meanings(created_at DESC);
```

**RLS有効化**:
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meanings ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Users can view own meanings"
  ON public.meanings FOR SELECT
  USING (auth.uid() = user_id);
```

---

## 環境変数

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

GLM_API_KEY=d4d5b41fda2845b48f8f55c4e3a1e3e9.TMSBR1aLRdCgSkEo
GLM_BASE_URL=https://api.z.ai/api/coding/paas/v4/
GLM_MODEL=glm-4.7
```

---

## 実装手順（TDD厳守）

### Phase 1: プロジェクト初期化
1. shadcn/ui初期化: `npx shadcn@latest init`
2. 必要なコンポーネント追加: `npx shadcn@latest add button card textarea skeleton`
3. framer-motion, lucide-react, next-themes, @supabase/supabase-js, @supabase/ssr インストール
4. vitest設定

### Phase 2: API実装
1. src/lib/glm.ts 作成（GLM APIクライアント）
2. テスト作成: tests/lib/glm.test.ts
3. src/app/api/meaning/route.ts 作成
4. テスト作成: tests/api/meaning-route.test.ts

### Phase 3: Supabase設定
1. src/lib/supabase/client.ts 作成
2. src/lib/supabase/server.ts 作成
3. src/lib/supabase/middleware.ts 作成
4. src/proxy.ts 作成（認証ミドルウェア）
5. supabase/migrations/001_init.sql 作成

### Phase 4: UI実装
1. src/app/layout.tsx 修正（ThemeProvider, ヘッダー）
2. src/app/page.tsx 実装（ランディング）
3. src/app/input/page.tsx 実装（入力画面）
4. src/app/meaning/page.tsx 実装（意味表示）
5. テスト作成: tests/components/*.test.tsx

### Phase 5: 統合・確認
1. `npm run build` 成功確認
2. `npx vitest run --coverage` カバレッジ60%以上確認
3. TypeScriptエラーなし確認
4. Lintエラーなし確認

---

## DESIGN_SYSTEM.md準拠チェックリスト

### 禁止事項
- [ ] グラデーション背景使用禁止
- [ ] shadow-lg以上の影使用禁止
- [ ] border-border/50以外の濃いボーダー禁止
- [ ] 色を3色以上使用禁止（グレースケール + emerald-500ドットのみ）
- [ ] rounded-2xl / rounded-full以外の角丸禁止
- [ ] p-4未満のパディング禁止
- [ ] アイコンだけのボタン禁止
- [ ] 英語のまま残す禁止
- [ ] shadcn/uiデフォルトそのまま禁止

### 必須実装
- [ ] framer-motionアニメーション
- [ ] ボタンhover/active状態
- [ ] スケルトンUI（シマーエフェクト）
- [ ] ダークモード対応（next-themes）
- [ ] テスト作成（TDD）

---

## 完了条件
1. `npm run build` が成功
2. `npx vitest run` が全て成功
3. `npm run lint` がエラーなし
4. TypeScriptエラーなし
5. テストカバレッジ60%以上
6. 全3画面が実装され、画面遷移が動作する
7. GLM APIが正しく呼び出され、意味が表示される
8. DESIGN_SYSTEM.mdの禁止事項に違反していない

---

## 注意事項
- **OpenAI API / GPT は絶対に使わない。GLM APIのみ**
- **自分でコードを書かない。Claude Codeに委任**
- **テスト駆動開発（TDD）で実装**
- **1画面1意思決定を守る**
- **日本語UIは翻訳くさくない自然な表現**

---

## 背景と意図
このプロダクトは「若者から世界をよくする」という信念のもと開発している。
ターゲットは日本の若者（大学生・20代前半）。やりたいことがない、大学に意味を見出せない、
自分の人生を自分で決められていない若者の構造的問題を解く。
Apple/Notion/Linearレベルのデザイン品質で、人間が「使いたい」と思うプロダクトを作る。
