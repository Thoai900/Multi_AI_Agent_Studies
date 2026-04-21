"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Blocks } from "lucide-react";
import { BlockLibrary } from "@/components/prompt-builder/BlockLibrary";
import { MainCanvas } from "@/components/prompt-builder/MainCanvas";
import { AIAssistant } from "@/components/prompt-builder/AIAssistant";
import { PreviewPanel } from "@/components/prompt-builder/PreviewPanel";
import { usePromptStore, type BlockType } from "@/lib/store/promptBuilderStore";

export default function PromptBuilderPage() {
  const { blocks, addBlock, moveBlock } = usePromptStore();
  const [dragLabel, setDragLabel] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    setDragLabel(data?.isTemplate ? String(data.type) : null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDragLabel(null);
    const { active, over } = event;
    if (!over) return;

    const isFromLibrary = active.data.current?.isTemplate === true;

    if (isFromLibrary) {
      const isOverCanvas = over.id === "main-canvas-droppable";
      const isOverBlock  = blocks.some(b => b.id === over.id);
      if (isOverCanvas || isOverBlock) {
        addBlock(active.data.current?.type as BlockType);
      }
      return;
    }

    // Reorder within canvas
    if (active.id !== over.id) {
      const oldIdx = blocks.findIndex(b => b.id === active.id);
      const newIdx = blocks.findIndex(b => b.id === over.id);
      if (oldIdx !== -1 && newIdx !== -1) moveBlock(oldIdx, newIdx);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-zinc-50 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-zinc-200 px-4 py-3 z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors flex-shrink-0"
          >
            ← Chat
          </Link>
          <span className="text-zinc-200">|</span>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0">
              <Blocks className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-zinc-900 leading-tight">
                Prompt Builder
              </h1>
              <p className="text-xs text-zinc-400 leading-tight">
                Kéo thả block · Xây prompt chuyên nghiệp
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* 3-column workspace */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex overflow-hidden min-h-0">
          <BlockLibrary />
          <MainCanvas />
          <AIAssistant />
        </div>

        <DragOverlay dropAnimation={null}>
          {dragLabel && (
            <div className="px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-xl shadow-2xl border border-violet-400 cursor-grabbing select-none">
              + {dragLabel}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Bottom preview */}
      <PreviewPanel />
    </div>
  );
}
