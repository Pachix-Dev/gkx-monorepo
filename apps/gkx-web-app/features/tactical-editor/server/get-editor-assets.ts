import { promises as fs } from "node:fs";
import path from "node:path";

export type EditorAssetVariant = {
  id: string;
  name: string;
  src: string;
};

export type EditorAsset = {
  id: string;
  name: string;
  src: string;
  variants?: EditorAssetVariant[];
  defaultWidth?: number;
  defaultHeight?: number;
};

export type EditorBackground = Pick<EditorAsset, "id" | "name" | "src">;

export type EditorShapeGroup = {
  id: string;
  label: string;
  items: EditorAsset[];
};

const IMAGE_PATTERN = /\.(png|jpe?g|webp|svg)$/i;
const BACKGROUND_DIR = path.join(process.cwd(), "public", "editor-assets", "backgrounds");
const SHAPES_DIR = path.join(process.cwd(), "public", "editor-assets", "shapes");

async function readDirSafe(dirPath: string) {
  try {
    return await fs.readdir(dirPath, { withFileTypes: true });
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code)
        : "";

    if (code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

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

type ImageMetadata = {
  name?: string;
  order?: number;
  id?: string;
  defaultWidth?: number;
  defaultHeight?: number;
};

const BACKGROUND_METADATA: Record<string, ImageMetadata> = {
  "PORTERIA_FRONTAL.png": {
    name: "Porteria frontal",
    order: 1,
  },
  "PORTERIA_FRONTAL_LEJOS.png": {
    name: "Porteria frontal lejana",
    order: 2,
  },
  "PORTERIA_HORIZONTAL_DERECHO.png": {
    name: "Porteria horizontal derecha",
    order: 3,
  },
  "PORTERIA_HORIZONTAL_IZQUIERDO.png": {
    name: "Porteria horizontal izquierda",
    order: 4,
  },
  "PORTERIA_LATERAL_DERECHO.png": {
    name: "Porteria lateral derecha",
    order: 5,
  },
  "PORTERIA_LATERAL_IZQUIERDO.png": {
    name: "Porteria lateral izquierda",
    order: 6,
  },
  "PORTERIA_LATERAL_IZQUIERDO_BAJO.png": {
    name: "Porteria lateral izquierda baja",
    order: 7,
  },
  "PORTERIA_REVERSO.png": {
    name: "Porteria reverso",
    order: 8,
  },
  "ZonaNeutra1.jpg": {
    name: "Zona neutra 1",
    order: 90,
  },
  "ZonaNeutra2.jpg": {
    name: "Zona neutra 2",
    order: 91,
  },
};

const GOALKEEPER_POSE_METADATA: Record<string, ImageMetadata> = {
  "1 basica": {
    id: "gk-pose-01-basica-parado",
    name: "Basica parado",
    order: 1,
    defaultWidth: 72,
    defaultHeight: 102,
  },
  "2  incado": {
    id: "gk-pose-02-hincado",
    name: "Hincado",
    order: 2,
    defaultWidth: 76,
    defaultHeight: 94,
  },
  "3 puños izquierda": {
    id: "gk-pose-03-punos-izquierda",
    name: "Despeje de punos izquierda",
    order: 3,
    defaultWidth: 86,
    defaultHeight: 108,
  },
  "4 puños derecha": {
    id: "gk-pose-04-punos-derecha",
    name: "Despeje de punos derecha",
    order: 4,
    defaultWidth: 86,
    defaultHeight: 108,
  },
  "5 arriba": {
    id: "gk-pose-05-guardia-alta",
    name: "Guardia alta",
    order: 5,
    defaultWidth: 72,
    defaultHeight: 110,
  },
  "6 atajada volar izquierda": {
    id: "gk-pose-06-volar-izquierda",
    name: "Atajada volar izquierda",
    order: 6,
    defaultWidth: 116,
    defaultHeight: 70,
  },
  "7  atajada volar derecha": {
    id: "gk-pose-07-volar-derecha",
    name: "Atajada volar derecha",
    order: 7,
    defaultWidth: 116,
    defaultHeight: 70,
  },
  "8 manos abierta": {
    id: "gk-pose-08-barrera-amplia",
    name: "Barrera amplia",
    order: 8,
    defaultWidth: 92,
    defaultHeight: 104,
  },
  "9 corriendo": {
    id: "gk-pose-09-atajada-aerea-lateral",
    name: "Atajada aerea lateral",
    order: 9,
    defaultWidth: 82,
    defaultHeight: 108,
  },
  "10 posicion x": {
    id: "gk-pose-10-extension-x",
    name: "Atajada extension X",
    order: 10,
    defaultWidth: 104,
    defaultHeight: 96,
  },
  "11 atajada baja": {
    id: "gk-pose-11-atajada-baja",
    name: "Atajada baja",
    order: 11,
    defaultWidth: 72,
    defaultHeight: 110,
  },
  "12 atajada manos extendidas": {
    id: "gk-pose-12-manos-extendidas",
    name: "Atajada manos extendidas",
    order: 12,
    defaultWidth: 110,
    defaultHeight: 72,
  },
  "13 salto": {
    id: "gk-pose-13-salto",
    name: "Salto",
    order: 13,
    defaultWidth: 72,
    defaultHeight: 118,
  },
  "14 atajada lado pierna levantada": {
    id: "gk-pose-14-lado-pierna-levantada",
    name: "Atajada lado pierna levantada",
    order: 14,
    defaultWidth: 108,
    defaultHeight: 76,
  },
  "15 ataque suelo": {
    id: "gk-pose-15-ataque-suelo",
    name: "Ataque al suelo",
    order: 15,
    defaultWidth: 112,
    defaultHeight: 76,
  },
  "16 atrapada cunclillas": {
    id: "gk-pose-16-atrapada-cuclillas",
    name: "Atrapada en cuclillas",
    order: 16,
    defaultWidth: 76,
    defaultHeight: 104,
  },
  "17 salto una pierna": {
    id: "gk-pose-17-salto-una-pierna",
    name: "Salto una pierna",
    order: 17,
    defaultWidth: 76,
    defaultHeight: 118,
  },
  "18 salto dos piernas": {
    id: "gk-pose-18-salto-dos-piernas",
    name: "Salto dos piernas",
    order: 18,
    defaultWidth: 82,
    defaultHeight: 118,
  },
  "19 saque boleo derecha": {
    id: "gk-pose-19-bolea-derecha",
    name: "Saque de bolea derecha",
    order: 19,
    defaultWidth: 82,
    defaultHeight: 112,
  },
  "20 corriendo": {
    id: "gk-pose-20-corriendo",
    name: "Corriendo",
    order: 20,
    defaultWidth: 72,
    defaultHeight: 112,
  },
  "21 pateando": {
    id: "gk-pose-21-pateando",
    name: "Pateando",
    order: 21,
    defaultWidth: 84,
    defaultHeight: 112,
  },
  "22 pierna al suelo": {
    id: "gk-pose-22-pierna-al-suelo",
    name: "Pierna al suelo",
    order: 22,
    defaultWidth: 88,
    defaultHeight: 108,
  },
  "23 saque con la mano": {
    id: "gk-pose-23-saque-mano",
    name: "Saque con la mano",
    order: 23,
    defaultWidth: 82,
    defaultHeight: 118,
  },
  "24 semivolea": {
    id: "gk-pose-24-semivolea",
    name: "Semivolea",
    order: 24,
    defaultWidth: 84,
    defaultHeight: 112,
  },
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

function parseLeadingNumber(value: string) {
  const match = /^(\d+)/.exec(value.trim());
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function parseGoalkeeperViewOrder(fileName: string) {
  const match = /_R(\d+)\.[^.]+$/i.exec(fileName);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

async function readImages(
  dirPath: string,
  publicSegments: string[],
  metadata: Record<string, ImageMetadata> = {},
): Promise<EditorAsset[]> {
  const entries = await readDirSafe(dirPath);

  return entries
    .filter((entry) => entry.isFile() && IMAGE_PATTERN.test(entry.name))
    .sort((left, right) => {
      const leftOrder = metadata[left.name]?.order ?? Number.MAX_SAFE_INTEGER;
      const rightOrder =
        metadata[right.name]?.order ?? Number.MAX_SAFE_INTEGER;

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return left.name.localeCompare(right.name, "es", {
        numeric: true,
        sensitivity: "base",
      });
    })
    .map((entry) => ({
      id: metadata[entry.name]?.id ?? entry.name,
      name: metadata[entry.name]?.name ?? normalizeLabel(entry.name),
      src: buildPublicSrc(...publicSegments, entry.name),
      defaultWidth: metadata[entry.name]?.defaultWidth,
      defaultHeight: metadata[entry.name]?.defaultHeight,
    }));
}

async function readGoalkeeperPoses(
  dirPath: string,
  publicSegments: string[],
): Promise<EditorAsset[]> {
  type GoalkeeperPoseAsset = EditorAsset & {
    variants: EditorAssetVariant[];
    defaultWidth: number | undefined;
    defaultHeight: number | undefined;
    sortOrder: number;
  };

  const poses = await readDirSafe(dirPath);

  const items = await Promise.all(
    poses
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const poseOrder = parseLeadingNumber(entry.name);
        const poseMetadata = Object.values(GOALKEEPER_POSE_METADATA).find(
          (metadata) => metadata.order === poseOrder,
        );
        const variants = await readImages(
          path.join(dirPath, entry.name),
          [...publicSegments, entry.name],
        );

        const sortedVariants = [...variants].sort((left, right) => {
          const leftOrder = parseGoalkeeperViewOrder(left.src);
          const rightOrder = parseGoalkeeperViewOrder(right.src);

          if (leftOrder !== rightOrder) {
            return leftOrder - rightOrder;
          }

          return left.name.localeCompare(right.name, "es", {
            numeric: true,
            sensitivity: "base",
          });
        });

        if (sortedVariants.length === 0) {
          return null;
        }

        const previewVariant =
          sortedVariants.find(
            (variant) => parseGoalkeeperViewOrder(variant.src) === 1,
          ) ?? sortedVariants[0];

        return {
          id: poseMetadata?.id ?? `goalkeeper-pose-${poseOrder}`,
          name: poseMetadata?.name ?? normalizeLabel(entry.name),
          src: previewVariant.src,
          variants: sortedVariants.map((variant, index) => ({
            id: variant.id,
            name: `Vista ${index + 1}`,
            src: variant.src,
          })),
          defaultWidth: poseMetadata?.defaultWidth,
          defaultHeight: poseMetadata?.defaultHeight,
          sortOrder: poseMetadata?.order ?? poseOrder,
        };
      }),
  );

  return items
    .filter((item): item is GoalkeeperPoseAsset => item !== null)
    .sort((left, right) => {
      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder;
      }

      return left.name.localeCompare(right.name, "es", {
        sensitivity: "base",
      });
    })
    .map(({ sortOrder: _sortOrder, ...item }) => item);
}

export async function getEditorBackgrounds(): Promise<EditorBackground[]> {
  return readImages(
    BACKGROUND_DIR,
    ["editor-assets", "backgrounds"],
    BACKGROUND_METADATA,
  );
}

export async function getEditorShapeGroups(): Promise<EditorShapeGroup[]> {
  const categories = await readDirSafe(SHAPES_DIR);

  const groups = await Promise.all(
    categories
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const items =
          entry.name === "goalkeepers"
            ? await readGoalkeeperPoses(path.join(SHAPES_DIR, entry.name), ["editor-assets", "shapes", entry.name])
            : await readImages(path.join(SHAPES_DIR, entry.name), ["editor-assets", "shapes", entry.name]);

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
