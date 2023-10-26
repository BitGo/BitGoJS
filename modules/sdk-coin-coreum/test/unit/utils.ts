import { NetworkType } from '@bitgo/statics';
import should from 'should';
import { CoreumUtils } from '../../src/lib/utils';
import { blockHash, mainnetCoinAmounts, txIds } from '../resources/coreum';
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
