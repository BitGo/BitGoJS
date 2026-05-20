import 'should';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { register, MonToken } from '../../src';

describe('Mon Token:', function () {
  let bitgo: TestBitGoAPI;
  let monTokenCoin;
  const tokenName = 'mon:usdc';

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'prod' });
    register(bitgo);
    bitgo.initializeTestVars();
    monTokenCoin = bitgo.coin(tokenName);
  });

  it('should return constants', function () {
    monTokenCoin.getChain().should.equal('mon:usdc');
    monTokenCoin.getBaseChain().should.equal('mon');
    monTokenCoin.getFullName().should.equal('Mon Token');
    monTokenCoin.getBaseFactor().should.equal(1e6);
    monTokenCoin.type.should.equal(tokenName);
    monTokenCoin.name.should.equal('Monad USDC');
    monTokenCoin.coin.should.equal('mon');
    monTokenCoin.network.should.equal('Mainnet');
    monTokenCoin.decimalPlaces.should.equal(6);
  });

  describe('Token Registration and TransactionBuilder', function () {
    const mainnetTokens = ['mon:usdc', 'mon:wmon'];

    describe('Mainnet tokens', function () {
      mainnetTokens.forEach((tokenName) => {
        it(`${tokenName} should be registered as MonToken`, function () {
          const token = bitgo.coin(tokenName);
          token.should.be.instanceOf(MonToken);
        });

        it(`${tokenName} should create TransactionBuilder without error`, function () {
          const token = bitgo.coin(tokenName) as MonToken;
          // @ts-expect-error - accessing protected method for testing
          (() => token.getTransactionBuilder()).should.not.throw();
        });

        it(`${tokenName} should use Mon-specific TransactionBuilder`, function () {
          const token = bitgo.coin(tokenName) as MonToken;
          // @ts-expect-error - accessing protected method for testing
          const builder = token.getTransactionBuilder();
          builder.should.have.property('_common');
          builder.constructor.name.should.equal('TransactionBuilder');
        });

        it(`${tokenName} should not throw "Cannot use common sdk module" error`, function () {
          const token = bitgo.coin(tokenName) as MonToken;
          let errorThrown = false;
          let errorMessage = '';

          try {
            // @ts-expect-error - accessing protected method for testing
            const builder = token.getTransactionBuilder();
            // Try to use the builder to ensure it's fully functional
            // @ts-expect-error - type expects TransactionType enum
            builder.type('Send');
          } catch (e) {
            errorThrown = true;
            errorMessage = (e as Error).message;
          }

          errorThrown.should.equal(false);
          errorMessage.should.not.match(/Cannot use common sdk module/);
        });

        it(`${tokenName} should build transaction successfully`, async function () {
          const token = bitgo.coin(tokenName) as MonToken;
          // @ts-expect-error - accessing protected method for testing
          const builder = token.getTransactionBuilder();

          // Set up a basic transfer transaction
          // @ts-expect-error - type expects TransactionType enum
          builder.type('Send');
          builder.fee({
            fee: '10000000000',
            gasLimit: '100000',
          });
          builder.counter(1);
          builder.contract(token.tokenContractAddress);

          // Verify the builder is correctly configured
          builder.should.have.property('_type', 'Send');
          builder.should.have.property('_fee');
          builder.should.have.property('_counter', 1);
        });
      });
    });

    it('should verify all Mon tokens use MonToken class, not EthLikeErc20Token', function () {
      mainnetTokens.forEach((tokenName) => {
        const token = bitgo.coin(tokenName);
        token.should.be.instanceOf(MonToken);
        token.constructor.name.should.equal('MonToken');
        token.constructor.name.should.not.equal('EthLikeErc20Token');
      });
    });
  });
});
