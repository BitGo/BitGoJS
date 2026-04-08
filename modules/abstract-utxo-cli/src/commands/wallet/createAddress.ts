import { selectWallet } from '../../util/bitGoInstance';
import type { HandlerContext } from '../../util/context';
import { store } from '../../util/store';

export async function handleAddress(ctx: HandlerContext): Promise<void> {
  if (!store.bitgo || !store.coin) {
    throw new Error('BitGo not initialized');
  }

  const wallet = await selectWallet(store.bitgo, store.coin, ctx.flags as Record<string, unknown>);
  console.log(await wallet.createAddress());
}
