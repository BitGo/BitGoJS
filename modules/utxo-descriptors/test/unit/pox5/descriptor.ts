import * as assert from 'assert';
import { createHash } from 'crypto';

import {
  buildLockAddress,
  buildLockOutputScript,
  buildLockScript,
  buildUnlockScript,
  computeRegisterPreimage,
} from '@stacks/bitcoin-staking';
import { address, bip32, Descriptor } from '@bitgo/wasm-utxo';
import { getKeyTriple } from '@bitgo/wasm-utxo/testutils';

import {
  createPox5LockupDescriptor,
  createPox5LockupScriptPubKey,
  derivePox5StakerKeys,
  parsePox5LockupDescriptor,
  Pox5LockupDescriptorParams,
} from '../../../src/pox5';

type BIP32Interface = bip32.BIP32Interface;

const OPCODES: Record<string, number> = {
  OP_0: 0x00,
  OP_IF: 0x63,
  OP_ELSE: 0x67,
  OP_ENDIF: 0x68,
  OP_VERIFY: 0x69,
  OP_SIZE: 0x82,
  OP_EQUAL: 0x87,
  OP_EQUALVERIFY: 0x88,
  OP_SHA256: 0xa8,
  OP_CHECKSIG: 0xac,
  OP_CHECKMULTISIG: 0xae,
  OP_CLTV: 0xb1,
};

function getBip32Triple(): [BIP32Interface, BIP32Interface, BIP32Interface] {
  const [user, backup, bitgo] = getKeyTriple('default');
  return [user, backup, bitgo];
}

function sha256(value: Uint8Array): Buffer {
  return createHash('sha256').update(value).digest();
}

function params(overrides: Partial<Pox5LockupDescriptorParams> = {}): Pox5LockupDescriptorParams {
  const stakerKeys = getBip32Triple();
  const earlyExitKey = Buffer.from(stakerKeys[0].derive(9).publicKey);
  return {
    unlockHeight: 840_000,
    stakerCommitment: sha256(computeRegisterPreimage('SP000000000000000000002Q6VF78')),
    earlyExitKey,
    stakerKeys,
    ...overrides,
  };
}

function asmToScript(asm: string): Buffer {
  const tokens = asm.split(' ');
  const chunks: Buffer[] = [];
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    const push = token.match(/^OP_PUSHBYTES_(\d+)$/);
    if (push) {
      const bytes = Buffer.from(tokens[++index], 'hex');
      assert.strictEqual(bytes.length, Number(push[1]));
      chunks.push(Buffer.of(bytes.length), bytes);
      continue;
    }
    const number = token.match(/^OP_PUSHNUM_(\d+)$/);
    if (number) {
      chunks.push(Buffer.of(0x50 + Number(number[1])));
      continue;
    }
    const opcode = OPCODES[token];
    assert.notStrictEqual(opcode, undefined, `unsupported ASM token ${token}`);
    chunks.push(Buffer.of(opcode));
  }
  return Buffer.concat(chunks);
}

function encodeTwoOfThreeUnlock(keys: [Buffer, Buffer, Buffer]): Buffer {
  return Buffer.concat([Buffer.of(0x52), ...keys.flatMap((key) => [Buffer.of(33), key]), Buffer.of(0x53, 0xae)]);
}

describe('PoX-5 lockup descriptors', function () {
  it('renders the required byte-identical canonical script and P2WSH output', function () {
    const derivable = params();
    const stakerKeys = derivePox5StakerKeys(
      derivable.stakerKeys as [BIP32Interface, BIP32Interface, BIP32Interface],
      0
    );
    const definite = { ...derivable, stakerKeys };
    const descriptor = createPox5LockupDescriptor(definite);
    const localWitnessScript = asmToScript(descriptor.toAsmString());
    const unlockBytes = encodeTwoOfThreeUnlock(stakerKeys);
    const earlyUnlockBytes = buildUnlockScript(definite.earlyExitKey);
    const sdkWitnessScript = Buffer.from(
      buildLockScript({
        stxAddress: 'SP000000000000000000002Q6VF78',
        unlockHeight: definite.unlockHeight,
        unlockBytes,
        earlyUnlockBytes,
        validateEarlyUnlockBytes: false,
      })
    );

    assert.deepStrictEqual(localWitnessScript, sdkWitnessScript);
    assert.ok(descriptor.toAsmString().includes('OP_SHA256 OP_PUSHBYTES_32'));
    assert.ok(descriptor.toAsmString().includes('OP_EQUALVERIFY OP_PUSHBYTES_33'));

    const localScriptPubKey = createPox5LockupScriptPubKey(definite);
    const sdkScriptPubKey = Buffer.from(
      buildLockOutputScript({
        stxAddress: 'SP000000000000000000002Q6VF78',
        unlockHeight: definite.unlockHeight,
        unlockBytes,
        earlyUnlockBytes,
      })
    );
    assert.deepStrictEqual(localScriptPubKey, sdkScriptPubKey);
    assert.strictEqual(
      address.fromOutputScriptWithCoin(localScriptPubKey, 'btc'),
      buildLockAddress({
        stxAddress: 'SP000000000000000000002Q6VF78',
        unlockHeight: definite.unlockHeight,
        unlockBytes,
        earlyUnlockBytes,
        network: 'mainnet',
        validateEarlyUnlockBytes: false,
      })
    );
  });

  it('supports derivation and preserves wildcard keys until an index is selected', function () {
    const value = params();
    const descriptor = createPox5LockupDescriptor(value);
    const wildcard = parsePox5LockupDescriptor(descriptor);
    const derived = parsePox5LockupDescriptor(descriptor.atDerivationIndex(4));

    assert.ok(wildcard);
    assert.strictEqual(wildcard.stakerKeys, undefined);
    assert.ok(wildcard.stakerKeyStrings.every((key) => key.endsWith('/*')));
    assert.ok(derived?.stakerKeys);
    assert.deepStrictEqual(
      derived?.stakerKeys,
      derivePox5StakerKeys(value.stakerKeys as [BIP32Interface, BIP32Interface, BIP32Interface], 4)
    );
  });

  it('rejects noncanonical parameter values and descriptor templates', function () {
    assert.throws(() => createPox5LockupDescriptor(params({ unlockHeight: 0 })));
    assert.throws(() => createPox5LockupDescriptor(params({ unlockHeight: 500_000_000 })));
    assert.throws(() => createPox5LockupDescriptor(params({ stakerCommitment: Buffer.alloc(31) })));
    assert.throws(() => createPox5LockupDescriptor(params({ earlyExitKey: Buffer.alloc(32) })));
    assert.throws(() =>
      createPox5LockupDescriptor(
        params({ stakerKeys: [getBip32Triple()[0], Buffer.alloc(33, 2), Buffer.alloc(33, 2)] })
      )
    );
    const validKey = params().earlyExitKey.toString('hex');
    assert.strictEqual(parsePox5LockupDescriptor(Descriptor.fromString(`wsh(pk(${validKey}))`, 'definite')), undefined);
  });
});
