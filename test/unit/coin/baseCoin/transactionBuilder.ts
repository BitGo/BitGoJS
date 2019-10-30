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
});
