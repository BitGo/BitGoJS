/**
 * Performs delegated staking with Aptos.
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */
import { BitGoAPI } from '@bitgo/sdk-api';
import { coins } from '@bitgo/statics';
import { Tapt, TransactionBuilderFactory, Utils } from '@bitgo/sdk-coin-apt';
import { Network, Aptos, AptosConfig, Account, Ed25519PrivateKey, SimpleTransaction } from '@aptos-labs/ts-sdk';

require('dotenv').config({ path: '../../.env' });

const AMOUNT_OCTAS = 11 * 100_000_000;
const NETWORK = Network.TESTNET;

const aptosConfig = new AptosConfig({ network: NETWORK });
const aptos = new Aptos(aptosConfig);

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test',
});
const coin = coins.get('tapt');
bitgo.register(coin.name, Tapt.createInstance);

const broadcastToSimple = (serializedTx: string) =>
  new SimpleTransaction(Utils.default.deserializeSignedTransaction(serializedTx).raw_txn);

async function main() {
  const account = getAccount();
  const delegationPoolAddress = getDelegationPoolAddress();

  // Account should have sufficient balance
  const accountBalance = await aptos.getAccountAPTAmount({ accountAddress: account.accountAddress });
  if (accountBalance < AMOUNT_OCTAS) {
    console.info(`Balance of ${account.accountAddress} is ${accountBalance} octas, requesting funds.`);
    const txn = await aptos.fundAccount({ accountAddress: account.accountAddress, amount: AMOUNT_OCTAS });
    await aptos.waitForTransaction({ transactionHash: txn.hash });
    console.info(`Funding successful: ${txn.hash}`);
  }
  const { sequence_number } = await aptos.getAccountInfo({ accountAddress: account.accountAddress });

  // Use BitGoAPI to build instruction
  const txBuilder = new TransactionBuilderFactory(coin).getDelegationPoolAddStakeTransactionBuilder();
  txBuilder
    .sender(account.accountAddress.toString())
    .recipients([{ address: delegationPoolAddress, amount: `${AMOUNT_OCTAS}` }])
    .sequenceNumber(Number(sequence_number));
  const unsignedTx = await txBuilder.build();
  const serializedUnsignedTx = unsignedTx.toBroadcastFormat();

  // Sign transaction. Signing is flexible, let's use Aptos libs
  const authenticator = aptos.sign({
    signer: account,
    transaction: broadcastToSimple(serializedUnsignedTx),
  });
  if (!authenticator.isEd25519()) {
    throw new Error('Example only supports Ed25519');
  }
  txBuilder.addSenderSignature(
    { pub: account.publicKey.toString() },
    Buffer.from(authenticator.signature.toUint8Array())
  );
  const tx = await txBuilder.build();
  const serializedTx = tx.toBroadcastFormat();
  console.info(`Transaction ${serializedTx} and JSON:\n${JSON.stringify(tx.toJson(), undefined, 2)}`);

  // Submit transaction
  const submittedTxn = await aptos.transaction.submit.simple({
    transaction: broadcastToSimple(serializedTx),
    senderAuthenticator: authenticator,
  });
  console.log(`Success: ${submittedTxn.hash}`);
}

const getAccount = () => {
  const privateKey = process.env.APTOS_PRIVATE_KEY;
  if (privateKey === undefined) {
    const { privateKey } = Account.generate();
    console.log('# Here is a new account to save into your .env file.');
    console.log(`APTOS_PRIVATE_KEY=${privateKey.toAIP80String()}`);
    throw new Error('Missing account information');
  }
  return Account.fromPrivateKey({ privateKey: new Ed25519PrivateKey(privateKey) });
};

const getDelegationPoolAddress = () => {
  const address = process.env.APTOS_DELEGATION_POOL_ADDRESS;
  if (!address) {
    console.log('# Provide a delegation pool.');
    console.log(`APTOS_DELEGATION_POOL_ADDRESS=`);
    throw new Error('Missing delegation pool address');
  }
  return address;
};

main().catch((e) => console.error(e));
