export interface MeaningRequest {
  action: string;
}

export interface MeaningResponse {
  title: string;
  body: string;
}

export interface MeaningRecord {
  id: string;
  user_id: string;
  action: string;
  meaning: string;
  suggestions: string[];
  created_at: string;
}

export type AppScreen = "landing" | "input" | "result";

export interface Meaning {
  id: string;
  action: string;
  meaning: string;
  title?: string;
  suggestions: string[];
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}
