import * as assert from 'assert';
import { Hash, randomBytes } from 'crypto';
import createKeccakHash from 'keccak';
import * as openpgp from 'openpgp';
import * as sinon from 'sinon';
import * as sjcl from '@bitgo/sjcl';
import { DklsUtils } from '@bitgo/sdk-lib-mpc';

import { BitGoBase, EcdsaMPCv2Utils, IBaseCoin, TxRequest } from '../../../../../src';
import BaseTssUtils from '../../../../../src/bitgo/utils/tss/baseTSSUtils';

type BitgoGpgKeyPair = openpgp.SerializedKeyPair<string> & { revocationCertificate: string };
type TxRequestTransaction = NonNullable<TxRequest['transactions']>[number];
type UnsignedTransaction = TxRequestTransaction['unsignedTx'];
type SignableHexAndDerivationPath = {
  signableHex: string;
  derivationPath: string;
  serializedTxHex: string | undefined;
};
type DecryptedGpgKeys = { bitgoGpgKey: openpgp.Key; userGpgPrvKey: openpgp.PrivateKey };

class TestBaseTssUtils extends BaseTssUtils<Buffer> {
  getSignableHexAndDerivationPathForTest(
    txRequest: TxRequest,
    missingTransactionsMessage?: string
  ): SignableHexAndDerivationPath {
    return this.getSignableHexAndDerivationPath(txRequest, missingTransactionsMessage);
  }

  validateAdataForTest(adata: string, cyphertext: string, roundDomainSeparator: string): void {
    this.validateAdata(adata, cyphertext, roundDomainSeparator);
  }

  getBitgoAndUserGpgKeysForTest(
    bitgoPublicGpgKey: string,
    encryptedUserGpgPrvKey: string,
    walletPassphrase: string,
    adata: string,
    userGpgKeyDomainSeparator: string
  ): Promise<DecryptedGpgKeys> {
    return this.getBitgoAndUserGpgKeys(
      bitgoPublicGpgKey,
      encryptedUserGpgPrvKey,
      walletPassphrase,
      adata,
      userGpgKeyDomainSeparator
    );
  }
}

