/**
 * Transaction Size Benchmark Script
 *
 * This script empirically tests Solana transaction size limits by building
 * transactions with varying numbers of recipients and measuring the serialized
 * payload size. This helps determine safe, conservative limits for production use.
 *
 * Solana Legacy Transaction Constraints:
 * - Maximum transaction size: 1232 bytes
 * - Each instruction includes program ID, accounts, and instruction data
 * - Account metadata and signatures add to the total size
 *
 * Run: npx tsx modules/sdk-coin-sol/scripts/transaction-size-benchmark.ts
 */

import { TransactionBuilderFactory, KeyPair } from '../src';
import { coins } from '@bitgo/statics';

const SOLANA_LEGACY_TX_SIZE_LIMIT = 1232;
const TEST_BLOCKHASH = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';
const TEST_PRIVATE_KEY = '5jtsd9SmUH5mFZL7ywNNmqmxxdXw4FQ5GJQprXmrdX4LCuUwMBivCfUX2ar8hGdnLHDGrVKkshW1Ke21vZhPiLyr';
const TEST_TOKEN = 'tsol:usdt';
const TEST_AMOUNT = '1000000000';

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

/**
 * Generates an array of unique test recipient addresses
 */
function generateRecipients(count: number): string[] {
  const baseAddresses = [
    'GYFtQoFCRvGS3WgJe32nRi8LarbSH81rp32SeTmd8mqT',
    '9AKiRaA3NusuW9WcFz5NQ7K1vqf9FMLtb1hFXqc7imkx',
    'FiLHbfatU4keyGzZ1KjC57L3iYmVUi2azJ1ozSZsZWD6',
    '6XKXKPfk5bHmHV4eL2ZFZ5ubcMu6YLed86niBfx7P4Pg',
    'CfhjtJ7W1HHmwXPo9HAkG25gDJPav64iN9Z3nx8eCWV8',
    'DNNSTu2fkj45u6oQuH1fBc3tyDjnnbvhAESrZGhH3uxa',
    'EHPBg7n93e1TWW7oXDwpivQTjZmpavzN9T6HEqAN4bz1',
    'EUZfVoaJgApESLe3Bx8d7xyqg1pucgeydBLQPiRhi6nE',
    'EqE7fJ89HZTAE8MxmJtxCqLhW1ozfhaqZigM5cYxRdHx',
    'CDFk1LXXbWqkd8q9cEsnc3nX44uKgrkDb48b9keBrt8H',
    'EFDfayERUomCbAKurccrAbEYmkyZ1ytazgkiBMBGM851',
    'EPPE9i37rnwWFzagoEHQtBM644p52q54UUGqemJPkAQu',
    '3UKwF59ZmRPXq8ooQDjMmzYUiH861KwhJPzjcYfPXDTG',
    'Cr2yAAa7zEkSLJGebkscXQKNTpmgg5ECC4tCkZHHpNvG',
    '8wQ2VzVEtYDzKaJ5XqGskkQAJZT5YJwHiUTPa7juCF4w',
    '3URWW579b4ugLecHca69feGTM7LKPZ3jDrdTegosVE24',
    '3pL2GxpS8QJoNXhXicnEQ2nvXxFbSy7CoJCRxiWtAuQs',
    'Cei1xdDuZmQxU6FNAcrrmM7aR7amF72osySgS8afpv5m',
    '5Dd1qGYbbdudLi6uCdDodZw1CJ15j2zWnb7ZxQ68em5a',
    '4fviuPUgg3uJp7J2eqLCmeuiHh6zUbn8iXm6JcECNH7T',
    '4g9w2CsTR5h6urpuvm5R5w7UGPKUuCmrSSbj5BWAygq2',
    '3PRwJ1PjrwF7rBCSsNjAH2s8Pr2XdbSm9koGcVLmrnaz',
    '3p9ViY8efykqjixyZGVY2hPLVpHcfsUDKrrHqCUWyYPb',
    '3oANXoBY6b5qgwRf1yES6kx1hf7rDGbEWkopcmXxau1u',
    '3NqKx8uf3V1bTBtkniMzxVsuqW7SZmTnhJpRFuV6aAFz',
    '3NVNrcyJjZmH7xytX2ayPZRucS1YBywwZ5DMzjGRtJvu',
    '4iLLJqwHSdZPBbDPFpG8XiDazX8jMEam8fPQWwrG3qGP',
    '3wbfKiB6uZuZ3KhjVcU9qc5M4yaWyx6mAUJA56tCD1vJ',
    '4QheUEWRi8nesT94mRxiizZnAtRQTnk45jb4oaKMoo1f',
    '4PowojicaKCxgupfPCZK5DT7QB1U3N7xh8Wq7N7VoCvw',
    'F3rTU6cFx9Aqa9jmuq5rSZN7p8bu1pmU9EbNBPeKHz7t',
    '6XREPthmB7mTwLTHv54DZM14rgAuMa1NgXsmPeFgrqwu',
    '5LTQgjYbbBsZj3V5rPmkcAkPcJcbCT8PQTskz2rWL3kW',
    '7aG7LiNQ4hMNWwXTZRrpYVpPZDxY1Ea9YcbHuEjXXKVT',
    'DNyKPeaGfoPYzPmNG4osMZJdyJBZbeMUfNKAAt5RSw23',
    'DpFPcPk454MhoGv71DoaoHSJ5qWnKcVAo9euVoPWPprZ',
    'E4T6wq3aF4LivPfgr5sBKFUJLTZz7sND8duJDYK2EbXG',
    'EeM3aXzgt3Qf7tNV4RBe4vg83gtyGZqUQrJumzwtTUvN',
    'EqBF851o6HknqDy5Ji8PCtyxo48ACjBVPhC1NSpAKbEx',
    'EQVV74ZC332uKpZXrCVU7xzqTBBTdom3DERsEnRNqmAF',
    'EvnEyrSG5qSnxsCSqxdhbbKrcg2oiikKiTtYhwbAMnKT',
    'EBxE1QUeYuKsCCYuDsf6ngUV4ApmGUdc913b1oCLCwus',
    '5GjFQdcCpB9Wj9CJFbMfKTfB7X9h6FSdqrxG6HaJAmUF',
    'EY1wKHGmTUK89aKjZ8qmycyx5gQjBDgeWPfKcwQf2Hvd',
    'EzLYbB2JcSPf9FwiWonD2XfEd3S89ghuMUH27UPvQzgJ',
    '2n2xqWM9Z18LqxfJzkNrMMFWiDUFYA2k6WSgSnf6EnJs',
    'DesU7XscZjng8yj5VX6AZsk3hWSW4sQ3rTG2LuyQ2P4H',
    'Azz9EmNuhtjoYrhWvidWx1Hfd14SNBsYyzXhA9Tnoca8',
    '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen',
  ];

  return baseAddresses.slice(0, Math.min(count, baseAddresses.length));
}

