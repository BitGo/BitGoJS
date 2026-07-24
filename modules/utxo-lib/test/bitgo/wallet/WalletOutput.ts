import * as assert from 'assert';

import { getScriptIdFromOutput, getPsbtBip32DerivationOutputUpdate } from '../../../src/bitgo/wallet/WalletOutput';
import { getDefaultWalletKeys } from '../../../src/testutil/keys';

describe('WalletOutput', function () {
  describe('getScriptIdFromOutput', function () {
    const rootWalletKeys = getDefaultWalletKeys();

    it('should extract script id from output created with getPsbtBip32DerivationOutputUpdate for non-taproot', function () {
      // Create a derived wallet keys for chain 10, index 20
      const walletKeys = rootWalletKeys.deriveForChainAndIndex(10, 20);

      // Get derivation data using the function we want to test against
      const update = getPsbtBip32DerivationOutputUpdate(rootWalletKeys, walletKeys, 'p2sh');

      // Extract script id from the output
      const scriptId = getScriptIdFromOutput(update);

      // Verify the extracted script id matches what we expect
      assert.strictEqual(scriptId.chain, 10);
      assert.strictEqual(scriptId.index, 20);
    });

    it('should extract script id from output created with getPsbtBip32DerivationOutputUpdate for taproot', function () {
      // Create a derived wallet keys for chain 11, index 22
      const walletKeys = rootWalletKeys.deriveForChainAndIndex(11, 22);

      // Create a mock payment object with redeems property
      const mockPayment = {
        redeems: [
          {
            output: Buffer.alloc(32),
            pubkeys: [walletKeys.triple[0].publicKey, walletKeys.triple[1].publicKey],
          },
        ],
      };

      // Get derivation data using the function we want to test against
      const update = getPsbtBip32DerivationOutputUpdate(rootWalletKeys, walletKeys, 'p2tr', mockPayment);

      // Extract script id from the output
      const scriptId = getScriptIdFromOutput(update);

      // Verify the extracted script id matches what we expect
      assert.strictEqual(scriptId.chain, 11);
      assert.strictEqual(scriptId.index, 22);
    });

    it('should extract script id from output with bip32Derivation', function () {
      const output = {
        bip32Derivation: [{ path: 'm/0/0' }, { path: 'm/0/0' }, { path: 'm/0/0' }],
      };

      const scriptId = getScriptIdFromOutput(output);
      assert.strictEqual(scriptId.chain, 0);
      assert.strictEqual(scriptId.index, 0);
    });

    it('should extract script id from output with tapBip32Derivation', function () {
      const output = {
        tapBip32Derivation: [{ path: 'm/0/123' }, { path: 'm/0/123' }, { path: 'm/0/123' }],
      };

      const scriptId = getScriptIdFromOutput(output);
      assert.strictEqual(scriptId.chain, 0);
      assert.strictEqual(scriptId.index, 123);
    });

    it('should throw error when output has both bip32Derivation and tapBip32Derivation', function () {
      const output = {
        bip32Derivation: [{ path: 'm/0/0' }],
        tapBip32Derivation: [{ path: 'm/0/0' }],
      };

      assert.throws(() => {
        getScriptIdFromOutput(output);
      }, /cannot get script id from output with both bip32Derivation and tapBip32Derivation/);
    });

    it('should throw error when output has neither bip32Derivation nor tapBip32Derivation', function () {
      const output = {};

      assert.throws(() => {
        getScriptIdFromOutput(output);
      }, /cannot get script id from output without bip32Derivation or tapBip32Derivation/);
    });

    it('should throw error when paths have mismatched chain', function () {
      const output = {
        bip32Derivation: [{ path: 'm/0/0' }, { path: 'm/1/0' }, { path: 'm/0/0' }],
      };

      assert.throws(() => {
        getScriptIdFromOutput(output);
      }, /chain mismatch/);
    });

    it('should throw error when paths have mismatched index', function () {
      const output = {
        bip32Derivation: [{ path: 'm/0/0' }, { path: 'm/0/1' }, { path: 'm/0/0' }],
      };

      assert.throws(() => {
        getScriptIdFromOutput(output);
      }, /index mismatch/);
    });

    it('should throw error when derivation array is empty', function () {
      const output = {
        bip32Derivation: [],
      };

      assert.throws(() => {
        getScriptIdFromOutput(output);
      }, /cannot fold empty script ids/);
    });
  });
});
