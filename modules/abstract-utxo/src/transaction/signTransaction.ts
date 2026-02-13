import _ from 'lodash';
import { BitGoBase } from '@bitgo/sdk-core';
import { BIP32, fixedScriptWallet } from '@bitgo/wasm-utxo';
import buildDebug from 'debug';

import { AbstractUtxoCoin, SignTransactionOptions } from '../abstractUtxoCoin';
import { getDescriptorMapFromWallet, getPolicyForEnv, isDescriptorWallet } from '../descriptor';
import { fetchKeychains, toBip32Triple } from '../keychains';
import { isUtxoLibPsbt, toWasmPsbt } from '../wasmUtil';

import * as fixedScript from './fixedScript';
import * as descriptor from './descriptor';
import { decodePsbtWith, encodeTransaction } from './decode';

const debug = buildDebug('bitgo:abstract-utxo:transaction:signTransaction');

function getSignerKeychain(userPrv: unknown): BIP32 | undefined {
  if (userPrv === undefined) {
    return undefined;
  }
  if (typeof userPrv !== 'string') {
    throw new Error('expected user private key to be a string');
  }
  const signerKeychain = BIP32.fromBase58(userPrv);
  if (signerKeychain.isNeutered()) {
    throw new Error('expected user private key but received public key');
  }
  debug(`Here is the public key of the xprv you used to sign: ${signerKeychain.neutered().toBase58()}`);
  return signerKeychain;
}

export async function signTransaction<TNumber extends number | bigint>(
  coin: AbstractUtxoCoin,
  bitgo: BitGoBase,
  params: SignTransactionOptions<TNumber>
): Promise<{ txHex: string }> {
  const txPrebuild = params.txPrebuild;

  if (_.isUndefined(txPrebuild) || !_.isObject(txPrebuild)) {
    if (!_.isUndefined(txPrebuild) && !_.isObject(txPrebuild)) {
      throw new Error(`txPrebuild must be an object, got type ${typeof txPrebuild}`);
    }
    throw new Error('missing txPrebuild parameter');
  }

  let tx = coin.decodeTransactionFromPrebuild(params.txPrebuild);

  // When returnLegacyFormat is set, ensure we use wasm-utxo's BitGoPsbt so
  // getHalfSignedLegacyFormat() is available after signing.
  if (params.returnLegacyFormat && isUtxoLibPsbt(tx)) {
    tx = decodePsbtWith(tx.toBuffer(), coin.name, 'wasm-utxo');
  }

  const signerKeychain = getSignerKeychain(params.prv);

  const { wallet } = params;

  if (wallet && isDescriptorWallet(wallet)) {
    if (!signerKeychain) {
      throw new Error('missing signer');
    }
    if (!isUtxoLibPsbt(tx) && !(tx instanceof Uint8Array)) {
      throw new Error('descriptor wallets require PSBT format transactions');
    }
    const walletKeys = toBip32Triple(await fetchKeychains(coin, wallet));
    const descriptorMap = getDescriptorMapFromWallet(wallet, walletKeys, getPolicyForEnv(bitgo.env));
    const psbt = toWasmPsbt(tx);
    descriptor.signPsbt(psbt, descriptorMap, signerKeychain, {
      onUnknownInput: 'throw',
    });
    return { txHex: Buffer.from(psbt.serialize()).toString('hex') };
  } else {
    const signedTx = await fixedScript.signTransaction(coin, tx, getSignerKeychain(params.prv), coin.name, {
      walletId: params.txPrebuild.walletId,
      txInfo: params.txPrebuild.txInfo,
      isLastSignature: params.isLastSignature ?? false,
      signingStep: params.signingStep,
      allowNonSegwitSigningWithoutPrevTx: params.allowNonSegwitSigningWithoutPrevTx ?? false,
      pubs: params.pubs,
      cosignerPub: params.cosignerPub,
    });

    // Convert half-signed PSBT to legacy format when the caller explicitly requested txFormat: 'legacy'
    if (params.returnLegacyFormat && signedTx instanceof fixedScriptWallet.BitGoPsbt) {
      return { txHex: Buffer.from(signedTx.getHalfSignedLegacyFormat()).toString('hex') };
    }

    const buffer = Buffer.isBuffer(signedTx) ? signedTx : encodeTransaction(signedTx);
    return { txHex: buffer.toString('hex') };
  }
}
