import assert from 'assert';

import * as bitcoinjslib from 'bitcoinjs-lib';
import { Descriptor } from '@bitgo/wasm-miniscript';
import { ECPairInterface } from '@bitgo/utxo-lib';
import * as vendor from '@bitgo/babylonlabs-io-btc-staking-ts';
import * as babylonProtobuf from '@babylonlabs-io/babylon-proto-ts';
import { toBech32 } from 'bitcoinjs-lib/src/address';

import { BabylonDescriptorBuilder } from '../../../src/babylon';

import { getSignedPsbt } from './transaction.utils';
import { getXOnlyPubkey } from './key.utils';

export async function getVendorMsgCreateBtcDelegation(
  stakerKey: ECPairInterface,
  finalityProvider: ECPairInterface,
  descriptorBuilder: BabylonDescriptorBuilder,
  stakingParams: vendor.VersionedStakingParams,
  changeAddress: string,
  amount: number,
  utxo: vendor.UTXO,
  feeRateSatB: number
): Promise<{
  msg: babylonProtobuf.btcstakingtx.MsgCreateBTCDelegation;
  msgBytes: Uint8Array;
  stakingTx: bitcoinjslib.Transaction;
}> {
  function signWithDescriptor(
    psbt: bitcoinjslib.Psbt,
    descriptor: Descriptor,
    key: ECPairInterface
  ): bitcoinjslib.Psbt {
    psbt = getSignedPsbt(psbt, descriptor, [key], { finalize: false });
    // BUG: we need to blindly finalize here even though we have not fully signed
    psbt.finalizeAllInputs();
    return psbt;
  }

  const btcProvider: vendor.BtcProvider = {
    async signMessage(signingStep: vendor.SigningStep, message: string, type: 'ecdsa'): Promise<string> {
      assert(type === 'ecdsa');
      switch (signingStep) {
        case 'proof-of-possession':
          return stakerKey.sign(Buffer.from(message, 'hex')).toString('hex');
        default:
          throw new Error(`unexpected signing step: ${signingStep}`);
      }
    },
    async signPsbt(signingStep: vendor.SigningStep, psbtHex: string): Promise<string> {
      const psbt = bitcoinjslib.Psbt.fromHex(psbtHex);
      switch (signingStep) {
        case 'staking-slashing':
          return signWithDescriptor(psbt, descriptorBuilder.getStakingDescriptor(), stakerKey).toHex();
        case 'unbonding-slashing':
          return signWithDescriptor(psbt, descriptorBuilder.getUnbondingDescriptor(), stakerKey).toHex();
        default:
          throw new Error(`unexpected signing step: ${signingStep}`);
      }
    },
  };
  const babylonProvider: vendor.BabylonProvider = {
    async signTransaction(signingStep, msg) {
      // return unsigned payload
      return babylonProtobuf.btcstakingtx.MsgCreateBTCDelegation.encode(
        msg.value as babylonProtobuf.btcstakingtx.MsgCreateBTCDelegation
      ).finish();
    },
  };
  const manager = new vendor.BabylonBtcStakingManager(
    bitcoinjslib.networks.bitcoin,
    [stakingParams],
    btcProvider,
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
      stakingTimelock: stakingParams.minStakingTimeBlocks,
    },
    800_000,
    [utxo],
    feeRateSatB,
    toBech32(Buffer.from('test'), 0, 'bbn')
  );

  const msg = babylonProtobuf.btcstakingtx.MsgCreateBTCDelegation.decode(result.signedBabylonTx);

  return {
    msg,
    msgBytes: result.signedBabylonTx,
    stakingTx: result.stakingTx,
  };
}
