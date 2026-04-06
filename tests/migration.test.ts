import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('DBマイグレーション', () => {
  const sql = readFileSync(
    resolve(__dirname, '../supabase/migrations/001_init.sql'),
    'utf-8'
  )

  it('profilesテーブルが定義されている', () => {
    expect(sql).toContain('CREATE TABLE public.profiles')
    expect(sql).toContain('id UUID REFERENCES auth.users(id)')
  })

  it('meaningsテーブルが定義されている', () => {
    expect(sql).toContain('CREATE TABLE public.meanings')
    expect(sql).toContain('user_id UUID REFERENCES public.profiles(id)')
  })

  it('インデックスが定義されている', () => {
    expect(sql).toContain('CREATE INDEX idx_meanings_user_id')
    expect(sql).toContain('CREATE INDEX idx_meanings_created_at')
  })

  it('RLSが有効化されている', () => {
    expect(sql).toContain('ENABLE ROW LEVEL SECURITY')
    expect(sql.match(/ENABLE ROW LEVEL SECURITY/g)).toHaveLength(2)
  })

  it('RLSポリシーが定義されている', () => {
    expect(sql).toContain('Users can view own profile')
    expect(sql).toContain('Users can update own profile')
    expect(sql).toContain('Users can view own meanings')
    expect(sql).toContain('Users can insert own meanings')
    expect(sql).toContain('Users can delete own meanings')
  })

  it('ユーザー作成トリガーが定義されている', () => {
    expect(sql).toContain('handle_new_user')
    expect(sql).toContain('on_auth_user_created')
  })
})
