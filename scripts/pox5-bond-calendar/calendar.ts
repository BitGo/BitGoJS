import { Anchor } from './networks';

export interface ResolvedNetwork {
  coin: string;
  burnChain: string;
  stacksOnly: boolean;
  activationBurnHeight: number;
  rewardCycleBlocks: number;
  preparePhaseBlocks: number;
  avgBlockSeconds: number;
  anchor: Anchor;
  anchorSource: 'default' | 'override' | 'live';
  sources: string[];
}

export interface BondInput {
  network: string;
  label?: string;
  amount?: bigint;
  unlockBurnHeight?: number;
  lockHeight?: number;
  startBurnHt?: number;
  numCycles?: number;
}

export type EventKind =
  | 'lockup-funding'
  | 'registration-window'
  | 'reward-cycle'
  | 'cltv-unlock'
  | 'post-cltv-recovery'
  | 'stx-lock-end';

export interface CalendarEvent {
  uid: string;
  network: string;
  bondLabel?: string;
  kind: EventKind;
  height: number;
  date: Date;
  summary: string;
  description: string;
}

export function heightToDate(net: ResolvedNetwork, height: number): Date {
  const anchorDate = new Date(net.anchor.isoDate);
  if (Number.isNaN(anchorDate.getTime())) {
    throw new Error(`network ${net.coin}: invalid anchor date ${net.anchor.isoDate}`);
  }
  const deltaBlocks = height - net.anchor.height;
  const deltaMs = deltaBlocks * net.avgBlockSeconds * 1000;
  return new Date(anchorDate.getTime() + deltaMs);
}

export function currentHeightAt(net: ResolvedNetwork, now: Date): number {
  const anchorDate = new Date(net.anchor.isoDate);
  if (Number.isNaN(anchorDate.getTime())) {
    throw new Error(`network ${net.coin}: invalid anchor date ${net.anchor.isoDate}`);
  }
  return Math.floor(net.anchor.height + (now.getTime() - anchorDate.getTime()) / (net.avgBlockSeconds * 1000));
}

export function cycleIndexAt(net: ResolvedNetwork, height: number): number {
  if (height < net.activationBurnHeight) {
    throw new Error(
      `network ${net.coin}: burn height ${height} precedes pox-5 activation height ${net.activationBurnHeight}`
    );
  }
  return Math.floor((height - net.activationBurnHeight) / net.rewardCycleBlocks);
}

export function cycleStart(net: ResolvedNetwork, cycleIndex: number): number {
  return net.activationBurnHeight + cycleIndex * net.rewardCycleBlocks;
}

export function cycleEnd(net: ResolvedNetwork, cycleIndex: number): number {
  return cycleStart(net, cycleIndex + 1);
}

export function cyclePrepareStart(net: ResolvedNetwork, cycleIndex: number): number {
  return cycleEnd(net, cycleIndex) - net.preparePhaseBlocks;
}

export function nextCycleStart(net: ResolvedNetwork, height: number): number {
  if (height < net.activationBurnHeight) {
    return net.activationBurnHeight;
  }
  return cycleStart(net, cycleIndexAt(net, height) + 1);
}

function firstTermCycleIndex(net: ResolvedNetwork, bond: BondInput): number {
  if (bond.startBurnHt !== undefined) {
    return cycleIndexAt(net, bond.startBurnHt);
  }
  const ref = Math.max(bond.lockHeight ?? 0, net.activationBurnHeight);
  if (ref === net.activationBurnHeight) {
    return 0;
  }
  return cycleIndexAt(net, ref) + 1;
}

export function bondCycleIndices(net: ResolvedNetwork, bond: BondInput): number[] {
  const first = firstTermCycleIndex(net, bond);
  const indices: number[] = [];
  const unlock = bond.unlockBurnHeight;
  // SIP-045 section 3.1.2: a bonding period contains 24 reward distributions, so a bond
  // never needs more than 24 cycle events; without an explicit numCycles the calendar
  // caps at 24 to keep one-bond output bounded.
  const maxCycles = bond.numCycles ?? 24;
  for (let index = first; ; index++) {
    if (indices.length >= maxCycles) {
      break;
    }
    if (unlock !== undefined && cycleStart(net, index) >= unlock) {
      break;
    }
    indices.push(index);
    if (indices.length > 10_000) {
      throw new Error(`network ${net.coin}: reward-cycle range exceeds 10,000 cycles; check bond inputs`);
    }
  }
  return indices;
}

function describeCycle(net: ResolvedNetwork, cycleIndex: number): string {
  const start = cycleStart(net, cycleIndex);
  const end = cycleEnd(net, cycleIndex);
  const prepareStart = cyclePrepareStart(net, cycleIndex);
  return (
    `burn heights ${start}-${end - 1}` +
    ` (prepare phase from ${prepareStart})` +
    `; estimated date for start: ${heightToDate(net, start).toISOString()}`
  );
}

