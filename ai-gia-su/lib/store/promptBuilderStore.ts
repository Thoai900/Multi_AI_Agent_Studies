import { create } from "zustand";
import { arrayMove } from "@dnd-kit/sortable";
import { nanoid } from "nanoid";

export type BlockType =
  | "role"
  | "context"
  | "task"
  | "input"
  | "constraints"
  | "output"
  | "examples";

export type PromptBlock = {
  id:      string;
  type:    BlockType;
  content: string;
  enabled: boolean;
};

const labelMap: Record<BlockType, string> = {
  role:        "VAI TRÒ",
  context:     "BỐI CẢNH",
  task:        "NHIỆM VỤ",
  input:       "ĐẦU VÀO",
  constraints: "GIỚI HẠN",
  output:      "ĐỊNH DẠNG ĐẦU RA",
  examples:    "VÍ DỤ",
};

interface PromptStore {
  blocks:              PromptBlock[];
  addBlock:            (type: BlockType, content?: string) => void;
  updateBlock:         (id: string, content: string) => void;
  moveBlock:           (oldIndex: number, newIndex: number) => void;
  toggleBlock:         (id: string) => void;
  removeBlock:         (id: string) => void;
  setBlocks:           (blocks: PromptBlock[]) => void;
  loadTemplate:        (blocks: Omit<PromptBlock, "id">[]) => void;
  clearAll:            () => void;
  getGeneratedPrompt:  () => string;
}

export const usePromptStore = create<PromptStore>((set, get) => ({
  blocks: [],

  addBlock: (type, content = "") =>
    set(s => ({
      blocks: [...s.blocks, { id: nanoid(), type, content, enabled: true }],
    })),

  updateBlock: (id, content) =>
    set(s => ({
      blocks: s.blocks.map(b => (b.id === id ? { ...b, content } : b)),
    })),

  moveBlock: (oldIndex, newIndex) =>
    set(s => ({ blocks: arrayMove(s.blocks, oldIndex, newIndex) })),

  toggleBlock: (id) =>
    set(s => ({
      blocks: s.blocks.map(b => (b.id === id ? { ...b, enabled: !b.enabled } : b)),
    })),

  removeBlock: (id) =>
    set(s => ({ blocks: s.blocks.filter(b => b.id !== id) })),

  setBlocks: (blocks) => set({ blocks }),

  loadTemplate: (templateBlocks) =>
    set({ blocks: templateBlocks.map(b => ({ ...b, id: nanoid() })) }),

  clearAll: () => set({ blocks: [] }),

  getGeneratedPrompt: () =>
    get()
      .blocks.filter(b => b.enabled && b.content.trim() !== "")
      .map(b => `[${labelMap[b.type]}]\n${b.content.trim()}`)
      .join("\n\n"),
}));
