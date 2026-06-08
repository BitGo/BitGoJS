import assert from 'assert';
import should from 'should';
import { MessageOptions, MessageStandardType } from '@bitgo/sdk-core';
import { CantonSignTopologyMessage } from '../../../src/lib/messages/cantonSignTopology/cantonSignTopologyMessage';

// A real base64-encoded topology hash (multiHash from GenerateTopologyResponse).
const SAMPLE_TOPOLOGY_HASH = 'EiDQky+Uxo2zEwFp+JabeazILMMd7QR639/B/u+OGR+npg==';

function makeOptions(payload = SAMPLE_TOPOLOGY_HASH): MessageOptions {
  return { coinConfig: {} as any, payload };
}

describe('CantonSignTopologyMessage', function () {
  describe('constructor', function () {
    it('should set type to CANTON_SIGN_TOPOLOGY', function () {
      const msg = new CantonSignTopologyMessage(makeOptions());
      msg.getType().should.equal(MessageStandardType.CANTON_SIGN_TOPOLOGY);
    });

    it('should store the payload', function () {
      const msg = new CantonSignTopologyMessage(makeOptions());
      msg.getPayload().should.equal(SAMPLE_TOPOLOGY_HASH);
    });
  });

  describe('getSignablePayload', function () {
    it('should decode base64 topology hash to raw bytes', async function () {
      const msg = new CantonSignTopologyMessage(makeOptions());
      const signable = await msg.getSignablePayload();
      should.ok(Buffer.isBuffer(signable));
      assert.deepStrictEqual(signable as Buffer, Buffer.from(SAMPLE_TOPOLOGY_HASH, 'base64'));
    });

    it('should produce same byte structure as CANTON_SIGN_TRANSACTION for equivalent hash', async function () {
      // Both message types decode base64 → raw bytes identically; the type is the HSM format discriminator
      const hash = 'EiDQky+Uxo2zEwFp+JabeazILMMd7QR639/B/u+OGR+npg==';
      const msg = new CantonSignTopologyMessage({ coinConfig: {} as any, payload: hash });
      const signable = await msg.getSignablePayload();
      assert.deepStrictEqual(signable as Buffer, Buffer.from(hash, 'base64'));
    });

    it('should throw when payload is missing', async function () {
      const msg = new CantonSignTopologyMessage({ ...makeOptions(), payload: '' });
      await msg.getSignablePayload().should.be.rejectedWith('Message payload is missing');
    });
  });
});
