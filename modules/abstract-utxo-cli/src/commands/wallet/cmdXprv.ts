import { selectWallet } from '../../util/bitGoInstance';
import type { HandlerContext } from '../../util/context';
import { store } from '../../util/store';

export async function handleXprv(ctx: HandlerContext): Promise<void> {
  if (!store.bitgo || !store.coin) {
    throw new Error('BitGo not initialized');
  }

  const wallet = await selectWallet(store.bitgo, store.coin, ctx.flags as Record<string, unknown>);
  const userKey = await store.coin.keychains().get({ id: wallet.keyIds()[0] });
  const key = wallet.getUserPrv({
    keychain: userKey,
    walletPassphrase: ctx.flags.walletPassphrase as string,
  });
  console.log(key);
}
