import * as assert from 'assert';
import {
  CORE_DAO_MAINNET_CHAIN_ID,
  CORE_DAO_SATOSHI_PLUS_IDENTIFIER,
  createCoreDaoOpReturnOutputScript,
  decodeTimelock,
  encodeTimelock,
  parseCoreDaoOpReturnOutputScript,
  toString,
} from '../../src';
import { testutil } from '@bitgo/utxo-lib';
import { getFixture } from './utils';

describe('OP_RETURN', function () {
  const validVersion = 2;
  const validChainId = CORE_DAO_MAINNET_CHAIN_ID;
  // random 20 byte buffers
  const validDelegator = Buffer.alloc(20, testutil.getKey('wasm-possum').publicKey);
  const validValidator = Buffer.alloc(20, testutil.getKey('possum-wasm').publicKey);
  const validFee = 1;
  const validRedeemScript = Buffer.from('522103a8295453660d5e212d55556666666666666666666666666666666666', 'hex');
  const validTimelock = 800800;
  let defaultScript: string;

  before(async function () {
    // https://docs.coredao.org/docs/Learn/products/btc-staking/design#op_return-output-1
    const script = await getFixture('test/fixtures/opReturn/documentation.txt', undefined);
    assert(typeof script === 'string');
    defaultScript = script;
  });

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

    it('should throw if the length of the script is too long', function () {
      assert.throws(() =>
        createCoreDaoOpReturnOutputScript({
          version: validVersion,
          chainId: validChainId,
          delegator: validDelegator,
          validator: validValidator,
          fee: validFee,
          redeemScript: Buffer.alloc(100),
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
        defaultScript
      );
    });
  });

  describe('parseCoreDaoOpReturnOutputScript', function () {
    it('should parse a valid script with a timelock', function () {
      const script = createCoreDaoOpReturnOutputScript({
        version: validVersion,
        chainId: validChainId,
        delegator: validDelegator,
        validator: validValidator,
        fee: validFee,
        timelock: validTimelock,
      });
      const parsed = parseCoreDaoOpReturnOutputScript(script);
      assert.strictEqual(parsed.version, validVersion);
      assert.deepStrictEqual(parsed.chainId, validChainId);
      assert.deepStrictEqual(parsed.delegator, validDelegator);
      assert.deepStrictEqual(parsed.validator, validValidator);
      assert.strictEqual(parsed.fee, validFee);
      assert('timelock' in parsed);
      assert.deepStrictEqual(parsed.timelock, validTimelock);
    });

    it('should parse a valid script with a redeem script', function () {
      const script = createCoreDaoOpReturnOutputScript({
        version: validVersion,
        chainId: validChainId,
        delegator: validDelegator,
        validator: validValidator,
        fee: validFee,
        redeemScript: validRedeemScript,
      });
      const parsed = parseCoreDaoOpReturnOutputScript(script);
      assert.strictEqual(parsed.version, validVersion);
      assert.deepStrictEqual(parsed.chainId, validChainId);
      assert.deepStrictEqual(parsed.delegator, validDelegator);
      assert.deepStrictEqual(parsed.validator, validValidator);
      assert.strictEqual(parsed.fee, validFee);
      assert('redeemScript' in parsed);
      assert.deepStrictEqual(parsed.redeemScript, validRedeemScript);
    });

    it('should parse valid opreturn script from testnet', async function () {
      // Source: https://mempool.space/testnet/tx/66ed4cea26a410248a6d87f14b2bca514f33920c54d4af63ed46a903793115d5
      const baseFixturePath = 'test/fixtures/opReturn/66ed4cea26a410248a6d87f14b2bca514f33920c54d4af63ed46a903793115d5';
      const opReturnHex = await getFixture(baseFixturePath + '.txt', undefined);
      assert(typeof opReturnHex === 'string');
      const parsed = parseCoreDaoOpReturnOutputScript(Buffer.from(opReturnHex, 'hex'));
      const parsedFixture = await getFixture(baseFixturePath + '.json', JSON.parse(toString(parsed)));
      assert.deepStrictEqual(toString(parsed), JSON.stringify(parsedFixture));
    });

    it('should fail if there is an invalid op-return', function () {
      const script = defaultScript.replace('6a4c50', '6b4c50');
      assert.throws(() => parseCoreDaoOpReturnOutputScript(Buffer.from(script, 'hex')));
    });

    it('should fail if the length is incorrect', function () {
      const script = defaultScript.replace('4c50', '4c51');
      assert.throws(() => parseCoreDaoOpReturnOutputScript(Buffer.from(script, 'hex')));
    });

    it('should fail if the satoshi+ identifier is incorrect', function () {
      const script = defaultScript.replace('5341542b', '5341532b');
      assert.throws(() => parseCoreDaoOpReturnOutputScript(Buffer.from(script, 'hex')));
    });

    it('should fail if the chainId is incorrect', function () {
      const script = defaultScript.replace('045b', '0454');
      assert.throws(() => parseCoreDaoOpReturnOutputScript(Buffer.from(script, 'hex')));
    });
  });
});
