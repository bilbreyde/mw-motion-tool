import type { ConfigStatus, ProServicesState, PsDeviceCount, PsEngagementType, PsLoeAreaLine } from '../types';
import { CONFIG_AREAS, configFieldKey, isAdim } from '../components/proServices/psConfig';

// LOE framework from the Zones SA team (Shitij Chandra). The fixed phase durations and the
// status reductions are applied here, deterministically; the AI only proposes the per-area
// Implement/Migrate baseline hours and the narrative around them.

export const HOURS_PER_WEEK = 40;

export const LOE_DISCLAIMER = 'AI Estimate — Pending SA Review. Not for customer distribution until validated.';

// Complete −80%, In Progress −40%, Not Started full LOE.
export const STATUS_FACTOR: Record<ConfigStatus, number> = {
  'complete': 0.2,
  'in-progress': 0.6,
  'not-started': 1,
};

export interface FixedPhase {
  label: string;
  hoursLow: number;
  hoursHigh: number;
  basis: string;
}

export function fixedPhase(type: PsEngagementType | null, count: PsDeviceCount | null): FixedPhase | null {
  if (!type || !count) return null;
  if (type === 'assessment') {
    switch (count) {
      case 'under-250': return { label: 'Assessment', hoursLow: 40, hoursHigh: 40, basis: 'Assessment only, under 250 devices: 1 week' };
      case '251-1000': return { label: 'Assessment', hoursLow: 40, hoursHigh: 60, basis: 'Assessment only, 251–1,000 devices: 40–60 hours' };
      case '1001-5000': return { label: 'Assessment', hoursLow: 80, hoursHigh: 80, basis: 'Assessment only, 1,001–5,000 devices: 2 weeks' };
      case '5000+': return null;
    }
  }
  return count === 'under-250' || count === '251-1000'
    ? { label: 'Assessment + Design', hoursLow: 80, hoursHigh: 80, basis: 'Assessment + Design, up to 1,000 devices: 2 weeks' }
    : { label: 'Assessment + Design', hoursLow: 120, hoursHigh: 160, basis: 'Assessment + Design, over 1,000 devices: 3–4 weeks' };
}

export interface LoeBlocker {
  kind: 'high-complexity' | 'unsizable';
  reason: string;
}

// Any blocker means no LOE is generated — the engagement is flagged for SA review instead.
export function loeBlockers(ps: ProServicesState, uv: string[]): LoeBlocker[] {
  const blockers: LoeBlocker[] = [];
  const flagged = (k: string) => uv.includes(k);

  if (ps.engagementType === null) {
    blockers.push({ kind: 'unsizable', reason: 'Engagement type has not been selected.' });
  }
  if (flagged('proServices.deviceCount') || ps.deviceCount === null) {
    blockers.push({ kind: 'unsizable', reason: 'Device count is unvalidated — the LOE framework is sized by device count.' });
  } else if (ps.engagementType === 'assessment' && ps.deviceCount === '5000+') {
    blockers.push({ kind: 'unsizable', reason: 'Assessment-only engagements over 5,000 devices are outside the LOE framework.' });
  }

  if (isAdim(ps.engagementType)) {
    if (ps.customIntegrations === true) {
      blockers.push({ kind: 'high-complexity', reason: 'Custom integrations required — escalates to high complexity.' });
    } else if (flagged('proServices.customIntegrations')) {
      blockers.push({ kind: 'high-complexity', reason: 'Custom integration requirement is unvalidated — medium complexity cannot be confirmed.' });
    }
    if (ps.customCspProfiles === true) {
      blockers.push({ kind: 'high-complexity', reason: 'Custom CSP profiles required — escalates to high complexity.' });
    } else if (flagged('proServices.customCspProfiles')) {
      blockers.push({ kind: 'high-complexity', reason: 'Custom CSP profile requirement is unvalidated — medium complexity cannot be confirmed.' });
    }
  }

  return blockers;
}

export interface LoeLine {
  area: PsLoeAreaLine['area'];
  label: string;
  statusLabel: string;
  factor: number;
  baseLow: number;
  baseHigh: number;
  adjLow: number;
  adjHigh: number;
  rationale: string;
}

export interface LoeBreakdown {
  fixed: FixedPhase;
  lines: LoeLine[];
  implLow: number;
  implHigh: number;
  totalLow: number;
  totalHigh: number;
}

// Returns null when the AI response is missing an area (Greenfield/Migration only).
export function computeLoe(ps: ProServicesState, uv: string[]): LoeBreakdown | null {
  const fixed = fixedPhase(ps.engagementType, ps.deviceCount);
  if (!fixed) return null;

  const lines: LoeLine[] = [];
  if (isAdim(ps.engagementType)) {
    for (const area of CONFIG_AREAS) {
      const ai = ps.loe.areaLines.find(l => l.area === area.key);
      if (!ai) return null;
      const unvalidated = uv.includes(configFieldKey(area.key));
      const status = ps.configStatus[area.key];
      // Unvalidated or unanswered statuses get full LOE — never assume work is already done.
      const effective: ConfigStatus = unvalidated || status === null ? 'not-started' : status;
      const factor = STATUS_FACTOR[effective];
      const baseLow = Math.max(0, Number(ai.baseHoursLow) || 0);
      const baseHigh = Math.max(baseLow, Number(ai.baseHoursHigh) || 0);
      lines.push({
        area: area.key,
        label: area.label,
        statusLabel: unvalidated ? 'Unvalidated (full LOE)' : ({ 'complete': 'Complete', 'in-progress': 'In Progress', 'not-started': 'Not Started' })[effective],
        factor,
        baseLow,
        baseHigh,
        adjLow: Math.round(baseLow * factor),
        adjHigh: Math.round(baseHigh * factor),
        rationale: ai.rationale ?? '',
      });
    }
  }

  const implLow = lines.reduce((sum, l) => sum + l.adjLow, 0);
  const implHigh = lines.reduce((sum, l) => sum + l.adjHigh, 0);
  return {
    fixed,
    lines,
    implLow,
    implHigh,
    totalLow: fixed.hoursLow + implLow,
    totalHigh: fixed.hoursHigh + implHigh,
  };
}

export function formatHours(low: number, high: number): string {
  return low === high ? `${low} h` : `${low}–${high} h`;
}

export function formatWeeks(low: number, high: number): string {
  const w = (h: number) => (Math.round((h / HOURS_PER_WEEK) * 10) / 10).toString();
  return low === high ? `${w(low)} wk` : `${w(low)}–${w(high)} wk`;
}
