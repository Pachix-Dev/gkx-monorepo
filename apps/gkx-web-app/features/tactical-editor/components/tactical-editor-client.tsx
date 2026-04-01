"use client";

import Image from "next/image";
import type Konva from "konva";
import { useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from "react";
import { Arrow, Circle, Image as KonvaImage, Layer, Line, Rect, Stage, Text, Transformer } from "react-konva";
import type {
  ArrowHeadType,
  EditorAsset,
  EditorElement,
  LinePattern,
  StrokeElement,
  TacticalEditorClientProps,
  ToolPanel,
} from "./types";
import { FONT_OPTIONS, CATEGORY_HINTS, TOOL_PANELS } from "./constants";
import {
  buildCurvePoints,
  createStrokeElement,
  lineAngleDegrees,
  markerSize,
  toDash,
} from "./geometry";
import { SelectedElementPanel } from "./selected-element-panel";
import { buildEditorStore, TacticalEditorStoreContext, useTacticalEditorStore } from "./tactical-editor-store";
import { useTacticalDesignSync } from "../../exercises/hooks/use-tactical-design-sync";
import { AiPanel } from "./ai-panel";
import { Fragment } from "react";

const FIXED_STAGE_WIDTH = 1300;
const FIXED_STAGE_HEIGHT = 659;
const FIXED_STAGE_CENTER_X = FIXED_STAGE_WIDTH / 2;
const FIXED_STAGE_CENTER_Y = FIXED_STAGE_HEIGHT / 2;

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}


function isStrokeElement(element: EditorElement | null): element is StrokeElement {
  return element?.kind === "arrow" || element?.kind === "line" || element?.kind === "draw";
}

function getAssetDefaultSize(groupId: string) {
  switch (groupId) {
    case "goalkeepers":
      return { width: 72, height: 102 };
    case "balones":
      return { width: 34, height: 34 };
    case "conos":
    case "aros":
      return { width: 46, height: 46 };
    case "escaleras":
    case "vallas":
    case "reboteador":
    case "lona":
      return { width: 96, height: 48 };
    default:
      return { width: 64, height: 64 };
  }
}

function useCanvasImage(src: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const nextImage = new window.Image();

    nextImage.onload = () => {
      if (!cancelled) {
        setImage(nextImage);
      }
    };

    nextImage.onerror = () => {
      if (!cancelled) {
        setImage(null);
      }
    };

    nextImage.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  return image;
}

