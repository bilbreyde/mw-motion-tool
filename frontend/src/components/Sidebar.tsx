import type { DiscoveryMode } from '../types';
import { STEP_LABELS } from '../types';

interface SidebarProps {
  currentStep: number;
  completedSteps: Set<number>;
  discoveryMode: DiscoveryMode | null;
  blockedAtStep?: number;
  onStepClick: (step: number) => void;
  onReset: () => void;
}

const CHECK = '✓';

export function Sidebar({ currentStep, completedSteps, discoveryMode, blockedAtStep, onStepClick, onReset }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">ZONES</div>
        <div className="sidebar-subtitle">Digital Workplace Motion Tool</div>
        {discoveryMode && (
          <div className={`discovery-mode-badge ${discoveryMode === 'live' ? 'discovery-mode-badge--live' : 'discovery-mode-badge--validation'}`}>
            {discoveryMode === 'live' ? '◉ Live Discovery' : '◎ Validation Mode'}
          </div>
        )}
      </div>

      <nav className="sidebar-steps">
        {Object.entries(STEP_LABELS).map(([stepStr, label], index) => {
          const step = Number(stepStr);
          const isActive = step === currentStep;
          const isComplete = completedSteps.has(step);
          const isBlocked = blockedAtStep !== undefined && step > blockedAtStep;
          const isDisabled = !isComplete && !isActive && (step > currentStep || isBlocked);

          const cls = [
            'step-item',
            isActive ? 'step-item--active' : '',
            isComplete ? 'step-item--complete' : '',
            isDisabled ? 'step-item--disabled' : '',
          ].filter(Boolean).join(' ');

          const connectorCls = [
            'step-connector',
            isComplete ? 'step-connector--complete' : '',
          ].filter(Boolean).join(' ');

          return (
            <div key={step}>
              <div
                className={cls}
                onClick={() => !isDisabled && onStepClick(step)}
                role="button"
                aria-current={isActive ? 'step' : undefined}
                tabIndex={isDisabled ? -1 : 0}
                onKeyDown={e => e.key === 'Enter' && !isDisabled && onStepClick(step)}
              >
                <div className="step-number">
                  {isComplete ? CHECK : step}
                </div>
                <span className="step-label">{label}</span>
              </div>
              {index < Object.keys(STEP_LABELS).length - 1 && (
                <div className={connectorCls} />
              )}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="reset-btn" onClick={onReset}>
          New Engagement
        </button>
      </div>
    </aside>
  );
}
