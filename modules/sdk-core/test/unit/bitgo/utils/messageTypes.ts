import * as should from 'should';
import { MessageStandardType, BroadcastableMessage } from '../../../../src/bitgo';

describe('Message Types', () => {
  describe('MessageStandardType', () => {
    it('should define supported message standard types', () => {
      should.exist(MessageStandardType.UNKNOWN);
      should.exist(MessageStandardType.EIP191);

      should.equal(MessageStandardType.UNKNOWN, 'UNKNOWN');
      should.equal(MessageStandardType.EIP191, 'EIP191');
    });
  });

  describe('BroadcastableMessage', () => {
    it('should validate interface structure', () => {
      const message: BroadcastableMessage = {
        type: MessageStandardType.EIP191,
        payload: 'Test payload',
        signatures: ['signature1', 'signature2'],
        signers: ['signer1', 'signer2'],
        metadata: { chainId: 1 },
        signablePayload: Buffer.from('signable payload'),
      };

      should.equal(message.type, MessageStandardType.EIP191);
      should.equal(message.payload, 'Test payload');
      should.deepEqual(message.signatures, ['signature1', 'signature2']);
      should.deepEqual(message.signers, ['signer1', 'signer2']);
      should.deepEqual(message.metadata, { chainId: 1 });
      should.deepEqual(message.signablePayload, Buffer.from('signable payload'));
    });

    it('should allow optional fields to be undefined', () => {
      const message: BroadcastableMessage = {
        type: MessageStandardType.UNKNOWN,
        payload: 'Minimal message',
        signatures: [],
        signers: [],
      };

      should.not.exist(message.metadata);
      should.not.exist(message.signablePayload);
    });
  });
});
