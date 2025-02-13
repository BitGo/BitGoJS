import { Descriptor, ast } from '@bitgo/wasm-miniscript';
import { MiniscriptNode } from '@bitgo/wasm-miniscript/dist/node/js/ast';

export function getUnspendableKey(): string {
  // https://github.com/babylonlabs-io/btc-staking-ts/blob/v0.4.0-rc.2/src/constants/internalPubkey.ts
  return '50929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0';
}

// Helper functions for creating miniscript nodes
function pk(b: Buffer): MiniscriptNode {
  return { 'v:pk': b.toString('hex') };
}

function sortedKeys(keys: Buffer[]): Buffer[] {
  return keys.sort((a, b) => a.compare(b));
}

function multi_a(threshold: number, keys: Buffer[]): { multi_a: [number, ...string[]] } {
  return { multi_a: [threshold, ...sortedKeys(keys).map((k) => k.toString('hex'))] };
}

function taprootScriptOnlyFromAst(n: ast.MiniscriptNode): Descriptor {
  return Descriptor.fromString(ast.formatNode({ tr: [getUnspendableKey(), n] }), 'definite');
}

export class BabylonDescriptorBuilder {
  constructor(
    public stakerKey: Buffer,
    public finalityProviderKeys: Buffer[],
    public covenantKeys: Buffer[],
    public covenantThreshold: number,
    public stakingTimeLock: number,
    public unbondingTimeLock: number
  ) {}

  getTimelockMiniscript(): MiniscriptNode {
    return { and_v: [pk(this.stakerKey), { older: this.stakingTimeLock }] };
  }

  getUnbondingMiniscript(): MiniscriptNode {
    return { and_v: [pk(this.stakerKey), multi_a(this.covenantThreshold, this.covenantKeys)] };
  }

  getSlashingMiniscript(): MiniscriptNode {
    return {
      and_v: [
        {
          and_v: [pk(this.stakerKey), { 'v:multi_a': multi_a(1, this.finalityProviderKeys).multi_a }],
        },
        multi_a(this.covenantThreshold, this.covenantKeys),
      ],
    };
  }

  getUnbondingTimelockMiniscript(): MiniscriptNode {
    return { and_v: [pk(this.stakerKey), { older: this.unbondingTimeLock }] };
  }

  getStakingDescriptor(): Descriptor {
    const a = ast.formatNode(this.getSlashingMiniscript());
    const b = ast.formatNode(this.getUnbondingMiniscript());
    const c = ast.formatNode(this.getTimelockMiniscript());
    const desc = `tr(${getUnspendableKey()},{${a},{${b},${c}}})`;
    return Descriptor.fromString(desc, 'definite');
  }

  getSlashingDescriptor(): Descriptor {
    return taprootScriptOnlyFromAst(this.getUnbondingTimelockMiniscript());
  }

  getUnbondingDescriptor(): Descriptor {
    const a = ast.formatNode(this.getSlashingMiniscript());
    const b = ast.formatNode(this.getUnbondingTimelockMiniscript());
    const desc = `tr(${getUnspendableKey()},{${a},${b}})`;
    return Descriptor.fromString(desc, 'definite');
  }
}
