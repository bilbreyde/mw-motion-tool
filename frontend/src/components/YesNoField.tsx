import type { ReactNode } from 'react';
import { ConversationalMessage } from './ConversationalMessage';
import { OptionButton } from './OptionButton';
import type { DiscoveryMode } from '../types';

interface Props {
  label: string;
  liveCopy?: ReactNode;
  validationCopy?: ReactNode;
  value: boolean | null;
  fieldKey: string;
  discoveryMode: DiscoveryMode;
  unvalidatedFields: string[];
  onChange: (v: boolean | null) => void;
  onMarkUnvalidated: (k: string) => void;
  onClearUnvalidated: (k: string) => void;
  yesLabel: string;
  yesSublabel?: string;
  noLabel: string;
  noSublabel?: string;
  unvalidatedFlagText?: string;
}

export function YesNoField({
  label, liveCopy, validationCopy, value, fieldKey, discoveryMode, unvalidatedFields,
  onChange, onMarkUnvalidated, onClearUnvalidated,
  yesLabel, yesSublabel, noLabel, noSublabel, unvalidatedFlagText,
}: Props) {
  const uv = unvalidatedFields.includes(fieldKey);

  function handleChange(v: boolean) {
    onChange(v);
    onClearUnvalidated(fieldKey);
  }

  function handleUnvalidated() {
    if (uv) {
      onClearUnvalidated(fieldKey);
    } else {
      onChange(null);
      onMarkUnvalidated(fieldKey);
    }
  }

  const copy = discoveryMode === 'live' ? liveCopy : validationCopy;

  return (
    <div className="form-section">
      <div className="form-label">{label}</div>
      {copy && <ConversationalMessage><p>{copy}</p></ConversationalMessage>}
      <div className="option-grid">
        <OptionButton
          label={yesLabel}
          sublabel={yesSublabel}
          selected={value === true}
          onClick={() => handleChange(true)}
          variant="yes"
        />
        <OptionButton
          label={noLabel}
          sublabel={noSublabel}
          selected={value === false}
          onClick={() => handleChange(false)}
          variant="no"
        />
        {discoveryMode === 'validation' && (
          <button
            className={`option-btn option-btn--unvalidated ${uv ? 'option-btn--selected' : ''}`}
            onClick={handleUnvalidated}
          >
            <span className="option-label">Unvalidated — confirm with customer</span>
            <span className="option-sublabel">Flag for follow-up before ordering</span>
          </button>
        )}
      </div>
      {uv && <div className="unvalidated-flag">⚠ {unvalidatedFlagText ?? 'Unvalidated — must be confirmed before ordering'}</div>}
    </div>
  );
}
