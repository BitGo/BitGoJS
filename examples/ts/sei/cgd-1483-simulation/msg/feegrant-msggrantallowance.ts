/**
 * CGD-1483 sanity — /cosmos.feegrant.v1beta1.MsgGrantAllowance.
 *
 * Attacker (granter) grants a BasicAllowance to victim (grantee). No
 * balance impact at grant time; verifies indexer doesn't produce phantom
 * entries. The pre-existing feegrant fee-payer attribution bug (parser
 * uses tx.body.messages[0] signer instead of tx.auth_info.fee.payer) is
 * tracked separately; this script just confirms the grant itself.
 */

import { MsgGrantAllowance } from 'cosmjs-types/cosmos/feegrant/v1beta1/tx';
import { BasicAllowance } from 'cosmjs-types/cosmos/feegrant/v1beta1/feegrant';
import { Any } from 'cosmjs-types/google/protobuf/any';
import { Timestamp } from 'cosmjs-types/google/protobuf/timestamp';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Long = require('long');
import {
  buildAttacker,
  broadcastAndCapture,
  assertSufficientBalance,
  requireEnv,
  resolveVictim,
  DEFAULTS,
} from '../lib/sei-client';

const MSG_KEY = 'feegrant-msggrantallowance';
const TYPE_URL = '/cosmos.feegrant.v1beta1.MsgGrantAllowance';

async function main() {
  const mnemonic = requireEnv('ATTACKER_MNEMONIC');
  const grantee = process.env.GRANTEE ?? resolveVictim(MSG_KEY);

  console.log(`=== CGD-1483 ${TYPE_URL} simulation ===`);
  console.log(`grantee   : ${grantee}`);
  const { client, address: granter } = await buildAttacker(mnemonic);
  console.log(`granter   : ${granter}`);
  await assertSufficientBalance(granter, 30_000n);

  const expirationSeconds = Math.floor(Date.now() / 1000) + 3600;
  const allowance = BasicAllowance.fromPartial({
    spendLimit: [{ denom: DEFAULTS.denom, amount: '100000' }],
    expiration: Timestamp.fromPartial({ seconds: Long.fromNumber(expirationSeconds), nanos: 0 }),
  });
  const msg = {
    typeUrl: TYPE_URL,
    value: MsgGrantAllowance.fromPartial({
      granter,
      grantee,
      allowance: Any.fromPartial({
        typeUrl: '/cosmos.feegrant.v1beta1.BasicAllowance',
        value: BasicAllowance.encode(allowance).finish(),
      }),
    }),
  };

  await broadcastAndCapture(
    client,
    granter,
    [msg],
    { amount: [{ denom: DEFAULTS.denom, amount: '25000' }], gas: '250000' },
    MSG_KEY,
    'sanity-feegrant-allowance',
    grantee
  );
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
