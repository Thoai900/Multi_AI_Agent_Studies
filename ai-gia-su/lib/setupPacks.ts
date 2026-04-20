import { getSupabaseClient } from "./supabase";

export type Platform = "claude" | "gemini" | "chatgpt";

export const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "claude",  label: "Claude"       },
  { id: "gemini",  label: "Gemini"       },
  { id: "chatgpt", label: "ChatGPT Free" },
];

export type SetupPack = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  level_tag: string;
  subject_tag: string;
  chips: string[];
  system_prompt: string;
  platform_warnings: Record<string, string>;
  published: boolean;
  created_at: string;
};

export type SetupStep = {
  id: string;
  pack_id: string;
  platform: Platform;
  step_order: number;
  title: string;
  subtitle: string;
  detail: string;
  tip: string | null;
  show_prompt: boolean;
};

export type CheatItem = {
  id: string;
  pack_id: string;
  item_order: number;
  label: string;
  command: string;
};

export type PackDetail = SetupPack & {
  steps: Partial<Record<Platform, SetupStep[]>>;
  cheat_items: CheatItem[];
};

export async function getAllPacks(): Promise<SetupPack[]> {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from("setup_packs")
    .select("id, slug, title, subtitle, level_tag, subject_tag, chips, published, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SetupPack[];
}

export async function getPackBySlug(slug: string): Promise<PackDetail | null> {
  const sb = getSupabaseClient();

  const { data: pack, error: pErr } = await sb
    .from("setup_packs")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (pErr || !pack) return null;

  const [stepsRes, cheatRes] = await Promise.all([
    sb.from("setup_steps").select("*").eq("pack_id", pack.id).order("step_order"),
    sb.from("cheat_items").select("*").eq("pack_id", pack.id).order("item_order"),
  ]);

  const steps: Partial<Record<Platform, SetupStep[]>> = {};
  for (const step of stepsRes.data ?? []) {
    const p = step.platform as Platform;
    if (!steps[p]) steps[p] = [];
    steps[p]!.push(step as SetupStep);
  }

  return {
    ...pack,
    steps,
    cheat_items: (cheatRes.data ?? []) as CheatItem[],
  };
}
