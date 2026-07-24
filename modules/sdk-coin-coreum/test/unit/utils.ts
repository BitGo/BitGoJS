import { NetworkType } from '@bitgo/statics';
import should from 'should';
import { CoreumUtils } from '../../src/lib/utils';
import { mainnetAccountAddressRegex, testnetAccountAddressRegex } from '../../src/lib/constants';
import { blockHash, mainnetAddress, mainnetCoinAmounts, txIds } from '../resources/coreum';
import { testnetCoinAmounts } from '../resources/tcoreum';

describe('utils', () => {
  const mainnetUtils = new CoreumUtils(NetworkType.MAINNET);
  const testnetUtils = new CoreumUtils(NetworkType.TESTNET);

  it('should validate block hash correctly', () => {
    should.equal(mainnetUtils.isValidBlockId(blockHash.hash1), true);
    should.equal(mainnetUtils.isValidBlockId(blockHash.hash2), true);
    // param is coming as undefined so it was causing an issue
    should.equal(mainnetUtils.isValidBlockId(undefined as unknown as string), false);
    should.equal(mainnetUtils.isValidBlockId(''), false);
  });

  it('should validate invalid block hash correctly', () => {
    should.equal(mainnetUtils.isValidBlockId(''), false);
    should.equal(mainnetUtils.isValidBlockId('0xade35465gfvdcsxsz24300'), false);
    should.equal(mainnetUtils.isValidBlockId(blockHash.hash2 + 'ff'), false);
    should.equal(mainnetUtils.isValidBlockId('latest'), false);
  });

  it('should validate transaction id correctly', () => {
    should.equal(mainnetUtils.isValidTransactionId(txIds.hash1), true);
    should.equal(mainnetUtils.isValidTransactionId(txIds.hash2), true);
    should.equal(mainnetUtils.isValidTransactionId(txIds.hash3), true);
  });

  it('should validate invalid transaction id correctly', () => {
    should.equal(mainnetUtils.isValidTransactionId(''), false);
    should.equal(mainnetUtils.isValidTransactionId(txIds.hash1.slice(3)), false);
    should.equal(mainnetUtils.isValidTransactionId(txIds.hash3 + '00'), false);
    should.equal(mainnetUtils.isValidTransactionId('dalij43ta0ga2dadda02'), false);
  });

  it('should accept 32-byte (group module / smart contract) addresses', () => {
    should.equal(mainnetUtils.isValidAddress(mainnetAddress.address32byte1), true);
    should.equal(mainnetUtils.isValidAddress(`${mainnetAddress.address32byte1}?memoId=1`), true);
  });

  it('should reject 32-byte addresses with an invalid checksum', () => {
    const corrupted = mainnetAddress.address32byte1.slice(0, -1) + 'q';
    should.equal(mainnetUtils.isValidAddress(corrupted), false);
  });

  it('should reject addresses with intermediate data lengths (not 38 or 58 chars)', () => {
    const bech32Chars = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
    const intermediateData = bech32Chars.repeat(2).slice(0, 48);
    should.equal(mainnetAccountAddressRegex.test(`core1${intermediateData}`), false);
    should.equal(testnetAccountAddressRegex.test(`testcore1${intermediateData}`), false);
  });

  it('testnet regex should accept both 20-byte and 32-byte address lengths', () => {
    const data38 = 'qpzry9x8gf2tvdw0s3jn54khce6mua7lqpzry9';
    should.equal(testnetAccountAddressRegex.test(`testcore1${data38}`), true);
    const data58 = 'qpzry9x8gf2tvdw0s3jn54khce6mua7lqpzry9x8gf2tvdw0s3jn54khce';
    should.equal(testnetAccountAddressRegex.test(`testcore1${data58}`), true);
    const data39 = 'qpzry9x8gf2tvdw0s3jn54khce6mua7lqpzry9x';
    should.equal(testnetAccountAddressRegex.test(`testcore1${data39}`), false);
  });

  it('validateAmount', function () {
    should.doesNotThrow(() => mainnetUtils.validateAmountData([mainnetCoinAmounts.amount1]));
    should.doesNotThrow(() => mainnetUtils.validateAmountData([mainnetCoinAmounts.amount2]));
    should.doesNotThrow(() => mainnetUtils.validateAmountData([mainnetCoinAmounts.amount3]));
    should(() => mainnetUtils.validateAmountData([mainnetCoinAmounts.amount4])).throwError(
      'transactionBuilder: validateAmount: Invalid amount: ' + mainnetCoinAmounts.amount4.amount
    );
    should(() => mainnetUtils.validateAmountData([mainnetCoinAmounts.amount5])).throwError(
      'transactionBuilder: validateAmount: Invalid denom: ' + mainnetCoinAmounts.amount5.denom
    );

    should.doesNotThrow(() => testnetUtils.validateAmountData([testnetCoinAmounts.amount1]));
    should.doesNotThrow(() => testnetUtils.validateAmountData([testnetCoinAmounts.amount2]));
    should.doesNotThrow(() => testnetUtils.validateAmountData([testnetCoinAmounts.amount3]));
    should(() => testnetUtils.validateAmountData([testnetCoinAmounts.amount4])).throwError(
      'transactionBuilder: validateAmount: Invalid amount: ' + testnetCoinAmounts.amount4.amount
    );
    should(() => testnetUtils.validateAmountData([testnetCoinAmounts.amount5])).throwError(
      'transactionBuilder: validateAmount: Invalid denom: ' + testnetCoinAmounts.amount5.denom
    );
  });
});