/**
 * Tests building a transaction with a specific number of recipients
 */
async function testTransactionSize(recipientCount: number, withAtaCreation: boolean): Promise<BenchmarkResult> {
  const coinConfig = coins.get('tsol');
  const factory = new TransactionBuilderFactory(coinConfig);
  const authAccount = new KeyPair({ prv: TEST_PRIVATE_KEY });
  const sender = authAccount.getKeys().pub;
  const recipients = generateRecipients(recipientCount);

  try {
    const txBuilder = factory.getTokenTransferBuilder();
    txBuilder.nonce(TEST_BLOCKHASH);
    txBuilder.sender(sender);

    for (const recipientAddress of recipients) {
      txBuilder.send({
        address: recipientAddress,
        amount: TEST_AMOUNT,
        tokenName: TEST_TOKEN,
      });

      if (withAtaCreation) {
        txBuilder.createAssociatedTokenAccount({
          ownerAddress: recipientAddress,
          tokenName: TEST_TOKEN,
        });
      }
    }

    txBuilder.memo('Benchmark test transaction');
    txBuilder.sign({ key: authAccount.getKeys().prv });

    const tx = await txBuilder.build();
    const payload = tx.signablePayload;
    const instructionCount = tx.toJson().instructionsData?.length || 0;
    const isVersioned = tx.isVersionedTransaction();

    return {
      recipientCount,
      withAtaCreation,
      instructionCount,
      payloadSize: payload.length,
      isVersioned,
      success: true,
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

/**
 * Performs binary search to find the maximum safe recipient count for LEGACY transactions
 */
async function findMaxRecipients(withAtaCreation: boolean): Promise<number> {
  let left = 1;
  let right = 50;
  let maxSafe = 0;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const result = await testTransactionSize(mid, withAtaCreation);

    // Only consider legacy transactions within the size limit as safe
    if (result.success && !result.isVersioned && result.payloadSize <= SOLANA_LEGACY_TX_SIZE_LIMIT) {
      maxSafe = mid;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return maxSafe;
}

/**
 * Main benchmark execution
 */
async function runBenchmark(): Promise<void> {
  console.log('Solana Transaction Size Benchmark');
  console.log('Limit: 1232 bytes for legacy transactions\n');

  // Test WITH ATA creation
  console.log('[1/2] Testing WITH ATA Creation:');
  const withAtaResults: BenchmarkResult[] = [];
  const testCountsWithAta = [1, 5, 10, 12, 13, 14, 15, 16, 17, 18, 20, 25, 30];

  for (const count of testCountsWithAta) {
    const result = await testTransactionSize(count, true);
    withAtaResults.push(result);

    if (result.success && result.payloadSize <= SOLANA_LEGACY_TX_SIZE_LIMIT) {
      const txType = result.isVersioned ? 'versioned' : 'legacy';
      console.log(
        `  ${count} recipients: ${result.payloadSize} bytes, ${result.instructionCount} instructions (${txType})`
      );
    } else {
      console.log(`  ${count} recipients: FAILED`);
      if (result.success && result.payloadSize > SOLANA_LEGACY_TX_SIZE_LIMIT) {
        console.log(
          `    Error: Transaction size ${result.payloadSize} bytes exceeds ${SOLANA_LEGACY_TX_SIZE_LIMIT} byte limit`
        );
      } else {
        console.log(`    Error: ${result.error}`);
        if (result.errorStack) {
          const stackLines = result.errorStack.split('\n').slice(0, 4);
          console.log(`    Stack: ${stackLines.join('\n           ')}`);
        }
      }
    }
  }

  const maxWithAta = await findMaxRecipients(true);
  const conservativeWithAta = Math.floor(maxWithAta * 0.9);
  console.log(`\n  Maximum: ${maxWithAta} recipients`);
  console.log(`  Conservative (10% buffer): ${conservativeWithAta} recipients\n`);

  // Test WITHOUT ATA creation
  console.log('[2/2] Testing WITHOUT ATA Creation:');
  const withoutAtaResults: BenchmarkResult[] = [];
  const testCountsWithoutAta = [1, 10, 20, 30, 35, 38, 39, 40, 41, 42, 45, 50];

  for (const count of testCountsWithoutAta) {
    const result = await testTransactionSize(count, false);
    withoutAtaResults.push(result);

    if (result.success && result.payloadSize <= SOLANA_LEGACY_TX_SIZE_LIMIT) {
      const txType = result.isVersioned ? 'versioned' : 'legacy';
      console.log(
        `  ${count} recipients: ${result.payloadSize} bytes, ${result.instructionCount} instructions (${txType})`
      );
    } else {
      console.log(`  ${count} recipients: FAILED`);
      if (result.success && result.payloadSize > SOLANA_LEGACY_TX_SIZE_LIMIT) {
        console.log(
          `    Error: Transaction size ${result.payloadSize} bytes exceeds ${SOLANA_LEGACY_TX_SIZE_LIMIT} byte limit`
        );
      } else {
        console.log(`    Error: ${result.error}`);
        if (result.errorStack) {
          const stackLines = result.errorStack.split('\n').slice(0, 4);
          console.log(`    Stack: ${stackLines.join('\n           ')}`);
        }
      }
    }
  }

  const maxWithoutAta = await findMaxRecipients(false);
  const conservativeWithoutAta = Math.floor(maxWithoutAta * 0.9);
  console.log(`\n  Maximum: ${maxWithoutAta} recipients`);
  console.log(`  Conservative (10% buffer): ${conservativeWithoutAta} recipients\n`);

  // Summary
  console.log('RECOMMENDED LIMITS (for legacy transactions):');
  console.log(`  With ATA creation: ${conservativeWithAta} recipients`);
  console.log(`  Without ATA creation: ${conservativeWithoutAta} recipients`);
  console.log('\nNote: Transactions exceeding limits may build as versioned transactions automatically.');

  // Export results
  const exportData = {
    timestamp: new Date().toISOString(),
    solanaLegacyTxSizeLimit: SOLANA_LEGACY_TX_SIZE_LIMIT,
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
  fs.writeFileSync('transaction-size-benchmark-results.json', JSON.stringify(exportData, null, 2));
  console.log('\nResults saved to: transaction-size-benchmark-results.json');
}

// Execute benchmark
runBenchmark()
  .then(() => {
    console.log('Benchmark completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Benchmark failed:', error);
    process.exit(1);
  });
