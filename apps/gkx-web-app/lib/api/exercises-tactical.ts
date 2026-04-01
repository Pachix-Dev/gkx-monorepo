import { apiRequest } from "@/lib/api/client";
import { extractData } from "@/lib/api/response";

export type TacticalDesignState = {
  elements: Array<Record<string, unknown>>;
  backgroundSrc?: string | null;
};

export type TacticalDesignResponse = {
  exerciseId: string;
  state: TacticalDesignState | null;
  stateVersion: number | null;
  previewUrl: string | null;
  updatedAt: string | null;
};

export type UpdateTacticalDesignInput = {
  state: TacticalDesignState;
  previewUrl?: string | null;
};

export async function getTacticalDesign(exerciseId: string) {
  const payload = await apiRequest<unknown>(
    `/exercises/${exerciseId}/tactical`,
    {
      method: "GET",
      auth: true,
    }
  );

  return extractData<TacticalDesignResponse>(payload);
}

export async function updateTacticalDesign(
  exerciseId: string,
  input: UpdateTacticalDesignInput
) {
  const payload = await apiRequest<unknown>(
    `/exercises/${exerciseId}/tactical`,
    {
      method: "PUT",
      auth: true,
      body: input,
    }
  );

  return extractData<TacticalDesignResponse>(payload);
}

// ─── Play generation ──────────────────────────────────────────────────────────

export type GeneratePlayMode = "replace" | "append";

export type GeneratePlayInput = {
  prompt: string;
  mode?: GeneratePlayMode;
  category?: string;
  goalkeepersCount?: number;
  backgroundId?: string;
};

export type GeneratePlayResponse = {
  backgroundId: string | null;
  backgroundSrc: string | null;
  elements: Array<Record<string, unknown>>;
  summary: string;
  warnings: string[];
};

export async function generateTacticalPlay(
  exerciseId: string,
  input: GeneratePlayInput,
): Promise<GeneratePlayResponse> {
  const payload = await apiRequest<unknown>(
    `/exercises/${exerciseId}/tactical/generate-openrouter`,
    {
      method: "POST",
      auth: true,
      body: input,
    },
  );

  return extractData<GeneratePlayResponse>(payload);
}

export async function uploadTacticalPreview(
  exerciseId: string,
  file: Blob
) {
  const body = new FormData();
  body.append("file", file, `tactical-preview-${exerciseId}.png`);

  const payload = await apiRequest<unknown>(
    `/exercises/${exerciseId}/tactical-preview`,
    {
      method: "PUT",
      auth: true,
      body,
    }
  );

  return extractData<TacticalDesignResponse>(payload);
}
