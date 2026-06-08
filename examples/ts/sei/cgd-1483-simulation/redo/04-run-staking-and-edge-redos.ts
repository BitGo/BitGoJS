/**
 * CGD-1483 REDO round 2 — staking intents + edge-same-address-twice via BitGo SDK.
 *
 * Prerequisites:
 *   1. Run 03-fund-extra-wallets.ts (fund wallets to 1M usei each).
 *   2. The abstract-cosmos setCoinSpecificFieldsInIntent fix must be compiled
 *      (it forwards validatorAddress / destValidatorAddress / amount to the WP
 *      intent payload, unblocking cosmos staking intents via TSS).
 *
 * What this runs (6 SDK operations, 5 msg types):
 *   a. edge-same-address-twice  → wallet.sendMany(transfer, recipient=self)
 *   b. staking-msgdelegate       → delegate intent (direct, no prior delegation needed)
 *   c. staking-msgundelegate     → first delegate for setup, then undelegate
 *   d. staking-msgbeginredelegate→ first delegate for setup, then switchValidator
 *   e. staking-msgwithdrawdelegatorreward → first delegate, wait 30s, then stakeClaimRewards
 *
 * For c/d/e, the setup delegate is a separate smaller tx (10K usei) so the
 * wallet-platform has a real delegation to work with. The "redo" tx is the
 * second operation.
 *
 * Run with:
 *   BITGO_ACCESS_TOKEN=<token> ATTACKER_MNEMONIC=<mn> \
 *   npx ts-node redo/04-run-staking-and-edge-redos.ts
 *
 * Optional:
 *   BITGO_PASSPHRASE=<pw>  (default: cgd1483_sim_pw_2026_05_26)
 *   SKIP_SETUP_DELEGATE=1  (if wallets already have delegations from a previous run)
 */

import fs from 'fs';
import path from 'path';
import { BitGo } from 'bitgo';
import { lcdGet, DEFAULTS, sleep } from '../lib/sei-client';
import { listBondedValidators } from '../lib/validators';

const REDO_WALLETS_FILE = path.resolve(__dirname, 'redo-wallets.json');
const ORIGINAL_WALLETS_FILE = path.resolve(__dirname, '..', 'wallets.json');
const FIXTURE_DIR = path.resolve(__dirname, 'fixtures');
const COIN = 'tsei';

interface StakingFixture {
  key: string;
  msgType: string;
  walletId: string;
  walletAddress: string;
  setupTxHash?: string;
  setupHeight?: string;
  txHash?: string;
  height?: string;
  status: 'broadcast' | 'failed' | 'skipped';
  error?: string;
  intentPayload?: any;
  txRequestId?: string;
  capturedAt: string;
}

async function waitForInclusion(txHash: string): Promise<string> {
  for (let i = 0; i < 30; i++) {
    await sleep(3000);
    try {
      const tx = await lcdGet(DEFAULTS.restEndpoint, `/cosmos/tx/v1beta1/txs/${txHash.toUpperCase()}`);
      if (tx?.tx_response) return String(tx.tx_response.height);
    } catch {
      // not yet included
    }
  }
  return '?';
}

async function runIntent(
  wallet: any,
  intent: any,
  passphrase: string
): Promise<{ txHash: string; txRequestId: string }> {
  // Staking intents require apiVersion=full for signing; transfers work with lite.
  const apiVersion = intent.intentType === 'transfer' ? 'lite' : 'full';
  const txRequest = await wallet.tssUtils.prebuildTxWithIntent(intent, apiVersion);
  const txRequestId: string = txRequest.txRequestId;

  await wallet.signAndSendTxRequest({
    txRequestId,
    walletPassphrase: passphrase,
    isTxRequestFull: apiVersion === 'full',
  });

  // For full apiVersion requests, BitGo broadcasts server-side after signing.
  // Poll the txRequest until it has a txHash.
  let txHash = '';
  if (apiVersion === 'full') {
    for (let i = 0; i < 20; i++) {
      await sleep(3000);
      try {
        const tr = await wallet.tssUtils.getTxRequest(txRequestId);
        const candidate =
          tr?.txHash ?? tr?.txid ?? tr?.transactions?.[0]?.txHash ?? tr?.transactions?.[0]?.unsignedTx?.serializedTxHex;
        if (candidate && typeof candidate === 'string' && candidate.length >= 10) {
          txHash = candidate;
          break;
        }
      } catch { /* keep polling */ }
    }
  }
  return { txHash, txRequestId };
}

async function getChainBalance(address: string): Promise<bigint> {
  try {
    const body = await lcdGet(DEFAULTS.restEndpoint, `/cosmos/bank/v1beta1/balances/${address}`);
    const usei = (body?.balances ?? []).find((b: any) => b.denom === DEFAULTS.denom)?.amount ?? '0';
    return BigInt(usei);
  } catch {
    return 0n;
  }
}

