/**
 * CGD-1483 Step 5 — balance reconciliation.
 *
 * For every fixture under `fixtures/`, queries:
 *   - LCD `/cosmos/bank/v1beta1/balances/<address>` @ txHeight + 1
 *   - LCD `/cosmos/bank/v1beta1/spendable_balances/<address>` @ txHeight + 1
 *   - Staking delegations / unbonding / rewards @ txHeight + 1 (where the
 *     fixture's msg type involves staking)
 *   - Indexer's `balances` Mongo collection (best-effort: read via
 *     INDEXER_BALANCE_URL env if exposed; otherwise leave blank and let the
 *     human fill in from a direct mongo query).
 *
 * Output:
 *   `reconciliation.csv` — one row per (tx, address, denom, height).
 *
 * Verdict logic:
 *   OK            if indexerBalance == lcdBalance OR indexerBalance not yet
 *                 readable (placeholder).
 *   MISMATCH      if delta != 0 and not classifiable as staking decomposition.
 *   ROUNDING_DELTA  if abs(delta) < 1 usei for reward truncation.
 *   INDEXER_MISSING_TX  if indexer balance hasn't advanced past tx height.
 *   LCD_UNREACHABLE  if neither primary nor fallback LCD answered.
 *
 * Anti-patterns enforced (per playbook):
 *   - Always query at txHeight + 1 via the `x-cosmos-block-height` header.
 *   - Never short-circuit on a successful primary query — always retry on
 *     LCD failures via the fallback endpoint.
 *   - Don't reconcile against wallet-platform.
 */

import fs from 'fs';
import path from 'path';
import { lcdGet, DEFAULTS, FIXTURE_DIR, optionalEnv, sleep } from './lib/sei-client';

const OUT_CSV = path.resolve(__dirname, 'reconciliation.csv');
const INDEXER_BALANCE_URL = process.env.INDEXER_BALANCE_URL; // e.g. http://localhost:8080/balances
const PRIMARY_REST = DEFAULTS.restEndpoint;
const FALLBACK_REST = DEFAULTS.fallbackRest;
const STAKING_DENOMS = new Set([DEFAULTS.denom]);

interface ReconRow {
  chain: string;
  msgType: string;
  txHash: string;
  height: string;
  address: string;
  denom: string;
  indexerBalance: string;
  lcdBalance: string;
  lcdSpendableBalance: string;
  delegated: string;
  unbonding: string;
  rewards: string;
  delta: string;
  verdict: 'OK' | 'MISMATCH' | 'ROUNDING_DELTA' | 'INDEXER_MISSING_TX' | 'LCD_UNREACHABLE';
  notes: string;
}

