import type { ReactNode } from 'react';

export function boldCurrently(label: string): ReactNode {
  const parts = label.split(/(currently)/i);
  if (parts.length === 1) return label;
  return parts.map((part, i) => (/^currently$/i.test(part) ? <strong key={i}>{part}</strong> : part));
}
