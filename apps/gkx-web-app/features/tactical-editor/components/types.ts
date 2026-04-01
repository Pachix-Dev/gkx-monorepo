type EditorAsset = {
  id: string;
  name: string;
  src: string;
};

type EditorAssetGroup = {
  id: string;
  label: string;
  items: EditorAsset[];
};

type ToolPanel = "backgrounds" | "text" | "elements" | "layers" | "ai";
type LinePattern = "solid" | "dashed" | "dotted" | "discontinuous";
type ArrowHeadType = "none" | "triangle" | "circle" | "square" | "bar";

type BaseElement = {
  id: string;
  kind: "asset" | "text" | "arrow" | "line" | "draw" | "rect" | "circle";
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  visible: boolean;
  locked: boolean;
};

type ImageElement = BaseElement & {
  kind: "asset";
  src: string;
  width: number;
  height: number;
  label: string;
};

type TextElement = BaseElement & {
  kind: "text";
  text: string;
  width: number;
  fontSize: number;
  fontFamily: string;
  fill: string;
};

type StrokeElement = BaseElement & {
  kind: "arrow" | "line" | "draw";
  points: [number, number, number, number, number, number];
  stroke: string;
  strokeWidth: number;
  pattern: LinePattern;
  startHead: ArrowHeadType;
  endHead: ArrowHeadType;
  curveStrength: number;
};

type RectElement = BaseElement & {
  kind: "rect";
  width: number;
  height: number;
  stroke: string;
  strokeWidth: number;
  fill: string;
  dash: number[];
  opacity: number;
  cornerRadius: number;
};

type CircleElement = BaseElement & {
  kind: "circle";
  radius: number;
  stroke: string;
  strokeWidth: number;
  fill: string;
  dash: number[];
  opacity: number;
};

type EditorElement = ImageElement | TextElement | StrokeElement | RectElement | CircleElement;

type TacticalEditorClientProps = {
  backgrounds: EditorAsset[];
  shapeGroups: EditorAssetGroup[];
  exerciseId?: string;
};

export type {
  EditorAsset,
  EditorAssetGroup,
  ToolPanel,
  LinePattern,
  ArrowHeadType,
  BaseElement,
  ImageElement,
  TextElement,
  StrokeElement,
  RectElement,
  CircleElement,
  EditorElement,
  TacticalEditorClientProps,
};