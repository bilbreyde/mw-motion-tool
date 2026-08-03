import type { ReactNode } from 'react';
import { ConversationalMessage } from '../ConversationalMessage';
import { OptionButton } from '../OptionButton';
import { YesNoField } from '../YesNoField';
import { TextField } from '../TextField';
import type { CustomerProfile, ReadinessCheck, DiscoveryMode, AutopilotProfileType, ProvisioningPreference } from '../../types';

interface Props {
  profile: CustomerProfile;
  discoveryMode: DiscoveryMode;
  unvalidatedFields: string[];
  readiness: ReadinessCheck;
  onUpdate: (updates: Partial<ReadinessCheck>) => void;
  onMarkUnvalidated: (fieldKey: string) => void;
  onClearUnvalidated: (fieldKey: string) => void;
  onNext: () => void;
  onRouteToProServices: () => void;
}

export const AUTOPILOT_PROFILES: { value: AutopilotProfileType; label: string; sublabel: string }[] = [
  { value: 'user-driven-aadj', label: 'User-Driven — Azure AD Join', sublabel: 'Device joins Entra ID during OOBE; no DC line-of-sight required' },
  { value: 'user-driven-haadj', label: 'User-Driven — Hybrid AAD Join', sublabel: 'Domain joins on-prem AD + registers Entra ID; requires DC connectivity' },
  { value: 'pre-provisioning', label: 'Pre-Provisioning (White Glove)', sublabel: 'Technician phase completes configuration before end-user OOBE' },
  { value: 'self-deploying', label: 'Self-Deploying', sublabel: 'Zero-touch; device enrolls and configures with no user interaction' },
];

export const PROVISIONING_PREFERENCES: { value: ProvisioningPreference; label: string; sublabel: string }[] = [
  { value: 'standard', label: 'Standard Provisioned', sublabel: 'Device ships as-is; Autopilot completes configuration at the customer site' },
  { value: 'pre-provisioned', label: 'Pre-Provisioned', sublabel: 'Zones TSC completes technician-phase configuration before shipment' },
];

interface GateQuestion {
  key: keyof ReadinessCheck & (
    'intuneProductionReady' | 'autopilotConfiguredTested' | 'enrollmentProfilesDefined' |
    'groupTagsDefined' | 'applicationsPackagedTested' | 'firstArticlePlanned' | 'ownershipAssigned'
  );
  label: string;
  liveCopy: ReactNode;
  validationCopy: ReactNode;
  yesLabel: string;
  noLabel: string;
}

