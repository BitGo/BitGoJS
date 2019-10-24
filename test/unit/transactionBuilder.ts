import { TransactionBuilder } from '../../src/';
import { TestCoin } from '../../src/coin/testcoin';

describe('Transaction builder', () => {
  let txBuilder: TransactionBuilder;
  let coin: TestCoin;

  before(() => {
    txBuilder = new TransactionBuilder({ coinName: 'test' });
  });

  it('should parse a raw transaction that is valid', () => {
    txBuilder.from(null);
  });

  it('should sign a transaction that is valid', () => {
    txBuilder.from(null);
    txBuilder.sign({ key: ''  }, { address: 'fakeAddress' });
  });

  it('should build an existing transaction that is valid', () => {
    txBuilder.from(null);
    txBuilder.build();
  });
});
