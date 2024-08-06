import { ECPairInterface } from 'ecpair';
import * as bs58check from 'bs58check';
import { Network } from '../networks';
import { bip32, ECPair } from '../noble_ecc';

/**
 * Create an ECPair from the raw private key bytes
 * @param {Buffer} buffer - Private key for the ECPair. Must be exactly 32 bytes.
 * @param {Object} [network] - Network for the ECPair. Defaults to bitcoin.
 * @return {ECPair}
 */
export function privateKeyBufferToECPair(buffer: Buffer, network?: Network): ECPairInterface {
  if (!Buffer.isBuffer(buffer) || buffer.length !== 32) {
    throw new Error('invalid private key buffer');
  }

  return ECPair.fromPrivateKey(buffer);
}

/**
 * Get the private key as a 32 bytes buffer. If it is smaller than 32 bytes, pad it with zeros
 * @param {ECPair} ecPair
 * @return Buffer 32 bytes
 */
export function privateKeyBufferFromECPair(ecPair: ECPairInterface): Buffer {
  if (ecPair.constructor.name !== 'ECPair') {
    throw new TypeError(`invalid argument ecpair`);
  }

  const privkey = ecPair.privateKey;
  if (!Buffer.isBuffer(privkey)) {
    throw new Error(`unexpected privkey type`);
  }
  if (privkey.length !== 32) {
    throw new Error(`unexpected privkey length`);
  }

  return privkey;
}

export function changeExtendedKeyNetwork(extendedKey: string, fromNetwork: Network, targetNetwork: Network): string {
  if (fromNetwork === targetNetwork) {
    return extendedKey;
  }

  const hdNode = bip32.fromBase58(extendedKey, fromNetwork);
  const data = bs58check.decode(extendedKey);
  const targetVersionBytes = Buffer.alloc(4);
  targetVersionBytes.writeUInt32BE(hdNode.isNeutered() ? targetNetwork.bip32.public : targetNetwork.bip32.private, 0);
  targetVersionBytes.copy(data, 0, 0, 4);
  return bs58check.encode(data);
}
