import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

interface SaveTacticalPreviewParams {
  tenantId: string;
  exerciseId: string;
  mimeType: string;
  buffer: Buffer;
}

@Injectable()
export class TacticalPreviewStorageService {
  async saveTacticalPreview(
    params: SaveTacticalPreviewParams,
  ): Promise<string> {
    const extension = this.resolveExtension(params.mimeType);
    // Keep a stable filename per exercise to avoid leaving stale preview files.
    const filename = `preview${extension}`;
    const relativePath = this.toPosixPath([
      'tactical-previews',
      params.tenantId,
      params.exerciseId,
      filename,
    ]);

    const uploadsRoot = resolve(
      process.cwd(),
      process.env.LOCAL_UPLOADS_DIR ?? 'uploads',
    );
    const absolutePath = resolve(uploadsRoot, relativePath);

    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, params.buffer);

    const publicPath = `/uploads/${relativePath}`;
    const configuredBaseUrl = process.env.PUBLIC_API_URL?.trim();
    if (!configuredBaseUrl) {
      return publicPath;
    }

    const normalizedBaseUrl = configuredBaseUrl.replace(/\/+$/, '');
    return `${normalizedBaseUrl}${publicPath}`;
  }

  private resolveExtension(mimeType: string) {
    if (mimeType === 'image/webp') return '.webp';
    if (mimeType === 'image/png') return '.png';
    if (mimeType === 'image/jpeg') return '.jpg';
    return '.bin';
  }

  private toPosixPath(parts: string[]) {
    return parts.join('/').replace(/\\/g, '/');
  }
}
