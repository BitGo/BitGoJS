import { AbstractUtxoCoin } from '@bitgo/abstract-utxo';
import { IWallet } from '@bitgo/sdk-core';
import { bip32, BIP32Interface } from '@bitgo/utxo-lib';

export async function getXprv(
  coin: AbstractUtxoCoin,
  wallet: IWallet,
  params: { walletPassphrase: string } | { xprv: string }
): Promise<BIP32Interface> {
  if ('xprv' in params) {
    return bip32.fromBase58(params.xprv);
  }

  if ('walletPassphrase' in params) {
    const userKey = await coin.keychains().get({ id: wallet.keyIds()[0] });
    const key = wallet.getUserPrv({ keychain: userKey, walletPassphrase: params.walletPassphrase });
    return bip32.fromBase58(key);
  }

  throw new Error('Invalid params');
}
