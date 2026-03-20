import {
  EditorElementKind,
  LinePattern,
  ArrowHeadType,
} from '../enums/exercise.enum';

// Base types for editor elements
export type BaseElement = {
  id: string;
  kind: EditorElementKind;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  visible: boolean;
  locked: boolean;
};

export type ImageElement = BaseElement & {
  kind: EditorElementKind.ASSET;
  src: string;
  width: number;
  height: number;
  label: string;
};

export type TextElement = BaseElement & {
  kind: EditorElementKind.TEXT;
  text: string;
  width: number;
  fontSize: number;
  fontFamily: string;
  fill: string;
};

export type StrokeElement = BaseElement & {
  kind: EditorElementKind.ARROW | EditorElementKind.LINE | EditorElementKind.DRAW;
  points: [number, number, number, number, number, number];
  stroke: string;
  strokeWidth: number;
  pattern: LinePattern;
  startHead: ArrowHeadType;
  endHead: ArrowHeadType;
  curveStrength: number;
};

export type RectElement = BaseElement & {
  kind: EditorElementKind.RECT;
  width: number;
  height: number;
  stroke: string;
  strokeWidth: number;
  fill: string;
  dash: number[];
  opacity: number;
  cornerRadius: number;
};

export type CircleElement = BaseElement & {
  kind: EditorElementKind.CIRCLE;
  radius: number;
  stroke: string;
  strokeWidth: number;
  fill: string;
  dash: number[];
  opacity: number;
};

export type EditorElement =
  | ImageElement
  | TextElement
  | StrokeElement
  | RectElement
  | CircleElement;

// Tactical design state (full editor state)
export type TacticalDesignState = {
  activePanel: 'backgrounds' | 'text' | 'elements' | 'layers';
  isMenuCollapsed: boolean;
  backgroundSrc: string;
  elements: EditorElement[];
  textDraft: string;
  fontFamily: string;
  fontSize: number;
  fontColor: string;
};

// Tactical design metadata (persisted in database)
export type TacticalDesign = {
  id: string;
  exerciseId: string;
  state: TacticalDesignState;
  stateVersion: number;
  previewUrl: string | null;
  previewHash: string | null;
  updatedAt: Date;
  createdAt: Date;
};

// Snapshot for training sessions (frozen at assignment time)
export type TacticalDesignSnapshot = {
  id: string;
  sessionExerciseId: string;
  stateSnapshot: TacticalDesignState;
  previewUrlSnapshot: string | null;
  snapshotCreatedAt: Date;
  createdAt: Date;
};

// For API responses
export type TacticalDesignResponse = {
  exerciseId: string;
  state: TacticalDesignState;
  stateVersion: number;
  previewUrl: string | null;
  updatedAt: string;
};
