"use client";

import { createContext, useContext } from "react";
import { FONT_OPTIONS } from "./constants";
import type { EditorElement, ToolPanel } from "./types";
import { create, useStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type StateUpdater<T> = T | ((current: T) => T);

function resolveStateUpdate<T>(updater: StateUpdater<T>, current: T): T {
  return typeof updater === "function" ? (updater as (value: T) => T)(current) : updater;
}

type TacticalEditorStore = {
  activePanel: ToolPanel;
  isMenuCollapsed: boolean;
  backgroundSrc: string;
  elements: EditorElement[];
  textDraft: string;
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  setActivePanel: (next: StateUpdater<ToolPanel>) => void;
  setIsMenuCollapsed: (next: StateUpdater<boolean>) => void;
  setBackgroundSrc: (next: StateUpdater<string>) => void;
  setElements: (next: StateUpdater<EditorElement[]>) => void;
  setTextDraft: (next: StateUpdater<string>) => void;
  setFontFamily: (next: StateUpdater<string>) => void;
  setFontSize: (next: StateUpdater<number>) => void;
  setFontColor: (next: StateUpdater<string>) => void;
};

const initialState = {
  activePanel: "elements" as ToolPanel,
  isMenuCollapsed: false,
  backgroundSrc: "",
  elements: [] as EditorElement[],
  textDraft: "Bloqueo frontal",
  fontFamily: FONT_OPTIONS[0] ?? "sans-serif",
  fontSize: 26,
  fontColor: "#ffffff",
};

export function buildEditorStore(storageName: string) {
  return create<TacticalEditorStore>()(
    persist(
      (set) => ({
        ...initialState,
        setActivePanel: (next) => {
          set((current) => ({ activePanel: resolveStateUpdate(next, current.activePanel) }));
        },
        setIsMenuCollapsed: (next) => {
          set((current) => ({ isMenuCollapsed: resolveStateUpdate(next, current.isMenuCollapsed) }));
        },
        setBackgroundSrc: (next) => {
          set((current) => ({ backgroundSrc: resolveStateUpdate(next, current.backgroundSrc) }));
        },
        setElements: (next) => {
          set((current) => ({ elements: resolveStateUpdate(next, current.elements) }));
        },
        setTextDraft: (next) => {
          set((current) => ({ textDraft: resolveStateUpdate(next, current.textDraft) }));
        },
        setFontFamily: (next) => {
          set((current) => ({ fontFamily: resolveStateUpdate(next, current.fontFamily) }));
        },
        setFontSize: (next) => {
          set((current) => ({ fontSize: resolveStateUpdate(next, current.fontSize) }));
        },
        setFontColor: (next) => {
          set((current) => ({ fontColor: resolveStateUpdate(next, current.fontColor) }));
        },
      }),
      {
        name: storageName,
        version: 1,
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          activePanel: state.activePanel,
          isMenuCollapsed: state.isMenuCollapsed,
          backgroundSrc: state.backgroundSrc,
          elements: state.elements,
          textDraft: state.textDraft,
          fontFamily: state.fontFamily,
          fontSize: state.fontSize,
          fontColor: state.fontColor,
        }),
      },
    ),
  );
}

export type TacticalEditorStoreApi = ReturnType<typeof buildEditorStore>;

export const TacticalEditorStoreContext = createContext<TacticalEditorStoreApi | null>(null);

export function useTacticalEditorStore<T>(selector: (state: TacticalEditorStore) => T): T {
  const store = useContext(TacticalEditorStoreContext);
  if (!store) {
    throw new Error("useTacticalEditorStore must be used within TacticalEditorStoreContext.Provider");
  }
  return useStore(store, selector);
}
