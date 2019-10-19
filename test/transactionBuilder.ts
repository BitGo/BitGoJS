import * as should from 'should';
import TransactionBuilder from '../src/transactionBuilder';
import TestCoin from '../src/coin/test';
import { Network, TransactionType } from '../src/index';
import BigNumber from 'bignumber.js';

describe('Transaction builder', () => {
  let txBuilder: TransactionBuilder;
  let coin: TestCoin;

  before(() => {
    coin = new TestCoin(Network.Test);
    txBuilder = new TransactionBuilder(coin);
  });

  it('should add an destination address that is valid', () => {
    coin.setVariable({ validateAddress: true });

    txBuilder.addDestination('fakeAddress', new BigNumber(0));
  });

  it('should add an from address that is valid', () => {
    coin.setVariable({ validateAddress: true });

    txBuilder.addFrom('fakeAddress');
  });

  it('should parse a raw transaction that is valid', () => {
    const validTx = { isValid: () => true, rawTx: null, parsedTx: null, transactionType: TransactionType.Send };
    coin.setVariable({ parseTransaction: validTx });

    txBuilder.from(null, TransactionType.Send);
  });

  it('should sign a transaction that is valid', () => {
    const validTx = { isValid: () => true, rawTx: null, parsedTx: null, transactionType: TransactionType.Send };
    coin.setVariable({ sign: validTx });

    txBuilder.from(null, TransactionType.Send);
    txBuilder.sign({ isValid: () => true }, 'fakeAddress');
  });

  it('should build an existing transaction that is valid', () => {
    const validTx = { isValid: () => true, rawTx: null, parsedTx: null, transactionType: TransactionType.Send };
    coin.setVariable({ buildTransaction: validTx });

    txBuilder.from(null, TransactionType.Send);
    txBuilder.build();
  });


});