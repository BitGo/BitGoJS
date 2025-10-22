import { CommandModule } from 'yargs';
import { getConfig, validateWalletId } from '../config';
import { getBitGoInstance } from '../bitgo-client';
import { logSuccess, logError, logInfo, logJSON } from '../utils';

export const transfersCommand: CommandModule = {
  command: 'transfers',
  describe: 'List wallet transfers',
  builder: (yargs) => {
    return yargs
      .option('limit', {
        alias: 'l',
        describe: 'Number of transfers to retrieve',
        type: 'number',
        default: 10,
      })
      .option('all-tokens', {
        describe: 'Include all token transfers',
        type: 'boolean',
        default: false,
      });
  },
  handler: async (argv: any) => {
    try {
      const config = getConfig();
      const walletId = validateWalletId(config);

      logInfo(`Getting transfers for wallet ${walletId}...`);

      const bitgo = await getBitGoInstance(config);
      const walletOptions: any = { id: walletId };

      if (argv.allTokens) {
        walletOptions.allTokens = true;
      }

      const wallet = await bitgo.coin(config.coin).wallets().get(walletOptions);
      const transfers = await wallet.transfers({ limit: argv.limit });

      console.log('\n' + '─'.repeat(50));
      console.log(`Total transfers: ${transfers.transfers.length}`);
      console.log('─'.repeat(50) + '\n');

      logJSON(transfers.transfers);

      logSuccess('Transfers retrieved successfully');
    } catch (error) {
      logError(`Failed to get transfers: ${error.message}`);
      process.exit(1);
    }
  },
};
