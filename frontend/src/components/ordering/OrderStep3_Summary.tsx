import { useState } from 'react';
import type { ReactNode } from 'react';
import type { MotionState } from '../../types';
import { PrintHeader } from '../PrintHeader';
import { boolText, labelFor, labelForMany, textOrDash } from '../ChecklistPrintView';
import { printDocument } from '../../utils/print';
import { DEVICE_IMPORT_METHODS, ENROLLMENT_HANDLERS, SHIP_TO_LOCATIONS } from './OrderStep2_Engagement';

interface Props {
  state: MotionState;
  onEnsureSession: () => Promise<string | null>;
  onReset: () => void;
  onEditStep: (step: number) => void;
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

export function OrderStep3_Summary({ state, onEnsureSession, onReset, onEditStep }: Props) {
  const { customerProfile: p, engagementTriggers: t, unvalidatedFields, sessionCode } = state;
  const uv = (key: string) => unvalidatedFields.includes(key);
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

  const openItems = unvalidatedFields.filter(f =>
    f.startsWith('engagementTriggers.') || f.startsWith('customerProfile.')
  ).length;

  return (
    <div className="step-container">
      <div className="print-hidden">
        <div className="alert-card alert-card--info" style={{ marginBottom: 24 }}>
          <div className="alert-title">Order Summary</div>
          <div className="alert-body">
            All ordering and enrollment details have been captured.
            {openItems > 0 && (
              <> <strong>{openItems} item{openItems > 1 ? 's are' : ' is'} flagged as unvalidated</strong> — resolve these before the order is placed.</>
            )}
            {openItems === 0 && ' All items confirmed — ready to proceed with the order.'}
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
            ← Edit Ordering & Enrollment
          </button>
          <button className="btn-secondary btn-secondary--danger" onClick={onReset} style={{ marginLeft: 12 }}>
            Start New Session
          </button>
        </div>
      </div>

      <PrintHeader
        title="Ordering & Enrollment Summary"
        sessionCode={sessionCode}
      >
        <span>{p.customerName}</span>
        {p.opportunityNumber && <span> · {p.opportunityNumber}</span>}
        {p.saName && <span> · SA: {p.saName}</span>}
        {p.sellerName && <span> · Seller: {p.sellerName}</span>}
      </PrintHeader>

      <SummarySection
        title="Customer & Opportunity"
        rows={[
          { label: 'Customer Name', value: textOrDash(p.customerName) },
          { label: 'Opportunity Number', value: textOrDash(p.opportunityNumber) },
          { label: 'SA Name', value: textOrDash(p.saName) },
          { label: 'Seller Name', value: textOrDash(p.sellerName) },
        ]}
      />

      <SummarySection
        title="Engagement Prerequisites"
        rows={[
          {
            label: 'Customer IT Stakeholder Confirmed',
            value: boolText(t.customerItPocConfirmed),
            tone: t.customerItPocConfirmed === true ? 'pass' : t.customerItPocConfirmed === false ? 'fail' : 'unset',
            flagged: uv('engagementTriggers.customerItPocConfirmed'),
          },
          {
            label: 'TSC Alignment Call',
            value: boolText(t.tscAlignmentScheduled),
            tone: t.tscAlignmentScheduled === true ? 'pass' : t.tscAlignmentScheduled === false ? 'fail' : 'unset',
            flagged: uv('engagementTriggers.tscAlignmentScheduled'),
          },
          {
            label: 'Cloud Services Engaged',
            value: boolText(t.cloudServicesEngaged),
            tone: t.cloudServicesEngaged === true ? 'pass' : t.cloudServicesEngaged === false ? 'fail' : 'unset',
            flagged: uv('engagementTriggers.cloudServicesEngaged'),
          },
        ]}
      />

      <SummarySection
        title="Ordering & Enrollment Process"
        rows={[
          {
            label: 'Device Import Method',
            value: labelFor(DEVICE_IMPORT_METHODS, t.deviceImportMethod),
            flagged: uv('engagementTriggers.deviceImportMethod'),
          },
          {
            label: 'Enrollment Handled By',
            value: labelFor(ENROLLMENT_HANDLERS, t.enrollmentHandledBy),
            flagged: uv('engagementTriggers.enrollmentHandledBy'),
          },
          {
            label: 'Device-Associated Information',
            value: textOrDash(t.deviceAssociatedInfo),
          },
        ]}
      />

      <SummarySection
        title="Deployment Logistics"
        rows={[
          {
            label: 'Ship-To Location(s)',
            value: labelForMany(SHIP_TO_LOCATIONS, t.shipToLocation),
            flagged: uv('engagementTriggers.shipToLocation'),
          },
          ...(t.shipToLocation.includes('home')
            ? [{
                label: 'Adult Signature Required',
                value: boolText(t.adultSignatureRequired),
                flagged: uv('engagementTriggers.adultSignatureRequired'),
              }]
            : []),
          {
            label: 'Asset Tags / BIOS / Custom Packaging',
            value: boolText(t.assetTagsBiosCustomPackaging),
            flagged: uv('engagementTriggers.assetTagsBiosCustomPackaging'),
          },
          ...(t.assetTagsBiosCustomPackaging === true && t.assetTagsBiosCustomPackagingDetail
            ? [{ label: 'Packaging Details', value: t.assetTagsBiosCustomPackagingDetail }]
            : []),
        ]}
      />

      {openItems > 0 && (
        <div className="alert-card alert-card--warning print-hidden" style={{ marginTop: 24 }}>
          <div className="alert-title">Unvalidated Items Must Be Resolved Before Ordering</div>
          <div className="alert-body">
            {openItems} item{openItems > 1 ? 's are' : ' is'} flagged as unvalidated.
            Resolve each one directly with the customer's IT team or account team before the
            order is submitted.
          </div>
        </div>
      )}

      <div className="print-hidden" style={{ marginTop: 24 }}>
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
