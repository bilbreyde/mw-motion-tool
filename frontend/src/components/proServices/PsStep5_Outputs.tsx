import { useEffect, useState } from 'react';
import { ConversationalMessage } from '../ConversationalMessage';
import { PrintHeader } from '../PrintHeader';
import { boolText, labelFor, labelForMany, textOrDash } from '../ChecklistPrintView';
import { MDM_PLATFORMS, OS_OPTIONS } from '../steps/Step1_CustomerProfile';
import type { ConfigAreaKey, MotionState, PsLoeAreaLine, PsLoeEstimate } from '../../types';
import { PS_STEP_LABELS } from '../../types';
import { callMotionAI } from '../../utils/api';
import { renderAiText } from '../../utils/formatAiText';
import { printDocument } from '../../utils/print';
import { LOE_DISCLAIMER, computeLoe, formatHours, formatWeeks, loeBlockers } from '../../utils/psLoe';
import {
  CONFIG_AREAS, PS_DEVICE_COUNTS, PS_ENGAGEMENT_TYPES, PS_FIELD_LABELS,
  configFieldKey, deliverableFor, isAdim, statusLabel,
} from './psConfig';

interface Props {
  state: MotionState;
  // Ensures the session is saved (so it has an ID) before a document is printed.
  onEnsureSession: () => Promise<string | null>;
  onUpdateLoe: (updates: Partial<PsLoeEstimate>) => void;
  onReset: () => void;
  onEditStep: (step: number) => void;
}

const EDITABLE_STEPS = Object.entries(PS_STEP_LABELS).filter(([step]) => Number(step) < 5);
const AREA_KEYS = new Set<string>(CONFIG_AREAS.map(a => a.key));

function sanitizeAreaLines(raw: unknown): PsLoeAreaLine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((l): l is PsLoeAreaLine => !!l && typeof l === 'object' && AREA_KEYS.has((l as PsLoeAreaLine).area))
    .map(l => ({
      area: l.area as ConfigAreaKey,
      baseHoursLow: Number(l.baseHoursLow) || 0,
      baseHoursHigh: Number(l.baseHoursHigh) || 0,
      rationale: typeof l.rationale === 'string' ? l.rationale : '',
    }));
}

