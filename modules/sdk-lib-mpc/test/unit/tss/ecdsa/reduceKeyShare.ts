import assert from 'assert';
import * as fs from 'fs';
import { decode, encode } from 'cbor-x';
import { DklsTypes } from '../../../../src/tss/ecdsa-dkls';
import { generate2of2KeyShares } from '../../../../src/tss/ecdsa-dkls/util';

// Reduced bytes of fixtures/userShare, produced by master's pre-extraction Dkg.getReducedKeyShare.
const REDUCED_USER_SHARE_HEX =
  'b9000568626967534c69737483982103181e1884189b18951866186318851823183e18d7184018e3186c18a2189a18ea181e18741876181d189d1839182618f018de18681824183018f418e410181c98210218620918250a18ac18d5182918f418b218a401186615182f18441884188618a91018c8185818d60d187c182c18991863182e1889183418641818982103186118a2188818ea1118a318a3182218ca182a182718f618710618a718e3189d1118f4185a187a189d18de185f1846187018da18ea18a3187018a0186d65784c697374839820186b188d18af18bb182618621874189a18c918a91874188d18f718b80118e118b918d31895187518f718eb185c18361818186618550318c11878185618629820186918fc188918fd18e0183018fe18ca18c91718f2188a182d18d218ea1859186318dc18bc18270c18fa0d1837186e181f183b18a318c708181a18da982018a518c0184d18f01871185f18a11826189418cc188718d118ef18cb186f188418eb0a18461894184118180618901838182e010b181e188918e30c6d726f6f74436861696e436f64659820182118fa18a4184f18f118c21881181918721843185118d208183118e4183d1818184f18d618f0183e18d7188918c201188e186c0c18ff184a18cb1863637072769820188e1841189c182f188d183918d318441894183218fa1889182d188e18e7181e00061854000d188418f218711895182b185a18ce1892186518d118f163707562982103184a14186b18510e18ce18be1832188d183518b706189d188718bc185c188218e8183118a9185318ed189718e60918a60218f3187d189518d5187e';

describe('DKLS reduceKeyShare', function () {
  it('reduces the full-share fixture to the golden bytes produced before extraction', async function () {
    const fullKeyShare = await fs.promises.readFile(`${__dirname}/fixtures/userShare`);
    assert.strictEqual(DklsTypes.reduceDklsKeyShare(fullKeyShare).toString('hex'), REDUCED_USER_SHARE_HEX);
  });

  it('Dkg.getReducedKeyShare delegates to reduceDklsKeyShare for a live DKG', async function () {
    for (const party of await generate2of2KeyShares()) {
      assert(DklsTypes.reduceDklsKeyShare(party.getKeyShare()).equals(party.getReducedKeyShare()));
    }
  });

  it('rejects input that is not a well-formed DKLS key share', async function () {
    const full = decode(await fs.promises.readFile(`${__dirname}/fixtures/userShare`));
    const malformed = [
      encode({ foo: 1 }),
      encode({ ...full, s_i: full.s_i.slice(1) }),
      encode({ ...full, x_i_list: [] }),
    ];
    for (const input of malformed) {
      assert.throws(() => DklsTypes.reduceDklsKeyShare(Buffer.from(input)), /not a well-formed DKLS key share/);
    }
  });
});
