/**
 * Stakes JitoSOL tokens on Solana devnet.
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */
import { BitGoAPI } from '@bitgo/sdk-api'
import { TransactionBuilderFactory, Tsol } from '@bitgo/sdk-coin-sol'
import { coins } from '@bitgo/statics'
import { Connection, PublicKey, clusterApiUrl, Transaction, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { getStakePoolAccount, updateStakePool } from '@solana/spl-stake-pool'
import * as bs58 from 'bs58';

require('dotenv').config({ path: '../../.env' })

const AMOUNT_LAMPORTS = 1000
const JITO_STAKE_POOL_ADDRESS = 'Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb'
const NETWORK = 'devnet'

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test',
})
const coin = coins.get("tsol")
bitgo.register(coin.name, Tsol.createInstance)

async function main() {
  const account = getAccount()
  const connection = new Connection(clusterApiUrl(NETWORK), 'confirmed')
  const recentBlockhash = await connection.getLatestBlockhash()
  const stakePoolAccount = await getStakePoolAccount(connection, new PublicKey(JITO_STAKE_POOL_ADDRESS))


  // Account should have sufficient balance
  const accountBalance = await connection.getBalance(account.publicKey)
  if (accountBalance < 0.1 * LAMPORTS_PER_SOL) {
    console.info(`Your account balance is ${accountBalance / LAMPORTS_PER_SOL} SOL, requesting airdrop`)
    const sig = await connection.requestAirdrop(account.publicKey, 2 * LAMPORTS_PER_SOL)
    await connection.confirmTransaction(sig)
    console.info(`Airdrop successful: ${sig}`)
  }

  // Stake pool should be up to date
  const epochInfo = await connection.getEpochInfo()
  if (stakePoolAccount.account.data.lastUpdateEpoch.ltn(epochInfo.epoch)) {
    console.info('Stake pool is out of date.')
    const usp = await updateStakePool(connection, stakePoolAccount)
    const tx = new Transaction()
    tx.add(...usp.updateListInstructions, ...usp.finalInstructions)
    const signer = Keypair.fromSecretKey(account.secretKeyArray)
    const sig = await connection.sendTransaction(tx, [signer])
    await connection.confirmTransaction(sig)
    console.info(`Stake pool updated: ${sig}`)
  }

  // Use BitGoAPI to build depositSol instruction
  const txBuilder = new TransactionBuilderFactory(coin).getStakingActivateBuilder()
  txBuilder
    .amount(`${AMOUNT_LAMPORTS}`)
    .sender(account.publicKey.toBase58())
    .stakingAddress(JITO_STAKE_POOL_ADDRESS)
    .validator(JITO_STAKE_POOL_ADDRESS)
    .isJito(true)
    .nonce(recentBlockhash.blockhash)
  txBuilder.sign({ key: account.secretKey })
  const tx = await txBuilder.build()
  const serializedTx = tx.toBroadcastFormat()
  console.info(`Transaction JSON:\n${JSON.stringify(tx.toJson(), undefined, 2)}`)

  // Send transaction
  try {
    const sig = await connection.sendRawTransaction(Buffer.from(serializedTx, 'base64'))
    await connection.confirmTransaction(sig)
    console.log(`${AMOUNT_LAMPORTS / LAMPORTS_PER_SOL} SOL deposited`, sig)
  } catch (e) {
    console.log('Error sending transaction')
    console.error(e)
    if (e.transactionMessage === 'Transaction simulation failed: Error processing Instruction 0: Provided owner is not allowed') {
      console.error('If you successfully staked JitoSOL once, you cannot stake again.')
    }
  }
}

const getAccount = () => {
  const publicKey = process.env.ACCOUNT_PUBLIC_KEY
  const secretKey = process.env.ACCOUNT_SECRET_KEY
  if (publicKey === undefined || secretKey === undefined) {
    const { publicKey, secretKey } = Keypair.generate()
    console.log('Here is a new account to save into your .env file.')
    console.log(`ACCOUNT_PUBLIC_KEY=${publicKey.toBase58()}`)
    console.log(`ACCOUNT_SECRET_KEY=${bs58.encode(secretKey)}`)
    throw new Error("Missing account information")
  }

  return {
    publicKey: new PublicKey(publicKey),
    secretKey,
    secretKeyArray: new Uint8Array(bs58.decode(secretKey)),
  }
}

main().catch((e) => console.error(e))
