/**
 * CGD-1483 broken — /cosmos.authz.v1beta1.MsgExec with inner MsgUndelegate.
 *
 * THIS is the #2 confirmed parser bug: `parseIsUnstakeTx` at
 * CosmosLikeTransaction.java:317-329 only looks at top-level
 * `tx.body.messages[]` for MsgUndelegate. When the undelegate is wrapped
 * in MsgExec.msgs[], the parser doesn't detect it → no pending payback
 * record stored → delegator's principal disappears from the indexer at
 * completion_time.
 *
 * To reproduce on testnet we need a 2-party setup:
 *   - GRANTER (the wallet being undelegated FROM) — for testing we use a
 *     dedicated second mnemonic OR the attacker themselves with the
 *     grantee role on a delegated wallet.
 *   - GRANTEE (who submits the MsgExec on behalf of granter).
 *
 * Simplest sim: have the attacker create a delegation, grant authz to a
 * second key (also derivable from the same mnemonic — index 1), then have
 * the grantee submit MsgExec wrapping MsgUndelegate against the granter.
 *
 * Inputs:
 *   ATTACKER_MNEMONIC (acts as the granter — must have an active delegation)
 *   GRANTEE_MNEMONIC  (acts as the grantee — must be funded)
 *
 * Pre-reqs:
 *   1. Granter must have a MsgGrant for /cosmos.staking.v1beta1.MsgUndelegate
 *      to the grantee. If absent, this script issues one first.
 *   2. Granter must have an active delegation. If absent, this script fails
 *      with a hint to run msg/staking-msgdelegate.ts first.
 */

import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { SigningStargateClient } from '@cosmjs/stargate';
import { Registry } from '@cosmjs/proto-signing';
import { defaultRegistryTypes } from '@cosmjs/stargate';
import { MsgExec, MsgGrant } from 'cosmjs-types/cosmos/authz/v1beta1/tx';
import { GenericAuthorization } from 'cosmjs-types/cosmos/authz/v1beta1/authz';
import { MsgUndelegate } from 'cosmjs-types/cosmos/staking/v1beta1/tx';
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
  DEFAULTS,
  lcdGet,
  waitForTx,
} from '../lib/sei-client';

const MSG_KEY = 'authz-msgexec-undelegate';
const TYPE_URL = '/cosmos.authz.v1beta1.MsgExec';
const UNDELEGATE_TYPE_URL = '/cosmos.staking.v1beta1.MsgUndelegate';

