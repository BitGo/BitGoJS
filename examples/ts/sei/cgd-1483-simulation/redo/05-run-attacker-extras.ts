/**
 * CGD-1483 REDO round 2 — attacker-signed txs where a BitGo wallet appears
 * as a participant (withdraw-address, mint recipient, etc.).
 *
 * These msg types have NO wallet-platform intent handler, so the BitGo wallet
 * CANNOT be the initiator. Instead, the attacker signs the tx and a BitGo
 * wallet address appears as the target, allowing the indexer to see the tx
 * against a registered wallet.
 *
 * Covers:
 *   1. MsgSetWithdrawAddress — attacker sets its reward-withdrawal address to
 *      the feegrant-msggrantallowance victim wallet. Confirms indexer produces
 *      no phantom entry for informational distribution msg.
 *   2. MsgMint (tokenfactory) + MsgSend — attacker mints factory tokens to a
 *      fresh BitGo wallet (the evm-msgsend victim, which has never received a
 *      factory-denom tx). Re-confirms the UNSUPPORTED_TOKEN drop bug.
 *
 * Documents (not executable without new intent handlers):
 *   - edge-msgmultisend-selfloop: BitGo wallet must be MsgMultiSend input+output.
 *     Needs `multiSend` intent. Closest existing evidence: redo-bank-msgsend-selfloop
 *     tx F8B6D7FB... (MsgSend selfloop from BitGo wallet — same indexer code path).
 *   - MsgExec inner MsgUndelegate: BitGo wallet needs authzGrant + authzExec intent.
 *   - IBC MsgTransfer (×2): needs ibcTransfer intent + active IBC channels.
 *   - MsgCreateDenom, MsgBurn: no recipient role for BitGo wallet.
 *   - MsgInstantiateContract, MsgFundCommunityPool, MsgSubmitProposal: same.
 *
 * Run with:
 *   ATTACKER_MNEMONIC=<mnemonic> npx ts-node redo/05-run-attacker-extras.ts
 */

import fs from 'fs';
import path from 'path';
import { MsgSetWithdrawAddress } from 'cosmjs-types/cosmos/distribution/v1beta1/tx';
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import {
  buildAttacker,
  broadcastAndCapture,
  assertSufficientBalance,
  requireEnv,
  loadWallets,
  DEFAULTS,
} from '../lib/sei-client';
import { TYPE_URLS, tokenfactoryRegistryTypes } from '../lib/sei-tokenfactory-proto';

const FIXTURE_DIR = path.resolve(__dirname, '..', 'fixtures');
const TOKENFACTORY_STATE = path.resolve(__dirname, '..', 'tokenfactory-state.json');

// BitGo wallet used as MsgMint recipient (evm-msgsend victim — never received
// factory tokens, so this is a fresh test of the bug).
const MINT_RECIPIENT_KEY = 'evm-msgsend';

// BitGo wallet used as new withdraw address (feegrant victim — already has
// feegrant from original sim, so it is a registered wallet the indexer tracks).
const WITHDRAW_RECIPIENT_KEY = 'feegrant-msggrantallowance';

async function runSetWithdrawAddress(attacker: string, client: any, withdrawAddr: string) {
  console.log('\n=== MsgSetWithdrawAddress (attacker→BitGo wallet as withdraw addr) ===');
  console.log(`  withdraw_address: ${withdrawAddr}`);

  await broadcastAndCapture(
    client,
    attacker,
    [
      {
        typeUrl: '/cosmos.distribution.v1beta1.MsgSetWithdrawAddress',
        value: MsgSetWithdrawAddress.fromPartial({
          delegatorAddress: attacker,
          withdrawAddress: withdrawAddr,
        }),
      },
    ],
    { amount: [{ denom: DEFAULTS.denom, amount: '20000' }], gas: '200000' },
    'distribution-msgsetwithdrawaddress-bitgo-target',
    'redo-set-withdraw-to-bitgo-wallet',
    withdrawAddr,
    {
      notes:
        'Attacker redirects reward withdraw to a BitGo victim wallet. ' +
        'No bank events → indexer must produce no entry for victim. ' +
        'Future WithdrawDelegatorReward will send rewards to the victim.',
    }
  );
}

async function runMintToBitGoWallet(
  attacker: string,
  client: any,
  recipientAddress: string,
  denom: string
) {
  console.log('\n=== MsgMint (tokenfactory) → BitGo wallet recipient ===');
  console.log(`  denom    : ${denom}`);
  console.log(`  recipient: ${recipientAddress}`);

  // Two messages in one tx:
  //   1. MsgMint — attacker mints 500 factory tokens to itself (standard mint flow)
  //   2. MsgSend — attacker forwards 500 factory tokens to the BitGo wallet
  //
  // This re-creates the F385B6A1... scenario (which confirmed the
  // UNSUPPORTED_TOKEN drop bug) against a NEW BitGo wallet that has never
  // received factory tokens. Confirms the bug is not wallet-specific.
  const mintMsg = {
    typeUrl: TYPE_URLS.MsgMint,
    value: { sender: attacker, amount: { denom, amount: '500' } },
  };
  const sendMsg = {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: MsgSend.fromPartial({
      fromAddress: attacker,
      toAddress: recipientAddress,
      amount: [{ denom, amount: '500' }],
    }),
  };

  await broadcastAndCapture(
    client,
    attacker,
    [mintMsg, sendMsg],
    { amount: [{ denom: DEFAULTS.denom, amount: '40000' }], gas: '400000' },
    'tokenfactory-msgmint-to-fresh-bitgo-wallet',
    'redo-mint-factory-to-evm-msgsend-victim',
    recipientAddress,
    {
      notes:
        'MsgMint + MsgSend factory denom to a BitGo wallet that never held factory tokens. ' +
        'Expected indexer behavior: whole tx dropped by CosmosSupportedDenomination filter. ' +
        'Confirms UNSUPPORTED_TOKEN drop is wallet-independent.',
    }
  );
}

