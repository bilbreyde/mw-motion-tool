import { ConversationalMessage } from '../ConversationalMessage';
import { OptionButton } from '../OptionButton';
import type { CustomerProfile, ReadinessCheck, DiscoveryMode, AutopilotProfileType } from '../../types';

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

const AUTOPILOT_PROFILES: { value: AutopilotProfileType; label: string; sublabel: string }[] = [
  { value: 'user-driven-aadj', label: 'User-Driven — Azure AD Join', sublabel: 'Device joins Entra ID during OOBE; no DC line-of-sight required' },
  { value: 'user-driven-haadj', label: 'User-Driven — Hybrid AAD Join', sublabel: 'Domain joins on-prem AD + registers Entra ID; requires DC connectivity' },
  { value: 'pre-provisioning', label: 'Pre-Provisioning (White Glove)', sublabel: 'Technician phase completes configuration before end-user OOBE' },
  { value: 'self-deploying', label: 'Self-Deploying', sublabel: 'Zero-touch; device enrolls and configures with no user interaction' },
];

export function Step2_ReadinessGate({
  discoveryMode, unvalidatedFields,
  readiness, onUpdate, onMarkUnvalidated, onClearUnvalidated, onNext, onRouteToProServices
}: Props) {
  const uvAutopilot = unvalidatedFields.includes('readinessCheck.autopilotReady');
  const uvIntune = unvalidatedFields.includes('readinessCheck.intuneReady');

  const autopilotAnswered = readiness.autopilotReady !== null || uvAutopilot;
  const intuneAnswered = readiness.intuneReady !== null || uvIntune;
  const bothAnswered = autopilotAnswered && intuneAnswered;

  const definitivelyBlockedAutopilot = readiness.autopilotReady === false && !uvAutopilot;
  const definitivelyBlockedIntune = readiness.intuneReady === false && !uvIntune;
  const blocked = definitivelyBlockedAutopilot || definitivelyBlockedIntune;

  const hasUnvalidated = uvAutopilot || uvIntune;
  const canProceed = bothAnswered && !blocked;

  function handleAutopilot(value: boolean) {
    onUpdate({ autopilotReady: value, autopilotProfileType: value ? readiness.autopilotProfileType : null });
    onClearUnvalidated('readinessCheck.autopilotReady');
  }

  function handleIntune(value: boolean) {
    onUpdate({ intuneReady: value });
    onClearUnvalidated('readinessCheck.intuneReady');
  }

  function handleAutopilotUnvalidated() {
    if (uvAutopilot) {
      onClearUnvalidated('readinessCheck.autopilotReady');
    } else {
      onUpdate({ autopilotReady: null, autopilotProfileType: null });
      onMarkUnvalidated('readinessCheck.autopilotReady');
    }
  }

  function handleIntuneUnvalidated() {
    if (uvIntune) {
      onClearUnvalidated('readinessCheck.intuneReady');
    } else {
      onUpdate({ intuneReady: null });
      onMarkUnvalidated('readinessCheck.intuneReady');
    }
  }

  return (
    <div className="step-container">
      <ConversationalMessage>
        {discoveryMode === 'live' ? (
          <p>
            Confirm Autopilot and Intune production readiness directly with the customer's IT team.
            Do not accept verbal confirmation alone — request evidence: exported Autopilot enrollment
            profiles, Intune device compliance reports, or enrollment profile screenshots.
            If they cannot produce evidence, the answer is No.
          </p>
        ) : (
          <p>
            Validate Autopilot and Intune readiness from the materials provided by the account team.
            If readiness cannot be confirmed from the available information, flag both items as
            Unvalidated. Do not proceed to ordering on unvalidated readiness.
          </p>
        )}
      </ConversationalMessage>

      <div className="form-section">
        <div className="form-label">Windows Autopilot — Production Status</div>
        <ConversationalMessage>
          {discoveryMode === 'live' ? (
            <p>
              Is Windows Autopilot currently configured with active enrollment profiles in the
              customer's Entra ID tenant? Verify in <strong>Intune admin center → Devices →
              Windows → Windows enrollment → Deployment Profiles</strong>. At least one
              profile must be assigned and devices must be actively enrolling — not just
              created or in pilot.
            </p>
          ) : (
            <p>
              Based on seller-provided notes: is Autopilot confirmed as production-active with
              assigned enrollment profiles? If unclear, flag as unvalidated.
            </p>
          )}
        </ConversationalMessage>
        <div className="option-grid">
          <OptionButton
            label="Yes — Autopilot is production-active"
            sublabel="Enrollment profiles assigned; devices actively enrolling"
            selected={readiness.autopilotReady === true}
            onClick={() => handleAutopilot(true)}
            variant="yes"
          />
          <OptionButton
            label="No — Not configured or not in production"
            sublabel="Profile exists but not deployed, or Autopilot not set up"
            selected={readiness.autopilotReady === false}
            onClick={() => handleAutopilot(false)}
            variant="no"
          />
          {discoveryMode === 'validation' && (
            <button
              className={`option-btn option-btn--unvalidated ${uvAutopilot ? 'option-btn--selected' : ''}`}
              onClick={handleAutopilotUnvalidated}
            >
              <span className="option-label">Unvalidated — confirm with customer</span>
              <span className="option-sublabel">Flag for follow-up before ordering</span>
            </button>
          )}
        </div>
        {uvAutopilot && <div className="unvalidated-flag">⚠ Unvalidated — Autopilot status must be confirmed before ordering</div>}
      </div>

      {readiness.autopilotReady === true && (
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

      <div className="form-section">
        <div className="form-label">Intune / MDM — Production Compliance Status</div>
        <ConversationalMessage>
          {discoveryMode === 'live' ? (
            <p>
              Is Microsoft Intune (or the customer's MDM) actively managing devices with enforced
              compliance policies? Verify in <strong>Intune admin center → Devices → Compliance
              policies</strong> — policies must be assigned, not just created.
              Check <strong>Devices → Monitor → Noncompliant devices</strong> to confirm enforcement
              is active. Co-managed environments: confirm the Compliance workload is set to Intune.
            </p>
          ) : (
            <p>
              Based on seller-provided notes: is Intune confirmed as managing devices with active,
              enforced compliance policies? If this cannot be confirmed, flag as unvalidated.
            </p>
          )}
        </ConversationalMessage>
        <div className="option-grid">
          <OptionButton
            label="Yes — MDM managing devices with active compliance"
            sublabel="Compliance policies assigned and enforced in production"
            selected={readiness.intuneReady === true}
            onClick={() => handleIntune(true)}
            variant="yes"
          />
          <OptionButton
            label="No — MDM not managing or policies not enforced"
            sublabel="Evaluation mode, pilot, no policies, or compliance workload not shifted"
            selected={readiness.intuneReady === false}
            onClick={() => handleIntune(false)}
            variant="no"
          />
          {discoveryMode === 'validation' && (
            <button
              className={`option-btn option-btn--unvalidated ${uvIntune ? 'option-btn--selected' : ''}`}
              onClick={handleIntuneUnvalidated}
            >
              <span className="option-label">Unvalidated — confirm with customer</span>
              <span className="option-sublabel">Flag for follow-up before ordering</span>
            </button>
          )}
        </div>
        {uvIntune && <div className="unvalidated-flag">⚠ Unvalidated — Intune compliance status must be confirmed before ordering</div>}
      </div>

      {blocked && (
        <>
          <div className="alert-card alert-card--danger">
            <div className="alert-title">Readiness Gate — BLOCKED</div>
            <div className="alert-body">
              {definitivelyBlockedAutopilot && definitivelyBlockedIntune
                ? 'Both Autopilot and Intune/MDM must be in production before proceeding with a standard Digital Workplace motion.'
                : definitivelyBlockedAutopilot
                ? 'Autopilot must be production-active with assigned enrollment profiles before standard provisioning can be scoped.'
                : 'Intune must be managing devices with enforced compliance policies before standard provisioning can be scoped.'}
              <br /><br />
              <strong>SA action:</strong> Document the readiness gaps identified and recommend a
              Zones Digital Workplace Pro Services readiness engagement to the account team.
              Do not scope provisioning services until these gaps are remediated.
            </div>
          </div>
          <div className="step-actions">
            <button className="btn-primary" onClick={onRouteToProServices}>
              Document Gap — Route to Pro Services →
            </button>
          </div>
        </>
      )}

      {canProceed && hasUnvalidated && (
        <div className="alert-card alert-card--warning">
          <div className="alert-title">Proceeding with Unvalidated Readiness Items</div>
          <div className="alert-body">
            One or more readiness fields are unvalidated. You may continue scoping, but{' '}
            <strong>no device order can be placed until readiness is confirmed</strong> directly
            with the customer's IT team. Unvalidated items will appear as blockers in the roadmap.
          </div>
        </div>
      )}

      {canProceed && !hasUnvalidated && (
        <div className="alert-card alert-card--success">
          <div className="alert-title">Readiness Gate — PASSED</div>
          <div className="alert-body">
            Autopilot and Intune/MDM confirmed production-ready. Proceeding to deployment model selection.
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
