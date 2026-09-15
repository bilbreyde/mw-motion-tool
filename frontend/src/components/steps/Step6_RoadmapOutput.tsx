import { useEffect, useState } from 'react';
import { ConversationalMessage } from '../ConversationalMessage';
import { ChecklistPrintView } from '../ChecklistPrintView';
import type { MotionState, RoadmapStep, Owner } from '../../types';
import { STEP_LABELS } from '../../types';
import { callMotionAI } from '../../utils/api';
import { renderAiText } from '../../utils/formatAiText';

function printChecklist() {
  document.body.classList.add('printing-checklist');
  const cleanup = () => {
    document.body.classList.remove('printing-checklist');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
}

interface Props {
  state: MotionState;
  onUpdateRoadmap: (updates: Partial<MotionState['roadmapOutput']>) => void;
  onReset: () => void;
  onEditStep: (step: number) => void;
}

const EDITABLE_STEPS = Object.entries(STEP_LABELS).filter(([step]) => Number(step) < 6);

function ownerClass(owner: Owner): string {
  const map: Record<Owner, string> = {
    'SA': 'owner--seller',
    'TSC': 'owner--tsc',
    'Cloud Services': 'owner--cloud',
    'Customer': 'owner--customer',
    'Account Team': 'owner--dw-sa',
  };
  return map[owner] ?? '';
}

function statusClass(status: RoadmapStep['status']): string {
  return `status-dot--${status}`;
}

const PHASE_ORDER = ['Discovery', 'Pre-Sales Alignment', 'First Article', 'Production Scale', 'Ongoing'];

function groupByPhase(steps: RoadmapStep[]): Record<string, RoadmapStep[]> {
  const groups: Record<string, RoadmapStep[]> = {};
  for (const step of steps) {
    if (!groups[step.phase]) groups[step.phase] = [];
    groups[step.phase].push(step);
  }
  return groups;
}

const FIELD_LABELS: Record<string, string> = {
  'customerProfile.industry': 'Industry vertical',
  'customerProfile.primaryOs': 'Primary OS platform',
  'customerProfile.entraJoinType': 'Entra ID / directory join type',
  'customerProfile.coManagementStatus': 'Co-management / ConfigMgr status',
  'customerProfile.mdmPlatform': 'MDM platform',
  'customerProfile.deviceVolume': 'Device volume',
  'customerProfile.deploymentTimeline': 'Deployment timeline',
  'customerProfile.intuneAutopilotOwner': 'Intune/Autopilot environment owner',
  'customerProfile.immediateProductivityRequired': 'Immediate productivity required at first login',
  'customerProfile.deploymentModelType': 'Deployment model type(s) (pilot/refresh/new hire/ongoing)',
  'customerProfile.multipleDeviceModels': 'Multiple device models involved',
  'readinessCheck.intuneDeployedProduction': 'Gate 1 — Intune currently deployed and managing production devices',
  'readinessCheck.autopilotConfiguredTestedProd': 'Gate 2 — Autopilot configured and tested in production',
  'readinessCheck.autopilotDeployedBefore': 'Gate 3 — Prior successful Autopilot deployments',
  'readinessCheck.autopilotProcessDocumented': 'Gate 4 — Autopilot process documented and repeatable',
  'readinessCheck.intuneProductionReady': 'Gate 5 — Intune production-ready',
  'readinessCheck.autopilotConfiguredTested': 'Gate 6 — Autopilot configured and tested',
  'readinessCheck.enrollmentProfilesDefined': 'Gate 7 — Enrollment profiles defined',
  'readinessCheck.groupTagsDefined': 'Gate 8 — Group Tags defined',
  'readinessCheck.applicationsPackagedTested': 'Gate 9 — Applications packaged and tested',
  'readinessCheck.firstArticlePlanned': 'Gate 10 — First-article deployment planned',
  'readinessCheck.ownershipAssigned': 'Gate 11 — Ongoing Intune management ownership assigned',
  'readinessCheck.deploymentProfilesValidated': 'Autopilot deployment profiles created and validated',
  'readinessCheck.deviceGroupsConfigured': 'Device groups and dynamic assignments configured',
  'readinessCheck.groupTagsRequired': 'Group Tags required for deployment',
  'readinessCheck.espConfigured': 'Enrollment Status Page (ESP) configured',
  'readinessCheck.enrollmentRestrictionsVerifiedClean': 'Enrollment restrictions / Conditional Access impact',
  'deploymentRecommendation.appsInstallTimesAcceptable': 'Applications with lengthy install times',
  'deploymentRecommendation.appsNoCredentialDependency': 'Applications dependent on user credentials',
  'deploymentRecommendation.windowsUpdatesRequiredPreProvisioning': 'Windows updates required during pre-provisioning',
  'deploymentRecommendation.vpnSecurityAgentsRequired': 'VPN/security agents/EDR required before shipment',
  'deploymentRecommendation.hardwareModelsValidated': 'Hardware models validated against Intune config',
  'engagementTriggers.customerItPocConfirmed': 'Customer IT stakeholder confirmed',
  'engagementTriggers.tscAlignmentScheduled': 'TSC alignment call',
  'engagementTriggers.cloudServicesEngaged': 'Cloud Services licensing review',
  'engagementTriggers.deviceImportMethod': 'Device import method into Autopilot',
  'engagementTriggers.enrollmentHandledBy': 'Enrollment handled by OEM or Zones',
  'engagementTriggers.shipToLocation': 'Ship-to location(s)',
  'engagementTriggers.adultSignatureRequired': 'Adult signature required',
  'engagementTriggers.assetTagsBiosCustomPackaging': 'Asset tags / BIOS / custom packaging required',
  'engagementTriggers.regionalInternationalRequirements': 'Regional or international deployment requirements',
};

export function Step6_RoadmapOutput({ state, onUpdateRoadmap, onReset, onEditStep }: Props) {
  const {
    roadmapOutput, customerProfile, readinessCheck, deploymentRecommendation,
    engagementTriggers, firstArticle, discoveryMode, unvalidatedFields
  } = state;

  const [editPanelOpen, setEditPanelOpen] = useState(false);

  useEffect(() => {
    if (!roadmapOutput.aiSummary && !roadmapOutput.loading) {
      onUpdateRoadmap({ loading: true });
      callMotionAI({
        step: 6,
        action: 'generate-roadmap',
        customerProfile,
        discoveryMode: discoveryMode ?? 'live',
        unvalidatedFields,
        readinessCheck,
        deploymentRecommendation,
        engagementTriggers,
        firstArticle,
      })
        .then(res => {
          if (res.roadmap) {
            onUpdateRoadmap({
              loading: false,
              ...res.roadmap,
              aiSummary: res.roadmap.aiSummary || res.message,
            });
          } else {
            onUpdateRoadmap({ loading: false, aiSummary: res.message });
          }
        })
        .catch(err => {
          onUpdateRoadmap({ loading: false, aiSummary: `Error generating roadmap: ${err.message}` });
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = groupByPhase(roadmapOutput.steps);
  const phases = PHASE_ORDER.filter(p => grouped[p]);

  return (
    <div className="step-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: 'var(--color-text-primary)', marginBottom: 4 }}>
            Digital Workplace Roadmap
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
            {customerProfile.customerName} — Generated {new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}
            {discoveryMode === 'validation' && (
              <span style={{ marginLeft: 12, color: 'var(--color-warning)', fontWeight: 600 }}>◎ Validation Mode</span>
            )}
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
            Opportunity #{customerProfile.opportunityNumber || '—'} &nbsp;·&nbsp; SA: {customerProfile.saName || '—'} &nbsp;·&nbsp; Seller: {customerProfile.sellerName || '—'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn-secondary ${editPanelOpen ? 'option-btn--selected' : ''}`}
            onClick={() => setEditPanelOpen(v => !v)}
            style={{ fontSize: '0.85rem', padding: '8px 16px' }}
          >
            {editPanelOpen ? 'Close Edit Answers' : 'Edit Answers'}
          </button>
          <button className="btn-secondary" onClick={printChecklist} style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
            Print Checklist
          </button>
          <button className="btn-secondary" onClick={() => window.print()} style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
            Print / Export PDF
          </button>
        </div>
      </div>

      {editPanelOpen && (
        <div className="edit-answers-panel">
          <div className="edit-answers-header">Jump back to a step to update an answer</div>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 12 }}>
            Other answers are preserved. When you click Next from that step, you'll return here and the
            roadmap will be regenerated against your changes.
          </p>
          {EDITABLE_STEPS.map(([step, label]) => (
            <div key={step} className="edit-answers-row">
              <span>
                <span className="edit-answers-step-num">{step}</span>
                {label}
              </span>
              <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => onEditStep(Number(step))}>
                Edit →
              </button>
            </div>
          ))}
        </div>
      )}

      <ChecklistPrintView state={state} />

      {/* Unvalidated items — shown prominently before anything else */}
      {unvalidatedFields.length > 0 && (
        <div className="unvalidated-items-section">
          <div className="unvalidated-items-header">
            <span className="unvalidated-items-icon">⚠</span>
            <span>
              {unvalidatedFields.length} Unvalidated Item{unvalidatedFields.length > 1 ? 's' : ''} — Do not order until resolved
            </span>
          </div>
          <p className="unvalidated-items-body">
            The following fields were flagged as unvalidated during discovery. Each must be
            confirmed directly with the customer's IT team before any device order is placed.
            Return to the relevant step to update once confirmed.
          </p>
          <ul className="unvalidated-items-list">
            {unvalidatedFields.map(fieldKey => (
              <li key={fieldKey} className="unvalidated-item">
                <span className="unvalidated-item-label">
                  {FIELD_LABELS[fieldKey] ?? fieldKey}
                </span>
                <span className="unvalidated-item-action">Confirm with customer IT team before ordering</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ConversationalMessage loading={roadmapOutput.loading}>
        {roadmapOutput.loading ? null : roadmapOutput.aiSummary ? (
          renderAiText(roadmapOutput.aiSummary)
        ) : (
          <p>Roadmap generated. Review all steps and confirm with TSC before customer delivery.</p>
        )}
      </ConversationalMessage>

      {!roadmapOutput.loading && (
        <>
          <div className="sow-meter">
            <div className="sow-meter-header">
              <div>
                <div className="sow-label">SOW Readiness Score</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <div className="sow-score">{roadmapOutput.sowReadinessScore}%</div>
                  {roadmapOutput.sowReady && unvalidatedFields.length === 0 ? (
                    <span className="recommendation-badge badge--preferred">SOW Ready</span>
                  ) : (
                    <span className="recommendation-badge badge--blocked">
                      {unvalidatedFields.length > 0 ? `${unvalidatedFields.length} Unvalidated` : 'Not SOW Ready'}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.8 }}>
                <div>IT Stakeholder: {engagementTriggers.customerItPocConfirmed ? '✓' : '✗'}</div>
                <div>TSC Aligned: {engagementTriggers.tscAlignmentScheduled ? '✓' : '✗'}</div>
                <div>First Article: {firstArticle.required ? 'Required' : 'Pending'}</div>
                <div>Cloud Services: {engagementTriggers.cloudServicesEngaged ? '✓' : '✗'}</div>
                {unvalidatedFields.length > 0 && (
                  <div style={{ color: 'var(--color-warning)' }}>Unvalidated: {unvalidatedFields.length}</div>
                )}
              </div>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${roadmapOutput.sowReadinessScore}%` }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              {
                label: 'Join Type',
                value: customerProfile.entraJoinType
                ? ({ 'azure-ad-join': 'Entra ID Join', 'hybrid-aadj': 'Hybrid Entra ID Join (HEID)', 'ad-ds-only': 'AD DS Only' } as Record<string, string>)[customerProfile.entraJoinType] ?? '—'
                : '—',
              },
              {
                label: 'Image Type',
                value: deploymentRecommendation.imageType === 'clean-image' ? 'Zones Clean Image' : 'OEM Ready Image',
              },
              {
                label: 'Device Volume',
                value: `${customerProfile.deviceVolume ?? '—'} devices`,
              },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', padding: '12px 16px', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{value}</div>
              </div>
            ))}
          </div>

          {roadmapOutput.steps.length > 0 ? (
            phases.map(phase => (
              <div key={phase} style={{ marginBottom: 28 }}>
                <h3 style={{ color: 'var(--color-accent)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 16, height: 2, background: 'var(--color-accent)', display: 'inline-block' }} />
                  {phase}
                </h3>
                <div style={{ background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                  <table className="roadmap-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40%' }}>Action</th>
                        <th style={{ width: '14%' }}>Owner</th>
                        <th style={{ width: '18%' }}>Timeline</th>
                        <th style={{ width: '14%' }}>Status</th>
                        <th style={{ width: '14%' }}>SOW</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grouped[phase].map(step => (
                        <tr key={step.id}>
                          <td style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{step.action}</td>
                          <td><span className={`owner-chip ${ownerClass(step.owner)}`}>{step.owner}</span></td>
                          <td style={{ fontSize: '0.82rem' }}>{step.timeline}</td>
                          <td>
                            <span className={`status-dot ${statusClass(step.status)}`} />
                            <span style={{ fontSize: '0.8rem', textTransform: 'capitalize' }}>{step.status}</span>
                          </td>
                          <td>
                            {step.sowRelevant
                              ? <span style={{ color: 'var(--color-success)', fontSize: '0.8rem' }}>Yes</span>
                              : <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>—</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <div className="alert-card alert-card--warning">
              <div className="alert-body">
                Roadmap steps could not be generated. Check your AI service configuration
                or proceed manually using the engagement triggers above.
              </div>
            </div>
          )}

          <div className="alert-card alert-card--info" style={{ marginTop: 8 }}>
            <div className="alert-title">Legend</div>
            <div className="alert-body" style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 4 }}>
              <span><span className="status-dot status-dot--required" />Required</span>
              <span><span className="status-dot status-dot--recommended" />Recommended</span>
              <span><span className="status-dot status-dot--complete" />Complete</span>
              <span style={{ marginLeft: 12 }}>SOW = Statement of Work relevant</span>
            </div>
          </div>
        </>
      )}

      <div className="step-actions">
        {!roadmapOutput.loading && <button className="btn-secondary" onClick={() => window.print()}>Print Roadmap</button>}
        <button className="btn-secondary" onClick={onReset}>New Engagement</button>
      </div>
    </div>
  );
}
