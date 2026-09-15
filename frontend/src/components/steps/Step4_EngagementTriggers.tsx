import { ConversationalMessage } from '../ConversationalMessage';
import { OptionButton } from '../OptionButton';
import { YesNoField } from '../YesNoField';
import { TextField } from '../TextField';
import { UnvalidatedBtn } from '../UnvalidatedBtn';
import type { CustomerProfile, EngagementTriggers, DiscoveryMode, DeviceImportMethod, EnrollmentHandledBy, ShipToLocation } from '../../types';

interface Props {
  profile: CustomerProfile;
  discoveryMode: DiscoveryMode;
  unvalidatedFields: string[];
  triggers: EngagementTriggers;
  onUpdate: (updates: Partial<EngagementTriggers>) => void;
  onMarkUnvalidated: (fieldKey: string) => void;
  onClearUnvalidated: (fieldKey: string) => void;
  onNext: () => void;
}

export const DEVICE_IMPORT_METHODS: { value: DeviceImportMethod; label: string; sublabel: string }[] = [
  { value: 'oem-direct', label: 'OEM Direct Registration', sublabel: 'Manufacturer registers hardware hashes directly to the tenant' },
  { value: 'reseller-csv', label: 'Reseller / Zones CSV Upload', sublabel: 'Zones exports and uploads hardware hash CSV' },
  { value: 'partner-center', label: 'Partner Center', sublabel: 'Registered via Microsoft Partner Center' },
  { value: 'manual-other', label: 'Manual / Other', sublabel: 'Manually collected and uploaded, or another method' },
];

export const ENROLLMENT_HANDLERS: { value: EnrollmentHandledBy; label: string; sublabel: string }[] = [
  { value: 'oem', label: 'OEM', sublabel: 'Manufacturer handles enrollment registration' },
  { value: 'zones', label: 'Zones', sublabel: 'Zones handles enrollment registration' },
];

export const SHIP_TO_LOCATIONS: { value: ShipToLocation; label: string; sublabel: string }[] = [
  { value: 'home', label: 'End-User Home Addresses', sublabel: 'Direct-to-home shipment' },
  { value: 'office', label: 'Customer Office / Headquarters', sublabel: 'Shipped to a customer site' },
  { value: 'distribution-center', label: 'Customer Regional Distribution Center', sublabel: 'Held/Staged at a customer DC before final delivery.' },
  { value: 'zones-tsc-hold', label: 'Zones TSC (Pre-Provisioning Hold)', sublabel: 'Held at Zones TSC for technician-phase configuration' },
  { value: 'international', label: 'International Destination', sublabel: 'Ships outside the domestic region' },
];

