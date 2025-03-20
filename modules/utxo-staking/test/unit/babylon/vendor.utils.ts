import * as bitcoinjslib from 'bitcoinjs-lib';
import { ECPairInterface } from '@bitgo/utxo-lib';
import * as vendor from '@bitgo/babylonlabs-io-btc-staking-ts';
import * as babylonProtobuf from '@babylonlabs-io/babylon-proto-ts';
import { toBech32 } from 'bitcoinjs-lib/src/address';
import { getBabylonParamByBtcHeight } from '@bitgo/babylonlabs-io-btc-staking-ts';

import {
  BabylonDescriptorBuilder,
  createUnsignedPreStakeRegistrationBabylonTransactionWithBtcProvider,
  getBtcProviderForECKey,
  ValueWithTypeUrl,
} from '../../../src/babylon';

import { getXOnlyPubkey } from './key.utils';

type Result = {
  unsignedDelegationMsg: ValueWithTypeUrl<babylonProtobuf.btcstakingtx.MsgCreateBTCDelegation>;
  stakingTx: bitcoinjslib.Transaction;
};

export async function getBitGoUtxoStakingMsgCreateBtcDelegation(
  network: bitcoinjslib.Network,
  stakerKey: ECPairInterface,
  finalityProvider: ECPairInterface,
  descriptorBuilder: BabylonDescriptorBuilder,
  stakingParams: vendor.VersionedStakingParams[],
  changeAddress: string,
  amount: number,
  utxo: vendor.UTXO,
  feeRateSatB: number,
  blockHeight: number
): Promise<Result> {
  return await createUnsignedPreStakeRegistrationBabylonTransactionWithBtcProvider(
    getBtcProviderForECKey(descriptorBuilder, stakerKey),
    network,
    {
      address: changeAddress,
      publicKeyNoCoordHex: getXOnlyPubkey(stakerKey).toString('hex'),
    },
    {
      finalityProviderPkNoCoordHex: getXOnlyPubkey(finalityProvider).toString('hex'),
      stakingAmountSat: amount,
      stakingTimelock: getBabylonParamByBtcHeight(blockHeight, stakingParams).minStakingTimeBlocks,
    },
    800_000,
    [utxo],
    feeRateSatB,
    toBech32(Buffer.from('test'), 0, 'bbn'),
    stakingParams
  );
}

export async function getVendorMsgCreateBtcDelegation(
  network: bitcoinjslib.Network,
  stakerKey: ECPairInterface,
  finalityProvider: ECPairInterface,
  descriptorBuilder: BabylonDescriptorBuilder,
  stakingParams: vendor.VersionedStakingParams[],
  changeAddress: string,
  amount: number,
  utxo: vendor.UTXO,
  feeRateSatB: number,
  blockHeight: number
): Promise<Result> {
  const babylonProvider: vendor.BabylonProvider = {
    async signTransaction(signingStep, msg) {
      // return unsigned payload
      return babylonProtobuf.btcstakingtx.MsgCreateBTCDelegation.encode(
        msg.value as babylonProtobuf.btcstakingtx.MsgCreateBTCDelegation
      ).finish();
    },
  };
  const manager = new vendor.BabylonBtcStakingManager(
    network,
    stakingParams,
    getBtcProviderForECKey(descriptorBuilder, stakerKey),
    babylonProvider
  );

  const result = await manager.preStakeRegistrationBabylonTransaction(
    {
      address: changeAddress,
      publicKeyNoCoordHex: getXOnlyPubkey(stakerKey).toString('hex'),
    },
    {
      finalityProviderPkNoCoordHex: getXOnlyPubkey(finalityProvider).toString('hex'),
      stakingAmountSat: amount,
      stakingTimelock: getBabylonParamByBtcHeight(blockHeight, stakingParams).minStakingTimeBlocks,
    },
    blockHeight,
    [utxo],
    feeRateSatB,
    toBech32(Buffer.from('test'), 0, 'bbn')
  );

  return {
    unsignedDelegationMsg: {
      typeUrl: '/babylon.btcstaking.v1.MsgCreateBTCDelegation',
      value: babylonProtobuf.btcstakingtx.MsgCreateBTCDelegation.decode(result.signedBabylonTx),
    },
    stakingTx: result.stakingTx,
  };
}
