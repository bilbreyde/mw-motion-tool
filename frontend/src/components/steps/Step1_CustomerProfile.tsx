import { ConversationalMessage } from '../ConversationalMessage';
import { OptionButton } from '../OptionButton';
import type { CustomerProfile, Industry, EnvironmentType, MdmPlatform, DeviceVolume, DeploymentTimeline, PrimaryOs } from '../../types';

interface Props {
  profile: CustomerProfile;
  onUpdate: (updates: Partial<CustomerProfile>) => void;
  onNext: () => void;
}

const INDUSTRIES: { value: Industry; label: string }[] = [
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'financial-services', label: 'Financial Services' },
  { value: 'education', label: 'Education' },
  { value: 'government', label: 'Government' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'retail', label: 'Retail' },
  { value: 'professional-services', label: 'Professional Services' },
  { value: 'technology', label: 'Technology' },
  { value: 'other', label: 'Other' },
];

const ENVIRONMENTS: { value: EnvironmentType; label: string; sublabel: string }[] = [
  { value: 'cloud-only', label: 'Cloud-Only', sublabel: 'Azure AD / Entra ID only' },
  { value: 'hybrid', label: 'Hybrid', sublabel: 'Azure AD + on-prem AD' },
  { value: 'on-premise', label: 'On-Premise', sublabel: 'Traditional AD DS' },
];

const MDM_PLATFORMS: { value: MdmPlatform; label: string }[] = [
  { value: 'intune', label: 'Microsoft Intune' },
  { value: 'jamf', label: 'Jamf Pro' },
  { value: 'workspace-one', label: 'VMware Workspace ONE' },
  { value: 'none', label: 'No MDM' },
  { value: 'other', label: 'Other MDM' },
];

const DEVICE_VOLUMES: { value: DeviceVolume; label: string }[] = [
  { value: '1-50', label: '1 – 50 devices' },
  { value: '51-250', label: '51 – 250 devices' },
  { value: '251-1000', label: '251 – 1,000 devices' },
  { value: '1000+', label: '1,000+ devices' },
];

const TIMELINES: { value: DeploymentTimeline; label: string; sublabel: string }[] = [
  { value: 'immediate', label: 'Immediate', sublabel: 'Within 30 days' },
  { value: '1-3months', label: '1–3 Months', sublabel: 'Short-term planning' },
  { value: '3-6months', label: '3–6 Months', sublabel: 'Mid-term planning' },
  { value: '6months+', label: '6+ Months', sublabel: 'Long-term roadmap' },
];

const OS_OPTIONS: { value: PrimaryOs; label: string; sublabel: string }[] = [
  { value: 'windows', label: 'Windows', sublabel: 'Primary or Windows-only' },
  { value: 'mac', label: 'macOS', sublabel: 'Primary or Mac-only' },
  { value: 'mixed', label: 'Mixed', sublabel: 'Windows + macOS' },
];

function isProfileComplete(p: CustomerProfile): boolean {
  return (
    p.customerName.trim().length > 0 &&
    p.industry !== null &&
    p.environmentType !== null &&
    p.mdmPlatform !== null &&
    p.deviceVolume !== null &&
    p.deploymentTimeline !== null &&
    p.primaryOs !== null
  );
}

export function Step1_CustomerProfile({ profile, onUpdate, onNext }: Props) {
  const complete = isProfileComplete(profile);

  return (
    <div className="step-container">
      <ConversationalMessage>
        <p>
          Let's start by building your customer profile. This information will drive all solution
          recommendations throughout the engagement. Fill out each section below.
        </p>
      </ConversationalMessage>

      <div className="form-section">
        <div className="form-label">Customer Name</div>
        <input
          className="text-input"
          type="text"
          placeholder="e.g. Contoso Corporation"
          value={profile.customerName}
          onChange={e => onUpdate({ customerName: e.target.value })}
        />
      </div>

      <div className="form-section">
        <div className="form-label">Industry Vertical</div>
        <div className="option-grid">
          {INDUSTRIES.map(i => (
            <OptionButton
              key={i.value}
              label={i.label}
              selected={profile.industry === i.value}
              onClick={() => onUpdate({ industry: i.value })}
            />
          ))}
        </div>
      </div>

      <div className="form-section">
        <div className="form-label">Primary OS Environment</div>
        <div className="option-grid">
          {OS_OPTIONS.map(o => (
            <OptionButton
              key={o.value}
              label={o.label}
              sublabel={o.sublabel}
              selected={profile.primaryOs === o.value}
              onClick={() => onUpdate({ primaryOs: o.value })}
            />
          ))}
        </div>
      </div>

      <div className="form-section">
        <div className="form-label">Identity & Directory Environment</div>
        <div className="option-grid">
          {ENVIRONMENTS.map(e => (
            <OptionButton
              key={e.value}
              label={e.label}
              sublabel={e.sublabel}
              selected={profile.environmentType === e.value}
              onClick={() => onUpdate({ environmentType: e.value })}
            />
          ))}
        </div>
      </div>

      <div className="form-section">
        <div className="form-label">Current MDM Platform</div>
        <div className="option-grid">
          {MDM_PLATFORMS.map(m => (
            <OptionButton
              key={m.value}
              label={m.label}
              selected={profile.mdmPlatform === m.value}
              onClick={() => onUpdate({ mdmPlatform: m.value })}
            />
          ))}
        </div>
      </div>

      <div className="form-section">
        <div className="form-label">Total Device Volume</div>
        <div className="option-grid">
          {DEVICE_VOLUMES.map(d => (
            <OptionButton
              key={d.value}
              label={d.label}
              selected={profile.deviceVolume === d.value}
              onClick={() => onUpdate({ deviceVolume: d.value })}
            />
          ))}
        </div>
      </div>

      <div className="form-section">
        <div className="form-label">Deployment Timeline</div>
        <div className="option-grid">
          {TIMELINES.map(t => (
            <OptionButton
              key={t.value}
              label={t.label}
              sublabel={t.sublabel}
              selected={profile.deploymentTimeline === t.value}
              onClick={() => onUpdate({ deploymentTimeline: t.value })}
            />
          ))}
        </div>
      </div>

      <div className="step-actions">
        <button className="btn-primary" onClick={onNext} disabled={!complete}>
          Continue to Readiness Gate →
        </button>
      </div>
    </div>
  );
}
