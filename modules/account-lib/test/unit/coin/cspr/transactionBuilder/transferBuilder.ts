import should from 'should';
import { register } from '../../../../../src/index';
import { TransactionBuilderFactory } from '../../../../../src/coin/cspr/';
import * as testData from '../../../../resources/cspr/cspr';

describe('HBAR Transfer Builder', () => {
  const factory = register('tcspr', TransactionBuilderFactory);
  it('transfer builder', () => {
    factory.getTransferBuilder().should.be.rejected;
  });
  it('wallet init builder', () => {
    factory.getWalletInitializationBuilder().should.be.rejected;
  });
});
