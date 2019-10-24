import { TransactionBuilder } from '../../src/';
import { TestCoin } from '../resources/testCoin';
import { CoinFactory } from "../../src/coinFactory";
import sinon = require('sinon');

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
    txBuilder.from(null);
    txBuilder.sign({ key: ''  }, { address: 'fakeAddress' });

    sandbox.assert.calledOnce(testCoin.validateAddress);
    sandbox.assert.calledOnce(testCoin.validateKey);
  });

  it('should build an existing transaction that is valid', () => {
    txBuilder.from(null);
    txBuilder.build();

    sandbox.assert.calledOnce(testCoin.buildTransaction);
  });
});
