import assert from 'assert';

import {
  BIP322MessageBroadcastable,
  deserializeBIP322BroadcastableMessage,
  serializeBIP322BroadcastableMessage,
} from '../../src/transaction/bip322';

describe('BIP322', function () {
  describe('BIP322MessageBroadcastable', () => {
    it('should serialize and deserialize correctly', () => {
      const message: BIP322MessageBroadcastable = {
        txHex: '010203',
        messageInfo: [
          {
            address: 'someAddress',
            message: 'someMessage',
            pubkeys: ['pubkey1', 'pubkey2'],
            scriptType: 'p2sh',
          },
        ],
      };

      const serialized = serializeBIP322BroadcastableMessage(message);
      const deserialized = deserializeBIP322BroadcastableMessage(serialized);
      assert.deepStrictEqual(deserialized, message);
    });

    it('should fail if there is an unsupported script type', function () {
      const message = {
        txHex: '010203',
        messageInfo: [
          {
            address: 'someAddress',
            message: 'someMessage',
            pubkeys: ['pubkey1', 'pubkey2'],
            scriptType: 'unsupported',
          },
        ],
      } as unknown as BIP322MessageBroadcastable;

      const serialized = serializeBIP322BroadcastableMessage(message);
      assert.throws(() => {
        deserializeBIP322BroadcastableMessage(serialized);
      });
    });
  });
});
