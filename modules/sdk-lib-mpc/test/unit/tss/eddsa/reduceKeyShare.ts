import assert from 'assert';
import { MPSUtil, MPSTypes } from '../../../../src/tss/eddsa-mps';

// A share captured from a live DKG session, and the reduced bytes master's pre-extraction
// DKG.getReducedKeyShare produced from that session's state (sharePk / shareChaincode).
const FULL_KEY_SHARE_HEX =
  '02030017ed9c0538df207c72685b5a377a5e6cda1ddd73dd660bef6a3c615c321f2f0e922144e8cebdbfebc17e049b18a85a0231f75f2a3a6fb72e4658c37c942698ea600113598b8ea4e3b226dc94731312d3bd0b3fee7af45c2253924c6836bec68523fefe24180ab596fdeb64389bcbd10f4f60ce693bb9627d649093271e7349c15431a0c9d492881d3dd72712a0f74d83ad124da627e18e5bad8ac9c23da519c5a821e62ebb503fd98bb412cac95dc24bd84a9cbd151e6d68ce3d9817f92dc36ec50087fa1229991d38fbb60b718d41dd0a5d99ff5830e623c2895ac8e17cc54e38c1';
const COMMON_KEYCHAIN =
  '922144e8cebdbfebc17e049b18a85a0231f75f2a3a6fb72e4658c37c942698ea87fa1229991d38fbb60b718d41dd0a5d99ff5830e623c2895ac8e17cc54e38c1';
const REDUCED_KEY_SHARE_HEX =
  'b90003686b6579536861726598e50203001718ed189c05183818df1820187c18721868185b185a1837187a185e186c18da181d18dd187318dd18660b18ef186a183c1861185c1832181f182f0e18921821184418e818ce18bd18bf18eb18c1187e04189b181818a8185a02183118f7185f182a183a186f18b7182e1846185818c3187c18941826189818ea186001131859188b188e18a418e318b2182618dc18941873131218d318bd0b183f18ee187a18f4185c182218531892184c1868183618be18c61885182318fe18fe182418180a18b5189618fd18eb18641838189b18cb18d10f184f186018ce1869183b18b91862187d1864189018931827181e1873184918c11854183118a018c918d418921888181d183d18d718271218a018f7184d188318ad12184d18a6182718e1188e185b18ad188a18c918c2183d18a5181918c518a8182118e6182e18bb1850183f18d9188b18b41218ca18c9185d18c2184b18d8184a189c18bd15181e186d186818ce183d18981718f9182d18c3186e18c500188718fa1218291899181d183818fb18b60b1871188d184118dd0a185d189918ff1858183018e6182318c21889185a18c818e1187c18c5184e183818c163707562982018921821184418e818ce18bd18bf18eb18c1187e04189b181818a8185a02183118f7185f182a183a186f18b7182e1846185818c3187c18941826189818ea6d726f6f74436861696e436f64659820188718fa1218291899181d183818fb18b60b1871188d184118dd0a185d189918ff1858183018e6182318c21889185a18c818e1187c18c5184e183818c1';

describe('MPS reduceKeyShare', function () {
  it('reduces the full-share fixture to the golden bytes produced before extraction', function () {
    const actual = MPSTypes.reduceMpsKeyShare(Buffer.from(FULL_KEY_SHARE_HEX, 'hex'), COMMON_KEYCHAIN);
    assert.strictEqual(actual.toString('hex'), REDUCED_KEY_SHARE_HEX);
  });

  it('DKG.getReducedKeyShare delegates to reduceMpsKeyShare for a live DKG', async function () {
    for (const party of await MPSUtil.generateEdDsaDKGKeyShares()) {
      const actual = MPSTypes.reduceMpsKeyShare(party.getKeyShare(), party.getCommonKeychain());
      assert(actual.equals(party.getReducedKeyShare()));
    }
  });

  it('rejects a commonKeychain that is not 128 hex characters', function () {
    const share = Buffer.from(FULL_KEY_SHARE_HEX, 'hex');
    for (const commonKeychain of [COMMON_KEYCHAIN.slice(2), `${COMMON_KEYCHAIN.slice(0, 127)}z`, '']) {
      assert.throws(() => MPSTypes.reduceMpsKeyShare(share, commonKeychain), /commonKeychain must be 128 hex/);
    }
  });
});
