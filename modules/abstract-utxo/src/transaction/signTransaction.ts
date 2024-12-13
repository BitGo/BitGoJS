import _ from 'lodash';
import { IWallet } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';
import { bip32 } from '@bitgo/utxo-lib';
import buildDebug from 'debug';

import { AbstractUtxoCoin, SignTransactionOptions } from '../abstractUtxoCoin';
import { isDescriptorWallet } from '../descriptor';
import * as fixedScript from './fixedScript';

const debug = buildDebug('bitgo:abstract-utxo:transaction:signTransaction');

function getSignerKeychain(userPrv: unknown): utxolib.BIP32Interface | undefined {
  if (userPrv === undefined) {
    return undefined;
  }
  if (typeof userPrv !== 'string') {
    throw new Error('expected user private key to be a string');
  }
  const signerKeychain = bip32.fromBase58(userPrv, utxolib.networks.bitcoin);
  if (signerKeychain.isNeutered()) {
    throw new Error('expected user private key but received public key');
  }
  debug(`Here is the public key of the xprv you used to sign: ${signerKeychain.neutered().toBase58()}`);
  return signerKeychain;
}

export async function signTransaction<TNumber extends number | bigint>(
  coin: AbstractUtxoCoin,
  params: SignTransactionOptions<TNumber>
): Promise<{ txHex: string }> {
  const txPrebuild = params.txPrebuild;

  if (_.isUndefined(txPrebuild) || !_.isObject(txPrebuild)) {
    if (!_.isUndefined(txPrebuild) && !_.isObject(txPrebuild)) {
      throw new Error(`txPrebuild must be an object, got type ${typeof txPrebuild}`);
    }
    throw new Error('missing txPrebuild parameter');
  }

  const tx = coin.decodeTransactionFromPrebuild(params.txPrebuild);

  if (params.wallet && isDescriptorWallet(params.wallet as IWallet)) {
    throw new Error('Descriptor wallets are not supported');
  } else {
    return fixedScript.signTransaction(coin, tx, getSignerKeychain(params.prv), {
      walletId: params.txPrebuild.walletId,
      txInfo: params.txPrebuild.txInfo,
      isLastSignature: params.isLastSignature ?? false,
      signingStep: params.signingStep,
      allowNonSegwitSigningWithoutPrevTx: params.allowNonSegwitSigningWithoutPrevTx ?? false,
      pubs: params.pubs,
      cosignerPub: params.cosignerPub,
    });
  }
}