export function Step4_EngagementTriggers({
  discoveryMode, unvalidatedFields,
  triggers, onUpdate, onMarkUnvalidated, onClearUnvalidated, onNext
}: Props) {
  const uv = (k: string) => unvalidatedFields.includes(k);

  const allAnswered =
    (triggers.customerItPocConfirmed !== null || uv('engagementTriggers.customerItPocConfirmed')) &&
    (triggers.tscAlignmentScheduled !== null || uv('engagementTriggers.tscAlignmentScheduled')) &&
    (triggers.cloudServicesEngaged !== null || uv('engagementTriggers.cloudServicesEngaged')) &&
    (triggers.deviceImportMethod !== null || uv('engagementTriggers.deviceImportMethod')) &&
    (triggers.enrollmentHandledBy !== null || uv('engagementTriggers.enrollmentHandledBy')) &&
    (triggers.shipToLocation.length > 0 || uv('engagementTriggers.shipToLocation')) &&
    (!triggers.shipToLocation.includes('home') ||
      triggers.adultSignatureRequired !== null || uv('engagementTriggers.adultSignatureRequired')) &&
    (triggers.assetTagsBiosCustomPackaging !== null || uv('engagementTriggers.assetTagsBiosCustomPackaging')) &&
    (triggers.regionalInternationalRequirements !== null || uv('engagementTriggers.regionalInternationalRequirements'));

  const blockers: string[] = [];
  if (triggers.tscAlignmentScheduled === false && !uv('engagementTriggers.tscAlignmentScheduled'))
    blockers.push('TSC alignment call must be scheduled and completed before any device order');
  if (triggers.cloudServicesEngaged === false && !uv('engagementTriggers.cloudServicesEngaged'))
    blockers.push('Cloud Services engagement recommended for M365 SKU and licensing validation');
  if (triggers.customerItPocConfirmed === false && !uv('engagementTriggers.customerItPocConfirmed'))
    blockers.push('Customer IT stakeholder must be confirmed before SOW development begins');

  const uvCount = unvalidatedFields.filter(f => f.startsWith('engagementTriggers.')).length;

  return (
    <div className="step-container">
      <ConversationalMessage>
        <p>
          As the DW SA, confirm the engagement prerequisites, ordering process, and deployment
          logistics before scoping continues. The three engagement triggers below are not
          optional checkboxes — each one directly affects SOW readiness.
          {discoveryMode === 'validation' && ' Flag any item you cannot confirm from available information.'}
        </p>
      </ConversationalMessage>

      <h3 className="category-heading" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>Engagement Prerequisites</h3>

      <YesNoField
        label="Customer IT Stakeholder Confirmed"
        liveCopy="Is there a named technical stakeholder and budget owner on the customer side who has been identified and is engaged in this discovery? The SA needs a confirmed IT contact who can validate environment details, approve test orders, and sign off on the SOW. Do not proceed to solution design without this."
        validationCopy="Based on seller-provided notes: is a customer IT stakeholder confirmed? If unclear, flag as unvalidated."
        value={triggers.customerItPocConfirmed}
        fieldKey="engagementTriggers.customerItPocConfirmed"
        discoveryMode={discoveryMode}
        unvalidatedFields={unvalidatedFields}
        onChange={v => onUpdate({ customerItPocConfirmed: v })}
        onMarkUnvalidated={onMarkUnvalidated}
        onClearUnvalidated={onClearUnvalidated}
        yesLabel="Yes — IT stakeholder and budget owner confirmed"
        yesSublabel="Named contact engaged; can approve scope and SOW"
        noLabel="No — Not yet confirmed"
        noSublabel="Need to identify IT decision-maker before proceeding"
        unvalidatedFlagText="Unvalidated — confirm with account team"
        tone="warn"
      />
      {triggers.customerItPocConfirmed === false && !uv('engagementTriggers.customerItPocConfirmed') && (
        <div className="alert-card alert-card--warning" style={{ marginTop: -12, marginBottom: 24 }}>
          <div className="alert-title">Action Required</div>
          <div className="alert-body">
            Request the account team identify and introduce the customer's IT decision-maker.
            Obtain a named contact before developing solution recommendations or SOW content.
          </div>
        </div>
      )}

      <YesNoField
        label="TSC Alignment Call"
        liveCopy="Has a TSC alignment call been scheduled or completed? Provide TSC with the full technical discovery output from Steps 1 and 2 — Entra join type, co-management status, Autopilot profile type, and device volume. TSC must acknowledge the scope before any device order is placed."
        validationCopy="Based on seller-provided notes: has TSC alignment been scheduled? If unclear, flag as unvalidated."
        value={triggers.tscAlignmentScheduled}
        fieldKey="engagementTriggers.tscAlignmentScheduled"
        discoveryMode={discoveryMode}
        unvalidatedFields={unvalidatedFields}
        onChange={v => onUpdate({ tscAlignmentScheduled: v })}
        onMarkUnvalidated={onMarkUnvalidated}
        onClearUnvalidated={onClearUnvalidated}
        yesLabel="Yes — TSC alignment scheduled or complete"
        yesSublabel="TSC has been briefed on the technical scope"
        noLabel="No — Not yet scheduled"
        noSublabel="REQUIRED before any device order"
        unvalidatedFlagText="Unvalidated — confirm with account team"
        tone="warn"
      />
      {triggers.tscAlignmentScheduled === false && !uv('engagementTriggers.tscAlignmentScheduled') && (
        <div className="alert-card alert-card--danger" style={{ marginTop: -12, marginBottom: 24 }}>
          <div className="alert-title">HARD STOP — TSC Alignment Required</div>
          <div className="alert-body">
            No device order can be placed without a completed TSC alignment call. Request
            TSC scheduling through your team lead or the TSC request portal. Share the
            technical discovery summary from Steps 1 and 2 in the scheduling request.
          </div>
        </div>
      )}

      <YesNoField
        label="Cloud Services Engagement"
        liveCopy="Has the Cloud Services team been engaged to validate the customer's Microsoft 365 licensing position? This includes confirming Intune license SKU (Intune Plan 1 vs P2), Entra ID tier (P1/P2 for Conditional Access and SSPR), and any Azure services needed for the deployment model. Licensing gaps can block the provisioning workflow."
        validationCopy="Based on seller-provided notes: has Cloud Services been engaged? If unclear, flag as unvalidated."
        value={triggers.cloudServicesEngaged}
        fieldKey="engagementTriggers.cloudServicesEngaged"
        discoveryMode={discoveryMode}
        unvalidatedFields={unvalidatedFields}
        onChange={v => onUpdate({ cloudServicesEngaged: v })}
        onMarkUnvalidated={onMarkUnvalidated}
        onClearUnvalidated={onClearUnvalidated}
        yesLabel="Yes — Cloud Services engaged"
        yesSublabel="M365 SKU, Intune, and Entra licensing reviewed"
        noLabel="No — Not yet engaged"
        noSublabel="Recommended before finalizing scope"
        unvalidatedFlagText="Unvalidated — confirm with account team"
        tone="warn"
      />
      {triggers.cloudServicesEngaged === false && !uv('engagementTriggers.cloudServicesEngaged') && (
        <div className="alert-card alert-card--warning" style={{ marginTop: -12, marginBottom: 24 }}>
          <div className="alert-title">Recommended Action</div>
          <div className="alert-body">
            Engage Cloud Services to confirm the customer holds the correct Intune and Entra ID
            licenses for the planned deployment model. This often uncovers licensing gaps or
            upgrade opportunities before the SOW is written.
          </div>
        </div>
      )}

      {/* Category 5 - Ordering & Enrollment Process */}
      <h3 className="category-heading">Ordering & Enrollment Process</h3>

      <div className="form-section">
        <div className="form-label">How are devices currently imported into Autopilot?</div>
        <div className="option-grid option-grid--wide">
          {DEVICE_IMPORT_METHODS.map(m => (
            <OptionButton
              key={m.value}
              label={m.label}
              sublabel={m.sublabel}
              selected={triggers.deviceImportMethod === m.value}
              onClick={() => {
                const updates: Partial<EngagementTriggers> = { deviceImportMethod: m.value };
                if (m.value === 'oem-direct') {
                  // OEM Direct Registration implies OEM handles enrollment — skip the follow-up question.
                  updates.enrollmentHandledBy = 'oem';
                } else if (triggers.deviceImportMethod === 'oem-direct') {
                  updates.enrollmentHandledBy = null;
                }
                onUpdate(updates);
                onClearUnvalidated('engagementTriggers.deviceImportMethod');
              }}
            />
          ))}
          {discoveryMode === 'validation' && (
            <UnvalidatedBtn
              fieldKey="engagementTriggers.deviceImportMethod"
              unvalidatedFields={unvalidatedFields}
              onMark={onMarkUnvalidated}
              onClear={onClearUnvalidated}
              onNullify={() => onUpdate({ deviceImportMethod: null })}
            />
          )}
        </div>
        {uv('engagementTriggers.deviceImportMethod') && <div className="unvalidated-flag">⚠ Unvalidated — confirm with account team</div>}
      </div>

      {triggers.deviceImportMethod !== null && triggers.deviceImportMethod !== 'oem-direct' && (
        <div className="form-section">
          <div className="form-label">Will enrollment be handled through OEM or Zones?</div>
          <div className="option-grid">
            {ENROLLMENT_HANDLERS.map(e => (
              <OptionButton
                key={e.value}
                label={e.label}
                sublabel={e.sublabel}
                selected={triggers.enrollmentHandledBy === e.value}
                onClick={() => { onUpdate({ enrollmentHandledBy: e.value }); onClearUnvalidated('engagementTriggers.enrollmentHandledBy'); }}
              />
            ))}
            {discoveryMode === 'validation' && (
              <UnvalidatedBtn
                fieldKey="engagementTriggers.enrollmentHandledBy"
                unvalidatedFields={unvalidatedFields}
                onMark={onMarkUnvalidated}
                onClear={onClearUnvalidated}
                onNullify={() => onUpdate({ enrollmentHandledBy: null })}
              />
            )}
          </div>
          {uv('engagementTriggers.enrollmentHandledBy') && <div className="unvalidated-flag">⚠ Unvalidated — confirm with account team</div>}
        </div>
      )}
      {triggers.deviceImportMethod === 'oem-direct' && (
        <div className="alert-card alert-card--info">
          <div className="alert-body">
            OEM Direct Registration selected — enrollment is handled by the OEM. No separate enrollment handoff question is needed.
          </div>
        </div>
      )}

      <TextField
        label="What information must be associated with devices? (Group Tag, Order ID, Purchase Order, etc.)"
        value={triggers.deviceAssociatedInfo}
        placeholder="e.g. Group Tag: FINANCE-LAPTOP, PO #48213, Order ID ZN-88213"
        fieldKey="engagementTriggers.deviceAssociatedInfo"
        discoveryMode={discoveryMode}
        unvalidatedFields={unvalidatedFields}
        onChange={v => onUpdate({ deviceAssociatedInfo: v })}
        onMarkUnvalidated={onMarkUnvalidated}
        onClearUnvalidated={onClearUnvalidated}
        multiline
      />

      {/* Category 6 - Deployment Logistics */}
      <h3 className="category-heading">Deployment Logistics</h3>

      <div className="form-section">
        <div className="form-label">Where will devices be shipped?</div>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: '0 0 8px' }}>
          Select all that apply — devices may ship to multiple destination types.
        </p>
        <div className="option-grid">
          {SHIP_TO_LOCATIONS.map(s => {
            const selected = triggers.shipToLocation.includes(s.value);
            return (
              <OptionButton
                key={s.value}
                label={s.label}
                sublabel={s.sublabel}
                selected={selected}
                onClick={() => {
                  onUpdate({
                    shipToLocation: selected
                      ? triggers.shipToLocation.filter(v => v !== s.value)
                      : [...triggers.shipToLocation, s.value],
                  });
                  onClearUnvalidated('engagementTriggers.shipToLocation');
                }}
              />
            );
          })}
          {discoveryMode === 'validation' && (
            <UnvalidatedBtn
              fieldKey="engagementTriggers.shipToLocation"
              unvalidatedFields={unvalidatedFields}
              onMark={onMarkUnvalidated}
              onClear={onClearUnvalidated}
              onNullify={() => onUpdate({ shipToLocation: [] })}
            />
          )}
        </div>
        {uv('engagementTriggers.shipToLocation') && <div className="unvalidated-flag">⚠ Unvalidated — confirm with account team</div>}
      </div>

      {triggers.shipToLocation.includes('home') && (
        <YesNoField
          label="Is an adult signature required?"
          value={triggers.adultSignatureRequired}
          fieldKey="engagementTriggers.adultSignatureRequired"
          discoveryMode={discoveryMode}
          unvalidatedFields={unvalidatedFields}
          onChange={v => onUpdate({ adultSignatureRequired: v })}
          onMarkUnvalidated={onMarkUnvalidated}
          onClearUnvalidated={onClearUnvalidated}
          yesLabel="Yes — adult signature required"
          noLabel="No — not required"
        />
      )}

      <YesNoField
        label="Are asset tags, BIOS settings, or custom packaging required?"
        value={triggers.assetTagsBiosCustomPackaging}
        fieldKey="engagementTriggers.assetTagsBiosCustomPackaging"
        discoveryMode={discoveryMode}
        unvalidatedFields={unvalidatedFields}
        onChange={v => onUpdate({ assetTagsBiosCustomPackaging: v })}
        onMarkUnvalidated={onMarkUnvalidated}
        onClearUnvalidated={onClearUnvalidated}
        yesLabel="Yes — required"
        noLabel="No — not required"
      />

      {triggers.assetTagsBiosCustomPackaging === true && (
        <TextField
          label="Describe the asset tag, BIOS, or custom packaging requirements"
          value={triggers.assetTagsBiosCustomPackagingDetail}
          placeholder="e.g. Customer asset tag applied to chassis, BIOS password set, branded box insert"
          fieldKey="engagementTriggers.assetTagsBiosCustomPackagingDetail"
          discoveryMode={discoveryMode}
          unvalidatedFields={unvalidatedFields}
          onChange={v => onUpdate({ assetTagsBiosCustomPackagingDetail: v })}
          onMarkUnvalidated={onMarkUnvalidated}
          onClearUnvalidated={onClearUnvalidated}
          multiline
        />
      )}

      <YesNoField
        label="Is this deployment domestic only, or are there regional or international requirements?"
        value={triggers.regionalInternationalRequirements}
        fieldKey="engagementTriggers.regionalInternationalRequirements"
        discoveryMode={discoveryMode}
        unvalidatedFields={unvalidatedFields}
        onChange={v => onUpdate({ regionalInternationalRequirements: v })}
        onMarkUnvalidated={onMarkUnvalidated}
        onClearUnvalidated={onClearUnvalidated}
        yesLabel="Regional / international requirements exist"
        noLabel="Domestic only"
      />

      {triggers.regionalInternationalRequirements === true && (
        <TextField
          label="Describe the regional or international requirements"
          value={triggers.regionalInternationalRequirementsDetail}
          placeholder="e.g. Import duties, local keyboard layout, regional power adapters"
          fieldKey="engagementTriggers.regionalInternationalRequirementsDetail"
          discoveryMode={discoveryMode}
          unvalidatedFields={unvalidatedFields}
          onChange={v => onUpdate({ regionalInternationalRequirementsDetail: v })}
          onMarkUnvalidated={onMarkUnvalidated}
          onClearUnvalidated={onClearUnvalidated}
          multiline
        />
      )}

      {allAnswered && blockers.length === 0 && uvCount === 0 && (
        <div className="alert-card alert-card--success">
          <div className="alert-title">All Engagement Triggers Confirmed</div>
          <div className="alert-body">
            Customer IT stakeholder confirmed, TSC aligned, and Cloud Services engaged.
            This engagement is fully resourced to proceed to first article planning.
          </div>
        </div>
      )}

      {allAnswered && (blockers.length > 0 || uvCount > 0) && (
        <div className="alert-card alert-card--warning">
          <div className="alert-title">Open Items ({blockers.length + uvCount})</div>
          <div className="alert-body">
            {blockers.length > 0 && (
              <ul style={{ paddingLeft: 16, marginBottom: uvCount > 0 ? 8 : 0 }}>
                {blockers.map((b, i) => <li key={i} style={{ marginBottom: 4 }}>{b}</li>)}
              </ul>
            )}
            {uvCount > 0 && (
              <p style={{ margin: 0 }}>{uvCount} item{uvCount > 1 ? 's' : ''} flagged as unvalidated — resolve before ordering.</p>
            )}
          </div>
        </div>
      )}

      <div className="step-actions">
        <button className="btn-primary" onClick={onNext} disabled={!allAnswered}>
          Continue to First Article →
        </button>
      </div>
    </div>
  );
}
