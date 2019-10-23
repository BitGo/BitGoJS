import * as should from 'should';
import { TransactionBuilder } from '../../src/transactionBuilder';
import { CoinFactory } from '../../src/coinFactory';
import BigNumber from 'bignumber.js';
import { TransactionType } from '../../src/coin/baseCoin/enum';
import { NetworkType } from '@bitgo/statics';
import { TestCoin, Address } from '../../src/coin/testcoin';

describe('Transaction builder', () => {
  let txBuilder: TransactionBuilder;
  let coin: TestCoin;

  before(() => {
    coin = CoinFactory.getCoin('test') as TestCoin;
    txBuilder = new TransactionBuilder({ coin });
  });

  it('should parse a raw transaction that is valid', () => {
    const validTx = { isValid: () => true, rawTx: null, tx: null, transactionType: TransactionType.Send };
    coin.setVariable({ parseTransaction: validTx });

    txBuilder.from(null, TransactionType.Send);
  });

  it('should sign a transaction that is valid', () => {
    const validTx = { isValid: () => true, rawTx: null, tx: null, transactionType: TransactionType.Send };

    coin.setVariable({ parseTransaction: validTx });

    txBuilder.from(null, TransactionType.Send);
    txBuilder.sign({ key: ''  }, { address: 'fakeAddress' });
  });

  it('should build an existing transaction that is valid', () => {
    const validTx = { isValid: () => true, rawTx: null, tx: null, transactionType: TransactionType.Send };
    coin.setVariable({ buildTransaction: validTx, validateAddress: true });

    txBuilder.from(null, TransactionType.Send);
    txBuilder.build();
  });
});
