"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  useTacticalDesignQuery,
  useUpdateTacticalDesignMutation,
} from "./use-tactical-design";
import { uploadTacticalPreview } from "@/lib/api/exercises-tactical";

interface EditorState {
  elements: Array<Record<string, unknown>>;
  backgroundSrc?: string | null;
}

export function useTacticalDesignSync(
  exerciseId: string | undefined,
  getCurrentState: () => EditorState,
  getPreviewBlob?: () => Promise<Blob | null>
) {
  const { data: remoteDesign, isLoading: isLoadingRemote } =
    useTacticalDesignQuery(exerciseId);
  const updateMutation = useUpdateTacticalDesignMutation();

  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedStateRef = useRef<EditorState | null>(null);
  const hasLoadedRemoteRef = useRef(false);

  const saveState = useCallback(
    async () => {
      if (!exerciseId) return;

      const currentState = getCurrentState();

      // Avoid saving if nothing changed
      if (
        lastSavedStateRef.current &&
        JSON.stringify(lastSavedStateRef.current) ===
          JSON.stringify(currentState)
      ) {
        return;
      }

      lastSavedStateRef.current = currentState;

      let previewUrl: string | null | undefined;
      if (getPreviewBlob) {
        const previewBlob = await getPreviewBlob();
        if (previewBlob) {
          const preview = await uploadTacticalPreview(exerciseId, previewBlob);
          previewUrl = preview.previewUrl;
        }
      }

      await updateMutation.mutateAsync({
        exerciseId,
        payload: {
          state: currentState,
          previewUrl,
        },
      });
    },
    [exerciseId, updateMutation, getCurrentState, getPreviewBlob]
  );

  const debouncedSave = useCallback(
    () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        void saveState();
      }, 3000); // 3 second debounce
    },
    [saveState]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Note: Remote design is loaded but not automatically applied
  // The parent component handles loading via useEffect in TacticalEditorClientContent
  useEffect(() => {
    if (remoteDesign?.state && !hasLoadedRemoteRef.current && !isLoadingRemote) {
      hasLoadedRemoteRef.current = true;
    }
  }, [remoteDesign, isLoadingRemote]);

  return {
    remoteDesign,
    isLoadingRemote,
    isSaving: updateMutation.isPending,
    debouncedSave,
  };
}
