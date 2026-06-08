/**
 * CGD-1483 edge — MsgExec with multiple inner msgs.
 *
 * Two inner msgs in one MsgExec:
 *   - MsgSend(granter → victim, 500 usei)              (moves funds)
 *   - MsgSetWithdrawAddress(granter, victim)           (no balance impact)
 *
 * Validates that the parser iterates each inner msg independently — the
 * "MsgExec coverage" anti-pattern in the playbook explicitly says don't
 * equate MsgSend coverage with MsgExec(MsgSend) coverage. We confirm here.
 */

import { DirectSecp256k1HdWallet, Registry } from '@cosmjs/proto-signing';
import { SigningStargateClient, defaultRegistryTypes } from '@cosmjs/stargate';
import { MsgExec, MsgGrant } from 'cosmjs-types/cosmos/authz/v1beta1/tx';
import { GenericAuthorization } from 'cosmjs-types/cosmos/authz/v1beta1/authz';
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import { MsgSetWithdrawAddress } from 'cosmjs-types/cosmos/distribution/v1beta1/tx';
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

const MSG_KEY = 'edge-msgexec-multi-inner';
const TYPE_URL = '/cosmos.authz.v1beta1.MsgExec';
const SEND_TYPE_URL = '/cosmos.bank.v1beta1.MsgSend';
const SET_WITHDRAW_TYPE_URL = '/cosmos.distribution.v1beta1.MsgSetWithdrawAddress';

async function ensureGrant(
  granter: { address: string; client: SigningStargateClient },
  granteeAddr: string,
  authorizedMsg: string
): Promise<void> {
  const grants = await lcdGet(
    DEFAULTS.restEndpoint,
    `/cosmos/authz/v1beta1/grants?granter=${granter.address}&grantee=${granteeAddr}`
  );
  if ((grants?.grants ?? []).some((g: any) => g.authorization?.msg === authorizedMsg)) return;
  const expirationSeconds = Math.floor(Date.now() / 1000) + 3600;
  const grantMsg = {
    typeUrl: '/cosmos.authz.v1beta1.MsgGrant',
    value: MsgGrant.fromPartial({
      granter: granter.address,
      grantee: granteeAddr,
      grant: {
        authorization: Any.fromPartial({
          typeUrl: '/cosmos.authz.v1beta1.GenericAuthorization',
          value: GenericAuthorization.encode(
            GenericAuthorization.fromPartial({ msg: authorizedMsg })
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
  console.log(`  MsgGrant landed for ${authorizedMsg}: ${gb.txhash}`);
}

async function main() {
  const granterMnemonic = requireEnv('ATTACKER_MNEMONIC');
  const granteeMnemonic = process.env.GRANTEE_MNEMONIC ?? granterMnemonic;
  const amount = process.env.AMOUNT ?? '500';
  const victim = resolveVictim(MSG_KEY);

  console.log(`=== CGD-1483 ${TYPE_URL} multi-inner ===`);
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

  await assertSufficientBalance(granter.address, BigInt(amount) + 50_000n, 'granter');
  await assertSufficientBalance(grantee.address, 50_000n, 'grantee');

  if (granter.address !== grantee.address) {
    await ensureGrant(granter, grantee.address, SEND_TYPE_URL);
    await ensureGrant(granter, grantee.address, SET_WITHDRAW_TYPE_URL);
  }

  const innerSend = MsgSend.fromPartial({
    fromAddress: granter.address,
    toAddress: victim,
    amount: [{ denom: DEFAULTS.denom, amount }],
  });
  const innerSetWithdraw = MsgSetWithdrawAddress.fromPartial({
    delegatorAddress: granter.address,
    withdrawAddress: victim,
  });

  const execMsg = {
    typeUrl: TYPE_URL,
    value: MsgExec.fromPartial({
      grantee: grantee.address,
      msgs: [
        Any.fromPartial({ typeUrl: SEND_TYPE_URL, value: MsgSend.encode(innerSend).finish() }),
        Any.fromPartial({
          typeUrl: SET_WITHDRAW_TYPE_URL,
          value: MsgSetWithdrawAddress.encode(innerSetWithdraw).finish(),
        }),
      ],
    }),
  };

  await broadcastAndCapture(
    granteeClient,
    grantee.address,
    [execMsg],
    { amount: [{ denom: DEFAULTS.denom, amount: '40000' }], gas: '400000' },
    MSG_KEY,
    'edge-msgexec-multi-inner',
    victim,
    {
      notes:
        'Mix of move + no-move inner msgs. Validate each inner msg index produces correct (or correctly zero) indexer entries.',
    }
  );
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
