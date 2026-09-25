import { ConversationalMessage } from '../ConversationalMessage';
import { OptionButton } from '../OptionButton';
import { UnvalidatedBtn } from '../UnvalidatedBtn';
import { YesNoField } from '../YesNoField';
import { TextField } from '../TextField';
import type {
  CustomerProfile, DiscoveryMode, Industry, EntraJoinType,
  CoManagementStatus, MdmPlatform, DeviceVolume, DeploymentTimeline, PrimaryOs,
  IntuneAutopilotOwner, DeploymentModelType, ProvisioningTimeAcceptable
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

export const INDUSTRIES: { value: Industry; label: string }[] = [
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

export const OS_OPTIONS: { value: PrimaryOs; label: string; sublabel: string }[] = [
  { value: 'windows', label: 'Windows', sublabel: 'Exclusively or primarily Windows' },
  { value: 'mac', label: 'macOS', sublabel: 'Exclusively or primarily macOS' },
  { value: 'ios', label: 'iOS', sublabel: 'Apple mobile devices in scope' },
  { value: 'android', label: 'Android', sublabel: 'Android mobile devices in scope' },
  { value: 'linux', label: 'Linux', sublabel: 'Linux desktop or workstation devices in scope' },
];

export const ENTRA_JOIN_TYPES: { value: EntraJoinType; label: string; sublabel: string }[] = [
  { value: 'azure-ad-join', label: 'Entra ID Join', sublabel: 'Cloud-only — Entra ID native, no on-prem AD dependency' },
  { value: 'hybrid-aadj', label: 'Hybrid Entra ID Join (HEID)', sublabel: 'Devices joined to on-prem AD and registered in Entra ID' },
  { value: 'ad-ds-only', label: 'AD DS Only', sublabel: 'Traditional on-prem domain join — no Entra ID' },
];

export const CO_MGMT_OPTIONS: { value: CoManagementStatus; label: string; sublabel: string }[] = [
  { value: 'intune-only', label: 'Intune Standalone', sublabel: 'Intune is the sole MDM — no MECM (SCCM)/ConfigMgr in use' },
  { value: 'co-managed', label: 'Co-management Active', sublabel: 'MECM (SCCM) + Intune workload split — co-management enabled' },
  { value: 'configmgr-only', label: 'MECM (SCCM) / ConfigMgr Only', sublabel: 'No Intune — managed exclusively via ConfigMgr' },
  { value: 'none', label: 'No Management Platform', sublabel: 'Devices are unmanaged or in early evaluation' },
];

export const MDM_PLATFORMS: { value: MdmPlatform; label: string }[] = [
  { value: 'intune', label: 'Microsoft Intune' },
  { value: 'jamf', label: 'Jamf Pro' },
  { value: 'workspace-one', label: 'Omnissa (WS1)' },
  { value: 'none', label: 'No MDM' },
  { value: 'other', label: 'Other MDM' },
];

export const DEVICE_VOLUMES: { value: DeviceVolume; label: string }[] = [
  { value: '1-50', label: '1 – 50 devices' },
  { value: '51-250', label: '51 – 250 devices' },
  { value: '251-1000', label: '251 – 1,000 devices' },
  { value: '1000+', label: '1,000+ devices' },
];

export const TIMELINES: { value: DeploymentTimeline; label: string; sublabel: string }[] = [
  { value: 'immediate', label: 'Immediate', sublabel: 'First order within 30 days' },
  { value: '1-3months', label: '1–3 Months', sublabel: 'Scoping in progress' },
  { value: '3-6months', label: '3–6 Months', sublabel: 'Mid-term planning phase' },
  { value: '6months+', label: '6+ Months', sublabel: 'Long-term roadmap item' },
];

export const INTUNE_AUTOPILOT_OWNERS: { value: IntuneAutopilotOwner; label: string; sublabel: string }[] = [
  { value: 'internal-team', label: 'Internal IT Team', sublabel: 'Managed entirely in-house' },
  { value: 'partner', label: 'Managed Service Partner', sublabel: 'Outsourced to an MSP or partner' },
  { value: 'both', label: 'Internal + Partner', sublabel: 'Shared ownership model' },
  { value: 'not-assigned', label: 'Not Yet Assigned', sublabel: 'No clear owner today' },
];

export const PROVISIONING_TIME_OPTIONS: { value: ProvisioningTimeAcceptable; label: string }[] = [
  { value: 'under-15-min', label: 'Under 15 minutes' },
  { value: '15-30-min', label: '15–30 minutes' },
  { value: '30-90-plus-min', label: '30–90+ minutes' },
  { value: 'unvalidated', label: 'Unvalidated — confirm with customer' },
];

export const DEPLOYMENT_MODEL_TYPES: { value: DeploymentModelType; label: string; sublabel: string }[] = [
  { value: 'pilot', label: 'Pilot', sublabel: 'Small-scale proof of concept before wider rollout' },
  { value: 'refresh', label: 'Hardware Refresh', sublabel: 'Replacing existing fleet on a lifecycle cadence' },
  { value: 'new-hire', label: 'New Hire Program', sublabel: 'Ongoing provisioning tied to onboarding' },
  { value: 'ongoing', label: 'Ongoing Deployment', sublabel: 'Continuous, standing deployment model' },
];

export function Step1_CustomerProfile({ profile, discoveryMode, unvalidatedFields, onUpdate, onMarkUnvalidated, onClearUnvalidated, onNext }: Props) {
  const uv = (key: string) => unvalidatedFields.includes(key);
  const answered = (value: unknown, key: string) => isFieldAnswered(value, key, unvalidatedFields);

  const isComplete =
    profile.customerName.trim().length > 0 &&
    profile.opportunityNumber.trim().length > 0 &&
    profile.saName.trim().length > 0 &&
    profile.sellerName.trim().length > 0 &&
    answered(profile.industry, 'customerProfile.industry') &&
    answered(profile.primaryOs, 'customerProfile.primaryOs') &&
    answered(profile.entraJoinType, 'customerProfile.entraJoinType') &&
    answered(profile.coManagementStatus, 'customerProfile.coManagementStatus') &&
    answered(profile.mdmPlatform, 'customerProfile.mdmPlatform') &&
    answered(profile.deviceVolume, 'customerProfile.deviceVolume') &&
    answered(profile.deploymentTimeline, 'customerProfile.deploymentTimeline') &&
    answered(profile.intuneAutopilotOwner, 'customerProfile.intuneAutopilotOwner') &&
    answered(profile.immediateProductivityRequired, 'customerProfile.immediateProductivityRequired') &&
    answered(profile.deploymentModelType, 'customerProfile.deploymentModelType') &&
    answered(profile.multipleDeviceModels, 'customerProfile.multipleDeviceModels');

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
        <div className="form-label">Opportunity Number</div>
        <input
          className="text-input"
          type="text"
          placeholder="e.g. OPP-12345"
          value={profile.opportunityNumber}
          onChange={e => onUpdate({ opportunityNumber: e.target.value })}
        />
      </div>

      <div className="form-section">
        <div className="form-label">SA Name</div>
        <input
          className="text-input"
          type="text"
          placeholder="Solution Architect name"
          value={profile.saName}
          onChange={e => onUpdate({ saName: e.target.value })}
        />
      </div>

      <div className="form-section">
        <div className="form-label">Seller Name</div>
        <input
          className="text-input"
          type="text"
          placeholder="Account Executive name"
          value={profile.sellerName}
          onChange={e => onUpdate({ sellerName: e.target.value })}
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
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: '0 0 8px' }}>
          Select all that apply — customers may have multiple OS platforms in scope.
        </p>
        <div className="option-grid">
          {OS_OPTIONS.map(o => {
            const selected = profile.primaryOs.includes(o.value);
            return (
              <OptionButton
                key={o.value}
                label={o.label}
                sublabel={o.sublabel}
                selected={selected}
                onClick={() => {
                  onUpdate({
                    primaryOs: selected
                      ? profile.primaryOs.filter(v => v !== o.value)
                      : [...profile.primaryOs, o.value],
                  });
                  onClearUnvalidated('customerProfile.primaryOs');
                }}
              />
            );
          })}
          {discoveryMode === 'validation' && (
            <UnvalidatedBtn
              fieldKey="customerProfile.primaryOs"
              unvalidatedFields={unvalidatedFields}
              onMark={onMarkUnvalidated}
              onClear={onClearUnvalidated}
              onNullify={() => onUpdate({ primaryOs: [] })}
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
              type column. Hybrid Entra ID Join (HEID) requires line-of-sight to a domain controller during OOBE.
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
              Is MECM (SCCM) / Microsoft Configuration Manager in use? If co-management is enabled,
              confirm which workloads have been shifted to Intune (Device Configuration,
              Compliance Policies, Endpoint Protection). This affects whether Autopilot can
              take full ownership of the device without MECM (SCCM) dependency.
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
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: '0 0 8px' }}>
          Select all that apply — customers may run multiple MDM platforms simultaneously.
        </p>
        <div className="option-grid">
          {MDM_PLATFORMS.map(m => {
            const selected = profile.mdmPlatform.includes(m.value);
            return (
              <OptionButton
                key={m.value}
                label={m.label}
                selected={selected}
                onClick={() => {
                  onUpdate({
                    mdmPlatform: selected
                      ? profile.mdmPlatform.filter(v => v !== m.value)
                      : [...profile.mdmPlatform, m.value],
                  });
                  onClearUnvalidated('customerProfile.mdmPlatform');
                }}
              />
            );
          })}
          {discoveryMode === 'validation' && (
            <UnvalidatedBtn
              fieldKey="customerProfile.mdmPlatform"
              unvalidatedFields={unvalidatedFields}
              onMark={onMarkUnvalidated}
              onClear={onClearUnvalidated}
              onNullify={() => onUpdate({ mdmPlatform: [] })}
            />
          )}
        </div>
        {uv('customerProfile.mdmPlatform') && <div className="unvalidated-flag">⚠ Unvalidated — confirm with IT team</div>}
      </div>

      <div className="form-section">
        <div className="form-label">Total Devices / Year (In Scope)</div>
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

      {/* Category 1 - Intune/Autopilot Ownership */}
      <h3 className="category-heading">Intune/Autopilot Ownership</h3>

      <div className="form-section">
        <div className="form-label">Who owns and manages your Intune/Autopilot environment?</div>
        <div className="option-grid option-grid--wide">
          {INTUNE_AUTOPILOT_OWNERS.map(o => (
            <OptionButton
              key={o.value}
              label={o.label}
              sublabel={o.sublabel}
              selected={profile.intuneAutopilotOwner === o.value}
              onClick={() => { onUpdate({ intuneAutopilotOwner: o.value }); onClearUnvalidated('customerProfile.intuneAutopilotOwner'); }}
            />
          ))}
          {discoveryMode === 'validation' && (
            <UnvalidatedBtn
              fieldKey="customerProfile.intuneAutopilotOwner"
              unvalidatedFields={unvalidatedFields}
              onMark={onMarkUnvalidated}
              onClear={onClearUnvalidated}
              onNullify={() => onUpdate({ intuneAutopilotOwner: null })}
            />
          )}
        </div>
        {uv('customerProfile.intuneAutopilotOwner') && <div className="unvalidated-flag">⚠ Unvalidated — confirm with IT team</div>}
      </div>

      {/* Category 7 - User Experience Expectations */}
      <h3 className="category-heading">User Experience Expectations</h3>

      <TextField
        label="What is the desired end-user experience upon first login?"
        value={profile.desiredFirstLoginExperience}
        placeholder="e.g. Sign in, land on desktop with apps ready, no manual setup steps"
        fieldKey="customerProfile.desiredFirstLoginExperience"
        discoveryMode={discoveryMode}
        unvalidatedFields={unvalidatedFields}
        onChange={v => onUpdate({ desiredFirstLoginExperience: v })}
        onMarkUnvalidated={onMarkUnvalidated}
        onClearUnvalidated={onClearUnvalidated}
        multiline
      />

      <YesNoField
        label="Should the user be productive immediately after signing in?"
        value={profile.immediateProductivityRequired}
        fieldKey="customerProfile.immediateProductivityRequired"
        discoveryMode={discoveryMode}
        unvalidatedFields={unvalidatedFields}
        onChange={v => onUpdate({ immediateProductivityRequired: v })}
        onMarkUnvalidated={onMarkUnvalidated}
        onClearUnvalidated={onClearUnvalidated}
        yesLabel="Yes — immediate productivity required"
        noLabel="No — some setup time is acceptable"
      />

      <TextField
        label="Are there specific applications that must be available on day one?"
        value={profile.day1RequiredApps}
        placeholder="e.g. Outlook, Teams, line-of-business ERP client"
        fieldKey="customerProfile.day1RequiredApps"
        discoveryMode={discoveryMode}
        unvalidatedFields={unvalidatedFields}
        onChange={v => onUpdate({ day1RequiredApps: v })}
        onMarkUnvalidated={onMarkUnvalidated}
        onClearUnvalidated={onClearUnvalidated}
        multiline
      />

      <div className="form-section">
        <div className="form-label">What provisioning time is acceptable to the business?</div>
        <div className="option-grid">
          {PROVISIONING_TIME_OPTIONS.map(o => (
            <OptionButton
              key={o.value}
              label={o.label}
              selected={profile.acceptableDeploymentTime === o.value}
              variant={o.value === 'unvalidated' ? 'unvalidated' : undefined}
              sublabel={o.value === 'unvalidated' ? 'Flag for follow-up before ordering' : undefined}
              onClick={() => {
                onUpdate({ acceptableDeploymentTime: o.value });
                // "Unvalidated" is a real option here (not just a validation-mode toggle), so it
                // must also land in unvalidatedFields to surface as a roadmap blocker.
                if (o.value === 'unvalidated') onMarkUnvalidated('customerProfile.acceptableDeploymentTime');
                else onClearUnvalidated('customerProfile.acceptableDeploymentTime');
              }}
            />
          ))}
        </div>
        {uv('customerProfile.acceptableDeploymentTime') && (
          <div className="unvalidated-flag">⚠ Unvalidated — confirm with customer</div>
        )}
      </div>

      <TextField
        label="What issues are users experiencing with the current process?"
        value={profile.currentProcessIssues}
        placeholder="e.g. Long help desk wait times, inconsistent builds, delayed shipments"
        fieldKey="customerProfile.currentProcessIssues"
        discoveryMode={discoveryMode}
        unvalidatedFields={unvalidatedFields}
        onChange={v => onUpdate({ currentProcessIssues: v })}
        onMarkUnvalidated={onMarkUnvalidated}
        onClearUnvalidated={onClearUnvalidated}
        multiline
      />

      {/* Category 8 - Scale & Operational Planning */}
      <h3 className="category-heading">Scale & Operational Planning</h3>

      <TextField
        label="How many devices will be deployed per month/quarter?"
        value={profile.devicesPerMonthQuarter}
        placeholder="e.g. 50 devices/month"
        fieldKey="customerProfile.devicesPerMonthQuarter"
        discoveryMode={discoveryMode}
        unvalidatedFields={unvalidatedFields}
        onChange={v => onUpdate({ devicesPerMonthQuarter: v })}
        onMarkUnvalidated={onMarkUnvalidated}
        onClearUnvalidated={onClearUnvalidated}
      />

      <div className="form-section">
        <div className="form-label">Is this a pilot, refresh, new hire program, or ongoing deployment model?</div>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: '0 0 8px' }}>
          Select all that apply — customers may have multiple concurrent deployment scenarios
          (e.g. a hardware refresh running alongside a new hire program).
        </p>
        <div className="option-grid option-grid--wide">
          {DEPLOYMENT_MODEL_TYPES.map(d => {
            const selected = profile.deploymentModelType.includes(d.value);
            return (
              <OptionButton
                key={d.value}
                label={d.label}
                sublabel={d.sublabel}
                selected={selected}
                onClick={() => {
                  onUpdate({
                    deploymentModelType: selected
                      ? profile.deploymentModelType.filter(v => v !== d.value)
                      : [...profile.deploymentModelType, d.value],
                  });
                  onClearUnvalidated('customerProfile.deploymentModelType');
                }}
              />
            );
          })}
          {discoveryMode === 'validation' && (
            <UnvalidatedBtn
              fieldKey="customerProfile.deploymentModelType"
              unvalidatedFields={unvalidatedFields}
              onMark={onMarkUnvalidated}
              onClear={onClearUnvalidated}
              onNullify={() => onUpdate({ deploymentModelType: [] })}
            />
          )}
        </div>
        {uv('customerProfile.deploymentModelType') && <div className="unvalidated-flag">⚠ Unvalidated — confirm with IT team</div>}
      </div>

      <YesNoField
        label="Are multiple device models involved?"
        value={profile.multipleDeviceModels}
        fieldKey="customerProfile.multipleDeviceModels"
        discoveryMode={discoveryMode}
        unvalidatedFields={unvalidatedFields}
        onChange={v => onUpdate({ multipleDeviceModels: v })}
        onMarkUnvalidated={onMarkUnvalidated}
        onClearUnvalidated={onClearUnvalidated}
        yesLabel="Yes — multiple models"
        noLabel="No — single model"
      />

      <TextField
        label="Contact information for the first-article/test deployment before scaling"
        value={profile.firstArticleContact}
        placeholder="e.g. Jane Doe, IT Manager, jane.doe@customer.com"
        fieldKey="customerProfile.firstArticleContact"
        discoveryMode={discoveryMode}
        unvalidatedFields={unvalidatedFields}
        onChange={v => onUpdate({ firstArticleContact: v })}
        onMarkUnvalidated={onMarkUnvalidated}
        onClearUnvalidated={onClearUnvalidated}
      />

      <TextField
        label="What constitutes success for the pilot?"
        value={profile.pilotSuccessCriteria}
        placeholder="e.g. Zero help desk tickets on first boot, devices provisioned within end-user expectations"
        fieldKey="customerProfile.pilotSuccessCriteria"
        discoveryMode={discoveryMode}
        unvalidatedFields={unvalidatedFields}
        onChange={v => onUpdate({ pilotSuccessCriteria: v })}
        onMarkUnvalidated={onMarkUnvalidated}
        onClearUnvalidated={onClearUnvalidated}
        multiline
      />

      <div className="step-actions">
        <button className="btn-primary" onClick={onNext} disabled={!isComplete}>
          Continue to Readiness Gate →
        </button>
      </div>
    </div>
  );
}
