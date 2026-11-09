import 'should';
import {
  buildSafeBip44Path,
  decodeEd25519StrKeyPublicKey,
  deriveSafeChildEd25519Hardened,
  ED25519_MULTISIG_COIN_ENCODERS,
  getEd25519MultisigCoinEncoders,
} from '../../src';

// Same root seed and child as the pinned SLIP-0010 vector in safeDerivation.ts (m/44'/148'/2'/0').
const ROOT_SEED_STRKEY = 'SAAACAQDAQCQMBYIBEFAWDANBYHRAEISCMKBKFQXDAMRUGY4DUPB6NKI';

// The expected strings below were produced with the public reference libraries:
//   XLM:  stellar-base `StrKey.encodeEd25519SecretSeed` / `StrKey.decodeEd25519PublicKey`
//   ALGO: algosdk `encodeAddress` (an Algorand seed and an address share the same 58-char encoding)
//   HBAR: documented DER prefixes (302a300506032b6570032100 public, 302e020100300506032b657004220420 private)
const VECTORS = [
  {
    account: 0,
    rawSeedHex: '855e8d991b48037b3e0161fd57f1643044878d6afe0db0243719b5201e2e4f69',
    strKeyPub: 'GDD3VVFKM64URLG6PO2UFWQXJH67N5UDOV5HZ23M5FJJT5G4LUO7RJWG',
    rawPubHex: 'c7bad4aa67b948acde7bb542da1749fdf6f683757a7ceb6ce95299f4dc5d1df8',
    xlmSeed: 'SCCV5DMZDNEAG6Z6AFQ72V7RMQYEJB4NNL7A3MBEG4M3KIA6FZHWSAED',
    algoAddress: 'Y65NJKTHXFEKZXT3WVBNUF2J7X3PNA3VPJ6OW3HJKKM7JXC5DX4O53XQMQ',
    algoSeed: 'QVPI3GI3JABXWPQBMH6VP4LEGBCIPDLK7YG3AJBXDG2SAHROJ5UXL6VE4Q',
    hbarPub: '302a300506032b6570032100c7bad4aa67b948acde7bb542da1749fdf6f683757a7ceb6ce95299f4dc5d1df8',
    hbarPrv: '302e020100300506032b657004220420855e8d991b48037b3e0161fd57f1643044878d6afe0db0243719b5201e2e4f69',
  },
  {
    account: 7,
    rawSeedHex: '3790123d377fec4805f52cbd0aa6e4f5277ed2ef75dbdbc0bf723370d10c4a82',
    strKeyPub: 'GBQ52JFLZ3BEAF3XL3CZKYJ4H67OLMXZ5MNWNMRI57HR7ZPK4PK7UEEY',
    rawPubHex: '61dd24abcec24017775ec595613c3fbee5b2f9eb1b66b228efcf1fe5eae3d5fa',
    xlmSeed: 'SA3ZAER5G576YSAF6UWL2CVG4T2SO7WS5525XW6AX5ZDG4GRBRFIEFHX',
    algoAddress: 'MHOSJK6OYJABO526YWKWCPB7X3S3F6PLDNTLEKHPZ4P6L2XD2X5DG3N6NU',
    algoSeed: 'G6IBEPJXP7WEQBPVFS6QVJXE6UTX5UXPOXN5XQF7OIZXBUIMJKBD2PN6OE',
    hbarPub: '302a300506032b6570032100' + '61dd24abcec24017775ec595613c3fbee5b2f9eb1b66b228efcf1fe5eae3d5fa',
    hbarPrv: '302e020100300506032b657004220420' + '3790123d377fec4805f52cbd0aa6e4f5277ed2ef75dbdbc0bf723370d10c4a82',
  },
];

describe('ed25519CoinEncoders', function () {
  describe('registry lookup', function () {
    it('resolves mainnet and testnet chains to the same encoders per family', function () {
      getEd25519MultisigCoinEncoders('xlm')!.should.equal(getEd25519MultisigCoinEncoders('txlm')!);
      getEd25519MultisigCoinEncoders('algo')!.should.equal(getEd25519MultisigCoinEncoders('talgo')!);
      getEd25519MultisigCoinEncoders('hbar')!.should.equal(getEd25519MultisigCoinEncoders('thbar')!);
    });

    it('returns undefined for unsupported coins and inherited object keys', function () {
      for (const name of ['btc', 'tbtc', 'eth', 'sol', '', 'constructor', 'toString', '__proto__']) {
        (getEd25519MultisigCoinEncoders(name) === undefined).should.equal(true, name);
      }
    });

    it('exposes a root address deriver for ALGO only', function () {
      for (const [chain, encoders] of Object.entries(ED25519_MULTISIG_COIN_ENCODERS)) {
        const hasDeriver = encoders?.deriveRootAddress !== undefined;
        hasDeriver.should.equal(chain === 'algo' || chain === 'talgo', chain);
      }
    });
  });

  for (const vector of VECTORS) {
    describe(`pinned vector at account ${vector.account}`, function () {
      const rawSeed = Buffer.from(vector.rawSeedHex, 'hex');
      const rawPub = Buffer.from(vector.rawPubHex, 'hex');

      it('inputs match the SLIP-0010 derivation of the root seed', function () {
        const derived = deriveSafeChildEd25519Hardened(
          ROOT_SEED_STRKEY,
          buildSafeBip44Path(148, 'ed25519Multisig', vector.account)
        );
        derived.prv.should.equal(vector.rawSeedHex);
        derived.pub.should.equal(vector.strKeyPub);
        decodeEd25519StrKeyPublicKey(derived.pub).toString('hex').should.equal(vector.rawPubHex);
      });

      it('XLM / TXLM: G... public key and S... secret seed', function () {
        for (const chain of ['xlm', 'txlm']) {
          const encoders = getEd25519MultisigCoinEncoders(chain)!;
          encoders.encodePub(rawPub).should.equal(vector.strKeyPub);
          encoders.encodeSeed(rawSeed).should.equal(vector.xlmSeed);
        }
      });

      it('ALGO / TALGO: 58-char base32 address and seed', function () {
        for (const chain of ['algo', 'talgo']) {
          const encoders = getEd25519MultisigCoinEncoders(chain)!;
          encoders.encodePub(rawPub).should.equal(vector.algoAddress);
          encoders.encodeSeed(rawSeed).should.equal(vector.algoSeed);
        }
      });

      it('HBAR / THBAR: DER-prefixed public and private key hex', function () {
        for (const chain of ['hbar', 'thbar']) {
          const encoders = getEd25519MultisigCoinEncoders(chain)!;
          encoders.encodePub(rawPub).should.equal(vector.hbarPub);
          encoders.encodePub(rawPub).should.match(/^302a300506032b6570032100[0-9a-f]{64}$/);
          encoders.encodeSeed(rawSeed).should.equal(vector.hbarPrv);
          encoders.encodeSeed(rawSeed).should.match(/^302e020100300506032b657004220420[0-9a-f]{64}$/);
        }
      });
    });
  }

  it('every registered encoder rejects keys that are not 32 bytes', function () {
    for (const encoders of Object.values(ED25519_MULTISIG_COIN_ENCODERS)) {
      (() => encoders!.encodePub(Buffer.alloc(31))).should.throw(/32 bytes/);
      (() => encoders!.encodeSeed(Buffer.alloc(33))).should.throw(/32 bytes/);
    }
  });
});
