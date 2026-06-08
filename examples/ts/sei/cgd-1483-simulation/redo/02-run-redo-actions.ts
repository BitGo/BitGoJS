/**
 * Drive all 6 redo actions from their funded BitGo TSS wallets.
 *
 * - bank cases (`transfer`) → `wallet.sendMany({type: 'transfer'})`.
 *   The default switch in sdk-core's `sendMany` handles `transfer`.
 * - staking cases → `tssUtils.prebuildTxWithIntent({intentType: '<server-side-name>'})`
 *   directly (server-side intentTypes: `delegate`, `undelegate`,
 *   `stakeClaimRewards`, `switchValidator` — per the cosmos-intent-audit
 *   report at bitgo-microservices/.claude/worktrees/intent-audit-cosmos),
 *   then `wallet.signAndSendTxRequest({txRequestId, walletPassphrase})`.
 *
 * Captures a fixture per redo to redo/fixtures/<key>.json.
 */

import fs from 'fs';
import path from 'path';
import { BitGo } from 'bitgo';
import { REDO_LIST, RedoSpec } from './redo-list';
import { listBondedValidators } from '../lib/validators';
import { lcdGet, DEFAULTS, sleep } from '../lib/sei-client';

const WALLETS_FILE = path.resolve(__dirname, 'redo-wallets.json');
const FIXTURE_DIR = path.resolve(__dirname, 'fixtures');
const COIN = 'tsei';
const ATTACKER_ADDRESS = 'sei1j4duheg4uy7en9vcp0xm7hndccc3euwpx7utx2';

interface RedoFixture {
  key: string;
  msgType: string;
  bitgoIntent: string;
  walletId: string;
  walletAddress: string;
  txHash?: string;
  height?: string;
  status: 'broadcast' | 'failed' | 'skipped';
  error?: string;
  expectedIndexer: string;
  intentPayload?: any;
  txRequestId?: string;
  sendResult?: any;
  capturedAt: string;
}

async function main() {
  const accessToken = process.env.BITGO_ACCESS_TOKEN;
  const passphrase = process.env.BITGO_PASSPHRASE ?? 'cgd1483_sim_pw_2026_05_26';
  if (!accessToken) {
    console.error('Set BITGO_ACCESS_TOKEN');
    process.exit(1);
  }
  if (!fs.existsSync(WALLETS_FILE)) {
    console.error('Run 00-create-redo-wallets.ts then 01-fund-redo-wallets.ts first.');
    process.exit(1);
  }
  const wallets = JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf-8'));
  if (!fs.existsSync(FIXTURE_DIR)) fs.mkdirSync(FIXTURE_DIR, { recursive: true });

  const bitgo = new BitGo({ env: 'test' });
  bitgo.authenticateWithAccessToken({ accessToken });
  const basecoin = bitgo.coin(COIN);

  const vals = await listBondedValidators();
  const validatorSrc = vals[0].operator_address;
  const validatorDst = vals[1].operator_address;
  console.log(`validators: src=${validatorSrc} dst=${validatorDst}`);

  for (const spec of REDO_LIST) {
    const entry = wallets[spec.key];
    if (!entry) {
      console.warn(`  ✗ no wallet entry for ${spec.key}, skipping`);
      continue;
    }
    const fixturePath = path.join(FIXTURE_DIR, `${spec.key}.json`);
    if (fs.existsSync(fixturePath)) {
      const existing = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      if (existing.status === 'broadcast' && existing.txHash) {
        console.log(`  ↻ ${spec.key}: already broadcast (tx ${existing.txHash}), skipping`);
        continue;
      }
    }

    console.log(`\n=== ${spec.key} ===`);
    console.log(`wallet: ${entry.address} (id=${entry.walletId})`);
    console.log(`intent: ${spec.bitgoIntent}`);

    const wallet: any = await basecoin.wallets().get({ id: entry.walletId });
    const balance = await lcdGet(
      DEFAULTS.restEndpoint,
      `/cosmos/bank/v1beta1/balances/${entry.address}`
    );
    const have = (balance?.balances ?? []).find((b: any) => b.denom === DEFAULTS.denom)?.amount ?? '0';
    console.log(`balance (chain): ${have} usei`);

    const fixture: RedoFixture = {
      key: spec.key,
      msgType: spec.msgType,
      bitgoIntent: spec.bitgoIntent,
      walletId: entry.walletId,
      walletAddress: entry.address,
      status: 'failed',
      expectedIndexer: spec.expectedIndexer,
      capturedAt: new Date().toISOString(),
    };

    try {
      if (spec.bitgoIntent === 'transfer') {
        await runTransfer(wallet, spec, entry.address, passphrase, fixture);
      } else {
        await runStaking(wallet, spec, validatorSrc, validatorDst, passphrase, fixture);
      }

      // Wait for inclusion, look up height
      if (fixture.txHash) {
        await sleep(6000);
        try {
          const tx = await lcdGet(
            DEFAULTS.restEndpoint,
            `/cosmos/tx/v1beta1/txs/${String(fixture.txHash).toUpperCase()}`
          );
          if (tx?.tx_response) {
            fixture.height = String(tx.tx_response.height);
            console.log(`  included at height ${fixture.height}`);
          }
        } catch (e: any) {
          console.warn(`  height lookup failed: ${e.message ?? e}`);
        }
      }
    } catch (e: any) {
      console.error(`  ✗ FAILED: ${e.message ?? e}`);
      fixture.error = e.message ?? String(e);
    }
    fs.writeFileSync(fixturePath, JSON.stringify(fixture, null, 2));
    console.log(`  fixture: ${fixturePath}`);
    await sleep(3000);
  }

  console.log(`\n=== Done. Fixtures in ${FIXTURE_DIR}/ ===`);
}

