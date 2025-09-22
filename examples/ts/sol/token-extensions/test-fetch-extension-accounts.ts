import { PublicKey } from '@solana/web3.js';
import { NetworkType } from '@bitgo/statics';
import { fetchExtensionAccounts, getSolanaConnection } from '@bitgo/sdk-coin-sol/dist/src/lib/token2022Extensions';

const TEST_MINT_ADDRESS = '4MmJVdwYN8LwvbGeCowYjSx7KoEi6BJWg8XXnW4fDDp6';
const network = NetworkType.MAINNET;
/**
 * Test script to fetch extension accounts for a testnet token
 */
async function testFetchExtensionAccounts() {
  console.log('='.repeat(60));
  console.log('Testing fetchExtensionAccounts for Token-2022');
  console.log('='.repeat(60));
  console.log(`\nToken Mint Address: ${TEST_MINT_ADDRESS}`);
  console.log('Network: Solana Devnet (Testnet)\n');

  try {
    // Create a mock coin object to force testnet connection
    // First, let's verify the connection
    const connection = getSolanaConnection(network);
    console.log(`Connection URL: ${connection.rpcEndpoint}`);

    //Get latest blockhash to verify connection is working
    const { blockhash } = await connection.getLatestBlockhash();
    console.log(`✓ Connection established. Latest blockhash: ${blockhash.substring(0, 20)}...`);

    // Fetch mint account info directly to see if it exists
    console.log('\n--- Checking Mint Account ---');
    const mintPubkey = new PublicKey(TEST_MINT_ADDRESS);
    const mintAccount = await connection.getAccountInfo(mintPubkey);

    if (!mintAccount) {
      console.log('❌ Mint account not found on devnet');
      console.log("This might mean the token doesn't exist on devnet or has been closed.");
      return;
    }

    console.log(`✓ Mint account found`);
    console.log(`  Owner: ${mintAccount.owner.toBase58()}`);
    console.log(`  Data length: ${mintAccount.data.length} bytes`);
    console.log(`  Lamports: ${mintAccount.lamports}`);

    // Check if this is a Token-2022 mint (owned by Token-2022 program)
    const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
    if (!mintAccount.owner.equals(TOKEN_2022_PROGRAM_ID)) {
      console.log(`⚠️  Warning: This mint is owned by ${mintAccount.owner.toBase58()}`);
      console.log(`   Expected Token-2022 program: ${TOKEN_2022_PROGRAM_ID.toBase58()}`);
      console.log('   This might not be a Token-2022 token.');
    } else {
      console.log('✓ Confirmed Token-2022 token');
    }

    // Now call fetchExtensionAccounts
    console.log('\n--- Fetching Extension Accounts ---');
    const extensionAccounts = await fetchExtensionAccounts(TEST_MINT_ADDRESS, network);

    if (!extensionAccounts || extensionAccounts.length === 0) {
      console.log('No extension accounts found for this token.');
      console.log('This token might not have any extensions enabled.');
    } else {
      console.log(`\n✓ Found ${extensionAccounts.length} extension account(s):\n`);

      extensionAccounts.forEach((account, index) => {
        console.log(`Extension Account ${index + 1}:`);
        console.log(`  Pubkey: ${account.pubkey.toBase58()}`);
        console.log(`  Is Signer: ${account.isSigner}`);
        console.log(`  Is Writable: ${account.isWritable}`);
        console.log('');
      });
    }

    console.log('='.repeat(60));
    console.log('Test completed successfully!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ Error occurred during testing:');
    console.error(error);

    if (error instanceof Error) {
      console.error('\nError details:');
      console.error(`  Message: ${error.message}`);
      console.error(`  Stack: ${error.stack}`);
    }
  }
}

// Run the test
console.log('Starting test...\n');
testFetchExtensionAccounts()
  .then(() => {
    console.log('\n✅ Script execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed with error:', error);
    process.exit(1);
  });
