import { CommandModule } from 'yargs';
import { getConfig, validateWalletId } from '../config';
import { getBitGoInstance, unlockIfNeeded } from '../bitgo-client';
import { logSuccess, logError, logInfo, logJSON } from '../utils';

export const sendCommand: CommandModule = {
  command: 'send',
  describe: 'Send a transaction (sendMany)',
  builder: (yargs) => {
    return yargs
      .option('to', {
        alias: 't',
        describe: 'Recipient address',
        type: 'string',
        demandOption: true,
      })
      .option('amount', {
        alias: 'a',
        describe: 'Amount to send (in base units)',
        type: 'string',
        demandOption: true,
      })
      .option('memo', {
        alias: 'm',
        describe: 'Transaction memo (if supported)',
        type: 'string',
      })
      .option('fee-rate', {
        describe: 'Fee rate (for UTXO coins)',
        type: 'number',
      })
      .option('confirm', {
        describe: 'Skip confirmation prompt',
        type: 'boolean',
        default: false,
      });
  },
  handler: async (argv: any) => {
    try {
      const config = getConfig();
      const walletId = validateWalletId(config);

      if (!config.walletPassphrase) {
        throw new Error('BITGO_WALLET_PASSPHRASE is required for sending transactions');
      }

      logInfo(`Preparing to send ${argv.amount} to ${argv.to}...`);

      if (!argv.confirm) {
        logInfo('Use --confirm to execute the transaction');
        return;
      }

      const bitgo = await getBitGoInstance(config);
      await unlockIfNeeded(bitgo, config);

      const wallet = await bitgo.coin(config.coin).wallets().get({ id: walletId });

      const sendOptions: any = {
        recipients: [
          {
            address: argv.to,
            amount: argv.amount,
          },
        ],
        walletPassphrase: config.walletPassphrase,
      };

      if (argv.memo) {
        sendOptions.memo = argv.memo;
      }

      if (argv.feeRate) {
        sendOptions.feeRate = argv.feeRate;
      }

      logInfo('Sending transaction...');
      const result = await wallet.sendMany(sendOptions);

      console.log('\n' + '─'.repeat(50));
      logJSON(result);
      console.log('─'.repeat(50) + '\n');

      logSuccess(`Transaction sent! TX ID: ${result.txid || result.transfer?.id || 'N/A'}`);
    } catch (error) {
      logError(`Failed to send transaction: ${error.message}`);
      process.exit(1);
    }
  },
};
