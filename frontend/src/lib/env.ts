const DEFAULT_BACKEND_ORIGIN = "http://localhost:8000";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const configuredOrigin = trimTrailingSlash(import.meta.env.VITE_BACKEND_ORIGIN || DEFAULT_BACKEND_ORIGIN);

export const BACKEND_ORIGIN = configuredOrigin;
export const API_BASE_URL = trimTrailingSlash(import.meta.env.VITE_API_URL || `${configuredOrigin}/api/v1`);
export const WS_BASE_URL = trimTrailingSlash(import.meta.env.VITE_WS_URL || configuredOrigin.replace(/^http/i, "ws"));

export const buildApiUrl = (path: string) => `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
export const buildBrainWsUrl = (userId: string) => `${WS_BASE_URL}/ws/brain/${userId}`;
