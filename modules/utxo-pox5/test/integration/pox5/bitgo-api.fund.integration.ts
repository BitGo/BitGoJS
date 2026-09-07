import { redactBitGoError } from './bitgo-api';
import {
  authenticateBitGoApi,
  faucetFundWallet,
  loadBitGoApiIntegrationContext,
  selectRandomFundingWallet,
} from './bitgo-api.integration-support';

describe('BitGo API PoX-5 wallet funding integration', function () {
  it('lists or creates a wallet, faucets BTC to it, and waits for BitGo indexing', async function (this: Mocha.Context) {
    const context = loadBitGoApiIntegrationContext();
    const passphrase = process.env.BITGO_WALLET_PASSPHRASE;
    const secrets = [context.token, passphrase ?? ''];
    this.timeout(context.config.bitcoin.startupTimeoutMs * 2 + context.config.bitcoin.timeoutMs);

    try {
      await authenticateBitGoApi(context);
      const selected = await selectRandomFundingWallet(context, passphrase);
      console.log(
        `Funding ${context.coinName} wallet ${selected.summary.id} on ${context.environment} ` +
          `(${selected.listedWalletCount} listed, ${selected.eligibleWalletCount} eligible)`
      );
      const funded = await faucetFundWallet(context, selected.wallet);
      console.log(
        `BitGo indexed ${funded.txid} at ${funded.confirmation.blockHeight} (${funded.confirmation.blockHash}); ` +
          `${funded.amountSats} sats at ${funded.outpoint}`
      );
    } catch (error) {
      throw new Error(redactBitGoError(error, secrets));
    }
  });
});
