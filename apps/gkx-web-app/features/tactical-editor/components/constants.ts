import type { ToolPanel } from "./types";

const TOOL_PANELS: Array<{ id: ToolPanel; label: string }> = [
  { id: "elements", label: "Elements" },
  { id: "text", label: "Text" },
  { id: "backgrounds", label: "Background" },
  { id: "layers", label: "Layers" },
];

const FONT_OPTIONS = ["Arial", "Verdana", "Trebuchet MS", "Georgia", "Impact"];

const CATEGORY_HINTS: Record<string, string> = {
  goalkeepers: "Porteros y acciones base",
  balones: "Balones para referencias de disparo",
  conos: "Conos y marcadores",
  vallas: "Vallas para desplazamientos",
  picas: "Picas y referencias verticales",
  aros: "Aros de coordinacion",
  escaleras: "Escaleras de agilidad",
  reboteador: "Superficies de rebote",
  cajas: "Cajas y bloques",
  bossu: "Elementos propioceptivos",
  lona: "Lonas y zonas objetivo",
  muñeco: "Muñecos de oposicion",
};

export { TOOL_PANELS, FONT_OPTIONS, CATEGORY_HINTS };