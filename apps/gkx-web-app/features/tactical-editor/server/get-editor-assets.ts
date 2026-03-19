import { promises as fs } from "node:fs";
import path from "node:path";

export type EditorBackground = {
  id: string;
  name: string;
  src: string;
};

export type EditorShapeGroup = {
  id: string;
  label: string;
  items: EditorBackground[];
};

const IMAGE_PATTERN = /\.(png|jpe?g|webp|svg)$/i;
const BACKGROUND_DIR = path.join(process.cwd(), "public", "editor-assets", "backgrounds");
const SHAPES_DIR = path.join(process.cwd(), "public", "editor-assets", "shapes");

const CATEGORY_LABELS: Record<string, string> = {
  aros: "Aros",
  balones: "Balones",
  bossu: "Bossu",
  cajas: "Cajas",
  conos: "Conos",
  escaleras: "Escaleras",
  goalkeepers: "Porteros",
  lona: "Lonas",
  muñeco: "Muñecos",
  picas: "Picas",
  reboteador: "Reboteadores",
  vallas: "Vallas",
};

const CATEGORY_ORDER: Record<string, number> = {
  goalkeepers: 1,
  balones: 2,
  conos: 3,
  vallas: 4,
  picas: 5,
  aros: 6,
  escaleras: 7,
  reboteador: 8,
  cajas: 9,
  bossu: 10,
  lona: 11,
  muñeco: 12,
};

function normalizeLabel(value: string) {
  return value
    .replace(/\.[^/.]+$/, "")
    .replace(/([a-záéíóúñ])([A-Z0-9])/g, "$1 $2")
    .replace(/([0-9])([a-zA-Záéíóúñ])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .trim();
}

function buildPublicSrc(...segments: string[]) {
  return `/${segments.map((segment) => encodeURIComponent(segment)).join("/")}`;
}

async function readImages(dirPath: string, publicSegments: string[]): Promise<EditorBackground[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && IMAGE_PATTERN.test(entry.name))
    .sort((left, right) => left.name.localeCompare(right.name, "es", { numeric: true, sensitivity: "base" }))
    .map((entry) => ({
      id: entry.name,
      name: normalizeLabel(entry.name),
      src: buildPublicSrc(...publicSegments, entry.name),
    }));
}

export async function getEditorBackgrounds(): Promise<EditorBackground[]> {
  return readImages(BACKGROUND_DIR, ["editor-assets", "backgrounds"]);
}

export async function getEditorShapeGroups(): Promise<EditorShapeGroup[]> {
  const categories = await fs.readdir(SHAPES_DIR, { withFileTypes: true });

  const groups = await Promise.all(
    categories
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const items = await readImages(path.join(SHAPES_DIR, entry.name), ["editor-assets", "shapes", entry.name]);

        return {
          id: entry.name,
          label: CATEGORY_LABELS[entry.name] ?? normalizeLabel(entry.name),
          items,
        };
      }),
  );

  return groups
    .filter((group) => group.items.length > 0)
    .sort((left, right) => {
      const leftRank = CATEGORY_ORDER[left.id] ?? Number.MAX_SAFE_INTEGER;
      const rightRank = CATEGORY_ORDER[right.id] ?? Number.MAX_SAFE_INTEGER;

      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }

      return left.label.localeCompare(right.label, "es", { sensitivity: "base" });
    });
}
