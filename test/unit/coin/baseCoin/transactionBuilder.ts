import sinon from 'sinon';
import should from 'should';
import { TestTransactionBuilder } from '../../../resources/testTransactionBuilder';
import { TestTransaction } from '../../../resources/testTransaction';

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
    const testTx = sinon.createStubInstance(TestTransaction);
    testTx.canSign.returns(true);
    const validateKey = sinon.spy(txBuilder, 'validateKey');

    txBuilder.from(testTx);
    txBuilder.sign({ key: 'validKey' });

    sandbox.assert.calledOnce(validateKey);
  });

  it('should sign a transaction with an invalid signature', () => {
    const testTx = sinon.createStubInstance(TestTransaction);
    testTx.canSign.returns(false);
    const validateKey = sinon.spy(txBuilder, 'validateKey');

    txBuilder.from(testTx);
    should.throws(() => txBuilder.sign({ key: 'invalidKey' }));

    sandbox.assert.calledOnce(validateKey);
  });

  it('should parse a valid transaction', () => {
    const testTx = sinon.createStubInstance(TestTransaction);
    testTx.canSign.returns(true);
    const validateRawTransaction = sinon.spy(txBuilder, 'validateRawTransaction');
    const fromImplementation = sinon.spy(txBuilder, 'fromImplementation');

    txBuilder.from(testTx);

    sandbox.assert.calledOnce(validateRawTransaction);
    sandbox.assert.calledOnce(fromImplementation);
  });

  it('should build a valid transaction', () => {
    const testTx = sinon.createStubInstance(TestTransaction);
    testTx.canSign.returns(true);
    const validateTransaction = sinon.spy(txBuilder, 'validateTransaction');
    const buildImplementation = sinon.spy(txBuilder, 'buildImplementation');

    txBuilder.from(testTx);
    txBuilder.build();

    sandbox.assert.calledOnce(validateTransaction);
    sandbox.assert.calledOnce(buildImplementation);
  });
});
