/**
 * https://github.com/babylonlabs-io/babylon/tree/main/docs
 * https://github.com/babylonlabs-io/babylon/blob/main/docs/staking-script.md
 */

import { Descriptor, ast } from '@bitgo/wasm-miniscript';
import { StakingParams } from '@bitgo/babylonlabs-io-btc-staking-ts';

export function getUnspendableKey(): string {
  // https://github.com/babylonlabs-io/btc-staking-ts/blob/v0.4.0-rc.2/src/constants/internalPubkey.ts
  return '50929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0';
}

// Helper functions for creating miniscript nodes
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
    /*

  const stakerKey = getECKey('staker');
  const covenantThreshold = stakingParams.covenantQuorum;
  const stakingTimelock = stakingParams.minStakingTimeBlocks;
  const unbondingTimelock = stakingParams.unbondingTime;
  const vendorBuilder = new vendor.StakingScriptData(
    getXOnlyPubkey(stakerKey),
    finalityProviderKeys.map(getXOnlyPubkey),
    covenantKeys.map(getXOnlyPubkey),
    covenantThreshold,
    stakingTimelock,
    unbondingTimelock
  );
     */
    return new BabylonDescriptorBuilder(
      params.stakerKey,
      params.finalityProviderKeys,
      params.covenantNoCoordPks.map((k) => Buffer.from(k, 'hex')),
      params.covenantQuorum,
      params.minStakingTimeBlocks,
      params.unbondingTime
    );
  }

  getTimelockMiniscript(): ast.MiniscriptNode {
    return { and_v: [pk(this.stakerKey), { older: this.stakingTimeLock }] };
  }

  getUnbondingMiniscript(): ast.MiniscriptNode {
    return { and_v: [pk(this.stakerKey), { multi_a: multiArgs(this.covenantThreshold, this.covenantKeys) }] };
  }

  getSlashingMiniscript(): ast.MiniscriptNode {
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

  getUnbondingTimelockMiniscript(): ast.MiniscriptNode {
    return { and_v: [pk(this.stakerKey), { older: this.unbondingTimeLock }] };
  }

  getStakingDescriptor(): Descriptor {
    return taprootScriptOnlyFromAst([
      this.getSlashingMiniscript(),
      [this.getUnbondingMiniscript(), this.getTimelockMiniscript()],
    ]);
  }

  getSlashingDescriptor(): Descriptor {
    return taprootScriptOnlyFromAst(this.getUnbondingTimelockMiniscript());
  }

  getUnbondingDescriptor(): Descriptor {
    return taprootScriptOnlyFromAst([this.getSlashingMiniscript(), this.getUnbondingTimelockMiniscript()]);
  }
}
