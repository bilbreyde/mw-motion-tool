import type { ReactNode } from 'react';
import { OptionButton } from '../OptionButton';
import { UnvalidatedBtn } from '../UnvalidatedBtn';
import type { DiscoveryMode, ProServicesState } from '../../types';

// Props every Pro Services discovery step receives.
export interface PsStepProps {
  ps: ProServicesState;
  discoveryMode: DiscoveryMode;
  unvalidatedFields: string[];
  onUpdate: (updates: Partial<ProServicesState>) => void;
  onMarkUnvalidated: (fieldKey: string) => void;
  onClearUnvalidated: (fieldKey: string) => void;
  onNext: () => void;
}

interface Option<T extends string> {
  value: T;
  label: string;
  sublabel?: string;
  variant?: 'default' | 'yes' | 'no' | 'accent' | 'warn';
}

interface ChoiceFieldProps<T extends string> {
  label: ReactNode;
  hint?: ReactNode;
  options: Option<T>[];
  fieldKey: string;
  discoveryMode: DiscoveryMode;
  unvalidatedFields: string[];
  onMarkUnvalidated: (k: string) => void;
  onClearUnvalidated: (k: string) => void;
  wide?: boolean;
}

interface SingleChoiceProps<T extends string> extends ChoiceFieldProps<T> {
  value: T | null;
  onChange: (v: T | null) => void;
}

export function SingleChoiceField<T extends string>({
  label, hint, options, value, onChange, fieldKey, discoveryMode, unvalidatedFields,
  onMarkUnvalidated, onClearUnvalidated, wide,
}: SingleChoiceProps<T>) {
  return (
    <div className="form-section">
      <div className="form-label">{label}</div>
      {hint && <div className="ps-field-hint">{hint}</div>}
      <div className={`option-grid${wide ? ' option-grid--wide' : ''}`}>
        {options.map(o => (
          <OptionButton
            key={o.value}
            label={o.label}
            sublabel={o.sublabel}
            variant={o.variant}
            selected={value === o.value}
            onClick={() => { onChange(o.value); onClearUnvalidated(fieldKey); }}
          />
        ))}
        {discoveryMode === 'validation' && (
          <UnvalidatedBtn
            fieldKey={fieldKey}
            unvalidatedFields={unvalidatedFields}
            onMark={onMarkUnvalidated}
            onClear={onClearUnvalidated}
            onNullify={() => onChange(null)}
          />
        )}
      </div>
      {unvalidatedFields.includes(fieldKey) && <div className="unvalidated-flag">⚠ Unvalidated — confirm with customer IT team</div>}
    </div>
  );
}

interface MultiChoiceProps<T extends string> extends ChoiceFieldProps<T> {
  values: T[];
  onChange: (v: T[]) => void;
}

export function MultiChoiceField<T extends string>({
  label, hint, options, values, onChange, fieldKey, discoveryMode, unvalidatedFields,
  onMarkUnvalidated, onClearUnvalidated, wide,
}: MultiChoiceProps<T>) {
  return (
    <div className="form-section">
      <div className="form-label">{label}</div>
      {hint && <div className="ps-field-hint">{hint}</div>}
      <div className={`option-grid${wide ? ' option-grid--wide' : ''}`}>
        {options.map(o => {
          const selected = values.includes(o.value);
          return (
            <OptionButton
              key={o.value}
              label={o.label}
              sublabel={o.sublabel}
              selected={selected}
              onClick={() => {
                onChange(selected ? values.filter(v => v !== o.value) : [...values, o.value]);
                onClearUnvalidated(fieldKey);
              }}
            />
          );
        })}
        {discoveryMode === 'validation' && (
          <UnvalidatedBtn
            fieldKey={fieldKey}
            unvalidatedFields={unvalidatedFields}
            onMark={onMarkUnvalidated}
            onClear={onClearUnvalidated}
            onNullify={() => onChange([])}
          />
        )}
      </div>
      {unvalidatedFields.includes(fieldKey) && <div className="unvalidated-flag">⚠ Unvalidated — confirm with customer IT team</div>}
    </div>
  );
}
