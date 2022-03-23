import * as utxolib from '@bitgo/utxo-lib';
import * as _ from 'lodash';
import * as bitcoinMessage from 'bitcoinjs-message';
import * as bip32 from 'bip32';
/**
 * bip32-aware wrapper around bitcoin-message package
 * @see {bitcoinMessage.sign}
 */
export function signMessage(
  message: string,
  privateKey: bip32.BIP32Interface | Buffer,
  network: { messagePrefix: string },
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
  publicKey: bip32.BIP32Interface | Buffer,
  signature: Buffer,
  network: { messagePrefix: string },
): boolean {
  if (!Buffer.isBuffer(publicKey)) {
    publicKey = publicKey.publicKey;
  }
  if (!_.isObject(network) || !_.isString(network.messagePrefix)) {
    throw new Error(`invalid argument 'network'`);
  }

  const address = utxolib.address.toBase58Check(utxolib.crypto.hash160(publicKey), utxolib.networks.bitcoin.pubKeyHash, utxolib.networks.bitcoin);
  return bitcoinMessage.verify(message, address, signature, network.messagePrefix);
}
