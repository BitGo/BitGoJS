import { CommandModule } from 'yargs';
import { getConfig, validateWalletId } from '../config';
import { getBitGoInstance } from '../bitgo-client';
import { logSuccess, logError, logInfo, logJSON } from '../utils';

// Import lightning utilities
let getLightningWallet: any;
try {
  const lightningModule = require('@bitgo/abstract-lightning');
  getLightningWallet = lightningModule.getLightningWallet;
} catch (e) {
  // Lightning module not available
}

export const lightningCommand: CommandModule = {
  command: 'lightning <action>',
  describe: 'Lightning Network operations',
  builder: (yargs) => {
    return yargs
      .positional('action', {
        describe: 'Action to perform',
        choices: ['invoice', 'pay', 'list-payments', 'balance'],
        demandOption: true,
      })
      .option('amount', {
        alias: 'a',
        describe: 'Amount in millisatoshis',
        type: 'string',
      })
      .option('memo', {
        alias: 'm',
        describe: 'Invoice memo',
        type: 'string',
      })
      .option('expiry', {
        describe: 'Invoice expiry in seconds',
        type: 'number',
        default: 36000,
      })
      .option('invoice', {
        alias: 'i',
        describe: 'Lightning invoice string',
        type: 'string',
      });
  },
  handler: async (argv: any) => {
    try {
      if (!getLightningWallet) {
        throw new Error('@bitgo/abstract-lightning module not available. Install it to use lightning commands.');
      }

      const config = getConfig();
      const walletId = validateWalletId(config);
      const bitgo = await getBitGoInstance(config);

      const wallet = await bitgo.coin(config.coin).wallets().get({ id: walletId });
      const lightningWallet = getLightningWallet(wallet);

      // Helper to handle BigInt JSON serialization
      (BigInt.prototype as any).toJSON = function () {
        return this.toString();
      };

      if (argv.action === 'invoice') {
        if (!argv.amount) {
          throw new Error('--amount is required for creating an invoice');
        }

        logInfo(`Creating invoice for ${argv.amount} msat...`);

        const invoice = await lightningWallet.createInvoice({
          valueMsat: argv.amount,
          memo: argv.memo || 'BitGo Dev CLI',
          expiry: argv.expiry,
        });

        console.log('\n' + '─'.repeat(50));
        logJSON(invoice);
        console.log('─'.repeat(50) + '\n');

        logSuccess('Invoice created successfully');
      } else if (argv.action === 'pay') {
        if (!argv.invoice) {
          throw new Error('--invoice is required for payment');
        }

        if (!config.walletPassphrase) {
          throw new Error('BITGO_WALLET_PASSPHRASE is required for lightning payments');
        }

        logInfo('Paying invoice...');

        const paymentOptions: any = {
          invoice: argv.invoice,
          passphrase: config.walletPassphrase,
        };

        if (argv.amount) {
          paymentOptions.amountMsat = BigInt(argv.amount);
        }

        const payment = await lightningWallet.payInvoice(paymentOptions);

        console.log('\n' + '─'.repeat(50));
        logJSON(payment);
        console.log('─'.repeat(50) + '\n');

        logSuccess('Payment sent successfully');
      } else if (argv.action === 'list-payments') {
        logInfo('Listing payments...');

        const payments = await lightningWallet.listPayments({});

        console.log('\n' + '─'.repeat(50));
        logJSON(payments);
        console.log('─'.repeat(50) + '\n');

        logSuccess('Payments retrieved successfully');
      } else if (argv.action === 'balance') {
        logInfo('Getting lightning balance...');

        console.log('\n' + '─'.repeat(50));
        logJSON(wallet.toJSON());
        console.log('─'.repeat(50) + '\n');

        logSuccess('Balance retrieved successfully');
      }
    } catch (error) {
      logError(`Failed to perform lightning operation: ${error.message}`);
      process.exit(1);
    }
  },
};
