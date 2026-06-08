/**
 * CGD-1483 sanity — /cosmos.staking.v1beta1.MsgUndelegate (DEFERRED_EMISSION).
 *
 * Attacker undelegates a small amount from one of the validators they've
 * delegated to. Verifies the deferred-emission path: the parser writes a
 * zero-value entry plus a pending payback record now; the real `unlock`
 * fires at completion_time (~21 days on mainnet, shorter on testnet).
 *
 * Reconciliation note: at txHeight+1 the indexer balance for usei should NOT
 * yet reflect the principal — that lands later. The pending-payback record
 * IS what we look for in the indexer's mongodb.
 */

import { MsgUndelegate } from 'cosmjs-types/cosmos/staking/v1beta1/tx';
import {
  buildAttacker,
  broadcastAndCapture,
  assertSufficientBalance,
  requireEnv,
  DEFAULTS,
  lcdGet,
} from '../lib/sei-client';

const MSG_KEY = 'staking-msgundelegate';
const TYPE_URL = '/cosmos.staking.v1beta1.MsgUndelegate';

async function main() {
  const mnemonic = requireEnv('ATTACKER_MNEMONIC');
  const amount = process.env.AMOUNT ?? '5000';

  console.log(`=== CGD-1483 ${TYPE_URL} simulation ===`);

  const { client, address: attacker } = await buildAttacker(mnemonic);
  console.log(`attacker  : ${attacker}`);
  await assertSufficientBalance(attacker, 50_000n);

  // Find a validator the attacker is already delegated to. If none, error
  // out and tell the user to run staking-msgdelegate first.
  const delegations = await lcdGet(
    DEFAULTS.restEndpoint,
    `/cosmos/staking/v1beta1/delegations/${attacker}`
  );
  const entries = delegations?.delegation_responses ?? [];
  if (entries.length === 0) {
    throw new Error(
      `Attacker has no active delegations. Run msg/staking-msgdelegate.ts first to establish one.`
    );
  }
  const validatorAddress = process.env.VALIDATOR ?? entries[0].delegation.validator_address;
  const available = entries[0].balance?.amount ?? '0';
  if (BigInt(available) < BigInt(amount)) {
    throw new Error(
      `Validator ${validatorAddress} only has ${available} usei delegated (need ${amount}). Lower AMOUNT or delegate more.`
    );
  }
  console.log(`validator : ${validatorAddress}`);
  console.log(`amount    : ${amount} ${DEFAULTS.denom}`);

  const msg = {
    typeUrl: TYPE_URL,
    value: MsgUndelegate.fromPartial({
      delegatorAddress: attacker,
      validatorAddress,
      amount: { denom: DEFAULTS.denom, amount },
    }),
  };

  await broadcastAndCapture(
    client,
    attacker,
    [msg],
    { amount: [{ denom: DEFAULTS.denom, amount: '30000' }], gas: '300000' },
    MSG_KEY,
    'sanity-undelegate-deferred-emission',
    attacker,
    {
      notes:
        'Deferred emission. Indexer should store pending payback now; principal returns at completion_time.',
    }
  );
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
