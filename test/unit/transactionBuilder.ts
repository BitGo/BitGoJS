import { TransactionBuilder } from '../../src/';
import { TestCoin } from '../resources/testCoin';
import { CoinFactory } from "../../src/coinFactory";
import sinon = require('sinon');
import {TestTransaction} from "../resources/testTransaction";
import * as should from 'should';

describe('Transaction builder', () => {
  let txBuilder: TransactionBuilder;
  let testCoin;
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    testCoin = sinon.createStubInstance(TestCoin);
    sandbox.stub(CoinFactory, 'getCoin').returns(testCoin);
    txBuilder = new TransactionBuilder({ coinName: 'test' });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should parse a raw transaction that is valid', () => {
    txBuilder.from(null);

    sandbox.assert.calledOnce(testCoin.parseTransaction);
  });

  it('should sign a transaction that is valid', () => {
    let testTx = sinon.createStubInstance(TestTransaction);
    testTx.canSign.returns(true);
    testCoin.parseTransaction.returns(testTx);

    txBuilder.from(null);
    txBuilder.sign({ key: ''  });

    sandbox.assert.calledOnce(testCoin.validateKey);
  });

  it('should sign a transaction with an invalid signature', () => {
    let testTx = sinon.createStubInstance(TestTransaction);
    testTx.canSign.returns(false);
    testCoin.parseTransaction.returns(testTx);

    txBuilder.from(null);
    should.throws(() => txBuilder.sign({ key: ''  }));

    sandbox.assert.calledOnce(testCoin.validateKey);
  });

  it('should build an existing transaction that is valid', () => {
    txBuilder.from(null);
    txBuilder.build();

    sandbox.assert.calledOnce(testCoin.buildTransaction);
  });

  it('should extend a transaction validTo field', () => {
    txBuilder.from(null);
    txBuilder.extendValidTo(10000);
    txBuilder.build();

    sandbox.assert.calledOnce(testCoin.extendTransaction);
    sandbox.assert.calledOnce(testCoin.buildTransaction);
  });
});
