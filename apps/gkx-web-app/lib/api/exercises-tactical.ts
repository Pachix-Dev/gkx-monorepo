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
