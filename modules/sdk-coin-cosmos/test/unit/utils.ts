import should from 'should';
import { coins, CosmosNetwork } from '@bitgo-beta/statics';
import { getAvailableTestCoins, getTestData } from '../testUtils';
import { Utils } from '../../src';

describe('Cosmos Utils', function () {
  const availableCoins = getAvailableTestCoins();
  // TODO: COIN-5039 -  Running tests for each coin in parallel to improve test performance
  // Loop through each available coin and run tests
  availableCoins.forEach((coinName) => {
    describe(`${coinName} Utils`, function () {
      const testData = getTestData(coinName);
      const addresses = testData.addresses as Required<typeof testData.addresses>;
      const coin = coins.get(testData.testnetCoin);
      const network = coin.network as CosmosNetwork;
      const utils = new Utils(network);

      describe('isValidAddress', function () {
        it('should return true for valid address', function () {
          should.equal(utils.isValidAddress(addresses.address1), true);
          should.equal(utils.isValidAddress(addresses.address2), true);
        });

        it('should return false for invalid address', function () {
          should.equal(utils.isValidAddress(addresses.address6), false);
          should.equal(utils.isValidAddress('invalid'), false);
        });

        it('should validate memo id addresses correctly', function () {
          should.equal(utils.isValidAddress(addresses.noMemoIdAddress), true);
          should.equal(utils.isValidAddress(addresses.validMemoIdAddress), true);
          should.equal(utils.isValidAddress(addresses.invalidMemoIdAddress), false);
          should.equal(utils.isValidAddress(addresses.multipleMemoIdAddress), false);
        });
      });

      describe('isValidValidatorAddress', function () {
        it('should return true for valid validator address', function () {
          should.equal(utils.isValidValidatorAddress(addresses.validatorAddress1), true);
          should.equal(utils.isValidValidatorAddress(addresses.validatorAddress2), true);
        });

        it('should return false for invalid validator address', function () {
          should.equal(utils.isValidValidatorAddress(addresses.address1), false);
          should.equal(utils.isValidValidatorAddress('invalid'), false);
        });
      });

      describe('isValidContractAddress', function () {
        it('should return true for valid contract address', function () {
          // Contract addresses follow the same format as regular addresses
          should.equal(utils.isValidContractAddress(addresses.address1), true);
          should.equal(utils.isValidContractAddress(addresses.address2), true);
        });

        it('should return false for invalid contract address', function () {
          should.equal(utils.isValidContractAddress(addresses.address6), false);
          should.equal(utils.isValidContractAddress('invalid'), false);
        });
      });

      describe('validateAmount', function () {
        it('should not throw for valid amount', function () {
          should.doesNotThrow(() => {
            utils.validateAmount(testData.coinAmounts.amount1);
            utils.validateAmount(testData.coinAmounts.amount2);
            utils.validateAmount(testData.coinAmounts.amount3);
          });
        });

        it('should throw for invalid amount', function () {
          should(() => utils.validateAmount(testData.coinAmounts.amount4)).throwError(
            `Invalid amount: '${testData.coinAmounts.amount4.amount}' is not a valid positive integer`
          );
        });

        it('should throw for invalid denom', function () {
          should(() => utils.validateAmount({ denom: 'invalid', amount: '100' })).throwError(
            `Invalid amount: denom 'invalid' is not a valid denomination`
          );
        });

        it('should throw for missing denom', function () {
          should(() => utils.validateAmount({ amount: '100' } as any)).throwError(`Invalid amount: missing denom`);
        });

        it('should throw for missing amount', function () {
          should.throws(
            () => utils.validateAmount({ denom: testData.baseDenom } as any),
            'Invalid amount: missing amount'
          );
        });
      });
    });
  });
});
