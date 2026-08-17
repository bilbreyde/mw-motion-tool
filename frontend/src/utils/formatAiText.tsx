import type { ReactNode } from 'react';

const BULLET_RE = /^\s*(?:[-*•]|\d+[.)])\s+/;
const LABEL_RE = /^([A-Z][A-Za-z0-9 /&'-]{1,48}):\s*(.+)$/;

function renderBoldSpans(text: string, keyPrefix: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  if (parts.length <= 1) return text;
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={`${keyPrefix}-b-${i}`}>{part.slice(2, -2)}</strong>
      : <span key={`${keyPrefix}-t-${i}`}>{part}</span>
  );
}

function renderLine(text: string, keyPrefix: string): ReactNode {
  const labelMatch = text.match(LABEL_RE);
  if (labelMatch) {
    const [, label, rest] = labelMatch;
    return (
      <>
        <strong key={`${keyPrefix}-label`}>{label}:</strong> {renderBoldSpans(rest, keyPrefix)}
      </>
    );
  }
  return renderBoldSpans(text, keyPrefix);
}

function processBlock(block: string, blockKey: string, nodes: ReactNode[]): void {
  const lines = block.split(/\n/).map(l => l.trim()).filter(Boolean);
  let listLines: string[] = [];
  let segIdx = 0;

  function flushList() {
    if (listLines.length === 0) return;
    const key = `${blockKey}-ul-${segIdx++}`;
    nodes.push(
      <ul className="ai-text-list" key={key}>
        {listLines.map((line, i) => (
          <li key={i}>{renderLine(line.replace(BULLET_RE, ''), `${key}-li-${i}`)}</li>
        ))}
      </ul>
    );
    listLines = [];
  }

  lines.forEach(line => {
    if (BULLET_RE.test(line)) {
      listLines.push(line);
    } else {
      flushList();
      nodes.push(<p key={`${blockKey}-p-${segIdx++}`}>{renderLine(line, `${blockKey}-p-${segIdx}`)}</p>);
    }
  });
  flushList();
}

/**
 * Parses raw AI-generated text (paragraphs, "Label: value" lines, "- item" / "1. item"
 * bullet lines, and **bold** spans) into structured JSX matching the app's card UI.
 */
export function renderAiText(raw: string | null | undefined): ReactNode {
  const text = (raw ?? '').trim();
  if (!text) return null;

  const blocks = text.split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
  const nodes: ReactNode[] = [];
  blocks.forEach((block, i) => processBlock(block, `b${i}`, nodes));
  return <>{nodes}</>;
}
