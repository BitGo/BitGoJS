import * as sinon from 'sinon';
import * as sdkCore from '@bitgo/sdk-core';
// Cross-module relative import: tsx resolves TypeScript source directly in the monorepo,
// avoiding a circular devDependency (sdk-coin-tao depends on abstract-substrate at runtime).
import { Ttao } from '../../../sdk-coin-tao/src';

interface SubstrateCoinTestAccessor {
  isMpcV2Keycard(userKey: string, walletPassphrase: string): Promise<{ version: 'v1' | 'v2' }>;
  addSubstrateRecoverySignature(
    txBuilder: unknown,
    signingMaterial: unknown,
    backupKey: string,
    walletPassphrase: string,
    unsignedTransaction: unknown,
    currPath: string,
    bitgoKey: string,
    accountId: string
  ): Promise<void>;
}

// 32-byte all-zeros hex: minimal valid Ed25519 public key for SubstrateKeyPair construction.
const MOCK_ACCOUNT_ID = '0'.repeat(64);
const MOCK_BITGO_KEY = 'aa'.repeat(32);
const MOCK_UNSIGNED_TX = { signablePayload: Buffer.from('deadbeef', 'hex') };

describe('SubstrateCoin MPCv2 recovery helpers:', function () {
  const sandBox = sinon.createSandbox();
  // Bypass the constructor (which requires a full BitGoBase) — we only need the
  // prototype methods.
  const basecoin = Object.create(Ttao.prototype) as Ttao & SubstrateCoinTestAccessor;
  // isEddsaMpcV1SigningMaterial is gated behind non-configurable namespace getters that
  // sinon cannot replace. Provide bitgo.decrypt so it uses that path instead of sjcl,
  // then control V1 vs V2 detection by returning JSON (V1) or non-JSON (V2).
  let decryptStub: sinon.SinonStub;

  beforeEach(function () {
    decryptStub = sinon.stub();
    (basecoin as unknown as { bitgo: unknown }).bitgo = { decrypt: decryptStub };
  });

  afterEach(function () {
    sandBox.restore();
  });

  describe('isMpcV2Keycard()', function () {
    it('should return version v2 for a CBOR (MPCv2) keycard', async function () {
      // Non-JSON decrypted value → V2 CBOR keycard
      decryptStub.resolves('not-json-cbor-bytes');
      const result = await basecoin.isMpcV2Keycard('encryptedKey', 'passphrase');
      result.version.should.equal('v2');
    });

    it('should return version v1 for a JSON (MPCv1) keycard', async function () {
      // isMpcV2Keycard checks uShare.seed + bitgoYShare.u + backupYShare.u
      decryptStub.resolves(
        JSON.stringify({
          uShare: { seed: 'deadbeef' },
          bitgoYShare: { u: 'aabbcc' },
          backupYShare: { u: 'ddeeff' },
        })
      );
      const result = await basecoin.isMpcV2Keycard('encryptedKey', 'passphrase');
      result.version.should.equal('v1');
    });

    it('should throw with a descriptive message when decryption fails', async function () {
      decryptStub.rejects(new Error('bad password'));
      await basecoin
        .isMpcV2Keycard('encryptedKey', 'wrong-passphrase')
        .should.be.rejectedWith(/Error decrypting user keychain/);
    });
  });

  describe('addSubstrateRecoverySignature()', function () {
    // EDDSAUtils.* are exported via `export * as Namespace`, compiling to non-configurable
    // property getters — sinon cannot replace them. Instead, SubstrateCoin exposes
    // getEddsaMpcV2RecoveryKeyShares() and signEddsaMpcV2Recovery() as protected methods
    // so they can be stubbed on the instance (own property shadows the prototype).
    // EDDSAMethods.getTSSSignature is a regular writable property — sinon can stub it directly.
    let addSignatureStub: sinon.SinonStub;
    let coin: SubstrateCoinTestAccessor;

    beforeEach(function () {
      addSignatureStub = sinon.stub();
      const instanceDecryptStub = sinon.stub();
      coin = Object.create(Ttao.prototype) as Ttao & SubstrateCoinTestAccessor;
      (coin as unknown as { bitgo: unknown }).bitgo = { decrypt: instanceDecryptStub };
    });

    it('should prepend ED25519 0x00 discriminant on MPCv2 path', async function () {
      const rawSig = Buffer.alloc(64, 0xab);
      sinon.stub(coin as unknown, 'getEddsaMpcV2RecoveryKeyShares').resolves({
        userKeyShare: 'ks1',
        backupKeyShare: 'ks2',
        commonKeyChain: MOCK_BITGO_KEY,
      });
      sinon.stub(coin as unknown, 'signEddsaMpcV2Recovery').resolves(rawSig);

      await coin.addSubstrateRecoverySignature(
        { addSignature: addSignatureStub },
        { version: 'v2', encryptedUserKey: 'encKey' },
        'encBackupKey',
        'passphrase',
        MOCK_UNSIGNED_TX,
        'm/0',
        MOCK_BITGO_KEY,
        MOCK_ACCOUNT_ID
      );

      addSignatureStub.calledOnce.should.be.true();
      const sig: Buffer = addSignatureStub.firstCall.args[1];
      sig[0].should.equal(0x00);
      sig.slice(1).should.deepEqual(rawSig);
    });

    it('should throw when commonKeyChain does not match bitgoKey on MPCv2 path', async function () {
      sinon.stub(coin as unknown, 'getEddsaMpcV2RecoveryKeyShares').resolves({
        userKeyShare: 'ks1',
        backupKeyShare: 'ks2',
        commonKeyChain: 'mismatch',
      });

      await coin
        .addSubstrateRecoverySignature(
          { addSignature: addSignatureStub },
          { version: 'v2', encryptedUserKey: 'encKey' },
          'encBackupKey',
          'passphrase',
          MOCK_UNSIGNED_TX,
          'm/0',
          MOCK_BITGO_KEY,
          MOCK_ACCOUNT_ID
        )
        .should.be.rejectedWith(/commonKeyChain from keycard does not match bitgoKey/);
    });

    it('should call getTSSSignature and pass result to addSignature on MPCv1 path', async function () {
      const mockSig = 'ff'.repeat(64);
      sandBox.stub(sdkCore.EDDSAMethods, 'getTSSSignature').resolves(mockSig);
      // decryptKeychain calls decryptKeychainPrivateKey → bitgo.decrypt for the backup key
      (coin as unknown as { bitgo: { decrypt: sinon.SinonStub } }).bitgo.decrypt.resolves(
        JSON.stringify({ yShares: {} })
      );

      const userPrv = JSON.stringify({
        uShare: { seed: 'deadbeef' },
        bitgoYShare: { u: 'aabbcc' },
        backupYShare: { u: 'ddeeff' },
      });

      await coin.addSubstrateRecoverySignature(
        { addSignature: addSignatureStub },
        { version: 'v1', userPrv },
        'encBackupKey',
        'passphrase',
        MOCK_UNSIGNED_TX,
        'm/0',
        MOCK_BITGO_KEY,
        MOCK_ACCOUNT_ID
      );

      (sdkCore.EDDSAMethods.getTSSSignature as sinon.SinonStub).calledOnce.should.be.true();
      addSignatureStub.calledOnce.should.be.true();
      addSignatureStub.firstCall.args[1].should.equal(mockSig);
    });
  });
});
