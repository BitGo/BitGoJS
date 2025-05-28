/**
 * Tron wallets can't send funds from their receive addresses.
 * Account balance consolidation is used to sweep funds from the
 * receive addresses into the wallet's base address for sending.
 * This script uses BitGo Express (local proxy server) instead of the SDK directly.
 * @see {@link https://app.bitgo.com/docs/#operation/v2.wallet.consolidateaccount.build}
 */
import axios from 'axios';

// TODO: set your BitGo Express server URL (default is http://localhost:3080)
const BITGO_EXPRESS_URL = 'http://localhost:3080';

// TODO: change to 'production' for mainnet
const env = 'staging';

// TODO: change to 'trx' for mainnet
const coin = 'ttrx';

// TODO: set your wallet id
const walletId = '68355ecd7effc38ded68e8e7b4647c23';

// TODO: set your wallet passphrase
const walletPassphrase = 'RF!K1suz6h45Rkia(cp0';

// TODO: set OTP code
const otp = '000000';

// TODO: set your access token here
// You can get this from User Settings > Developer Options > Add Access Token
const accessToken = 'v2x0d947c90444c311cf81c7692b88ac6767c349e44f47b6e854f7a8d9594487b43';

// HTTP request options with authorization
const requestOptions = {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
};

interface WalletInfo {
  id: string;
  coin: string;
  confirmedBalanceString: string;
  spendableBalanceString: string;
  coinSpecific?: {
    rootAddress?: string;
  };
}

interface ConsolidationTx {
  txHex: string;
  txInfo: any;
  feeInfo: any;
}

async function getWalletInfo(): Promise<WalletInfo> {
  const url = `${BITGO_EXPRESS_URL}/api/v2/${coin}/wallet/${walletId}`;
  console.log(url);
  try {
    const response = await axios.get(url, requestOptions);
    return response.data;
  } catch (error) {
    console.error('Error getting wallet info:', error.response?.data || error.message);
    throw error;
  }
}

async function buildAccountConsolidations(): Promise<ConsolidationTx[]> {
  const url = `${BITGO_EXPRESS_URL}/api/v2/${coin}/wallet/${walletId}/consolidateAccount/build`;
  console.log(url);
  
  try {
    const response = await axios.post(url, {}, requestOptions);
    return response.data;
  } catch (error) {
    console.error('Error building consolidation transactions:', error.response?.data || error.message);
    throw error;
  }
}

async function unlockSession(): Promise<boolean> {
  const url = `${BITGO_EXPRESS_URL}/api/v2/user/unlock`;
  const unlockData = {
    otp: otp,
    duration: 3600
  };
  
  try {
    const response = await axios.post(url, unlockData, requestOptions);
    return response.data.session?.unlock?.expires ? true : false;
  } catch (error) {
    console.error('Error unlocking session:', error.response?.data || error.message);
    throw error;
  }
}

async function sendAccountConsolidation(prebuildTx: ConsolidationTx): Promise<any> {
  const url = `${BITGO_EXPRESS_URL}/api/v2/${coin}/wallet/${walletId}/tx/send`;
  const sendData = {
    walletPassphrase: walletPassphrase,
    txPrebuild: prebuildTx,
    type: 'consolidate'
  };
  
  try {
    const response = await axios.post(url, sendData, requestOptions);
    return response.data;
  } catch (error) {
    console.error('Error sending consolidation transaction:', error.response?.data || error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('Starting Tron account consolidation via BitGo Express...');
    console.log(`BitGo Express URL: ${BITGO_EXPRESS_URL}`);
    console.log(`Environment: ${env}`);
    console.log(`Coin: ${coin}`);
    console.log(`Wallet ID: ${walletId}`);
    console.log('');

    const unlockUrl = `${BITGO_EXPRESS_URL}/api/v2/user/unlock`;
    const unlockData = {
      duration: 3600,
      otp: '000000',
    };
    await axios.post(unlockUrl, unlockData, requestOptions);

    // Get wallet information
    // console.log('Getting wallet information...');
    // const walletInfo = await getWalletInfo();
    
    // // Display wallet information
    // console.log('Wallet Information:');
    // console.log('Root Address:', walletInfo.coinSpecific?.rootAddress || 'N/A');
    // console.log('Confirmed Balance:', walletInfo.confirmedBalanceString);
    // console.log('Spendable Balance:', walletInfo.spendableBalanceString);
    // console.log('');

    // Build consolidation transactions
    console.log('Building account consolidation transactions...');
    const consolidationTxes = await buildAccountConsolidations();
    console.log(`Found ${consolidationTxes.length} consolidation transactions to process`);
    
    if (consolidationTxes.length === 0) {
      console.log('No consolidation transactions needed. All funds are already in the base address.');
      return;
    }

    // Display consolidation transaction details
    console.log('Consolidation transactions:');
    consolidationTxes.forEach((tx, index) => {
      console.log(`Transaction ${index + 1}:`);
      console.dir(tx, { depth: 6 });
      console.log('');
    });

    // Unlock session
    console.log('Unlocking session with OTP...');
    const unlocked = await unlockSession();
    if (!unlocked) {
      throw new Error('Failed to unlock session');
    }
    console.log('Session unlocked successfully');
    console.log('');

    // Send consolidation transactions
    console.log('Sending consolidation transactions...');
    for (let i = 0; i < consolidationTxes.length; i++) {
      const unsignedConsolidation = consolidationTxes[i];
      console.log(`Sending consolidation transaction ${i + 1}/${consolidationTxes.length}...`);
      
      try {
        const result = await sendAccountConsolidation(unsignedConsolidation);
        console.log(`Transaction ${i + 1} sent successfully:`);
        console.log(`TXID: ${result.txid}`);
        console.log(`Status: ${result.status}`);
        console.dir(result, { depth: 6 });
        console.log('');
      } catch (error) {
        console.error(`Failed to send consolidation transaction ${i + 1}:`, error.message);
        // Continue with next transaction instead of stopping
        continue;
      }
    }

    console.log('Account consolidation process completed!');

  } catch (error) {
    console.error('Account consolidation failed:', error.message);
    if (error.response?.data) {
      console.error('Error details:', error.response.data);
    }
  }
}

main().catch((e) => console.error('Unhandled error:', e));
