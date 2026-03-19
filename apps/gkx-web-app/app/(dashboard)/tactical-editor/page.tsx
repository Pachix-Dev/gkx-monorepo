import { TacticalEditorClient } from "@/features/tactical-editor/components/tactical-editor-client";
import { getEditorBackgrounds, getEditorShapeGroups } from "@/features/tactical-editor/server/get-editor-assets";

export default async function TacticalEditorPage() {
  const [backgrounds, shapeGroups] = await Promise.all([getEditorBackgrounds(), getEditorShapeGroups()]);

  return <TacticalEditorClient backgrounds={backgrounds} shapeGroups={shapeGroups} />;
}