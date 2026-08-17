import { useState } from 'react';

interface Props {
  sessionCode: string;
  onClose: () => void;
}

export function SessionSavedModal({ sessionCode, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(sessionCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-icon">✓</div>
        <h3 style={{ textAlign: 'center', marginBottom: 8 }}>Session Saved</h3>
        <p style={{ textAlign: 'center', fontSize: '0.85rem' }}>
          Share this code so you — or anyone covering this engagement — can resume it later from the
          "Resume Existing Session" option.
        </p>
        <div className="session-code-display">
          <span className="session-code-text">{sessionCode}</span>
          <button className="btn-secondary" onClick={handleCopy}>{copied ? 'Copied!' : 'Copy'}</button>
        </div>
        <button
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
          onClick={onClose}
        >
          Done
        </button>
      </div>
    </div>
  );
}
