/**
 * Unstakes JitoSOL tokens on Solana devnet.
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */
import { SolStakingTypeEnum } from '@bitgo/public-types';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TransactionBuilderFactory, Tsol } from '@bitgo/sdk-coin-sol';
import { coins } from '@bitgo/statics';
import { Connection, PublicKey, clusterApiUrl, Keypair } from '@solana/web3.js';
import { getStakePoolAccount } from '@solana/spl-stake-pool';
import * as bs58 from 'bs58';

require('dotenv').config({ path: '../../.env' });

const AMOUNT_TOKENS = 100;
const JITO_STAKE_POOL_ADDRESS = 'Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb';
const NETWORK = 'testnet';
// You must find a validator. Try prepareWithdrawAccounts.

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test',
});
const coin = coins.get('tsol');
bitgo.register(coin.name, Tsol.createInstance);

async function main() {
  const account = getAccount();
  const { validatorAddress } = getValidator();
  const connection = new Connection(clusterApiUrl(NETWORK), 'confirmed');
  const recentBlockhash = await connection.getLatestBlockhash();
  const stakePoolAddress = new PublicKey(JITO_STAKE_POOL_ADDRESS);
  const stakePoolAccount = await getStakePoolAccount(connection, stakePoolAddress);
  console.info('Validator list account', stakePoolAccount.account.data.validatorList.toBase58());

  const transferAuthority = Keypair.generate();
  const stakeAccount = Keypair.generate();
  console.info('Transfer authority public key:', transferAuthority.publicKey.toBase58());
  console.info('Stake account public key:', stakeAccount.publicKey.toBase58());

  // Use BitGoAPI to build withdrawStake instruction
  const txBuilder = new TransactionBuilderFactory(coin).getStakingDeactivateBuilder();
  txBuilder
    .amount(`${AMOUNT_TOKENS}`)
    .sender(account.publicKey.toBase58())
    .stakingAddress(JITO_STAKE_POOL_ADDRESS)
    .unstakingAddress(stakeAccount.publicKey.toBase58())
    .stakingType(SolStakingTypeEnum.JITO)
    .extraParams({
      stakePoolData: {
        managerFeeAccount: stakePoolAccount.account.data.managerFeeAccount.toBase58(),
        poolMint: stakePoolAccount.account.data.poolMint.toBase58(),
        validatorListAccount: stakePoolAccount.account.data.validatorList.toBase58(),
      },
      validatorAddress,
      transferAuthorityAddress: transferAuthority.publicKey.toBase58(),
    })
    .nonce(recentBlockhash.blockhash);

  txBuilder.sign({ key: account.secretKey });
  txBuilder.sign({ key: bs58.encode(stakeAccount.secretKey) });
  txBuilder.sign({ key: bs58.encode(transferAuthority.secretKey) });

  const tx = await txBuilder.build();
  const serializedTx = tx.toBroadcastFormat();
  console.info(serializedTx);
  console.info(`Transaction JSON:\n${JSON.stringify(tx.toJson(), undefined, 2)}`);

  // Send transaction
  try {
    const sig = await connection.sendRawTransaction(Buffer.from(serializedTx, 'base64'));
    await connection.confirmTransaction(sig);
    console.log(`${AMOUNT_TOKENS} tokens withdrawn`, sig);
  } catch (e) {
    console.log('Error sending transaction');
    console.error(e);
  }
}

const getAccount = () => {
  const publicKey = process.env.ACCOUNT_PUBLIC_KEY;
  const secretKey = process.env.ACCOUNT_SECRET_KEY;
  if (publicKey === undefined || secretKey === undefined) {
    const { publicKey, secretKey } = Keypair.generate();
    console.log('# Here is a new account to save into your .env file.');
    console.log(`ACCOUNT_PUBLIC_KEY=${publicKey.toBase58()}`);
    console.log(`ACCOUNT_SECRET_KEY=${bs58.encode(secretKey)}`);
    throw new Error('Missing account information');
  }

  return {
    publicKey: new PublicKey(publicKey),
    secretKey,
    secretKeyArray: new Uint8Array(bs58.decode(secretKey)),
  };
};

const getValidator = () => {
  const validatorAddress = process.env.VALIDATOR_PUBLIC_KEY;
  if (validatorAddress === undefined) {
    console.log('# You must select a validator, then define the entry below');
    console.log('VALIDATOR_PUBLIC_KEY=');
    throw new Error('Missing validator address');
  }
  return { validatorAddress };
};

main().catch((e) => console.error(e));