function eventUid(net: ResolvedNetwork, bond: BondInput | undefined, kind: EventKind, height: number): string {
  const label = bond?.label ? `${slug(bond.label)}-` : '';
  return `pox5-${net.coin}-${label}${kind}-${height}@pox5-bond-calendar`;
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function bondTitle(net: ResolvedNetwork, bond: BondInput): string {
  const label = bond.label ? ` ${bond.label}` : '';
  const amount = bond.amount !== undefined ? ` (${bond.amount})` : '';
  return `${net.coin}${label}${amount}`;
}

export function buildBondEvents(net: ResolvedNetwork, bond: BondInput, safetyMarginBlocks: number): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const push = (kind: EventKind, height: number, summary: string, description: string) => {
    events.push({
      uid: eventUid(net, bond, kind, height),
      network: net.coin,
      bondLabel: bond.label,
      kind,
      height,
      date: heightToDate(net, height),
      summary,
      description,
    });
  };

  if (net.stacksOnly) {
    if (bond.startBurnHt === undefined || bond.numCycles === undefined) {
      throw new Error(`network ${net.coin} is STX-only: startBurnHt and numCycles are required to schedule a stake`);
    }
    if (bond.startBurnHt < net.activationBurnHeight) {
      throw new Error(
        `network ${net.coin}: startBurnHt ${bond.startBurnHt} precedes pox-5 activation height ${net.activationBurnHeight}`
      );
    }
    const title = bondTitle(net, bond);
    push(
      'registration-window',
      bond.startBurnHt,
      `${title} — STX stake start`,
      describeCycle(net, cycleIndexAt(net, bond.startBurnHt))
    );
    for (const index of bondCycleIndices(net, bond)) {
      push('reward-cycle', cycleStart(net, index), `${title} — reward cycle ${index}`, describeCycle(net, index));
    }
    const lockEnd = cycleStart(net, cycleIndexAt(net, bond.startBurnHt) + bond.numCycles);
    push(
      'stx-lock-end',
      lockEnd,
      `${title} — STX lock end`,
      `stake of ${bond.numCycles} cycles ends at burn height ${lockEnd}`
    );
    return events;
  }

  if (bond.unlockBurnHeight === undefined) {
    throw new Error(`network ${net.coin}: unlockBurnHeight is required for a BTC-backed bond`);
  }
  if (bond.unlockBurnHeight < net.activationBurnHeight) {
    throw new Error(
      `network ${net.coin}: unlockBurnHeight ${bond.unlockBurnHeight} precedes pox-5 activation height ${net.activationBurnHeight}`
    );
  }
  const title = bondTitle(net, bond);
  if (bond.lockHeight !== undefined) {
    push(
      'lockup-funding',
      bond.lockHeight,
      `${title} — BTC lockup funding`,
      `lockup UTXO confirmed at burn height ${bond.lockHeight}`
    );
  }
  const registration = nextCycleStart(net, Math.max(bond.lockHeight ?? 0, net.activationBurnHeight));
  push(
    'registration-window',
    registration,
    `${title} — register-for-bond window`,
    `first pox-5 reward cycle that can credit the lockup; ${describeCycle(net, cycleIndexAt(net, registration))}`
  );
  for (const index of bondCycleIndices(net, bond)) {
    push('reward-cycle', cycleStart(net, index), `${title} — reward cycle ${index}`, describeCycle(net, index));
  }
  push(
    'cltv-unlock',
    bond.unlockBurnHeight,
    `${title} — CLTV unlock`,
    `BTC timelock expires at burn height ${bond.unlockBurnHeight}; lockup becomes spendable`
  );
  push(
    'post-cltv-recovery',
    bond.unlockBurnHeight + safetyMarginBlocks,
    `${title} — post-CLTV recovery (earliest)`,
    `earliest estimated recovery spend (${safetyMarginBlocks}-block safety margin after CLTV unlock)`
  );
  return events;
}

export function buildUpcomingCycleEvents(net: ResolvedNetwork, count: number, fromHeight: number): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  let index = cycleIndexAt(net, Math.max(fromHeight, net.activationBurnHeight));
  if (fromHeight >= net.activationBurnHeight) {
    index += 1;
  }
  for (let emitted = 0; emitted < count; emitted++, index++) {
    const start = cycleStart(net, index);
    events.push({
      uid: eventUid(net, undefined, 'reward-cycle', start),
      network: net.coin,
      kind: 'reward-cycle',
      height: start,
      date: heightToDate(net, start),
      summary: `${net.coin} — reward cycle ${index} starts`,
      description: describeCycle(net, index),
    });
  }
  return events;
}
