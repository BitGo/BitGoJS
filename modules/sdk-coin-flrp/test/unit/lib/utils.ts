import { coins, FlareNetwork } from '@bitgo/statics';
import * as assert from 'assert';
import { Utils } from '../../../src/lib/utils';

describe('Utils', function () {
  let utils: Utils;

  beforeEach(function () {
    utils = new Utils();
  });

  describe('recoverySignature', function () {
    it('should recover public key from valid signature', function () {
      const network = coins.get('flrp').network as FlareNetwork;
      const message = Buffer.from('hello world', 'utf8');
      const privateKey = Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex');

      // Create signature using the same private key
      const signature = utils.createSignature(network, message, privateKey);

      // Recover public key
      const recoveredPubKey = utils.recoverySignature(network, message, signature);

      assert.ok(recoveredPubKey instanceof Buffer);
      assert.strictEqual(recoveredPubKey.length, 33); // Should be compressed public key (33 bytes)
    });

    it('should recover same public key for same message and signature', function () {
      const network = coins.get('flrp').network as FlareNetwork;
      const message = Buffer.from('hello world', 'utf8');
      const privateKey = Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex');
      const signature = utils.createSignature(network, message, privateKey);

      const pubKey1 = utils.recoverySignature(network, message, signature);
      const pubKey2 = utils.recoverySignature(network, message, signature);

      assert.deepStrictEqual(pubKey1, pubKey2);
    });

    it('should recover public key that matches original key', function () {
      const network = coins.get('flrp').network as FlareNetwork;
      const message = Buffer.from('hello world', 'utf8');
      const privateKey = Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex');

      // Get original public key
      const { ecc } = require('@bitgo/secp256k1');
      const originalPubKey = Buffer.from(ecc.pointFromScalar(privateKey, true) as Uint8Array);

      // Create signature and recover public key
      const signature = utils.createSignature(network, message, privateKey);
      const recoveredPubKey = utils.recoverySignature(network, message, signature);

      // Convert both to hex strings for comparison
      assert.strictEqual(recoveredPubKey.toString('hex'), originalPubKey.toString('hex'));
    });

    it('should throw error for invalid signature', function () {
      const network = coins.get('flrp').network as FlareNetwork;
      const message = Buffer.from('hello world', 'utf8');
      const invalidSignature = Buffer.from('invalid signature', 'utf8');

      assert.throws(() => utils.recoverySignature(network, message, invalidSignature), /Failed to recover signature/);
    });

    it('should throw error for empty message', function () {
      const network = coins.get('flrp').network as FlareNetwork;
      const message = Buffer.alloc(0);
      const signature = Buffer.alloc(65); // Empty but valid length signature (65 bytes: 64 signature + 1 recovery param)

      assert.throws(() => utils.recoverySignature(network, message, signature), /Failed to recover signature/);
    });
  });
});
