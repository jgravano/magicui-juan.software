export function encodePreset(config: Record<string, unknown>): string;
export function decodePreset(value: unknown): Record<string, string | number | boolean> | null;
export function presetLink(config: Record<string, unknown>, origin: string): string;