describe('Base TSS Utils', function () {
  const walletPassphrase = 'test-password';
  const signingUserGpgKeyDomainSeparator = 'MPS_DSG_SIGNING_USER_GPG_KEY';
  const roundOneDomainSeparator = 'MPS_DSG_SIGNING_ROUND1_STATE';

  let baseTssUtils: TestBaseTssUtils;
  let ecdsaMPCv2Utils: EcdsaMPCv2Utils;
  let mockBitgo: BitGoBase;
  let decryptAsyncStub: sinon.SinonStub;
  let bitgoGpgKeyPair: BitgoGpgKeyPair;
  let userGpgKeyPair: BitgoGpgKeyPair;
  let userShare: Buffer;

  before(async function () {
    openpgp.config.rejectCurves = new Set();
    bitgoGpgKeyPair = await openpgp.generateKey({
      userIDs: [{ name: 'bitgo', email: 'bitgo@test.com' }],
      curve: 'ed25519',
      format: 'armored',
    });
    userGpgKeyPair = await openpgp.generateKey({
      userIDs: [{ name: 'user', email: 'user@test.com' }],
      curve: 'ed25519',
      format: 'armored',
    });

    const [userDkgSession] = await DklsUtils.generateDKGKeyShares();
    userShare = userDkgSession.getKeyShare();
  });

  beforeEach(function () {
    decryptAsyncStub = sinon.stub().callsFake(async ({ input, password }: Parameters<BitGoBase['decryptAsync']>[0]) => {
      try {
        const parsed = JSON.parse(input);
        if (parsed.v === 2 && parsed.plaintext !== undefined) {
          return parsed.plaintext;
        }
      } catch {}
      return sjcl.decrypt(password ?? '', input);
    });

    const mockBg = {} as BitGoBase;
    mockBg.getEnv = sinon.stub().returns('test');
    mockBg.encrypt = sinon
      .stub()
      .callsFake((params) => encryptWithSjcl(params.password ?? '', params.input, params.adata));
    mockBg.encryptAsync = sinon
      .stub()
      .callsFake(async (params) => encryptWithSjcl(params.password ?? '', params.input, params.adata));
    mockBg.decrypt = sinon.stub().callsFake((params) => sjcl.decrypt(params.password ?? '', params.input));
    mockBg.decryptAsync = decryptAsyncStub;
    mockBitgo = mockBg;

    const mockCoin = {} as IBaseCoin;
    mockCoin.getHashFunction = sinon.stub().callsFake(() => createKeccakHash('keccak256') as Hash);

    baseTssUtils = new TestBaseTssUtils(mockBitgo, mockCoin);
    ecdsaMPCv2Utils = new EcdsaMPCv2Utils(mockBitgo, mockCoin);
  });

  describe('getSignableHexAndDerivationPath', function () {
    it('extracts signableHex and derivationPath from a valid txRequest', function () {
      const txRequest = buildTxRequest({
        transactions: [
          buildTransaction({
            unsignedTx: buildUnsignedTransaction({ signableHex: 'deadbeef', derivationPath: 'm/0/0' }),
          }),
        ],
      });

      const result = baseTssUtils.getSignableHexAndDerivationPathForTest(txRequest);
      assert.equal(result.signableHex, 'deadbeef');
      assert.equal(result.derivationPath, 'm/0/0');
    });

    it('throws when transactions field is missing', function () {
      assert.throws(
        () => baseTssUtils.getSignableHexAndDerivationPathForTest(buildTxRequestWithoutTransactions()),
        /createOfflineShare requires exactly one transaction in txRequest/
      );
    });

    it('throws when transactions array is empty', function () {
      assert.throws(
        () => baseTssUtils.getSignableHexAndDerivationPathForTest(buildTxRequest({ transactions: [] })),
        /createOfflineShare requires exactly one transaction in txRequest/
      );
    });

    it('throws when transactions array has more than one element', function () {
      assert.throws(
        () =>
          baseTssUtils.getSignableHexAndDerivationPathForTest(
            buildTxRequest({
              transactions: [
                buildTransaction({
                  unsignedTx: buildUnsignedTransaction({ signableHex: 'aaa', derivationPath: 'm/0' }),
                }),
                buildTransaction({
                  unsignedTx: buildUnsignedTransaction({ signableHex: 'bbb', derivationPath: 'm/1' }),
                }),
              ],
            })
          ),
        /createOfflineShare requires exactly one transaction in txRequest/
      );
    });

    it('throws when unsignedTx is missing', function () {
      // @ts-expect-error Intentionally malformed to exercise the runtime guard.
      const noUnsignedTx: TxRequestTransaction = { state: 'pendingSignature', signatureShares: [] };
      assert.throws(
        () => baseTssUtils.getSignableHexAndDerivationPathForTest(buildTxRequest({ transactions: [noUnsignedTx] })),
        /Missing unsignedTx in transactions/
      );
    });

    it('throws when signableHex is missing', function () {
      // @ts-expect-error Intentionally malformed to exercise the runtime guard.
      const noSignableHex: UnsignedTransaction = { serializedTxHex: 'aabbccdd', derivationPath: 'm/0' };
      assert.throws(
        () =>
          baseTssUtils.getSignableHexAndDerivationPathForTest(
            buildTxRequest({ transactions: [buildTransaction({ unsignedTx: noSignableHex })] })
          ),
        /Missing signableHex in unsignedTx/
      );
    });

    it('throws when derivationPath is missing', function () {
      // @ts-expect-error Intentionally malformed to exercise the runtime guard.
      const noDerivationPath: UnsignedTransaction = { serializedTxHex: 'aabbccdd', signableHex: 'deadbeef' };
      assert.throws(
        () =>
          baseTssUtils.getSignableHexAndDerivationPathForTest(
            buildTxRequest({ transactions: [buildTransaction({ unsignedTx: noDerivationPath })] })
          ),
        /Missing derivationPath in unsignedTx/
      );
    });
  });

  describe('validateAdata', function () {
    it('passes when adata matches with domain separator', function () {
      const adata = 'test-value';
      const cyphertext = mockBitgo.encrypt({
        input: 'secret',
        password: walletPassphrase,
        adata: `${roundOneDomainSeparator}:${adata}`,
      });
      assert.doesNotThrow(() => baseTssUtils.validateAdataForTest(adata, cyphertext, roundOneDomainSeparator));
    });

    it('passes when adata matches without domain separator', function () {
      const adata = 'test-value';
      const cyphertext = mockBitgo.encrypt({ input: 'secret', password: walletPassphrase, adata });
      assert.doesNotThrow(() => baseTssUtils.validateAdataForTest(adata, cyphertext, roundOneDomainSeparator));
    });

    it('throws when adata does not match', function () {
      const cyphertext = mockBitgo.encrypt({
        input: 'secret',
        password: walletPassphrase,
        adata: `${roundOneDomainSeparator}:correct`,
      });
      assert.throws(
        () => baseTssUtils.validateAdataForTest('wrong', cyphertext, roundOneDomainSeparator),
        /Adata does not match cyphertext adata/
      );
    });

    it('throws when cyphertext is not valid JSON', function () {
      assert.throws(
        () => baseTssUtils.validateAdataForTest('adata', 'not-json', roundOneDomainSeparator),
        /Failed to parse cyphertext to JSON/
      );
    });
  });

  describe('getBitgoAndUserGpgKeys', function () {
    it('decrypts v1 SJCL envelope without adata and skips validation', async function () {
      const encryptedUserGpgPrvKey = mockBitgo.encrypt({
        input: userGpgKeyPair.privateKey,
        password: walletPassphrase,
      });

      const result = await baseTssUtils.getBitgoAndUserGpgKeysForTest(
        bitgoGpgKeyPair.publicKey,
        encryptedUserGpgPrvKey,
        walletPassphrase,
        '',
        signingUserGpgKeyDomainSeparator
      );

      assert.ok(result.bitgoGpgKey);
      assert.equal(result.userGpgPrvKey.isPrivate(), true);
    });

    it('decrypts v1 SJCL envelope with matching adata', async function () {
      const adata = 'test-adata';
      const encryptedUserGpgPrvKey = mockBitgo.encrypt({
        input: userGpgKeyPair.privateKey,
        password: walletPassphrase,
        adata: `${signingUserGpgKeyDomainSeparator}:${adata}`,
      });

      const result = await baseTssUtils.getBitgoAndUserGpgKeysForTest(
        bitgoGpgKeyPair.publicKey,
        encryptedUserGpgPrvKey,
        walletPassphrase,
        adata,
        signingUserGpgKeyDomainSeparator
      );

      assert.ok(result.bitgoGpgKey);
      assert.equal(result.userGpgPrvKey.isPrivate(), true);
    });

    it('decrypts via decryptAsync and returns GPG keys', async function () {
      const adata = 'test-adata';
      // Use a fake v2 envelope (v:2) so isV2Envelope returns true and decryptAsync is called.
      // The stub extracts plaintext directly from this fake format.
      const encryptedUserGpgPrvKey = JSON.stringify({
        v: 2,
        adata: `${signingUserGpgKeyDomainSeparator}:${adata}`,
        plaintext: userGpgKeyPair.privateKey,
      });

      const result = await baseTssUtils.getBitgoAndUserGpgKeysForTest(
        bitgoGpgKeyPair.publicKey,
        encryptedUserGpgPrvKey,
        walletPassphrase,
        adata,
        signingUserGpgKeyDomainSeparator
      );

      sinon.assert.calledOnce(decryptAsyncStub);
      assert.ok(result.bitgoGpgKey);
      assert.equal(result.userGpgPrvKey.isPrivate(), true);
    });

    it('throws when adata does not match', async function () {
      const encryptedUserGpgPrvKey = mockBitgo.encrypt({
        input: userGpgKeyPair.privateKey,
        password: walletPassphrase,
        adata: `${signingUserGpgKeyDomainSeparator}:correct-adata`,
      });

      await assert.rejects(
        baseTssUtils.getBitgoAndUserGpgKeysForTest(
          bitgoGpgKeyPair.publicKey,
          encryptedUserGpgPrvKey,
          walletPassphrase,
          'wrong-adata',
          signingUserGpgKeyDomainSeparator
        ),
        /Adata does not match cyphertext adata/
      );
    });

    it('throws when cyphertext is not valid JSON', async function () {
      await assert.rejects(
        baseTssUtils.getBitgoAndUserGpgKeysForTest(
          bitgoGpgKeyPair.publicKey,
          'not-valid-json',
          walletPassphrase,
          'test-adata',
          signingUserGpgKeyDomainSeparator
        ),
        /json decode|Failed to parse cyphertext to JSON/
      );
    });
  });

  describe('ECDSA MPC v2 delegated txRequest parsing', function () {
    it('getHashStringAndDerivationPath produces the correct hashBuffer and derivationPath', async function () {
      const signableHex = 'deadbeef';
      const derivationPath = 'm/0';
      const txRequest = buildTxRequest({
        transactions: [buildTransaction({ unsignedTx: buildUnsignedTransaction({ signableHex, derivationPath }) })],
      });
      const expectedHashBuffer = createKeccakHash('keccak256').update(Buffer.from(signableHex, 'hex')).digest();

      const { encryptedRound1Session } = await ecdsaMPCv2Utils.createOfflineRound1Share({
        txRequest,
        prv: userShare.toString('base64'),
        walletPassphrase,
      });

      // The round-1 session is encrypted with adata = "DKLS23_SIGNING_ROUND1_STATE:<hash>:<derivationPath>",
      // which proves getHashStringAndDerivationPath produced the right values after the delegation refactor.
      const { adata } = JSON.parse(encryptedRound1Session) as { adata?: string };
      assert.equal(
        adata === undefined ? adata : decodeURIComponent(adata),
        `DKLS23_SIGNING_ROUND1_STATE:${expectedHashBuffer.toString('hex')}:${derivationPath}`
      );
    });

    it('propagates the base unsignedTx guard through the ECDSA route', async function () {
      // @ts-expect-error Intentionally malformed to exercise the runtime guard.
      const noUnsignedTx: TxRequestTransaction = { state: 'pendingSignature', signatureShares: [] };
      await assert.rejects(
        ecdsaMPCv2Utils.createOfflineRound1Share({
          txRequest: buildTxRequest({ transactions: [noUnsignedTx] }),
          prv: 'unused',
          walletPassphrase,
        }),
        /Missing unsignedTx in transactions/
      );
    });
  });
});

