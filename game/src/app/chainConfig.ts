export const DEFAULT_CHAIN_BRIDGE_URL =
  "https://gleanings-production.up.railway.app";

export function resolveChainOrigin(
  configuredUrl: string | undefined,
  isDevelopment: boolean
): string {
  const normalizedUrl = configuredUrl?.trim().replace(/\/+$/, "");
  if (normalizedUrl) return normalizedUrl;

  // Local development uses Vite's same-origin proxy so the browser does not
  // require localhost to be present in the deployed bridge's CORS allowlist.
  return isDevelopment ? "" : DEFAULT_CHAIN_BRIDGE_URL;
}
