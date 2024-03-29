import should from 'should';

import utils from '../../src/lib/utils';
import * as testData from '../resources/zeta';
import { blockHash, txIds } from '../resources/zeta';

describe('utils', () => {
  it('should validate block hash correctly', () => {
    should.equal(utils.isValidBlockId(blockHash.hash1), true);
    should.equal(utils.isValidBlockId(blockHash.hash2), true);
    // param is coming as undefined so it was causing an issue
    should.equal(utils.isValidBlockId(undefined as unknown as string), false);
    should.equal(utils.isValidBlockId(''), false);
  });

  it('should validate invalid block hash correctly', () => {
    should.equal(utils.isValidBlockId(''), false);
    should.equal(utils.isValidBlockId('0xade35465gfvdcsxsz24300'), false);
    should.equal(utils.isValidBlockId(blockHash.hash2 + 'ff'), false);
    should.equal(utils.isValidBlockId('latest'), false);
  });

  it('should validate transaction id correctly', () => {
    should.equal(utils.isValidTransactionId(txIds.hash1), true);
    should.equal(utils.isValidTransactionId(txIds.hash2), true);
    should.equal(utils.isValidTransactionId(txIds.hash3), true);
  });

  it('should validate invalid transaction id correctly', () => {
    should.equal(utils.isValidTransactionId(''), false);
    should.equal(utils.isValidTransactionId(txIds.hash1.slice(3)), false);
    should.equal(utils.isValidTransactionId(txIds.hash3 + '00'), false);
    should.equal(utils.isValidTransactionId('dalij43ta0ga2dadda02'), false);
  });

  it('validateAmount', function () {
    should.doesNotThrow(() => utils.validateAmountData([testData.coinAmounts.amount1]));
    should.doesNotThrow(() => utils.validateAmountData([testData.coinAmounts.amount2]));
    should.doesNotThrow(() => utils.validateAmountData([testData.coinAmounts.amount3]));
    should(() => utils.validateAmountData([testData.coinAmounts.amount4])).throwError(
      'transactionBuilder: validateAmount: Invalid amount: ' + testData.coinAmounts.amount4.amount
    );
    should(() => utils.validateAmountData([testData.coinAmounts.amount5])).throwError(
      'transactionBuilder: validateAmount: Invalid denom: ' + testData.coinAmounts.amount5.denom
    );
  });

  it('should convert evm address to zeta address correctly', () => {
    const result = utils.getCosmosLikeAddressFromHex('zeta', testData.zetaEvmAddress);
    should.equal(result, testData.zetaCosmosAddress);
  });

  it('should convert evm address to zeta address correctly without 0x prefix', () => {
    const result = utils.getCosmosLikeAddressFromHex('zeta', testData.zetaEvmAddress.slice(2));
    should.equal(result, testData.zetaCosmosAddress);
  });

  it('should convert zeta address to its evm equivalent correctly', () => {
    const result = utils.getEvmLikeAddressFromCosmos(testData.zetaCosmosAddress);
    should.equal(result, testData.zetaEvmAddress);
  });
});
