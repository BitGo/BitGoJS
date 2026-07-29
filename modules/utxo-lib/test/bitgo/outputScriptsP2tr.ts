import * as assert from 'assert';

import { musig, ecc, BIP32Interface } from '@bitgo/secp256k1';
import { TapTree } from 'bip174/src/lib/interfaces';
import * as taproot from '../../src/taproot';
import { isTriple, Triple } from '../../src/bitgo/types';
import { createPaymentP2trCommon, toXOnlyPublicKey } from '../../src/bitgo/outputScripts';
import { getKey } from '../../src/testutil';
import { assertEqualFixture } from '../fixture.util';

function searchKey(path: string, predicate: (key: BIP32Interface) => boolean): BIP32Interface {
  for (let i = 0; i < 10; i++) {
    const key = getKey(`${path}/${i}`);
    if (predicate(key)) {
      return key;
    }
  }
  throw new Error('could not find key');
}

// for p2tr, we sort according to the xonly keys, so we need to pick user and bitgo keys
// that are ordered differently dependening on the sort method (with or without y coordinate)
// we pick a user key with first byte 0x02 (even y coordinate) and second byte greater than 0x80
const userKey = searchKey('utxo/user', (key) => key.publicKey[0] === 0x02 && key.publicKey[1] > 0x80);
// backup key does not matter
const backupKey = searchKey('utxo/backup', (key) => true);
// we pick a bitgo key with first byte 0x03 (odd y coordinate) and second byte less than 0x80
const bitgoKey = searchKey('utxo/bitgo', (key) => key.publicKey[0] === 0x03 && key.publicKey[1] < 0x80);

function getPubkeys(keys: Triple<BIP32Interface>): Triple<Buffer> {
  return keys.map((k) => k.publicKey) as Triple<Buffer>;
}

type Fixture = {
  scriptType: 'p2tr' | 'p2trMusig2';
  privkeys: Buffer[];
  pubkeys: Buffer[];
  internalPubkey: Buffer;
  controlBlocks: { redeemIndex: number | undefined; controlBlock: Buffer | undefined }[];
  tapTree: TapTree | undefined;
  taptreeRoot: Buffer;
  output: Buffer;
};

function getFixture(keys: BIP32Interface[], scriptType: 'p2tr' | 'p2trMusig2'): Fixture {
  assert.ok(isTriple(keys), 'keys must be a triple');
  const privkeys = keys.map((k) => k.privateKey) as Triple<Buffer>;
  const pubkeys = keys.map((k) => k.publicKey) as Triple<Buffer>;
  const { internalPubkey, tapTree, taptreeRoot, output } = createPaymentP2trCommon(scriptType, pubkeys);
  assert.ok(taptreeRoot, 'taptreeRoot is required');
  assert.ok(internalPubkey, 'internalPubkey is required');
  assert.ok(output, 'output is required');

  const redeemIndexes = scriptType === 'p2tr' ? [0, 1, 2] : [0, 1];
  const controlBlocks = redeemIndexes.map((redeemIndex) => ({
    redeemIndex,
    controlBlock: createPaymentP2trCommon(scriptType, pubkeys, redeemIndex).controlBlock ?? undefined,
  }));

  return {
    scriptType,
    privkeys,
    pubkeys,
    internalPubkey,
    controlBlocks,
    tapTree,
    taptreeRoot,
    output,
  };
}

function getFixtures(scriptType: 'p2tr' | 'p2trMusig2'): Fixture[] {
  return [
    getFixture([userKey, backupKey, bitgoKey], scriptType),
    // flips user and bitgo key
    getFixture([bitgoKey, backupKey, userKey], scriptType),
  ];
}

function describeWithScriptType(scriptType: 'p2tr' | 'p2trMusig2') {
  describe(`createPaymentP2tr ${scriptType}`, () => {
    it('creates expected fixtures', async function () {
      const fixtures = getFixtures(scriptType);
      await assertEqualFixture(`${__dirname}/fixtures/outputScripts/${scriptType}.json`, fixtures);
    });

    it('key order is different in plain and xonly views', function () {
      // plain view has user key before bitgo key
      assert.strictEqual(userKey.publicKey.compare(bitgoKey.publicKey), -1);
      assert.strictEqual(bitgoKey.publicKey.compare(userKey.publicKey), 1);
      // xonly view has bitgo key before user key
      assert.strictEqual(userKey.publicKey.subarray(1).compare(bitgoKey.publicKey.subarray(1)), 1);
      assert.strictEqual(bitgoKey.publicKey.subarray(1).compare(userKey.publicKey.subarray(1)), -1);
    });

    it('has expected aggregate key', function () {
      const keys = [userKey, backupKey, bitgoKey] as Triple<BIP32Interface>;
      const pubkeys = getPubkeys(keys);
      const p2tr = createPaymentP2trCommon(scriptType, pubkeys);
      const { internalPubkey } = p2tr;
      assert.ok(internalPubkey, 'internalPubkey is required');
      const [user, , bitgo] = pubkeys;
      const keyPathKeys = [user, bitgo];
      switch (scriptType) {
        case 'p2tr':
          const keyPathXonly = keyPathKeys.map(toXOnlyPublicKey);
          assert.strictEqual(
            internalPubkey.toString('hex'),
            Buffer.from(taproot.aggregateMuSigPubkeys(ecc, keyPathXonly)).toString('hex')
          );
          assert.strictEqual(
            internalPubkey.toString('hex'),
            Buffer.from(taproot.aggregateMuSigPubkeys(ecc, keyPathXonly.slice().reverse())).toString('hex'),
            'aggregation insensitive to key ordering'
          );
          break;
        case 'p2trMusig2':
          assert.strictEqual(
            internalPubkey.toString('hex'),
            Buffer.from(musig.getXOnlyPubkey(musig.keyAgg(keyPathKeys))).toString('hex')
          );
          assert.notStrictEqual(
            internalPubkey.toString('hex'),
            Buffer.from(musig.getXOnlyPubkey(musig.keyAgg(keyPathKeys.slice().reverse()))).toString('hex'),
            'aggregation is sensitive to key ordering'
          );
          break;
        default:
          throw new Error(`unexpected scriptType: ${scriptType}`);
      }
    });
  });
}

describeWithScriptType('p2tr');
describeWithScriptType('p2trMusig2');
