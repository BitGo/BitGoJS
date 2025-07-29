import assert from 'assert';

import { Descriptor, ast } from '@bitgo/wasm-miniscript';

import { getKey } from '../../../src/testutil/index.js';
import { toXOnlyPublicKey } from '../../../src/index.js';
import { PatternMatcher, Pattern } from '../../../src/descriptor/parse/PatternMatcher.js';

function key32(seed: string): Buffer {
  // return x-only public key from seed
  return toXOnlyPublicKey(getKey(seed).publicKey);
}

function getUnspendableKey(): string {
  return '50929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0';
}

function pk(b: Buffer): ast.MiniscriptNode {
  return { 'v:pk': b.toString('hex') };
}

function sortedKeys(keys: Buffer[]): Buffer[] {
  return [...keys].sort((a, b) => a.compare(b));
}

function multiArgs(threshold: number, keys: Buffer[]): [number, ...string[]] {
  return [threshold, ...sortedKeys(keys).map((k) => k.toString('hex'))];
}

function taprootScriptOnlyFromAst(n: ast.TapTreeNode): Descriptor {
  return Descriptor.fromString(ast.formatNode({ tr: [getUnspendableKey(), n] }), 'definite');
}

class StakingDescriptorBuilder {
  constructor(
    public userKey: Buffer,
    public providerKeys: Buffer[],
    public guardianKeys: Buffer[],
    public guardianThreshold: number,
    public stakingTimeLock: number
  ) {}

  getTimelockMiniscriptNode(): ast.MiniscriptNode {
    return { and_v: [pk(this.userKey), { older: this.stakingTimeLock }] };
  }

  getWithdrawalMiniscriptNode(): ast.MiniscriptNode {
    return { and_v: [pk(this.userKey), { multi_a: multiArgs(this.guardianThreshold, this.guardianKeys) }] };
  }

  getPenaltyMiniscriptNode(): ast.MiniscriptNode {
    return {
      and_v: [
        {
          and_v: [
            pk(this.userKey),
            this.providerKeys.length === 1
              ? { 'v:pk': this.providerKeys[0].toString('hex') }
              : { 'v:multi_a': multiArgs(1, this.providerKeys) },
          ],
        },
        { multi_a: multiArgs(this.guardianThreshold, this.guardianKeys) },
      ],
    };
  }

  getStakingDescriptor(): Descriptor {
    return taprootScriptOnlyFromAst([
      this.getPenaltyMiniscriptNode(),
      [this.getWithdrawalMiniscriptNode(), this.getTimelockMiniscriptNode()],
    ]);
  }
}

// Inverse function to parse the descriptor
function parseStakingDescriptor(descriptor: Descriptor): {
  penaltyNode: ast.MiniscriptNode;
  withdrawalNode: ast.MiniscriptNode;
  timelockNode: ast.MiniscriptNode;
} | null {
  const pattern: Pattern = {
    tr: [getUnspendableKey(), [{ $var: 'penaltyNode' }, [{ $var: 'withdrawalNode' }, { $var: 'timelockNode' }]]],
  };

  const matcher = new PatternMatcher();
  const descriptorNode = ast.fromDescriptor(descriptor);
  const result = matcher.match(descriptorNode, pattern);

  if (!result) {
    return null;
  }

  return {
    penaltyNode: result.penaltyNode as ast.MiniscriptNode,
    withdrawalNode: result.withdrawalNode as ast.MiniscriptNode,
    timelockNode: result.timelockNode as ast.MiniscriptNode,
  };
}

describe('PatternMatcher', function () {
  it('should match basic object', function () {
    const pattern = { a: { $var: 'x' }, b: 'hello' };
    const node = { a: 123, b: 'hello' };
    const vars = new PatternMatcher().match(node, pattern);
    assert.deepStrictEqual(vars, { x: 123 });
  });

  it('should fail on non-matching object', function () {
    const pattern = { a: { $var: 'x' }, b: 'world' };
    const node = { a: 123, b: 'hello' };
    const vars = new PatternMatcher().match(node, pattern);
    assert.strictEqual(vars, null);
  });

  it('should match with repeated var', function () {
    const pattern = { a: { $var: 'x' }, b: { $var: 'x' } };
    const node = { a: 123, b: 123 };
    const vars = new PatternMatcher().match(node, pattern);
    assert.deepStrictEqual(vars, { x: 123 });
  });

  it('should fail with non-matching repeated var', function () {
    const pattern = { a: { $var: 'x' }, b: { $var: 'x' } };
    const node = { a: 123, b: 456 };
    const vars = new PatternMatcher().match(node, pattern);
    assert.strictEqual(vars, null);
  });

  it('should parse staking descriptor', function () {
    const builder = new StakingDescriptorBuilder(
      key32('user'),
      [key32('provider1')],
      [key32('guardian1'), key32('guardian2')],
      2,
      100
    );

    const descriptor = builder.getStakingDescriptor();
    const parsed = parseStakingDescriptor(descriptor);

    assert.notStrictEqual(parsed, null);
    if (parsed) {
      assert.deepStrictEqual(parsed.penaltyNode, builder.getPenaltyMiniscriptNode());
      assert.deepStrictEqual(parsed.withdrawalNode, builder.getWithdrawalMiniscriptNode());
      assert.deepStrictEqual(parsed.timelockNode, builder.getTimelockMiniscriptNode());
    }
  });
});
