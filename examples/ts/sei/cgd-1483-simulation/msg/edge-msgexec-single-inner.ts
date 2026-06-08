/**
 * CGD-1483 edge — MsgExec wrapping a single inner MsgSend that moves funds.
 *
 * Same authz pattern as authz-msgexec-undelegate.ts, but the inner is a
 * MsgSend from the granter's account to the victim. The bug class here is
 * confirming the parser captures bank events emitted from inside MsgExec
 * (verify report says yes — same coin_spent/coin_received still fire).
 *
 * If GRANTEE_MNEMONIC is unset, the script uses ATTACKER_MNEMONIC as both
 * granter and grantee (self-exec). The bug class is identical either way.
 */

import { DirectSecp256k1HdWallet, Registry } from '@cosmjs/proto-signing';
import { SigningStargateClient, defaultRegistryTypes } from '@cosmjs/stargate';
import { MsgExec, MsgGrant } from 'cosmjs-types/cosmos/authz/v1beta1/tx';
import { GenericAuthorization } from 'cosmjs-types/cosmos/authz/v1beta1/authz';
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import { Any } from 'cosmjs-types/google/protobuf/any';
import { Timestamp } from 'cosmjs-types/google/protobuf/timestamp';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Long = require('long');
import {
  buildAttacker,
  signAndBroadcast,
  broadcastAndCapture,
  assertSufficientBalance,
  requireEnv,
  resolveVictim,
  DEFAULTS,
  lcdGet,
  waitForTx,
} from '../lib/sei-client';

const MSG_KEY = 'edge-msgexec-single-inner';
const TYPE_URL = '/cosmos.authz.v1beta1.MsgExec';
const SEND_TYPE_URL = '/cosmos.bank.v1beta1.MsgSend';

async function main() {
  const granterMnemonic = requireEnv('ATTACKER_MNEMONIC');
  const granteeMnemonic = process.env.GRANTEE_MNEMONIC ?? granterMnemonic;
  const amount = process.env.AMOUNT ?? '1000';
  const victim = resolveVictim(MSG_KEY);

  console.log(`=== CGD-1483 ${TYPE_URL} single-inner MsgSend ===`);
  const granter = await buildAttacker(granterMnemonic);
  const granteeWallet = await DirectSecp256k1HdWallet.fromMnemonic(granteeMnemonic, {
    prefix: DEFAULTS.addressPrefix,
  });
  const [grantee] = await granteeWallet.getAccounts();
  const granteeClient = await SigningStargateClient.connectWithSigner(
    DEFAULTS.rpcEndpoint,
    granteeWallet,
    { registry: new Registry([...defaultRegistryTypes]) }
  );
  console.log(`granter   : ${granter.address}`);
  console.log(`grantee   : ${grantee.address}`);
  console.log(`victim    : ${victim}`);
  console.log(`amount    : ${amount} ${DEFAULTS.denom}`);

  await assertSufficientBalance(granter.address, BigInt(amount) + 50_000n, 'granter');
  await assertSufficientBalance(grantee.address, 50_000n, 'grantee');

  if (granter.address !== grantee.address) {
    const grants = await lcdGet(
      DEFAULTS.restEndpoint,
      `/cosmos/authz/v1beta1/grants?granter=${granter.address}&grantee=${grantee.address}`
    );
    const hasGrant = (grants?.grants ?? []).some((g: any) => g.authorization?.msg === SEND_TYPE_URL);
    if (!hasGrant) {
      console.log('Issuing MsgGrant for MsgSend...');
      const expirationSeconds = Math.floor(Date.now() / 1000) + 3600;
      const grantMsg = {
        typeUrl: '/cosmos.authz.v1beta1.MsgGrant',
        value: MsgGrant.fromPartial({
          granter: granter.address,
          grantee: grantee.address,
          grant: {
            authorization: Any.fromPartial({
              typeUrl: '/cosmos.authz.v1beta1.GenericAuthorization',
              value: GenericAuthorization.encode(
                GenericAuthorization.fromPartial({ msg: SEND_TYPE_URL })
              ).finish(),
            }),
            expiration: Timestamp.fromPartial({ seconds: Long.fromNumber(expirationSeconds), nanos: 0 }),
          },
        }),
      };
      const gb = await signAndBroadcast(
        granter.client,
        granter.address,
        [grantMsg],
        { amount: [{ denom: DEFAULTS.denom, amount: '25000' }], gas: '250000' }
      );
      await waitForTx(DEFAULTS.restEndpoint, gb.txhash);
      console.log(`  MsgGrant landed ${gb.txhash}`);
    }
  }

  const innerSend = MsgSend.fromPartial({
    fromAddress: granter.address,
    toAddress: victim,
    amount: [{ denom: DEFAULTS.denom, amount }],
  });
  const execMsg = {
    typeUrl: TYPE_URL,
    value: MsgExec.fromPartial({
      grantee: grantee.address,
      msgs: [
        Any.fromPartial({
          typeUrl: SEND_TYPE_URL,
          value: MsgSend.encode(innerSend).finish(),
        }),
      ],
    }),
  };

  await broadcastAndCapture(
    granteeClient,
    grantee.address,
    [execMsg],
    { amount: [{ denom: DEFAULTS.denom, amount: '30000' }], gas: '300000' },
    MSG_KEY,
    'edge-msgexec-single-inner-send',
    victim,
    {
      notes: 'Expect bank events to fire from inside MsgExec. Verify indexer credits victim.',
    }
  );
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
