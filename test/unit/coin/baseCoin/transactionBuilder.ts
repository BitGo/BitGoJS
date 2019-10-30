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

    txBuilder.from(testTx);
    txBuilder.sign({ key: ''  });

    sandbox.assert.calledOnce(txBuilder.validateKey);
  });

  it('should sign a transaction with an invalid signature', () => {
    let testTx = sinon.createStubInstance(TestTransaction);
    testTx.canSign.returns(false);

    txBuilder.from(testTx);
    should.throws(() => txBuilder.sign({ key: ''  }));

    sandbox.assert.calledOnce(txBuilder.validateKey);
  });
});
