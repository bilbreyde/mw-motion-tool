import type { CustomerProfile } from '../types';

interface Props {
  profile: CustomerProfile;
  readiness: { autopilotReady: boolean | null; intuneReady: boolean | null };
  onReset: () => void;
}

export function ProServicesRoute({ profile, readiness, onReset }: Props) {
  const gaps: string[] = [];
  if (!readiness.autopilotReady) gaps.push('Windows Autopilot — not in production');
  if (!readiness.intuneReady) gaps.push('Intune/MDM — not in production');

  return (
    <div className="step-container">
      <div style={{ marginBottom: 24 }}>
        <span style={{
          display: 'inline-block',
          padding: '4px 12px',
          background: 'var(--color-warning-dim)',
          color: 'var(--color-warning)',
          borderRadius: 20,
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          marginBottom: 16,
        }}>
          Readiness Gate — Routed to Pro Services
        </span>
        <h2 style={{ color: 'var(--color-text-primary)', marginBottom: 8 }}>
          {profile.customerName || 'This customer'} needs a readiness engagement
        </h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Based on the answers provided, this customer is not yet ready for a standard Modern
          Workplace deployment motion. This is normal — the right play is a Zones Pro Services
          readiness engagement to close the gaps.
        </p>
      </div>

      <div className="recommendation-card" style={{ marginBottom: 24 }}>
        <div className="recommendation-header">
          <span className="recommendation-badge badge--blocked">Readiness Gaps</span>
        </div>
        <ul style={{ paddingLeft: 18, color: 'var(--color-text-secondary)', lineHeight: 2.2 }}>
          {gaps.map((gap, i) => (
            <li key={i} style={{ fontSize: '0.9rem', color: 'var(--color-danger)' }}>{gap}</li>
          ))}
        </ul>
      </div>

      <div className="alert-card alert-card--info">
        <div className="alert-title">Recommended Path — Pro Services Readiness Engagement</div>
        <div className="alert-body" style={{ lineHeight: 2 }}>
          <strong>Step 1:</strong> Contact your DW SA to initiate a Pro Services readiness scoping call<br />
          <strong>Step 2:</strong> Pro Services will assess the Autopilot and/or Intune environment<br />
          <strong>Step 3:</strong> Zones will deliver the readiness engagement (Autopilot setup, Intune
          enrollment configuration, policy baseline)<br />
          <strong>Step 4:</strong> Once production-ready, re-run this Motion Tool to begin standard deployment scoping
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <div className="form-label">Relevant Zones Services</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          {[
            { name: 'Digital Workplace Readiness Assessment', desc: 'Gap analysis and remediation roadmap for Autopilot and Intune production readiness' },
            { name: 'Intune Environment Build', desc: 'Tenant configuration, policy baseline, enrollment profile setup, compliance rules' },
            { name: 'Autopilot Configuration Service', desc: 'Autopilot profile creation, hardware hash enrollment, OOBE workflow testing' },
          ].map(s => (
            <div key={s.name} style={{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
            }}>
              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 2 }}>{s.name}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="step-actions" style={{ marginTop: 32 }}>
        <button className="btn-secondary" onClick={onReset}>Start New Engagement</button>
      </div>
    </div>
  );
}
