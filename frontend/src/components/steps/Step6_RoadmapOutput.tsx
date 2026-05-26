import { useEffect } from 'react';
import { ConversationalMessage } from '../ConversationalMessage';
import type { MotionState, RoadmapStep, Owner } from '../../types';
import { callMotionAI } from '../../utils/api';

interface Props {
  state: MotionState;
  onUpdateRoadmap: (updates: Partial<MotionState['roadmapOutput']>) => void;
  onReset: () => void;
}

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
  'readinessCheck.autopilotReady': 'Autopilot production status',
  'readinessCheck.intuneReady': 'Intune compliance enforcement status',
  'engagementTriggers.customerItPocConfirmed': 'Customer IT stakeholder confirmed',
  'engagementTriggers.tscAlignmentScheduled': 'TSC alignment call',
  'engagementTriggers.cloudServicesEngaged': 'Cloud Services licensing review',
};

export function Step6_RoadmapOutput({ state, onUpdateRoadmap, onReset }: Props) {
  const {
    roadmapOutput, customerProfile, readinessCheck, deploymentRecommendation,
    engagementTriggers, firstArticle, discoveryMode, unvalidatedFields
  } = state;

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
        </div>
        <button className="btn-secondary" onClick={() => window.print()} style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
          Print / Export PDF
        </button>
      </div>

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
        {roadmapOutput.loading ? null : (
          <p>{roadmapOutput.aiSummary || 'Roadmap generated. Review all steps and confirm with TSC before customer delivery.'}</p>
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
                <div>First Article: {firstArticle.required ? 'Required' : 'Waived'}</div>
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
                ? ({ 'azure-ad-join': 'Azure AD Join', 'hybrid-aadj': 'Hybrid AADJ', 'ad-ds-only': 'AD DS Only' } as Record<string, string>)[customerProfile.entraJoinType] ?? '—'
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