async function hasDelegation(address: string, validatorAddress: string): Promise<boolean> {
  try {
    const body = await lcdGet(DEFAULTS.restEndpoint, `/cosmos/staking/v1beta1/delegations/${address}`);
    const dels = body?.delegation_responses ?? [];
    return dels.some((d: any) => d?.delegation?.validator_address === validatorAddress);
  } catch {
    return false;
  }
}

async function main() {
  const accessToken = process.env.BITGO_ACCESS_TOKEN;
  const passphrase = process.env.BITGO_PASSPHRASE ?? 'cgd1483_sim_pw_2026_05_26';
  const skipSetup = process.env.SKIP_SETUP_DELEGATE === '1';
  if (!accessToken) { console.error('Set BITGO_ACCESS_TOKEN'); process.exit(1); }

  if (!fs.existsSync(REDO_WALLETS_FILE)) {
    console.error('Run 00-create-redo-wallets.ts and 03-fund-extra-wallets.ts first.');
    process.exit(1);
  }
  if (!fs.existsSync(FIXTURE_DIR)) fs.mkdirSync(FIXTURE_DIR, { recursive: true });

  const redoWallets = JSON.parse(fs.readFileSync(REDO_WALLETS_FILE, 'utf-8'));
  const origWallets = fs.existsSync(ORIGINAL_WALLETS_FILE)
    ? JSON.parse(fs.readFileSync(ORIGINAL_WALLETS_FILE, 'utf-8'))
    : {};

  const bitgo = new BitGo({ env: 'test' });
  bitgo.authenticateWithAccessToken({ accessToken });
  const basecoin = bitgo.coin(COIN);

  const vals = await listBondedValidators();
  const validatorSrc = vals[0].operator_address;
  const validatorDst = vals[1].operator_address;
  console.log(`validators: src=${validatorSrc} dst=${validatorDst}`);

  // ──────────────────────────────────────────────────────────────────────
  // a. edge-same-address-twice
  // ──────────────────────────────────────────────────────────────────────
  const edgeKey = 'edge-same-address-twice';
  const edgeEntry = origWallets[edgeKey] ?? redoWallets[edgeKey];
  const edgeFixturePath = path.join(FIXTURE_DIR, `${edgeKey}-bitgo-selfloop.json`);
  if (edgeEntry && !fs.existsSync(edgeFixturePath)) {
    console.log(`\n=== ${edgeKey}: transfer to self ===`);
    console.log(`wallet: ${edgeEntry.address} (id=${edgeEntry.walletId})`);
    const fixture: StakingFixture = {
      key: edgeKey, msgType: '/cosmos.bank.v1beta1.MsgSend (from=to)',
      walletId: edgeEntry.walletId, walletAddress: edgeEntry.address,
      status: 'failed', capturedAt: new Date().toISOString(),
    };
    try {
      const bal = await getChainBalance(edgeEntry.address);
      console.log(`  chain balance: ${bal} usei`);
      const wallet = await basecoin.wallets().get({ id: edgeEntry.walletId });
      const detail: any = await (wallet as any).sendMany({
        type: 'transfer',
        recipients: [{ address: edgeEntry.address, amount: '500' }],
        walletPassphrase: passphrase,
        isTss: true,
      });
      fixture.status = 'broadcast';
      fixture.txHash = detail?.txid ?? detail?.transfer?.txid ?? detail?.tx?.txid ?? detail?.transfer?.hash;
      fixture.txRequestId = detail?.txRequestId ?? detail?.transfer?.txRequestId;
      console.log(`  ✓ txHash=${fixture.txHash}`);
      if (fixture.txHash) fixture.height = await waitForInclusion(fixture.txHash);
    } catch (e: any) {
      console.error(`  ✗ FAILED: ${e.message ?? e}`);
      fixture.error = e.message ?? String(e);
    }
    fs.writeFileSync(edgeFixturePath, JSON.stringify(fixture, null, 2));
    await sleep(4000);
  } else {
    console.log(`  ↻ ${edgeKey}: skipped (no wallet entry or fixture exists)`);
  }

  // ──────────────────────────────────────────────────────────────────────
  // b-e. Staking operations
  // ──────────────────────────────────────────────────────────────────────
  const stakingOps = [
    {
      key: 'redo-staking-msgdelegate',
      msgType: '/cosmos.staking.v1beta1.MsgDelegate',
      needsSetup: false,
      setupIntent: null,
      mainIntent: {
        intentType: 'delegate',
        validatorAddress: validatorSrc,
        amount: { value: '50000', symbol: COIN },
        recipients: [],
      },
    },
    {
      key: 'redo-staking-msgundelegate',
      msgType: '/cosmos.staking.v1beta1.MsgUndelegate',
      needsSetup: true,
      setupIntent: {
        intentType: 'delegate',
        validatorAddress: validatorSrc,
        amount: { value: '50000', symbol: COIN },
        recipients: [],
      },
      mainIntent: {
        intentType: 'undelegate',
        validatorAddress: validatorSrc,
        amount: { value: '25000', symbol: COIN },
        recipients: [],
      },
    },
    {
      key: 'redo-staking-msgbeginredelegate',
      msgType: '/cosmos.staking.v1beta1.MsgBeginRedelegate',
      needsSetup: true,
      setupIntent: {
        intentType: 'delegate',
        validatorAddress: validatorSrc,
        amount: { value: '50000', symbol: COIN },
        recipients: [],
      },
      mainIntent: {
        intentType: 'switchValidator',
        validatorAddress: validatorSrc,
        destValidatorAddress: validatorDst,
        amount: { value: '25000', symbol: COIN },
        recipients: [],
      },
    },
    {
      key: 'redo-staking-msgwithdrawdelegatorreward',
      msgType: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
      needsSetup: true,
      setupIntent: {
        intentType: 'delegate',
        validatorAddress: validatorSrc,
        amount: { value: '50000', symbol: COIN },
        recipients: [],
      },
      mainIntent: {
        intentType: 'stakeClaimRewards',
        validatorAddress: validatorSrc,
        recipients: [],
      },
    },
  ];

  for (const op of stakingOps) {
    const entry = redoWallets[op.key];
    if (!entry) { console.warn(`  ✗ no wallet for ${op.key}`); continue; }

    const fixturePath = path.join(FIXTURE_DIR, `${op.key}.json`);
    // If fixture already has a successful broadcast, skip.
    if (fs.existsSync(fixturePath)) {
      const existing = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      if (existing.status === 'broadcast' && existing.txHash) {
        console.log(`\n  ↻ ${op.key}: already broadcast (tx ${existing.txHash}), skipping`);
        continue;
      }
    }

    console.log(`\n=== ${op.key} ===`);
    console.log(`wallet: ${entry.address} (id=${entry.walletId})`);

    const bal = await getChainBalance(entry.address);
    console.log(`  chain balance: ${bal} usei`);

    const fixture: StakingFixture = {
      key: op.key, msgType: op.msgType,
      walletId: entry.walletId, walletAddress: entry.address,
      status: 'failed', capturedAt: new Date().toISOString(),
    };

    try {
      const wallet = await basecoin.wallets().get({ id: entry.walletId });

      // Setup delegation (for undelegate / redelegate / withdrawReward)
      if (op.needsSetup && op.setupIntent && !skipSetup) {
        const alreadyDelegated = await hasDelegation(entry.address, validatorSrc);
        if (!alreadyDelegated) {
          console.log(`  [setup] delegating 50K to create position...`);
          fixture.intentPayload = { setup: op.setupIntent };
          const { txHash: setupHash } = await runIntent(wallet, op.setupIntent, passphrase);
          fixture.setupTxHash = setupHash;
          console.log(`  [setup] txHash=${setupHash}`);
          fixture.setupHeight = await waitForInclusion(setupHash);
          console.log(`  [setup] included at height ${fixture.setupHeight}`);
          // Allow WP to sync the delegation before the next intent.
          console.log(`  [setup] waiting 30s for indexer + WP sync...`);
          await sleep(30000);
        } else {
          console.log(`  [setup] delegation already exists, skipping setup delegate`);
        }
      }

      // Main intent
      console.log(`  [main] intent: ${JSON.stringify(op.mainIntent)}`);
      fixture.intentPayload = { ...(fixture.intentPayload ?? {}), main: op.mainIntent };
      const { txHash, txRequestId } = await runIntent(wallet, op.mainIntent, passphrase);
      fixture.txHash = txHash;
      fixture.txRequestId = txRequestId;
      fixture.status = 'broadcast';
      console.log(`  ✓ txHash=${txHash}`);
      fixture.height = await waitForInclusion(txHash);
      console.log(`  included at height ${fixture.height}`);
    } catch (e: any) {
      console.error(`  ✗ FAILED: ${e.message ?? e}`);
      fixture.error = e.message ?? String(e);
    }

    fs.writeFileSync(fixturePath, JSON.stringify(fixture, null, 2));
    console.log(`  fixture: ${fixturePath}`);
    await sleep(5000);
  }

  console.log('\n=== Done. Fixtures in redo/fixtures/ ===');
  console.log('Next: run redo/05-run-attacker-extras.ts for MsgSetWithdrawAddress + MsgMint redo.');
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