const GATE_QUESTIONS: GateQuestion[] = [
  {
    key: 'intuneProductionReady',
    label: '1. Is Intune production-ready?',
    liveCopy: 'Verify in Intune admin center → Devices → Compliance policies that policies are assigned and enforced, not just created. Co-managed environments: confirm the Compliance workload is set to Intune.',
    validationCopy: 'Based on seller-provided notes: is Intune confirmed production-ready? If unclear, flag as unvalidated.',
    yesLabel: 'Yes — Intune is production-ready',
    noLabel: 'No — not production-ready',
  },
  {
    key: 'autopilotConfiguredTested',
    label: '2. Is Autopilot configured and tested?',
    liveCopy: 'Verify in Intune admin center → Devices → Windows → Windows enrollment → Deployment Profiles. At least one profile must be assigned and devices must be actively enrolling — not just created or in pilot.',
    validationCopy: 'Based on seller-provided notes: is Autopilot confirmed as configured and tested? If unclear, flag as unvalidated.',
    yesLabel: 'Yes — configured and tested',
    noLabel: 'No — not configured or not tested',
  },
  {
    key: 'enrollmentProfilesDefined',
    label: '3. Are enrollment profiles defined?',
    liveCopy: 'Confirm deployment profiles exist and are assigned to the correct dynamic device groups for the devices in scope.',
    validationCopy: 'Based on seller-provided notes: are enrollment profiles confirmed as defined? If unclear, flag as unvalidated.',
    yesLabel: 'Yes — enrollment profiles defined',
    noLabel: 'No — not yet defined',
  },
  {
    key: 'groupTagsDefined',
    label: '4. Are Group Tags defined?',
    liveCopy: 'Confirm Group Tag values exist and are documented for dynamic group targeting and profile assignment.',
    validationCopy: 'Based on seller-provided notes: are Group Tags confirmed as defined? If unclear, flag as unvalidated.',
    yesLabel: 'Yes — Group Tags defined',
    noLabel: 'No — not yet defined',
  },
  {
    key: 'applicationsPackagedTested',
    label: '5. Are required applications packaged and tested?',
    liveCopy: 'Confirm all required applications are packaged in Intune (Win32, MSIX, or store apps) and have been validated to install successfully during OOBE / ESP.',
    validationCopy: 'Based on seller-provided notes: are required applications confirmed as packaged and tested? If unclear, flag as unvalidated.',
    yesLabel: 'Yes — packaged and tested',
    noLabel: 'No — not packaged or not tested',
  },
  {
    key: 'firstArticlePlanned',
    label: '6. Has a first-article deployment been planned?',
    liveCopy: 'Confirm a first-article test deployment has been scoped — including who validates it and what acceptance criteria will be used before scaling.',
    validationCopy: 'Based on seller-provided notes: has a first-article deployment been confirmed as planned? If unclear, flag as unvalidated.',
    yesLabel: 'Yes — first article planned',
    noLabel: 'No — not yet planned',
  },
  {
    key: 'ownershipAssigned',
    label: '7. Has ownership been assigned for ongoing Intune management?',
    liveCopy: 'Confirm a named owner (internal team or partner) is accountable for Intune/Autopilot administration after go-live.',
    validationCopy: 'Based on seller-provided notes: has ongoing ownership been confirmed as assigned? If unclear, flag as unvalidated.',
    yesLabel: 'Yes — ownership assigned',
    noLabel: 'No — not yet assigned',
  },
];

