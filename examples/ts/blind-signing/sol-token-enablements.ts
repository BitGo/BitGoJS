import { BitGoAPI } from '@bitgo/sdk-api';
import { Transaction } from '@bitgo/sdk-coin-sol';
import { BaseCoin, BitGoBase, PrebuildTransactionResult, Wallet } from '@bitgo/sdk-core';
import { coins } from '@bitgo/statics';

const bitgo = new BitGoAPI({ env: 'test' });

// Configuration: change these values to run the example script
// const accessToken = 'v2xa2cf6160d8e30ea7892863c607411ca41c06d028036db4ef3cf4f8b2b091e472'; //'v2x70080e96706e2cfa83cf5e50dd27f5b91aa304b1dd7e01872ac3a4f85e2fa7d3'; // Your BitGo access token
// const walletId = '68bafee43eb5cd22aca2afd6b13ec7ad'; //'68a8ce3dea8237d5da85d1852e370901'; // Your TSOL wallet ID
// const walletRootAddress = '9tJNtvXWrtkD3NQaZY5nz8ZPc3s4ezRVX3oFfdfj5US6'; // Use wallet's root address or a dummy address
// const walletPassphrase = 'Ghghjkg!455544llll'; //'0L4L"5YV@*:q_Nsv'; // Your wallet passphrase

const accessToken = 'v2x70080e96706e2cfa83cf5e50dd27f5b91aa304b1dd7e01872ac3a4f85e2fa7d3'; // Your BitGo access token
const walletId = '68a8ce3dea8237d5da85d1852e370901'; // Your TSOL wallet ID
const walletRootAddress = '9tJNtvXWrtkD3NQaZY5nz8ZPc3s4ezRVX3oFfdfj5US6'; // Use wallet's root address or a dummy address
const walletPassphrase = '0L4L"5YV@*:q_Nsv'; // Your wallet passphrase
const enableTokens = [{ name: 'tsol:orca' }];

// Fake transaction data, we would expect an enabletoken but will send a transfer instead
const txSendPrebuildParams = {
  preview: false,
  recipients: [
    {
      address: walletRootAddress,
      amount: '10', // Small amount for testing
    },
  ],
  type: 'transfer',
  apiVersion: 'full',
};

async function main() {
  console.log('🔧 TSOL Token Enablement Test Script (with CoinFactory)');

  checkIfPropsAreSetOrExit();
  await testSendTokenEnablements();
}

