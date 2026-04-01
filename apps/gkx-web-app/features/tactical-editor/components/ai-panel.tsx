"use client";

import { useMemo, useState } from "react";
import { useGeneratePlayMutation } from "../hooks/use-generate-play";
import type { EditorElement } from "./types";

type GenerateMode = "replace" | "append";

type AiPanelProps = {
  exerciseId?: string;
  onApply: (mode: GenerateMode, elements: EditorElement[], backgroundSrc: string | null) => void;
};

export function AiPanel({ exerciseId, onApply }: AiPanelProps) {
  const mutation = useGeneratePlayMutation(exerciseId);
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState("");
  const [goalkeepersCount, setGoalkeepersCount] = useState<string>("1");
  const [pendingMode, setPendingMode] = useState<GenerateMode>("replace");

  const hasResult = !!mutation.data;

  const canGenerate = useMemo(() => {
    return !!exerciseId && prompt.trim().length >= 8 && !mutation.isPending;
  }, [exerciseId, prompt, mutation.isPending]);

  const parsedCount = Number(goalkeepersCount);
  const safeCount = Number.isFinite(parsedCount)
    ? Math.max(1, Math.min(4, parsedCount))
    : undefined;

  const handleGenerate = async (mode: GenerateMode) => {
    if (!exerciseId) return;

    setPendingMode(mode);
    await mutation.mutateAsync({
      prompt: prompt.trim(),
      mode,
      category: category.trim() || undefined,
      goalkeepersCount: safeCount,
    });
  };

  const handleApply = (mode: GenerateMode) => {
    const data = mutation.data;
    if (!data) return;

    onApply(mode, data.elements as EditorElement[], data.backgroundSrc);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-card-foreground">Asistente IA</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Describe la jugada y genera una propuesta táctica lista para aplicar al lienzo.
        </p>
      </div>

      {!exerciseId ? (
        <div className="rounded-2xl border border-amber-500/50 bg-amber-500/10 px-3 py-3 text-xs text-amber-200">
          Vincula este editor a un ejercicio para habilitar la generación con IA.
        </div>
      ) : null}

      <label className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Prompt</span>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={5}
          placeholder="Ej: 2 porteros, reboteador frontal, tiro raso al primer palo y segunda acción aérea"
          className="rounded-2xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Categoría</span>
          <input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Blocaje, 1vs1, juego aéreo..."
            className="rounded-2xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Porteros</span>
          <input
            type="number"
            min={1}
            max={4}
            value={goalkeepersCount}
            onChange={(event) => setGoalkeepersCount(event.target.value)}
            className="rounded-2xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => handleGenerate("replace")}
          disabled={!canGenerate}
          className="rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:bg-secondary hover:text-secondary-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          Generar (reemplazar)
        </button>
        <button
          type="button"
          onClick={() => handleGenerate("append")}
          disabled={!canGenerate}
          className="rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          Generar (agregar)
        </button>
      </div>

      {mutation.isPending ? (
        <div className="rounded-2xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Generando jugada con IA...
        </div>
      ) : null}

      {mutation.error ? (
        <div className="rounded-2xl border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {mutation.error.message}
        </div>
      ) : null}

      {hasResult ? (
        <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-3">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Resumen generado</p>
            <p className="mt-1 text-sm text-foreground">{mutation.data?.summary}</p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-background px-2 py-1">
              Elementos: {mutation.data?.elements.length ?? 0}
            </span>
            {mutation.data?.backgroundId ? (
              <span className="rounded-full bg-background px-2 py-1">
                Fondo: {mutation.data.backgroundId}
              </span>
            ) : null}
            <span className="rounded-full bg-background px-2 py-1">
              Modo: {pendingMode}
            </span>
          </div>

          {mutation.data?.warnings.length ? (
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.12em] text-amber-300">Advertencias</p>
              <ul className="space-y-1 text-xs text-amber-200">
                {mutation.data.warnings.map((warning, index) => (
                  <li key={`${warning}-${index}`} className="rounded-lg bg-amber-500/10 px-2 py-1">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleApply("replace")}
              className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:bg-secondary hover:text-secondary-foreground"
            >
              Aplicar reemplazando
            </button>
            <button
              type="button"
              onClick={() => handleApply("append")}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              Aplicar agregando
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
