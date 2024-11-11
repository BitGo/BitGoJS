import { createCoreDaoOpReturnOutputScript, OpReturnParams } from './opReturn';
import { Descriptor } from '@bitgo/wasm-miniscript';

/**
 * Create the staking outputs for a CoreDAO transaction.
 * @param stakeOutput Parameters to create the staking output
 * @param stakeOutput.descriptor Descriptor to create the script for the output. It must be a definite descriptor (no wildcard)
 * @param stakeOutput.amount Amount to stake
 * @param opReturnOutputParams Params to create the OP_RETURN output
 */
export function prepareStakingOutputs(
  stakeOutput: { amount: bigint; descriptor: string },
  opReturnOutputParams: OpReturnParams
): { script: Buffer; amount: bigint }[] {
  return [
    {
      script: Buffer.from(Descriptor.fromString(stakeOutput.descriptor, 'definite').scriptPubkey()),
      amount: stakeOutput.amount,
    },
    { script: createCoreDaoOpReturnOutputScript(opReturnOutputParams), amount: BigInt(0) },
  ];
}
