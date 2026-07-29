import { Wallet } from '../wallet';
import { KeychainWithEncryptedPrv } from '../keychain';

/**
 * Get the lightning auth key for the given purpose
 */
export async function getLightningAuthKey(
  wallet: Wallet,
  purpose: 'userAuth' | 'nodeAuth'
): Promise<KeychainWithEncryptedPrv> {
  if (wallet.baseCoin.getFamily() !== 'lnbtc') {
    throw new Error(`Invalid lightning coin family: ${wallet.baseCoin.getFamily()}`);
  }
  const authKeyIds = wallet.coinSpecific()?.keys;
  if (authKeyIds?.length !== 2) {
    throw new Error(`Invalid number of auth keys in lightning wallet: ${authKeyIds?.length}`);
  }
  const keychains = await Promise.all(authKeyIds.map((id) => wallet.baseCoin.keychains().get({ id })));
  const userAuthKeychain = keychains.find((v) => {
    const coinSpecific = v?.coinSpecific?.[wallet.baseCoin.getChain()];
    return (
      coinSpecific && typeof coinSpecific === 'object' && 'purpose' in coinSpecific && coinSpecific.purpose === purpose
    );
  });
  if (userAuthKeychain?.encryptedPrv) {
    return userAuthKeychain as KeychainWithEncryptedPrv;
  }
  throw new Error(`Missing lightning ${purpose} keychain with encrypted private key`);
}
