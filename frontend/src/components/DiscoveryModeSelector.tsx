import type { DiscoveryMode } from '../types';

interface Props {
  onSelect: (mode: DiscoveryMode) => void;
}

export function DiscoveryModeSelector({ onSelect }: Props) {
  return (
    <div className="discovery-mode-selector">
      <div className="discovery-mode-inner">
        <div className="discovery-mode-header">
          <div className="sidebar-logo" style={{ fontSize: '1.3rem', marginBottom: 6 }}>ZONES</div>
          <h1 style={{ color: 'var(--color-text-primary)', marginBottom: 8 }}>
            Digital Workplace Motion Tool
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: 480, margin: '0 auto 8px' }}>
            SA-guided technical discovery and deployment scoping for Digital Workplace engagements.
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', maxWidth: 480, margin: '0 auto' }}>
            Before starting, confirm your discovery context. This controls how questions are framed
            and whether fields can be flagged as unvalidated.
          </p>
        </div>

        <div className="discovery-mode-question">
          Is the customer's IT team on this call?
        </div>

        <div className="discovery-mode-cards">
          <button className="mode-card mode-card--live" onClick={() => onSelect('live')}>
            <div className="mode-card-icon">◉</div>
            <div className="mode-card-title">Yes — Live Discovery</div>
            <div className="mode-card-desc">
              The customer's IT team is on this call. Questions are framed as direct technical
              discovery. Answers are captured in real time from the people who own the environment.
            </div>
            <ul className="mode-card-list">
              <li>Direct, specific technical questions</li>
              <li>Answers treated as confirmed</li>
              <li>Higher confidence for ordering</li>
            </ul>
            <div className="mode-card-cta">Start Live Discovery →</div>
          </button>

          <button className="mode-card mode-card--validation" onClick={() => onSelect('validation')}>
            <div className="mode-card-icon">◎</div>
            <div className="mode-card-title">No — Working from Seller Notes</div>
            <div className="mode-card-desc">
              No IT contact on this call. You are validating information provided by the account
              team or seller. Any item that cannot be confirmed must be flagged.
            </div>
            <ul className="mode-card-list">
              <li>Each question includes an "Unvalidated" flag option</li>
              <li>Flagged items tracked and surfaced in roadmap</li>
              <li>Do not proceed to order until all flags resolved</li>
            </ul>
            <div className="mode-card-cta">Start Validation Mode →</div>
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 24 }}>
          Both paths follow the same six-step discovery process.
          You can start a new engagement at any time to switch modes.
        </p>
      </div>
    </div>
  );
}
