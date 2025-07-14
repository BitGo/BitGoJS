import { Descriptor, ast } from '@bitgo/wasm-miniscript';
import { PatternMatcher, Pattern } from '@bitgo/utxo-core/descriptor';

import { getUnspendableKey } from './descriptor';

type ParsedStakingDescriptor = {
  slashingMiniscriptNode: ast.MiniscriptNode;
  unbondingTimelockMiniscriptNode: ast.MiniscriptNode;
  unbondingMiniscriptNode: ast.MiniscriptNode;
};

/**
 * @return parsed staking descriptor components or null if the descriptor does not match the expected staking pattern.
 */
export function parseStakingDescriptor(descriptor: Descriptor | ast.DescriptorNode): ParsedStakingDescriptor | null {
  const pattern: Pattern = {
    tr: [
      getUnspendableKey(),
      [
        { $var: 'slashingMiniscriptNode' },
        [{ $var: 'unbondingMiniscriptNode' }, { $var: 'unbondingTimelockMiniscriptNode' }],
      ],
    ],
  };

  const matcher = new PatternMatcher();
  const descriptorNode = descriptor instanceof Descriptor ? ast.fromDescriptor(descriptor) : descriptor;
  const result = matcher.match(descriptorNode, pattern);

  if (!result) {
    return null;
  }

  const slashingNode = result.slashingMiniscriptNode as ast.MiniscriptNode;
  const unbondingNode = result.unbondingMiniscriptNode as ast.MiniscriptNode;
  const unbondingTimelockNode = result.unbondingTimelockMiniscriptNode as ast.MiniscriptNode;

  // Verify slashing node shape: and_v([and_v([pk, pk/multi_a]), multi_a])
  const slashingPattern: Pattern = {
    and_v: [
      {
        and_v: [{ 'v:pk': { $var: 'stakerKey1' } }, { $var: 'finalityProviderKeyOrMulti' }],
      },
      { multi_a: { $var: 'covenantMulti' } },
    ],
  };

  const slashingMatch = matcher.match(slashingNode, slashingPattern);
  if (!slashingMatch) {
    throw new Error('Slashing node does not match expected pattern');
  }

  // Verify unbonding node shape: and_v([pk, multi_a])
  const unbondingPattern: Pattern = {
    and_v: [{ 'v:pk': { $var: 'stakerKey2' } }, { multi_a: { $var: 'covenantMulti2' } }],
  };

  const unbondingMatch = matcher.match(unbondingNode, unbondingPattern);
  if (!unbondingMatch) {
    throw new Error('Unbonding node does not match expected pattern');
  }

  // Verify unbonding timelock node shape: and_v([pk, older])
  const unbondingTimelockPattern: Pattern = {
    and_v: [{ 'v:pk': { $var: 'stakerKey3' } }, { older: { $var: 'unbondingTimeLockValue' } }],
  };

  const unbondingTimelockMatch = matcher.match(unbondingTimelockNode, unbondingTimelockPattern);
  if (!unbondingTimelockMatch) {
    throw new Error('Unbonding timelock node does not match expected pattern');
  }

  // Verify all staker keys are the same
  if (
    slashingMatch.stakerKey1 !== unbondingMatch.stakerKey2 ||
    unbondingMatch.stakerKey2 !== unbondingTimelockMatch.stakerKey3
  ) {
    throw new Error('Staker keys must be identical across all nodes');
  }

  // Verify timelock value is a number
  if (typeof unbondingTimelockMatch.unbondingTimeLockValue !== 'number') {
    throw new Error('Unbonding timelock value must be a number');
  }

  return {
    slashingMiniscriptNode: slashingNode,
    unbondingMiniscriptNode: unbondingNode,
    unbondingTimelockMiniscriptNode: unbondingTimelockNode,
  };
}