async function main() {
  const mnemonic = requireEnv('ATTACKER_MNEMONIC');
  // tokenfactoryRegistryTypes needed for the MsgMint message in step 2.
  const { client, address: attacker } = await buildAttacker(mnemonic, tokenfactoryRegistryTypes());
  console.log(`attacker: ${attacker}`);
  await assertSufficientBalance(attacker, 100_000n);

  const wallets = loadWallets();

  // 1. MsgSetWithdrawAddress
  const withdrawWallet = wallets[WITHDRAW_RECIPIENT_KEY];
  if (!withdrawWallet) throw new Error(`No wallet for key ${WITHDRAW_RECIPIENT_KEY}`);
  await runSetWithdrawAddress(attacker, client, withdrawWallet.address);

  // 2. MsgMint to BitGo wallet
  const mintRecipient = wallets[MINT_RECIPIENT_KEY];
  if (!mintRecipient) throw new Error(`No wallet for key ${MINT_RECIPIENT_KEY}`);
  if (!fs.existsSync(TOKENFACTORY_STATE)) {
    throw new Error(`Missing ${TOKENFACTORY_STATE} — run tokenfactory-msgcreatedenom.ts first`);
  }
  const tfState = JSON.parse(fs.readFileSync(TOKENFACTORY_STATE, 'utf-8'));
  await runMintToBitGoWallet(attacker, client, mintRecipient.address, tfState.denom);

  // ──────────────────────────────────────────────────────────────────────
  // Documented: not achievable without new wallet-platform intent handlers
  // ──────────────────────────────────────────────────────────────────────
  const NOT_ACHIEVABLE = [
    {
      key: 'edge-msgmultisend-selfloop',
      reason:
        'BitGo wallet must be MsgMultiSend input+output (same address both sides). ' +
        'sendMany() builds MsgSend, not MsgMultiSend. Needs `multiSend` intent. ' +
        'Closest coverage: redo-bank-msgsend-selfloop tx F8B6D7FB... (MsgSend selfloop) ' +
        '— same indexer code path for same-address-twice case.',
    },
    {
      key: 'authz-msgexec-undelegate-inner',
      reason:
        'Requires BitGo wallet as MsgExec granter or executor. ' +
        'Granter side needs authzGrant intent; executor side needs authzExec intent. ' +
        'Neither exists in wallet-platform. ' +
        'File a wallet-platform FR for authzGrant + authzExec intents.',
    },
    {
      key: 'ibc-msgtransfer-live',
      reason:
        'Requires BitGo wallet as IBC sender. Needs ibcTransfer intent. ' +
        'Also: atlantic-2 has 0 active IBC channels (all 51 clients Expired as of 2026-05-26).',
    },
    {
      key: 'ibc-msgtransfer-timeout',
      reason: 'Same as ibc-msgtransfer-live.',
    },
    {
      key: 'tokenfactory-msgcreatedenom',
      reason:
        'No recipient role for a BitGo wallet — denom admin is the tx signer. ' +
        'Needs tokenfactoryCreateDenom intent.',
    },
    {
      key: 'tokenfactory-msgburn',
      reason:
        'No recipient role — burn reduces the signer\'s balance. ' +
        'Needs tokenfactoryBurn intent.',
    },
    {
      key: 'wasm-msginstantiatecontract',
      reason:
        'Could set admin=BitGo wallet but admin has no balance impact. ' +
        'Meaningful test needs BitGo wallet as the instantiator. ' +
        'Needs wasmInstantiate intent.',
    },
    {
      key: 'distribution-msgfundcommunitypool',
      reason: 'Funds go to distribution module account, not a recipient wallet. ' +
        'Needs distributionFundPool intent for BitGo wallet sender.',
    },
    {
      key: 'gov-msgsubmitproposal',
      reason: 'Deposit goes to gov module account. No recipient role. Needs govSubmitProposal intent.',
    },
  ];

  const notAchievableReport = path.join(FIXTURE_DIR, 'redo-not-achievable.json');
  fs.writeFileSync(notAchievableReport, JSON.stringify(NOT_ACHIEVABLE, null, 2));
  console.log(`\n=== ${NOT_ACHIEVABLE.length} msg types not achievable without new intent handlers ===`);
  for (const item of NOT_ACHIEVABLE) {
    console.log(`  ✗ ${item.key}`);
    console.log(`      ${item.reason.slice(0, 90)}...`);
  }
  console.log(`\n  Full details: ${notAchievableReport}`);
  console.log('\n=== Done ===');
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
