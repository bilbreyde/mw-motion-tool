import { ConversationalMessage } from '../ConversationalMessage';
import { OptionButton } from '../OptionButton';
import type { CustomerProfile, EngagementTriggers, DiscoveryMode } from '../../types';

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

export function Step4_EngagementTriggers({
  discoveryMode, unvalidatedFields,
  triggers, onUpdate, onMarkUnvalidated, onClearUnvalidated, onNext
}: Props) {
  const uv = (k: string) => unvalidatedFields.includes(k);

  const allAnswered =
    (triggers.customerItPocConfirmed !== null || uv('engagementTriggers.customerItPocConfirmed')) &&
    (triggers.tscAlignmentScheduled !== null || uv('engagementTriggers.tscAlignmentScheduled')) &&
    (triggers.cloudServicesEngaged !== null || uv('engagementTriggers.cloudServicesEngaged'));

  const blockers: string[] = [];
  if (triggers.tscAlignmentScheduled === false && !uv('engagementTriggers.tscAlignmentScheduled'))
    blockers.push('TSC alignment call must be scheduled and completed before any device order');
  if (triggers.cloudServicesEngaged === false && !uv('engagementTriggers.cloudServicesEngaged'))
    blockers.push('Cloud Services engagement recommended for M365 SKU and licensing validation');
  if (triggers.customerItPocConfirmed === false && !uv('engagementTriggers.customerItPocConfirmed'))
    blockers.push('Customer IT stakeholder must be confirmed before SOW development begins');

  const uvCount = [
    'engagementTriggers.customerItPocConfirmed',
    'engagementTriggers.tscAlignmentScheduled',
    'engagementTriggers.cloudServicesEngaged',
  ].filter(k => uv(k)).length;

  return (
    <div className="step-container">
      <ConversationalMessage>
        <p>
          As the DW SA, confirm the three engagement prerequisites before scoping continues.
          These are not optional checkboxes — each one directly affects SOW readiness and
          your ability to recommend a solution with confidence.
          {discoveryMode === 'validation' && ' Flag any item you cannot confirm from available information.'}
        </p>
      </ConversationalMessage>

      {/* Customer IT Stakeholder */}
      <div className="form-section">
        <div className="form-label">Customer IT Stakeholder Confirmed</div>
        <ConversationalMessage>
          <p>
            Is there a named technical stakeholder and budget owner on the customer side who
            has been identified and is engaged in this discovery? The SA needs a confirmed
            IT contact who can validate environment details, approve test orders, and sign off
            on the SOW. Do not proceed to solution design without this.
          </p>
        </ConversationalMessage>
        <div className="option-grid">
          <OptionButton
            label="Yes — IT stakeholder and budget owner confirmed"
            sublabel="Named contact engaged; can approve scope and SOW"
            selected={triggers.customerItPocConfirmed === true}
            onClick={() => { onUpdate({ customerItPocConfirmed: true }); onClearUnvalidated('engagementTriggers.customerItPocConfirmed'); }}
            variant="yes"
          />
          <OptionButton
            label="No — Not yet confirmed"
            sublabel="Need to identify IT decision-maker before proceeding"
            selected={triggers.customerItPocConfirmed === false}
            onClick={() => { onUpdate({ customerItPocConfirmed: false }); onClearUnvalidated('engagementTriggers.customerItPocConfirmed'); }}
            variant="no"
          />
          {discoveryMode === 'validation' && (
            <button
              className={`option-btn option-btn--unvalidated ${uv('engagementTriggers.customerItPocConfirmed') ? 'option-btn--selected' : ''}`}
              onClick={() => {
                if (uv('engagementTriggers.customerItPocConfirmed')) {
                  onClearUnvalidated('engagementTriggers.customerItPocConfirmed');
                } else {
                  onUpdate({ customerItPocConfirmed: null });
                  onMarkUnvalidated('engagementTriggers.customerItPocConfirmed');
                }
              }}
            >
              <span className="option-label">Unvalidated — confirm with customer</span>
              <span className="option-sublabel">Flag for follow-up</span>
            </button>
          )}
        </div>
        {triggers.customerItPocConfirmed === false && !uv('engagementTriggers.customerItPocConfirmed') && (
          <div className="alert-card alert-card--warning" style={{ marginTop: 12 }}>
            <div className="alert-title">Action Required</div>
            <div className="alert-body">
              Request the account team identify and introduce the customer's IT decision-maker.
              Obtain a named contact before developing solution recommendations or SOW content.
            </div>
          </div>
        )}
        {uv('engagementTriggers.customerItPocConfirmed') && <div className="unvalidated-flag">⚠ Unvalidated — confirm with account team</div>}
      </div>

      {/* TSC Alignment */}
      <div className="form-section">
        <div className="form-label">TSC Alignment Call</div>
        <ConversationalMessage>
          <p>
            Has a TSC alignment call been scheduled or completed? Provide TSC with the full
            technical discovery output from Steps 1 and 2 — Entra join type, co-management
            status, Autopilot profile type, and device volume. TSC must acknowledge the
            scope before any device order is placed.
          </p>
        </ConversationalMessage>
        <div className="option-grid">
          <OptionButton
            label="Yes — TSC alignment scheduled or complete"
            sublabel="TSC has been briefed on the technical scope"
            selected={triggers.tscAlignmentScheduled === true}
            onClick={() => { onUpdate({ tscAlignmentScheduled: true }); onClearUnvalidated('engagementTriggers.tscAlignmentScheduled'); }}
            variant="yes"
          />
          <OptionButton
            label="No — Not yet scheduled"
            sublabel="REQUIRED before any device order"
            selected={triggers.tscAlignmentScheduled === false}
            onClick={() => { onUpdate({ tscAlignmentScheduled: false }); onClearUnvalidated('engagementTriggers.tscAlignmentScheduled'); }}
            variant="no"
          />
          {discoveryMode === 'validation' && (
            <button
              className={`option-btn option-btn--unvalidated ${uv('engagementTriggers.tscAlignmentScheduled') ? 'option-btn--selected' : ''}`}
              onClick={() => {
                if (uv('engagementTriggers.tscAlignmentScheduled')) {
                  onClearUnvalidated('engagementTriggers.tscAlignmentScheduled');
                } else {
                  onUpdate({ tscAlignmentScheduled: null });
                  onMarkUnvalidated('engagementTriggers.tscAlignmentScheduled');
                }
              }}
            >
              <span className="option-label">Unvalidated — confirm with account team</span>
              <span className="option-sublabel">Flag for follow-up</span>
            </button>
          )}
        </div>
        {triggers.tscAlignmentScheduled === false && !uv('engagementTriggers.tscAlignmentScheduled') && (
          <div className="alert-card alert-card--danger" style={{ marginTop: 12 }}>
            <div className="alert-title">HARD STOP — TSC Alignment Required</div>
            <div className="alert-body">
              No device order can be placed without a completed TSC alignment call. Request
              TSC scheduling through your team lead or the TSC request portal. Share the
              technical discovery summary from Steps 1 and 2 in the scheduling request.
            </div>
          </div>
        )}
        {uv('engagementTriggers.tscAlignmentScheduled') && <div className="unvalidated-flag">⚠ Unvalidated — confirm with account team</div>}
      </div>

      {/* Cloud Services */}
      <div className="form-section">
        <div className="form-label">Cloud Services Engagement</div>
        <ConversationalMessage>
          <p>
            Has the Cloud Services team been engaged to validate the customer's Microsoft 365
            licensing position? This includes confirming Intune license SKU (Intune Plan 1 vs P2),
            Entra ID tier (P1/P2 for Conditional Access and SSPR), and any Azure services needed
            for the deployment model. Licensing gaps can block the provisioning workflow.
          </p>
        </ConversationalMessage>
        <div className="option-grid">
          <OptionButton
            label="Yes — Cloud Services engaged"
            sublabel="M365 SKU, Intune, and Entra licensing reviewed"
            selected={triggers.cloudServicesEngaged === true}
            onClick={() => { onUpdate({ cloudServicesEngaged: true }); onClearUnvalidated('engagementTriggers.cloudServicesEngaged'); }}
            variant="yes"
          />
          <OptionButton
            label="No — Not yet engaged"
            sublabel="Recommended before finalizing scope"
            selected={triggers.cloudServicesEngaged === false}
            onClick={() => { onUpdate({ cloudServicesEngaged: false }); onClearUnvalidated('engagementTriggers.cloudServicesEngaged'); }}
            variant="no"
          />
          {discoveryMode === 'validation' && (
            <button
              className={`option-btn option-btn--unvalidated ${uv('engagementTriggers.cloudServicesEngaged') ? 'option-btn--selected' : ''}`}
              onClick={() => {
                if (uv('engagementTriggers.cloudServicesEngaged')) {
                  onClearUnvalidated('engagementTriggers.cloudServicesEngaged');
                } else {
                  onUpdate({ cloudServicesEngaged: null });
                  onMarkUnvalidated('engagementTriggers.cloudServicesEngaged');
                }
              }}
            >
              <span className="option-label">Unvalidated — confirm with account team</span>
              <span className="option-sublabel">Flag for follow-up</span>
            </button>
          )}
        </div>
        {triggers.cloudServicesEngaged === false && !uv('engagementTriggers.cloudServicesEngaged') && (
          <div className="alert-card alert-card--warning" style={{ marginTop: 12 }}>
            <div className="alert-title">Recommended Action</div>
            <div className="alert-body">
              Engage Cloud Services to confirm the customer holds the correct Intune and Entra ID
              licenses for the planned deployment model. This often uncovers licensing gaps or
              upgrade opportunities before the SOW is written.
            </div>
          </div>
        )}
        {uv('engagementTriggers.cloudServicesEngaged') && <div className="unvalidated-flag">⚠ Unvalidated — confirm with account team</div>}
      </div>

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
