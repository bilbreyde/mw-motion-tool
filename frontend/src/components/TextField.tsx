import type { DiscoveryMode } from '../types';

interface Props {
  label: string;
  value: string;
  placeholder?: string;
  fieldKey: string;
  discoveryMode: DiscoveryMode;
  unvalidatedFields: string[];
  onChange: (v: string) => void;
  onMarkUnvalidated: (k: string) => void;
  onClearUnvalidated: (k: string) => void;
  multiline?: boolean;
}

export function TextField({
  label, value, placeholder, fieldKey, discoveryMode, unvalidatedFields,
  onChange, onMarkUnvalidated, onClearUnvalidated, multiline,
}: Props) {
  const uv = unvalidatedFields.includes(fieldKey);

  function handleUnvalidated() {
    if (uv) {
      onClearUnvalidated(fieldKey);
    } else {
      onChange('');
      onMarkUnvalidated(fieldKey);
    }
  }

  return (
    <div className="form-section">
      <div className="form-label">{label}</div>
      {multiline ? (
        <textarea
          className="text-input"
          rows={3}
          placeholder={placeholder}
          value={value}
          disabled={uv}
          onChange={e => { onChange(e.target.value); if (uv) onClearUnvalidated(fieldKey); }}
        />
      ) : (
        <input
          className="text-input"
          type="text"
          placeholder={placeholder}
          value={value}
          disabled={uv}
          onChange={e => { onChange(e.target.value); if (uv) onClearUnvalidated(fieldKey); }}
        />
      )}
      {discoveryMode === 'validation' && (
        <button
          className={`option-btn option-btn--unvalidated ${uv ? 'option-btn--selected' : ''}`}
          style={{ marginTop: 8 }}
          onClick={handleUnvalidated}
        >
          <span className="option-label">Unvalidated — confirm with customer</span>
          <span className="option-sublabel">Flag for follow-up before ordering</span>
        </button>
      )}
      {uv && <div className="unvalidated-flag">⚠ Unvalidated — must be confirmed before ordering</div>}
    </div>
  );
}
