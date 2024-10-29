import * as assert from 'assert';
import {
  CORE_DAO_MAINNET_CHAIN_ID,
  CORE_DAO_SATOSHI_PLUS_IDENTIFIER,
  createCoreDaoOpReturnOutputScript,
  decodeTimelock,
  encodeTimelock,
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
  // https://docs.coredao.org/docs/Learn/products/btc-staking/design#op_return-output-1
  const defaultScript =
    '6a4c505341542b01045bde60b7d0e6b758ca5dd8c61d377a2c5f1af51ec1a9e209f5ea0036c8c2f41078a3cebee57d8a47d501041f5e0e66b17576a914c4b8ae927ff2b9ce218e20bf06d425d6b68424fd88ac';

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
        // We do not count the OP_RETURN opcode or the bytes for the length
        script.length - 2,
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
        // We do not count the OP_RETURN opcode or the length + pushbytes
        script.length - 3,
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
        // We do not count the OP_RETURN opcode or the length
        script.length - 2,
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
      assert.deepStrictEqual(script.subarray(50, 54).toString('hex'), encodeTimelock(validTimelock).toString('hex'));
      assert.deepStrictEqual(decodeTimelock(script.subarray(50, 54)), validTimelock);
    });

    it('should recreate the example OP_RETURN correctly', function () {
      assert.deepStrictEqual(
        createCoreDaoOpReturnOutputScript({
          version: 1,
          chainId: Buffer.from('045b', 'hex'),
          delegator: Buffer.from('de60b7d0e6b758ca5dd8c61d377a2c5f1af51ec1', 'hex'),
          validator: Buffer.from('a9e209f5ea0036c8c2f41078a3cebee57d8a47d5', 'hex'),
          fee: 1,
          redeemScript: Buffer.from('041f5e0e66b17576a914c4b8ae927ff2b9ce218e20bf06d425d6b68424fd88ac', 'hex'),
        }).toString('hex'),
        // Source: https://docs.coredao.org/docs/Learn/products/btc-staking/design#op_return-output-1
        defaultScript
      );
    });

    it('should create a OP_RETURN with the extra long length identifier', function () {
      const redeemScriptPushdata2 = Buffer.alloc(265, 0);
      const scriptPushdata2 = createCoreDaoOpReturnOutputScript({
        version: validVersion,
        chainId: validChainId,
        delegator: validDelegator,
        validator: validValidator,
        fee: validFee,
        redeemScript: redeemScriptPushdata2,
      });

      // Make sure that the first byte is the OP_RETURN opcode
      assert.strictEqual(scriptPushdata2[0], 0x6a);
      // Make sure that there is the OP_PUSHDATA2 identifier
      assert.strictEqual(scriptPushdata2[1], 0x4d);
      // We do not count the OP_RETURN opcode or the bytes for the length
      assert.strictEqual(scriptPushdata2.readInt16BE(2), scriptPushdata2.length - 4);

      const redeemScriptPushdata4 = Buffer.alloc(65540, 0);
      const scriptPushdata4 = createCoreDaoOpReturnOutputScript({
        version: validVersion,
        chainId: validChainId,
        delegator: validDelegator,
        validator: validValidator,
        fee: validFee,
        redeemScript: redeemScriptPushdata4,
      });

      // Make sure that the first byte is the OP_RETURN opcode
      assert.strictEqual(scriptPushdata4[0], 0x6a);
      // Make sure that there is the OP_PUSHDATA4 identifier
      assert.strictEqual(scriptPushdata4[1], 0x4e);
      // We do not count the OP_RETURN opcode or the bytes for the length
      assert.strictEqual(scriptPushdata4.readInt32BE(2), scriptPushdata4.length - 6);
    });
  });
});
