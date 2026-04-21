import { create } from 'zustand';
import { arrayMove } from '@dnd-kit/sortable';
import { nanoid } from 'nanoid';

export type BlockType = 'role' | 'context' | 'task' | 'input' | 'constraints' | 'output' | 'examples';

export type PromptBlock = {
  id: string;
  type: BlockType;
  content: string;
  enabled: boolean;
};

interface PromptStore {
  blocks: PromptBlock[];
  addBlock: (type: BlockType, content?: string) => void;
  updateBlock: (id: string, content: string) => void;
  moveBlock: (oldIndex: number, newIndex: number) => void;
  toggleBlock: (id: string) => void;
  removeBlock: (id: string) => void;
  getGeneratedPrompt: () => string;
  setBlocks: (blocks: PromptBlock[]) => void;
}

export const usePromptStore = create<PromptStore>((set, get) => ({
  blocks: [],
  addBlock: (type, content = '') => set((state) => ({ 
    blocks: [...state.blocks, { id: nanoid(), type, content, enabled: true }] 
  })),
  
  updateBlock: (id, content) => set((state) => ({
    blocks: state.blocks.map(b => b.id === id ? { ...b, content } : b)
  })),
  
  moveBlock: (oldIndex, newIndex) => set((state) => ({
    blocks: arrayMove(state.blocks, oldIndex, newIndex)
  })),
  
  toggleBlock: (id) => set((state) => ({
    blocks: state.blocks.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b)
  })),
  
  removeBlock: (id) => set((state) => ({
    blocks: state.blocks.filter(b => b.id !== id)
  })),

  setBlocks: (blocks) => set({ blocks }),
  
  getGeneratedPrompt: () => {
    return get().blocks
      .filter(b => b.enabled && b.content.trim() !== '')
      .map(b => `### [${b.type.toUpperCase()}]\n${b.content}`)
      .join('\n\n');
  }
}));
