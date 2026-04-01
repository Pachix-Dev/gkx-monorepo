"use client";

import { useMutation } from "@tanstack/react-query";
import {
  generateTacticalPlay,
  type GeneratePlayInput,
  type GeneratePlayResponse,
} from "@/lib/api/exercises-tactical";

export type { GeneratePlayInput, GeneratePlayResponse };

/**
 * Mutation para generar una jugada táctica con IA.
 *
 * Uso:
 *   const mutation = useGeneratePlayMutation(exerciseId);
 *   const result = await mutation.mutateAsync({ prompt, mode, category, goalkeepersCount });
 *
 * El resultado contiene:
 *   - elements: EditorElement[] listos para setElements() en el store
 *   - backgroundSrc: src del fondo sugerido (asignar con setBackgroundSrc si mode="replace")
 *   - summary: descripción técnica en español
 *   - warnings: alertas de normalización (assets no encontrados, etc.)
 */
export function useGeneratePlayMutation(exerciseId: string | undefined) {
  return useMutation<
    GeneratePlayResponse,
    Error,
    GeneratePlayInput
  >({
    mutationFn: (input: GeneratePlayInput) => {
      if (!exerciseId) {
        return Promise.reject(new Error("exerciseId requerido para generar jugada"));
      }
      return generateTacticalPlay(exerciseId, input);
    },
  });
}
