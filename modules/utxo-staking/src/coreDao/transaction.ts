import { Output } from '@bitgo/utxo-core';
import { Descriptor } from '@bitgo/wasm-miniscript';

import { createCoreDaoOpReturnOutputScript, OpReturnParams } from './opReturn';

type StakingParams = {
  amount: bigint;
  descriptor: Descriptor;
  index?: number;
};

/**
 * Create the staking outputs for a CoreDAO staking transaction. This is the ordering
 * in which to add into the transaction.
 * @param stakingParams how to create the timelocked stake output
 * @param stakingParams.descriptor if stakingParams.index is not provided, then this is assumed to be a `definite` descriptor.
 * If stakingParams.index is provided, then this is assumed to be a `derivable` descriptor.
 * @param opReturnParams to create the OP_RETURN output
 */
export function createStakingOutputsCore(
  stakingParams: StakingParams,
  opReturnParams: OpReturnParams
): Output<bigint>[] {
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
    { script: outputScript, value: stakingParams.amount },
    { script: opReturnScript, value: BigInt(0) },
  ];
}

type LegacyOutput = {
  script: Buffer;
  amount: bigint;
};

/**
 * @see createStakingOutputsCore
 * @deprecated - use createStakingOutputsCore instead
 */
export function createStakingOutputs(stakingParams: StakingParams, opReturnParams: OpReturnParams): LegacyOutput[] {
  return createStakingOutputsCore(stakingParams, opReturnParams).map(({ value, ...o }) => ({ ...o, amount: value }));
}
