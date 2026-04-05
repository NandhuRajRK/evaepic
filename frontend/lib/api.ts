const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  ? trimTrailingSlash(process.env.NEXT_PUBLIC_API_BASE_URL)
  : null;

export const API_BASE_URL =
  configuredBaseUrl ??
  (process.env.NODE_ENV === "development" ? "http://127.0.0.1:8000" : "/api");

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
