/**
 * Central configuration for the application.
 * All URLs are sourced from environment variables — no hardcoded hosts.
 */

// Centralized Backend URL (supports both NEXT_PUBLIC_BACKEND_URL and legacy NEXT_PUBLIC_API_URL)
export const BACKEND_URL = (
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ''
).replace(/\/$/, "");

// MCP Server URL (server-side only — not prefixed with NEXT_PUBLIC_)
export const MCP_SERVER_URL = (
    process.env.MCP_SERVER_URL || ''
).replace(/\/$/, "");

// Helper to construct API endpoints
export const getApiUrl = (path: string) => `${BACKEND_URL}${path.startsWith('/') ? '' : '/'}${path}`;
