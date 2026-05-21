import { useEffect } from 'react';
import { ConversationalMessage } from '../ConversationalMessage';
import { OptionButton } from '../OptionButton';
import type { CustomerProfile, ReadinessCheck, DeploymentRecommendation, ImageType, ProvisioningModel } from '../../types';
import { callMotionAI } from '../../utils/api';

interface Props {
  profile: CustomerProfile;
  readiness: ReadinessCheck;
  recommendation: DeploymentRecommendation;
  onUpdate: (updates: Partial<DeploymentRecommendation>) => void;
  onNext: () => void;
}

const IMAGE_OPTIONS: { value: ImageType; label: string; sublabel: string }[] = [
  {
    value: 'clean-image',
    label: 'Clean Image (Zones Build)',
    sublabel: 'Preferred — Zones-built, tested, Autopilot-ready baseline',
  },
  {
    value: 'oem-ready',
    label: 'OEM Ready Image',
    sublabel: 'Fallback only — requires additional validation',
  },
];

const PROVISIONING_OPTIONS: { value: ProvisioningModel; label: string; sublabel: string }[] = [
  {
    value: 'pre-provisioning',
    label: 'Pre-Provisioning (Technician Flow)',
    sublabel: 'Zones stages the device fully before delivery',
  },
  {
    value: 'user-driven',
    label: 'User-Driven (Self-Service)',
    sublabel: 'End user completes OOBE enrollment',
  },
  {
    value: 'hybrid',
    label: 'Hybrid (Mixed Fleet)',
    sublabel: 'Combination based on role or device type',
  },
];

export function Step3_DeploymentModel({ profile, readiness, recommendation, onUpdate, onNext }: Props) {
  const canProceed = recommendation.imageType !== null && recommendation.provisioningModel !== null;

  useEffect(() => {
    if (!recommendation.aiRationale && !recommendation.loading) {
      onUpdate({ loading: true });
      callMotionAI({
        step: 3,
        action: 'recommend-deployment',
        customerProfile: profile,
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
              `Based on ${profile.customerName}'s profile — ${profile.environmentType} environment,
              ${profile.deviceVolume} devices, on ${profile.deploymentTimeline} timeline — here is the
              recommended deployment model. You can override these if the customer situation warrants.`}
          </p>
        )}
      </ConversationalMessage>

      <div className="form-section">
        <div className="form-label">Image Type</div>

        {recommendation.imageType === 'oem-ready' && (
          <div className="alert-card alert-card--warning">
            <div className="alert-title">Note</div>
            <div className="alert-body">
              OEM Ready Image selected. Clean Image is always preferred for quality and consistency.
              Only use OEM Ready Image when Clean Image is explicitly not feasible for this engagement.
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
            <span className="recommendation-badge badge--ai">AI Selection</span>
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
              TSC Provisioning is required for this engagement. Ensure TSC alignment is scheduled
              before any device order is placed.
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
