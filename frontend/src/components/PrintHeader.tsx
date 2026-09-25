import type { ReactNode } from 'react';

interface Props {
  title: string;
  sessionCode: string | null;
  // Hide on screen and only show when printing (for pages whose on-screen header already exists).
  printOnly?: boolean;
  children?: ReactNode;
}

export function PrintHeader({ title, sessionCode, printOnly, children }: Props) {
  return (
    <div className={`print-header${printOnly ? ' print-only' : ''}`}>
      <div className="print-header-top">
        <div>
          <div className="print-header-brand">Zones Digital Workplace</div>
          <h1 className="print-header-title">{title}</h1>
        </div>
        <div className="print-header-session">
          <span className="print-header-session-label">Session ID</span>
          <span className="print-header-session-value">{sessionCode ?? 'Not saved'}</span>
        </div>
      </div>
      {children && <div className="print-header-meta">{children}</div>}
    </div>
  );
}