export function Step2_ReadinessGate({
  discoveryMode, unvalidatedFields,
  readiness, onUpdate, onMarkUnvalidated, onClearUnvalidated, onNext, onRouteToProServices
}: Props) {
  const uv = (k: string) => unvalidatedFields.includes(k);

  const gateAnswered = GATE_QUESTIONS.every(g => readiness[g.key] !== null || uv(`readinessCheck.${g.key}`));
  const failedGates = GATE_QUESTIONS.filter(g => readiness[g.key] === false && !uv(`readinessCheck.${g.key}`));
  const blocked = failedGates.length > 0;
  const gatesUnvalidatedCount = GATE_QUESTIONS.filter(g => uv(`readinessCheck.${g.key}`)).length;
  const gatesPassed = gateAnswered && !blocked;

  const category2Keys: (keyof ReadinessCheck)[] = [
    'deploymentProfilesValidated', 'deviceGroupsConfigured', 'groupTagsRequired', 'espConfigured', 'enrollmentRestrictionsExist',
  ];
  const category2Answered = category2Keys.every(k => readiness[k] !== null || uv(`readinessCheck.${k}`))
    && (readiness.provisioningPreference !== null || uv('readinessCheck.provisioningPreference'));

  const canProceed = gatesPassed && category2Answered;

  return (
    <div className="step-container">
      <ConversationalMessage>
        {discoveryMode === 'live' ? (
          <p>
            Confirm all seven readiness gates directly with the customer's IT team. Do not accept
            verbal confirmation alone — request evidence: exported Autopilot enrollment profiles,
            Intune device compliance reports, application packaging records, or enrollment profile
            screenshots. If they cannot produce evidence, the answer is No.
          </p>
        ) : (
          <p>
            Validate all seven readiness gates from the materials provided by the account team.
            If any gate cannot be confirmed from the available information, flag it as Unvalidated.
            Do not proceed to ordering on unvalidated readiness.
          </p>
        )}
      </ConversationalMessage>

      <div className="alert-card alert-card--info" style={{ marginBottom: 8 }}>
        <div className="alert-title">Step 2 Readiness Gate — All Seven Must Be Yes</div>
        <div className="alert-body">
          These are the official Zones Digital Workplace qualification criteria for Autopilot
          pre-provisioning. If any answer is No, stop — do not scope provisioning services.
          Document the gap and route to the Autopilot/Intune Professional Services engagement.
          No exceptions.
        </div>
      </div>

      {GATE_QUESTIONS.map(g => (
        <YesNoField
          key={g.key}
          label={g.label}
          liveCopy={g.liveCopy}
          validationCopy={g.validationCopy}
          value={readiness[g.key] as boolean | null}
          fieldKey={`readinessCheck.${g.key}`}
          discoveryMode={discoveryMode}
          unvalidatedFields={unvalidatedFields}
          onChange={v => onUpdate({ [g.key]: v } as Partial<ReadinessCheck>)}
          onMarkUnvalidated={onMarkUnvalidated}
          onClearUnvalidated={onClearUnvalidated}
          yesLabel={g.yesLabel}
          noLabel={g.noLabel}
          unvalidatedFlagText="Unvalidated — must be confirmed before ordering"
        />
      ))}

      {blocked && (
        <>
          <div className="alert-card alert-card--danger">
            <div className="alert-title">Readiness Gate — BLOCKED</div>
            <div className="alert-body">
              The following gate{failedGates.length > 1 ? 's' : ''} failed: {failedGates.map(g => g.label.replace(/^\d+\.\s*/, '')).join('; ')}
              <br /><br />
              <strong>SA action:</strong> Document the readiness gaps identified and recommend a
              Zones Digital Workplace Autopilot/Intune Professional Services readiness engagement
              to the account team. Do not scope provisioning services until these gaps are remediated.
            </div>
          </div>
          <div className="step-actions">
            <button className="btn-primary" onClick={onRouteToProServices}>
              Document Gap — Route to Pro Services →
            </button>
          </div>
        </>
      )}

      {gatesPassed && (
        <>
          <h3 className="category-heading">Autopilot Configuration Detail</h3>

          {readiness.autopilotConfiguredTested === true && (
            <div className="form-section">
              <div className="form-label">Autopilot Deployment Profile Type</div>
              <ConversationalMessage>
                <p>
                  Which Autopilot profile type is configured? This determines provisioning model
                  compatibility. Pre-Provisioning requires Zones TSC technician access during the
                  White Glove phase. Hybrid AADJ requires domain controller connectivity at imaging time.
                </p>
              </ConversationalMessage>
              <div className="option-grid option-grid--wide">
                {AUTOPILOT_PROFILES.map(p => (
                  <OptionButton
                    key={p.value}
                    label={p.label}
                    sublabel={p.sublabel}
                    selected={readiness.autopilotProfileType === p.value}
                    onClick={() => onUpdate({ autopilotProfileType: p.value })}
                  />
                ))}
              </div>
            </div>
          )}

          <YesNoField
            label="Have Autopilot deployment profiles been created and validated?"
            value={readiness.deploymentProfilesValidated}
            fieldKey="readinessCheck.deploymentProfilesValidated"
            discoveryMode={discoveryMode}
            unvalidatedFields={unvalidatedFields}
            onChange={v => onUpdate({ deploymentProfilesValidated: v })}
            onMarkUnvalidated={onMarkUnvalidated}
            onClearUnvalidated={onClearUnvalidated}
            yesLabel="Yes — created and validated"
            noLabel="No — not yet validated"
          />

          <YesNoField
            label="Are device groups and dynamic group assignments configured?"
            value={readiness.deviceGroupsConfigured}
            fieldKey="readinessCheck.deviceGroupsConfigured"
            discoveryMode={discoveryMode}
            unvalidatedFields={unvalidatedFields}
            onChange={v => onUpdate({ deviceGroupsConfigured: v })}
            onMarkUnvalidated={onMarkUnvalidated}
            onClearUnvalidated={onClearUnvalidated}
            yesLabel="Yes — configured"
            noLabel="No — not yet configured"
          />

          <YesNoField
            label="Are Group Tags required for deployment?"
            value={readiness.groupTagsRequired}
            fieldKey="readinessCheck.groupTagsRequired"
            discoveryMode={discoveryMode}
            unvalidatedFields={unvalidatedFields}
            onChange={v => onUpdate({ groupTagsRequired: v })}
            onMarkUnvalidated={onMarkUnvalidated}
            onClearUnvalidated={onClearUnvalidated}
            yesLabel="Yes — required"
            noLabel="No — not required"
          />

          <YesNoField
            label="Have Enrollment Status Pages (ESP) been configured?"
            value={readiness.espConfigured}
            fieldKey="readinessCheck.espConfigured"
            discoveryMode={discoveryMode}
            unvalidatedFields={unvalidatedFields}
            onChange={v => onUpdate({ espConfigured: v })}
            onMarkUnvalidated={onMarkUnvalidated}
            onClearUnvalidated={onClearUnvalidated}
            yesLabel="Yes — ESP configured"
            noLabel="No — not configured"
          />

          <YesNoField
            label="Are there any enrollment restrictions or Conditional Access policies that could impact provisioning?"
            value={readiness.enrollmentRestrictionsExist}
            fieldKey="readinessCheck.enrollmentRestrictionsExist"
            discoveryMode={discoveryMode}
            unvalidatedFields={unvalidatedFields}
            onChange={v => onUpdate({ enrollmentRestrictionsExist: v })}
            onMarkUnvalidated={onMarkUnvalidated}
            onClearUnvalidated={onClearUnvalidated}
            yesLabel="Yes — restrictions exist"
            noLabel="No — no restrictions"
          />

          {readiness.enrollmentRestrictionsExist === true && (
            <TextField
              label="Describe the enrollment restrictions or Conditional Access policies"
              value={readiness.enrollmentRestrictionsDetail}
              placeholder="e.g. CA policy blocks enrollment from untrusted networks; device limit restrictions"
              fieldKey="readinessCheck.enrollmentRestrictionsDetail"
              discoveryMode={discoveryMode}
              unvalidatedFields={unvalidatedFields}
              onChange={v => onUpdate({ enrollmentRestrictionsDetail: v })}
              onMarkUnvalidated={onMarkUnvalidated}
              onClearUnvalidated={onClearUnvalidated}
              multiline
            />
          )}

          <div className="form-section">
            <div className="form-label">Will devices be standard provisioned or pre-provisioned?</div>
            <div className="option-grid option-grid--wide">
              {PROVISIONING_PREFERENCES.map(p => (
                <OptionButton
                  key={p.value}
                  label={p.label}
                  sublabel={p.sublabel}
                  selected={readiness.provisioningPreference === p.value}
                  onClick={() => { onUpdate({ provisioningPreference: p.value }); onClearUnvalidated('readinessCheck.provisioningPreference'); }}
                />
              ))}
            </div>
            {uv('readinessCheck.provisioningPreference') && <div className="unvalidated-flag">⚠ Unvalidated — confirm with IT team</div>}
          </div>
        </>
      )}

      {canProceed && (gatesUnvalidatedCount > 0) && (
        <div className="alert-card alert-card--warning">
          <div className="alert-title">Proceeding with Unvalidated Readiness Items</div>
          <div className="alert-body">
            One or more readiness gates are unvalidated. You may continue scoping, but{' '}
            <strong>no device order can be placed until readiness is confirmed</strong> directly
            with the customer's IT team. Unvalidated items will appear as blockers in the roadmap.
          </div>
        </div>
      )}

      {canProceed && gatesUnvalidatedCount === 0 && (
        <div className="alert-card alert-card--success">
          <div className="alert-title">Readiness Gate — PASSED</div>
          <div className="alert-body">
            All seven readiness gates confirmed. Proceeding to deployment model selection.
          </div>
        </div>
      )}

      {canProceed && (
        <div className="step-actions">
          <button className="btn-primary" onClick={onNext}>
            Continue to Deployment Model →
          </button>
        </div>
      )}
    </div>
  );
}
