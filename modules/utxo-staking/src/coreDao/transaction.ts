import { createCoreDaoOpReturnOutputScript, OpReturnParams } from './opReturn';
import { Descriptor } from '@bitgo/wasm-miniscript';

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
    value: bigint;
    descriptor: string;
    index?: number;
  },
  opReturnParams: OpReturnParams
): { script: Buffer; value: bigint }[] {
  const descriptor = Descriptor.fromString(
    stakingParams.descriptor,
    stakingParams.index === undefined ? 'definite' : 'derivable'
  );

  const outputScript = Buffer.from(
    stakingParams.index === undefined
      ? descriptor.scriptPubkey()
      : descriptor.atDerivationIndex(stakingParams.index).scriptPubkey()
  );
  const opReturnScript = createCoreDaoOpReturnOutputScript(opReturnParams);

  return [
    { script: outputScript, value: stakingParams.value },
    { script: opReturnScript, value: BigInt(0) },
  ];
}
