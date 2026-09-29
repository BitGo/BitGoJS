import 'mocha';
import assert from 'node:assert/strict';

import { fixedScriptWallet, type CoinName } from '@bitgo/wasm-utxo';
import * as testutils from '@bitgo/wasm-utxo/testutils';

import { assertExternalPsbtSighashPolicy, signExternalPsbt } from '../../../src/recovery/signExternalPsbt';

const { BitGoPsbt, ChainCode } = fixedScriptWallet;
const { getKeyTriple } = testutils;

const INPUT_VALUE = 100_000n;
const RECIPIENT = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';

const keychain = getKeyTriple('signExternalPsbt');
const walletKeys = fixedScriptWallet.RootWalletKeys.from({
  triple: keychain,
  derivationPrefixes: ['m/0/0', 'm/0/0', 'm/0/0'],
});
const userKey = keychain[0];
const userXprv = keychain[0].toBase58();

function createWalletPsbtHex(coinName: CoinName, inputCount: number, scriptType: 'p2sh' | 'p2wsh'): string {
  const psbt = BitGoPsbt.createEmpty(coinName, walletKeys, { version: 2, lockTime: 0 });
  const chain = ChainCode.value(scriptType, 'external');
  for (let inputIndex = 0; inputIndex < inputCount; inputIndex++) {
    psbt.addWalletInput(
      {
        txid: inputIndex.toString(16).padStart(2, '0').repeat(32),
        vout: inputIndex,
        value: INPUT_VALUE,
      },
      walletKeys,
      {
        scriptId: { chain, index: inputIndex },
        signPath: { signer: 'user', cosigner: 'bitgo' },
      }
    );
  }
  return Buffer.from(psbt.serialize()).toString('hex');
}

function readCompactSize(bytes: Buffer, offset: number): [number, number] {
  const prefix = bytes[offset];
  if (prefix < 0xfd) return [prefix, offset + 1];
  if (prefix === 0xfd) return [bytes.readUInt16LE(offset + 1), offset + 3];
  if (prefix === 0xfe) return [bytes.readUInt32LE(offset + 1), offset + 5];
  return [Number(bytes.readBigUInt64LE(offset + 1)), offset + 9];
}

/**
 * Rewrite (or remove) the BIP-174 PSBT_IN_SIGHASH_TYPE value of a single
 * input in serialized PSBT bytes, simulating a foreign PSBT crafted with an
 * attacker-chosen sighash type.
 */
function rewriteInputSighashType(psbtHex: string, inputIndex: number, sighashType: number | undefined): string {
  const bytes = Buffer.from(psbtHex, 'hex');
  let offset = 5;

  function readMap(targetInput: boolean): Buffer | undefined {
    while (offset < bytes.length) {
      const entryStart = offset;
      const [keyLength, keyStart] = readCompactSize(bytes, offset);
      offset = keyStart;
      if (keyLength === 0) return undefined;

      const keyType = keyLength === 1 ? bytes[offset] : -1;
      offset += keyLength;
      const [valueLength, valueStart] = readCompactSize(bytes, offset);
      offset = valueStart;
      const valueEnd = valueStart + valueLength;

      if (targetInput && keyType === 0x03) {
        if (sighashType === undefined) {
          return Buffer.concat([bytes.subarray(0, entryStart), bytes.subarray(valueEnd)]);
        }
        if (valueLength !== 4) {
          throw new Error('Expected a four-byte PSBT sighash value');
        }
        bytes.writeUInt32LE(sighashType, valueStart);
        return bytes;
      }
      offset = valueEnd;
    }
    return undefined;
  }

  readMap(false); // global map
  for (let index = 0; index <= inputIndex; index++) {
    const rewritten = readMap(index === inputIndex);
    if (rewritten) return rewritten.toString('hex');
  }
  throw new Error(`No sighash type found for input ${inputIndex}`);
}

/**
 * Rewrite the sighash byte (the trailing byte) of the first PSBT_IN_PARTIAL_SIG
 * value of a single input, simulating a foreign PSBT that already carries a
 * signature under an unsafe sighash type.
 */
function rewritePartialSigSighashByte(psbtHex: string, inputIndex: number, sighashByte: number): string {
  const bytes = Buffer.from(psbtHex, 'hex');
  let offset = 5;

  function readMap(targetInput: boolean): boolean {
    while (offset < bytes.length) {
      const [keyLength, keyStart] = readCompactSize(bytes, offset);
      offset = keyStart;
      if (keyLength === 0) return false;

      const keyType = keyLength > 1 ? bytes[offset] : -1;
      offset += keyLength;
      const [valueLength, valueStart] = readCompactSize(bytes, offset);
      offset = valueStart;
      const valueEnd = valueStart + valueLength;

      if (targetInput && keyType === 0x02) {
        bytes[valueEnd - 1] = sighashByte;
        return true;
      }
      offset = valueEnd;
    }
    return false;
  }

  readMap(false); // global map
  for (let index = 0; index <= inputIndex; index++) {
    if (readMap(index === inputIndex)) {
      return bytes.toString('hex');
    }
  }
  throw new Error(`No partial signature found for input ${inputIndex}`);
}

