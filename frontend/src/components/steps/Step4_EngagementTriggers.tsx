import { ConversationalMessage } from '../ConversationalMessage';
import { OptionButton } from '../OptionButton';
import type { CustomerProfile, EngagementTriggers } from '../../types';

interface Props {
  profile: CustomerProfile;
  triggers: EngagementTriggers;
  onUpdate: (updates: Partial<EngagementTriggers>) => void;
  onNext: () => void;
}

export function Step4_EngagementTriggers({ profile, triggers, onUpdate, onNext }: Props) {
  const allAnswered =
    triggers.dwSaAssigned !== null &&
    triggers.tscAlignmentScheduled !== null &&
    triggers.cloudServicesEngaged !== null;

  const blockers: string[] = [];
  if (triggers.dwSaAssigned === false) blockers.push('DW SA must be assigned before scoping begins');
  if (triggers.tscAlignmentScheduled === false) blockers.push('TSC alignment call must be scheduled before any device order');
  if (triggers.cloudServicesEngaged === false) blockers.push('Cloud Services engagement recommended for M365 / licensing optimization');

  return (
    <div className="step-container">
      <ConversationalMessage>
        <p>
          For <strong>{profile.customerName || 'this customer'}</strong>, confirm which key engagement
          actions have been initiated. These are required triggers — not optional. Missing any of these
          will block SOW readiness.
        </p>
      </ConversationalMessage>

      <div className="form-section">
        <div className="form-label">DW SA Assignment</div>
        <ConversationalMessage>
          <p>
            Has a <strong>Digital Workplace Solutions Architect (DW SA)</strong> been assigned to this
            opportunity? The DW SA must be involved before any scoping or solution design begins.
          </p>
        </ConversationalMessage>
        <div className="option-grid">
          <OptionButton
            label="Yes — DW SA assigned"
            sublabel="SA is engaged and informed"
            selected={triggers.dwSaAssigned === true}
            onClick={() => onUpdate({ dwSaAssigned: true })}
            variant="yes"
          />
          <OptionButton
            label="No — Not yet assigned"
            sublabel="Must be completed before proceeding"
            selected={triggers.dwSaAssigned === false}
            onClick={() => onUpdate({ dwSaAssigned: false })}
            variant="no"
          />
        </div>
        {triggers.dwSaAssigned === false && (
          <div className="alert-card alert-card--warning" style={{ marginTop: 12 }}>
            <div className="alert-title">Action Required</div>
            <div className="alert-body">
              Contact your team lead to get a DW SA assigned. Do not proceed with customer-facing
              scoping until this is complete.
            </div>
          </div>
        )}
      </div>

      <div className="form-section">
        <div className="form-label">TSC Alignment Call</div>
        <ConversationalMessage>
          <p>
            Has a <strong>TSC (Technical Solutions Consultant) alignment call</strong> been scheduled
            with the customer? This call must happen before any device order is placed — no exceptions.
          </p>
        </ConversationalMessage>
        <div className="option-grid">
          <OptionButton
            label="Yes — TSC call is scheduled"
            sublabel="Or has already occurred"
            selected={triggers.tscAlignmentScheduled === true}
            onClick={() => onUpdate({ tscAlignmentScheduled: true })}
            variant="yes"
          />
          <OptionButton
            label="No — Not yet scheduled"
            sublabel="REQUIRED before any order"
            selected={triggers.tscAlignmentScheduled === false}
            onClick={() => onUpdate({ tscAlignmentScheduled: false })}
            variant="no"
          />
        </div>
        {triggers.tscAlignmentScheduled === false && (
          <div className="alert-card alert-card--danger" style={{ marginTop: 12 }}>
            <div className="alert-title">HARD STOP — TSC Alignment Required</div>
            <div className="alert-body">
              No device order can be placed without a completed TSC alignment call. Schedule this
              immediately via the TSC request portal or your DW SA.
            </div>
          </div>
        )}
      </div>

      <div className="form-section">
        <div className="form-label">Cloud Services Engagement</div>
        <ConversationalMessage>
          <p>
            Has the <strong>Cloud Services team</strong> been engaged to review the customer's
            Microsoft 365 licensing position, Azure landing zone, and optimization opportunities?
          </p>
        </ConversationalMessage>
        <div className="option-grid">
          <OptionButton
            label="Yes — Cloud Services engaged"
            sublabel="Licensing and Azure reviewed"
            selected={triggers.cloudServicesEngaged === true}
            onClick={() => onUpdate({ cloudServicesEngaged: true })}
            variant="yes"
          />
          <OptionButton
            label="No — Not engaged"
            sublabel="Recommended for full engagement"
            selected={triggers.cloudServicesEngaged === false}
            onClick={() => onUpdate({ cloudServicesEngaged: false })}
            variant="no"
          />
        </div>
        {triggers.cloudServicesEngaged === false && (
          <div className="alert-card alert-card--warning" style={{ marginTop: 12 }}>
            <div className="alert-title">Recommended Action</div>
            <div className="alert-body">
              Engage Cloud Services to review M365 SKU alignment, Intune licensing, and any Azure
              services that support this deployment. This often uncovers additional margin opportunity.
            </div>
          </div>
        )}
      </div>

      {allAnswered && blockers.length === 0 && (
        <div className="alert-card alert-card--success">
          <div className="alert-title">All Engagement Triggers Confirmed</div>
          <div className="alert-body">
            DW SA assigned, TSC aligned, and Cloud Services engaged. This engagement is properly
            resourced to proceed to first article planning.
          </div>
        </div>
      )}

      {allAnswered && blockers.length > 0 && (
        <div className="alert-card alert-card--warning">
          <div className="alert-title">Open Action Items ({blockers.length})</div>
          <div className="alert-body">
            <ul style={{ paddingLeft: 16, marginTop: 4 }}>
              {blockers.map((b, i) => <li key={i} style={{ marginBottom: 4 }}>{b}</li>)}
            </ul>
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