async function main() {
  const granterMnemonic = requireEnv('ATTACKER_MNEMONIC');
  const granteeMnemonic = process.env.GRANTEE_MNEMONIC ?? granterMnemonic;
  // If grantee derived from same mnemonic, use a different HD path; cosmjs
  // doesn't expose hdPath on fromMnemonic directly, so we keep this simple:
  // pass GRANTEE_MNEMONIC for clean separation. If user uses the same one,
  // grantee==attacker which is fine for the indexer test (the bug is about
  // wrapping, not the grantee identity).
  const amount = process.env.AMOUNT ?? '5000';

  console.log(`=== CGD-1483 ${TYPE_URL} (inner MsgUndelegate) ===`);
  const granter = await buildAttacker(granterMnemonic);
  console.log(`granter (delegator): ${granter.address}`);

  // Grantee built independently — same registry + default RPC.
  const granteeWallet = await DirectSecp256k1HdWallet.fromMnemonic(granteeMnemonic, {
    prefix: DEFAULTS.addressPrefix,
  });
  const [granteeAcc] = await granteeWallet.getAccounts();
  const granteeRegistry = new Registry([...defaultRegistryTypes]);
  const granteeClient = await SigningStargateClient.connectWithSigner(
    DEFAULTS.rpcEndpoint,
    granteeWallet,
    { registry: granteeRegistry }
  );
  console.log(`grantee            : ${granteeAcc.address}`);

  await assertSufficientBalance(granter.address, BigInt(amount) + 50_000n, 'granter');
  await assertSufficientBalance(granteeAcc.address, 50_000n, 'grantee');

  // 1. Verify granter has an active delegation.
  const delegations = await lcdGet(
    DEFAULTS.restEndpoint,
    `/cosmos/staking/v1beta1/delegations/${granter.address}`
  );
  const entries = delegations?.delegation_responses ?? [];
  if (entries.length === 0) {
    throw new Error(
      `Granter ${granter.address} has no delegations. Run msg/staking-msgdelegate.ts first.`
    );
  }
  const validatorAddress = process.env.VALIDATOR ?? entries[0].delegation.validator_address;
  console.log(`validator          : ${validatorAddress}`);
  console.log(`undelegate amount  : ${amount} ${DEFAULTS.denom}`);

  // 2. If grantee != granter, ensure MsgGrant for MsgUndelegate exists.
  if (granter.address !== granteeAcc.address) {
    const grants = await lcdGet(
      DEFAULTS.restEndpoint,
      `/cosmos/authz/v1beta1/grants?granter=${granter.address}&grantee=${granteeAcc.address}`
    );
    const hasGrant = (grants?.grants ?? []).some(
      (g: any) => g.authorization?.msg === UNDELEGATE_TYPE_URL
    );
    if (!hasGrant) {
      console.log(`No matching authz grant — issuing MsgGrant first...`);
      const expirationSeconds = Math.floor(Date.now() / 1000) + 3600;
      const auth = GenericAuthorization.fromPartial({ msg: UNDELEGATE_TYPE_URL });
      const grantMsg = {
        typeUrl: '/cosmos.authz.v1beta1.MsgGrant',
        value: MsgGrant.fromPartial({
          granter: granter.address,
          grantee: granteeAcc.address,
          grant: {
            authorization: Any.fromPartial({
              typeUrl: '/cosmos.authz.v1beta1.GenericAuthorization',
              value: GenericAuthorization.encode(auth).finish(),
            }),
            expiration: Timestamp.fromPartial({ seconds: Long.fromNumber(expirationSeconds), nanos: 0 }),
          },
        }),
      };
      const grantBroadcast = await signAndBroadcast(
        granter.client,
        granter.address,
        [grantMsg],
        { amount: [{ denom: DEFAULTS.denom, amount: '25000' }], gas: '250000' }
      );
      console.log(`  MsgGrant submitted: ${grantBroadcast.txhash}`);
      await waitForTx(DEFAULTS.restEndpoint, grantBroadcast.txhash);
      console.log(`  MsgGrant landed.`);
    } else {
      console.log(`Existing authz grant present.`);
    }
  } else {
    console.log(`granter==grantee (same mnemonic) — no grant needed.`);
  }

  // 3. Build the inner MsgUndelegate (granter is the delegator).
  const innerUndelegate = MsgUndelegate.fromPartial({
    delegatorAddress: granter.address,
    validatorAddress,
    amount: { denom: DEFAULTS.denom, amount },
  });
  const innerAny = Any.fromPartial({
    typeUrl: UNDELEGATE_TYPE_URL,
    value: MsgUndelegate.encode(innerUndelegate).finish(),
  });

  // 4. MsgExec submitted BY GRANTEE.
  const execMsg = {
    typeUrl: TYPE_URL,
    value: MsgExec.fromPartial({
      grantee: granteeAcc.address,
      msgs: [innerAny],
    }),
  };

  await broadcastAndCapture(
    granteeClient,
    granteeAcc.address,
    [execMsg],
    { amount: [{ denom: DEFAULTS.denom, amount: '50000' }], gas: '500000' },
    MSG_KEY,
    'broken-authz-exec-inner-undelegate',
    granter.address,
    {
      notes:
        'Granter (BitGo wallet) is the delegator inside MsgExec.msgs[]. Indexer expected to MISS the pending payback record.',
    }
  );
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