function csvCell(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

export function PsStep5_Outputs({ state, onEnsureSession, onUpdateLoe, onReset, onEditStep }: Props) {
  const { customerProfile: p, proServices: ps, discoveryMode, unvalidatedFields } = state;
  const { loe } = ps;
  const uv = (k: string) => unvalidatedFields.includes(k);

  const [editPanelOpen, setEditPanelOpen] = useState(false);
  const [preparingPrint, setPreparingPrint] = useState(false);

  const blockers = loeBlockers(ps, unvalidatedFields);
  const highComplexity = blockers.some(b => b.kind === 'high-complexity');
  const breakdown = loe.generatedAt ? computeLoe(ps, unvalidatedFields) : null;
  const adim = isAdim(ps.engagementType);

  const requirementRows = CONFIG_AREAS.map((area, i) => {
    const flagged = uv(configFieldKey(area.key));
    const status = ps.configStatus[area.key];
    return {
      num: i + 1,
      area,
      flagged,
      status: statusLabel(status, flagged),
      statusValue: flagged ? 'unvalidated' : status ?? 'unset',
      deliverable: deliverableFor(area, ps.engagementType, status, flagged),
    };
  });

  function generate() {
    const { loe: _loe, ...discovery } = ps;
    onUpdateLoe({ loading: true, error: '' });
    callMotionAI({
      step: 5,
      action: 'estimate-loe',
      customerProfile: p,
      discoveryMode: discoveryMode ?? 'live',
      unvalidatedFields,
      proServices: discovery,
    })
      .then(res => {
        const areaLines = sanitizeAreaLines(res.areaLines);
        const missing = adim ? CONFIG_AREAS.filter(a => !areaLines.some(l => l.area === a.key)) : [];
        if (missing.length > 0) {
          onUpdateLoe({
            loading: false,
            error: `The AI response did not include an estimate for: ${missing.map(a => a.label).join(', ')}. Regenerate to try again.`,
          });
          return;
        }
        onUpdateLoe({
          loading: false,
          areaLines,
          summary: res.message ?? '',
          assumptions: Array.isArray(res.assumptions) ? res.assumptions : [],
          risks: Array.isArray(res.risks) ? res.risks : [],
          generatedAt: new Date().toISOString(),
          error: '',
        });
      })
      .catch(err => {
        onUpdateLoe({ loading: false, error: `Error generating LOE: ${err.message}` });
      });
  }

  useEffect(() => {
    if (blockers.length === 0 && !loe.generatedAt && !loe.loading) generate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function print(bodyClass?: string) {
    setPreparingPrint(true);
    try {
      await onEnsureSession();
      printDocument(bodyClass);
    } finally {
      setPreparingPrint(false);
    }
  }

  function exportCsv() {
    const header = ['#', 'Configuration Area', 'Current Status', 'What Zones Will Deliver'];
    const lines = [
      header.map(csvCell).join(','),
      ...requirementRows.map(r => [String(r.num), r.area.label, r.status, r.deliverable].map(csvCell).join(',')),
    ];
    const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const slug = (p.customerName.trim() || 'customer').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
    a.href = url;
    a.download = `${slug}-intune-autopilot-requirements.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const engagementLabel = labelFor(PS_ENGAGEMENT_TYPES, ps.engagementType);
  const generatedDate = new Date().toLocaleDateString('en-US', { dateStyle: 'long' });
  const headerMeta = (
    <>
      <span><strong>Customer:</strong> {textOrDash(p.customerName)}</span>
      <span><strong>Opportunity #:</strong> {textOrDash(p.opportunityNumber)}</span>
      <span><strong>SA:</strong> {textOrDash(p.saName)}</span>
      <span><strong>Seller:</strong> {textOrDash(p.sellerName)}</span>
      <span><strong>Engagement:</strong> {engagementLabel}</span>
      <span><strong>Generated:</strong> {generatedDate}</span>
      {discoveryMode === 'validation' && <span><strong>Mode:</strong> Validation</span>}
    </>
  );

  return (
    <div className="step-container">
      <div className="ps-full-only">
        <PrintHeader title="Autopilot/Intune Pro Services — Requirements & LOE" sessionCode={state.sessionCode} printOnly>
          {headerMeta}
        </PrintHeader>
      </div>
      <div className="ps-exhibit-only">
        <PrintHeader title="Exhibit — Autopilot/Intune Configuration Requirements" sessionCode={state.sessionCode} printOnly>
          {headerMeta}
        </PrintHeader>
      </div>

      <div className="no-print roadmap-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ color: 'var(--color-text-primary)', marginBottom: 4 }}>Requirements &amp; LOE</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
            {p.customerName} — {engagementLabel} — Generated {generatedDate}
            {discoveryMode === 'validation' && (
              <span style={{ marginLeft: 12, color: 'var(--color-warning)', fontWeight: 600 }}>◎ Validation Mode</span>
            )}
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
            Opportunity #{p.opportunityNumber || '—'} &nbsp;·&nbsp; SA: {p.saName || '—'} &nbsp;·&nbsp; Seller: {p.sellerName || '—'}
            {state.sessionCode && <> &nbsp;·&nbsp; Session ID: {state.sessionCode}</>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className={`btn-secondary ${editPanelOpen ? 'option-btn--selected' : ''}`}
            onClick={() => setEditPanelOpen(v => !v)}
            style={{ fontSize: '0.85rem', padding: '8px 16px' }}
          >
            {editPanelOpen ? 'Close Edit Answers' : 'Edit Answers'}
          </button>
          <button className="btn-secondary" onClick={exportCsv} style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
            Export CSV
          </button>
          <button className="btn-secondary" onClick={() => print('printing-ps-exhibit')} disabled={preparingPrint} style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
            Print SOW Exhibit
          </button>
          <button className="btn-secondary" onClick={() => print()} disabled={preparingPrint || loe.loading} style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
            Print Full Summary
          </button>
        </div>
      </div>

      {editPanelOpen && (
        <div className="edit-answers-panel">
          <div className="edit-answers-header">Jump back to a step to update an answer</div>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 12 }}>
            Other answers are preserved. When you click Next from that step, you'll return here and the
            LOE will be regenerated against your changes.
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

      {unvalidatedFields.length > 0 && (
        <div className="unvalidated-items-section ps-exclude-exhibit">
          <div className="unvalidated-items-header">
            <span className="unvalidated-items-icon">⚠</span>
            <span>
              {unvalidatedFields.length} Unvalidated Item{unvalidatedFields.length > 1 ? 's' : ''} — Confirm before SOW
            </span>
          </div>
          <p className="unvalidated-items-body">
            These items were flagged unvalidated during discovery. Unvalidated configuration areas are
            scoped as Not Started (full LOE) until confirmed with the customer's IT team.
          </p>
          <ul className="unvalidated-items-list">
            {unvalidatedFields.map(fieldKey => (
              <li key={fieldKey} className="unvalidated-item">
                <span className="unvalidated-item-label">{PS_FIELD_LABELS[fieldKey] ?? fieldKey}</span>
                <span className="unvalidated-item-action">Confirm with customer IT team</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="ps-summary-tiles ps-exclude-exhibit">
        {[
          { label: 'Engagement Type', value: engagementLabel },
          { label: 'Device Count', value: uv('proServices.deviceCount') ? 'Unvalidated' : labelFor(PS_DEVICE_COUNTS, ps.deviceCount) },
          { label: ps.engagementType === 'migration' ? 'Source MDM' : 'Current MDM', value: uv('proServices.currentMdm') ? 'Unvalidated' : labelForMany(MDM_PLATFORMS, ps.currentMdm) },
          { label: 'OS Landscape', value: uv('proServices.osLandscape') ? 'Unvalidated' : labelForMany(OS_OPTIONS, ps.osLandscape) },
        ].map(({ label, value }) => (
          <div key={label} className="ps-summary-tile">
            <div className="ps-summary-tile-label">{label}</div>
            <div className="ps-summary-tile-value">{value}</div>
          </div>
        ))}
      </div>

      <section className="ps-output-section">
        <h3 className="ps-output-title">
          <span className="ps-output-title-rule" />
          Requirements Table — SOW Exhibit
        </h3>
        <div className="ps-table-wrap">
          <table className="roadmap-table ps-req-table">
            <thead>
              <tr>
                <th style={{ width: '4%' }}>#</th>
                <th style={{ width: '26%' }}>Configuration Area</th>
                <th style={{ width: '14%' }}>Current Status</th>
                <th style={{ width: '56%' }}>What Zones Will Deliver</th>
              </tr>
            </thead>
            <tbody>
              {requirementRows.map(r => (
                <tr key={r.area.key}>
                  <td>{r.num}</td>
                  <td style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{r.area.label}</td>
                  <td><span className={`ps-status ps-status--${r.statusValue}`}>{r.status}</span></td>
                  <td>{r.deliverable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <table className="summary-table ps-complexity-table">
          <tbody>
            {([
              ['Custom integrations required', ps.customIntegrations, 'proServices.customIntegrations', ps.customIntegrationsDetail],
              ['Custom CSP profile requirements', ps.customCspProfiles, 'proServices.customCspProfiles', ps.customCspProfilesDetail],
              ['Multi-tenant requirements', ps.multiTenant, 'proServices.multiTenant', ''],
              ['Third-party application packaging', ps.thirdPartyAppPackaging, 'proServices.thirdPartyAppPackaging', ''],
            ] as [string, boolean | null, string, string][]).map(([label, value, key, detail]) => (
              <tr key={key}>
                <td className="summary-q">{label}</td>
                <td className="summary-a">
                  {uv(key) ? 'Unvalidated' : boolText(value)}
                  {value === true && detail.trim() && <div className="ps-complexity-detail">{detail}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="ps-output-section ps-exclude-exhibit">
        <h3 className="ps-output-title">
          <span className="ps-output-title-rule" />
          Level of Effort Estimate
        </h3>

        <div className="ps-loe-disclaimer">{LOE_DISCLAIMER}</div>

        {blockers.length > 0 ? (
          <div className="alert-card alert-card--warning">
            <div className="alert-title">
              {highComplexity ? 'High complexity — flagged for SA review' : 'Flagged for SA review'} — LOE not generated
            </div>
            <div className="alert-body">
              <ul className="early-exit-gaps">
                {blockers.map(b => <li key={b.reason}>{b.reason}</li>)}
              </ul>
              <p style={{ marginTop: 8 }}>
                The standard framework covers medium-complexity, out-of-box engagements only. Scope this
                engagement with the SA team; the requirements table above can still be used.
              </p>
            </div>
          </div>
        ) : loe.loading ? (
          <ConversationalMessage loading>{null}</ConversationalMessage>
        ) : loe.error ? (
          <div className="alert-card alert-card--danger">
            <div className="alert-title">LOE could not be generated</div>
            <div className="alert-body">{loe.error}</div>
          </div>
        ) : breakdown ? (
          <>
            {loe.summary && <ConversationalMessage>{renderAiText(loe.summary)}</ConversationalMessage>}

            <div className="ps-table-wrap">
              <table className="roadmap-table ps-loe-table">
                <thead>
                  <tr>
                    <th style={{ width: '34%' }}>Phase / Area</th>
                    <th style={{ width: '18%' }}>Status</th>
                    <th style={{ width: '12%' }}>Reduction</th>
                    <th style={{ width: '18%' }}>Baseline</th>
                    <th style={{ width: '18%' }}>Estimate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                      {breakdown.fixed.label}
                      <div className="ps-loe-note">Framework: {breakdown.fixed.basis}</div>
                    </td>
                    <td>—</td>
                    <td>—</td>
                    <td>{formatHours(breakdown.fixed.hoursLow, breakdown.fixed.hoursHigh)}</td>
                    <td>{formatHours(breakdown.fixed.hoursLow, breakdown.fixed.hoursHigh)}</td>
                  </tr>
                  {breakdown.lines.map(l => (
                    <tr key={l.area}>
                      <td style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                        {ps.engagementType === 'migration' ? 'Implement / Migrate' : 'Implement'} — {l.label}
                        {l.rationale && <div className="ps-loe-note">{l.rationale}</div>}
                      </td>
                      <td>{l.statusLabel}</td>
                      <td>{l.factor === 1 ? '—' : `−${Math.round((1 - l.factor) * 100)}%`}</td>
                      <td>{formatHours(l.baseLow, l.baseHigh)}</td>
                      <td>{formatHours(l.adjLow, l.adjHigh)}</td>
                    </tr>
                  ))}
                  <tr className="ps-loe-total">
                    <td colSpan={4}>Total estimate</td>
                    <td>
                      {formatHours(breakdown.totalLow, breakdown.totalHigh)}
                      <div className="ps-loe-note">≈ {formatWeeks(breakdown.totalLow, breakdown.totalHigh)} at 40 h/wk</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {!adim && (
              <p className="ps-loe-note" style={{ marginTop: 8 }}>
                Assessment-only LOE is fixed by device count. Configuration status shapes the assessment
                scope in the requirements table but does not reduce assessment hours.
              </p>
            )}

            {(loe.assumptions.length > 0 || loe.risks.length > 0) && (
              <div className="ps-loe-lists">
                {loe.assumptions.length > 0 && (
                  <div>
                    <div className="ps-loe-list-title">Assumptions</div>
                    <ul>{loe.assumptions.map(a => <li key={a}>{a}</li>)}</ul>
                  </div>
                )}
                {loe.risks.length > 0 && (
                  <div>
                    <div className="ps-loe-list-title">Risks / SA review points</div>
                    <ul>{loe.risks.map(r => <li key={r}>{r}</li>)}</ul>
                  </div>
                )}
              </div>
            )}

            <div className="ps-loe-disclaimer ps-loe-disclaimer--footer">{LOE_DISCLAIMER}</div>
          </>
        ) : (
          <div className="alert-card alert-card--warning">
            <div className="alert-body">The saved LOE no longer matches the current answers. Regenerate to update it.</div>
          </div>
        )}

        {blockers.length === 0 && !loe.loading && (
          <div className="no-print" style={{ marginTop: 12 }}>
            <button className="btn-secondary" onClick={generate} style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
              {loe.generatedAt || loe.error ? 'Regenerate LOE' : 'Generate LOE'}
            </button>
          </div>
        )}
      </section>

      <div className="step-actions">
        <button className="btn-secondary" onClick={() => print('printing-ps-exhibit')} disabled={preparingPrint}>Print SOW Exhibit</button>
        <button className="btn-secondary" onClick={() => print()} disabled={preparingPrint || loe.loading}>Print Full Summary</button>
        <button className="btn-secondary" onClick={onReset}>New Engagement</button>
      </div>
    </div>
  );
}