function checkIfPropsAreSetOrExit() {
  if (!accessToken || !walletId || !walletPassphrase) {
    console.error('❌ Please set the following required parameters:');
    console.error('   - accessToken: Your BitGo access token');
    console.error('   - walletId: Your TSOL wallet ID');
    console.error('   - walletPassphrase: Your wallet passphrase');
    console.error('\nYou can get these from your BitGo account settings.');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

async function testSendTokenEnablements() {
  try {
    bitgo.authenticateWithAccessToken({ accessToken });
    console.log('Getting TSOL wallet using CoinFactory...');

    const { register } = await import('@bitgo/sdk-coin-sol');
    register(bitgo as unknown as BitGoBase);
    const tsolCoin = bitgo.coin('tsol');
    console.log(`✅ TSOL coin loaded: ${tsolCoin.getFullName()}`);

    const wallet = await tsolCoin.wallets().get({ id: walletId });
    logWalletData(wallet);

    console.log('3️⃣ Building token enablement transactions...');
    const buildParams = {
      enableTokens,
      walletPassphrase,
    };

    const unsignedBuilds = await wallet.buildTokenEnablements(buildParams);

    logUnsignedBuildTokenEnablement(unsignedBuilds);
    logRawTxHexData(tsolCoin, unsignedBuilds);

    // BLIND SIGNING simulation starts here
    console.log('Replacing hex with prebuilt transfer transaction...');
    const modifiedBuilds = await replaceTxHexWithSendTxPrebuild(wallet, unsignedBuilds);

    // Send token enablement transactions (they're transfers masked as the call in replaceHexWithTransferPrebuild)
    console.log('Sending token enablement transactions...');
    const results = {
      success: [] as any[],
      failure: [] as Error[],
    };

    for (let i = 0; i < modifiedBuilds.length; i++) {
      const modifiedBuild = modifiedBuilds[i];
      console.log(`   Processing transaction ${i + 1}/${modifiedBuilds.length}...`);

      try {
        const sendParams = {
          prebuildTx: modifiedBuild,
          walletPassphrase,
          apiVersion: 'full',
        } as any;

        const sendResult = await wallet.sendTokenEnablement(sendParams);
        results.success.push(sendResult);
        console.log(`   ✅ Transaction ${i + 1} sent successfully`);
        console.log(`      Result: ${JSON.stringify(sendResult, null, 2)}`);

        // TODO: not sure if this goes here, i'll check when I manage to do a token enablement try
        console.log(' You signed a non requested transfer masked as a token enablement! 💀');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.failure.push(error as Error);
        console.log(`   ❌ Transaction ${i + 1} failed: ${errorMessage}`);

        // TODO: not sure if this goes here, i'll check when I manage to do a token enablement try
        console.log(' You catched an attempt to sign a non requested transfer masked as a token enablement! 🎉');
      }
    }

    logTransactionResults(results);
    console.log('\n🎉 Test completed!');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

async function replaceTxHexWithSendTxPrebuild(wallet: any, unsignedBuilds: any[]): Promise<any[]> {
  console.log('🔄 Replacing hex with prebuilt transfer transaction...');

  try {
    console.log('Building prebuilt transfer transaction...');
    const sendTx = await wallet.prebuildTransaction(txSendPrebuildParams);
    console.log(`Prebuilt transfer transaction created:  Original hex length: ${sendTx.txHex?.length || 0} characters`);

    const modifiedBuilds = unsignedBuilds.map((build, index) => {
      const modifiedBuild = { ...build };
      if (sendTx.txHex) {
        modifiedBuild.txHex = sendTx.txHex;
        modifiedBuild.txRequestId = sendTx.txRequestId; // Preserve txRequestId if available
        console.log(`   Transaction ${index + 1}: Hex replaced with transfer transaction hex`);
      }
      return modifiedBuild;
    });

    console.log(`✅ Replaced hex in ${modifiedBuilds.length} transaction(s)`);
    return modifiedBuilds;
  } catch (error) {
    console.error('   ❌ Error creating prebuilt transfer transaction:', error);
    console.log('   Falling back to original unsigned builds without hex replacement.');
    return unsignedBuilds;
  }
}

function logUnsignedBuildTokenEnablement(unsignedBuilds: PrebuildTransactionResult[]) {
  console.log(`✅ Built ${unsignedBuilds.length} token enablement transaction(s)`);
  // Log details of each unsigned build
  unsignedBuilds.forEach((build, index) => {
    console.log(`   Transaction ${index + 1}:`);
    console.log(`     Wallet ID: ${build.walletId}`);
    console.log('Raw txHex: ');
    console.log(build.txHex);
    console.log(`     TX Hex length: ${build.txHex?.length || 0} characters`);
    console.log(`     Fee info: ${JSON.stringify(build.feeInfo)}`);
    console.log(`     Build params: ${JSON.stringify(build.buildParams)}`);
    if (build.txRequestId) {
      console.log(`     TX Request ID: ${build.txRequestId}`);
    }
  });
}

function logWalletData(wallet: Wallet) {
  console.log(`✅ Wallet retrieved: ${wallet.id()}`);
  console.log(`   Wallet label: ${wallet.label()}`);
  console.log(`   Wallet type: ${wallet.type()}`);
  console.log(`   Multisig type: ${wallet.multisigType()}`);
  console.log(`   Balance: ${wallet.balanceString()}`);
  console.log(`   Root address: ${wallet.coinSpecific()?.rootAddress}\n`);
}

function logTransactionResults(results: { success: any[]; failure: Error[] }) {
  console.log(`Final Results: SuccessTXs=> ${results.success.length}, FailedTXs=> ${results.failure.length}`);
  if (results.success.length > 0) {
    console.log('\n   Successful transaction details:');
    results.success.forEach((result, index) => {
      console.log(`     ${index + 1}. ${JSON.stringify(result, null, 4)}`);
    });
  }

  if (results.failure.length > 0) {
    console.log('\n   Failed transaction details:');
    results.failure.forEach((error, index) => {
      console.log(`     ${index + 1}. ${error.message}`);
      if (error.stack) {
        console.log(`        Stack: ${error.stack}`);
      }
    });
  }
}

function logRawTxHexData(coin: BaseCoin, unsignedBuilds: PrebuildTransactionResult[]) {
  const HEX_REGEX = /^[0-9a-fA-F]+$/;
  const coinConfig = coins.get(coin.getChain());

  unsignedBuilds.forEach((build, index) => {
    const transaction = new Transaction(coinConfig);
    const rawTx = build.txBase64 || build.txHex;

    let rawTxBase64 = rawTx;
    if (rawTx && HEX_REGEX.test(rawTx)) {
      rawTxBase64 = Buffer.from(rawTx, 'hex').toString('base64');

      transaction.fromRawTransaction(rawTxBase64);
      const explainedTx = transaction.explainTransaction();

      console.log('---------------------');
      console.log('Explained TX:', JSON.stringify(explainedTx, null, 4));
      console.log('---------------------');
    }
  });
}

if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  });
}
