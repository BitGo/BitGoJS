import assert from 'assert';
import 'should';
import { computeAtomicImportFee } from '../../../src/lib/utils';
import {
  ATOMIC_TX_BASE_GAS,
  BASE_FEE_PADDING_DENOMINATOR,
  BASE_FEE_PADDING_NUMERATOR,
  SECP256K1_VERIFY_GAS,
  TX_BYTES_GAS,
} from '../../../src/lib/iface';
import { TransactionBuilderFactory } from '../../../src/lib';
import { coins } from '@bitgo/statics';
import { IMPORT_IN_C as testData } from '../../resources/transactionData/importInC';
import { ON_CHAIN_TEST_WALLET } from '../../resources/account';

describe('Flare atomic import gas calculation', () => {
  // Gas constants
  describe('constants', () => {
    it('ATOMIC_TX_BASE_GAS should be 10_000', () => {
      ATOMIC_TX_BASE_GAS.should.equal(10_000n);
    });

    it('TX_BYTES_GAS should be 1', () => {
      TX_BYTES_GAS.should.equal(1n);
    });

    it('SECP256K1_VERIFY_GAS should be 1_000', () => {
      SECP256K1_VERIFY_GAS.should.equal(1_000n);
    });

    it('padding fraction should be 125/100 (25% overhead)', () => {
      BASE_FEE_PADDING_NUMERATOR.should.equal(125n);
      BASE_FEE_PADDING_DENOMINATOR.should.equal(100n);
    });
  });

  // computeAtomicImportFee unit tests
  describe('computeAtomicImportFee()', () => {
    it('matches the ticket scenario: 311-byte tx, 1 sig, 500 gwei base fee', () => {
      // gas = 10_000 + 311 + 1*1_000 = 11_311
      // raw fee = 11_311 * 500 = 5_655_500 nFLR
      // padded = 5_655_500 * 125 / 100 = 7_069_375 nFLR (exactly divisible)
      const fee = computeAtomicImportFee(311n, 1n, 500n);
      fee.should.equal(7_069_375n);
    });

    it('old underprice scenario: omitting ATOMIC_BASE would have produced ~655_625 nFLR', () => {
      // Without the base cost: gas = 311 + 1*1_000 = 1_311
      // raw = 1_311 * 500 = 655_500, padded = 819_375
      // The correct (new) fee must be much higher than the no-base estimate
      const correctFee = computeAtomicImportFee(311n, 1n, 500n);
      const feeWithoutBase = ((311n + 1n * 1_000n) * 500n * 125n + 99n) / 100n;
      correctFee.should.be.greaterThan(feeWithoutBase);
    });

    it('scales linearly with base fee', () => {
      const fee100 = computeAtomicImportFee(300n, 2n, 100n);
      const fee200 = computeAtomicImportFee(300n, 2n, 200n);
      fee200.should.equal(fee100 * 2n);
    });

    it('scales linearly with number of signatures', () => {
      const fee1Sig = computeAtomicImportFee(300n, 1n, 100n);
      const fee3Sig = computeAtomicImportFee(300n, 3n, 100n);
      // gas1 = 10_000 + 300 + 1*1_000 = 11_300
      // gas3 = 10_000 + 300 + 3*1_000 = 13_300
      // fee3 / fee1 = 13_300 / 11_300
      const gas1 = 10_000n + 300n + 1_000n;
      const gas3 = 10_000n + 300n + 3_000n;
      fee3Sig.should.equal((fee1Sig * gas3) / gas1);
    });

    it('uses ceiling division so the padded fee never under-delivers the 25% headroom', () => {
      // gas = 10_000 + 400 + 2*1_000 = 12_400; baseFee = 250
      // rawFee = 3_100_000; rawFee * 125 = 387_500_000 — divisible by 100, ceil == floor
      const txBytes = 400n;
      const numSigs = 2n;
      const baseFee = 250n;
      const gas = ATOMIC_TX_BASE_GAS + TX_BYTES_GAS * txBytes + SECP256K1_VERIFY_GAS * numSigs;
      const rawFee = gas * baseFee;
      const expectedCeil = (rawFee * BASE_FEE_PADDING_NUMERATOR + BASE_FEE_PADDING_DENOMINATOR - 1n) / BASE_FEE_PADDING_DENOMINATOR;
      assert.strictEqual(computeAtomicImportFee(txBytes, numSigs, baseFee), expectedCeil);
    });

    it('rounds up when rawFee * 125 is not divisible by 100', () => {
      // gas = 10_000 + 301 + 1*1_000 = 11_301; baseFee = 1
      // rawFee = 11_301; rawFee * 125 = 1_412_625; 1_412_625 % 100 = 25 → not divisible
      // floor = 14_126; ceiling = 14_127
      const fee = computeAtomicImportFee(301n, 1n, 1n);
      const rawFee = (10_000n + 301n + 1_000n) * 1n;
      const floor = (rawFee * 125n) / 100n;
      const ceil = (rawFee * 125n + 99n) / 100n;
      assert.strictEqual(fee, ceil);
      assert.notStrictEqual(fee, floor); // proves rounding up happened
      assert.ok(fee > rawFee);           // padded fee is always above unpadded
    });

    it('typical mainnet scenario: 400-byte tx, 2 sigs, 25 gwei (low base fee)', () => {
      // gas = 10_000 + 400 + 2*1_000 = 12_400
      // raw = 12_400 * 25 = 310_000 nFLR
      // padded = 387_500 nFLR
      const fee = computeAtomicImportFee(400n, 2n, 25n);
      fee.should.equal(387_500n);
    });

    it('elevated base fee scenario: 400-byte tx, 2 sigs, 500 gwei', () => {
      // gas = 10_000 + 400 + 2*1_000 = 12_400
      // raw = 12_400 * 500 = 6_200_000 nFLR
      // padded = 7_750_000 nFLR
      const fee = computeAtomicImportFee(400n, 2n, 500n);
      fee.should.equal(7_750_000n);
    });

    it('MPC (1-of-1) scenario: 300-byte tx, 1 sig, 500 gwei', () => {
      // gas = 10_000 + 300 + 1*1_000 = 11_300
      // raw = 11_300 * 500 = 5_650_000 nFLR
      // padded = 7_062_500 nFLR
      const fee = computeAtomicImportFee(300n, 1n, 500n);
      fee.should.equal(7_062_500n);
    });
  });

  // ImportInCTxBuilder.cChainBaseFee() integration test
  describe('ImportInCTxBuilder.cChainBaseFee()', () => {
    const factory = new TransactionBuilderFactory(coins.get('tflrp'));

    const mpcUtxo = {
      outputID: 7,
      amount: '50000000', // 50 FLR in nFLR – well above any reasonable fee
      txid: 'nSBwNcgfLbk5S425b1qaYaqTTCiMCV75KU4Fbnq8SPUUqLq2',
      threshold: 1,
      addresses: [ON_CHAIN_TEST_WALLET.user.pChainAddress],
      outputidx: '1',
      locktime: '0',
    };

    it('should accept a bigint base fee and build a transaction', async () => {
      const txBuilder = factory
        .getImportInCBuilder()
        .threshold(1)
        .locktime(0)
        .fromPubKey([ON_CHAIN_TEST_WALLET.user.pChainAddress])
        .to('0x96993BAEb6AaE2e06BF95F144e2775D4f8efbD35')
        .cChainBaseFee(500n) // 500 gwei = elevated Coston2 scenario
        .decodedUtxos([mpcUtxo])
        .context(testData.context);

      const tx = await txBuilder.build();
      const json = tx.toJson();

      // The computed fee must be greater than zero and the output must be less than the input
      const outputAmount = BigInt(json.outputs[0].value);
      const inputAmount = BigInt(mpcUtxo.amount);
      (outputAmount > 0n).should.be.true();
      (inputAmount > outputAmount).should.be.true();

      // The fee must be substantially larger than what the old formula would have produced.
      // Old formula (no ATOMIC_BASE, no padding) at 500 gwei on a ~300-byte tx:
      //   (300 + 1*1000) * 500 = 650_000 nFLR
      // New formula (ATOMIC_BASE=10000, 25% pad) on same tx:
      //   (10300 + 1000) * 500 * 1.25 = 7_062_500 nFLR (at minimum)
      const actualFee = inputAmount - outputAmount;
      actualFee.should.be.greaterThan(1_000_000n); // well above old underprice
    });

    it('should accept a string base fee', async () => {
      const txBuilder = factory
        .getImportInCBuilder()
        .threshold(1)
        .locktime(0)
        .fromPubKey([ON_CHAIN_TEST_WALLET.user.pChainAddress])
        .to('0x96993BAEb6AaE2e06BF95F144e2775D4f8efbD35')
        .cChainBaseFee('500') // string form
        .decodedUtxos([mpcUtxo])
        .context(testData.context);

      const tx = await txBuilder.build();
      const json = tx.toJson();
      (BigInt(json.outputs[0].value) > 0n).should.be.true();
    });

    it('cChainBaseFee supersedes any previously set fee value', async () => {
      // Set a very small explicit fee, then override with cChainBaseFee
      const txBuilderOverride = factory
        .getImportInCBuilder()
        .threshold(1)
        .locktime(0)
        .fromPubKey([ON_CHAIN_TEST_WALLET.user.pChainAddress])
        .to('0x96993BAEb6AaE2e06BF95F144e2775D4f8efbD35')
        .fee('1') // tiny explicit fee
        .cChainBaseFee(500n) // should override
        .decodedUtxos([mpcUtxo])
        .context(testData.context);

      const txOverride = await txBuilderOverride.build();
      const jsonOverride = txOverride.toJson();
      const feeOverride = BigInt(mpcUtxo.amount) - BigInt(jsonOverride.outputs[0].value);

      // Should use the large fee from baseFee, not the tiny explicit fee
      feeOverride.should.be.greaterThan(1_000_000n);
    });

    it('should charge more fee at 500 gwei than at 25 gwei', async () => {
      const buildTxWithBaseFee = async (baseFee: bigint) => {
        const builder = factory
          .getImportInCBuilder()
          .threshold(1)
          .locktime(0)
          .fromPubKey([ON_CHAIN_TEST_WALLET.user.pChainAddress])
          .to('0x96993BAEb6AaE2e06BF95F144e2775D4f8efbD35')
          .cChainBaseFee(baseFee)
          .decodedUtxos([mpcUtxo])
          .context(testData.context);
        const tx = await builder.build();
        const json = tx.toJson();
        return BigInt(mpcUtxo.amount) - BigInt(json.outputs[0].value);
      };

      const fee25 = await buildTxWithBaseFee(25n);
      const fee500 = await buildTxWithBaseFee(500n);

      fee500.should.be.greaterThan(fee25);
      // fee500 should be ~20× fee25 (both share the same gas units, only baseFee changes)
      // Ratio = 500/25 = 20
      const ratio = fee500 / fee25;
      ratio.should.be.greaterThan(15n); // allow some rounding on integer division
    });

    it('should produce correct fee for 2-of-3 multisig with 500 gwei base fee', async () => {
      const multisigUtxo = {
        outputID: 7,
        amount: '50000000',
        txid: 'nSBwNcgfLbk5S425b1qaYaqTTCiMCV75KU4Fbnq8SPUUqLq2',
        threshold: 2,
        addresses: [
          ON_CHAIN_TEST_WALLET.bitgo.pChainAddress,
          ON_CHAIN_TEST_WALLET.backup.pChainAddress,
          ON_CHAIN_TEST_WALLET.user.pChainAddress,
        ],
        outputidx: '1',
        locktime: '0',
      };

      const txBuilder = factory
        .getImportInCBuilder()
        .threshold(2)
        .locktime(0)
        .fromPubKey([
          ON_CHAIN_TEST_WALLET.user.pChainAddress,
          ON_CHAIN_TEST_WALLET.bitgo.pChainAddress,
          ON_CHAIN_TEST_WALLET.backup.pChainAddress,
        ])
        .to('0x96993BAEb6AaE2e06BF95F144e2775D4f8efbD35')
        .cChainBaseFee(500n)
        .decodedUtxos([multisigUtxo])
        .context(testData.context);

      const tx = await txBuilder.build();
      const json = tx.toJson();
      const actualFee = BigInt(mpcUtxo.amount) - BigInt(json.outputs[0].value);

      // 2-of-3 multisig has 2 sigs per UTXO, which costs more than 1 sig
      // Minimum expected: (10_000 + ~300 + 2*1_000) * 500 * 1.25 > 7_700_000 nFLR
      actualFee.should.be.greaterThan(1_000_000n);
    });
  });
});
