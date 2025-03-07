import assert from 'assert';

import * as vendor from '@bitgo/babylonlabs-io-btc-staking-ts';
import * as babylonProtobuf from '@babylonlabs-io/babylon-proto-ts';
import * as bitcoinjslib from 'bitcoinjs-lib';
import { ECPairInterface } from '@bitgo/utxo-lib';
import { Descriptor } from '@bitgo/wasm-miniscript';
import { toWrappedPsbt } from '@bitgo/utxo-core/descriptor';

import { BabylonDescriptorBuilder } from './descriptor';

export type ValueWithTypeUrl<T> = { typeUrl: string; value: T };

export function getSignedPsbt(
  psbt: bitcoinjslib.Psbt,
  descriptor: Descriptor,
  signers: ECPairInterface[],
  { finalize = false }
): bitcoinjslib.Psbt {
  const wrappedPsbt = toWrappedPsbt(psbt.toBuffer());
  const signedInputs = psbt.data.inputs.flatMap((input, i) => {
    assert(input.witnessUtxo);
    if (Buffer.from(descriptor.scriptPubkey()).equals(input.witnessUtxo.script)) {
      wrappedPsbt.updateInputWithDescriptor(i, descriptor);
      const signResults = signers.map((signer) => {
        assert(signer.privateKey);
        return wrappedPsbt.signWithPrv(signer.privateKey);
      });
      return [[i, signResults]];
    }
    return [];
  });
  assert(signedInputs.length > 0);
  if (finalize) {
    wrappedPsbt.finalize();
  }
  return bitcoinjslib.Psbt.fromBuffer(Buffer.from(wrappedPsbt.serialize()));
}

export function getBtcProviderForECKey(
  descriptorBuilder: BabylonDescriptorBuilder,
  stakerKey: ECPairInterface
): vendor.BtcProvider {
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

  return {
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
}

/*
 * This is mostly lifted from
 * https://github.com/babylonlabs-io/btc-staking-ts/blob/v0.4.0-rc.2/src/staking/manager.ts#L100-L172
 *
 * The difference is that here we are returning an _unsigned_ delegation message.
 */
export async function createUnsignedPreStakeRegistrationBabylonTransaction(
  manager: vendor.BabylonBtcStakingManager,
  stakingParams: vendor.VersionedStakingParams[],
  network: bitcoinjslib.Network,
  stakerBtcInfo: vendor.StakerInfo,
  stakingInput: vendor.StakingInputs,
  babylonBtcTipHeight: number,
  inputUTXOs: vendor.UTXO[],
  feeRate: number,
  babylonAddress: string
): Promise<{
  unsignedDelegationMsg: ValueWithTypeUrl<babylonProtobuf.btcstakingtx.MsgCreateBTCDelegation>;
  stakingTx: bitcoinjslib.Transaction;
}> {
  if (babylonBtcTipHeight === 0) {
    throw new Error('Babylon BTC tip height cannot be 0');
  }
  if (inputUTXOs.length === 0) {
    throw new Error('No input UTXOs provided');
  }
  if (!vendor.isValidBabylonAddress(babylonAddress)) {
    throw new Error('Invalid Babylon address');
  }

  // Get the Babylon params based on the BTC tip height from Babylon chain
  const params = vendor.getBabylonParamByBtcHeight(babylonBtcTipHeight, stakingParams);

  const staking = new vendor.Staking(
    network,
    stakerBtcInfo,
    params,
    stakingInput.finalityProviderPkNoCoordHex,
    stakingInput.stakingTimelock
  );

  // Create unsigned staking transaction
  const { transaction } = staking.createStakingTransaction(stakingInput.stakingAmountSat, inputUTXOs, feeRate);

  // Create delegation message without including inclusion proof
  const msg = await manager.createBtcDelegationMsg(
    staking,
    stakingInput,
    transaction,
    babylonAddress,
    stakerBtcInfo,
    params
  );
  return {
    unsignedDelegationMsg: msg,
    stakingTx: transaction,
  };
}
