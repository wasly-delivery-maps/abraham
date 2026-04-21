// Preconfigured storage helpers for Manus WebDev templates
// Uses the Biz-provided storage proxy if available, otherwise falls back to Base64 data URLs
import { ENV } from './_core/env';

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

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const config = getStorageConfig();
  
  // Fallback to Base64 if storage proxy is not configured
  if (!config) {
    console.log("[Storage] Storage proxy not configured, falling back to Base64 data URL");
    let base64: string;
    if (typeof data === "string") {
      // If it's already a base64 string (from the client), use it directly
      base64 = data;
    } else {
      base64 = Buffer.from(data as any).toString("base64");
    }
    
    // Ensure we don't have double data: prefix if it was already a data URL
    const url = base64.startsWith('data:') ? base64 : `data:${contentType};base64,${base64}`;
    return { key: relKey, url };
  }

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
      const message = await response.text().catch(() => response.statusText);
      console.warn(`[Storage] Remote upload failed (${response.status}), falling back to Base64: ${message}`);
      
      // Fallback to Base64 on remote failure
      let base64: string;
      if (typeof data === "string") {
        base64 = data;
      } else {
        base64 = Buffer.from(data as any).toString("base64");
      }
      const url = base64.startsWith('data:') ? base64 : `data:${contentType};base64,${base64}`;
      return { key: relKey, url };
    }
    
    const url = (await response.json()).url;
    return { key, url };
  } catch (error) {
    console.error("[Storage] Error during remote upload, falling back to Base64:", error);
    let base64: string;
    if (typeof data === "string") {
      base64 = data;
    } else {
      base64 = Buffer.from(data as any).toString("base64");
    }
    const url = base64.startsWith('data:') ? base64 : `data:${contentType};base64,${base64}`;
    return { key: relKey, url };
  }
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string; }> {
  // If it's a data URL, return it directly
  if (relKey.startsWith("data:")) {
    return { key: "base64", url: relKey };
  }

  const config = getStorageConfig();
  if (!config) {
    // If it's not a data URL and no config, we can't do much but return the key as URL
    // This might happen if a remote URL was stored but config was later removed
    return { key: relKey, url: relKey };
  }

  const { baseUrl, apiKey } = config;
  const key = normalizeKey(relKey);
  try {
    return {
      key,
      url: await buildDownloadUrl(baseUrl, key, apiKey),
    };
  } catch (error) {
    console.error("[Storage] Error getting download URL:", error);
    return { key, url: key };
  }
}
