import { CommandModule } from 'yargs';
import { getConfig, validateWalletId } from '../config';
import { getBitGoInstance } from '../bitgo-client';
import { logSuccess, logError, logInfo, logJSON } from '../utils';

export const balanceCommand: CommandModule = {
  command: 'balance',
  describe: 'Get wallet balance',
  handler: async () => {
    try {
      const config = getConfig();
      const walletId = validateWalletId(config);

      logInfo(`Getting balance for wallet ${walletId} on ${config.coin}...`);

      const bitgo = await getBitGoInstance(config);
      const wallet = await bitgo.coin(config.coin).wallets().get({ id: walletId });

      console.log('\n' + '─'.repeat(50));
      console.log(`Wallet ID: ${wallet.id()}`);

      // Handle different coin types
      if (wallet.receiveAddress) {
        console.log(`Receive Address: ${wallet.receiveAddress()}`);
      } else if (wallet.coinSpecific && wallet.coinSpecific()?.rootAddress) {
        console.log(`Root Address: ${wallet.coinSpecific().rootAddress}`);
      }

      console.log(`Balance: ${wallet.balanceString()}`);
      console.log(`Confirmed Balance: ${wallet.confirmedBalanceString()}`);
      console.log(`Spendable Balance: ${wallet.spendableBalanceString()}`);
      console.log('─'.repeat(50) + '\n');

      logSuccess('Balance retrieved successfully');
    } catch (error) {
      logError(`Failed to get balance: ${error.message}`);
      process.exit(1);
    }
  },
};
