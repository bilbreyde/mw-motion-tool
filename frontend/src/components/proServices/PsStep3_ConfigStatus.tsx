import { ConversationalMessage } from '../ConversationalMessage';
import { isFieldAnswered } from '../../types';
import { SingleChoiceField, type PsStepProps } from './PsFields';
import { CONFIG_AREAS, CONFIG_STATUS_OPTIONS, configFieldKey, isAdim } from './psConfig';

export function PsStep3_ConfigStatus(props: PsStepProps) {
  const { ps, discoveryMode, unvalidatedFields, onUpdate, onNext } = props;

  const isComplete = CONFIG_AREAS.every(a =>
    isFieldAnswered(ps.configStatus[a.key], configFieldKey(a.key), unvalidatedFields),
  );

  return (
    <div className="step-container">
      <ConversationalMessage>
        <p>
          For each configuration area, capture where the customer is today.
          {isAdim(ps.engagementType)
            ? ' Status drives the LOE: Complete reduces that area by 80%, In Progress by 40%, and Not Started carries full effort.'
            : ' Status shapes what the assessment covers for each area in the requirements table.'}
          {discoveryMode === 'live'
            ? ' Ask for evidence (portal screenshots, exported profiles) rather than accepting a verbal "done".'
            : ' Anything you cannot confirm should be flagged unvalidated — it is scoped as Not Started until confirmed.'}
        </p>
      </ConversationalMessage>

      {CONFIG_AREAS.map((area, i) => (
        <SingleChoiceField
          key={area.key}
          label={`${i + 1}. ${area.label}`}
          hint={area.guidance}
          options={CONFIG_STATUS_OPTIONS}
          value={ps.configStatus[area.key]}
          onChange={v => onUpdate({ configStatus: { ...ps.configStatus, [area.key]: v } })}
          fieldKey={configFieldKey(area.key)}
          discoveryMode={discoveryMode}
          unvalidatedFields={unvalidatedFields}
          onMarkUnvalidated={props.onMarkUnvalidated}
          onClearUnvalidated={props.onClearUnvalidated}
        />
      ))}

      <div className="step-actions">
        <button className="btn-primary" onClick={onNext} disabled={!isComplete}>
          Continue to Complexity Indicators →
        </button>
      </div>
    </div>
  );
}
