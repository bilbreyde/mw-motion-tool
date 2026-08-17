import type { MotionState, SaveSessionResponse, LoadSessionResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export async function saveSession(state: MotionState, sessionCode?: string | null): Promise<SaveSessionResponse> {
  const response = await fetch(`${API_BASE}/api/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionCode: sessionCode ?? undefined, state }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Save failed' }));
    throw new Error((err as { error?: string }).error ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<SaveSessionResponse>;
}

export async function loadSession(code: string): Promise<LoadSessionResponse> {
  const normalized = code.trim().toUpperCase();
  const response = await fetch(`${API_BASE}/api/session/${encodeURIComponent(normalized)}`);

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Session not found' }));
    throw new Error((err as { error?: string }).error ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<LoadSessionResponse>;
}
