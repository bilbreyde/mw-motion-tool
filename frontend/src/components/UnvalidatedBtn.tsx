interface Props {
  fieldKey: string;
  unvalidatedFields: string[];
  onMark: (k: string) => void;
  onClear: (k: string) => void;
  onNullify: () => void;
}

export function UnvalidatedBtn({ fieldKey, unvalidatedFields, onMark, onClear, onNullify }: Props) {
  const flagged = unvalidatedFields.includes(fieldKey);
  return (
    <button
      className={`option-btn option-btn--unvalidated ${flagged ? 'option-btn--selected' : ''}`}
      onClick={() => {
        if (flagged) {
          onClear(fieldKey);
        } else {
          onNullify();
          onMark(fieldKey);
        }
      }}
    >
      <span className="option-label">Unvalidated — confirm with customer</span>
      <span className="option-sublabel">Flag for follow-up before ordering</span>
    </button>
  );
}
