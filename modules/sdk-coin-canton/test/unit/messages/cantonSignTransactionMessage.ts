import assert from 'assert';
import should from 'should';
import { MessageOptions, MessageStandardType } from '@bitgo/sdk-core';
import { CantonSignTransactionMessage } from '../../../src/lib/messages/cantonSignTransaction/cantonSignTransactionMessage';

// A real base64-encoded preparedTransactionHash from Canton's prepareSubmission response.
// This is exactly what Canton's signTransaction sends as txHash.
const SAMPLE_TX_HASH = '7Ey4Q2TqWQcK1eAl6p15UT02M4mx92Tvo9ifvtzlm5o=';

function makeOptions(payload = SAMPLE_TX_HASH): MessageOptions {
  return { coinConfig: {} as any, payload };
}

describe('CantonSignTransactionMessage', function () {
  describe('constructor', function () {
    it('should set type to CANTON_SIGN_TRANSACTION', function () {
      const msg = new CantonSignTransactionMessage(makeOptions());
      msg.getType().should.equal(MessageStandardType.CANTON_SIGN_TRANSACTION);
    });

    it('should store the payload', function () {
      const msg = new CantonSignTransactionMessage(makeOptions());
      msg.getPayload().should.equal(SAMPLE_TX_HASH);
    });
  });

  describe('getSignablePayload', function () {
    it('should decode base64 txHash to raw bytes', async function () {
      const msg = new CantonSignTransactionMessage(makeOptions());
      const signable = await msg.getSignablePayload();
      should.ok(Buffer.isBuffer(signable));
      // Decoding the base64 txHash and re-encoding should round-trip
      assert.deepStrictEqual(signable as Buffer, Buffer.from(SAMPLE_TX_HASH, 'base64'));
    });

    it('should produce the same bytes as the transaction signablePayload in normal tx flow', async function () {
      // In the normal tx flow: Buffer.from(preparedTransactionHash, 'base64')
      // txHash IS the preparedTransactionHash — they must be identical
      const msg = new CantonSignTransactionMessage(makeOptions());
      const signable = await msg.getSignablePayload();
      assert.deepStrictEqual(signable as Buffer, Buffer.from(SAMPLE_TX_HASH, 'base64'));
    });

    it('should throw when payload is missing', async function () {
      const msg = new CantonSignTransactionMessage({ ...makeOptions(), payload: '' });
      await msg.getSignablePayload().should.be.rejectedWith('Message payload is missing');
    });
  });
});
