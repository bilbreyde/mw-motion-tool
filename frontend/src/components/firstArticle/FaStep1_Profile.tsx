import { ConversationalMessage } from '../ConversationalMessage';
import type { CustomerProfile, DiscoveryMode } from '../../types';

interface Props {
  profile: CustomerProfile;
  discoveryMode: DiscoveryMode;
  onUpdate: (updates: Partial<CustomerProfile>) => void;
  onNext: () => void;
}

const HEADER_FIELDS: { key: 'customerName' | 'opportunityNumber' | 'saName' | 'sellerName'; label: string; placeholder: string }[] = [
  { key: 'customerName', label: 'Customer / Organization Name', placeholder: 'e.g. Contoso Corporation' },
  { key: 'opportunityNumber', label: 'Opportunity Number', placeholder: 'e.g. OPP-12345' },
  { key: 'saName', label: 'SA Name', placeholder: 'Solution Architect name' },
  { key: 'sellerName', label: 'Seller Name', placeholder: 'Account Executive name' },
];

export function FaStep1_Profile({ profile, discoveryMode, onUpdate, onNext }: Props) {
  const isComplete =
    profile.customerName.trim().length > 0 &&
    profile.opportunityNumber.trim().length > 0 &&
    profile.saName.trim().length > 0 &&
    profile.sellerName.trim().length > 0;

  return (
    <div className="step-container">
      <ConversationalMessage>
        {discoveryMode === 'live' ? (
          <p>
            You are opening a First Article session for a customer with an existing Autopilot
            environment. Confirm the customer and opportunity details below, then proceed to
            capture the first article intake.
          </p>
        ) : (
          <p>
            You are documenting first article intake from seller-provided information. Confirm
            the customer and opportunity details below. Flag any intake item that cannot be
            confirmed with the customer's IT team.
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
            onChange={e => onUpdate({ [f.key]: e.target.value })}
          />
        </div>
      ))}

      <div className="step-actions">
        <button className="btn-primary" onClick={onNext} disabled={!isComplete}>
          Continue to First Article Intake →
        </button>
      </div>
    </div>
  );
}
