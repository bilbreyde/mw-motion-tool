import { useState } from 'react';
import type { ReactNode } from 'react';
import type { MotionState } from '../../types';
import { PrintHeader } from '../PrintHeader';
import { printDocument } from '../../utils/print';
import {
  REGISTRATION_OWNERS, PROVISIONING_TYPES, RUNTIME_OPTIONS, RUNTIME_SOURCE_OPTIONS,
} from './FaStep2_Intake';

interface Props {
  state: MotionState;
  onEnsureSession: () => Promise<string | null>;
  onReset: () => void;
  onEditStep: (step: number) => void;
}

function Row({ label, value, flagged }: { label: string; value: ReactNode; flagged?: boolean }) {
  return (
    <tr>
      <td className="summary-q">{label}</td>
      <td className="summary-a">
        {value}
        {flagged && <div className="summary-flag">UNVALIDATED — CONFIRM WITH CUSTOMER</div>}
      </td>
    </tr>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="summary-section">
      <h3 className="summary-section-title">{title}</h3>
      <table className="summary-table">
        <tbody>{children}</tbody>
      </table>
    </section>
  );
}

function dash(v: string | null | undefined) {
  return v?.trim() ? v : '—';
}

function labelFor<T extends string>(
  opts: { value: T; label: string }[],
  val: T | null,
): string {
  return opts.find(o => o.value === val)?.label ?? '—';
}

function labelForMany<T extends string>(
  opts: { value: T; label: string }[],
  vals: T[],
): string {
  if (!vals || vals.length === 0) return '—';
  return vals.map(v => opts.find(o => o.value === v)?.label ?? v).join(', ');
}

function runtimeAssessment(runtime: string | null): string {
  if (runtime === 'under-15') return 'Validate existing provisioning model.';
  if (runtime === '16-30') return 'SA evaluates Pre-Provisioning (White Glove) and/or Clean Image.';
  if (runtime === '31-90-plus') return 'SA strongly evaluates both Pre-Provisioning and Clean Image.';
  return '—';
}

