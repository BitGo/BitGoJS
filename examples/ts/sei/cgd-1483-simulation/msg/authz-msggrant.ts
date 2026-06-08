/**
 * CGD-1483 sanity — /cosmos.authz.v1beta1.MsgGrant.
 *
 * Attacker grants a `GenericAuthorization` for `/cosmos.bank.v1beta1.MsgSend`
 * to the victim address (the grantee). No balance impact, but the parser
 * must NOT produce a phantom entry.
 *
 * Optional: also grants `/cosmos.staking.v1beta1.MsgUndelegate` so the
 * authz-msgexec-undelegate edge script can later run as the grantee.
 * Setting that up here saves a separate script.
 */

import { MsgGrant } from 'cosmjs-types/cosmos/authz/v1beta1/tx';
import { GenericAuthorization } from 'cosmjs-types/cosmos/authz/v1beta1/authz';
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

const MSG_KEY = 'authz-msggrant';
const TYPE_URL = '/cosmos.authz.v1beta1.MsgGrant';

async function main() {
  const mnemonic = requireEnv('ATTACKER_MNEMONIC');
  // Granted authority: bank.MsgSend by default; switch via AUTHORIZATION_FOR.
  const authorizedMsg = process.env.AUTHORIZATION_FOR ?? '/cosmos.bank.v1beta1.MsgSend';
  const grantee = process.env.GRANTEE ?? resolveVictim(MSG_KEY);

  console.log(`=== CGD-1483 ${TYPE_URL} simulation ===`);
  console.log(`grantee   : ${grantee}`);
  console.log(`authorized: ${authorizedMsg}`);

  const { client, address: attacker } = await buildAttacker(mnemonic);
  console.log(`granter   : ${attacker}`);
  await assertSufficientBalance(attacker, 30_000n);

  // Expiration 1 hour from now (well above tx inclusion latency).
  const expirationSeconds = Math.floor(Date.now() / 1000) + 3600;
  const auth = GenericAuthorization.fromPartial({ msg: authorizedMsg });
  const msg = {
    typeUrl: TYPE_URL,
    value: MsgGrant.fromPartial({
      granter: attacker,
      grantee,
      grant: {
        authorization: Any.fromPartial({
          typeUrl: '/cosmos.authz.v1beta1.GenericAuthorization',
          value: GenericAuthorization.encode(auth).finish(),
        }),
        expiration: Timestamp.fromPartial({ seconds: Long.fromNumber(expirationSeconds), nanos: 0 }),
      },
    }),
  };

  await broadcastAndCapture(
    client,
    attacker,
    [msg],
    { amount: [{ denom: DEFAULTS.denom, amount: '25000' }], gas: '250000' },
    MSG_KEY,
    'sanity-authz-grant',
    grantee,
    { notes: 'No balance impact. Indexer must not emit a transfer entry.' }
  );
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
