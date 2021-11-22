/**
 * @prettier
 */
import * as bip32 from 'bip32';
import * as utxolib from '@bitgo/utxo-lib';

import { Triple } from '../../keychains';
import { WalletUnspent } from './unspent';

export function deriveKey(k: bip32.BIP32Interface, chain: number, index: number): bip32.BIP32Interface {
  return k.derivePath(`0/0/${chain}/${index}`);
}

export function derivePubkeys(keychain: Triple<bip32.BIP32Interface>, chain: number, index: number): Triple<Buffer> {
  return keychain.map((k) => deriveKey(k, chain, index).publicKey) as Triple<Buffer>;
}

export class WalletUnspentSigner {
  constructor(
    public walletKeys: Triple<bip32.BIP32Interface>,
    public signer: bip32.BIP32Interface,
    public cosigner: bip32.BIP32Interface
  ) {
    if (!walletKeys.some((k) => WalletUnspentSigner.eqPublicKey(k, signer))) {
      throw new Error(`signer not part of walletKeys`);
    }
    if (!walletKeys.some((k) => WalletUnspentSigner.eqPublicKey(k, cosigner))) {
      throw new Error(`cosigner not part of walletKeys`);
    }
    if (WalletUnspentSigner.eqPublicKey(signer, cosigner)) {
      throw new Error(`signer must not equal cosigner`);
    }
    if (signer.isNeutered()) {
      throw new Error(`signer must have private key`);
    }
  }

  static eqPublicKey(a: bip32.BIP32Interface, b: bip32.BIP32Interface): boolean {
    return a.publicKey.equals(b.publicKey);
  }

  derive(chain: number, index: number): WalletUnspentSigner {
    return new WalletUnspentSigner(
      this.walletKeys.map((k) => deriveKey(k, chain, index)) as Triple<bip32.BIP32Interface>,
      deriveKey(this.signer, chain, index),
      deriveKey(this.cosigner, chain, index)
    );
  }

  publicKeys(): Triple<Buffer> {
    return this.walletKeys.map((k) => k.publicKey) as Triple<Buffer>;
  }
}

export function signWalletTransactionWithUnspent(
  txBuilder: utxolib.bitgo.UtxoTransactionBuilder,
  inputIndex: number,
  unspent: WalletUnspent,
  walletSigner: WalletUnspentSigner
): void {
  const walletUnspentSigner = walletSigner.derive(unspent.chain, unspent.index);
  const publicKeys = walletUnspentSigner.publicKeys();
  const scriptType = utxolib.bitgo.outputScripts.scriptTypeForChain(unspent.chain);
  const pubScript = utxolib.bitgo.outputScripts.createOutputScript2of3(publicKeys, scriptType).scriptPubKey;
  const pubScriptExpected = utxolib.address.toOutputScript(unspent.address, txBuilder.network as utxolib.Network);
  if (!pubScript.equals(pubScriptExpected)) {
    throw new Error(
      `pubscript mismatch: expected ${pubScriptExpected.toString('hex')} got ${pubScript.toString('hex')}`
    );
  }
  utxolib.bitgo.signInput2Of3(
    txBuilder,
    inputIndex,
    scriptType,
    publicKeys,
    walletUnspentSigner.signer,
    walletUnspentSigner.cosigner.publicKey,
    unspent.value
  );
}
