import { TestTransactionBuilder } from '../../../resources/testTransactionBuilder';
import sinon = require('sinon');
import { TestTransaction } from "../../../resources/testTransaction";
import * as should from 'should';

describe('Transaction builder', () => {
  let txBuilder;
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    txBuilder = new TestTransactionBuilder();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should sign a transaction that is valid', () => {
    let testTx = sinon.createStubInstance(TestTransaction);
    testTx.canSign.returns(true);
    let validateKey = sinon.spy(txBuilder, 'validateKey');

    txBuilder.from(testTx);
    txBuilder.sign({ key: 'validKey'  });

    sandbox.assert.calledOnce(validateKey);
  });

  it('should sign a transaction with an invalid signature', () => {
    let testTx = sinon.createStubInstance(TestTransaction);
    testTx.canSign.returns(false);
    let validateKey = sinon.spy(txBuilder, 'validateKey');

    txBuilder.from(testTx);
    should.throws(() => txBuilder.sign({ key: 'invalidKey'  }));

    sandbox.assert.calledOnce(validateKey);
  });

  it('should parse a valid transaction', () => {
    let testTx = sinon.createStubInstance(TestTransaction);
    testTx.canSign.returns(true);
    let validateRawTransaction = sinon.spy(txBuilder, 'validateRawTransaction');
    let fromImplementation = sinon.spy(txBuilder, 'fromImplementation');

    txBuilder.from(testTx);

    sandbox.assert.calledOnce(validateRawTransaction);
    sandbox.assert.calledOnce(fromImplementation);
  });

  it('should build a valid transaction', () => {
    let testTx = sinon.createStubInstance(TestTransaction);
    testTx.canSign.returns(true);
    let validateTransaction = sinon.spy(txBuilder, 'validateTransaction');
    let buildImplementation = sinon.spy(txBuilder, 'buildImplementation');

    txBuilder.from(testTx);
    txBuilder.build();

    sandbox.assert.calledOnce(validateTransaction);
    sandbox.assert.calledOnce(buildImplementation);
  });
});
