import { Profile, PublicProfile, InsemPref, InvolvementLevel } from '@/types/database';

const INVOLVEMENT_ORDER: InvolvementLevel[] = [
  'anonymous',
  'identity_release',
  'limited_contact',
  'known_donor',
  'co_parenting',
];

function insemCompatible(a: InsemPref | null, b: InsemPref | null): boolean {
  if (!a || !b) return false;
  if (a === 'both' || b === 'both') return true;
  return a === b;
}

function involvementGap(a: InvolvementLevel | null, b: InvolvementLevel | null): number {
  if (!a || !b) return 4;
  const ai = INVOLVEMENT_ORDER.indexOf(a);
  const bi = INVOLVEMENT_ORDER.indexOf(b);
  return Math.abs(ai - bi);
}

function insemLabel(a: InsemPref | null, b: InsemPref | null): string {
  if (a === 'both' || b === 'both') return 'Compatible methods';
  if (a === 'ai' && b === 'ai') return 'Both chose AI';
  if (a === 'ni' && b === 'ni') return 'Both chose NI';
  return 'Preferences differ';
}

function involvementLabel(a: InvolvementLevel | null, b: InvolvementLevel | null): string {
  const gap = involvementGap(a, b);
  if (gap === 0 && a) return `Both: ${a.replace(/_/g, ' ')}`;
  if (gap === 1) return '1 tier apart';
  if (gap === 2) return '2 tiers apart';
  return 'Far apart';
}

export interface CompatFactor {
  label: string;
  detail: string;
  matched: boolean;
}

export interface CompatResult {
  score: number;
  factors: CompatFactor[];
}

export function scoreCompatibility(mine: Profile, theirs: PublicProfile): CompatResult {
  const factors: CompatFactor[] = [];
  let total = 0;

  // Insemination preference — 30 pts
  const insemMatch = insemCompatible(mine.insemination_preference, theirs.insemination_preference);
  total += insemMatch ? 30 : 0;
  factors.push({
    label: 'Insemination',
    detail: insemLabel(mine.insemination_preference, theirs.insemination_preference),
    matched: insemMatch,
  });

  // Involvement level proximity — 30 pts (full at 0 gap, 20 at 1, 10 at 2, 0 beyond)
  const gap = involvementGap(mine.involvement_level, theirs.involvement_level);
  total += gap === 0 ? 30 : gap === 1 ? 20 : gap === 2 ? 10 : 0;
  factors.push({
    label: 'Involvement',
    detail: involvementLabel(mine.involvement_level, theirs.involvement_level),
    matched: gap <= 1,
  });

  // Same country — 20 pts
  const sameCountry = !!(mine.country && theirs.country && mine.country === theirs.country);
  total += sameCountry ? 20 : 0;
  factors.push({
    label: 'Location',
    detail: sameCountry ? `Both in ${mine.country}` : 'Different countries',
    matched: sameCountry,
  });

  // Combined experience — 20 pts
  const combined = (mine.journeys_completed ?? 0) + (theirs.journeys_completed ?? 0);
  total += combined >= 3 ? 20 : combined >= 1 ? 10 : 0;
  factors.push({
    label: 'Experience',
    detail: combined === 0 ? 'Both new to this' : `${combined} journey${combined > 1 ? 's' : ''} combined`,
    matched: combined > 0,
  });

  return { score: Math.round(total), factors };
}

// Returns a short summary string for compact UI (e.g. like-compose pill)
export function compatSummary(mine: Profile, theirs: PublicProfile): string {
  const parts: string[] = [];
  if (insemCompatible(mine.insemination_preference, theirs.insemination_preference)) {
    parts.push(mine.insemination_preference === 'ai' || theirs.insemination_preference === 'ai' ? 'AI' : 'NI');
  }
  const gap = involvementGap(mine.involvement_level, theirs.involvement_level);
  if (gap === 0) parts.push('Exact involvement match');
  else if (gap === 1) parts.push('1 tier apart');
  if (mine.country && theirs.country && mine.country === theirs.country) parts.push(mine.country);
  return parts.join(' · ');
}
