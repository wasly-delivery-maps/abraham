import { ENV } from './_core/env';
import fs from 'fs';
import path from 'path';

type StorageConfig = { baseUrl: string; apiKey: string };

function getStorageConfig(): StorageConfig | null {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;

  if (!baseUrl || !apiKey) {
    return null;
  }

  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

function buildUploadUrl(baseUrl: string, relKey: string): URL {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}

async function buildDownloadUrl(
  baseUrl: string,
  relKey: string,
  apiKey: string
): Promise<string> {
  const downloadApiUrl = new URL(
    "v1/storage/downloadUrl",
    ensureTrailingSlash(baseUrl)
  );
  downloadApiUrl.searchParams.set("path", normalizeKey(relKey));
  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey),
  });
  return (await response.json()).url;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function toFormData(
  data: Buffer | Uint8Array | string,
  contentType: string,
  fileName: string
): FormData {
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}

function buildAuthHeaders(apiKey: string): HeadersInit {
  return { Authorization: `Bearer ${apiKey}` };
}

/**
 * Saves a file either to remote storage (if configured) or to the local filesystem.
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const config = getStorageConfig();
  
  // If remote storage is NOT configured, use local filesystem storage
  if (!config) {
    console.log("[Storage] Remote storage not configured, using local filesystem storage");
    
    const uploadsDir = path.resolve(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const key = normalizeKey(relKey);
    const filePath = path.join(uploadsDir, key);
    const fileDir = path.dirname(filePath);
    
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }

    let buffer: Buffer;
    if (typeof data === "string") {
      // Handle base64 string (strip prefix if present)
      const base64Data = data.includes('base64,') ? data.split('base64,')[1] : data;
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      buffer = Buffer.from(data as any);
    }

    fs.writeFileSync(filePath, buffer);
    
    // Construct the public URL
    // In production on Railway, we use the host from the request or environment
    // For now, we return a relative path which Express will serve
    const url = `/uploads/${key}`;
    console.log(`[Storage] File saved locally: ${url}`);
    return { key, url };
  }

  // Remote storage logic (Forge API)
  const { baseUrl, apiKey } = config;
  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  
  try {
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: buildAuthHeaders(apiKey),
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Remote upload failed: ${response.statusText}`);
    }
    
    const url = (await response.json()).url;
    return { key, url };
  } catch (error) {
    console.error("[Storage] Remote upload failed, falling back to local storage:", error);
    // Recursive call but we'd need to force local. Let's just do local logic here.
    return storagePutLocal(relKey, data);
  }
}

async function storagePutLocal(relKey: string, data: Buffer | Uint8Array | string): Promise<{ key: string; url: string }> {
  const uploadsDir = path.resolve(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const key = normalizeKey(relKey);
  const filePath = path.join(uploadsDir, key);
  const fileDir = path.dirname(filePath);
  if (!fs.existsSync(fileDir)) fs.mkdirSync(fileDir, { recursive: true });

  let buffer: Buffer;
  if (typeof data === "string") {
    const base64Data = data.includes('base64,') ? data.split('base64,')[1] : data;
    buffer = Buffer.from(base64Data, 'base64');
  } else {
    buffer = Buffer.from(data as any);
  }

  fs.writeFileSync(filePath, buffer);
  return { key, url: `/uploads/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string; }> {
  // If it's already a full URL or data URL, return it
  if (relKey.startsWith("http") || relKey.startsWith("data:") || relKey.startsWith("/")) {
    return { key: relKey, url: relKey };
  }

  const config = getStorageConfig();
  if (!config) {
    // If no remote config, assume it's a local file
    return { key: relKey, url: `/uploads/${normalizeKey(relKey)}` };
  }

  const { baseUrl, apiKey } = config;
  const key = normalizeKey(relKey);
  try {
    return {
      key,
      url: await buildDownloadUrl(baseUrl, key, apiKey),
    };
  } catch (error) {
    return { key, url: `/uploads/${key}` };
  }
}
