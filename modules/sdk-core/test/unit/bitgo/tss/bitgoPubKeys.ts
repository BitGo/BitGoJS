import * as assert from 'assert';
import {
  bitgoMpcGpgPubKeys,
  getBitgoMpcGpgPubKey,
  isBitgoEddsaMpcv2PubKey,
  isBitgoRedpallasMpcv2PubKey,
} from '../../../../src/bitgo/tss/bitgoPubKeys';

describe('bitgoPubKeys RedPallas MPCv2 key config', function () {
  it('getBitgoMpcGpgPubKey returns a key for redpallasMpcv2 across env/hsmType combos', function () {
    assert.strictEqual(
      getBitgoMpcGpgPubKey('test', 'nitro', 'redpallasMpcv2'),
      bitgoMpcGpgPubKeys.redpallasMpcv2.nitro.test
    );
    assert.strictEqual(
      getBitgoMpcGpgPubKey('prod', 'nitro', 'redpallasMpcv2'),
      bitgoMpcGpgPubKeys.redpallasMpcv2.nitro.prod
    );
    assert.strictEqual(
      getBitgoMpcGpgPubKey('test', 'onprem', 'redpallasMpcv2'),
      bitgoMpcGpgPubKeys.redpallasMpcv2.onprem.test
    );
    assert.strictEqual(
      getBitgoMpcGpgPubKey('prod', 'onprem', 'redpallasMpcv2'),
      bitgoMpcGpgPubKeys.redpallasMpcv2.onprem.prod
    );
  });

  it('non-prod/non-adminProd envs default to the test key for redpallasMpcv2', function () {
    assert.strictEqual(
      getBitgoMpcGpgPubKey('staging', 'nitro', 'redpallasMpcv2'),
      bitgoMpcGpgPubKeys.redpallasMpcv2.nitro.test
    );
    assert.strictEqual(
      getBitgoMpcGpgPubKey('adminTest', 'onprem', 'redpallasMpcv2'),
      bitgoMpcGpgPubKeys.redpallasMpcv2.onprem.test
    );
  });

  it('adminProd resolves to the prod key for redpallasMpcv2', function () {
    assert.strictEqual(
      getBitgoMpcGpgPubKey('adminProd', 'nitro', 'redpallasMpcv2'),
      bitgoMpcGpgPubKeys.redpallasMpcv2.nitro.prod
    );
  });

  it('isBitgoRedpallasMpcv2PubKey identifies known redpallasMpcv2 keys', function () {
    assert.strictEqual(isBitgoRedpallasMpcv2PubKey(bitgoMpcGpgPubKeys.redpallasMpcv2.nitro.test), true);
    assert.strictEqual(isBitgoRedpallasMpcv2PubKey(bitgoMpcGpgPubKeys.redpallasMpcv2.onprem.prod), true);
  });

  it('isBitgoRedpallasMpcv2PubKey rejects keys from other mpc versions', function () {
    assert.strictEqual(isBitgoRedpallasMpcv2PubKey(bitgoMpcGpgPubKeys.mpcv1.nitro.test), false);
    assert.strictEqual(isBitgoRedpallasMpcv2PubKey('not-a-real-key'), false);
  });

  it('does not affect eddsaMpcv2 key lookups', function () {
    assert.strictEqual(getBitgoMpcGpgPubKey('test', 'nitro', 'eddsaMpcv2'), bitgoMpcGpgPubKeys.eddsaMpcv2.nitro.test);
    assert.strictEqual(isBitgoEddsaMpcv2PubKey(bitgoMpcGpgPubKeys.eddsaMpcv2.nitro.test), true);
    assert.strictEqual(isBitgoEddsaMpcv2PubKey(bitgoMpcGpgPubKeys.redpallasMpcv2.nitro.test), true); // interim: same key material
  });
});
