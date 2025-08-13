import * as utxolib from '@bitgo/utxo-lib';

const BITGOPAYGOATTESTATIONPUBKEY =
  'xpub6BKRgmCPX5oQiJgJ6Vq6BF8tDvZhwQki5dVVQohckK2ZJXtxj8K6M9pavLwt9piW33hZz17SWmG8QWsjJ1tHdde2Fs5UA3DFbApCtbdaGKn';

/**
 * We want to return the verification pubkey from our statics that has our
 * verification pubkey.
 * @param network
 * @returns
 */
export function getPayGoVerificationPubkey(network: utxolib.Network): string | undefined {
  if (utxolib.isTestnet(network)) {
    return BITGOPAYGOATTESTATIONPUBKEY;
  } else if (utxolib.isMainnet(network)) {
    return undefined;
  }
}
