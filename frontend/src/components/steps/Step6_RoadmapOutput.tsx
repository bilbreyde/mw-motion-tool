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
    'Seller': 'owner--seller',
    'DW SA': 'owner--dw-sa',
    'TSC': 'owner--tsc',
    'Cloud Services': 'owner--cloud',
    'Customer': 'owner--customer',
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

export function Step6_RoadmapOutput({ state, onUpdateRoadmap, onReset }: Props) {
  const { roadmapOutput, customerProfile, readinessCheck, deploymentRecommendation, engagementTriggers, firstArticle } = state;

  useEffect(() => {
    if (!roadmapOutput.aiSummary && !roadmapOutput.loading) {
      onUpdateRoadmap({ loading: true });
      callMotionAI({
        step: 6,
        action: 'generate-roadmap',
        customerProfile,
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

  function handlePrint() {
    window.print();
  }

  const grouped = groupByPhase(roadmapOutput.steps);
  const phases = PHASE_ORDER.filter(p => grouped[p]);

  return (
    <div className="step-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: 'var(--color-text-primary)', marginBottom: 4 }}>
            Modern Workplace Roadmap
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
            {customerProfile.customerName} — Generated {new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={handlePrint} style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
            Print / Export PDF
          </button>
        </div>
      </div>

      <ConversationalMessage loading={roadmapOutput.loading}>
        {roadmapOutput.loading ? null : (
          <p>{roadmapOutput.aiSummary || 'Roadmap generated. Review the steps below and confirm with your DW SA before customer delivery.'}</p>
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
                  {roadmapOutput.sowReady ? (
                    <span className="recommendation-badge badge--preferred">SOW Ready</span>
                  ) : (
                    <span className="recommendation-badge badge--blocked">Not SOW Ready</span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                <div>DW SA: {engagementTriggers.dwSaAssigned ? '✓' : '✗'}</div>
                <div>TSC Aligned: {engagementTriggers.tscAlignmentScheduled ? '✓' : '✗'}</div>
                <div>First Article: {firstArticle.required ? 'Required' : 'Waived'}</div>
                <div>Cloud Services: {engagementTriggers.cloudServicesEngaged ? '✓' : '✗'}</div>
              </div>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${roadmapOutput.sowReadinessScore}%` }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              marginBottom: 20,
            }}>
              <div style={{ background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', padding: '12px 16px', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-text-muted)', marginBottom: 4 }}>Image Type</div>
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {deploymentRecommendation.imageType === 'clean-image' ? 'Zones Clean Image' : 'OEM Ready Image'}
                </div>
              </div>
              <div style={{ background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', padding: '12px 16px', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-text-muted)', marginBottom: 4 }}>Provisioning</div>
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>
                  {deploymentRecommendation.provisioningModel?.replace('-', ' ')}
                </div>
              </div>
              <div style={{ background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', padding: '12px 16px', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-text-muted)', marginBottom: 4 }}>Device Volume</div>
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {customerProfile.deviceVolume} devices
                </div>
              </div>
            </div>
          </div>

          {roadmapOutput.steps.length > 0 ? (
            phases.map(phase => (
              <div key={phase} style={{ marginBottom: 28 }}>
                <h3 style={{
                  color: 'var(--color-accent)',
                  fontSize: '0.82rem',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
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
                          <td>
                            <span className={`owner-chip ${ownerClass(step.owner)}`}>{step.owner}</span>
                          </td>
                          <td style={{ fontSize: '0.82rem' }}>{step.timeline}</td>
                          <td>
                            <span className={`status-dot ${statusClass(step.status)}`} />
                            <span style={{ fontSize: '0.8rem', textTransform: 'capitalize' }}>{step.status}</span>
                          </td>
                          <td>
                            {step.sowRelevant ? (
                              <span style={{ color: 'var(--color-success)', fontSize: '0.8rem' }}>Yes</span>
                            ) : (
                              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>—</span>
                            )}
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
                Roadmap steps could not be generated. Check your AI service configuration or proceed
                manually using the engagement triggers above.
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
        {!roadmapOutput.loading && <button className="btn-secondary" onClick={handlePrint}>Print Roadmap</button>}
        <button className="btn-secondary" onClick={onReset}>New Engagement</button>
      </div>
    </div>
  );
}
