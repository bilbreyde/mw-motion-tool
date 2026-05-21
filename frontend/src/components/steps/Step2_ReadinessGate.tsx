import { ConversationalMessage } from '../ConversationalMessage';
import { OptionButton } from '../OptionButton';
import type { CustomerProfile, ReadinessCheck } from '../../types';

interface Props {
  profile: CustomerProfile;
  readiness: ReadinessCheck;
  onUpdate: (updates: Partial<ReadinessCheck>) => void;
  onNext: () => void;
  onRouteToProServices: () => void;
}

export function Step2_ReadinessGate({ profile, readiness, onUpdate, onNext, onRouteToProServices }: Props) {
  const bothAnswered = readiness.autopilotReady !== null && readiness.intuneReady !== null;
  const blocked = bothAnswered && (!readiness.autopilotReady || !readiness.intuneReady);
  const canProceed = bothAnswered && readiness.autopilotReady && readiness.intuneReady;

  function handleAutopilot(value: boolean) {
    onUpdate({ autopilotReady: value });
  }

  function handleIntune(value: boolean) {
    onUpdate({ intuneReady: value });
  }

  return (
    <div className="step-container">
      <ConversationalMessage>
        <p>
          Before recommending a deployment model, we need to confirm that{' '}
          <strong>{profile.customerName || 'this customer'}</strong> is operationally ready for modern
          provisioning. Answer both questions honestly — a "No" isn't a dead end, it's a handoff to Pro
          Services who can get them there.
        </p>
      </ConversationalMessage>

      <div className="form-section">
        <div className="form-label">Windows Autopilot Status</div>
        <ConversationalMessage>
          <p>
            Is Windows Autopilot currently configured and in <strong>production</strong> use? This means
            devices are actively enrolling via Autopilot — not just piloted or planned.
          </p>
        </ConversationalMessage>
        <div className="option-grid">
          <OptionButton
            label="Yes — Autopilot is production-ready"
            sublabel="Devices are actively enrolling"
            selected={readiness.autopilotReady === true}
            onClick={() => handleAutopilot(true)}
            variant="yes"
          />
          <OptionButton
            label="No — Not configured or in pilot only"
            sublabel="Route to Pro Services for readiness"
            selected={readiness.autopilotReady === false}
            onClick={() => handleAutopilot(false)}
            variant="no"
          />
        </div>
      </div>

      <div className="form-section">
        <div className="form-label">Intune / MDM Production Status</div>
        <ConversationalMessage>
          <p>
            Is Microsoft Intune (or the customer's MDM platform) configured and actively managing
            devices in <strong>production</strong>? Policies, compliance rules, and app deployment must
            be live — not in evaluation.
          </p>
        </ConversationalMessage>
        <div className="option-grid">
          <OptionButton
            label="Yes — MDM is managing devices in production"
            sublabel="Policies and compliance are active"
            selected={readiness.intuneReady === true}
            onClick={() => handleIntune(true)}
            variant="yes"
          />
          <OptionButton
            label="No — MDM not in production"
            sublabel="Evaluation, pilot, or not deployed"
            selected={readiness.intuneReady === false}
            onClick={() => handleIntune(false)}
            variant="no"
          />
        </div>
      </div>

      {blocked && (
        <>
          <div className="alert-card alert-card--danger">
            <div className="alert-title">Readiness Gate — BLOCKED</div>
            <div className="alert-body">
              {!readiness.autopilotReady && !readiness.intuneReady
                ? 'Both Autopilot and Intune/MDM must be production-ready before proceeding with a standard Modern Workplace motion.'
                : !readiness.autopilotReady
                ? 'Windows Autopilot must be in production before standard provisioning can be scoped.'
                : 'Intune/MDM must be in production before standard provisioning can be scoped.'}
              <br /><br />
              <strong>Next step:</strong> Route this customer to Zones Modern Workplace Pro Services for
              a readiness engagement. Pro Services will assess gaps, build the environment, and re-qualify
              for production motion.
            </div>
          </div>

          <div className="step-actions">
            <button className="btn-primary" onClick={onRouteToProServices}>
              Route to Pro Services →
            </button>
          </div>
        </>
      )}

      {canProceed && (
        <>
          <div className="alert-card alert-card--success">
            <div className="alert-title">Readiness Gate — PASSED</div>
            <div className="alert-body">
              Both Autopilot and Intune/MDM are production-ready. This customer qualifies for the
              standard Modern Workplace deployment motion. Proceeding to deployment model selection.
            </div>
          </div>

          <div className="step-actions">
            <button className="btn-primary" onClick={onNext}>
              Continue to Deployment Model →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
