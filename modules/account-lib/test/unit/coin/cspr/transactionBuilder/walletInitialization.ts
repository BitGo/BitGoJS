import should from 'should';
import { register } from '../../../../../src/index';
import { TransactionBuilderFactory } from '../../../../../src/coin/cspr/';

describe('Casper Wallet Initialization Builder', () => {
  const factory = register('tcspr', TransactionBuilderFactory);
  it('get wallet init builder', () => {
    should.throws(() => {
      factory.getWalletInitializationBuilder();
    });
  });
});
