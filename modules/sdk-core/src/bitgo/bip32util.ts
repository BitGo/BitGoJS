import * as utxolib from '@bitgo/utxo-lib';
import * as _ from 'lodash';
import * as bitcoinMessage from 'bitcoinjs-message';
import { bip32, BIP32Interface } from '@bitgo/utxo-lib';
/**
 * bip32-aware wrapper around bitcoin-message package
 * @see {bitcoinMessage.sign}
 */
export function signMessage(
  message: string,
  privateKey: BIP32Interface | Buffer,
  network: { messagePrefix: string }
): Buffer {
  if (!Buffer.isBuffer(privateKey)) {
    privateKey = privateKey.privateKey as Buffer;
    if (!privateKey) {
      throw new Error(`must provide privateKey`);
    }
  }
  if (!_.isObject(network) || !_.isString(network.messagePrefix)) {
    throw new Error(`invalid argument 'network'`);
  }
  const compressed = true;
  return bitcoinMessage.sign(message, privateKey, compressed, network.messagePrefix);
}

/**
 * bip32-aware wrapper around bitcoin-message package
 * @see {bitcoinMessage.verify}
 */
export function verifyMessage(
  message: string,
  publicKey: BIP32Interface | Buffer,
  signature: Buffer,
  network: { messagePrefix: string }
): boolean {
  if (!Buffer.isBuffer(publicKey)) {
    publicKey = publicKey.publicKey;
  }
  if (!_.isObject(network) || !_.isString(network.messagePrefix)) {
    throw new Error(`invalid argument 'network'`);
  }

  const address = utxolib.address.toBase58Check(
    utxolib.crypto.hash160(publicKey),
    utxolib.networks.bitcoin.pubKeyHash,
    utxolib.networks.bitcoin
  );
  return bitcoinMessage.verify(message, address, signature, network.messagePrefix);
}

/**
 Verifies if a message was signed using the given ecdh key
 */
export function verifyEcdhSignature(message: string, signature: string, ecdhXpub: string): boolean {
  return bip32.fromBase58(ecdhXpub).verify(Buffer.from(message), Buffer.from(signature, 'hex'));
}
