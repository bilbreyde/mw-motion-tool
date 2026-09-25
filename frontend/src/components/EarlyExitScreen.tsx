import { useState } from 'react';
import type { ReactNode } from 'react';
import type { MotionState } from '../types';
import { PrintHeader } from './PrintHeader';
import { boolText, labelFor, labelForMany, textOrDash } from './ChecklistPrintView';
import {
  INDUSTRIES, OS_OPTIONS, ENTRA_JOIN_TYPES, CO_MGMT_OPTIONS, MDM_PLATFORMS,
  DEVICE_VOLUMES, TIMELINES, INTUNE_AUTOPILOT_OWNERS, DEPLOYMENT_MODEL_TYPES, PROVISIONING_TIME_OPTIONS,
} from './steps/Step1_CustomerProfile';
import { AUTOPILOT_PROFILES, GATE_QUESTIONS } from './steps/Step2_ReadinessGate';
import { printDocument } from '../utils/print';

interface Props {
  state: MotionState;
  // Saves the session (creating it if needed) so the printed PDF carries a real session ID.
  // Resolves once state.sessionCode reflects the saved session.
  onSaveForPrint: () => Promise<string | null>;
  onBackToStep2: () => void;
  onReset: () => void;
}

interface SummaryRow {
  label: string;
  value: ReactNode;
  flagged?: boolean;
  tone?: 'pass' | 'fail' | 'unset';
}

