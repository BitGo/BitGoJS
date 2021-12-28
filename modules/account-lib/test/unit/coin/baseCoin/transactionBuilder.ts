import sinon from 'sinon';
import should from 'should';
import { TestTransactionBuilder } from '../../../resources/testTransactionBuilder';
import { TestTransaction } from '../../../resources/testTransaction';
import { ValidityWindow } from '../../../../src/coin/baseCoin/iface';

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

  describe('Validate validity windows', () => {
    const currentDate = new Date().getTime();
    const defaultFirstValid = currentDate + 1000;
    let validityWindow: ValidityWindow;
    describe('should validate a valid validity window', () => {
      it('a complete validity window', () => {
        validityWindow = {
          firstValid: currentDate + 1000,
          lastValid: currentDate + 30000,
          minDuration: 10000,
          maxDuration: 50000,
          unit: 'timestamp',
        };
        const validatedValidityWindow = txBuilder.validateValidityWindows(validityWindow, defaultFirstValid);
        validatedValidityWindow.should.deepEqual(validityWindow);
      });

      it('a validity window without first valid', () => {
        validityWindow = {
          lastValid: currentDate + 30000,
          minDuration: 10000,
          maxDuration: 50000,
          unit: 'timestamp',
        };
        const validatedValidityWindow = txBuilder.validateValidityWindows(validityWindow, defaultFirstValid);
        validityWindow.firstValid = defaultFirstValid;
        validatedValidityWindow.should.deepEqual(validityWindow);
      });

      it('a validity window without last valid', () => {
        validityWindow = {
          firstValid: currentDate + 1000,
          minDuration: 10000,
          maxDuration: 50000,
          unit: 'timestamp',
        };
        const validatedValidityWindow = txBuilder.validateValidityWindows(validityWindow, defaultFirstValid);
        validityWindow.lastValid = currentDate + 1000 + 10000; // first valid plus min duration
        validatedValidityWindow.should.deepEqual(validityWindow);
      });
    });

    describe('should validate an invalid validity window', () => {
      it('last valid less than first valid', () => {
        validityWindow = {
          firstValid: currentDate + 1000,
          lastValid: currentDate + 999,
          minDuration: 10000,
          maxDuration: 50000,
          unit: 'timestamp',
        };
        should.throws(
          () => txBuilder.validateValidityWindows(validityWindow, defaultFirstValid),
          (e) => e.message === 'First valid should be less than last valid',
        );
      });

      it('missing min duration', () => {
        validityWindow = {
          firstValid: currentDate + 1000,
          lastValid: currentDate + 30000,
          maxDuration: 50000,
          unit: 'timestamp',
        };
        should.throws(
          () => txBuilder.validateValidityWindows(validityWindow, defaultFirstValid),
          (e) => e.message === 'Missing fields max or min duration',
        );
      });

      it('missing max duration', () => {
        validityWindow = {
          firstValid: currentDate + 1000,
          lastValid: currentDate + 30000,
          minDuration: 10000,
          unit: 'timestamp',
        };
        should.throws(
          () => txBuilder.validateValidityWindows(validityWindow, defaultFirstValid),
          (e) => e.message === 'Missing fields max or min duration',
        );
      });

      it('min duration less than or equal to max duration', () => {
        validityWindow = {
          firstValid: currentDate + 1000,
          lastValid: currentDate + 999,
          minDuration: 10001,
          maxDuration: 10000,
          unit: 'timestamp',
        };
        should.throws(
          () => txBuilder.validateValidityWindows(validityWindow, defaultFirstValid),
          (e) => e.message === 'Max duration should be grater than min duration',
        );
        validityWindow.minDuration = 10000;
        should.throws(
          () => txBuilder.validateValidityWindows(validityWindow, defaultFirstValid),
          (e) => e.message === 'Max duration should be grater than min duration',
        );
      });

      it('first valid grater than or equal to last valid', () => {
        validityWindow = {
          firstValid: currentDate + 1001,
          lastValid: currentDate + 1000,
          minDuration: 10000,
          maxDuration: 50000,
          unit: 'timestamp',
        };
        should.throws(
          () => txBuilder.validateValidityWindows(validityWindow, defaultFirstValid),
          (e) => e.message === 'First valid should be less than last valid',
        );
        validityWindow.firstValid = currentDate + 1000;
        should.throws(
          () => txBuilder.validateValidityWindows(validityWindow, defaultFirstValid),
          (e) => e.message === 'First valid should be less than last valid',
        );
      });

      it('first valid plus min duration grater than last valid', () => {
        validityWindow = {
          firstValid: currentDate + 1000,
          lastValid: currentDate + 2000,
          minDuration: 10000,
          maxDuration: 50000,
          unit: 'timestamp',
        };
        should.throws(
          () => txBuilder.validateValidityWindows(validityWindow, defaultFirstValid),
          (e) => e.message === 'First valid plus min duration should be less than or equal to last valid',
        );
      });

      it('first valid plus max duration less than last valid', () => {
        validityWindow = {
          firstValid: currentDate + 1000,
          lastValid: currentDate + 52000,
          minDuration: 10000,
          maxDuration: 50000,
          unit: 'timestamp',
        };
        should.throws(
          () => txBuilder.validateValidityWindows(validityWindow, defaultFirstValid),
          (e) => e.message === 'First valid plus max duration should be grater than or equal to last valid',
        );
      });
    });
  });
});
