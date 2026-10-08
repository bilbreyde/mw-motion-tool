import { ConversationalMessage } from '../ConversationalMessage';
import { MDM_PLATFORMS, OS_OPTIONS } from '../steps/Step1_CustomerProfile';
import { isFieldAnswered } from '../../types';
import { MultiChoiceField, SingleChoiceField, type PsStepProps } from './PsFields';
import { PS_DEVICE_COUNTS } from './psConfig';

export function PsStep2_EnvironmentProfile(props: PsStepProps) {
  const { ps, discoveryMode, unvalidatedFields, onUpdate, onNext } = props;
  const answered = (v: unknown, k: string) => isFieldAnswered(v, k, unvalidatedFields);
  const shared = {
    discoveryMode,
    unvalidatedFields,
    onMarkUnvalidated: props.onMarkUnvalidated,
    onClearUnvalidated: props.onClearUnvalidated,
  };

  const isComplete =
    answered(ps.deviceCount, 'proServices.deviceCount') &&
    answered(ps.currentMdm, 'proServices.currentMdm') &&
    answered(ps.osLandscape, 'proServices.osLandscape');

  return (
    <div className="step-container">
      <ConversationalMessage>
        <p>
          Capture the environment the engagement will cover. Device count drives the LOE framework
          directly; the MDM platform and OS mix shape design and migration effort.
          {ps.engagementType === 'migration' && ' For a migration, the current MDM is the source platform devices move off of.'}
        </p>
      </ConversationalMessage>

      <SingleChoiceField
        {...shared}
        label="Device Count (In Scope)"
        options={PS_DEVICE_COUNTS}
        value={ps.deviceCount}
        onChange={v => onUpdate({ deviceCount: v })}
        fieldKey="proServices.deviceCount"
      />

      <MultiChoiceField
        {...shared}
        label={ps.engagementType === 'migration' ? 'Current (Source) MDM Platform' : 'Current MDM Platform'}
        hint="Select all that apply."
        options={MDM_PLATFORMS}
        values={ps.currentMdm}
        onChange={v => onUpdate({ currentMdm: v })}
        fieldKey="proServices.currentMdm"
      />

      <MultiChoiceField
        {...shared}
        label="OS Landscape"
        hint="Select every platform in scope for the engagement."
        options={OS_OPTIONS}
        values={ps.osLandscape}
        onChange={v => onUpdate({ osLandscape: v })}
        fieldKey="proServices.osLandscape"
      />

      <div className="form-section">
        <div className="form-label">Environment Notes (optional)</div>
        <textarea
          className="text-input"
          rows={3}
          placeholder="e.g. co-managed with MECM, hybrid join today, 3 regional sites"
          value={ps.environmentNotes}
          onChange={e => onUpdate({ environmentNotes: e.target.value })}
        />
      </div>

      <div className="step-actions">
        <button className="btn-primary" onClick={onNext} disabled={!isComplete}>
          Continue to Configuration Status →
        </button>
      </div>
    </div>
  );
}
