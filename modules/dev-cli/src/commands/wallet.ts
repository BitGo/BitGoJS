import { CommandModule } from 'yargs';
import { getConfig, validateWalletId } from '../config';
import { getBitGoInstance, unlockIfNeeded } from '../bitgo-client';
import { logSuccess, logError, logInfo, logJSON } from '../utils';

export const walletCommand: CommandModule = {
  command: 'wallet <action>',
  describe: 'Wallet operations',
  builder: (yargs) => {
    return yargs
      .positional('action', {
        describe: 'Action to perform',
        choices: ['info', 'create'],
        demandOption: true,
      })
      .option('label', {
        describe: 'Wallet label (for create)',
        type: 'string',
      })
      .option('multisig-type', {
        describe: 'Multisig type (onchain or tss)',
        type: 'string',
        choices: ['onchain', 'tss'],
      });
  },
  handler: async (argv: any) => {
    try {
      const config = getConfig();
      const bitgo = await getBitGoInstance(config);

      if (argv.action === 'info') {
        const walletId = validateWalletId(config);
        logInfo(`Getting info for wallet ${walletId}...`);

        const wallet = await bitgo.coin(config.coin).wallets().get({ id: walletId });
        const walletData = wallet.toJSON();

        console.log('\n' + '─'.repeat(50));
        logJSON(walletData);
        console.log('─'.repeat(50) + '\n');

        logSuccess('Wallet info retrieved successfully');
      } else if (argv.action === 'create') {
        if (!config.walletPassphrase) {
          throw new Error('BITGO_WALLET_PASSPHRASE is required for wallet creation');
        }

        await unlockIfNeeded(bitgo, config);

        const label = argv.label || `Test ${config.coin} Wallet - ${Date.now()}`;

        logInfo(`Creating wallet: ${label}...`);

        const walletOptions: any = {
          label,
          passphrase: config.walletPassphrase,
        };

        if (config.enterpriseId) {
          walletOptions.enterprise = config.enterpriseId;
        }

        if (argv.multisigType) {
          walletOptions.multisigType = argv.multisigType;
        }

        const wallet = await bitgo.coin(config.coin).wallets().generateWallet(walletOptions);

        console.log('\n' + '─'.repeat(50));
        console.log(`Wallet ID: ${wallet.wallet.id()}`);

        if (wallet.wallet.receiveAddress) {
          console.log(`Receive Address: ${wallet.wallet.receiveAddress()}`);
        } else if (wallet.wallet.coinSpecific()?.rootAddress) {
          console.log(`Root Address: ${wallet.wallet.coinSpecific().rootAddress}`);
        }

        console.log('\n⚠️  BACK THIS UP:');
        console.log(`User keychain encrypted xPrv: ${wallet.userKeychain.encryptedPrv}`);
        console.log('─'.repeat(50) + '\n');

        logSuccess('Wallet created successfully');
      }
    } catch (error) {
      logError(`Failed to perform wallet operation: ${error.message}`);
      process.exit(1);
    }
  },
};