describe('signExternalPsbt', function () {
  it('signs every input and returns verified SIGHASH_ALL signatures', function () {
    const unsignedPsbtHex = createWalletPsbtHex('btc', 2, 'p2wsh');
    const { psbtHex, signedInputIndexes } = signExternalPsbt(unsignedPsbtHex, 'btc', userXprv);

    assert.deepStrictEqual(signedInputIndexes, [0, 1]);

    const signedPsbt = BitGoPsbt.fromBytes(Buffer.from(psbtHex, 'hex'), 'btc');
    for (const inputIndex of signedInputIndexes) {
      const partialSigs = signedPsbt
        .getInputKeyValues(inputIndex)
        .filter((keyValue) => keyValue.type === 'known' && keyValue.key === 'PSBT_IN_PARTIAL_SIG');
      assert.strictEqual(partialSigs.length, 1);
      assert.strictEqual(partialSigs[0].value[partialSigs[0].value.length - 1], 0x01);
      assert(signedPsbt.verifySignature(inputIndex, userKey.neutered()));
    }
  });

  it('accepts BIP32 instances as the signer key', function () {
    const { signedInputIndexes } = signExternalPsbt(createWalletPsbtHex('btc', 1, 'p2wsh'), 'btc', userKey);
    assert.deepStrictEqual(signedInputIndexes, [0]);
  });

  const unsafeSighashModes = [
    ['SIGHASH_NONE', 0x02],
    ['SIGHASH_SINGLE', 0x03],
    ['SIGHASH_ANYONECANPAY', 0x80],
    ['SIGHASH_ALL|ANYONECANPAY', 0x81],
    ['SIGHASH_NONE|ANYONECANPAY', 0x82],
    ['SIGHASH_SINGLE|ANYONECANPAY', 0x83],
  ] as const;

  for (const [name, sighashType] of unsafeSighashModes) {
    it(`rejects ${name} before signing`, function () {
      const psbtHex = rewriteInputSighashType(createWalletPsbtHex('btc', 1, 'p2wsh'), 0, sighashType);

      assert.throws(() => assertExternalPsbtSighashPolicy(psbtHex, 'btc'), /Only SIGHASH_ALL/);
      assert.throws(() => signExternalPsbt(psbtHex, 'btc', userXprv), /Only SIGHASH_ALL/);
    });
  }

  it('rejects an unsafe sighash type on a later input and names it', function () {
    const psbtHex = rewriteInputSighashType(createWalletPsbtHex('btc', 2, 'p2wsh'), 1, 0x03);
    assert.throws(() => signExternalPsbt(psbtHex, 'btc', userXprv), /Input 1 .*Only SIGHASH_ALL/);
  });

  it('accepts an omitted sighash type, which uses the signer default', function () {
    const psbtHex = rewriteInputSighashType(createWalletPsbtHex('btc', 1, 'p2wsh'), 0, undefined);
    const { signedInputIndexes } = signExternalPsbt(psbtHex, 'btc', userXprv);
    assert.deepStrictEqual(signedInputIndexes, [0]);
  });

  it('rejects a signer key that matches no input', function () {
    const unrelatedKey = testutils.getKey('signExternalPsbt.unrelated');
    assert.throws(
      () => signExternalPsbt(createWalletPsbtHex('btc', 1, 'p2wsh'), 'btc', unrelatedKey.toBase58()),
      /No PSBT inputs were signed/
    );
  });

  it('requires the FORKID form of SIGHASH_ALL on BCH-family coins', function () {
    // addWalletInput stamps SIGHASH_ALL|FORKID for BCH
    const bchPsbtHex = createWalletPsbtHex('bch', 1, 'p2sh');
    assert.doesNotThrow(() => assertExternalPsbtSighashPolicy(bchPsbtHex, 'bch'));
    const { signedInputIndexes } = signExternalPsbt(bchPsbtHex, 'bch', userXprv);
    assert.deepStrictEqual(signedInputIndexes, [0]);

    assert.throws(
      () => signExternalPsbt(rewriteInputSighashType(bchPsbtHex, 0, 0x01), 'bch', userXprv),
      /Only SIGHASH_ALL/
    );
  });

  it('rejects a PSBT that already carries a non-SIGHASH_ALL signature', function () {
    const { psbtHex } = signExternalPsbt(createWalletPsbtHex('btc', 1, 'p2wsh'), 'btc', userXprv);
    const tampered = rewritePartialSigSighashByte(psbtHex, 0, 0x02);

    assert.throws(() => assertExternalPsbtSighashPolicy(tampered, 'btc'), /Only SIGHASH_ALL/);
    assert.throws(() => signExternalPsbt(tampered, 'btc', userXprv), /Only SIGHASH_ALL/);
  });

  it('does not mutate the outputs it was given', function () {
    const unsignedPsbtHex = createWalletPsbtHex('btc', 1, 'p2wsh');
    const unsignedPsbt = BitGoPsbt.fromBytes(Buffer.from(unsignedPsbtHex, 'hex'), 'btc');
    unsignedPsbt.addOutput(RECIPIENT, 90_000n);
    const withOutputHex = Buffer.from(unsignedPsbt.serialize()).toString('hex');

    const { psbtHex } = signExternalPsbt(withOutputHex, 'btc', userXprv);
    const signedPsbt = BitGoPsbt.fromBytes(Buffer.from(psbtHex, 'hex'), 'btc');
    assert.strictEqual(signedPsbt.outputCount(), 1);
    assert.deepStrictEqual(
      signedPsbt.getOutputs().map((output) => output.value),
      [90_000n]
    );
  });
});
