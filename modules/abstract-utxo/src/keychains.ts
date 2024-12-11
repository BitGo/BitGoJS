import { AbstractUtxoCoin } from './abstractUtxoCoin';
import { IRequestTracer, IWallet, Keychain, KeyIndices, promiseProps, Triple } from '@bitgo/sdk-core';

export type NamedKeychains = {
  user?: Keychain;
  backup?: Keychain;
  bitgo?: Keychain;
};

export function toKeychainTriple(keychains: NamedKeychains): Triple<Keychain> {
  const { user, backup, bitgo } = keychains;
  if (!user || !backup || !bitgo) {
    throw new Error('keychains must include user, backup, and bitgo');
  }
  return [user, backup, bitgo];
}

export async function fetchKeychains(
  coin: AbstractUtxoCoin,
  wallet: IWallet,
  reqId?: IRequestTracer
): Promise<NamedKeychains> {
  return promiseProps({
    user: coin.keychains().get({ id: wallet.keyIds()[KeyIndices.USER], reqId }),
    backup: coin.keychains().get({ id: wallet.keyIds()[KeyIndices.BACKUP], reqId }),
    bitgo: coin.keychains().get({ id: wallet.keyIds()[KeyIndices.BITGO], reqId }),
  });
}
