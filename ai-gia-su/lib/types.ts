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