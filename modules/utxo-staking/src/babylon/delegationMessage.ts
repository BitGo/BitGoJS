/**
 * https://github.com/babylonlabs-io/babylon/blob/v1.99.0-snapshot.250211/x/btcstaking/types/validate_parsed_message.go
 */
import assert from 'assert';

import * as vendor from '@bitgo/babylonlabs-io-btc-staking-ts';
import * as babylonProtobuf from '@babylonlabs-io/babylon-proto-ts';
import * as bitcoinjslib from 'bitcoinjs-lib';
import * as utxolib from '@bitgo/utxo-lib';
import { Descriptor } from '@bitgo/wasm-miniscript';
import { toXOnlyPublicKey } from '@bitgo/utxo-core';
import { toWrappedPsbt } from '@bitgo/utxo-core/descriptor';

import { BabylonDescriptorBuilder } from './descriptor';
import { createStakingManager } from './stakingManager';
import { getStakingParams } from './stakingParams';
import { BabylonNetworkLike, toBitcoinJsNetwork } from './network';

export type ValueWithTypeUrl<T> = { typeUrl: string; value: T };

export function getSignedPsbt(
  psbt: bitcoinjslib.Psbt,
  descriptor: Descriptor,
  signers: utxolib.ECPairInterface[],
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
  stakerKey: utxolib.ECPairInterface
): vendor.BtcProvider {
  function signWithDescriptor(
    psbt: bitcoinjslib.Psbt,
    descriptor: Descriptor,
    key: utxolib.ECPairInterface
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

type Result = {
  unsignedDelegationMsg: ValueWithTypeUrl<babylonProtobuf.btcstakingtx.MsgCreateBTCDelegation>;
  stakingTx: bitcoinjslib.Transaction;
};

/**
 * @param stakingKey - this is the single-sig key that is used for co-signing the staking output
 * @param changeAddress - this is unrelated to the staking key and is used for the change output
 */
export function toStakerInfo(
  stakingKey: utxolib.ECPairInterface | Buffer | string,
  changeAddress: string
): vendor.StakerInfo {
  if (typeof stakingKey === 'object' && 'publicKey' in stakingKey) {
    stakingKey = stakingKey.publicKey;
  }
  if (typeof stakingKey === 'string') {
    stakingKey = Buffer.from(stakingKey, 'hex');
  }
  return {
    publicKeyNoCoordHex: toXOnlyPublicKey(stakingKey).toString('hex'),
    address: changeAddress,
  };
}

export function createStaking(
  network: BabylonNetworkLike,
  blockHeight: number,
  stakerBtcInfo: vendor.StakerInfo,
  stakingInput: vendor.StakingInputs,
  versionedParams: vendor.VersionedStakingParams[] = getStakingParams(network)
): vendor.Staking {
  if (blockHeight === 0) {
    throw new Error('Babylon BTC tip height cannot be 0');
  }

  // Get the Babylon params based on the BTC tip height from Babylon chain
  const params = vendor.getBabylonParamByBtcHeight(blockHeight, versionedParams);

  return new vendor.Staking(
    toBitcoinJsNetwork(network),
    stakerBtcInfo,
    params,
    stakingInput.finalityProviderPkNoCoordHex,
    stakingInput.stakingTimelock
  );
}

type TransactionLike =
  | bitcoinjslib.Psbt
  | bitcoinjslib.Transaction
  | utxolib.Transaction
  | utxolib.bitgo.UtxoTransaction<bigint | number>
  | utxolib.Psbt
  | utxolib.bitgo.UtxoPsbt;

function toStakingTransactionFromPsbt(
  psbt: bitcoinjslib.Psbt | utxolib.Psbt | utxolib.bitgo.UtxoPsbt
): bitcoinjslib.Transaction {
  if (!(psbt instanceof utxolib.bitgo.UtxoPsbt)) {
    psbt = utxolib.bitgo.createPsbtFromBuffer(psbt.toBuffer(), utxolib.networks.bitcoin);
  }
  if (psbt instanceof utxolib.bitgo.UtxoPsbt) {
    // only utxolib.bitgo.UtxoPsbt has the getUnsignedTx method
    return bitcoinjslib.Transaction.fromHex(psbt.getUnsignedTx().toHex());
  }
  throw new Error('illegal state');
}

export function toStakingTransaction(tx: TransactionLike): bitcoinjslib.Transaction {
  if (tx instanceof bitcoinjslib.Psbt || tx instanceof utxolib.Psbt) {
    return toStakingTransactionFromPsbt(tx);
  }
  return bitcoinjslib.Transaction.fromHex(tx.toHex());
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
  feeRateSatB: number,
  babylonAddress: string
): Promise<Result> {
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
  const { transaction } = staking.createStakingTransaction(stakingInput.stakingAmountSat, inputUTXOs, feeRateSatB);

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

export async function createUnsignedPreStakeRegistrationBabylonTransactionWithBtcProvider(
  btcProvider: vendor.BtcProvider,
  network: bitcoinjslib.Network,
  stakerBtcInfo: vendor.StakerInfo,
  stakingInput: vendor.StakingInputs,
  babylonBtcTipHeight: number,
  inputUTXOs: vendor.UTXO[],
  feeRateSatB: number,
  babylonAddress: string,
  stakingParams: vendor.VersionedStakingParams[] = getStakingParams(network)
): Promise<Result> {
  const manager = createStakingManager(network, btcProvider, stakingParams);
  return await createUnsignedPreStakeRegistrationBabylonTransaction(
    manager,
    stakingParams,
    network,
    stakerBtcInfo,
    stakingInput,
    babylonBtcTipHeight,
    inputUTXOs,
    feeRateSatB,
    babylonAddress
  );
}
