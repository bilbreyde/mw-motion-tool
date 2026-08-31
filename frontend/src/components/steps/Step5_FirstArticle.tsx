import { useEffect } from 'react';
import { ConversationalMessage } from '../ConversationalMessage';
import type {
  CustomerProfile, ReadinessCheck, DeploymentRecommendation,
  EngagementTriggers, FirstArticle, DiscoveryMode
} from '../../types';
import { callMotionAI } from '../../utils/api';
import { renderAiText } from '../../utils/formatAiText';

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
  const canProceed = firstArticle.required !== null;

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
        {firstArticle.loading ? null : firstArticle.aiGuidance ? (
          renderAiText(firstArticle.aiGuidance)
        ) : (
          <p>
            As the DW SA, you are responsible for defining and documenting the first article
            validation criteria for this engagement. Do not delegate this specification to TSC
            or the account team without providing a written acceptance checklist. A first article
            is required before any production-scale device order is placed.
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
        <div className="form-label">First Article Requirement</div>
        <div className="alert-card alert-card--info">
          <div className="alert-title">Always Required — No Exceptions</div>
          <div className="alert-body">
            A first article is always required before production scale. This is non-negotiable.
          </div>
        </div>
      </div>

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