type CanvasImageShapeProps = {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  draggable?: boolean;
  opacity?: number;
  listening?: boolean;
  name?: string;
  onClick?: () => void;
  onTap?: () => void;
  onDragEnd?: (event: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd?: (event: Konva.KonvaEventObject<Event>) => void;
  shapeRef?: (node: Konva.Image | null) => void;
};

function CanvasImageShape({
  src,
  shapeRef,
  ...props
}: CanvasImageShapeProps) {
  const image = useCanvasImage(src);

  if (!image) {
    return null;
  }

  return <KonvaImage ref={shapeRef} image={image} {...props} />;
}

export function TacticalEditorClient({ backgrounds, shapeGroups, exerciseId }: TacticalEditorClientProps) {
  const [store] = useState(() => {
    const key = exerciseId
      ? `gkx:tactical-editor:v1:${exerciseId}`
      : "gkx:tactical-editor:v1:standalone";
    return buildEditorStore(key);
  });

  return (
    <TacticalEditorStoreContext.Provider value={store}>
      <TacticalEditorClientContent backgrounds={backgrounds} shapeGroups={shapeGroups} exerciseId={exerciseId} />
    </TacticalEditorStoreContext.Provider>
  );
}

function TacticalEditorClientContent({ backgrounds, shapeGroups, exerciseId }: TacticalEditorClientProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const layersListRef = useRef<HTMLDivElement | null>(null);
  const layerItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const previousLayerTops = useRef<Record<string, number>>({});
  const stageRef = useRef<Konva.Stage | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const nodeRefs = useRef<Record<string, Konva.Node | null>>({});

  const activePanel = useTacticalEditorStore((state) => state.activePanel);
  const setActivePanel = useTacticalEditorStore((state) => state.setActivePanel);
  const isMenuCollapsed = useTacticalEditorStore((state) => state.isMenuCollapsed);
  const setIsMenuCollapsed = useTacticalEditorStore((state) => state.setIsMenuCollapsed);
  const backgroundSrc = useTacticalEditorStore((state) => state.backgroundSrc);
  const setBackgroundSrc = useTacticalEditorStore((state) => state.setBackgroundSrc);
  const elements = useTacticalEditorStore((state) => state.elements);
  const setElements = useTacticalEditorStore((state) => state.setElements);
  const textDraft = useTacticalEditorStore((state) => state.textDraft);
  const setTextDraft = useTacticalEditorStore((state) => state.setTextDraft);
  const fontFamily = useTacticalEditorStore((state) => state.fontFamily);
  const setFontFamily = useTacticalEditorStore((state) => state.setFontFamily);
  const fontSize = useTacticalEditorStore((state) => state.fontSize);
  const setFontSize = useTacticalEditorStore((state) => state.setFontSize);
  const fontColor = useTacticalEditorStore((state) => state.fontColor);
  const setFontColor = useTacticalEditorStore((state) => state.setFontColor);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [dragOverLayerId, setDragOverLayerId] = useState<string | null>(null);
  const [dragOverPlacement, setDragOverPlacement] = useState<"before" | "after">("after");
  const [assetSearch, setAssetSearch] = useState("");
  const [stageScale, setStageScale] = useState(1);

  const deferredAssetSearch = useDeferredValue(assetSearch.trim().toLowerCase());

  // Tactical design sync with API
  const getCurrentState = useCallback(() => ({
    elements,
    backgroundSrc,
  }), [elements, backgroundSrc]);

  const getPreviewBlob = useCallback(async () => {
    const stage = stageRef.current;
    if (!stage) return null;

    const currentScale = stage.scaleX() || 1;

    const dataUrl = stage.toDataURL({
      // Normalize export resolution so preview quality does not depend on viewport size.
      pixelRatio: Math.max(1, 1.15 / currentScale),
      mimeType: "image/png",
    });

    const response = await fetch(dataUrl);
    return response.blob();
  }, []);

  const { remoteDesign, debouncedSave } =
    useTacticalDesignSync(exerciseId, getCurrentState, getPreviewBlob);

  // Load remote state on mount
  const hasLoadedRemoteRef = useRef(false);
  useEffect(() => {
    if (remoteDesign?.state && !hasLoadedRemoteRef.current && exerciseId) {
      hasLoadedRemoteRef.current = true;
      setBackgroundSrc(remoteDesign.state.backgroundSrc || "");
      setElements((Array.isArray(remoteDesign.state.elements) ? remoteDesign.state.elements : []) as EditorElement[]);
    }
  }, [remoteDesign, exerciseId, setBackgroundSrc, setElements]);

  // Debounced save on state changes
  useEffect(() => {
    if (exerciseId && (elements.length > 0 || backgroundSrc)) {
      debouncedSave();
    }
  }, [exerciseId, elements, backgroundSrc, debouncedSave]);

  useEffect(() => {
    if (backgroundSrc || !backgrounds[0]?.src) {
      return;
    }

    setBackgroundSrc(backgrounds[0].src);
  }, [backgroundSrc, backgrounds, setBackgroundSrc]);

  const selectedElement = useMemo(() => {
    return elements.find((element) => element.id === selectedId) ?? null;
  }, [elements, selectedId]);

  const filteredShapeGroups = useMemo(() => {
    if (!deferredAssetSearch) {
      return shapeGroups;
    }

    return shapeGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.name.toLowerCase().includes(deferredAssetSearch)),
      }))
      .filter((group) => group.items.length > 0);
  }, [deferredAssetSearch, shapeGroups]);

  const orderedLayers = useMemo(() => {
    return [...elements].reverse();
  }, [elements]);

  useLayoutEffect(() => {
    const nextTops: Record<string, number> = {};

    orderedLayers.forEach((layer) => {
      const node = layerItemRefs.current[layer.id];
      if (!node) {
        return;
      }

      const nextTop = node.getBoundingClientRect().top;
      nextTops[layer.id] = nextTop;

      const previousTop = previousLayerTops.current[layer.id];
      if (previousTop === undefined) {
        return;
      }

      const deltaY = previousTop - nextTop;
      if (deltaY === 0) {
        return;
      }

      node.style.transition = "none";
      node.style.transform = `translateY(${deltaY}px)`;

      requestAnimationFrame(() => {
        node.style.transition = "transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)";
        node.style.transform = "translateY(0)";
      });
    });

    previousLayerTops.current = nextTops;
  }, [orderedLayers]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateSize = () => {
      const availableWidth = Math.max(320, element.clientWidth);
      const availableHeight = Math.max(340, Math.floor(window.innerHeight * 0.68));
      const widthScale = availableWidth / FIXED_STAGE_WIDTH;
      const heightScale = availableHeight / FIXED_STAGE_HEIGHT;
      const nextScale = Math.max(0.2, Math.min(widthScale, heightScale, 1));
      setStageScale(nextScale);
    };

    updateSize();

    const observer = new ResizeObserver(() => updateSize());
    observer.observe(element);
    window.addEventListener("resize", updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  useEffect(() => {
    const transformer = transformerRef.current;

    if (!transformer) {
      return;
    }

    if (!selectedId) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    const selected = elements.find((item) => item.id === selectedId) ?? null;
    if (isStrokeElement(selected) || selected?.locked) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    const node = nodeRefs.current[selectedId];
    transformer.nodes(node ? [node] : []);
    transformer.getLayer()?.batchDraw();
  }, [selectedId, elements]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
        return;
      }

      if (selectedId && (event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === "ArrowUp" || event.key === "]")) {
        event.preventDefault();
        setElements((current) => {
          const targetElement = current.find((item) => item.id === selectedId);
          if (!targetElement) return current;
          return [...current.filter((item) => item.id !== selectedId), targetElement];
        });
        return;
      }

      if (selectedId && (event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === "ArrowDown" || event.key === "[")) {
        event.preventDefault();
        setElements((current) => {
          const targetElement = current.find((item) => item.id === selectedId);
          if (!targetElement) return current;
          return [targetElement, ...current.filter((item) => item.id !== selectedId)];
        });
        return;
      }

      if ((event.key === "Delete" || event.key === "Backspace") && selectedId) {
        event.preventDefault();
        setElements((current) => current.filter((element) => element.id !== selectedId));
        setSelectedId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, setElements]);

  const updateElement = (id: string, updater: (element: EditorElement) => EditorElement) => {
    setElements((current) => current.map((element) => (element.id === id ? updater(element) : element)));
  };

  const addAssetElement = (groupId: string, asset: EditorAsset) => {
    const size = getAssetDefaultSize(groupId);

    setElements((current) => [
      ...current,
      {
        id: createId("asset"),
        kind: "asset",
        x: FIXED_STAGE_CENTER_X - size.width / 2,
        y: FIXED_STAGE_CENTER_Y - size.height / 2,
        width: size.width,
        height: size.height,
        src: asset.src,
        label: asset.name,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        visible: true,
        locked: false,
      },
    ]);
  };

  const addTextElement = () => {
    const value = textDraft.trim() || "Nuevo texto";
    const nextId = createId("text");

    setElements((current) => [
      ...current,
      {
        id: nextId,
        kind: "text",
        x: FIXED_STAGE_CENTER_X - 120,
        y: FIXED_STAGE_CENTER_Y - 24,
        text: value,
        width: 240,
        fontSize,
        fontFamily,
        fill: fontColor,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        visible: true,
        locked: false,
      },
    ]);

    setSelectedId(nextId);
  };

  const addArrowElement = (variant: "solid" | "dashed") => {
    const startX = FIXED_STAGE_CENTER_X - 130;
    const startY = FIXED_STAGE_CENTER_Y;
    const endX = FIXED_STAGE_CENTER_X + 130;
    const endY = FIXED_STAGE_CENTER_Y;
    const pattern: LinePattern = variant === "dashed" ? "dashed" : "solid";

    setElements((current) => [...current, createStrokeElement(createId, "arrow", startX, startY, endX, endY, "#2563eb", 4, pattern)]);
  };

  const addLineElement = () => {
    const startX = FIXED_STAGE_CENTER_X - 140;
    const startY = FIXED_STAGE_CENTER_Y;
    const endX = FIXED_STAGE_CENTER_X + 140;
    const endY = FIXED_STAGE_CENTER_Y;

    setElements((current) => [...current, createStrokeElement(createId, "line", startX, startY, endX, endY, "#2563eb", 4, "discontinuous")]);
  };

  const addRectElement = () => {
    setElements((current) => [
      ...current,
      {
        id: createId("rect"),
        kind: "rect",
        x: FIXED_STAGE_CENTER_X - 90,
        y: FIXED_STAGE_CENTER_Y - 55,
        width: 180,
        height: 110,
        stroke: "#22c55e",
        strokeWidth: 4,
        fill: "#22c55e",
        dash: [10, 6],
        opacity: 1,
        cornerRadius: 18,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        visible: true,
        locked: false,
      },
    ]);
  };

  const addCircleElement = () => {
    setElements((current) => [
      ...current,
      {
        id: createId("circle"),
        kind: "circle",
        x: FIXED_STAGE_CENTER_X,
        y: FIXED_STAGE_CENTER_Y,
        radius: 72,
        stroke: "#dc2626",
        strokeWidth: 4,
        fill: "#dc2626",
        dash: [],
        opacity: 1,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        visible: true,
        locked: false,
      },
    ]);
  };

  const handleStageClick = (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const target = event.target;
    const stage = target.getStage();

    if (target === stage || target.getType() === "Layer") {
    setSelectedId(null);
    }
  };

  const exportAsPng = () => {
    const currentScale = stageRef.current?.scaleX() ?? 1;
    const uri = stageRef.current?.toDataURL({ pixelRatio: 2 / currentScale });
    if (!uri) return;

    const link = document.createElement("a");
    link.download = `tactical-editor-${Date.now()}.png`;
    link.href = uri;
    link.click();
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setElements((current) => current.filter((element) => element.id !== selectedId));
    setSelectedId(null);
  };

  const clearBoard = () => {
    setElements([]);
    setSelectedId(null);
  };

  const applyGeneratedPlay = (
    mode: "replace" | "append",
    generatedElements: EditorElement[],
    generatedBackgroundSrc: string | null,
  ) => {
    setElements((current) =>
      mode === "replace" ? generatedElements : [...current, ...generatedElements],
    );

    if (generatedBackgroundSrc) {
      setBackgroundSrc(generatedBackgroundSrc);
    }

    setSelectedId(null);
  };

  const bringElementToFront = (id: string) => {
    setElements((current) => {
      const target = current.find((item) => item.id === id);
      if (!target) return current;

      return [...current.filter((item) => item.id !== id), target];
    });
  };

  const sendElementToBack = (id: string) => {
    setElements((current) => {
      const target = current.find((item) => item.id === id);
      if (!target) return current;

      return [target, ...current.filter((item) => item.id !== id)];
    });
  };

  const reorderLayers = (sourceId: string, targetId: string, placement: "before" | "after") => {
    if (sourceId === targetId) {
      return;
    }

    setElements((current) => {
      const visibleOrder = [...current].reverse();
      const sourceIndex = visibleOrder.findIndex((item) => item.id === sourceId);
      const targetIndex = visibleOrder.findIndex((item) => item.id === targetId);

      if (sourceIndex < 0 || targetIndex < 0) {
        return current;
      }

      const nextOrder = [...visibleOrder];
      const [moved] = nextOrder.splice(sourceIndex, 1);
      const adjustedTargetIndex = nextOrder.findIndex((item) => item.id === targetId);
      const insertIndex = placement === "after" ? adjustedTargetIndex + 1 : adjustedTargetIndex;
      nextOrder.splice(insertIndex, 0, moved);

      return nextOrder.reverse();
    });

    setSelectedId(sourceId);
  };

  const moveLayerToPosition = (layerId: string, oneBasedPosition: number) => {
    setElements((current) => {
      const visibleOrder = [...current].reverse();
      const sourceIndex = visibleOrder.findIndex((item) => item.id === layerId);
      if (sourceIndex < 0) {
        return current;
      }

      const boundedPosition = Math.max(1, Math.min(visibleOrder.length, oneBasedPosition));
      const targetIndex = boundedPosition - 1;
      const nextOrder = [...visibleOrder];
      const [moved] = nextOrder.splice(sourceIndex, 1);
      nextOrder.splice(targetIndex, 0, moved);

      return nextOrder.reverse();
    });

    setSelectedId(layerId);
  };

  const toggleElementVisibility = (id: string) => {
    updateElement(id, (current) => ({ ...current, visible: !current.visible }));
  };

  const toggleElementLock = (id: string) => {
    updateElement(id, (current) => ({ ...current, locked: !current.locked }));
  };

  const updateStrokePoints = (id: string, nextPoints: StrokeElement["points"]) => {
    updateElement(id, (current) => {
      if (!isStrokeElement(current)) {
        return current;
      }

      return { ...current, points: nextPoints };
    });
  };

  const renderCustomHead = (
    markerId: string,
    type: ArrowHeadType,
    x: number,
    y: number,
    direction: { x: number; y: number },
    stroke: string,
    strokeWidth: number,
  ) => {
    if (type === "none" || type === "triangle") {
      return null;
    }

    const size = markerSize(strokeWidth);
    const angle = lineAngleDegrees(direction);

    if (type === "circle") {
      return <Circle key={markerId} x={x} y={y} radius={size * 0.38} fill={stroke} listening={false} />;
    }

    if (type === "square") {
      return (
        <Rect
          key={markerId}
          x={x}
          y={y}
          width={size * 0.7}
          height={size * 0.7}
          offsetX={(size * 0.7) / 2}
          offsetY={(size * 0.7) / 2}
          fill={stroke}
          rotation={angle}
          listening={false}
        />
      );
    }

    return (
      <Line
        key={markerId}
        x={x}
        y={y}
        points={[-size * 0.45, 0, size * 0.45, 0]}
        stroke={stroke}
        strokeWidth={Math.max(2, strokeWidth * 0.8)}
        rotation={angle + 90}
        lineCap="round"
        listening={false}
      />
    );
  };

  const renderElement = (element: EditorElement) => {
    if (!element.visible) {
      return null;
    }

    const commonProps = {
      x: element.x,
      y: element.y,
      rotation: element.rotation,
      scaleX: element.scaleX,
      scaleY: element.scaleY,
      draggable: !element.locked,
      onClick: () => setSelectedId(element.id),
      onTap: () => setSelectedId(element.id),
      onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) => {
        if (element.locked) {
          return;
        }
        const node = event.target;
        updateElement(element.id, (current) => ({ ...current, x: node.x(), y: node.y() }));
      },
      onTransformEnd: (event: Konva.KonvaEventObject<Event>) => {
        if (element.locked) {
          return;
        }
        const node = event.target;
        updateElement(element.id, (current) => ({
          ...current,
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          scaleX: node.scaleX(),
          scaleY: node.scaleY(),
        }));
      },
    };

    if (element.kind === "asset") {
      return (
        <CanvasImageShape
          key={element.id}
          shapeRef={(node) => {
            nodeRefs.current[element.id] = node;
          }}
          src={element.src}
          width={element.width}
          height={element.height}
          {...commonProps}
        />
      );
    }

    if (element.kind === "text") {
      return (
        <Text
          key={element.id}
          ref={(node) => {
            nodeRefs.current[element.id] = node;
          }}
          text={element.text}
          width={element.width}
          fontSize={element.fontSize}
          fontFamily={element.fontFamily}
          fill={element.fill}
          padding={8}
          {...commonProps}
        />
      );
    }

    if (element.kind === "arrow") {
      const geometry = buildCurvePoints(element.points, element.curveStrength);
      const dash = toDash(element.pattern);
      const hasStartTriangle = element.startHead === "triangle";
      const hasEndTriangle = element.endHead === "triangle";

      return (
        <Fragment key={element.id}>
          <Arrow
            key={element.id}
            ref={(node) => {
              nodeRefs.current[element.id] = node;
            }}
            points={geometry.points}
            stroke={element.stroke}
            fill={element.stroke}
            strokeWidth={element.strokeWidth}
            dash={dash}
            pointerLength={markerSize(element.strokeWidth)}
            pointerWidth={markerSize(element.strokeWidth) * 0.7}
            pointerAtBeginning={hasStartTriangle}
            pointerAtEnding={hasEndTriangle}
            lineCap="round"
            lineJoin="round"
            {...commonProps}
          />

          {renderCustomHead(
            `${element.id}-start-custom`,
            element.startHead,
            geometry.start.x + element.x,
            geometry.start.y + element.y,
            geometry.startDirection,
            element.stroke,
            element.strokeWidth,
          )}

          {renderCustomHead(
            `${element.id}-end-custom`,
            element.endHead,
            geometry.end.x + element.x,
            geometry.end.y + element.y,
            geometry.endDirection,
            element.stroke,
            element.strokeWidth,
          )}

          {selectedId === element.id ? (
            <>
              <Circle
                x={geometry.start.x + element.x}
                y={geometry.start.y + element.y}
                radius={8}
                fill="#c7f703"
                stroke="#0f172a"
                strokeWidth={2}
                draggable={!element.locked}
                onDragMove={(event) => {
                  if (element.locked) {
                    return;
                  }
                  const nextX = event.target.x() - element.x;
                  const nextY = event.target.y() - element.y;
                  updateStrokePoints(element.id, [nextX, nextY, element.points[2], element.points[3], element.points[4], element.points[5]]);
                }}
              />
              <Circle
                x={geometry.end.x + element.x}
                y={geometry.end.y + element.y}
                radius={8}
                fill="#c7f703"
                stroke="#0f172a"
                strokeWidth={2}
                draggable={!element.locked}
                onDragMove={(event) => {
                  if (element.locked) {
                    return;
                  }
                  const nextX = event.target.x() - element.x;
                  const nextY = event.target.y() - element.y;
                  updateStrokePoints(element.id, [element.points[0], element.points[1], element.points[2], element.points[3], nextX, nextY]);
                }}
              />
              <Circle
                x={geometry.curveHandle.x + element.x}
                y={geometry.curveHandle.y + element.y}
                radius={7}
                fill="#38bdf8"
                stroke="#0f172a"
                strokeWidth={2}
                draggable={!element.locked}
                onDragMove={(event) => {
                  if (element.locked) {
                    return;
                  }
                  const nextX = event.target.x() - element.x;
                  const nextY = event.target.y() - element.y;
                  const startX = element.points[0];
                  const startY = element.points[1];
                  const endX = element.points[4];
                  const endY = element.points[5];
                  const midX = (startX + endX) / 2;
                  const midY = (startY + endY) / 2;
                  const strength = Math.max(element.curveStrength, 0.01);
                  const blendedControlX = 2 * nextX - midX;
                  const blendedControlY = 2 * nextY - midY;
                  const rawControlX = midX + (blendedControlX - midX) / strength;
                  const rawControlY = midY + (blendedControlY - midY) / strength;

                  updateStrokePoints(element.id, [startX, startY, rawControlX, rawControlY, endX, endY]);
                }}
              />
            </>
          ) : null}
        </Fragment>
      );
    }

    if (element.kind === "line" || element.kind === "draw") {
      const geometry = buildCurvePoints(element.points, element.curveStrength);
      const dash = toDash(element.pattern);

      return (
        <>
          <Line
            key={element.id}
            ref={(node) => {
              nodeRefs.current[element.id] = node;
            }}
            points={geometry.points}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
            dash={dash}
            lineCap="round"
            lineJoin="round"
            {...commonProps}
          />

          {renderCustomHead(
            `${element.id}-start-custom`,
            element.startHead,
            geometry.start.x + element.x,
            geometry.start.y + element.y,
            geometry.startDirection,
            element.stroke,
            element.strokeWidth,
          )}

          {renderCustomHead(
            `${element.id}-end-custom`,
            element.endHead,
            geometry.end.x + element.x,
            geometry.end.y + element.y,
            geometry.endDirection,
            element.stroke,
            element.strokeWidth,
          )}

          {selectedId === element.id ? (
            <>
              <Circle
                x={geometry.start.x + element.x}
                y={geometry.start.y + element.y}
                radius={8}
                fill="#c7f703"
                stroke="#0f172a"
                strokeWidth={2}
                draggable={!element.locked}
                onDragMove={(event) => {
                  if (element.locked) {
                    return;
                  }
                  const nextX = event.target.x() - element.x;
                  const nextY = event.target.y() - element.y;
                  updateStrokePoints(element.id, [nextX, nextY, element.points[2], element.points[3], element.points[4], element.points[5]]);
                }}
              />
              <Circle
                x={geometry.end.x + element.x}
                y={geometry.end.y + element.y}
                radius={8}
                fill="#c7f703"
                stroke="#0f172a"
                strokeWidth={2}
                draggable={!element.locked}
                onDragMove={(event) => {
                  if (element.locked) {
                    return;
                  }
                  const nextX = event.target.x() - element.x;
                  const nextY = event.target.y() - element.y;
                  updateStrokePoints(element.id, [element.points[0], element.points[1], element.points[2], element.points[3], nextX, nextY]);
                }}
              />
              <Circle
                x={geometry.curveHandle.x + element.x}
                y={geometry.curveHandle.y + element.y}
                radius={7}
                fill="#38bdf8"
                stroke="#0f172a"
                strokeWidth={2}
                draggable={!element.locked}
                onDragMove={(event) => {
                  if (element.locked) {
                    return;
                  }
                  const nextX = event.target.x() - element.x;
                  const nextY = event.target.y() - element.y;
                  const startX = element.points[0];
                  const startY = element.points[1];
                  const endX = element.points[4];
                  const endY = element.points[5];
                  const midX = (startX + endX) / 2;
                  const midY = (startY + endY) / 2;
                  const strength = Math.max(element.curveStrength, 0.01);
                  const blendedControlX = 2 * nextX - midX;
                  const blendedControlY = 2 * nextY - midY;
                  const rawControlX = midX + (blendedControlX - midX) / strength;
                  const rawControlY = midY + (blendedControlY - midY) / strength;

                  updateStrokePoints(element.id, [startX, startY, rawControlX, rawControlY, endX, endY]);
                }}
              />
            </>
          ) : null}
        </>
      );
    }

    if (element.kind === "rect") {
      return (
        <Rect
          key={element.id}
          ref={(node) => {
            nodeRefs.current[element.id] = node;
          }}
          width={element.width}
          height={element.height}
          stroke={element.stroke}
          strokeWidth={element.strokeWidth}
          fill={element.fill}
          dash={element.dash}
          opacity={element.opacity}
          cornerRadius={element.cornerRadius}
          {...commonProps}
        />
      );
    }

    if (element.kind === "circle") {
      return (
        <Circle
          key={element.id}
          ref={(node) => {
            nodeRefs.current[element.id] = node;
          }}
          radius={element.radius}
          stroke={element.stroke}
          strokeWidth={element.strokeWidth}
          fill={element.fill}
          dash={element.dash}
          opacity={element.opacity}
          {...commonProps}
        />
      );
    }

    return null;
  };

  const renderRailIcon = (panelId: ToolPanel) => {
    if (panelId === "elements") {
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="4" width="6" height="6" rx="1" />
          <rect x="14" y="4" width="6" height="6" rx="1" />
          <rect x="4" y="14" width="6" height="6" rx="1" />
          <path d="M14 17h6" />
        </svg>
      );
    }

    if (panelId === "text") {
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 6h16" />
          <path d="M12 6v12" />
          <path d="M8 18h8" />
        </svg>
      );
    }

    if (panelId === "backgrounds") {
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="8" cy="9" r="1.5" />
          <path d="m5 17 4-4 3 3 3-2 4 3" />
        </svg>
      );
    }

    if (panelId === "ai") {
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3l1.5 3.5L17 8l-3.5 1.5L12 13l-1.5-3.5L7 8l3.5-1.5L12 3z" />
          <path d="M19 13l.9 2.1L22 16l-2.1.9L19 19l-.9-2.1L16 16l2.1-.9L19 13z" />
          <path d="M6 14l1.2 2.8L10 18l-2.8 1.2L6 22l-1.2-2.8L2 18l2.8-1.2L6 14z" />
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="5" y="4" width="14" height="4" rx="1" />
        <rect x="5" y="10" width="14" height="4" rx="1" />
        <rect x="5" y="16" width="14" height="4" rx="1" />
      </svg>
    );
  };

  const renderedStageWidth = Math.round(FIXED_STAGE_WIDTH * stageScale);
  const renderedStageHeight = Math.round(FIXED_STAGE_HEIGHT * stageScale);

  return (
    <section className="space-y-4">
      
      <div className={isMenuCollapsed ? "grid gap-4 xl:grid-cols-[72px_minmax(0,1fr)]" : "grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]"}>
        <aside className="rounded-[28px] border border-border bg-card shadow-sm">
          <div className="flex min-h-190">
            <div className="w-18 border-r border-border bg-muted/40 p-2">
              <button
                type="button"
                onClick={() => setIsMenuCollapsed((current) => !current)}
                className="mb-2 w-full rounded-xl border border-border bg-background px-2 py-2 text-xs font-medium text-foreground hover:bg-muted flex justify-center"
                title={isMenuCollapsed ? "Abrir menu" : "Colapsar menu"}
              >
                {isMenuCollapsed ? <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -12" /><path d="M9 4v16" /><path d="M14 10l2 2l-2 2" /></svg> 
                : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -12" /><path d="M9 4v16" /><path d="M15 10l-2 2l2 2" /></svg>}
              </button>

              <div className="space-y-2">
                {TOOL_PANELS.map((panel) => {
                  const active = panel.id === activePanel;

                  return (
                    <button
                      key={panel.id}
                      type="button"
                      onClick={() => {
                        setActivePanel(panel.id);
                        setIsMenuCollapsed(false);
                      }}
                      className={`group w-full rounded-xl px-2 py-3 text-center text-[11px] font-medium transition-all duration-200 ${
                        active
                          ? "bg-primary text-primary-foreground ring-2 ring-primary/40 shadow-sm scale-[1.03]"
                          : "border border-border bg-background text-foreground hover:bg-muted hover:scale-[1.02]"
                      }`}
                      title={panel.label}
                    >
                      <span className="flex items-center justify-center transition-transform duration-200 group-hover:scale-110">{renderRailIcon(panel.id)}</span>
                      <span className="sr-only">{panel.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {!isMenuCollapsed ? (
              <div className="md:flex-1 p-4 space-y-4">
                {activePanel === "backgrounds" ? (
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold text-card-foreground">Fondos de cancha</h3>
                      <p className="mt-1 text-xs text-muted-foreground">Selecciona un angulo para trabajar tareas especificas de porteros.</p>
                    </div>

                    <div className="grid max-h-105 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-1">
                      {backgrounds.map((background) => {
                        const active = background.src === backgroundSrc;

                        return (
                          <button
                            key={background.id}
                            type="button"
                            onClick={() => setBackgroundSrc(background.src)}
                            className={`overflow-hidden rounded-2xl border text-left transition ${
                              active ? "border-primary shadow-[0_0_0_2px_rgba(199,247,3,0.35)]" : "border-border hover:border-foreground/20"
                            }`}
                          >
                            <div className="relative h-24 w-full bg-muted">
                              <Image src={background.src} alt={background.name} fill sizes="(max-width: 1280px) 50vw, 280px" className="object-cover" />
                            </div>
                            <div className="px-3 py-2">
                              <p className="text-sm font-medium text-card-foreground">{background.name}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {activePanel === "text" ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-card-foreground">Textos y fuentes</h3>
                      <p className="mt-1 text-xs text-muted-foreground">Inserta consignas, numeraciones o correcciones visuales dentro del ejercicio.</p>
                    </div>

                    <label className="flex flex-col gap-2">
                      <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Texto</span>
                      <textarea
                        value={textDraft}
                        onChange={(event) => setTextDraft(event.target.value)}
                        rows={4}
                        className="rounded-2xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary"
                      />
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      <label className="flex flex-col gap-2">
                        <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Fuente</span>
                        <select
                          value={fontFamily}
                          onChange={(event) => setFontFamily(event.target.value)}
                          className="rounded-2xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary"
                        >
                          {FONT_OPTIONS.map((option) => (
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
                          max={88}
                          value={fontSize}
                          onChange={(event) => setFontSize(Number(event.target.value) || 12)}
                          className="rounded-2xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary"
                        />
                      </label>
                    </div>

                    <label className="flex flex-col gap-2">
                      <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Color</span>
                      <input
                        type="color"
                        value={fontColor}
                        onChange={(event) => setFontColor(event.target.value)}
                        className="h-11 w-full rounded-xl border border-border bg-background p-1"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={addTextElement}
                      className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:bg-secondary hover:text-secondary-foreground"
                    >
                      Insertar texto
                    </button>
                  </div>
                ) : null}

                {activePanel === "elements" ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-card-foreground">Elementos tacticos</h3>
                      <p className="mt-1 text-xs text-muted-foreground">Combina lineas, zonas y materiales reales para diseñar tareas de porteros.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => addArrowElement("solid")}
                        className="rounded-2xl border border-border bg-background px-3 py-3 text-sm text-foreground transition hover:bg-muted"
                      >
                        Flecha solida
                      </button>
                      <button
                        type="button"
                        onClick={() => addArrowElement("dashed")}
                        className="rounded-2xl border border-border bg-background px-3 py-3 text-sm text-foreground transition hover:bg-muted"
                      >
                        Flecha punteada
                      </button>
                      <button
                        type="button"
                        onClick={addLineElement}
                        className="rounded-2xl border border-border bg-background px-3 py-3 text-sm text-foreground transition hover:bg-muted"
                      >
                        Linea de pase
                      </button>
                      <button
                        type="button"
                        onClick={addRectElement}
                        className="rounded-2xl border border-border bg-background px-3 py-3 text-sm text-foreground transition hover:bg-muted"
                      >
                        Zona rectangular
                      </button>
                      <button
                        type="button"
                        onClick={addCircleElement}
                        className="rounded-2xl border border-border bg-background px-3 py-3 text-sm text-foreground transition hover:bg-muted"
                      >
                        Zona circular
                      </button>
                    </div>

                    <label className="flex flex-col gap-2">
                      <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Buscar material</span>
                      <input
                        value={assetSearch}
                        onChange={(event) => setAssetSearch(event.target.value)}
                        placeholder="Portero, cono, valla..."
                        className="rounded-2xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary"
                      />
                    </label>

                    <div className="max-h-105 space-y-4 overflow-y-auto pr-1">
                      {filteredShapeGroups.map((group) => (
                        <section key={group.id} className="space-y-2">
                          <div>
                            <p className="text-sm font-medium text-card-foreground">{group.label}</p>
                            <p className="text-xs text-muted-foreground">{CATEGORY_HINTS[group.id] ?? "Material de apoyo para la secuencia."}</p>
                          </div>

                          <div className="grid md:grid-cols-3 gap-2">
                            {group.items.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => addAssetElement(group.id, item)}
                                className="rounded-2xl border border-border bg-background p-2 transition hover:border-primary hover:bg-muted"
                                title={item.name}
                              >
                                <div className="relative flex h-16 items-center justify-center overflow-hidden rounded-xl bg-white/70">
                                  <Image src={item.src} alt={item.name} fill sizes="96px" className="object-contain p-1" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  </div>
                ) : null}

                {activePanel === "ai" ? (
                  <AiPanel
                    exerciseId={exerciseId}
                    onApply={applyGeneratedPlay}
                  />
                ) : null}

                {activePanel === "layers" ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-card-foreground">Layers</h3>
                      <p className="mt-1 text-xs text-muted-foreground">Controla visibilidad, bloqueo y orden de cada elemento.</p>
                    </div>

                    <div
                      ref={layersListRef}
                      className="max-h-105 space-y-2 overflow-y-auto pr-1"
                      onDragOver={(event) => {
                        if (!draggedLayerId) {
                          return;
                        }

                        const container = layersListRef.current;
                        if (!container) {
                          return;
                        }

                        const bounds = container.getBoundingClientRect();
                        const threshold = 28;
                        const speed = 12;

                        if (event.clientY < bounds.top + threshold) {
                          container.scrollTop -= speed;
                        } else if (event.clientY > bounds.bottom - threshold) {
                          container.scrollTop += speed;
                        }
                      }}
                    >
                      {orderedLayers.map((item, index) => {
                          const selected = item.id === selectedId;
                          const isDropTarget = dragOverLayerId === item.id && draggedLayerId !== item.id;
                          const layerPosition = index + 1;
                          const layerName = `${item.kind}-${item.id.slice(-4)}`;

                          return (
                            <div
                              key={item.id}
                              ref={(node) => {
                                layerItemRefs.current[item.id] = node;
                              }}
                              onDragOver={(event) => {
                                event.preventDefault();
                                const rect = event.currentTarget.getBoundingClientRect();
                                const pointerY = event.clientY - rect.top;
                                const placement = pointerY > rect.height / 2 ? "after" : "before";
                                setDragOverLayerId(item.id);
                                setDragOverPlacement(placement);
                              }}
                              onDragLeave={() => {
                                setDragOverLayerId(null);
                              }}
                              onDrop={(event) => {
                                event.preventDefault();
                                if (draggedLayerId) {
                                  reorderLayers(draggedLayerId, item.id, dragOverPlacement);
                                }
                                setDraggedLayerId(null);
                                setDragOverLayerId(null);
                                setDragOverPlacement("after");
                              }}
                              className={`rounded-2xl border px-3 py-2 transition ${
                                selected
                                  ? "border-primary bg-muted"
                                  : isDropTarget
                                    ? "border-primary/60 bg-primary/5"
                                    : "border-border bg-background"
                              } ${draggedLayerId === item.id ? "opacity-50" : "opacity-100"}`}
                            >
                              {isDropTarget && dragOverPlacement === "before" ? <div className="mb-2 h-1 rounded-full bg-primary/70" /> : null}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    draggable
                                    onDragStart={() => {
                                      setDraggedLayerId(item.id);
                                      setSelectedId(item.id);
                                    }}
                                    onDragEnd={() => {
                                      setDraggedLayerId(null);
                                      setDragOverLayerId(null);
                                      setDragOverPlacement("after");
                                    }}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"
                                    title="Arrastrar capa"
                                  >
                                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                                      <path d="M9 6h.01" />
                                      <path d="M9 12h.01" />
                                      <path d="M9 18h.01" />
                                      <path d="M15 6h.01" />
                                      <path d="M15 12h.01" />
                                      <path d="M15 18h.01" />
                                    </svg>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setSelectedId(item.id)}
                                    className="text-left text-sm font-medium text-foreground"
                                  >
                                    {layerName}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const raw = window.prompt(`Mover capa a posicion (1-${orderedLayers.length})`, String(layerPosition));
                                      if (!raw) {
                                        return;
                                      }

                                      const targetPosition = Number(raw);
                                      if (!Number.isFinite(targetPosition)) {
                                        return;
                                      }

                                      moveLayerToPosition(item.id, targetPosition);
                                    }}
                                    className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground hover:bg-muted"
                                    title="Mover esta capa a una posicion especifica"
                                  >
                                    #{layerPosition}
                                  </button>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => toggleElementVisibility(item.id)}
                                    className="rounded-md border border-border px-2 py-1 text-[11px] text-foreground hover:bg-muted"
                                    title={item.visible ? "Ocultar" : "Mostrar"}
                                  >
                                    {item.visible ? "Ver" : "Off"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => toggleElementLock(item.id)}
                                    className="rounded-md border border-border px-2 py-1 text-[11px] text-foreground hover:bg-muted"
                                    title={item.locked ? "Desbloquear" : "Bloquear"}
                                  >
                                    {item.locked ? "Lock" : "Free"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => bringElementToFront(item.id)}
                                    className="rounded-md border border-border px-2 py-1 text-[11px] text-foreground hover:bg-muted"
                                    title="Traer al frente"
                                  >
                                    Front
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => sendElementToBack(item.id)}
                                    className="rounded-md border border-border px-2 py-1 text-[11px] text-foreground hover:bg-muted"
                                    title="Enviar atras"
                                  >
                                    Back
                                  </button>
                                </div>
                              </div>
                              {isDropTarget && dragOverPlacement === "after" ? <div className="mt-2 h-1 rounded-full bg-primary/70" /> : null}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : null}

                
              </div>
            ) : null}
          </div>
        </aside>

        <div className="space-y-3">
          <div className="rounded-[28px] border border-border bg-card p-3 shadow-sm space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {exerciseId ? (
                  <span className="rounded-full bg-primary/15 text-primary px-3 py-1 font-medium">Diseño vinculado al ejercicio</span>
                ) : null}
                <span className="rounded-full bg-muted px-3 py-1">Fondo: {backgrounds.find((item) => item.src === backgroundSrc)?.name ?? "Sin fondo"}</span>
                <span className="rounded-full bg-muted px-3 py-1">Elementos: {elements.length}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => selectedId && bringElementToFront(selectedId)}
                disabled={!selectedId}
                className="rounded-full border border-border px-4 py-2 text-sm text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                Traer al frente
              </button>
              <button
                type="button"
                onClick={() => selectedId && sendElementToBack(selectedId)}
                disabled={!selectedId}
                className="rounded-full border border-border px-4 py-2 text-sm text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                Enviar atras
              </button>
              <button
                type="button"
                onClick={deleteSelected}
                disabled={!selectedId}
                className="rounded-full border border-border px-4 py-2 text-sm text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                Eliminar seleccionado
              </button>
              <button
                type="button"
                onClick={clearBoard}
                className="rounded-full border border-border px-4 py-2 text-sm text-foreground transition hover:bg-muted"
              >
                Limpiar lienzo
              </button>
              <button
                type="button"
                onClick={exportAsPng}
                className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:bg-secondary hover:text-secondary-foreground"
              >
                Exportar PNG
              </button>
            </div>            
          </div>
          <div ref={containerRef} className="relative w-full">           
            <div className="flex w-full justify-center overflow-hidden">
              <Stage
                ref={(node) => {
                  stageRef.current = node;
                }}
                width={renderedStageWidth}
                height={renderedStageHeight}
                scaleX={stageScale}
                scaleY={stageScale}
                onClick={handleStageClick}
                onTap={handleStageClick}
              >
                <Layer>
                  {backgroundSrc ? (
                    <CanvasImageShape
                      src={backgroundSrc}
                      x={0}
                      y={0}
                      width={FIXED_STAGE_WIDTH}
                      height={FIXED_STAGE_HEIGHT}
                      rotation={0}
                      scaleX={1}
                      scaleY={1}
                      listening={false}
                      name="editor-background"
                      opacity={0.96}
                    />
                  ) : null}

                  <Rect x={0} y={0} width={FIXED_STAGE_WIDTH} height={FIXED_STAGE_HEIGHT} stroke="rgba(15,23,42,0.16)" strokeWidth={2} listening={false}/>

                  {elements.map((element) => renderElement(element))}

                  <Transformer
                    ref={(node) => {
                      transformerRef.current = node;
                    }}
                    rotateEnabled
                    borderStroke="#c7f703"
                    borderDash={[6, 4]}
                    anchorFill="#c7f703"
                    anchorStroke="#0f172a"
                    anchorSize={10}
                    enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
                  />
                </Layer>
              </Stage>
            </div>
          </div>
          <SelectedElementPanel selectedElement={selectedElement} fontOptions={FONT_OPTIONS} onDelete={deleteSelected} onBringToFront={bringElementToFront} onSendToBack={sendElementToBack} onToggleVisibility={toggleElementVisibility} onToggleLock={toggleElementLock} onUpdateElement={updateElement} />
        </div>
      </div>
    </section>
  );
}