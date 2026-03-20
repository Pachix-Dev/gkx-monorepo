"use client";

import type {
  ArrowHeadType,
  CircleElement,
  EditorElement,
  LinePattern,
  RectElement,
  StrokeElement,
  TextElement,
} from "./types";

type SelectedElementPanelProps = {
  selectedElement: EditorElement | null;
  fontOptions: string[];
  onDelete: () => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onUpdateElement: (id: string, updater: (element: EditorElement) => EditorElement) => void;
};

function isTextElement(element: EditorElement | null): element is TextElement {
  return element?.kind === "text";
}

function isStrokeElement(element: EditorElement | null): element is StrokeElement {
  return element?.kind === "arrow" || element?.kind === "line" || element?.kind === "draw";
}

function isFillElement(element: EditorElement | null): element is RectElement | CircleElement {
  return element?.kind === "rect" || element?.kind === "circle";
}

const KIND_LABEL: Record<string, string> = {
  asset: "Figura",
  text: "Texto",
  arrow: "Flecha",
  line: "Línea",
  draw: "Trazo",
  rect: "Rectángulo",
  circle: "Círculo",
};

function IconBtn({
  onClick,
  title,
  active,
  children,
}: {
  onClick: () => void;
  title: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex items-center justify-center rounded-lg border px-2.5 py-2 transition hover:bg-muted ${
        active ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function SelectedElementPanel({
  selectedElement,
  fontOptions,
  onDelete,
  onBringToFront,
  onSendToBack,
  onToggleVisibility,
  onToggleLock,
  onUpdateElement,
}: SelectedElementPanelProps) {
  if (!selectedElement) return null;

  return (
    <div className="w-full rounded-2xl border border-border bg-background shadow-md">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">

        {/* Label */}
        <span className="shrink-0 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {KIND_LABEL[selectedElement.kind] ?? selectedElement.kind}
        </span>

        <div className="h-5 w-px shrink-0 bg-border" />

        {/* Common action buttons */}
        <div className="flex items-center gap-1">
          <IconBtn onClick={() => onBringToFront(selectedElement.id)} title="Traer al frente">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 18.75 7.5-7.5 7.5 7.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 7.5-7.5 7.5 7.5" />
            </svg>
          </IconBtn>
          <IconBtn onClick={() => onSendToBack(selectedElement.id)} title="Enviar atrás">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 5.25 7.5 7.5 7.5-7.5m-15 6 7.5 7.5 7.5-7.5" />
            </svg>
          </IconBtn>
          <IconBtn
            onClick={() => onToggleVisibility(selectedElement.id)}
            title={selectedElement.visible ? "Ocultar" : "Mostrar"}
            active={!selectedElement.visible}
          >
            {selectedElement.visible ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            )}
          </IconBtn>
          <IconBtn
            onClick={() => onToggleLock(selectedElement.id)}
            title={selectedElement.locked ? "Desbloquear" : "Bloquear"}
            active={selectedElement.locked}
          >
            {selectedElement.locked ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            )}
          </IconBtn>
        </div>

        <div className="h-5 w-px shrink-0 bg-border" />

        {/* Rotation — all non-stroke elements */}
        {!isStrokeElement(selectedElement) && (
          <label className="flex items-center gap-2">
            <span className="shrink-0 text-xs text-muted-foreground">Rot.</span>
            <input
              type="range"
              min={-180}
              max={180}
              value={Math.round(selectedElement.rotation)}
              onChange={(e) => {
                const rotation = Number(e.target.value);
                onUpdateElement(selectedElement.id, (cur) => ({ ...cur, rotation }));
              }}
              className="w-24 accent-primary"
            />
            <span className="w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              {Math.round(selectedElement.rotation)}°
            </span>
          </label>
        )}

        {/* Text-specific controls */}
        {isTextElement(selectedElement) && (
          <>
            <div className="h-5 w-px shrink-0 bg-border" />
            <label className="flex items-center gap-1.5">
              <span className="shrink-0 text-xs text-muted-foreground">Fuente</span>
              <select
                value={selectedElement.fontFamily}
                onChange={(e) => {
                  const nextFont = e.target.value;
                  onUpdateElement(selectedElement.id, (cur) =>
                    cur.kind === "text" ? { ...cur, fontFamily: nextFont } : cur,
                  );
                }}
                className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
              >
                {fontOptions.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-1.5">
              <span className="shrink-0 text-xs text-muted-foreground">Tam.</span>
              <input
                type="number"
                min={12}
                max={120}
                value={selectedElement.fontSize}
                onChange={(e) => {
                  const nextSize = Number(e.target.value) || 12;
                  onUpdateElement(selectedElement.id, (cur) =>
                    cur.kind === "text" ? { ...cur, fontSize: nextSize } : cur,
                  );
                }}
                className="w-16 rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </label>

            <label className="flex items-center gap-1.5" title="Color de texto">
              <span className="shrink-0 text-xs text-muted-foreground">Color</span>
              <input
                type="color"
                value={selectedElement.fill}
                onChange={(e) => {
                  const nextColor = e.target.value;
                  onUpdateElement(selectedElement.id, (cur) =>
                    cur.kind === "text" ? { ...cur, fill: nextColor } : cur,
                  );
                }}
                className="h-8 w-10 cursor-pointer rounded-lg border border-border bg-card p-0.5"
              />
            </label>

            <label className="flex min-w-0 flex-1 items-center gap-1.5">
              <span className="shrink-0 text-xs text-muted-foreground">Texto</span>
              <textarea
                value={selectedElement.text}
                rows={1}
                onChange={(e) => {
                  const text = e.target.value;
                  onUpdateElement(selectedElement.id, (cur) =>
                    cur.kind === "text" ? { ...cur, text } : cur,
                  );
                }}
                className="min-w-0 flex-1 resize-none rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </label>
          </>
        )}

        {/* Stroke-specific controls */}
        {isStrokeElement(selectedElement) && (
          <>
            <div className="h-5 w-px shrink-0 bg-border" />

            <label className="flex items-center gap-1.5" title="Color de línea">
              <span className="shrink-0 text-xs text-muted-foreground">Color</span>
              <input
                type="color"
                value={selectedElement.stroke}
                onChange={(e) => {
                  const nextColor = e.target.value;
                  onUpdateElement(selectedElement.id, (cur) =>
                    cur.kind === "arrow" || cur.kind === "line" || cur.kind === "draw"
                      ? { ...cur, stroke: nextColor }
                      : cur,
                  );
                }}
                className="h-8 w-10 cursor-pointer rounded-lg border border-border bg-card p-0.5"
              />
            </label>

            <label className="flex items-center gap-1.5">
              <span className="shrink-0 text-xs text-muted-foreground">Grosor</span>
              <input
                type="range"
                min={2}
                max={12}
                value={selectedElement.strokeWidth}
                onChange={(e) => {
                  const strokeWidth = Number(e.target.value);
                  onUpdateElement(selectedElement.id, (cur) =>
                    cur.kind === "arrow" || cur.kind === "line" || cur.kind === "draw"
                      ? { ...cur, strokeWidth }
                      : cur,
                  );
                }}
                className="w-20 accent-primary"
              />
            </label>

            <label className="flex items-center gap-1.5">
              <span className="shrink-0 text-xs text-muted-foreground">Tipo</span>
              <select
                value={selectedElement.pattern}
                onChange={(e) => {
                  const pattern = e.target.value as LinePattern;
                  onUpdateElement(selectedElement.id, (cur) =>
                    isStrokeElement(cur) ? { ...cur, pattern } : cur,
                  );
                }}
                className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="solid">Sólida</option>
                <option value="dashed">Punteada</option>
                <option value="dotted">Puntos</option>
                <option value="discontinuous">Discontinua</option>
              </select>
            </label>

            <label className="flex items-center gap-1.5">
              <span className="shrink-0 text-xs text-muted-foreground">Inicio</span>
              <select
                value={selectedElement.startHead}
                onChange={(e) => {
                  const startHead = e.target.value as ArrowHeadType;
                  onUpdateElement(selectedElement.id, (cur) =>
                    isStrokeElement(cur) ? { ...cur, startHead } : cur,
                  );
                }}
                className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="none">Sin punta</option>
                <option value="triangle">Triángulo</option>
                <option value="circle">Círculo</option>
                <option value="square">Cuadrado</option>
                <option value="bar">Barra</option>
              </select>
            </label>

            <label className="flex items-center gap-1.5">
              <span className="shrink-0 text-xs text-muted-foreground">Final</span>
              <select
                value={selectedElement.endHead}
                onChange={(e) => {
                  const endHead = e.target.value as ArrowHeadType;
                  onUpdateElement(selectedElement.id, (cur) =>
                    isStrokeElement(cur) ? { ...cur, endHead } : cur,
                  );
                }}
                className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="none">Sin punta</option>
                <option value="triangle">Triángulo</option>
                <option value="circle">Círculo</option>
                <option value="square">Cuadrado</option>
                <option value="bar">Barra</option>
              </select>
            </label>
          </>
        )}

        {/* Fill element controls */}
        {isFillElement(selectedElement) && (
          <>
            <div className="h-5 w-px shrink-0 bg-border" />
            <label className="flex items-center gap-1.5" title="Color de borde">
              <span className="shrink-0 text-xs text-muted-foreground">Borde</span>
              <input
                type="color"
                value={selectedElement.stroke}
                onChange={(e) => {
                  const stroke = e.target.value;
                  onUpdateElement(selectedElement.id, (cur) =>
                    cur.kind === "rect" || cur.kind === "circle" ? { ...cur, stroke } : cur,
                  );
                }}
                className="h-8 w-10 cursor-pointer rounded-lg border border-border bg-card p-0.5"
              />
            </label>

            <label className="flex items-center gap-1.5" title="Relleno">
              <span className="shrink-0 text-xs text-muted-foreground">Relleno</span>
              <input
                type="color"
                value={selectedElement.fill}
                onChange={(e) => {
                  const fill = e.target.value;
                  onUpdateElement(selectedElement.id, (cur) =>
                    cur.kind === "rect" || cur.kind === "circle" ? { ...cur, fill } : cur,
                  );
                }}
                className="h-8 w-10 cursor-pointer rounded-lg border border-border bg-card p-0.5"
              />
            </label>
          </>
        )}

        {/* Delete — pushed to the right */}
        <div className="ml-auto">
          <button
            type="button"
            onClick={onDelete}
            title="Eliminar elemento"
            className="flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs text-destructive transition hover:bg-destructive/10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
            Quitar
          </button>
        </div>

      </div>
    </div>
  );
}
