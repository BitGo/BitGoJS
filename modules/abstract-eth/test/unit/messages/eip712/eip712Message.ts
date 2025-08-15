import 'should';
import sinon from 'sinon';
import { EIP712Message } from '../../../../src/';
import { eip712Fixtures as fixtures } from '../fixtures';
import { MessageStandardType, serializeSignatures } from '@bitgo/sdk-core';

describe('EIP712 Message', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('should initialize with the correct type', () => {
    const message = new EIP712Message({
      coinConfig: fixtures.coin,
      payload: JSON.stringify(fixtures.messages.helloBob.message),
    });

    message.getType().should.equal(MessageStandardType.EIP712);
  });

  it('should generate the correct payload', async () => {
    const message = new EIP712Message({
      coinConfig: fixtures.coin,
      payload: JSON.stringify(fixtures.messages.helloBob.message),
    });

    const signablePayload = await message.getSignablePayload();
    signablePayload.toString('hex').should.equal(fixtures.messages.helloBob.hex);
  });

  it('should generate the correct payload for recursive types', async () => {
    const message = new EIP712Message({
      coinConfig: fixtures.coin,
      payload: JSON.stringify(fixtures.messages.recursive.message),
    });

    const signablePayload = await message.getSignablePayload();
    signablePayload.toString('hex').should.equal(fixtures.messages.recursive.hex);
  });

  describe('Broadcast Format', () => {
    it('should convert to broadcast format correctly', async () => {
      const message = new EIP712Message({
        coinConfig: fixtures.coin,
        payload: JSON.stringify(fixtures.messages.helloBob.message),
        signatures: [fixtures.eip712.signature],
        signers: [fixtures.eip712.signer],
        metadata: fixtures.eip712.metadata,
      });

      const broadcastFormat = await message.toBroadcastFormat();

      const expectedSerializedSignatures = serializeSignatures([fixtures.eip712.signature]);
      broadcastFormat.type.should.equal(MessageStandardType.EIP712);
      JSON.parse(broadcastFormat.payload).should.deepEqual(fixtures.messages.helloBob.message);
      broadcastFormat.serializedSignatures?.should.deepEqual(expectedSerializedSignatures);
      broadcastFormat.metadata!.should.deepEqual(fixtures.eip712.metadata);
      broadcastFormat.signablePayload!.should.equal(
        'GQHyzuN1+kK0IUOAQCX8RJ3q/VDMAxyiV+CxlKZQqRIJD8UsDuXYQmRHGAYpCj8sTOz8VJBia/kS0B8kDXonSzce'
      );
    });

    it('should convert to broadcast string correctly', async () => {
      const message = new EIP712Message({
        coinConfig: fixtures.coin,
        payload: JSON.stringify(fixtures.messages.helloBob.message),
        signatures: [fixtures.eip712.signature],
        signers: [fixtures.eip712.signer],
        metadata: fixtures.eip712.metadata,
      });

      const broadcastHex = await message.toBroadcastString();
      const broadcastString = Buffer.from(broadcastHex, 'hex').toString();
      const parsedBroadcast = JSON.parse(broadcastString);
      const expectedSerializedSignatures = serializeSignatures([fixtures.eip712.signature]);

      parsedBroadcast.type.should.equal(MessageStandardType.EIP712);
      JSON.parse(parsedBroadcast.payload).should.deepEqual(fixtures.messages.helloBob.message);
      parsedBroadcast.serializedSignatures.should.deepEqual(expectedSerializedSignatures);
      parsedBroadcast.signers.should.deepEqual([fixtures.eip712.signer]);
      parsedBroadcast.metadata.should.deepEqual(fixtures.eip712.metadata);
    });
  });
});
