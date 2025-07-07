import * as utxolib from '@bitgo/utxo-lib';
import * as bitcoinMessage from 'bitcoinjs-message';
import { BIP32Interface } from '@bitgo/utxo-lib';
/**
 * bip32-aware wrapper around bitcoin-message package
 * @see {bitcoinMessage.sign}
 */
export function signMessage(
  message: string | Buffer,
  privateKey: BIP32Interface | Buffer,
  network: { messagePrefix: string }
): Buffer {
  if (!Buffer.isBuffer(privateKey)) {
    privateKey = privateKey.privateKey as Buffer;
    if (!privateKey) {
      throw new Error(`must provide privateKey`);
    }
  }
  if (network === null || typeof network !== 'object' || typeof network.messagePrefix !== 'string') {
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
  message: string | Buffer,
  publicKey: BIP32Interface | Buffer,
  signature: Buffer,
  network: { messagePrefix: string }
): boolean {
  if (!Buffer.isBuffer(publicKey)) {
    publicKey = publicKey.publicKey;
  }
  if (network === null || typeof network !== 'object' || typeof network.messagePrefix !== 'string') {
    throw new Error(`invalid argument 'network'`);
  }

  const address = utxolib.address.toBase58Check(
    utxolib.crypto.hash160(publicKey),
    utxolib.networks.bitcoin.pubKeyHash,
    utxolib.networks.bitcoin
  );
  return bitcoinMessage.verify(message, address, signature, network.messagePrefix);
}
