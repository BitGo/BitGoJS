import { CommandModule } from 'yargs';
import { getConfig, validateWalletId } from '../config';
import { getBitGoInstance, unlockIfNeeded } from '../bitgo-client';
import { logSuccess, logError, logInfo, logJSON } from '../utils';

export const addressCommand: CommandModule = {
  command: 'address <action>',
  describe: 'Address operations',
  builder: (yargs) => {
    return yargs
      .positional('action', {
        describe: 'Action to perform',
        choices: ['create', 'list'],
        demandOption: true,
      })
      .option('chain', {
        alias: 'c',
        describe: 'Address chain (for UTXO coins)',
        type: 'number',
        default: 10,
      })
      .option('limit', {
        alias: 'l',
        describe: 'Number of addresses to list',
        type: 'number',
      });
  },
  handler: async (argv: any) => {
    try {
      const config = getConfig();
      const walletId = validateWalletId(config);
      const bitgo = await getBitGoInstance(config);

      if (argv.action === 'create') {
        logInfo(`Creating new address for wallet ${walletId}...`);

        await unlockIfNeeded(bitgo, config);

        const wallet = await bitgo.coin(config.coin).wallets().get({ id: walletId });
        const addressOptions: any = {};

        // For UTXO coins, set chain
        if (argv.chain) {
          addressOptions.chain = argv.chain;
        }

        const address = await wallet.createAddress(addressOptions);

        console.log('\n' + '─'.repeat(50));
        logJSON(address);
        console.log('─'.repeat(50) + '\n');

        logSuccess('Address created successfully');
      } else if (argv.action === 'list') {
        logInfo(`Listing addresses for wallet ${walletId}...`);

        const wallet = await bitgo.coin(config.coin).wallets().get({ id: walletId });
        const addresses = await wallet.addresses();

        console.log('\n' + '─'.repeat(50));
        if (argv.limit) {
          logJSON(addresses.addresses.slice(0, argv.limit));
        } else {
          logJSON(addresses);
        }
        console.log('─'.repeat(50) + '\n');

        logSuccess('Addresses retrieved successfully');
      }
    } catch (error) {
      logError(`Failed to perform address operation: ${error.message}`);
      process.exit(1);
    }
  },
};