async function runTransfer(
  wallet: any,
  spec: RedoSpec,
  selfAddress: string,
  passphrase: string,
  fixture: RedoFixture
) {
  const dst = spec.key === 'redo-bank-msgsend-selfloop' ? selfAddress : ATTACKER_ADDRESS;
  const payload = {
    type: 'transfer',
    recipients: [{ address: dst, amount: spec.actionUsei ?? '500' }],
    walletPassphrase: passphrase,
    isTss: true,
  };
  fixture.intentPayload = { ...payload, walletPassphrase: '<redacted>' };
  console.log(`  payload (transfer): ${JSON.stringify(fixture.intentPayload)}`);
  const detail: any = await wallet.sendMany(payload);
  fixture.sendResult = sanitize(detail);
  fixture.status = 'broadcast';
  fixture.txHash =
    detail?.txid ?? detail?.transfer?.txid ?? detail?.tx?.txid ?? detail?.transfer?.hash;
  fixture.txRequestId = detail?.txRequestId ?? detail?.transfer?.txRequestId;
  console.log(`  ✓ broadcast; txid=${fixture.txHash ?? '(see sendResult)'} txRequestId=${fixture.txRequestId ?? ''}`);
}

async function runStaking(
  wallet: any,
  spec: RedoSpec,
  validatorSrc: string,
  validatorDst: string,
  passphrase: string,
  fixture: RedoFixture
) {
  const tssUtils = wallet.tssUtils;
  if (!tssUtils) throw new Error('wallet.tssUtils not available — wallet may not be TSS hot');

  let intent: any;
  switch (spec.bitgoIntent) {
    case 'StakingActivate':
      intent = {
        intentType: 'delegate',
        validatorAddress: validatorSrc,
        amount: { value: spec.actionUsei ?? '10000', symbol: COIN },
        recipients: [],
      };
      break;
    case 'StakingDeactivate':
      intent = {
        intentType: 'undelegate',
        validatorAddress: validatorSrc,
        amount: { value: spec.actionUsei ?? '5000', symbol: COIN },
        recipients: [],
      };
      break;
    case 'StakingWithdraw':
      intent = {
        intentType: 'stakeClaimRewards',
        validatorAddress: validatorSrc,
        recipients: [],
      };
      break;
    case 'StakingSwitchValidator':
      intent = {
        intentType: 'switchValidator',
        validatorAddress: validatorSrc,
        destValidatorAddress: validatorDst,
        amount: { value: spec.actionUsei ?? '1000', symbol: COIN },
        recipients: [],
      };
      break;
    default:
      throw new Error(`unsupported intent ${spec.bitgoIntent}`);
  }
  fixture.intentPayload = intent;
  console.log(`  intent: ${JSON.stringify(intent)}`);

  // 1. prebuild via TSS utils
  const txRequest = await tssUtils.prebuildTxWithIntent(intent, 'lite');
  fixture.txRequestId = txRequest.txRequestId;
  console.log(`  prebuilt txRequestId=${txRequest.txRequestId} apiVersion=${txRequest.apiVersion}`);

  // 2. sign + send via TSS
  const result: any = await wallet.signAndSendTxRequest({
    txRequestId: txRequest.txRequestId,
    walletPassphrase: passphrase,
    isTxRequestFull: txRequest.apiVersion === 'full',
  });
  fixture.sendResult = sanitize(result);
  fixture.status = 'broadcast';
  fixture.txHash =
    result?.txid ??
    result?.transfer?.txid ??
    result?.tx?.txid ??
    result?.transfer?.hash ??
    result?.signedTransaction?.txid;
  console.log(`  ✓ broadcast; txid=${fixture.txHash ?? '(see sendResult)'}`);
}

function sanitize(obj: any): any {
  // Strip massive/binary fields from the result blob.
  if (!obj || typeof obj !== 'object') return obj;
  const keep: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k.toLowerCase().includes('signature') || k.toLowerCase().includes('share')) continue;
    if (typeof v === 'string' && v.length > 500) {
      keep[k] = `${v.slice(0, 100)}...<truncated ${v.length}>`;
    } else if (v && typeof v === 'object') {
      keep[k] = sanitize(v);
    } else {
      keep[k] = v;
    }
  }
  return keep;
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