function SummarySection({ title, rows }: { title: string; rows: SummaryRow[] }) {
  return (
    <section className="summary-section">
      <h3 className="summary-section-title">{title}</h3>
      <table className="summary-table">
        <tbody>
          {rows.map(row => (
            <tr key={row.label}>
              <td className="summary-q">{row.label}</td>
              <td className={`summary-a${row.tone ? ` summary-a--${row.tone}` : ''}`}>
                {row.value}
                {row.flagged && <div className="summary-flag">UNVALIDATED — CONFIRM WITH CUSTOMER</div>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function EarlyExitScreen({ state, onSaveForPrint, onBackToStep2, onReset }: Props) {
  const { customerProfile: p, readinessCheck: r, discoveryMode, unvalidatedFields, sessionCode } = state;
  const uv = (key: string) => unvalidatedFields.includes(key);
  const [printing, setPrinting] = useState(false);

  async function handleSaveAndPrint() {
    setPrinting(true);
    try {
      await onSaveForPrint();
      printDocument();
    } finally {
      setPrinting(false);
    }
  }

  const failedGates = GATE_QUESTIONS.filter(g => r[g.key] === false && !uv(`readinessCheck.${g.key}`));

  const step1Rows: SummaryRow[] = [
    { label: 'Industry vertical', value: labelFor(INDUSTRIES, p.industry), flagged: uv('customerProfile.industry') },
    { label: 'Primary OS platform', value: labelForMany(OS_OPTIONS, p.primaryOs), flagged: uv('customerProfile.primaryOs') },
    { label: 'Entra ID / directory join type', value: labelFor(ENTRA_JOIN_TYPES, p.entraJoinType), flagged: uv('customerProfile.entraJoinType') },
    { label: 'Co-management / ConfigMgr status', value: labelFor(CO_MGMT_OPTIONS, p.coManagementStatus), flagged: uv('customerProfile.coManagementStatus') },
    { label: 'MDM platform(s)', value: labelForMany(MDM_PLATFORMS, p.mdmPlatform), flagged: uv('customerProfile.mdmPlatform') },
    { label: 'Total devices / year (in scope)', value: labelFor(DEVICE_VOLUMES, p.deviceVolume), flagged: uv('customerProfile.deviceVolume') },
    { label: 'Target deployment timeline', value: labelFor(TIMELINES, p.deploymentTimeline), flagged: uv('customerProfile.deploymentTimeline') },
    { label: 'Intune/Autopilot environment owner', value: labelFor(INTUNE_AUTOPILOT_OWNERS, p.intuneAutopilotOwner), flagged: uv('customerProfile.intuneAutopilotOwner') },
    { label: 'Desired first-login experience', value: textOrDash(p.desiredFirstLoginExperience), flagged: uv('customerProfile.desiredFirstLoginExperience') },
    { label: 'Immediate productivity required?', value: boolText(p.immediateProductivityRequired), flagged: uv('customerProfile.immediateProductivityRequired') },
    { label: 'Day-one required applications', value: textOrDash(p.day1RequiredApps), flagged: uv('customerProfile.day1RequiredApps') },
    { label: 'Acceptable provisioning time', value: labelFor(PROVISIONING_TIME_OPTIONS, p.acceptableDeploymentTime || null), flagged: uv('customerProfile.acceptableDeploymentTime') },
    { label: 'Current process issues', value: textOrDash(p.currentProcessIssues), flagged: uv('customerProfile.currentProcessIssues') },
    { label: 'Devices per month/quarter', value: textOrDash(p.devicesPerMonthQuarter), flagged: uv('customerProfile.devicesPerMonthQuarter') },
    { label: 'Deployment model type', value: labelForMany(DEPLOYMENT_MODEL_TYPES, p.deploymentModelType), flagged: uv('customerProfile.deploymentModelType') },
    { label: 'Multiple device models involved?', value: boolText(p.multipleDeviceModels), flagged: uv('customerProfile.multipleDeviceModels') },
    { label: 'First-article contact', value: textOrDash(p.firstArticleContact), flagged: uv('customerProfile.firstArticleContact') },
    { label: 'Pilot success criteria', value: textOrDash(p.pilotSuccessCriteria), flagged: uv('customerProfile.pilotSuccessCriteria') },
  ];

  const gateRows: SummaryRow[] = GATE_QUESTIONS.map(g => {
    const value = r[g.key];
    const flagged = uv(`readinessCheck.${g.key}`);
    if (flagged) return { label: g.label, value: 'UNVALIDATED', tone: 'unset' as const };
    if (value === true) return { label: g.label, value: 'PASS', tone: 'pass' as const };
    if (value === false) return { label: g.label, value: 'FAIL', tone: 'fail' as const };
    return { label: g.label, value: 'NOT ANSWERED', tone: 'unset' as const };
  });

  // Autopilot configuration detail is only asked once every gate passes, so it may be empty here.
  const detailRows: SummaryRow[] = [
    { label: 'Autopilot deployment profile type', value: labelFor(AUTOPILOT_PROFILES, r.autopilotProfileType), answered: r.autopilotProfileType !== null },
    { label: 'Deployment profiles created and validated?', value: boolText(r.deploymentProfilesValidated), answered: r.deploymentProfilesValidated !== null, flagged: uv('readinessCheck.deploymentProfilesValidated') },
    { label: 'Device groups / dynamic assignments configured?', value: boolText(r.deviceGroupsConfigured), answered: r.deviceGroupsConfigured !== null, flagged: uv('readinessCheck.deviceGroupsConfigured') },
    { label: 'Group Tags required for deployment?', value: boolText(r.groupTagsRequired), answered: r.groupTagsRequired !== null, flagged: uv('readinessCheck.groupTagsRequired') },
    { label: 'Enrollment Status Page (ESP) configured?', value: boolText(r.espConfigured), answered: r.espConfigured !== null, flagged: uv('readinessCheck.espConfigured') },
    { label: 'Verified no enrollment restrictions / Conditional Access impact?', value: boolText(r.enrollmentRestrictionsVerifiedClean), answered: r.enrollmentRestrictionsVerifiedClean !== null, flagged: uv('readinessCheck.enrollmentRestrictionsVerifiedClean') },
    { label: 'Enrollment restriction detail', value: textOrDash(r.enrollmentRestrictionsDetail), answered: r.enrollmentRestrictionsVerifiedClean === false },
  ].filter(row => row.answered || row.flagged).map(({ answered: _answered, ...row }) => row);

  return (
    <div className="step-container early-exit">
      <PrintHeader title="Readiness Gate — Early Exit Summary" sessionCode={sessionCode}>
        <span><strong>Customer:</strong> {textOrDash(p.customerName)}</span>
        <span><strong>Opportunity #:</strong> {textOrDash(p.opportunityNumber)}</span>
        <span><strong>SA:</strong> {textOrDash(p.saName)}</span>
        <span><strong>Seller:</strong> {textOrDash(p.sellerName)}</span>
        <span><strong>Date:</strong> {new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}</span>
        <span><strong>Mode:</strong> {discoveryMode === 'validation' ? 'Validation' : 'Live'}</span>
      </PrintHeader>

      <div className="alert-card alert-card--danger">
        <div className="alert-title">Readiness Gate — Not Met</div>
        <div className="alert-body">
          This engagement does not meet the Zones Digital Workplace qualification criteria for a
          standard Autopilot pre-provisioning motion, so it does not advance to Steps 3–6.
          {failedGates.length > 0 && (
            <ul className="early-exit-gaps">
              {failedGates.map(g => (
                <li key={g.key}>{g.label.replace(/^\d+\.\s*/, '')}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <SummarySection title="Step 1 — Technical Discovery" rows={step1Rows} />
      <SummarySection title="Step 2 — Readiness Gate" rows={gateRows} />
      {detailRows.length > 0 && <SummarySection title="Step 2 — Autopilot Configuration Detail" rows={detailRows} />}

      <div className="alert-card alert-card--info early-exit-note">
        <div className="alert-body">
          In the next release, this screen will include Professional Services engagement options
        </div>
      </div>

      <div className="step-actions early-exit-actions">
        <button className="btn-primary" onClick={handleSaveAndPrint} disabled={printing}>
          {printing ? 'Saving…' : 'Save & Print PDF'}
        </button>
        <button className="btn-secondary" onClick={onBackToStep2}>Back to Step 2</button>
        <button className="btn-secondary" onClick={onReset}>New Engagement</button>
      </div>
    </div>
  );
}
