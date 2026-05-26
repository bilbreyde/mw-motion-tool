import { useEffect } from 'react';
import { ConversationalMessage } from '../ConversationalMessage';
import { OptionButton } from '../OptionButton';
import type { CustomerProfile, ReadinessCheck, DeploymentRecommendation, DiscoveryMode, ImageType, ProvisioningModel } from '../../types';
import { callMotionAI } from '../../utils/api';

interface Props {
  profile: CustomerProfile;
  discoveryMode: DiscoveryMode;
  unvalidatedFields: string[];
  readiness: ReadinessCheck;
  recommendation: DeploymentRecommendation;
  onUpdate: (updates: Partial<DeploymentRecommendation>) => void;
  onNext: () => void;
}

const IMAGE_OPTIONS: { value: ImageType; label: string; sublabel: string }[] = [
  {
    value: 'clean-image',
    label: 'Clean Image (Zones Build)',
    sublabel: 'Preferred — Zones-built, tested, Autopilot-ready baseline; fully auditable',
  },
  {
    value: 'oem-ready',
    label: 'OEM Ready Image',
    sublabel: 'Fallback only — requires additional validation; not preferred',
  },
];

const PROVISIONING_OPTIONS: { value: ProvisioningModel; label: string; sublabel: string }[] = [
  {
    value: 'pre-provisioning',
    label: 'Pre-Provisioning (Technician / White Glove)',
    sublabel: 'Zones TSC completes device configuration before user-facing OOBE',
  },
  {
    value: 'user-driven',
    label: 'User-Driven (Self-Service OOBE)',
    sublabel: 'End user authenticates and completes enrollment at first boot',
  },
  {
    value: 'hybrid',
    label: 'Hybrid (Mixed Fleet)',
    sublabel: 'Combination — pre-provisioning for some roles, user-driven for others',
  },
];

export function Step3_DeploymentModel({ profile, discoveryMode, unvalidatedFields, readiness, recommendation, onUpdate, onNext }: Props) {
  const canProceed = recommendation.imageType !== null && recommendation.provisioningModel !== null;

  useEffect(() => {
    if (!recommendation.aiRationale && !recommendation.loading) {
      onUpdate({ loading: true });
      callMotionAI({
        step: 3,
        action: 'recommend-deployment',
        customerProfile: profile,
        discoveryMode,
        unvalidatedFields,
        readinessCheck: readiness,
      })
        .then(res => {
          onUpdate({
            loading: false,
            aiRationale: res.rationale ?? res.message ?? '',
            imageType: res.imageType ?? null,
            provisioningModel: res.provisioningModel ?? null,
          });
        })
        .catch(() => {
          onUpdate({ loading: false, aiRationale: '' });
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="step-container">
      <ConversationalMessage loading={recommendation.loading}>
        {recommendation.loading ? null : (
          <p>
            {recommendation.aiRationale ||
              `Based on the technical discovery — ${profile.entraJoinType} join type,
              ${profile.coManagementStatus} co-management status, Autopilot profile
              ${readiness.autopilotProfileType ?? 'confirmed'} — here is the recommended
              deployment model. Review with TSC before finalizing.`}
          </p>
        )}
      </ConversationalMessage>

      {unvalidatedFields.some(f => f.startsWith('customerProfile.') || f.startsWith('readinessCheck.')) && (
        <div className="alert-card alert-card--warning">
          <div className="alert-title">Recommendation Based on Partial Data</div>
          <div className="alert-body">
            Some discovery fields are unvalidated. The AI recommendation below is based on
            available information. Confirm unvalidated items with the customer's IT team
            before treating this recommendation as final.
          </div>
        </div>
      )}

      <div className="form-section">
        <div className="form-label">Image Type</div>
        {recommendation.imageType === 'oem-ready' && (
          <div className="alert-card alert-card--warning">
            <div className="alert-title">Non-Preferred Selection</div>
            <div className="alert-body">
              OEM Ready Image selected. Clean Image is always preferred. If selecting OEM Ready,
              document the technical justification in your scoping notes for TSC review.
            </div>
          </div>
        )}
        <div className="option-grid option-grid--wide">
          {IMAGE_OPTIONS.map(o => (
            <div key={o.value} style={{ position: 'relative' }}>
              {o.value === 'clean-image' && (
                <span
                  className="recommendation-badge badge--preferred"
                  style={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
                >
                  Preferred
                </span>
              )}
              <OptionButton
                label={o.label}
                sublabel={o.sublabel}
                selected={recommendation.imageType === o.value}
                onClick={() => onUpdate({ imageType: o.value })}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="form-section">
        <div className="form-label">Provisioning Model</div>
        {readiness.autopilotProfileType === 'user-driven-haadj' && (
          <div className="alert-card alert-card--info">
            <div className="alert-body">
              Hybrid AADJ profile detected. Pre-Provisioning (White Glove) requires domain
              controller line-of-sight during the technician phase. Confirm network connectivity
              at the Zones staging facility with TSC before selecting this model.
            </div>
          </div>
        )}
        <div className="option-grid option-grid--wide">
          {PROVISIONING_OPTIONS.map(o => (
            <OptionButton
              key={o.value}
              label={o.label}
              sublabel={o.sublabel}
              selected={recommendation.provisioningModel === o.value}
              onClick={() => onUpdate({ provisioningModel: o.value })}
            />
          ))}
        </div>
      </div>

      {recommendation.imageType && recommendation.provisioningModel && (
        <div className="recommendation-card">
          <div className="recommendation-header">
            <span className="recommendation-badge badge--ai">Selected Model</span>
            <h4 style={{ color: 'var(--color-text-primary)' }}>
              {recommendation.imageType === 'clean-image' ? 'Zones Clean Image' : 'OEM Ready Image'}
              {' + '}
              {recommendation.provisioningModel === 'pre-provisioning'
                ? 'Pre-Provisioning'
                : recommendation.provisioningModel === 'user-driven'
                ? 'User-Driven'
                : 'Hybrid'}
            </h4>
          </div>
          <div className="alert-card alert-card--info" style={{ margin: 0 }}>
            <div className="alert-body">
              TSC Provisioning is required for this engagement. Provide TSC with the
              Autopilot profile configuration, Entra join type, and any co-management
              workload settings before the alignment call.
            </div>
          </div>
        </div>
      )}

      <div className="step-actions">
        <button className="btn-primary" onClick={onNext} disabled={!canProceed}>
          Continue to Engagement Triggers →
        </button>
      </div>
    </div>
  );
}
