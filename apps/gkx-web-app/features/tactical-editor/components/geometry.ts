import type { ArrowHeadType, LinePattern, StrokeElement } from "./types";

export function toDash(pattern: LinePattern) {
  if (pattern === "dashed") return [16, 10];
  if (pattern === "dotted") return [2, 10];
  if (pattern === "discontinuous") return [30, 14, 8, 14];
  return [];
}

export function buildCurvePoints(points: StrokeElement["points"], curveStrength: number, segments = 24) {
  const [sx, sy, cx, cy, ex, ey] = points;
  const mx = (sx + ex) / 2;
  const my = (sy + ey) / 2;
  const blendedCx = mx + (cx - mx) * curveStrength;
  const blendedCy = my + (cy - my) * curveStrength;
  const curveHandleX = 0.25 * sx + 0.5 * blendedCx + 0.25 * ex;
  const curveHandleY = 0.25 * sy + 0.5 * blendedCy + 0.25 * ey;
  const result: number[] = [];

  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const x = (1 - t) ** 2 * sx + 2 * (1 - t) * t * blendedCx + t ** 2 * ex;
    const y = (1 - t) ** 2 * sy + 2 * (1 - t) * t * blendedCy + t ** 2 * ey;
    result.push(x, y);
  }

  return {
    points: result,
    start: { x: sx, y: sy },
    end: { x: ex, y: ey },
    control: { x: blendedCx, y: blendedCy },
    curveHandle: { x: curveHandleX, y: curveHandleY },
    startDirection: { x: blendedCx - sx, y: blendedCy - sy },
    endDirection: { x: ex - blendedCx, y: ey - blendedCy },
  };
}

export function lineAngleDegrees(direction: { x: number; y: number }) {
  return (Math.atan2(direction.y, direction.x) * 180) / Math.PI;
}

export function markerSize(strokeWidth: number) {
  return Math.max(8, strokeWidth * 2.6);
}

export function createStrokeElement(
  createId: (prefix: string) => string,
  kind: StrokeElement["kind"],
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  color: string,
  strokeWidth: number,
  pattern: LinePattern,
): StrokeElement {
  const controlX = (startX + endX) / 2;
  const controlY = (startY + endY) / 2;

  const defaultsByKind =
    kind === "arrow"
      ? { startHead: "none" as ArrowHeadType, endHead: "triangle" as ArrowHeadType }
      : { startHead: "none" as ArrowHeadType, endHead: "none" as ArrowHeadType };

  return {
    id: createId(kind),
    kind,
    x: 0,
    y: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    visible: true,
    locked: false,
    points: [startX, startY, controlX, controlY, endX, endY],
    stroke: color,
    strokeWidth,
    pattern,
    startHead: defaultsByKind.startHead,
    endHead: defaultsByKind.endHead,
    curveStrength: 1,
  };
}