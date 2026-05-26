import { ConversationalMessage } from '../ConversationalMessage';
import { OptionButton } from '../OptionButton';
import type {
  CustomerProfile, DiscoveryMode, Industry, EntraJoinType,
  CoManagementStatus, MdmPlatform, DeviceVolume, DeploymentTimeline, PrimaryOs
} from '../../types';
import { isFieldAnswered } from '../../types';

interface Props {
  profile: CustomerProfile;
  discoveryMode: DiscoveryMode;
  unvalidatedFields: string[];
  onUpdate: (updates: Partial<CustomerProfile>) => void;
  onMarkUnvalidated: (fieldKey: string) => void;
  onClearUnvalidated: (fieldKey: string) => void;
  onNext: () => void;
}

const INDUSTRIES: { value: Industry; label: string }[] = [
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'financial-services', label: 'Financial Services' },
  { value: 'education', label: 'Education' },
  { value: 'government', label: 'Government / Public Sector' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'retail', label: 'Retail' },
  { value: 'professional-services', label: 'Professional Services' },
  { value: 'technology', label: 'Technology' },
  { value: 'other', label: 'Other' },
];

const OS_OPTIONS: { value: PrimaryOs; label: string; sublabel: string }[] = [
  { value: 'windows', label: 'Windows', sublabel: 'Exclusively or primarily Windows' },
  { value: 'mac', label: 'macOS', sublabel: 'Exclusively or primarily macOS' },
  { value: 'mixed', label: 'Mixed Fleet', sublabel: 'Windows and macOS co-exist' },
];

const ENTRA_JOIN_TYPES: { value: EntraJoinType; label: string; sublabel: string }[] = [
  { value: 'azure-ad-join', label: 'Azure AD Join (AAD Join)', sublabel: 'Cloud-only — Entra ID native, no on-prem AD dependency' },
  { value: 'hybrid-aadj', label: 'Hybrid Azure AD Join (HAADJ)', sublabel: 'Devices joined to on-prem AD and registered in Entra ID' },
  { value: 'ad-ds-only', label: 'AD DS Only', sublabel: 'Traditional on-prem domain join — no Entra ID / Azure AD' },
];

const CO_MGMT_OPTIONS: { value: CoManagementStatus; label: string; sublabel: string }[] = [
  { value: 'intune-only', label: 'Intune Standalone', sublabel: 'Intune is the sole MDM — no SCCM/ConfigMgr in use' },
  { value: 'co-managed', label: 'Co-management Active', sublabel: 'SCCM + Intune workload split — co-management enabled' },
  { value: 'configmgr-only', label: 'SCCM / ConfigMgr Only', sublabel: 'No Intune — managed exclusively via ConfigMgr' },
  { value: 'none', label: 'No Management Platform', sublabel: 'Devices are unmanaged or in early evaluation' },
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
  { value: 'immediate', label: 'Immediate', sublabel: 'First order within 30 days' },
  { value: '1-3months', label: '1–3 Months', sublabel: 'Scoping in progress' },
  { value: '3-6months', label: '3–6 Months', sublabel: 'Mid-term planning phase' },
  { value: '6months+', label: '6+ Months', sublabel: 'Long-term roadmap item' },
];