export function FaStep3_Output({ state, onEnsureSession, onReset, onEditStep }: Props) {
  const { customerProfile: p, faMotion, unvalidatedFields, sessionCode } = state;
  const intake = faMotion.intake;
  const uv = (name: string) => unvalidatedFields.includes(`faIntake.${name}`);
  const [printing, setPrinting] = useState(false);

  async function handleSaveAndPrint() {
    setPrinting(true);
    try {
      await onEnsureSession();
      printDocument();
    } finally {
      setPrinting(false);
    }
  }

  const openItems = unvalidatedFields.filter(f => f.startsWith('faIntake.')).length;

  const tscServices = intake.additionalTscServices.length > 0
    ? intake.additionalTscServices.join(', ')
    : 'None specified';

  return (
    <div className="step-container">
      {/* Screen-only action bar */}
      <div className="print-hidden">
        {openItems > 0 && (
          <div className="alert-card alert-card--warning" style={{ marginBottom: 16 }}>
            <div className="alert-title">Unvalidated Items Present</div>
            <div className="alert-body">
              {openItems} field{openItems > 1 ? 's are' : ' is'} flagged as unvalidated.
              Resolve these with the customer's IT team before TSC executes the first article.
            </div>
          </div>
        )}

        <div className="alert-card alert-card--info" style={{ marginBottom: 24 }}>
          <div className="alert-title">FA Definition Ready</div>
          <div className="alert-body">
            Print or save this page as a PDF to send to TSC. The document includes the SA-defined
            FA Definition and a blank Customer Feedback Article for the tester to complete
            after execution.
          </div>
        </div>

        <div className="step-actions" style={{ marginBottom: 24 }}>
          <button className="btn-primary" onClick={handleSaveAndPrint} disabled={printing}>
            {printing ? 'Saving…' : '🖨 Print / Save PDF'}
          </button>
          <button className="btn-secondary" onClick={() => onEditStep(1)} style={{ marginLeft: 12 }}>
            ← Edit Customer Profile
          </button>
          <button className="btn-secondary" onClick={() => onEditStep(2)} style={{ marginLeft: 12 }}>
            ← Edit Intake
          </button>
          <button className="btn-secondary btn-secondary--danger" onClick={onReset} style={{ marginLeft: 12 }}>
            Start New Session
          </button>
        </div>
      </div>

      {/* ── FA Definition Article ─────────────────────────────────────────────── */}
      <PrintHeader
        title="First Article Definition"
        sessionCode={sessionCode}
      >
        <span>{p.customerName}</span>
        {p.opportunityNumber && <span> · {p.opportunityNumber}</span>}
        {p.saName && <span> · SA: {p.saName}</span>}
        {p.sellerName && <span> · Seller: {p.sellerName}</span>}
      </PrintHeader>

      <Section title="Hardware and Order Details">
        <Row
          label="Device Model"
          value={dash(intake.hardwareModel)}
          flagged={uv('hardwareModel')}
        />
        <Row
          label="Device SKU / Part Number"
          value={dash(intake.deviceSku)}
          flagged={uv('deviceSku')}
        />
        <Row
          label="Operating System"
          value={dash(intake.operatingSystem)}
        />
        <Row
          label="First Article Quantity"
          value={dash(intake.deviceQuantity)}
          flagged={uv('deviceQuantity')}
        />
      </Section>

      <Section title="Autopilot Registration and Profile">
        <Row
          label="Registration Owner"
          value={labelFor(REGISTRATION_OWNERS, intake.registrationOwner)}
          flagged={uv('registrationOwner')}
        />
        <Row
          label="Autopilot Profile"
          value={dash(intake.autopilotProfile)}
          flagged={uv('autopilotProfile')}
        />
        <Row
          label="Group Tag"
          value={dash(intake.groupTag)}
          flagged={uv('groupTag')}
        />
        <Row
          label="Provisioning Type"
          value={labelFor(PROVISIONING_TYPES, intake.provisioningType)}
          flagged={uv('provisioningType')}
        />
        <Row
          label="Zones Authorization on File"
          value={
            intake.zonesAuthorizationCompleted === true ? 'Yes'
            : intake.zonesAuthorizationCompleted === false ? 'No — obtain before scheduling'
            : '—'
          }
          flagged={uv('zonesAuthorizationCompleted')}
        />
        <Row
          label="Global Admin / Intune Admin Contact"
          value={dash(intake.globalAdminContact)}
        />
      </Section>

      <Section title="TSC Services">
        <Row
          label="Additional TSC Services"
          value={tscServices}
        />
      </Section>

      <Section title="Runtime Assessment">
        <Row
          label="Current Provisioning Runtime"
          value={labelFor(RUNTIME_OPTIONS, intake.currentRuntime)}
          flagged={uv('currentRuntime')}
        />
        <Row
          label="Primary Runtime Contributors"
          value={labelForMany(RUNTIME_SOURCE_OPTIONS, intake.runtimeSources)}
          flagged={uv('runtimeSources')}
        />
        <Row
          label="SA Assessment"
          value={runtimeAssessment(intake.currentRuntime)}
        />
      </Section>

      <Section title="First Article Acceptance Criteria">
        <Row
          label="Acceptance Definition"
          value={
            intake.acceptanceDefinition.trim()
              ? <span style={{ whiteSpace: 'pre-wrap' }}>{intake.acceptanceDefinition}</span>
              : '—'
          }
        />
        {intake.mustCompleteBeforeShipment.trim() && (
          <Row
            label="Must-Complete Before Shipment"
            value={<span style={{ whiteSpace: 'pre-wrap' }}>{intake.mustCompleteBeforeShipment}</span>}
          />
        )}
      </Section>

      <Section title="Contacts">
        <Row
          label="First Article Tester"
          value={dash(intake.testerContact)}
        />
        <Row
          label="First Article Approver"
          value={dash(intake.approverContact)}
        />
        {intake.customerHasExistingInstructions !== null && (
          <Row
            label="Customer Runbook Available"
            value={
              intake.customerHasExistingInstructions === true
                ? `Yes${intake.existingInstructionsNotes.trim() ? ` — ${intake.existingInstructionsNotes}` : ''}`
                : 'No'
            }
            flagged={uv('customerHasExistingInstructions')}
          />
        )}
      </Section>

      {/* ── Customer Feedback Article ─────────────────────────────────────────── */}
      <div style={{ marginTop: 40, borderTop: '2px solid var(--color-border)', paddingTop: 32 }}>
        <h2 style={{ fontSize: '1.1rem', color: 'var(--color-text-primary)', marginBottom: 4 }}>
          Customer Feedback Article
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 20 }}>
          Completed by the first article tester after execution. Return to the SA or SA lead for
          approval before authorizing production scale.
        </p>

        <table className="summary-table">
          <tbody>
            <tr>
              <td className="summary-q">Device built as expected?</td>
              <td className="summary-a">
                <div style={{ display: 'flex', gap: 24 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" disabled /> Yes
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" disabled /> No — describe below
                  </label>
                </div>
                <div className="print-feedback-line" />
              </td>
            </tr>
            <tr>
              <td className="summary-q">Device provisioned as expected?</td>
              <td className="summary-a">
                <div style={{ display: 'flex', gap: 24 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" disabled /> Yes
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" disabled /> No — describe below
                  </label>
                </div>
                <div className="print-feedback-line" />
              </td>
            </tr>
            <tr>
              <td className="summary-q">Time from sign-in to fully provisioned desktop</td>
              <td className="summary-a">
                <div className="print-feedback-line" style={{ width: 120 }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>minutes</span>
              </td>
            </tr>
            <tr>
              <td className="summary-q">First Article Decision</td>
              <td className="summary-a">
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" disabled /> Approved — proceed to production scale
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" disabled /> Changes required — see notes
                  </label>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>Approver signature / date</div>
                  <div className="print-feedback-line" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Bottom print button */}
      <div className="print-hidden" style={{ marginTop: 32 }}>
        <div className="step-actions">
          <button className="btn-primary" onClick={handleSaveAndPrint} disabled={printing}>
            {printing ? 'Saving…' : '🖨 Print / Save PDF'}
          </button>
          <button className="btn-secondary btn-secondary--danger" onClick={onReset} style={{ marginLeft: 12 }}>
            Start New Session
          </button>
        </div>
      </div>
    </div>
  );
}