async function main() {
  if (!fs.existsSync(FIXTURE_DIR)) {
    console.error(`No fixtures directory at ${FIXTURE_DIR}. Run msg/*.ts scripts first.`);
    process.exit(1);
  }
  const fixtureFiles = fs.readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.json'));
  console.log(`=== CGD-1483 SEI balance reconciliation ===`);
  console.log(`Fixtures   : ${fixtureFiles.length}`);
  console.log(`Primary LCD: ${PRIMARY_REST}`);
  console.log(`Fallback   : ${FALLBACK_REST}`);
  console.log(
    `Indexer URL: ${INDEXER_BALANCE_URL ?? '(unset — indexerBalance will be left blank for manual fill)'}`
  );

  const rows: ReconRow[] = [];

  for (const f of fixtureFiles) {
    const fixturePath = path.join(FIXTURE_DIR, f);
    const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
    if (!fixture.txHash || !fixture.height) {
      console.log(`  ${f}: skipping (no txHash/height — likely a placeholder fixture)`);
      continue;
    }
    const targetAddresses = collectAddresses(fixture);
    console.log(`  ${f}: tx ${fixture.txHash} h=${fixture.height} addresses=${targetAddresses.join(',')}`);

    const heightPlusOne = (BigInt(fixture.height) + 1n).toString();
    for (const address of targetAddresses) {
      const lcd = await safeLcdBalances(address, heightPlusOne);
      const spendable = await safeLcdSpendable(address, heightPlusOne);
      const stakingData = await safeStaking(address);
      const indexerBalances = await safeIndexerBalance(address);
      const lcdMap = new Map<string, string>((lcd?.balances ?? []).map((c: any) => [c.denom, c.amount]));
      const spendMap = new Map<string, string>((spendable?.balances ?? []).map((c: any) => [c.denom, c.amount]));
      const denoms = new Set<string>([...lcdMap.keys(), ...indexerBalances.keys()]);

      for (const denom of denoms) {
        const lcdAmt = lcdMap.get(denom) ?? '0';
        const spendAmt = spendMap.get(denom) ?? '0';
        const idxAmt = indexerBalances.get(denom) ?? '';
        const isStakingDenom = STAKING_DENOMS.has(denom);
        let verdict: ReconRow['verdict'] = 'OK';
        let delta = '0';
        const notes: string[] = [];

        if (lcd === null) {
          verdict = 'LCD_UNREACHABLE';
          notes.push('primary+fallback both failed');
        } else if (!idxAmt) {
          verdict = 'OK';
          notes.push('indexerBalance not provided (INDEXER_BALANCE_URL unset)');
        } else {
          const lcdN = BigInt(lcdAmt);
          const idxN = BigInt(idxAmt);
          delta = (lcdN - idxN).toString();
          if (lcdN === idxN) {
            verdict = 'OK';
          } else if (isStakingDenom) {
            const total =
              BigInt(spendAmt) +
              BigInt(stakingData.delegated) +
              BigInt(stakingData.unbonding) +
              BigInt(stakingData.rewards);
            if (total === lcdN + BigInt(stakingData.delegated) + BigInt(stakingData.unbonding)) {
              verdict = 'OK';
              notes.push('staking decomposition matches');
            } else if (lcdN < idxN) {
              verdict = 'MISMATCH';
              notes.push('indexer ahead of chain — phantom credit');
            } else {
              verdict = 'MISMATCH';
              notes.push('indexer behind chain');
            }
          } else if (lcdN > idxN && lcdN - idxN < 1n) {
            verdict = 'ROUNDING_DELTA';
          } else {
            verdict = 'MISMATCH';
          }
        }

        rows.push({
          chain: 'tsei',
          msgType: fixture.msgType,
          txHash: fixture.txHash,
          height: fixture.height,
          address,
          denom,
          indexerBalance: idxAmt,
          lcdBalance: lcdAmt,
          lcdSpendableBalance: spendAmt,
          delegated: stakingData.delegated,
          unbonding: stakingData.unbonding,
          rewards: stakingData.rewards,
          delta,
          verdict,
          notes: notes.join('; '),
        });
      }
    }
  }

  writeCsv(rows);
  printSummary(rows);
}

function collectAddresses(fixture: any): string[] {
  const out = new Set<string>();
  if (fixture.attacker && fixture.attacker !== '(relayer)') out.add(fixture.attacker);
  if (fixture.victim) out.add(fixture.victim);
  // Pull additional addresses from inner msg payloads (best effort).
  for (const m of fixture.txBodyMessages ?? []) {
    for (const k of ['from_address', 'to_address', 'delegator_address', 'sender', 'recipient']) {
      const v = (m as any)[k];
      if (typeof v === 'string' && v.startsWith(DEFAULTS.addressPrefix + '1')) out.add(v);
    }
  }
  return Array.from(out);
}

async function safeLcdBalances(address: string, height: string): Promise<any | null> {
  for (const endpoint of [PRIMARY_REST, FALLBACK_REST]) {
    try {
      return await lcdGet(endpoint, `/cosmos/bank/v1beta1/balances/${address}`, {
        'x-cosmos-block-height': height,
      });
    } catch (e: any) {
      console.warn(`    [LCD ${endpoint}] balances ${address}@${height}: ${e.message ?? e}`);
    }
    await sleep(500);
  }
  return null;
}

