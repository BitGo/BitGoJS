/**
 * Transaction Size Benchmark Script
 *
 * Empirically determines Solana transaction size limits by testing various recipient counts.
 * All test data is generated programmatically to ensure validity.
 *
 * Run: npx tsx modules/sdk-coin-sol/scripts/transaction-size-benchmark.ts
 */

import { TransactionBuilderFactory, KeyPair, Transaction } from '../src';
import { SOLANA_TRANSACTION_MAX_SIZE } from '../src/lib/constants';
import { coins } from '@bitgo/statics';
import * as crypto from 'crypto';
import bs58 from 'bs58';

function generateBlockhash(): string {
  return bs58.encode(crypto.randomBytes(32));
}

function generateTestConfig() {
  const authAccount = new KeyPair();
  return {
    blockhash: generateBlockhash(),
    authAccount,
    sender: authAccount.getKeys().pub,
    token: 'tsol:usdt',
    amount: '1000000000',
  };
}

interface BenchmarkResult {
  recipientCount: number;
  withAtaCreation: boolean;
  instructionCount: number;
  payloadSize: number;
  isVersioned: boolean;
  success: boolean;
  error?: string;
  errorStack?: string;
}

function generateRecipients(count: number): string[] {
  const recipients: string[] = [];
  for (let i = 0; i < count; i++) {
    recipients.push(new KeyPair().getAddress());
  }
  return recipients;
}

