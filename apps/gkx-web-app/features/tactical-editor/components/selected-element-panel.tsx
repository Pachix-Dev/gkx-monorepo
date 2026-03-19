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

    return(
        <>
        {selectedElement && (
            <div className="rounded-3xl border border-border bg-background p-4 shadow-sm absolute top-0 right-0 z-20 w-60">
                <div className="flex items-center justify-between gap-2">
                    <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Seleccion</p>
                    <h4 className="text-sm font-semibold text-card-foreground">{selectedElement.kind}</h4>
                    </div>
                    <button
                    type="button"
                    onClick={onDelete}
                    className="rounded-full border border-border px-3 py-1 text-xs text-foreground transition hover:bg-muted"
                    >
                    Quitar
                    </button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                    type="button"
                    onClick={() => onBringToFront(selectedElement.id)}
                    className="rounded-xl border border-border px-3 py-2 text-xs text-foreground transition hover:bg-muted flex justify-center" title="Traer al frente"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 18.75 7.5-7.5 7.5 7.5" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 7.5-7.5 7.5 7.5" />
                    </svg>

                    </button>
                    <button
                    type="button"
                    onClick={() => onSendToBack(selectedElement.id)}
                    className="rounded-xl border border-border px-3 py-2 text-xs text-foreground transition hover:bg-muted flex justify-center" title="Enviar atras"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 5.25 7.5 7.5 7.5-7.5m-15 6 7.5 7.5 7.5-7.5" />
                        </svg>                
                    </button>
                    <button
                    type="button"
                    onClick={() => onToggleVisibility(selectedElement.id)}
                    className="rounded-xl border border-border px-3 py-2 text-xs text-foreground transition hover:bg-muted flex justify-center" title={selectedElement.visible ? "Ocultar" : "Mostrar"}
                    >
                    {selectedElement.visible ? 
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                        : 
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                    }
                    </button>
                    <button
                    type="button"
                    onClick={() => onToggleLock(selectedElement.id)}
                    className="rounded-xl border border-border px-3 py-2 text-xs text-foreground transition hover:bg-muted flex justify-center" title={selectedElement.locked ? "Desbloquear" : "Bloquear"}
                    >
                    {selectedElement.locked ? 
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                        </svg>
                        : 
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                        </svg>
                    }
                    </button>
                </div>

                <div className="mt-4 grid gap-3">
                    {!isStrokeElement(selectedElement) ? (
                    <label className="flex flex-col gap-2">
                        <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Rotacion</span>
                        <input
                        type="range"
                        min={-180}
                        max={180}
                        value={Math.round(selectedElement.rotation)}
                        onChange={(event) => {
                            const rotation = Number(event.target.value);
                            onUpdateElement(selectedElement.id, (current) => ({ ...current, rotation }));
                        }}
                        className="accent-primary"
                        />
                    </label>
                    ) : null}

                    {isTextElement(selectedElement) ? (
                    <>
                        <label className="flex flex-col gap-2">
                        <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Contenido</span>
                        <textarea
                            value={selectedElement.text}
                            rows={3}
                            onChange={(event) => {
                            const text = event.target.value;
                            onUpdateElement(selectedElement.id, (current) =>
                                current.kind === "text" ? { ...current, text } : current,
                            );
                            }}
                            className="rounded-2xl border border-border bg-card px-3 py-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary"
                        />
                        </label>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                        <label className="flex flex-col gap-2">
                            <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Fuente</span>
                            <select
                            value={selectedElement.fontFamily}
                            onChange={(event) => {
                                const nextFont = event.target.value;
                                onUpdateElement(selectedElement.id, (current) =>
                                current.kind === "text" ? { ...current, fontFamily: nextFont } : current,
                                );
                            }}
                            className="rounded-2xl border border-border bg-card px-3 py-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary"
                            >
                            {fontOptions.map((option) => (
                                <option key={option} value={option}>
                                {option}
                                </option>
                            ))}
                            </select>
                        </label>

                        <label className="flex flex-col gap-2">
                            <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Tamano</span>
                            <input
                            type="number"
                            min={12}
                            max={120}
                            value={selectedElement.fontSize}
                            onChange={(event) => {
                                const nextSize = Number(event.target.value) || 12;
                                onUpdateElement(selectedElement.id, (current) =>
                                current.kind === "text" ? { ...current, fontSize: nextSize } : current,
                                );
                            }}
                            className="rounded-2xl border border-border bg-card px-3 py-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary"
                            />
                        </label>
                        </div>

                        <label className="flex flex-col gap-2">
                        <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Color</span>
                        <input
                            type="color"
                            value={selectedElement.fill}
                            onChange={(event) => {
                            const nextColor = event.target.value;
                            onUpdateElement(selectedElement.id, (current) =>
                                current.kind === "text" ? { ...current, fill: nextColor } : current,
                            );
                            }}
                            className="h-11 w-full rounded-xl border border-border bg-card p-1"
                        />
                        </label>
                    </>
                    ) : null}

                    {isStrokeElement(selectedElement) ? (
                    <>
                        <p className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">Manipula en el lienzo: handle verde inicio/fin, handle azul para curva.</p>

                        <label className="flex flex-col gap-2">
                        <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Color de linea</span>
                        <input
                            type="color"
                            value={selectedElement.stroke}
                            onChange={(event) => {
                            const nextColor = event.target.value;
                            onUpdateElement(selectedElement.id, (current) =>
                                current.kind === "arrow" || current.kind === "line"
                                || current.kind === "draw"
                                ? { ...current, stroke: nextColor }
                                : current,
                            );
                            }}
                            className="h-11 w-full rounded-xl border border-border bg-card p-1"
                        />
                        </label>

                        <label className="flex flex-col gap-2">
                        <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Grosor</span>
                        <input
                            type="range"
                            min={2}
                            max={12}
                            value={selectedElement.strokeWidth}
                            onChange={(event) => {
                            const strokeWidth = Number(event.target.value);
                            onUpdateElement(selectedElement.id, (current) =>
                                current.kind === "arrow" || current.kind === "line" || current.kind === "draw"
                                ? { ...current, strokeWidth }
                                : current,
                            );
                            }}
                            className="accent-primary"
                        />
                        </label>

                        <label className="flex flex-col gap-2">
                        <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Tipo de linea</span>
                        <select
                            value={selectedElement.pattern}
                            onChange={(event) => {
                            const pattern = event.target.value as LinePattern;
                            onUpdateElement(selectedElement.id, (current) =>
                                isStrokeElement(current) ? { ...current, pattern } : current,
                            );
                            }}
                            className="rounded-2xl border border-border bg-card px-3 py-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary"
                        >
                            <option value="solid">Solida</option>
                            <option value="dashed">Punteada</option>
                            <option value="dotted">Puntos</option>
                            <option value="discontinuous">Discontinua</option>
                        </select>
                        </label>

                        <label className="flex flex-col gap-2">
                        <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Punta inicio</span>
                        <select
                            value={selectedElement.startHead}
                            onChange={(event) => {
                            const startHead = event.target.value as ArrowHeadType;
                            onUpdateElement(selectedElement.id, (current) =>
                                isStrokeElement(current) ? { ...current, startHead } : current,
                            );
                            }}
                            className="rounded-2xl border border-border bg-card px-3 py-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary"
                        >
                            <option value="none">Sin punta</option>
                            <option value="triangle">Triangulo</option>
                            <option value="circle">Circulo</option>
                            <option value="square">Cuadrado</option>
                            <option value="bar">Barra</option>
                        </select>
                        </label>

                        <label className="flex flex-col gap-2">
                        <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Punta final</span>
                        <select
                            value={selectedElement.endHead}
                            onChange={(event) => {
                            const endHead = event.target.value as ArrowHeadType;
                            onUpdateElement(selectedElement.id, (current) =>
                                isStrokeElement(current) ? { ...current, endHead } : current,
                            );
                            }}
                            className="rounded-2xl border border-border bg-card px-3 py-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary"
                        >
                            <option value="none">Sin punta</option>
                            <option value="triangle">Triangulo</option>
                            <option value="circle">Circulo</option>
                            <option value="square">Cuadrado</option>
                            <option value="bar">Barra</option>
                        </select>
                        </label>
                        
                    </>
                    ) : null}

                    {isFillElement(selectedElement) ? (
                    <>
                        <label className="flex flex-col gap-2">
                        <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Color de borde</span>
                        <input
                            type="color"
                            value={selectedElement.stroke}
                            onChange={(event) => {
                            const stroke = event.target.value;
                            onUpdateElement(selectedElement.id, (current) =>
                                current.kind === "rect" || current.kind === "circle" ? { ...current, stroke } : current,
                            );
                            }}
                            className="h-11 w-full rounded-xl border border-border bg-card p-1"
                        />
                        </label>

                        <label className="flex flex-col gap-2">
                        <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Relleno</span>
                        <input
                            type="color"
                            value={selectedElement.fill}
                            onChange={(event) => {
                            const fill = event.target.value;
                            onUpdateElement(selectedElement.id, (current) =>
                                current.kind === "rect" || current.kind === "circle" ? { ...current, fill } : current,
                            );
                            }}
                            className="h-11 w-full rounded-xl border border-border bg-card p-1"
                        />
                        </label>
                    </>
                    ) : null}
                </div>
            </div>
        )}
        </>
    )
}