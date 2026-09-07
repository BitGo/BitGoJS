import * as fs from 'fs';
import * as path from 'path';
import { CalendarEvent, ResolvedNetwork } from './calendar';
import { SIP045_RELOCK_WINDOW_BLOCKS } from './networks';

const ICS_CRLF = '\r\n';
const ICS_MAX_OCTETS = 75;

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

function icsDateTime(date: Date): string {
  return `${date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')}`;
}

function foldIcsLine(line: string): string {
  const bytes = Buffer.from(line, 'utf8');
  if (bytes.length <= ICS_MAX_OCTETS) {
    return line;
  }
  const chunks: string[] = [];
  let current = Buffer.alloc(0);
  for (const byte of bytes) {
    const next = Buffer.concat([current, Buffer.from([byte])]);
    if (next.length >= ICS_MAX_OCTETS) {
      chunks.push(current.toString('utf8'));
      current = Buffer.from([byte]);
    } else {
      current = next;
    }
  }
  if (current.length > 0) {
    chunks.push(current.toString('utf8'));
  }
  return chunks.join(ICS_CRLF + ' ');
}

function icsEvent(event: CalendarEvent, stamp: Date): string[] {
  return [
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${icsDateTime(stamp)}`,
    `DTSTART:${icsDateTime(event.date)}`,
    `DTEND:${icsDateTime(event.date)}`,
    `SUMMARY:${escapeIcsText(event.summary)}`,
    `DESCRIPTION:${escapeIcsText(`${event.description} [height ${event.height}; estimated]`)}`,
    'END:VEVENT',
  ];
}

export function renderIcs(events: CalendarEvent[], calendarName: string, now: Date): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BitGo//pox5-bond-calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
  ];
  for (const event of events) {
    lines.push(...icsEvent(event, now));
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldIcsLine).join(ICS_CRLF) + ICS_CRLF;
}

function formatDate(date: Date): string {
  return `${date
    .toISOString()
    .replace('T', ' ')
    .replace(/\.\d{3}Z$/, '')}Z`;
}

function anchorAgeNote(net: ResolvedNetwork, now: Date): string | null {
  const anchorDate = new Date(net.anchor.isoDate);
  if (Number.isNaN(anchorDate.getTime()) || net.avgBlockSeconds <= 0) {
    return null;
  }
  const blocksSinceAnchor = Math.floor((now.getTime() - anchorDate.getTime()) / (net.avgBlockSeconds * 1000));
  return `anchor ${net.anchor.height} @ ${net.anchor.isoDate} (resolved via ${net.anchorSource}); roughly ${blocksSinceAnchor} burn blocks have elapsed since the anchor, so far-future dates drift by the difference between real and average block production`;
}

function eventRow(event: CalendarEvent): string {
  return `| ${event.kind} | ${event.height} | ${formatDate(event.date)} | ${event.summary} |`;
}

function eventTable(events: CalendarEvent[]): string {
  const lines = ['| Event | Burn height | Estimated UTC date | Summary |', '| --- | --- | --- | --- |'];
  for (const event of events) {
    lines.push(eventRow(event));
  }
  return lines.join('\n');
}

export function renderMarkdown(
  networks: ResolvedNetwork[],
  cycleEvents: Record<string, CalendarEvent[]>,
  bondEvents: Record<string, Record<string, CalendarEvent[]>>,
  safetyMarginBlocks: number,
  now: Date
): string {
  const lines: string[] = [
    '# PoX-5 bond calendar',
    '',
    'All dates are estimates derived from each network anchor and its average block interval.',
    '',
  ];
  for (const net of networks) {
    lines.push(`## ${net.coin} (${net.burnChain}${net.stacksOnly ? ', STX-only' : ', BTC-backed'})`, '');
    lines.push(
      `- pox-5 activation: burn height ${net.activationBurnHeight}`,
      `- reward cycle: ${net.rewardCycleBlocks} burn blocks (prepare phase: last ${net.preparePhaseBlocks})`,
      `- average block interval: ${net.avgBlockSeconds}s`,
      `- ${
        anchorAgeNote(net, now) ??
        `anchor ${net.anchor.height} @ ${net.anchor.isoDate} (resolved via ${net.anchorSource})`
      }`,
      `- SIP-045 note: the L1 timelock is normally set to expire ${SIP045_RELOCK_WINDOW_BLOCKS} blocks before the bonding period ends (renewal window)`,
      ''
    );
    const cycles = cycleEvents[net.coin] ?? [];
    if (cycles.length > 0) {
      lines.push(`### Upcoming reward cycles (${net.coin})`, '', eventTable(cycles), '');
    }
    const bonds = bondEvents[net.coin] ?? {};
    for (const [key, events] of Object.entries(bonds)) {
      lines.push(`### Bond ${key} (${net.coin})`, '', eventTable(events), '');
    }
    lines.push('Parameter sources:', '');
    for (const source of net.sources) {
      lines.push(`- ${source}`);
    }
    lines.push('');
  }
  lines.push(`Safety margin for post-CLTV recovery: ${safetyMarginBlocks} burn blocks.`, '');
  return lines.join('\n');
}

export function writePerNetworkOutputs(
  outDir: string,
  networks: ResolvedNetwork[],
  cycleEvents: Record<string, CalendarEvent[]>,
  bondEvents: Record<string, Record<string, CalendarEvent[]>>,
  safetyMarginBlocks: number,
  now: Date
): string[] {
  fs.mkdirSync(outDir, { recursive: true });
  const written: string[] = [];
  for (const net of networks) {
    const cycles = cycleEvents[net.coin] ?? [];
    const bonds = bondEvents[net.coin] ?? {};
    const events = [...cycles, ...Object.values(bonds).flat()];
    const icsPath = path.join(outDir, `${net.coin}.ics`);
    fs.writeFileSync(icsPath, renderIcs(events, `PoX-5 Bond Calendar — ${net.coin}`, now));
    const mdPath = path.join(outDir, `${net.coin}.md`);
    fs.writeFileSync(
      mdPath,
      renderMarkdown([net], { [net.coin]: cycles }, { [net.coin]: bonds }, safetyMarginBlocks, now)
    );
    written.push(icsPath, mdPath);
  }
  return written;
}
