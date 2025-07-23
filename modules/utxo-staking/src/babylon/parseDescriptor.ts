import { Descriptor, ast } from '@bitgo/wasm-miniscript';
import { PatternMatcher, Pattern } from '@bitgo/utxo-core/descriptor';

import { getUnspendableKey } from './descriptor';

export type ParsedStakingDescriptor = {
  stakerKey: Buffer;
  finalityProviderKeys: Buffer[];
  covenantKeys: Buffer[];
  covenantThreshold: number;
  stakingTimeLock: number;
  slashingMiniscriptNode: ast.MiniscriptNode;
  unbondingMiniscriptNode: ast.MiniscriptNode;
  timelockMiniscriptNode: ast.MiniscriptNode;
};

function parseMulti(multi: unknown): [number, string[]] {
  if (!Array.isArray(multi) || multi.length < 1) {
    throw new Error('Invalid multi structure: not an array or empty');
  }
  const [threshold, ...keys] = multi;
  if (typeof threshold !== 'number') {
    throw new Error('Invalid multi structure: threshold is not a number');
  }
  if (!keys.every((k) => typeof k === 'string')) {
    throw new Error('Invalid multi structure: not all keys are strings');
  }
  return [threshold, keys];
}

/**
 * @return parsed staking descriptor components or null if the descriptor does not match the expected staking pattern.
 */
export function parseStakingDescriptor(descriptor: Descriptor | ast.DescriptorNode): ParsedStakingDescriptor | null {
  const pattern: Pattern = {
    tr: [
      getUnspendableKey(),
      [{ $var: 'slashingMiniscriptNode' }, [{ $var: 'unbondingMiniscriptNode' }, { $var: 'timelockMiniscriptNode' }]],
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
  const timelockNode = result.timelockMiniscriptNode as ast.MiniscriptNode;

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
  const timelockPattern: Pattern = {
    and_v: [{ 'v:pk': { $var: 'stakerKey3' } }, { older: { $var: 'stakingTimeLock' } }],
  };

  const timelockMatch = matcher.match(timelockNode, timelockPattern);
  if (!timelockMatch) {
    throw new Error('Unbonding timelock node does not match expected pattern');
  }

  // Verify all staker keys are the same
  if (
    slashingMatch.stakerKey1 !== unbondingMatch.stakerKey2 ||
    unbondingMatch.stakerKey2 !== timelockMatch.stakerKey3
  ) {
    throw new Error('Staker keys must be identical across all nodes');
  }

  // Verify timelock value is a number
  if (typeof timelockMatch.stakingTimeLock !== 'number') {
    throw new Error('Unbonding timelock value must be a number');
  }

  const stakerKey = Buffer.from(slashingMatch.stakerKey1 as string, 'hex');
  const stakingTimeLock = timelockMatch.stakingTimeLock as number;

  const [covenantThreshold, covenantKeyStrings] = parseMulti(slashingMatch.covenantMulti);
  const covenantKeys = covenantKeyStrings.map((k) => Buffer.from(k, 'hex'));

  let finalityProviderKeys: Buffer[];
  const fpKeyOrMulti = slashingMatch.finalityProviderKeyOrMulti as ast.MiniscriptNode;
  if ('v:pk' in fpKeyOrMulti) {
    finalityProviderKeys = [Buffer.from(fpKeyOrMulti['v:pk'], 'hex')];
  } else if ('v:multi_a' in fpKeyOrMulti) {
    const [threshold, keyStrings] = parseMulti(fpKeyOrMulti['v:multi_a']);
    if (threshold !== 1) {
      throw new Error('Finality provider multi threshold must be 1');
    }
    finalityProviderKeys = keyStrings.map((k) => Buffer.from(k, 'hex'));
  } else {
    throw new Error('Invalid finality provider key structure');
  }

  return {
    stakerKey,
    finalityProviderKeys,
    covenantKeys,
    covenantThreshold,
    stakingTimeLock,
    slashingMiniscriptNode: slashingNode,
    unbondingMiniscriptNode: unbondingNode,
    timelockMiniscriptNode: timelockNode,
  };
}
