import { NetworkType } from '@bitgo/statics';
import should from 'should';
import { RuneUtils } from '../../src/lib/utils';
import { MAINNET_ADDRESS_PREFIX, TESTNET_ADDRESS_PREFIX } from '../../src/lib/constants';
import { blockHash, mainnetCoinAmounts, txIds, mainnetAddress } from '../resources/rune';
import { testnetCoinAmounts, testnetAddress } from '../resources/trune';
const bech32 = require('bech32-buffer');

describe('utils', () => {
  const mainnetUtils = new RuneUtils(NetworkType.MAINNET);
  const testnetUtils = new RuneUtils(NetworkType.TESTNET);

  const testnetDecodedAddress = bech32.decode(testnetAddress.address1).data;
  const mainnetDecodedAddress = bech32.decode(mainnetAddress.address1).data;

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

  it('should validate mainnet address', () => {
    should.equal(mainnetUtils.isValidAddress(mainnetAddress.address1), true);
    should.equal(mainnetUtils.isValidAddress(mainnetAddress.validMemoIdAddress), true);
    should.equal(mainnetUtils.isValidAddress(mainnetDecodedAddress), true);
    should.equal(mainnetUtils.isValidAddress(mainnetAddress.invalidMemoIdAddress), false);
    should.equal(mainnetUtils.isValidAddress(testnetAddress.address1), false);
    should.equal(mainnetUtils.isValidAddress('12345'), false);
  });

  it('should validate testnet address', () => {
    should.equal(testnetUtils.isValidAddress(testnetAddress.address1), true);
    should.equal(testnetUtils.isValidAddress(testnetAddress.validMemoIdAddress), true);
    should.equal(mainnetUtils.isValidAddress(testnetDecodedAddress), true);
    should.equal(testnetUtils.isValidAddress(testnetAddress.invalidMemoIdAddress), false);
    should.equal(testnetUtils.isValidAddress(mainnetAddress.address1), false);
    should.equal(testnetUtils.isValidAddress('12345'), false);
  });

  it('should convert string type testnet address to Uint8Array', () => {
    const decodedAddress = testnetUtils.getDecodedAddress(testnetAddress.address1);
    should.equal(decodedAddress.length, 20);
  });

  it('should convert string type mainnet address to Uint8Array', () => {
    const decodedAddress = mainnetUtils.getDecodedAddress(mainnetAddress.address1);
    should.equal(decodedAddress.length, 20);
  });

  it('should convert Uint8Array type testnet address to string', () => {
    const encodedAddress = testnetUtils.getEncodedAddress(testnetDecodedAddress);
    should.equal(encodedAddress, testnetAddress.address1);
    should.equal(typeof encodedAddress, 'string');
    should.equal(encodedAddress.length, 44);
    should.equal(encodedAddress.startsWith(TESTNET_ADDRESS_PREFIX), true);
  });

  it('should convert Uint8Array type mainnet address to string', () => {
    const encodedAddress = mainnetUtils.getEncodedAddress(mainnetDecodedAddress);
    should.equal(encodedAddress, mainnetAddress.address1);
    should.equal(typeof encodedAddress, 'string');
    should.equal(encodedAddress.length, 43);
    should.equal(encodedAddress.startsWith(MAINNET_ADDRESS_PREFIX), true);
  });
});
