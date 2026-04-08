import { printJSON } from '../../util/output';
import { store } from '../../util/store';
import type { HandlerContext } from '../../util/context';

export async function handleList(ctx: HandlerContext): Promise<void> {
  if (!store.bitgo || !store.coin) {
    throw new Error('BitGo not initialized');
  }

  const result = await store.coin.wallets().list();
  printJSON(result.wallets.map((w) => ({ id: w.id(), label: w.label() })));
}