// ---------------------------------------------------------------------------
// Fixture builders
// ---------------------------------------------------------------------------

function buildTxRequest(overrides: Partial<TxRequest> = {}): TxRequest {
  return {
    txRequestId: 'tx-request-id',
    walletId: 'wallet-id',
    walletType: 'hot',
    version: 1,
    state: 'initialized',
    date: new Date(0).toISOString(),
    userId: 'user-id',
    intent: {},
    policiesChecked: true,
    unsignedTxs: [],
    transactions: [buildTransaction()],
    latest: true,
    ...overrides,
  };
}

function buildTxRequestWithoutTransactions(): TxRequest {
  const txRequest = buildTxRequest();
  delete txRequest.transactions;
  return txRequest;
}

function buildTransaction(overrides: Partial<TxRequestTransaction> = {}): TxRequestTransaction {
  return { state: 'pendingSignature', unsignedTx: buildUnsignedTransaction(), signatureShares: [], ...overrides };
}

function buildUnsignedTransaction(overrides: Partial<UnsignedTransaction> = {}): UnsignedTransaction {
  return { serializedTxHex: 'aabbccdd', signableHex: 'deadbeef', derivationPath: 'm/0', ...overrides };
}

// ---------------------------------------------------------------------------
// Encryption helpers (mirrors the ecdsaMPCv2 test pattern)
// ---------------------------------------------------------------------------

function encryptWithSjcl(password: string, input: string, adata?: string): string {
  const salt = randomBytes(8);
  const iv = randomBytes(16);
  return sjcl.encrypt(password, input, {
    salt: [bytesToWord(salt.subarray(0, 4)), bytesToWord(salt.subarray(4))],
    iv: [
      bytesToWord(iv.subarray(0, 4)),
      bytesToWord(iv.subarray(4, 8)),
      bytesToWord(iv.subarray(8, 12)),
      bytesToWord(iv.subarray(12, 16)),
    ],
    ...(adata !== undefined ? { adata } : {}),
  });
}

function bytesToWord(bytes: Uint8Array): number {
  if (bytes.length !== 4) {
    throw new Error('bytes must have length 4');
  }
  return bytes.reduce((num, byte) => num * 0x100 + byte, 0);
}
