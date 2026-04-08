import { selectWallet } from '../../util/bitGoInstance';
import type { HandlerContext } from '../../util/context';
import { store } from '../../util/store';

export async function handleChangePassphrase(ctx: HandlerContext): Promise<void> {
  if (!store.bitgo || !store.coin) {
    throw new Error('BitGo not initialized');
  }

  const flags = ctx.flags as Record<string, unknown>;
  const wallet = await selectWallet(store.bitgo, store.coin, flags);
  const oldPassword = flags.old as string;
  const newPassword = flags.new as string;

  const userKeychain = await wallet.getEncryptedUserKeychain();
  const updatedKeychain = store.coin.keychains().updateSingleKeychainPassword({
    keychain: userKeychain,
    oldPassword,
    newPassword,
  });

  await store.bitgo
    .put(store.coin.url(`/key/${updatedKeychain.id}`))
    .send({ encryptedPrv: updatedKeychain.encryptedPrv })
    .result();

  console.log('Passphrase changed successfully');
}
