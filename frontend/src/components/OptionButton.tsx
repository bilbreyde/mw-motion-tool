interface OptionButtonProps {
  label: string;
  sublabel?: string;
  selected?: boolean;
  onClick: () => void;
  variant?: 'default' | 'yes' | 'no' | 'accent' | 'warn' | 'unvalidated';
  disabled?: boolean;
}

export function OptionButton({ label, sublabel, selected, onClick, variant = 'default', disabled }: OptionButtonProps) {
  const cls = [
    'option-btn',
    selected ? 'option-btn--selected' : '',
    variant === 'yes' ? 'option-btn--yes' : '',
    variant === 'no' ? 'option-btn--no' : '',
    variant === 'accent' ? 'option-btn--accent' : '',
    variant === 'warn' ? 'option-btn--warn' : '',
    variant === 'unvalidated' ? 'option-btn--unvalidated' : '',
  ].filter(Boolean).join(' ');

  return (
    <button className={cls} onClick={onClick} disabled={disabled}>
      <span className="option-label">{label}</span>
      {sublabel && <span className="option-sublabel">{sublabel}</span>}
    </button>
  );
}
