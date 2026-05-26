import { useEffect } from 'react';
import { ConversationalMessage } from '../ConversationalMessage';
import { OptionButton } from '../OptionButton';
import type {
  CustomerProfile, ReadinessCheck, DeploymentRecommendation,
  EngagementTriggers, FirstArticle, DiscoveryMode
} from '../../types';
import { callMotionAI } from '../../utils/api';

interface Props {
  profile: CustomerProfile;
  discoveryMode: DiscoveryMode;
  unvalidatedFields: string[];
  readiness: ReadinessCheck;
  recommendation: DeploymentRecommendation;
  triggers: EngagementTriggers;
  firstArticle: FirstArticle;
  onUpdate: (updates: Partial<FirstArticle>) => void;
  onNext: () => void;
}

export function Step5_FirstArticle({
  profile, discoveryMode, unvalidatedFields,
  readiness, recommendation, triggers,
  firstArticle, onUpdate, onNext
}: Props) {
  const canProceed = firstArticle.required !== null && firstArticle.testOrderNeeded !== null;

  useEffect(() => {
    if (!firstArticle.aiGuidance && !firstArticle.loading && firstArticle.required === null) {
      onUpdate({ loading: true });
      callMotionAI({
        step: 5,
        action: 'first-article-guidance',
        customerProfile: profile,
        discoveryMode,
        unvalidatedFields,
        readinessCheck: readiness,
        deploymentRecommendation: recommendation,
        engagementTriggers: triggers,
      })
        .then(res => {
          onUpdate({
            loading: false,
            aiGuidance: res.guidance ?? res.message ?? '',
            validationCriteria: res.validationCriteria ?? [],
            required: true,
          });
        })
        .catch(() => {
          onUpdate({ loading: false, aiGuidance: '', required: true });
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="step-container">
      <ConversationalMessage loading={firstArticle.loading}>
        {firstArticle.loading ? null : (
          <p>
            {firstArticle.aiGuidance ||
              `As the DW SA, you are responsible for defining and documenting the first article
              validation criteria for this engagement. Do not delegate this specification to TSC
              or the account team without providing a written acceptance checklist. A first article
              is required before any production-scale device order is placed.`}
          </p>
        )}
      </ConversationalMessage>

      {unvalidatedFields.length > 0 && (
        <div className="alert-card alert-card--warning">
          <div className="alert-title">Unvalidated Items Affect First Article Scope</div>
          <div className="alert-body">
            {unvalidatedFields.length} field{unvalidatedFields.length > 1 ? 's' : ''} in your
            discovery are flagged as unvalidated. First article criteria may need revision once
            those fields are confirmed with the customer's IT team. Review the roadmap in Step 6
            for the full list.
          </div>
        </div>
      )}

      <div className="form-section">
        <div className="form-label">First Article Required?</div>
        <div className="alert-card alert-card--info" style={{ marginBottom: 16 }}>
          <div className="alert-body">
            Per Zones Digital Workplace policy: a First Article is <strong>always required</strong>{' '}
            before production-scale device orders. The SA owns this requirement — if a customer
            or account team pushes back, escalate rather than waive.
          </div>
        </div>
        <div className="option-grid">
          <OptionButton
            label="Yes — First Article required"
            sublabel="Policy standard — always required before scale orders"
            selected={firstArticle.required === true}
            onClick={() => onUpdate({ required: true })}
            variant="yes"
          />
          <OptionButton
            label="No — Waiving first article"
            sublabel="Exception only — SA must document and escalate"
            selected={firstArticle.required === false}
            onClick={() => onUpdate({ required: false })}
            variant="no"
          />
        </div>
        {firstArticle.required === false && (
          <div className="alert-card alert-card--danger" style={{ marginTop: 12 }}>
            <div className="alert-title">Policy Exception — SA Escalation Required</div>
            <div className="alert-body">
              Waiving the First Article is a policy exception. As SA, you must document the
              business justification in writing and obtain sign-off from your team lead, TSC,
              and the account team before any production order is placed. This exception does
              not remove your accountability for deployment quality.
            </div>
          </div>
        )}
      </div>

      {firstArticle.required === true && (
        <div className="form-section">
          <div className="form-label">Test Order Required?</div>
          <ConversationalMessage>
            {discoveryMode === 'live' ? (
              <p>
                Does the First Article require Zones to ship 1–3 physical test units for
                validation, or does the customer have existing hardware at a test site that
                can be used? Confirm with the customer's IT team whether they can provide
                units and a staging environment, or if Zones needs to supply them.
              </p>
            ) : (
              <p>
                Based on available information: does the first article require a physical
                test order from Zones, or can the customer provide test hardware?
              </p>
            )}
          </ConversationalMessage>
          <div className="option-grid">
            <OptionButton
              label="Yes — Test order required from Zones"
              sublabel="1–3 units for first article; SA to specify model and config"
              selected={firstArticle.testOrderNeeded === true}
              onClick={() => onUpdate({ testOrderNeeded: true })}
              variant="yes"
            />
            <OptionButton
              label="No — Customer provides test hardware"
              sublabel="Existing customer units used for first article validation"
              selected={firstArticle.testOrderNeeded === false}
              onClick={() => onUpdate({ testOrderNeeded: false })}
              variant="no"
            />
          </div>
        </div>
      )}

      {firstArticle.validationCriteria.length > 0 && (
        <div className="form-section">
          <div className="form-label">SA-Defined Validation Criteria</div>
          <div className="recommendation-card">
            <div className="recommendation-header">
              <span className="recommendation-badge badge--ai">AI-Generated — SA Review Required</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 12 }}>
              Review and adjust these criteria before sharing with TSC. You own the acceptance
              definition — TSC executes against your specification.
            </p>
            <ul style={{ paddingLeft: 18, color: 'var(--color-text-secondary)', lineHeight: 2 }}>
              {firstArticle.validationCriteria.map((criterion, i) => (
                <li key={i} style={{ fontSize: '0.875rem' }}>{criterion}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="step-actions">
        <button
          className="btn-primary"
          onClick={onNext}
          disabled={!canProceed || firstArticle.loading}
        >
          Generate Roadmap →
        </button>
      </div>
    </div>
  );
}
