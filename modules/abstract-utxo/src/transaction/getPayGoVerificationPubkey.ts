import { isTestnetCoin, UtxoCoinName } from '../names';

const BITGOPAYGOATTESTATIONPUBKEY =
  'xpub6BKRgmCPX5oQiJgJ6Vq6BF8tDvZhwQki5dVVQohckK2ZJXtxj8K6M9pavLwt9piW33hZz17SWmG8QWsjJ1tHdde2Fs5UA3DFbApCtbdaGKn';

/**
 * We want to return the verification pubkey from our statics that has our
 * verification pubkey.
 * @param coinName
 * @returns
 */
export function getPayGoVerificationPubkey(coinName: UtxoCoinName): string | undefined {
  if (isTestnetCoin(coinName)) {
    return BITGOPAYGOATTESTATIONPUBKEY;
  } else {
    return undefined;
  }
}
