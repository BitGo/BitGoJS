import { KeyPair, TransactionBuilderFactory, WalletInitializationBuilder } from "@bitgo/sdk-coin-sol";
import { coins } from '@bitgo/statics';
import { Connection, NONCE_ACCOUNT_LENGTH, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from "@solana/web3.js";
import assert = require("assert");
import { readFileSync, writeFileSync } from "fs";

// This script will generate nonce accounts for a given main account
// run this script after running json/keypair.json to generate the main account keypair

// The main account must have enough balance to create all nonce accounts

// If its a mainnet account and it doesn't have enough balance, it will throw an error
// You can find the address to fund it in json/keypair.json
// ** DO NOT USE THIS KEYPAIR FOR ANYTHING ELSE **
// ** DO NOT SEND TOO MANY FUNDS TO THIS ADDRESS **
// You can estimate the required balance by running the script with the required number of nonce accounts
// and checking the error message. 
// The estimated balance is the required balance is 0.00145768 SOL per nonce account


// If its a testnet account and it doesn't have enough balance, it will request an airdrop automatically

// The nonce accounts will be saved in json/nonceAddresses.json where the key is the main account private key
// and the value is an array of nonce accounts public keys

// To run this script you can use the following command:
// npx ts-node generate-nonce-accounts.ts


// UPDATE this variables to match your environment

// Number of nonce accounts to generate
const accountsRequired = 5

// For BitGo Test use solana 'devnet' network
// For BitGo Prod use solana 'mainnet-beta' network
const network: 'mainnet-beta' | 'devnet' = 'devnet'
// For BitGo Test use 'tsol' coin
// For BitGo Prod use 'sol' coin
const coin = 'tsol'



async function main() {
  console.log(`Creating ${accountsRequired} nonce accounts`)
  const mainAccountKeyPair: { address: string, privateKey: string } = JSON.parse(readFileSync('json/keypair.json').toString());
  assert(mainAccountKeyPair.address, 'address is missing');
  assert(mainAccountKeyPair.privateKey, 'privateKey is missing');
  const nonceAddresses: Record<string, string[]> = JSON.parse(readFileSync('json/nonceAddresses.json').toString());
  nonceAddresses[mainAccountKeyPair.privateKey] = nonceAddresses[mainAccountKeyPair.privateKey] || [];

  const connection = new Connection(
    clusterApiUrl(network),
    'confirmed',
  );

  const nonceMinRentBalance = await connection.getMinimumBalanceForRentExemption(
    NONCE_ACCOUNT_LENGTH,
  );
  const transactionFee = 10000; // fixed 10_000 lamports

  const mainAccountPublicKey = new PublicKey(mainAccountKeyPair.address);

  console.log(`Checking main account balance for address ${mainAccountKeyPair.address}`)
  const mainAccountBalance = await connection.getBalance(mainAccountPublicKey)
  const requiredBalance = accountsRequired * (nonceMinRentBalance + transactionFee)
  // check if main account has enough balance to create nonce accounts
  if (mainAccountBalance < requiredBalance) {
    if (network === 'mainnet-beta') {
      throw new Error(`Not enough balance to create all nonce accounts - current balance: ${getValueInSol(mainAccountBalance)} SOL - required balance ${getValueInSol(requiredBalance)} SOL`)
    }
    else {
      const airdrop = await connection.requestAirdrop(mainAccountPublicKey, 1 * LAMPORTS_PER_SOL)
      await connection.confirmTransaction(airdrop)
    };
  }

  for (let i = 0; i < accountsRequired; i++) {
    console.log(`Creating nonce account ${i + 1} of ${accountsRequired}`)
    const recentBlockhash = await connection.getRecentBlockhash();

    const nonceAccountKeyPair = new KeyPair().getKeys();

    const txBuilder = getBuilder(coin)
      .nonce(recentBlockhash.blockhash)
      .sender(mainAccountKeyPair.address)
      .address(nonceAccountKeyPair.pub)
      .amount(nonceMinRentBalance.toFixed());
    txBuilder.sign({ key: mainAccountKeyPair.privateKey })
    txBuilder.sign({ key: nonceAccountKeyPair.prv })

    const tx = await txBuilder.build();
    const serializedTx = tx.toBroadcastFormat();

    try {
      const txid = await connection.sendRawTransaction(Buffer.from(serializedTx, 'base64'));
      await connection.confirmTransaction(txid);
      nonceAddresses[mainAccountKeyPair.privateKey].push(nonceAccountKeyPair.pub);
      console.log('Nonce account created: ' + nonceAccountKeyPair.pub);
    }
    catch (e) {
      console.log('Error creating nonce account for address: ' + nonceAccountKeyPair.pub)
      console.error(e);
    }
  }

  writeFileSync(`json/nonceAddresses.json`, JSON.stringify(nonceAddresses));
  console.log(`Nonce accounts created: ${nonceAddresses[mainAccountKeyPair.privateKey].length}`)
  console.log(`Nonce accounts saved in json/nonceAddresses.json`)
}

main().catch((err) => {
  console.error(err)
  process.exit(-1)
})


// utils functions
function getValueInSol(value: number) {
  return value / LAMPORTS_PER_SOL;
}

const getBuilder = (coin: string): WalletInitializationBuilder => {
  return new TransactionBuilderFactory(coins.get(coin)).getWalletInitializationBuilder();
};