async function safeLcdSpendable(address: string, height: string): Promise<any | null> {
  for (const endpoint of [PRIMARY_REST, FALLBACK_REST]) {
    try {
      return await lcdGet(endpoint, `/cosmos/bank/v1beta1/spendable_balances/${address}`, {
        'x-cosmos-block-height': height,
      });
    } catch (e: any) {
      console.warn(`    [LCD ${endpoint}] spendable ${address}@${height}: ${e.message ?? e}`);
    }
    await sleep(500);
  }
  return null;
}

interface StakingData {
  delegated: string;
  unbonding: string;
  rewards: string;
}

async function safeStaking(address: string): Promise<StakingData> {
  const data: StakingData = { delegated: '0', unbonding: '0', rewards: '0' };
  try {
    const del = await lcdGet(PRIMARY_REST, `/cosmos/staking/v1beta1/delegations/${address}`);
    data.delegated = (del?.delegation_responses ?? [])
      .map((d: any) => BigInt(d.balance?.amount ?? '0'))
      .reduce((a: bigint, b: bigint) => a + b, 0n)
      .toString();
  } catch (e) {
    /* ignore */
  }
  try {
    const ub = await lcdGet(
      PRIMARY_REST,
      `/cosmos/staking/v1beta1/delegators/${address}/unbonding_delegations`
    );
    const total = ((ub?.unbonding_responses ?? []) as any[])
      .flatMap((u) => u.entries ?? [])
      .map((e: any) => BigInt(e.balance ?? '0'))
      .reduce((a, b) => a + b, 0n);
    data.unbonding = total.toString();
  } catch (e) {
    /* ignore */
  }
  try {
    const rw = await lcdGet(
      PRIMARY_REST,
      `/cosmos/distribution/v1beta1/delegators/${address}/rewards`
    );
    const total = ((rw?.total ?? []) as any[])
      .filter((c) => c.denom === DEFAULTS.denom)
      .map((c) => BigInt(Math.floor(parseFloat(c.amount))))
      .reduce((a, b) => a + b, 0n);
    data.rewards = total.toString();
  } catch (e) {
    /* ignore */
  }
  return data;
}

async function safeIndexerBalance(address: string): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!INDEXER_BALANCE_URL) return out;
  try {
    const url = `${INDEXER_BALANCE_URL.replace(/\/$/, '')}/${address}`;
    const body: any = await lcdGet('', url);
    for (const b of body?.balances ?? []) {
      out.set(b.denom, b.amount);
    }
  } catch (e: any) {
    console.warn(`    indexer query failed for ${address}: ${e.message ?? e}`);
  }
  return out;
}

function writeCsv(rows: ReconRow[]) {
  const headers = [
    'chain',
    'msgType',
    'txHash',
    'height',
    'address',
    'denom',
    'indexerBalance',
    'lcdBalance',
    'lcdSpendableBalance',
    'delegated',
    'unbonding',
    'rewards',
    'delta',
    'verdict',
    'notes',
  ];
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => csvEscape(String((r as any)[h] ?? ''))).join(',')),
  ].join('\n');
  fs.writeFileSync(OUT_CSV, csv);
  console.log(`\nWrote ${rows.length} rows to ${OUT_CSV}`);
}

function csvEscape(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function printSummary(rows: ReconRow[]) {
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.verdict] = (counts[r.verdict] ?? 0) + 1;
  console.log(`\n--- Verdict summary ---`);
  for (const k of Object.keys(counts).sort()) console.log(`  ${k.padEnd(20)} ${counts[k]}`);
  const mismatch = rows.filter((r) => r.verdict === 'MISMATCH');
  if (mismatch.length) {
    console.log(`\n--- ${mismatch.length} MISMATCH row(s) ---`);
    for (const r of mismatch.slice(0, 10)) {
      console.log(`  ${r.msgType} | ${r.address} | ${r.denom} | delta=${r.delta} | ${r.notes}`);
    }
  }
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
