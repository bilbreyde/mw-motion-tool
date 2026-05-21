import { useEffect } from 'react';
import { ConversationalMessage } from '../ConversationalMessage';
import { OptionButton } from '../OptionButton';
import type { CustomerProfile, ReadinessCheck, DeploymentRecommendation, EngagementTriggers, FirstArticle } from '../../types';
import { callMotionAI } from '../../utils/api';

interface Props {
  profile: CustomerProfile;
  readiness: ReadinessCheck;
  recommendation: DeploymentRecommendation;
  triggers: EngagementTriggers;
  firstArticle: FirstArticle;
  onUpdate: (updates: Partial<FirstArticle>) => void;
  onNext: () => void;
}

export function Step5_FirstArticle({
  profile, readiness, recommendation, triggers,
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
              `A First Article is required for all Digital Workplace engagements before production
              scale orders are placed. The first article validates the full provisioning workflow
              — image, enrollment, policy application, and user experience — on a small sample
              of devices.`}
          </p>
        )}
      </ConversationalMessage>

      <div className="form-section">
        <div className="form-label">First Article Required?</div>
        <div className="alert-card alert-card--info" style={{ marginBottom: 16 }}>
          <div className="alert-body">
            Per Zones Digital Workplace policy: a First Article is <strong>always required</strong>{' '}
            before production-scale device orders. This is non-negotiable.
          </div>
        </div>
        <div className="option-grid">
          <OptionButton
            label="Yes — First Article required"
            sublabel="Standard policy — always required"
            selected={firstArticle.required === true}
            onClick={() => onUpdate({ required: true })}
            variant="yes"
          />
          <OptionButton
            label="No — Waiving first article"
            sublabel="Not recommended — document waiver reason"
            selected={firstArticle.required === false}
            onClick={() => onUpdate({ required: false })}
            variant="no"
          />
        </div>
        {firstArticle.required === false && (
          <div className="alert-card alert-card--danger" style={{ marginTop: 12 }}>
            <div className="alert-title">Policy Exception — Document Required</div>
            <div className="alert-body">
              Waiving the First Article requirement is against standard policy. If proceeding, you
              must document the business justification and obtain DW SA and TSC sign-off before
              placing any production order.
            </div>
          </div>
        )}
      </div>

      {firstArticle.required === true && (
        <div className="form-section">
          <div className="form-label">Test Order Required?</div>
          <ConversationalMessage>
            <p>
              Does the First Article require a physical test order (1–3 units) from Zones, or will
              validation be done on existing customer hardware?
            </p>
          </ConversationalMessage>
          <div className="option-grid">
            <OptionButton
              label="Yes — Test order needed"
              sublabel="1–3 units for first article validation"
              selected={firstArticle.testOrderNeeded === true}
              onClick={() => onUpdate({ testOrderNeeded: true })}
              variant="yes"
            />
            <OptionButton
              label="No — Customer has validation hardware"
              sublabel="Existing units will be used"
              selected={firstArticle.testOrderNeeded === false}
              onClick={() => onUpdate({ testOrderNeeded: false })}
              variant="no"
            />
          </div>
        </div>
      )}

      {firstArticle.validationCriteria.length > 0 && (
        <div className="form-section">
          <div className="form-label">Validation Criteria</div>
          <div className="recommendation-card">
            <div className="recommendation-header">
              <span className="recommendation-badge badge--ai">AI-Generated Criteria</span>
            </div>
            <ul style={{ paddingLeft: 18, color: 'var(--color-text-secondary)', lineHeight: 2 }}>
              {firstArticle.validationCriteria.map((criterion, i) => (
                <li key={i} style={{ fontSize: '0.875rem' }}>{criterion}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {firstArticle.required === null && !firstArticle.loading && (
        <div className="alert-card alert-card--info">
          <div className="alert-body">
            Select whether a First Article is required to continue.
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
