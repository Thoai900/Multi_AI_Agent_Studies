import { createClient } from "@supabase/supabase-js";

export type Prompt = {
  id: string;
  title: string;
  description: string;
  template: string;
  category: string;
  author_name: string;
  upvotes: number;
  status: "pending" | "approved";
  created_at: string;
};

export const CATEGORIES = [
  "Toán học",
  "Văn học",
  "Lập trình",
  "Ngoại ngữ",
  "Khoa học",
  "Khác",
] as const;

export type Category = (typeof CATEGORIES)[number];

export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase chưa được cấu hình.");
  return createClient(url, key);
}
