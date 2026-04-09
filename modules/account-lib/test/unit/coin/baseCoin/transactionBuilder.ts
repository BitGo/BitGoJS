import sinon from 'sinon';
import assert from 'assert';
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
    assert.throws(() => txBuilder.sign({ key: 'invalidKey' }));

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

  it('should verify validity window params', () => {
    const testTx = sinon.createStubInstance(TestTransaction);
    testTx.canSign.returns(true);
    txBuilder.from(testTx);
    txBuilder.build();
    let validityWindow;

    let params = {};
    should(() => txBuilder.getValidityWindow(params)).throwError(
      'Unit parameter must be specified as blockheight or timestamp',
    );

    params = {
      unit: 'wrongUnit',
    };
    should(() => txBuilder.getValidityWindow(params)).throwError(
      'Unit parameter must be specified as blockheight or timestamp',
    );

    params = {
      firstValid: 10,
      lastValid: 23,
      minDuration: 10,
      maxDuration: 20,
      unit: '',
    };
    should(() => txBuilder.getValidityWindow(params)).throwError(
      'Unit parameter must be specified as blockheight or timestamp',
    );

    params = {
      firstValid: 10,
      lastValid: 23,
      minDuration: 10,
      maxDuration: 5,
      unit: 'blockheight',
    };
    should(() => txBuilder.getValidityWindow(params)).throwError(
      `Expected maxDuration (5) to be grather than minDuration (10)`,
    );

    params = {
      firstValid: 10,
      lastValid: 11,
      minDuration: 10,
      maxDuration: 20,
      unit: 'timestamp',
    };
    validityWindow = txBuilder.getValidityWindow(params);
    validityWindow.should.have.properties(['firstValid', 'lastValid', 'minDuration', 'maxDuration', 'unit']);
    validityWindow.firstValid.should.be.equal(10);
    validityWindow.lastValid.should.be.equal(30);
    validityWindow.minDuration.should.be.equal(10);
    validityWindow.maxDuration.should.be.equal(20);
    validityWindow.unit.should.be.equal('timestamp');

    params = {
      firstValid: 10,
      lastValid: 23,
      minDuration: 10,
      maxDuration: 11,
      unit: 'blockheight',
    };
    validityWindow = txBuilder.getValidityWindow(params);
    validityWindow.should.have.properties(['firstValid', 'lastValid', 'minDuration', 'maxDuration', 'unit']);
    validityWindow.firstValid.should.be.equal(10);
    validityWindow.lastValid.should.be.equal(21);
    validityWindow.minDuration.should.be.equal(10);
    validityWindow.maxDuration.should.be.equal(11);
    validityWindow.unit.should.be.equal('blockheight');

    params = {
      unit: 'timestamp',
    };
    const dateNow = Date.now();
    validityWindow = txBuilder.getValidityWindow(params);
    validityWindow.should.have.properties(['firstValid', 'lastValid', 'minDuration', 'maxDuration', 'unit']);
    validityWindow.firstValid.should.be.greaterThanOrEqual(dateNow);
    validityWindow.lastValid.should.be.equal(validityWindow.firstValid + 31536000000);
    validityWindow.minDuration.should.be.equal(0);
    validityWindow.maxDuration.should.be.equal(31536000000);
    validityWindow.unit.should.be.equal('timestamp');

    params = {
      unit: 'blockheight',
    };
    validityWindow = txBuilder.getValidityWindow(params);
    validityWindow.should.have.properties(['firstValid', 'lastValid', 'minDuration', 'maxDuration', 'unit']);
    validityWindow.firstValid.should.be.equal(0);
    validityWindow.lastValid.should.be.equal(1000000);
    validityWindow.minDuration.should.be.equal(0);
    validityWindow.maxDuration.should.be.equal(1000000);
    validityWindow.unit.should.be.equal('blockheight');
  });
});
