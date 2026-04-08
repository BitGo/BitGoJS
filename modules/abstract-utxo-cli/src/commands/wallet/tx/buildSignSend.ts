import { selectWallet } from '../../../util/bitGoInstance';
import type { HandlerContext } from '../../../util/context';
import { store } from '../../../util/store';

export async function handleBuildSignSend(ctx: HandlerContext): Promise<void> {
  if (!store.bitgo || !store.coin) {
    throw new Error('BitGo not initialized');
  }

  const wallet = await selectWallet(store.bitgo, store.coin, ctx.flags as Record<string, unknown>);
  const flags = ctx.flags as Record<string, unknown>;

  let recipient = flags.recipient as string;
  const walletPassphrase = (flags.walletPassphrase as string) || 'setec astronomy';
  const amount = flags.amount as string;
  const feeRateSatB = parseInt(flags.feeRateSatB as string, 10) || 10;

  if (recipient === 'self') {
    recipient = (await wallet.createAddress()).address;
  }
  if (recipient.startsWith('wallet:')) {
    const label = recipient.slice('wallet:'.length);
    const recipientWallet = await selectWallet(store.bitgo, store.coin, { label });
    recipient = (await recipientWallet.createAddress()).address;
  }
  const recipients = [{ address: recipient, amount }];

  const otp = ctx.flags.otp as string | undefined;

  if (otp) {
    await store.bitgo.unlock({ otp });
  }

  await wallet.sendMany({
    minConfirms: 0,
    recipients,
    walletPassphrase,
    feeRate: feeRateSatB * 1000,
    txFormat: 'legacy',
    changeAddressType: 'p2wsh'
  });
}
