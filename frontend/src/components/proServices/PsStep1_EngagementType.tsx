import { ConversationalMessage } from '../ConversationalMessage';
import { OptionButton } from '../OptionButton';
import type { CustomerProfile } from '../../types';
import type { PsStepProps } from './PsFields';
import { PS_ENGAGEMENT_TYPES, isPsStep1Complete } from './psConfig';

interface Props extends PsStepProps {
  profile: CustomerProfile;
  onUpdateProfile: (updates: Partial<CustomerProfile>) => void;
}

const HEADER_FIELDS: { key: 'customerName' | 'opportunityNumber' | 'saName' | 'sellerName'; label: string; placeholder: string }[] = [
  { key: 'customerName', label: 'Customer / Organization Name', placeholder: 'e.g. Contoso Corporation' },
  { key: 'opportunityNumber', label: 'Opportunity Number', placeholder: 'e.g. OPP-12345' },
  { key: 'saName', label: 'SA Name', placeholder: 'Solution Architect name' },
  { key: 'sellerName', label: 'Seller Name', placeholder: 'Account Executive name' },
];

export function PsStep1_EngagementType({ profile, onUpdateProfile, ps, discoveryMode, onUpdate, onNext }: Props) {
  return (
    <div className="step-container">
      <ConversationalMessage>
        {discoveryMode === 'live' ? (
          <p>
            You are scoping an Autopilot/Intune Professional Services engagement with the customer's
            IT team on the call. Confirm the engagement type first — it sets the LOE framework and
            how each configuration area is scoped in the requirements table.
          </p>
        ) : (
          <p>
            You are scoping an Autopilot/Intune Professional Services engagement from seller-provided
            information. Any environment detail you cannot confirm should be flagged{' '}
            <strong style={{ color: 'var(--color-warning)' }}>Unvalidated — confirm with customer</strong>;
            unvalidated items are scoped conservatively and listed for follow-up.
          </p>
        )}
      </ConversationalMessage>

      {HEADER_FIELDS.map(f => (
        <div className="form-section" key={f.key}>
          <div className="form-label">{f.label}</div>
          <input
            className="text-input"
            type="text"
            placeholder={f.placeholder}
            value={profile[f.key]}
            onChange={e => onUpdateProfile({ [f.key]: e.target.value })}
          />
        </div>
      ))}

      <div className="form-section">
        <div className="form-label">Engagement Type</div>
        <div className="option-grid option-grid--wide">
          {PS_ENGAGEMENT_TYPES.map(t => (
            <OptionButton
              key={t.value}
              label={t.label}
              sublabel={t.sublabel}
              selected={ps.engagementType === t.value}
              onClick={() => onUpdate({ engagementType: t.value })}
            />
          ))}
        </div>
      </div>

      <div className="step-actions">
        <button className="btn-primary" onClick={onNext} disabled={!isPsStep1Complete(profile, ps)}>
          Continue to Environment Profile →
        </button>
      </div>
    </div>
  );
}
