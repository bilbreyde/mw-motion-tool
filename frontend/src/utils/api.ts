import type { AiMotionRequest, AiMotionResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export async function callMotionAI(request: AiMotionRequest): Promise<AiMotionResponse> {
  const response = await fetch(`${API_BASE}/api/motion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error((err as { error?: string }).error ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<AiMotionResponse>;
}
