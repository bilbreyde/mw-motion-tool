import { ConversationalMessage } from '../ConversationalMessage';
import { YesNoField } from '../YesNoField';
import { isFieldAnswered } from '../../types';
import type { PsStepProps } from './PsFields';
import { isAdim } from './psConfig';

const UV_TEXT = 'Unvalidated — confirm with customer before the LOE is used';

export function PsStep4_Complexity(props: PsStepProps) {
  const { ps, discoveryMode, unvalidatedFields, onUpdate, onNext } = props;
  const answered = (v: unknown, k: string) => isFieldAnswered(v, k, unvalidatedFields);
  const adim = isAdim(ps.engagementType);
  const shared = {
    discoveryMode,
    unvalidatedFields,
    onMarkUnvalidated: props.onMarkUnvalidated,
    onClearUnvalidated: props.onClearUnvalidated,
    unvalidatedFlagText: UV_TEXT,
  };

  const isComplete =
    answered(ps.customIntegrations, 'proServices.customIntegrations') &&
    answered(ps.customCspProfiles, 'proServices.customCspProfiles') &&
    answered(ps.multiTenant, 'proServices.multiTenant') &&
    answered(ps.thirdPartyAppPackaging, 'proServices.thirdPartyAppPackaging');

  const escalated = adim && (ps.customIntegrations === true || ps.customCspProfiles === true);

  return (
    <div className="step-container">
      <ConversationalMessage>
        <p>
          {adim
            ? 'The standard LOE covers medium complexity only — out-of-box configuration with no custom integrations or custom CSP profiles. Either of those escalates the engagement to high complexity: it is flagged for SA review and no LOE is generated.'
            : 'Capture complexity indicators so the assessment scope and findings call them out. For assessment-only engagements these do not block the LOE.'}
        </p>
      </ConversationalMessage>

      <YesNoField
        {...shared}
        label="Are any custom integrations required?"
        liveCopy="e.g. ServiceNow / ITSM connectors, HR-driven provisioning, custom Graph API automation, third-party identity or PKI integrations."
        validationCopy="Based on seller notes: are custom integrations in scope? If unclear, flag as unvalidated."
        value={ps.customIntegrations}
        fieldKey="proServices.customIntegrations"
        onChange={v => onUpdate({ customIntegrations: v })}
        yesLabel="Yes — custom integrations required"
        noLabel="No — out-of-box only"
      />
      {ps.customIntegrations === true && (
        <div className="form-section">
          <div className="form-label">Custom integration detail</div>
          <textarea
            className="text-input"
            rows={2}
            placeholder="Which systems, and what the integration must do"
            value={ps.customIntegrationsDetail}
            onChange={e => onUpdate({ customIntegrationsDetail: e.target.value })}
          />
        </div>
      )}

      <YesNoField
        {...shared}
        label="Are there custom CSP profile requirements?"
        liveCopy="Custom OMA-URI / Configuration Service Provider settings beyond what the Intune settings catalog and templates expose."
        validationCopy="Based on seller notes: are custom CSP / OMA-URI profiles required? If unclear, flag as unvalidated."
        value={ps.customCspProfiles}
        fieldKey="proServices.customCspProfiles"
        onChange={v => onUpdate({ customCspProfiles: v })}
        yesLabel="Yes — custom CSP profiles required"
        noLabel="No — settings catalog / templates only"
      />
      {ps.customCspProfiles === true && (
        <div className="form-section">
          <div className="form-label">Custom CSP profile detail</div>
          <textarea
            className="text-input"
            rows={2}
            placeholder="Which settings / CSPs, and why the settings catalog does not cover them"
            value={ps.customCspProfilesDetail}
            onChange={e => onUpdate({ customCspProfilesDetail: e.target.value })}
          />
        </div>
      )}

      {escalated && (
        <div className="alert-card alert-card--warning">
          <div className="alert-title">High complexity — flagged for SA review</div>
          <div className="alert-body">
            No LOE will be generated for this engagement. The requirements table is still produced;
            scope the custom work with the SA team before pricing.
          </div>
        </div>
      )}

      <YesNoField
        {...shared}
        label="Are there multi-tenant requirements?"
        liveCopy="More than one Entra ID / Intune tenant in scope (subsidiaries, M&A, segregated environments)."
        validationCopy="Based on seller notes: does the engagement span multiple tenants? If unclear, flag as unvalidated."
        value={ps.multiTenant}
        fieldKey="proServices.multiTenant"
        onChange={v => onUpdate({ multiTenant: v })}
        yesLabel="Yes — multiple tenants"
        noLabel="No — single tenant"
      />

      <YesNoField
        {...shared}
        label="Is third-party application packaging required?"
        liveCopy="Line-of-business or third-party apps that Zones must package (Win32 / MSIX), not just assign from the Store or an existing package."
        validationCopy="Based on seller notes: will Zones package third-party apps? If unclear, flag as unvalidated."
        value={ps.thirdPartyAppPackaging}
        fieldKey="proServices.thirdPartyAppPackaging"
        onChange={v => onUpdate({ thirdPartyAppPackaging: v })}
        yesLabel="Yes — packaging required"
        noLabel="No — apps already packaged"
      />

      <div className="step-actions">
        <button className="btn-primary" onClick={onNext} disabled={!isComplete}>
          Continue to Requirements &amp; LOE →
        </button>
      </div>
    </div>
  );
}
