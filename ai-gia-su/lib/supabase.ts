import { createClient } from "@supabase/supabase-js";
import type { Prompt, Category } from "./types";
import { CATEGORIES } from "./types";

export { CATEGORIES };
export type { Prompt, Category };

export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase chưa được cấu hình.");
  return createClient(url, key);
}