function UnvalidatedBtn({ fieldKey, unvalidatedFields, onMark, onClear, onNullify }: {
  fieldKey: string;
  unvalidatedFields: string[];
  onMark: (k: string) => void;
  onClear: (k: string) => void;
  onNullify: () => void;
}) {
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

export function Step1_CustomerProfile({ profile, discoveryMode, unvalidatedFields, onUpdate, onMarkUnvalidated, onClearUnvalidated, onNext }: Props) {
  const uv = (key: string) => unvalidatedFields.includes(key);
  const answered = (value: unknown, key: string) => isFieldAnswered(value, key, unvalidatedFields);

  const isComplete =
    profile.customerName.trim().length > 0 &&
    answered(profile.industry, 'customerProfile.industry') &&
    answered(profile.primaryOs, 'customerProfile.primaryOs') &&
    answered(profile.entraJoinType, 'customerProfile.entraJoinType') &&
    answered(profile.coManagementStatus, 'customerProfile.coManagementStatus') &&
    answered(profile.mdmPlatform, 'customerProfile.mdmPlatform') &&
    answered(profile.deviceVolume, 'customerProfile.deviceVolume') &&
    answered(profile.deploymentTimeline, 'customerProfile.deploymentTimeline');

  return (
    <div className="step-container">
      <ConversationalMessage>
        {discoveryMode === 'live' ? (
          <p>
            You are conducting live technical discovery with the customer's IT team. Document
            the environment accurately — each field here directly influences the deployment
            model and SOW scope. Confirm every field with the engineers in the room.
          </p>
        ) : (
          <p>
            You are working from seller-provided information. For any field that cannot be
            confirmed from the materials you have, select{' '}
            <strong style={{ color: 'var(--color-warning)' }}>Unvalidated — confirm with customer</strong>.
            Flagged items will be tracked and must be resolved before any order is placed.
          </p>
        )}
      </ConversationalMessage>

      <div className="form-section">
        <div className="form-label">Customer / Organization Name</div>
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
              onClick={() => { onUpdate({ industry: i.value }); onClearUnvalidated('customerProfile.industry'); }}
            />
          ))}
          {discoveryMode === 'validation' && (
            <UnvalidatedBtn
              fieldKey="customerProfile.industry"
              unvalidatedFields={unvalidatedFields}
              onMark={onMarkUnvalidated}
              onClear={onClearUnvalidated}
              onNullify={() => onUpdate({ industry: null })}
            />
          )}
        </div>
        {uv('customerProfile.industry') && <div className="unvalidated-flag">⚠ Unvalidated — confirm with IT team</div>}
      </div>

      <div className="form-section">
        <div className="form-label">Primary OS Platform</div>
        <div className="option-grid">
          {OS_OPTIONS.map(o => (
            <OptionButton
              key={o.value}
              label={o.label}
              sublabel={o.sublabel}
              selected={profile.primaryOs === o.value}
              onClick={() => { onUpdate({ primaryOs: o.value }); onClearUnvalidated('customerProfile.primaryOs'); }}
            />
          ))}
          {discoveryMode === 'validation' && (
            <UnvalidatedBtn
              fieldKey="customerProfile.primaryOs"
              unvalidatedFields={unvalidatedFields}
              onMark={onMarkUnvalidated}
              onClear={onClearUnvalidated}
              onNullify={() => onUpdate({ primaryOs: null })}
            />
          )}
        </div>
        {uv('customerProfile.primaryOs') && <div className="unvalidated-flag">⚠ Unvalidated — confirm with IT team</div>}
      </div>

      <div className="form-section">
        <div className="form-label">Entra ID / Directory Join Type</div>
        {discoveryMode === 'live' && (
          <ConversationalMessage>
            <p>
              What is the device join type for the target device population? Confirm this with the
              identity team — check Entra ID portal &gt; Devices &gt; All devices and verify the join
              type column. Hybrid AADJ requires line-of-sight to a domain controller during OOBE.
            </p>
          </ConversationalMessage>
        )}
        <div className="option-grid option-grid--wide">
          {ENTRA_JOIN_TYPES.map(e => (
            <OptionButton
              key={e.value}
              label={e.label}
              sublabel={e.sublabel}
              selected={profile.entraJoinType === e.value}
              onClick={() => { onUpdate({ entraJoinType: e.value }); onClearUnvalidated('customerProfile.entraJoinType'); }}
            />
          ))}
          {discoveryMode === 'validation' && (
            <UnvalidatedBtn
              fieldKey="customerProfile.entraJoinType"
              unvalidatedFields={unvalidatedFields}
              onMark={onMarkUnvalidated}
              onClear={onClearUnvalidated}
              onNullify={() => onUpdate({ entraJoinType: null })}
            />
          )}
        </div>
        {uv('customerProfile.entraJoinType') && <div className="unvalidated-flag">⚠ Unvalidated — confirm with IT team</div>}
      </div>

      <div className="form-section">
        <div className="form-label">Co-management / Configuration Manager Status</div>
        {discoveryMode === 'live' && (
          <ConversationalMessage>
            <p>
              Is SCCM / Microsoft Configuration Manager in use? If co-management is enabled,
              confirm which workloads have been shifted to Intune (Device Configuration,
              Compliance Policies, Endpoint Protection). This affects whether Autopilot can
              take full ownership of the device without SCCM dependency.
            </p>
          </ConversationalMessage>
        )}
        <div className="option-grid option-grid--wide">
          {CO_MGMT_OPTIONS.map(c => (
            <OptionButton
              key={c.value}
              label={c.label}
              sublabel={c.sublabel}
              selected={profile.coManagementStatus === c.value}
              onClick={() => { onUpdate({ coManagementStatus: c.value }); onClearUnvalidated('customerProfile.coManagementStatus'); }}
            />
          ))}
          {discoveryMode === 'validation' && (
            <UnvalidatedBtn
              fieldKey="customerProfile.coManagementStatus"
              unvalidatedFields={unvalidatedFields}
              onMark={onMarkUnvalidated}
              onClear={onClearUnvalidated}
              onNullify={() => onUpdate({ coManagementStatus: null })}
            />
          )}
        </div>
        {uv('customerProfile.coManagementStatus') && <div className="unvalidated-flag">⚠ Unvalidated — confirm with IT team</div>}
      </div>

      <div className="form-section">
        <div className="form-label">MDM Platform</div>
        <div className="option-grid">
          {MDM_PLATFORMS.map(m => (
            <OptionButton
              key={m.value}
              label={m.label}
              selected={profile.mdmPlatform === m.value}
              onClick={() => { onUpdate({ mdmPlatform: m.value }); onClearUnvalidated('customerProfile.mdmPlatform'); }}
            />
          ))}
          {discoveryMode === 'validation' && (
            <UnvalidatedBtn
              fieldKey="customerProfile.mdmPlatform"
              unvalidatedFields={unvalidatedFields}
              onMark={onMarkUnvalidated}
              onClear={onClearUnvalidated}
              onNullify={() => onUpdate({ mdmPlatform: null })}
            />
          )}
        </div>
        {uv('customerProfile.mdmPlatform') && <div className="unvalidated-flag">⚠ Unvalidated — confirm with IT team</div>}
      </div>

      <div className="form-section">
        <div className="form-label">Total Device Volume (in scope)</div>
        <div className="option-grid">
          {DEVICE_VOLUMES.map(d => (
            <OptionButton
              key={d.value}
              label={d.label}
              selected={profile.deviceVolume === d.value}
              onClick={() => { onUpdate({ deviceVolume: d.value }); onClearUnvalidated('customerProfile.deviceVolume'); }}
            />
          ))}
          {discoveryMode === 'validation' && (
            <UnvalidatedBtn
              fieldKey="customerProfile.deviceVolume"
              unvalidatedFields={unvalidatedFields}
              onMark={onMarkUnvalidated}
              onClear={onClearUnvalidated}
              onNullify={() => onUpdate({ deviceVolume: null })}
            />
          )}
        </div>
        {uv('customerProfile.deviceVolume') && <div className="unvalidated-flag">⚠ Unvalidated — confirm with IT team</div>}
      </div>

      <div className="form-section">
        <div className="form-label">Target Deployment Timeline</div>
        <div className="option-grid">
          {TIMELINES.map(t => (
            <OptionButton
              key={t.value}
              label={t.label}
              sublabel={t.sublabel}
              selected={profile.deploymentTimeline === t.value}
              onClick={() => { onUpdate({ deploymentTimeline: t.value }); onClearUnvalidated('customerProfile.deploymentTimeline'); }}
            />
          ))}
          {discoveryMode === 'validation' && (
            <UnvalidatedBtn
              fieldKey="customerProfile.deploymentTimeline"
              unvalidatedFields={unvalidatedFields}
              onMark={onMarkUnvalidated}
              onClear={onClearUnvalidated}
              onNullify={() => onUpdate({ deploymentTimeline: null })}
            />
          )}
        </div>
        {uv('customerProfile.deploymentTimeline') && <div className="unvalidated-flag">⚠ Unvalidated — confirm with IT team</div>}
      </div>

      <div className="step-actions">
        <button className="btn-primary" onClick={onNext} disabled={!isComplete}>
          Continue to Readiness Gate →
        </button>
      </div>
    </div>
  );
}
