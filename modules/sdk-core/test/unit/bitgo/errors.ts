import should from 'should';
import {
  TxIntentMismatchError,
  TxIntentMismatchRecipientError,
  TxIntentMismatchContractError,
  TxIntentMismatchApprovalError,
  MismatchedRecipient,
  ContractDataPayload,
  TokenApproval,
} from '../../../src/bitgo/errors';

describe('Transaction Intent Mismatch Errors', () => {
  const mockTransactionId = '0x1234567890abcdef';
  const mockTxParams: any[] = [
    { address: '0xrecipient1', amount: '1000000000000000000' },
    { address: '0xrecipient2', amount: '2000000000000000000' },
  ];
  const mockTxHex = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  describe('TxIntentMismatchError', () => {
    it('should create base transaction intent mismatch error with all required properties', () => {
      const message = 'Transaction does not match user intent';
      const error = new TxIntentMismatchError(message, mockTransactionId, mockTxParams, mockTxHex);

      should.exist(error);
      should.equal(error.message, message);
      should.equal(error.name, 'TxIntentMismatchError');
      should.equal(error.id, mockTransactionId);
      should.deepEqual(error.txParams, mockTxParams);
      should.equal(error.txHex, mockTxHex);
    });

    it('should be an instance of Error', () => {
      const error = new TxIntentMismatchError('Test message', mockTransactionId, mockTxParams, mockTxHex);

      should(error).be.instanceOf(Error);
    });
  });

  describe('TxIntentMismatchRecipientError', () => {
    it('should create recipient intent mismatch error with mismatched recipients', () => {
      const message = 'Transaction recipients do not match user intent';
      const mismatchedRecipients: MismatchedRecipient[] = [
        { address: '0xexpected1', amount: '1000' },
        { address: '0xexpected2', amount: '2000' },
      ];

      const error = new TxIntentMismatchRecipientError(
        message,
        mockTransactionId,
        mockTxParams,
        mockTxHex,
        mismatchedRecipients
      );

      should.exist(error);
      should.equal(error.message, message);
      should.equal(error.name, 'TxIntentMismatchRecipientError');
      should.equal(error.id, mockTransactionId);
      should.deepEqual(error.txParams, mockTxParams);
      should.equal(error.txHex, mockTxHex);
      should.deepEqual(error.mismatchedRecipients, mismatchedRecipients);
    });

    it('should be an instance of TxIntentMismatchError', () => {
      const error = new TxIntentMismatchRecipientError('Test message', mockTransactionId, mockTxParams, mockTxHex, []);

      should(error).be.instanceOf(TxIntentMismatchError);
      should(error).be.instanceOf(Error);
    });
  });

  describe('TxIntentMismatchContractError', () => {
    it('should create contract intent mismatch error with mismatched data payload', () => {
      const message = 'Contract interaction does not match user intent';
      const mismatchedDataPayload: ContractDataPayload = {
        address: '0xcontract123',
        rawContractPayload: '0xabcdef',
        decodedContractPayload: { method: 'transfer', params: ['0xrecipient', '1000'] },
      };

      const error = new TxIntentMismatchContractError(
        message,
        mockTransactionId,
        mockTxParams,
        mockTxHex,
        mismatchedDataPayload
      );

      should.exist(error);
      should.equal(error.message, message);
      should.equal(error.name, 'TxIntentMismatchContractError');
      should.equal(error.id, mockTransactionId);
      should.deepEqual(error.txParams, mockTxParams);
      should.equal(error.txHex, mockTxHex);
      should.deepEqual(error.mismatchedDataPayload, mismatchedDataPayload);
    });

    it('should be an instance of TxIntentMismatchError', () => {
      const error = new TxIntentMismatchContractError('Test message', mockTransactionId, mockTxParams, mockTxHex, {
        address: '0xtest',
        rawContractPayload: '0x',
        decodedContractPayload: {},
      });

      should(error).be.instanceOf(TxIntentMismatchError);
      should(error).be.instanceOf(Error);
    });
  });

  describe('TxIntentMismatchApprovalError', () => {
    it('should create approval intent mismatch error with token approval details', () => {
      const message = 'Token approval does not match user intent';
      const tokenApproval: TokenApproval = {
        tokenName: 'TestToken',
        tokenAddress: '0xtoken123',
        authorizingAmount: { type: 'unlimited' },
        authorizingAddress: '0xspender456',
      };

      const error = new TxIntentMismatchApprovalError(
        message,
        mockTransactionId,
        mockTxParams,
        mockTxHex,
        tokenApproval
      );

      should.exist(error);
      should.equal(error.message, message);
      should.equal(error.name, 'TxIntentMismatchApprovalError');
      should.equal(error.id, mockTransactionId);
      should.deepEqual(error.txParams, mockTxParams);
      should.equal(error.txHex, mockTxHex);
      should.deepEqual(error.tokenApproval, tokenApproval);
    });

    it('should be an instance of TxIntentMismatchError', () => {
      const error = new TxIntentMismatchApprovalError('Test message', mockTransactionId, mockTxParams, mockTxHex, {
        tokenAddress: '0xtoken',
        authorizingAmount: { type: 'limited', amount: 1000 },
        authorizingAddress: '0xspender',
      });

      should(error).be.instanceOf(TxIntentMismatchError);
      should(error).be.instanceOf(Error);
    });
  });

  describe('Error inheritance and properties', () => {
    it('should maintain proper inheritance chain', () => {
      const baseError = new TxIntentMismatchError('Base error', mockTransactionId, mockTxParams, mockTxHex);
      const recipientError = new TxIntentMismatchRecipientError(
        'Recipient error',
        mockTransactionId,
        mockTxParams,
        mockTxHex,
        []
      );
      const contractError = new TxIntentMismatchContractError(
        'Contract error',
        mockTransactionId,
        mockTxParams,
        mockTxHex,
        { address: '0xtest', rawContractPayload: '0x', decodedContractPayload: {} }
      );
      const approvalError = new TxIntentMismatchApprovalError(
        'Approval error',
        mockTransactionId,
        mockTxParams,
        mockTxHex,
        {
          tokenAddress: '0xtoken',
          authorizingAmount: { type: 'limited', amount: 1000 },
          authorizingAddress: '0xspender',
        }
      );

      // All should be instances of Error
      should(baseError).be.instanceOf(Error);
      should(recipientError).be.instanceOf(Error);
      should(contractError).be.instanceOf(Error);
      should(approvalError).be.instanceOf(Error);

      // All should be instances of TxIntentMismatchError
      should(recipientError).be.instanceOf(TxIntentMismatchError);
      should(contractError).be.instanceOf(TxIntentMismatchError);
      should(approvalError).be.instanceOf(TxIntentMismatchError);
    });

    it('should preserve stack trace', () => {
      const error = new TxIntentMismatchError('Test error', mockTransactionId, mockTxParams, mockTxHex);

      should.exist(error.stack);
      should(error.stack).be.a.String();
      should(error.stack).containEql('TxIntentMismatchError');
    });
  });
});
