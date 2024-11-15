import { Descriptor } from '@bitgo/wasm-miniscript';

import { createCoreDaoOpReturnOutputScript, OpReturnParams } from './opReturn';

/**
 * Create the staking outputs for a CoreDAO staking transaction. This is the ordering
 * in which to add into the transaction.
 * @param stakingParams how to create the timelocked stake output
 * @param stakingParams.descriptor if stakingParams.index is not provided, then this is assumed to be a `definite` descriptor.
 * If stakingParams.index is provided, then this is assumed to be a `derivable` descriptor.
 * @param opReturnParams to create the OP_RETURN output
 */
export function createStakingOutputs(
  stakingParams: {
    amount: bigint;
    descriptor: Descriptor;
    index?: number;
  },
  opReturnParams: OpReturnParams
): { script: Buffer; amount: bigint }[] {
  if (stakingParams.descriptor.hasWildcard() && stakingParams.index === undefined) {
    throw new Error('Cannot create staking outputs with a wildcard descriptor and no derivation index');
  }

  const outputScript = Buffer.from(
    stakingParams.index === undefined
      ? stakingParams.descriptor.scriptPubkey()
      : stakingParams.descriptor.atDerivationIndex(stakingParams.index).scriptPubkey()
  );
  const opReturnScript = createCoreDaoOpReturnOutputScript(opReturnParams);

  return [
    { script: outputScript, amount: stakingParams.amount },
    { script: opReturnScript, amount: BigInt(0) },
  ];
}
