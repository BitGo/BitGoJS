/**
 * https://github.com/babylonlabs-io/babylon/tree/main/docs
 * https://github.com/babylonlabs-io/babylon/blob/main/docs/staking-script.md
 * https://github.com/babylonlabs-io/babylon/blob/v1.99.0-snapshot.250211/btcstaking/staking.go
 */

import { Descriptor, ast } from '@bitgo/wasm-miniscript';
import { StakingParams } from '@bitgo-beta/babylonlabs-io-btc-staking-ts';

export function getUnspendableKey(): string {
  // https://github.com/babylonlabs-io/btc-staking-ts/blob/v0.4.0-rc.2/src/constants/internalPubkey.ts
  return '50929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0';
}

// Helper functions for creating miniscript nodes
function pk(b: Buffer): ast.MiniscriptNode {
  return { 'v:pk': b.toString('hex') };
}

export function sortedKeys(keys: Buffer[]): Buffer[] {
  return [...keys].sort((a, b) => a.compare(b));
}

function multiArgs(threshold: number, keys: Buffer[]): [number, ...string[]] {
  return [threshold, ...sortedKeys(keys).map((k) => k.toString('hex'))];
}

function taprootScriptOnlyFromAst(n: ast.TapTreeNode): Descriptor {
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

  static fromParams(
    params: {
      stakerKey: Buffer;
      finalityProviderKeys: Buffer[];
    } & StakingParams
  ): BabylonDescriptorBuilder {
    return new BabylonDescriptorBuilder(
      params.stakerKey,
      params.finalityProviderKeys,
      params.covenantNoCoordPks.map((k) => Buffer.from(k, 'hex')),
      params.covenantQuorum,
      params.minStakingTimeBlocks,
      params.unbondingTime
    );
  }

  /** Spend path with the staker key and the staking timelock */
  getStakingTimelockMiniscriptNode(): ast.MiniscriptNode {
    return { and_v: [pk(this.stakerKey), { older: this.stakingTimeLock }] };
  }

  /** Spend path with the staker key and the unbonding timelock */
  getUnbondingTimelockMiniscriptNode(): ast.MiniscriptNode {
    return { and_v: [pk(this.stakerKey), { older: this.unbondingTimeLock }] };
  }

  /** Spend path with the staker key and the covenant keys */
  getUnbondingMiniscriptNode(): ast.MiniscriptNode {
    return { and_v: [pk(this.stakerKey), { multi_a: multiArgs(this.covenantThreshold, this.covenantKeys) }] };
  }

  /** Spend path with the finality provider keys and the covenant keys */
  getSlashingMiniscriptNode(): ast.MiniscriptNode {
    return {
      and_v: [
        {
          and_v: [
            pk(this.stakerKey),
            this.finalityProviderKeys.length === 1
              ? { 'v:pk': this.finalityProviderKeys[0].toString('hex') }
              : { 'v:multi_a': multiArgs(1, this.finalityProviderKeys) },
          ],
        },
        { multi_a: multiArgs(this.covenantThreshold, this.covenantKeys) },
      ],
    };
  }

  /**
   * Creates a descriptor for a staking output.
   *
   * Three spend paths:
   * - the slashing script,
   * - the unbonding script,
   * - the timelocked unstaking script.
   */
  getStakingDescriptor(): Descriptor {
    return taprootScriptOnlyFromAst([
      this.getSlashingMiniscriptNode(),
      [this.getUnbondingMiniscriptNode(), this.getStakingTimelockMiniscriptNode()],
    ]);
  }

  /**
   * Creates a descriptor for the timelocked unbonding script.
   */
  getUnbondingTimelockDescriptor(): Descriptor {
    return taprootScriptOnlyFromAst(this.getUnbondingTimelockMiniscriptNode());
  }

  /**
   * Creates a descriptor with two script paths: the slashing script and the timelocked unbonding script.
   */
  getUnbondingDescriptor(): Descriptor {
    return taprootScriptOnlyFromAst([this.getSlashingMiniscriptNode(), this.getUnbondingTimelockMiniscriptNode()]);
  }
}
