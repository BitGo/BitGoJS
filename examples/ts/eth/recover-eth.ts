/**
 * Recover ETH from a multi-sig wallet
 *
 * This script demonstrates how to generate an unsigned recovery transaction for a
 * Multi-Sig ETH wallet.
 */

import { BitGo } from 'bitgo';
import { Hteth } from '@bitgo/sdk-coin-eth';

// Set up BitGo object
const bitgo = new BitGo({ env: 'test' }); // change to 'prod' for mainnet
bitgo.register('hteth', Hteth.createInstance);

async function recoverEth() {
  try {
    // Use the recovery with API key for output
    const recovery = (await (bitgo.coin('hteth') as Hteth).recover({
      userKey: 'user-public-key',
      backupKey: 'backup-public-key',
      walletContractAddress: 'Address-of-your-multisig-wallet',
      recoveryDestination: 'Address-To-Recover-Funds-To',
      isUnsignedSweep: true,
      apiKey: 'Add Your Etherscan ApiKey here',
    })) as any;

    // Print the recovery transaction hex
    console.log('Recovery transaction hex:');
    console.log(recovery.tx);

    // Print additional information
    console.log('\nFull recovery object:', JSON.stringify(recovery, null, 2));

    return recovery;
  } catch (e) {
    console.error('Error performing recovery:', e);
    throw e;
  }
}

// Execute the recovery function
recoverEth()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