async function testTransactionSize(recipientCount: number, withAtaCreation: boolean): Promise<BenchmarkResult> {
  const coinConfig = coins.get('tsol');
  const factory = new TransactionBuilderFactory(coinConfig);
  const testConfig = generateTestConfig();
  const recipients = generateRecipients(recipientCount);

  try {
    const txBuilder = factory.getTokenTransferBuilder();
    txBuilder.nonce(testConfig.blockhash);
    txBuilder.sender(testConfig.sender);

    for (const recipientAddress of recipients) {
      txBuilder.send({
        address: recipientAddress,
        amount: testConfig.amount,
        tokenName: testConfig.token,
      });

      if (withAtaCreation) {
        txBuilder.createAssociatedTokenAccount({
          ownerAddress: recipientAddress,
          tokenName: testConfig.token,
        });
      }
    }

    txBuilder.memo('Benchmark test transaction');
    txBuilder.sign({ key: testConfig.authAccount.getKeys().prv });

    const tx = (await txBuilder.build()) as Transaction;
    const instructionCount = tx.toJson().instructionsData?.length || 0;
    const isVersioned = tx.isVersionedTransaction();

    let payloadSize = 0;
    let serializationError: { message: string; stack?: string } | undefined;

    try {
      const serialized = tx.toBroadcastFormat();
      payloadSize = Buffer.from(serialized, 'base64').length;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      serializationError = { message: errorMessage, stack: errorStack };

      try {
        const payload = tx.signablePayload;
        payloadSize = payload.length;
      } catch {
        payloadSize = 0;
      }
    }

    const isWithinLimit = !isVersioned && payloadSize <= SOLANA_TRANSACTION_MAX_SIZE && !serializationError;

    return {
      recipientCount,
      withAtaCreation,
      instructionCount,
      payloadSize,
      isVersioned,
      success: isWithinLimit,
      error: serializationError?.message,
      errorStack: serializationError?.stack,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    return {
      recipientCount,
      withAtaCreation,
      instructionCount: 0,
      payloadSize: 0,
      isVersioned: false,
      success: false,
      error: errorMessage,
      errorStack,
    };
  }
}

async function findMaxRecipients(withAtaCreation: boolean): Promise<number> {
  let left = 1;
  let right = 50;
  let maxSafe = 0;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const result = await testTransactionSize(mid, withAtaCreation);

    if (result.success && !result.isVersioned && result.payloadSize <= SOLANA_TRANSACTION_MAX_SIZE) {
      maxSafe = mid;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return maxSafe;
}

async function runBenchmark(): Promise<void> {
  console.log('Solana Transaction Size Benchmark');
  console.log(`Limit: ${SOLANA_TRANSACTION_MAX_SIZE} bytes for legacy transactions\n`);

  console.log('[1/2] Testing WITH ATA Creation:');
  const withAtaResults: BenchmarkResult[] = [];
  const testCountsWithAta = [1, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16, 17, 18, 20, 25, 30];

  for (const count of testCountsWithAta) {
    const result = await testTransactionSize(count, true);
    withAtaResults.push(result);

    if (result.success) {
      const txType = result.isVersioned ? 'versioned' : 'legacy';
      console.log(
        `  ${count} recipients: ${result.payloadSize} bytes, ${result.instructionCount} instructions (${txType})`
      );
    } else {
      console.log(`  ${count} recipients: FAILED`);
      if (result.error) {
        console.log(`    Error: ${result.error}`);
      }
      if (result.errorStack) {
        const stackLines = result.errorStack.split('\n').slice(0, 4);
        console.log(`    Stack: ${stackLines.join('\n           ')}`);
      }
    }
  }

  const maxWithAta = await findMaxRecipients(true);
  const conservativeWithAta = Math.floor(maxWithAta * 0.9);
  console.log(`\n  Maximum: ${maxWithAta} recipients`);
  console.log(`  Conservative (10% buffer): ${conservativeWithAta} recipients\n`);

  console.log('[2/2] Testing WITHOUT ATA Creation:');
  const withoutAtaResults: BenchmarkResult[] = [];
  const testCountsWithoutAta = [1, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 30, 35, 38, 39, 40, 41, 42, 45, 50];

  for (const count of testCountsWithoutAta) {
    const result = await testTransactionSize(count, false);
    withoutAtaResults.push(result);

    if (result.success) {
      const txType = result.isVersioned ? 'versioned' : 'legacy';
      console.log(
        `  ${count} recipients: ${result.payloadSize} bytes, ${result.instructionCount} instructions (${txType})`
      );
    } else {
      console.log(`  ${count} recipients: FAILED`);
      if (result.error) {
        console.log(`    Error: ${result.error}`);
      }
      if (result.errorStack) {
        const stackLines = result.errorStack.split('\n').slice(0, 4);
        console.log(`    Stack: ${stackLines.join('\n           ')}`);
      }
    }
  }

  const maxWithoutAta = await findMaxRecipients(false);
  const conservativeWithoutAta = Math.floor(maxWithoutAta * 0.9);
  console.log(`\n  Maximum: ${maxWithoutAta} recipients`);
  console.log(`  Conservative (10% buffer): ${conservativeWithoutAta} recipients\n`);

  console.log('RECOMMENDED LIMITS (for legacy transactions):');
  console.log(`  With ATA creation: ${conservativeWithAta} recipients`);
  console.log(`  Without ATA creation: ${conservativeWithoutAta} recipients`);
  console.log('\nNote: Transactions exceeding limits may build as versioned transactions automatically.');

  const exportData = {
    timestamp: new Date().toISOString(),
    solanaLegacyTxSizeLimit: SOLANA_TRANSACTION_MAX_SIZE,
    withAtaCreation: {
      maxSafe: maxWithAta,
      conservative: conservativeWithAta,
      testResults: withAtaResults,
    },
    withoutAtaCreation: {
      maxSafe: maxWithoutAta,
      conservative: conservativeWithoutAta,
      testResults: withoutAtaResults,
    },
  };

  const fs = await import('fs');
  const path = await import('path');
  const outputPath = path.join(__dirname, 'transaction-size-benchmark-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
  console.log(`\nResults saved to: ${outputPath}`);
}

runBenchmark()
  .then(() => {
    console.log('Benchmark completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Benchmark failed:', error);
    process.exit(1);
  });
