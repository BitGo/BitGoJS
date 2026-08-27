import * as assert from 'assert';
import * as sinon from 'sinon';
import { BitGoBase, IBaseCoin, BaseTssUtils as BaseTssUtilsNamespace } from '../../../../../src';
import { bitgoMpcGpgPubKeys } from '../../../../../src/bitgo/tss/bitgoPubKeys';

const BaseTssUtils = BaseTssUtilsNamespace.default;

class TestBaseTssUtils extends BaseTssUtils<Buffer> {
  async setBitgoGpgPubKeyForTest(bitgo): Promise<void> {
    return this.setBitgoGpgPubKey(bitgo);
  }

  getBitgoRedpallasMpcv2PublicGpgKeyForTest(): Promise<import('openpgp').Key> {
    return this.getBitgoRedpallasMpcv2PublicGpgKey();
  }

  getBitgoEddsaMpcv2PublicGpgKeyForTest(): Promise<import('openpgp').Key> {
    return this.getBitgoEddsaMpcv2PublicGpgKey();
  }
}

describe('BaseTssUtils RedPallas MPCv2 BitGo GPG key', function () {
  let utils: TestBaseTssUtils;
  let mockBitGo: BitGoBase;

  beforeEach(function () {
    mockBitGo = {} as unknown as BitGoBase;
    utils = new TestBaseTssUtils(mockBitGo, {} as unknown as IBaseCoin);
  });

  afterEach(function () {
    sinon.restore();
  });

  it('setBitgoGpgPubKey populates bitgoRedpallasMpcv2PublicGpgKey from constants', async function () {
    mockBitGo.fetchConstants = sinon.stub().resolves({
      mpc: {
        bitgoPublicKey: bitgoMpcGpgPubKeys.mpcv1.nitro.test,
        bitgoRedpallasMpcv2PublicKey: bitgoMpcGpgPubKeys.redpallasMpcv2.nitro.test,
      },
    });

    await utils.setBitgoGpgPubKeyForTest(mockBitGo);
    const key = await utils.getBitgoRedpallasMpcv2PublicGpgKeyForTest();

    assert.ok(key);
    assert.strictEqual(key.armor(), bitgoMpcGpgPubKeys.redpallasMpcv2.nitro.test);
  });

  it('does not populate bitgoRedpallasMpcv2PublicGpgKey when constants omit it', async function () {
    mockBitGo.fetchConstants = sinon.stub().resolves({
      mpc: {
        bitgoPublicKey: bitgoMpcGpgPubKeys.mpcv1.nitro.test,
      },
    });

    await utils.setBitgoGpgPubKeyForTest(mockBitGo);

    await assert.rejects(
      utils.getBitgoRedpallasMpcv2PublicGpgKeyForTest(),
      /Failed to get Bitgo's RedPallas MPCv2 gpg key/
    );
  });

  it('populating the RedPallas key does not clobber a separately-set EdDSA MPCv2 key', async function () {
    mockBitGo.fetchConstants = sinon
      .stub()
      .onFirstCall()
      .resolves({
        mpc: {
          bitgoPublicKey: bitgoMpcGpgPubKeys.mpcv1.nitro.test,
          bitgoEddsaMpcv2PublicKey: bitgoMpcGpgPubKeys.eddsaMpcv2.nitro.test,
        },
      })
      .onSecondCall()
      .resolves({
        mpc: {
          bitgoPublicKey: bitgoMpcGpgPubKeys.mpcv1.nitro.test,
          bitgoRedpallasMpcv2PublicKey: bitgoMpcGpgPubKeys.redpallasMpcv2.nitro.test,
        },
      });

    await utils.setBitgoGpgPubKeyForTest(mockBitGo);
    const eddsaKey = await utils.getBitgoEddsaMpcv2PublicGpgKeyForTest();
    assert.strictEqual(eddsaKey.armor(), bitgoMpcGpgPubKeys.eddsaMpcv2.nitro.test);

    await utils.setBitgoGpgPubKeyForTest(mockBitGo);
    const redpallasKey = await utils.getBitgoRedpallasMpcv2PublicGpgKeyForTest();
    assert.strictEqual(redpallasKey.armor(), bitgoMpcGpgPubKeys.redpallasMpcv2.nitro.test);

    // EdDSA key should still be set - it must not have been unset by the second call.
    const eddsaKeyAgain = await utils.getBitgoEddsaMpcv2PublicGpgKeyForTest();
    assert.strictEqual(eddsaKeyAgain.armor(), bitgoMpcGpgPubKeys.eddsaMpcv2.nitro.test);
  });
});
