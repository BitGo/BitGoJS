import should from 'should';
import { register } from '../../../../../src/index';
import { TransactionBuilderFactory } from '../../../../../src/coin/avaxc/transactionBuilderFactory';

describe('AvaxC Wallet Initialization Builder', () => {
  const factory = register('tavaxc', TransactionBuilderFactory);
  it('get wallet init builder', () => {
    should.throws(() => {
      factory.getWalletInitializationBuilder();
    });
  });
});
