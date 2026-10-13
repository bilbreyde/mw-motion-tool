import type {
  FaIntake, FaRegistrationOwner, FaProvisioningType, FaCurrentRuntime, FaRuntimeSource,
  DiscoveryMode,
} from '../../types';
import { ConversationalMessage } from '../ConversationalMessage';

interface Props {
  intake: FaIntake;
  discoveryMode: DiscoveryMode;
  unvalidatedFields: string[];
  onUpdate: (updates: Partial<FaIntake>) => void;
  onMarkUnvalidated: (key: string) => void;
  onClearUnvalidated: (key: string) => void;
  onNext: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fieldKey(name: string) {
  return `faIntake.${name}`;
}

interface YesNoProps {
  fieldName: string;
  value: boolean | null;
  discoveryMode: DiscoveryMode;
  unvalidatedFields: string[];
  onChange: (v: boolean) => void;
  onMarkUnvalidated: (key: string) => void;
  onClearUnvalidated: (key: string) => void;
}

function YesNoField({
  fieldName, value, discoveryMode, unvalidatedFields,
  onChange, onMarkUnvalidated, onClearUnvalidated,
}: YesNoProps) {
  const key = fieldKey(fieldName);
  const isUV = unvalidatedFields.includes(key);

  function handleChange(v: boolean) {
    onChange(v);
    onClearUnvalidated(key);
  }

  function handleUV() {
    if (isUV) {
      onClearUnvalidated(key);
    } else {
      onMarkUnvalidated(key);
    }
  }

  return (
    <div className="radio-group">
      <label className={`radio-option${value === true && !isUV ? ' radio-option--selected' : ''}`}>
        <input
          type="radio"
          checked={value === true && !isUV}
          onChange={() => handleChange(true)}
        />
        Yes
      </label>
      <label className={`radio-option${value === false && !isUV ? ' radio-option--selected' : ''}`}>
        <input
          type="radio"
          checked={value === false && !isUV}
          onChange={() => handleChange(false)}
        />
        No
      </label>
      {discoveryMode === 'validation' && (
        <label className={`radio-option radio-option--unvalidated${isUV ? ' radio-option--selected' : ''}`}>
          <input type="radio" checked={isUV} onChange={handleUV} />
          Unvalidated
        </label>
      )}
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const REGISTRATION_OWNERS: { value: FaRegistrationOwner; label: string }[] = [
  { value: 'oem', label: 'OEM Direct' },
  { value: 'zones', label: 'Zones (CSV / Partner Center)' },
  { value: 'customer', label: 'Customer (manual or reseller CSV)' },
  { value: 'unknown', label: 'Unknown — needs confirmation' },
];

export const PROVISIONING_TYPES: { value: FaProvisioningType; label: string; desc: string }[] = [
  { value: 'provisioning', label: 'User-Driven Provisioning', desc: 'Standard OOBE — user drives enrollment at first sign-in.' },
  { value: 'pre-provisioning', label: 'Pre-Provisioning (White Glove)', desc: 'Zones TSC pre-provisions the device; user completes at first sign-in.' },
  { value: 'evaluate-both', label: 'Evaluate Both', desc: 'SA will assess current runtime and make a recommendation.' },
];

export const RUNTIME_OPTIONS: { value: FaCurrentRuntime; label: string }[] = [
  { value: 'under-15', label: 'Under 15 minutes' },
  { value: '16-30', label: '16–30 minutes' },
  { value: '31-90-plus', label: '31–90+ minutes' },
  { value: 'unknown', label: 'Unknown' },
];

export const RUNTIME_SOURCE_OPTIONS: { value: FaRuntimeSource; label: string }[] = [
  { value: 'apps', label: 'Application installs' },
  { value: 'security', label: 'Security agent deployment' },
  { value: 'policies', label: 'Policy application' },
  { value: 'updates', label: 'Windows Updates' },
  { value: 'drivers', label: 'Driver installations' },
  { value: 'restarts', label: 'Required restarts' },
  { value: 'unknown', label: 'Unknown / not measured' },
];

export const TSC_SERVICES: string[] = [
  'Clean Image',
  'Asset Tagging',
  'Custom Labels',
  'OS Updates Pre-Ship',
  'Kitting',
  'Custom Packaging',
];

// ── Completion check ──────────────────────────────────────────────────────────

export function faIntakeComplete(intake: FaIntake, uv: string[]): boolean {
  const answered = (val: unknown, name: string) =>
    val !== null && val !== undefined || uv.includes(fieldKey(name));
  const answeredArr = (val: unknown[], name: string) =>
    val.length > 0 || uv.includes(fieldKey(name));
  const answeredStr = (val: string, name: string) =>
    val.trim().length > 0 || uv.includes(fieldKey(name));

  // If environment is not operational, SA can only proceed to Provisioning motion — not continue FA intake.
  // We block the "Next" button entirely in that case so no partial completion is needed.
  if (intake.environmentOperational === false) return false;
  if (!answered(intake.environmentOperational, 'environmentOperational')) return false;

  return (
    answered(intake.registrationOwner, 'registrationOwner') &&
    answeredStr(intake.hardwareModel, 'hardwareModel') &&
    answeredStr(intake.deviceSku, 'deviceSku') &&
    answeredStr(intake.deviceQuantity, 'deviceQuantity') &&
    answered(intake.zonesAuthorizationCompleted, 'zonesAuthorizationCompleted') &&
    answered(intake.provisioningType, 'provisioningType') &&
    answeredStr(intake.acceptanceDefinition, 'acceptanceDefinition') &&
    answered(intake.currentRuntime, 'currentRuntime') &&
    answeredArr(intake.runtimeSources, 'runtimeSources') &&
    answeredStr(intake.testerContact, 'testerContact') &&
    answeredStr(intake.approverContact, 'approverContact') &&
    answered(intake.customerHasExistingInstructions, 'customerHasExistingInstructions')
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FaStep2_Intake({
  intake, discoveryMode, unvalidatedFields,
  onUpdate, onMarkUnvalidated, onClearUnvalidated, onNext,
}: Props) {
  const uv = unvalidatedFields;
  const isUV = (name: string) => uv.includes(fieldKey(name));
  const canProceed = faIntakeComplete(intake, uv);
  const envNotOperational = intake.environmentOperational === false && !isUV('environmentOperational');

  function toggleRuntimeSource(source: FaRuntimeSource) {
    const current = intake.runtimeSources;
    const next = current.includes(source)
      ? current.filter(s => s !== source)
      : [...current, source];
    onUpdate({ runtimeSources: next });
    onClearUnvalidated(fieldKey('runtimeSources'));
  }

  function toggleTscService(service: string) {
    const current = intake.additionalTscServices;
    const next = current.includes(service)
      ? current.filter(s => s !== service)
      : [...current, service];
    onUpdate({ additionalTscServices: next });
  }

  return (
    <div className="step-container">
      <ConversationalMessage>
        {discoveryMode === 'live' ? (
          <p>
            Walk through the first article intake with the customer's IT team. All answers are
            treated as confirmed. Document hardware, registration, Autopilot profile, acceptance
            criteria, and TSC services required.
          </p>
        ) : (
          <p>
            Complete the first article intake from seller notes. Flag any field that cannot be
            confirmed with the customer's IT team — flagged items will be listed on the FA
            Definition for follow-up before TSC execution.
          </p>
        )}
      </ConversationalMessage>

      {/* Q1 — Entry gate */}
      <div className="form-section">
        <div className="form-label">
          Is the customer's Intune/Autopilot environment fully operational?
        </div>
        <p className="form-hint">
          All Autopilot profiles, Group Tags, app packaging, and enrollment policies must be
          production-ready before executing a first article. If the environment is not
          operational, redirect this engagement to the Provisioning Motion.
        </p>
        <YesNoField
          fieldName="environmentOperational"
          value={intake.environmentOperational}
          discoveryMode={discoveryMode}
          unvalidatedFields={uv}
          onChange={v => onUpdate({ environmentOperational: v })}
          onMarkUnvalidated={onMarkUnvalidated}
          onClearUnvalidated={onClearUnvalidated}
        />
      </div>

      {envNotOperational && (
        <div className="alert-card alert-card--warning">
          <div className="alert-title">Environment Not Ready — Use Provisioning Motion</div>
          <div className="alert-body">
            The customer's Intune/Autopilot environment must be fully operational before a first
            article can be executed. Start a new session using the Provisioning Motion to
            complete readiness gating and deployment model selection first.
          </div>
        </div>
      )}

      {/* Q2–Q15 only shown when environment is operational (or flagged unvalidated) */}
      {(intake.environmentOperational === true || isUV('environmentOperational')) && (
        <>
          {/* Q2 — Registration owner */}
          <div className="form-section">
            <div className="form-label">Who registers devices into Autopilot?</div>
            <p className="form-hint">
              Identifies whether OEM, Zones, or the customer handles hardware hash registration.
            </p>
            <div className="radio-group radio-group--vertical">
              {REGISTRATION_OWNERS.map(opt => (
                <label
                  key={opt.value}
                  className={`radio-option${intake.registrationOwner === opt.value && !isUV('registrationOwner') ? ' radio-option--selected' : ''}`}
                >
                  <input
                    type="radio"
                    checked={intake.registrationOwner === opt.value && !isUV('registrationOwner')}
                    onChange={() => {
                      onUpdate({ registrationOwner: opt.value });
                      onClearUnvalidated(fieldKey('registrationOwner'));
                    }}
                  />
                  {opt.label}
                </label>
              ))}
              {discoveryMode === 'validation' && (
                <label className={`radio-option radio-option--unvalidated${isUV('registrationOwner') ? ' radio-option--selected' : ''}`}>
                  <input
                    type="radio"
                    checked={isUV('registrationOwner')}
                    onChange={() => isUV('registrationOwner') ? onClearUnvalidated(fieldKey('registrationOwner')) : onMarkUnvalidated(fieldKey('registrationOwner'))}
                  />
                  Unvalidated
                </label>
              )}
            </div>
          </div>

          {/* Q3 — Hardware / Device details */}
          <div className="form-section">
            <div className="form-label">Hardware Details</div>
            <p className="form-hint">
              Confirm the exact device model, SKU, OS version, and quantity for this first article order.
            </p>
            {[
              { key: 'hardwareModel' as const, label: 'Device Model', placeholder: 'e.g. Surface Pro 10, Latitude 5550' },
              { key: 'deviceSku' as const, label: 'Device SKU / Part Number', placeholder: 'e.g. 9IG-00001' },
              { key: 'operatingSystem' as const, label: 'Operating System', placeholder: 'e.g. Windows 11 Pro 24H2' },
              { key: 'deviceQuantity' as const, label: 'First Article Quantity', placeholder: 'e.g. 5' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 10 }}>
                <div className="form-sublabel">{f.label}</div>
                <input
                  className="text-input"
                  type="text"
                  placeholder={f.placeholder}
                  value={intake[f.key]}
                  onChange={e => onUpdate({ [f.key]: e.target.value })}
                />
              </div>
            ))}
          </div>

          {/* Q4 — Zones authorization */}
          <div className="form-section">
            <div className="form-label">
              Has the customer completed the Zones authorization form (DW Customer Authorization)?
            </div>
            <YesNoField
              fieldName="zonesAuthorizationCompleted"
              value={intake.zonesAuthorizationCompleted}
              discoveryMode={discoveryMode}
              unvalidatedFields={uv}
              onChange={v => onUpdate({ zonesAuthorizationCompleted: v })}
              onMarkUnvalidated={onMarkUnvalidated}
              onClearUnvalidated={onClearUnvalidated}
            />
            {intake.zonesAuthorizationCompleted === false && !isUV('zonesAuthorizationCompleted') && (
              <div className="alert-card alert-card--warning" style={{ marginTop: 8 }}>
                <div className="alert-body">
                  Authorization must be on file before Zones can register or provision devices.
                  Obtain the signed form before scheduling the first article.
                </div>
              </div>
            )}
          </div>

          {/* Q5 — Global Admin contact */}
          <div className="form-section">
            <div className="form-label">Global Admin / Intune Admin Contact</div>
            <p className="form-hint">
              Name and contact for the customer's IT admin who can intervene if enrollment or
              policy issues arise during first article execution.
            </p>
            <input
              className="text-input"
              type="text"
              placeholder="e.g. Jane Smith — jsmith@contoso.com"
              value={intake.globalAdminContact}
              onChange={e => onUpdate({ globalAdminContact: e.target.value })}
            />
          </div>

          {/* Q6 — Autopilot profile and Group Tag */}
          <div className="form-section">
            <div className="form-label">Autopilot Profile and Group Tag</div>
            <p className="form-hint">
              Confirm the exact profile name and Group Tag that will be applied to first article devices.
            </p>
            {[
              { key: 'autopilotProfile' as const, label: 'Autopilot Profile Name', placeholder: 'e.g. Contoso-HAADJ-UserDriven' },
              { key: 'groupTag' as const, label: 'Group Tag', placeholder: 'e.g. Contoso-Standard' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 10 }}>
                <div className="form-sublabel">{f.label}</div>
                <input
                  className="text-input"
                  type="text"
                  placeholder={f.placeholder}
                  value={intake[f.key]}
                  onChange={e => onUpdate({ [f.key]: e.target.value })}
                />
              </div>
            ))}
          </div>

          {/* Q7 — Provisioning type */}
          <div className="form-section">
            <div className="form-label">Provisioning Type for This Order</div>
            <p className="form-hint">
              If runtime is at or under 15 minutes, user-driven provisioning is standard. If
              runtime is 16–30 minutes or the customer wants devices fully ready out of the box,
              evaluate Pre-Provisioning. Runtime over 30 minutes should be evaluated for both.
            </p>
            <div className="radio-group radio-group--vertical">
              {PROVISIONING_TYPES.map(opt => (
                <label
                  key={opt.value}
                  className={`radio-option${intake.provisioningType === opt.value && !isUV('provisioningType') ? ' radio-option--selected' : ''}`}
                >
                  <input
                    type="radio"
                    checked={intake.provisioningType === opt.value && !isUV('provisioningType')}
                    onChange={() => {
                      onUpdate({ provisioningType: opt.value });
                      onClearUnvalidated(fieldKey('provisioningType'));
                    }}
                  />
                  <span>
                    <strong>{opt.label}</strong>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{opt.desc}</span>
                  </span>
                </label>
              ))}
              {discoveryMode === 'validation' && (
                <label className={`radio-option radio-option--unvalidated${isUV('provisioningType') ? ' radio-option--selected' : ''}`}>
                  <input
                    type="radio"
                    checked={isUV('provisioningType')}
                    onChange={() => isUV('provisioningType') ? onClearUnvalidated(fieldKey('provisioningType')) : onMarkUnvalidated(fieldKey('provisioningType'))}
                  />
                  Unvalidated
                </label>
              )}
            </div>
          </div>

          {/* Q8 — Must-complete-before-shipment items */}
          <div className="form-section">
            <div className="form-label">Must-Complete Items Before Shipment</div>
            <p className="form-hint">
              List any tasks that must be completed before devices ship — e.g., enrollment profile
              updated, specific app version deployed, IT sign-off received.
            </p>
            <textarea
              className="text-input"
              rows={3}
              placeholder="e.g. Confirm enrollment profile updated for new hire batch, verify CrowdStrike agent version..."
              value={intake.mustCompleteBeforeShipment}
              onChange={e => onUpdate({ mustCompleteBeforeShipment: e.target.value })}
            />
          </div>

          {/* Q9 — Acceptance definition */}
          <div className="form-section">
            <div className="form-label">First Article Acceptance Definition</div>
            <p className="form-hint">
              Define the criteria the SA will use to approve this first article. This becomes
              the acceptance checklist in the FA Definition document.
            </p>
            <textarea
              className="text-input"
              rows={4}
              placeholder="e.g. Device enrolls without manual intervention, all Day 1 apps present, ESP completes under 20 minutes, user reaches desktop with no errors..."
              value={intake.acceptanceDefinition}
              onChange={e => onUpdate({ acceptanceDefinition: e.target.value })}
            />
          </div>

          {/* Q10 — Current provisioning runtime */}
          <div className="form-section">
            <div className="form-label">Current Provisioning Runtime (User-Driven)</div>
            <p className="form-hint">
              Measured from OOBE start to fully provisioned desktop. Used to assess whether
              Pre-Provisioning or Clean Image should be evaluated.
            </p>
            <div className="radio-group radio-group--vertical">
              {RUNTIME_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={`radio-option${intake.currentRuntime === opt.value && !isUV('currentRuntime') ? ' radio-option--selected' : ''}`}
                >
                  <input
                    type="radio"
                    checked={intake.currentRuntime === opt.value && !isUV('currentRuntime')}
                    onChange={() => {
                      onUpdate({ currentRuntime: opt.value });
                      onClearUnvalidated(fieldKey('currentRuntime'));
                    }}
                  />
                  {opt.label}
                </label>
              ))}
              {discoveryMode === 'validation' && (
                <label className={`radio-option radio-option--unvalidated${isUV('currentRuntime') ? ' radio-option--selected' : ''}`}>
                  <input
                    type="radio"
                    checked={isUV('currentRuntime')}
                    onChange={() => isUV('currentRuntime') ? onClearUnvalidated(fieldKey('currentRuntime')) : onMarkUnvalidated(fieldKey('currentRuntime'))}
                  />
                  Unvalidated
                </label>
              )}
            </div>

            {intake.currentRuntime === '16-30' && !isUV('currentRuntime') && (
              <div className="alert-card alert-card--info" style={{ marginTop: 8 }}>
                <div className="alert-body">
                  16–30 minute runtime warrants SA evaluation of Pre-Provisioning (White Glove)
                  and/or Clean Image to reduce end-user wait time.
                </div>
              </div>
            )}
            {intake.currentRuntime === '31-90-plus' && !isUV('currentRuntime') && (
              <div className="alert-card alert-card--warning" style={{ marginTop: 8 }}>
                <div className="alert-body">
                  Runtime over 30 minutes. SA should strongly evaluate both Pre-Provisioning and
                  Clean Image. Document the primary contributors below.
                </div>
              </div>
            )}
          </div>

          {/* Q11 — Runtime sources */}
          <div className="form-section">
            <div className="form-label">Primary Runtime Contributors (select all that apply)</div>
            <div className="checkbox-group">
              {RUNTIME_SOURCE_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={`checkbox-option${intake.runtimeSources.includes(opt.value) ? ' checkbox-option--selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={intake.runtimeSources.includes(opt.value)}
                    onChange={() => toggleRuntimeSource(opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
              {discoveryMode === 'validation' && (
                <label className={`checkbox-option checkbox-option--unvalidated${isUV('runtimeSources') ? ' checkbox-option--selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={isUV('runtimeSources')}
                    onChange={() => isUV('runtimeSources') ? onClearUnvalidated(fieldKey('runtimeSources')) : onMarkUnvalidated(fieldKey('runtimeSources'))}
                  />
                  Unvalidated
                </label>
              )}
            </div>
          </div>

          {/* Q12 — Additional TSC services */}
          <div className="form-section">
            <div className="form-label">Additional TSC Services Required (select all that apply)</div>
            <p className="form-hint">
              Beyond standard enrollment, identify any additional Zones TSC services needed for
              this order.
            </p>
            <div className="checkbox-group">
              {TSC_SERVICES.map(svc => (
                <label
                  key={svc}
                  className={`checkbox-option${intake.additionalTscServices.includes(svc) ? ' checkbox-option--selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={intake.additionalTscServices.includes(svc)}
                    onChange={() => toggleTscService(svc)}
                  />
                  {svc}
                </label>
              ))}
            </div>
            <div style={{ marginTop: 8 }}>
              <div className="form-sublabel">Other (describe)</div>
              <input
                className="text-input"
                type="text"
                placeholder="Any additional services not listed above"
                value={intake.additionalTscServices.find(s => !TSC_SERVICES.includes(s)) ?? ''}
                onChange={e => {
                  const other = e.target.value;
                  const base = intake.additionalTscServices.filter(s => TSC_SERVICES.includes(s));
                  onUpdate({ additionalTscServices: other.trim() ? [...base, other] : base });
                }}
              />
            </div>
          </div>

          {/* Q13 — Tester contact */}
          <div className="form-section">
            <div className="form-label">First Article Tester</div>
            <p className="form-hint">
              Who will execute the first article test at the customer side or at Zones TSC?
            </p>
            <input
              className="text-input"
              type="text"
              placeholder="e.g. TSC Technician — or customer IT contact name and email"
              value={intake.testerContact}
              onChange={e => onUpdate({ testerContact: e.target.value })}
            />
          </div>

          {/* Q14 — Approver contact */}
          <div className="form-section">
            <div className="form-label">First Article Approver (SA or Customer IT Lead)</div>
            <p className="form-hint">
              Who has authority to approve the first article and authorize full-scale production?
              This is typically the SA or the customer's IT lead.
            </p>
            <input
              className="text-input"
              type="text"
              placeholder="e.g. SA name — or customer IT lead name and email"
              value={intake.approverContact}
              onChange={e => onUpdate({ approverContact: e.target.value })}
            />
          </div>

          {/* Q15 — Customer has existing instructions */}
          <div className="form-section">
            <div className="form-label">
              Can the customer provide their current provisioning instructions or runbook?
            </div>
            <p className="form-hint">
              Existing documentation helps TSC execute the first article accurately without
              relying solely on SA-authored criteria.
            </p>
            <YesNoField
              fieldName="customerHasExistingInstructions"
              value={intake.customerHasExistingInstructions}
              discoveryMode={discoveryMode}
              unvalidatedFields={uv}
              onChange={v => onUpdate({ customerHasExistingInstructions: v })}
              onMarkUnvalidated={onMarkUnvalidated}
              onClearUnvalidated={onClearUnvalidated}
            />
            {intake.customerHasExistingInstructions === true && (
              <div style={{ marginTop: 8 }}>
                <div className="form-sublabel">Notes on documentation provided</div>
                <input
                  className="text-input"
                  type="text"
                  placeholder="e.g. SharePoint link, Teams message reference, email attachment..."
                  value={intake.existingInstructionsNotes}
                  onChange={e => onUpdate({ existingInstructionsNotes: e.target.value })}
                />
              </div>
            )}
          </div>
        </>
      )}

      <div className="step-actions">
        <button
          className="btn-primary"
          onClick={onNext}
          disabled={!canProceed}
        >
          Generate FA Definition →
        </button>
        {envNotOperational && (
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 8 }}>
            Environment must be operational to continue. Start a new Provisioning Motion session.
          </p>
        )}
      </div>
    </div>
  );
}
