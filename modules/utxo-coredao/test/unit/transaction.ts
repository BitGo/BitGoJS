import * as assert from 'assert';
import {
  CORE_DAO_MAINNET_CHAIN_ID,
  CORE_DAO_SATOSHI_PLUS_IDENTIFIER,
  createCoreDaoOpReturnOutputScript,
} from '../../src';
import { testutil } from '@bitgo/utxo-lib';

describe('OP_RETURN', function () {
  const validVersion = 2;
  const validChainId = CORE_DAO_MAINNET_CHAIN_ID;
  // random 20 byte buffers
  const validDelegator = Buffer.alloc(20, testutil.getKey('wasm-possum').publicKey);
  const validValidator = Buffer.alloc(20, testutil.getKey('possum-wasm').publicKey);
  const validFee = 1;
  // p2sh 2-3 script
  const validRedeemScript = Buffer.from(
    '522103a8295453660d5e212d4aaf82e8254e27e4c6752b2afa36e648537b644a6ca2702103099e28dd8bcb345e655b5312db0a574dded8f740eeef636cf45317bf010452982102a45b464fed0167d175d89bbc31d7ba1c288b52f64270c7eddaafa38803c5a6b553ae',
    'hex'
  );
  const validTimelock = 800800;

  describe('createCoreDaoOpReturnOutputScript', function () {
    it('should throw if invalid parameters are passed', function () {
      assert.throws(() =>
        createCoreDaoOpReturnOutputScript({
          version: 292,
          chainId: validChainId,
          delegator: validDelegator,
          validator: validValidator,
          fee: validFee,
          timelock: validTimelock,
        })
      );
      assert.throws(() =>
        createCoreDaoOpReturnOutputScript({
          version: validVersion,
          chainId: Buffer.alloc(32, 0),
          delegator: validDelegator,
          validator: validValidator,
          fee: validFee,
          timelock: validTimelock,
        })
      );
      assert.throws(() =>
        createCoreDaoOpReturnOutputScript({
          version: validVersion,
          chainId: validChainId,
          delegator: Buffer.alloc(19, 0),
          validator: validValidator,
          fee: validFee,
          timelock: validTimelock,
        })
      );
      assert.throws(() =>
        createCoreDaoOpReturnOutputScript({
          version: validVersion,
          chainId: validChainId,
          delegator: validDelegator,
          validator: Buffer.alloc(19, 0),
          fee: validFee,
          timelock: validTimelock,
        })
      );
      assert.throws(() =>
        createCoreDaoOpReturnOutputScript({
          version: validVersion,
          chainId: validChainId,
          delegator: validDelegator,
          validator: validValidator,
          fee: 256,
          timelock: validTimelock,
        })
      );
      assert.throws(() =>
        createCoreDaoOpReturnOutputScript({
          version: validVersion,
          chainId: validChainId,
          delegator: validDelegator,
          validator: validValidator,
          fee: validFee,
          timelock: -1,
        })
      );
    });

    it('should return a buffer with the correct length', function () {
      const script = createCoreDaoOpReturnOutputScript({
        version: validVersion,
        chainId: validChainId,
        delegator: validDelegator,
        validator: validValidator,
        fee: validFee,
        timelock: validTimelock,
      });
      // Make sure that the first byte is the OP_RETURN opcode
      assert.strictEqual(script[0], 0x6a);
      // Make sure that the length of the script matches what is in the buffer
      assert.strictEqual(
        // We do not count the OP_RETURN opcode
        script.length - 1,
        script[1]
      );
    });

    it('should have the correct placement of the values provided with a redeem script', function () {
      // This should produce an Op_RETURN that needs the extra push bytes for the length
      const script = createCoreDaoOpReturnOutputScript({
        version: validVersion,
        chainId: validChainId,
        delegator: validDelegator,
        validator: validValidator,
        fee: validFee,
        redeemScript: validRedeemScript,
      });
      // Make sure that the first byte is the OP_RETURN opcode
      assert.strictEqual(script[0], 0x6a);
      // Make sure that the length of the script matches what is in the buffer
      assert.strictEqual(script[1], 0x4c);
      assert.strictEqual(
        // We do not count the OP_RETURN opcode
        script.length - 1,
        script[2]
      );
      // Satoshi plus identifier
      assert.deepStrictEqual(script.subarray(3, 7).toString('hex'), CORE_DAO_SATOSHI_PLUS_IDENTIFIER.toString('hex'));
      // Make sure that the version is correct
      assert.strictEqual(script[7], validVersion);
      // Make sure that the chainId is correct
      assert.deepStrictEqual(script.subarray(8, 10).toString('hex'), validChainId.toString('hex'));
      // Make sure that the delegator is correct
      assert.deepStrictEqual(script.subarray(10, 30).toString('hex'), validDelegator.toString('hex'));
      // Make sure that the validator is correct
      assert.deepStrictEqual(script.subarray(30, 50).toString('hex'), validValidator.toString('hex'));
      // Make sure that the fee is correct
      assert.strictEqual(script[50], validFee);
      // Make sure that the redeemScript is correct
      assert.deepStrictEqual(
        script.subarray(51, 51 + validRedeemScript.length).toString('hex'),
        validRedeemScript.toString('hex')
      );
    });

    it('should have the correct placement of the values provided with a timelock', function () {
      // This should produce an Op_RETURN that needs the extra push bytes for the length
      const script = createCoreDaoOpReturnOutputScript({
        version: validVersion,
        chainId: validChainId,
        delegator: validDelegator,
        validator: validValidator,
        fee: validFee,
        timelock: validTimelock,
      });
      // Make sure that the first byte is the OP_RETURN opcode
      assert.strictEqual(script[0], 0x6a);
      // Make sure that the length of the script matches what is in the buffer
      assert.strictEqual(
        // We do not count the OP_RETURN opcode
        script.length - 1,
        script[1]
      );
      // Satoshi plus identifier
      assert.deepStrictEqual(script.subarray(2, 6).toString('hex'), CORE_DAO_SATOSHI_PLUS_IDENTIFIER.toString('hex'));
      // Make sure that the version is correct
      assert.strictEqual(script[6], validVersion);
      // Make sure that the chainId is correct
      assert.deepStrictEqual(script.subarray(7, 9).toString('hex'), validChainId.toString('hex'));
      // Make sure that the delegator is correct
      assert.deepStrictEqual(script.subarray(9, 29).toString('hex'), validDelegator.toString('hex'));
      // Make sure that the validator is correct
      assert.deepStrictEqual(script.subarray(29, 49).toString('hex'), validValidator.toString('hex'));
      // Make sure that the fee is correct
      assert.strictEqual(script[49], validFee);
      // Make sure that the redeemScript is correct
      assert.deepStrictEqual(
        script.subarray(50, 54).reverse().toString('hex'),
        Buffer.alloc(4, validTimelock).toString('hex')
      );
    });
  });
});
