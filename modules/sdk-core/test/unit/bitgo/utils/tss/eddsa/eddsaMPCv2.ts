import * as assert from 'assert';
import * as sinon from 'sinon';
import * as pgp from 'openpgp';
import { randomBytes } from 'crypto';
import { deriveUnhardenedMps, EddsaMPSDsg, MPSComms, MPSTypes, MPSUtil } from '@bitgo/sdk-lib-mpc';
import { ed25519 } from '@noble/curves/ed25519';
import * as sjcl from '@bitgo/sjcl';
import {
  EddsaMPCv2SignatureShareRound1Input,
  EddsaMPCv2SignatureShareRound1Output,
  EddsaMPCv2SignatureShareRound2Input,
  EddsaMPCv2SignatureShareRound2Output,
  EddsaMPCv2SignatureShareRound3Input,
} from '@bitgo/public-types';
import {
  BitGoBase,
  BitGoRequest,
  CustomEddsaMPCv2SigningRound1GeneratingFunction,
  CustomEddsaMPCv2SigningRound2GeneratingFunction,
  CustomEddsaMPCv2SigningRound3GeneratingFunction,
  EDDSAUtils,
  EddsaMPCv2Utils,
  IBaseCoin,
  IWallet,
  RequestTracer,
  SignatureShareRecord,
  SignatureShareType,
  TxRequest,
} from '../../../../../../src';
import {
  getSignatureShareRoundOne,
  getSignatureShareRoundTwo,
  getSignatureShareRoundThree,
  verifyPeerMessageRoundOne,
  verifyPeerMessageRoundTwo,
} from '../../../../../../src/bitgo/tss/eddsa/eddsaMPCv2';
import { getBitgoSignatureShare } from '../../../../../../src/bitgo/tss/common';
import { decodeWithCodec } from '../../../../../../src/bitgo/utils/codecs';
import { generateGPGKeyPair } from '../../../../../../src/bitgo/utils/opengpgUtils';
import { MPCv2PartiesEnum } from '../../../../../../src/bitgo/utils/tss/ecdsa/typesMPCv2';
import { isV2Envelope } from '../../../../../../src/bitgo/utils/tss/baseTypes';

describe('EdDSA MPS DSG helper functions', async () => {
  let userKeyShare: Buffer;
  let backupKeyShare: Buffer;
  let bitgoKeyShare: Buffer;
  let userGpgPrivKey: pgp.PrivateKey;
  let backupGpgPrivKey: pgp.PrivateKey;
  let bitgoGpgPrivKey: pgp.PrivateKey;
  let bitgoGpgPubKey: pgp.Key;

  const signableHex = 'deadbeef';
  const derivationPath = 'm/0';

  before('generate EdDSA DKG key shares', async () => {
    const userGpgKeyPair = await generateGPGKeyPair('ed25519');
    const backupGpgKeyPair = await generateGPGKeyPair('ed25519');
    const bitgoGpgKeyPair = await generateGPGKeyPair('ed25519');

    userGpgPrivKey = await pgp.readPrivateKey({ armoredKey: userGpgKeyPair.privateKey });
    backupGpgPrivKey = await pgp.readPrivateKey({ armoredKey: backupGpgKeyPair.privateKey });
    bitgoGpgPrivKey = await pgp.readPrivateKey({ armoredKey: bitgoGpgKeyPair.privateKey });
    bitgoGpgPubKey = await pgp.readKey({ armoredKey: bitgoGpgKeyPair.publicKey });

    const [userDkg, backupDkg, bitgoDkg] = await MPSUtil.generateEdDsaDKGKeyShares();
    userKeyShare = userDkg.getKeyShare();
    backupKeyShare = backupDkg.getKeyShare();
    bitgoKeyShare = bitgoDkg.getKeyShare();
  });

  // ── Round 1 ─────────────────────────────────────────────────────────────────

  it('getSignatureShareRoundOne should build a valid round-1 share', async () => {
    const messageBuffer = Buffer.from(signableHex, 'hex');
    const userDsg = new EddsaMPSDsg.DSG(MPCv2PartiesEnum.USER);
    await userDsg.initDsg(userKeyShare, messageBuffer, derivationPath, MPCv2PartiesEnum.BITGO);
    const userMsg1 = userDsg.getFirstMessage();

    const share: SignatureShareRecord = await getSignatureShareRoundOne(userMsg1, userGpgPrivKey);

    assert.strictEqual(share.from, SignatureShareType.USER);
    assert.strictEqual(share.to, SignatureShareType.BITGO);

    const parsed = decodeWithCodec(
      EddsaMPCv2SignatureShareRound1Input,
      JSON.parse(share.share),
      'EddsaMPCv2SignatureShareRound1Input'
    );
    assert.strictEqual(parsed.type, 'round1Input');
    assert.ok(parsed.data.msg1.message, 'msg1.message should be set');
    assert.ok(parsed.data.msg1.signature, 'msg1.signature should be set');
  });

  it('getSignatureShareRoundOne should build a valid backup round-1 share', async () => {
    const messageBuffer = Buffer.from(signableHex, 'hex');
    const backupDsg = new EddsaMPSDsg.DSG(MPCv2PartiesEnum.BACKUP);
    await backupDsg.initDsg(backupKeyShare, messageBuffer, derivationPath, MPCv2PartiesEnum.BITGO);
    const backupMsg1 = backupDsg.getFirstMessage();

    const share: SignatureShareRecord = await getSignatureShareRoundOne(
      backupMsg1,
      backupGpgPrivKey,
      MPCv2PartiesEnum.BACKUP
    );

    assert.strictEqual(share.from, SignatureShareType.BACKUP);
    assert.strictEqual(share.to, SignatureShareType.BITGO);

    const parsed = decodeWithCodec(
      EddsaMPCv2SignatureShareRound1Input,
      JSON.parse(share.share),
      'EddsaMPCv2SignatureShareRound1Input'
    );
    assert.strictEqual(parsed.type, 'round1Input');
    assert.ok(parsed.data.msg1.message, 'msg1.message should be set');
    assert.ok(parsed.data.msg1.signature, 'msg1.signature should be set');
  });

  it('verifyPeerMessageRoundOne should verify a valid BitGo round-1 message', async () => {
    const messageBuffer = Buffer.from(signableHex, 'hex');
    const bitgoDsg = new EddsaMPSDsg.DSG(MPCv2PartiesEnum.BITGO);
    await bitgoDsg.initDsg(bitgoKeyShare, messageBuffer, derivationPath, MPCv2PartiesEnum.USER);
    const bitgoMsg1 = bitgoDsg.getFirstMessage();

    const bitgoSignedMsg1 = await MPSComms.detachSignMpsMessage(Buffer.from(bitgoMsg1.payload), bitgoGpgPrivKey);
    const round1Output: EddsaMPCv2SignatureShareRound1Output = {
      type: 'round1Output',
      data: { msg1: bitgoSignedMsg1 },
    };

    const result = await verifyPeerMessageRoundOne(round1Output, bitgoGpgPubKey);

    assert.strictEqual(result.from, MPCv2PartiesEnum.BITGO);
    assert.ok(result.payload.length > 0, 'payload should be non-empty');
  });

  it('verifyPeerMessageRoundOne should throw on a tampered message', async () => {
    const round1Output: EddsaMPCv2SignatureShareRound1Output = {
      type: 'round1Output',
      data: {
        msg1: {
          message: Buffer.from('tampered').toString('base64'),
          signature: '-----BEGIN PGP SIGNATURE-----\n\nINVALID\n-----END PGP SIGNATURE-----\n',
        },
      },
    };

    await assert.rejects(verifyPeerMessageRoundOne(round1Output, bitgoGpgPubKey), 'should throw on invalid signature');
  });

  // ── Round 2 ─────────────────────────────────────────────────────────────────

  it('getSignatureShareRoundTwo should build a valid round-2 share', async () => {
    const messageBuffer = Buffer.from(signableHex, 'hex');
    const userDsg = new EddsaMPSDsg.DSG(MPCv2PartiesEnum.USER);
    await userDsg.initDsg(userKeyShare, messageBuffer, derivationPath, MPCv2PartiesEnum.BITGO);
    const userMsg1 = userDsg.getFirstMessage();

    const bitgoDsg = new EddsaMPSDsg.DSG(MPCv2PartiesEnum.BITGO);
    await bitgoDsg.initDsg(bitgoKeyShare, messageBuffer, derivationPath, MPCv2PartiesEnum.USER);
    const bitgoMsg1 = bitgoDsg.getFirstMessage();

    const bitgoSignedMsg1 = await MPSComms.detachSignMpsMessage(Buffer.from(bitgoMsg1.payload), bitgoGpgPrivKey);
    const bitgoDeserializedMsg1 = await verifyPeerMessageRoundOne(
      { type: 'round1Output', data: { msg1: bitgoSignedMsg1 } },
      bitgoGpgPubKey
    );
    const [userMsg2] = userDsg.handleIncomingMessages([userMsg1, bitgoDeserializedMsg1]);

    const share: SignatureShareRecord = await getSignatureShareRoundTwo(userMsg2, userGpgPrivKey);

    assert.strictEqual(share.from, SignatureShareType.USER);
    assert.strictEqual(share.to, SignatureShareType.BITGO);

    const parsed = decodeWithCodec(
      EddsaMPCv2SignatureShareRound2Input,
      JSON.parse(share.share),
      'EddsaMPCv2SignatureShareRound2Input'
    );
    assert.strictEqual(parsed.type, 'round2Input');
    assert.ok(parsed.data.msg2.message, 'msg2.message should be set');
    assert.ok(parsed.data.msg2.signature, 'msg2.signature should be set');
  });

  it('getSignatureShareRoundTwo should build a valid backup round-2 share', async () => {
    const messageBuffer = Buffer.from(signableHex, 'hex');
    const backupDsg = new EddsaMPSDsg.DSG(MPCv2PartiesEnum.BACKUP);
    await backupDsg.initDsg(backupKeyShare, messageBuffer, derivationPath, MPCv2PartiesEnum.BITGO);
    const backupMsg1 = backupDsg.getFirstMessage();

    const bitgoDsg = new EddsaMPSDsg.DSG(MPCv2PartiesEnum.BITGO);
    await bitgoDsg.initDsg(bitgoKeyShare, messageBuffer, derivationPath, MPCv2PartiesEnum.BACKUP);
    const bitgoMsg1 = bitgoDsg.getFirstMessage();

    const bitgoSignedMsg1 = await MPSComms.detachSignMpsMessage(Buffer.from(bitgoMsg1.payload), bitgoGpgPrivKey);
    const bitgoDeserializedMsg1 = await verifyPeerMessageRoundOne(
      { type: 'round1Output', data: { msg1: bitgoSignedMsg1 } },
      bitgoGpgPubKey
    );
    const [backupMsg2] = backupDsg.handleIncomingMessages([backupMsg1, bitgoDeserializedMsg1]);

    const share: SignatureShareRecord = await getSignatureShareRoundTwo(
      backupMsg2,
      backupGpgPrivKey,
      MPCv2PartiesEnum.BACKUP
    );

    assert.strictEqual(share.from, SignatureShareType.BACKUP);
    assert.strictEqual(share.to, SignatureShareType.BITGO);

    const parsed = decodeWithCodec(
      EddsaMPCv2SignatureShareRound2Input,
      JSON.parse(share.share),
      'EddsaMPCv2SignatureShareRound2Input'
    );
    assert.strictEqual(parsed.type, 'round2Input');
    assert.ok(parsed.data.msg2.message, 'msg2.message should be set');
    assert.ok(parsed.data.msg2.signature, 'msg2.signature should be set');
  });

  it('verifyPeerMessageRoundTwo should verify a valid BitGo round-2 message', async () => {
    const messageBuffer = Buffer.from(signableHex, 'hex');
    const userDsg = new EddsaMPSDsg.DSG(MPCv2PartiesEnum.USER);
    await userDsg.initDsg(userKeyShare, messageBuffer, derivationPath, MPCv2PartiesEnum.BITGO);
    const userMsg1 = userDsg.getFirstMessage();

    const bitgoDsg = new EddsaMPSDsg.DSG(MPCv2PartiesEnum.BITGO);
    await bitgoDsg.initDsg(bitgoKeyShare, messageBuffer, derivationPath, MPCv2PartiesEnum.USER);
    const bitgoMsg1 = bitgoDsg.getFirstMessage();

    const [bitgoMsg2] = bitgoDsg.handleIncomingMessages([bitgoMsg1, userMsg1]);
    const bitgoSignedMsg2 = await MPSComms.detachSignMpsMessage(Buffer.from(bitgoMsg2.payload), bitgoGpgPrivKey);

    const round2Output: EddsaMPCv2SignatureShareRound2Output = {
      type: 'round2Output',
      data: { msg2: bitgoSignedMsg2 },
    };

    const result = await verifyPeerMessageRoundTwo(round2Output, bitgoGpgPubKey);

    assert.strictEqual(result.from, MPCv2PartiesEnum.BITGO);
    assert.ok(result.payload.length > 0, 'payload should be non-empty');
  });

  it('verifyPeerMessageRoundTwo should throw on a tampered message', async () => {
    const round2Output: EddsaMPCv2SignatureShareRound2Output = {
      type: 'round2Output',
      data: {
        msg2: {
          message: Buffer.from('tampered').toString('base64'),
          signature: '-----BEGIN PGP SIGNATURE-----\n\nINVALID\n-----END PGP SIGNATURE-----\n',
        },
      },
    };

    await assert.rejects(verifyPeerMessageRoundTwo(round2Output, bitgoGpgPubKey), 'should throw on invalid signature');
  });

  // ── Round 3 ─────────────────────────────────────────────────────────────────

  it('getSignatureShareRoundThree should build a valid round-3 share', async () => {
    const messageBuffer = Buffer.from(signableHex, 'hex');
    const userDsg = new EddsaMPSDsg.DSG(MPCv2PartiesEnum.USER);
    await userDsg.initDsg(userKeyShare, messageBuffer, derivationPath, MPCv2PartiesEnum.BITGO);
    const userMsg1 = userDsg.getFirstMessage();

    const bitgoDsg = new EddsaMPSDsg.DSG(MPCv2PartiesEnum.BITGO);
    await bitgoDsg.initDsg(bitgoKeyShare, messageBuffer, derivationPath, MPCv2PartiesEnum.USER);
    const bitgoMsg1 = bitgoDsg.getFirstMessage();

    // Advance to round 2
    const bitgoSignedMsg1 = await MPSComms.detachSignMpsMessage(Buffer.from(bitgoMsg1.payload), bitgoGpgPrivKey);
    const bitgoDeserializedMsg1 = await verifyPeerMessageRoundOne(
      { type: 'round1Output', data: { msg1: bitgoSignedMsg1 } },
      bitgoGpgPubKey
    );
    const [userMsg2] = userDsg.handleIncomingMessages([userMsg1, bitgoDeserializedMsg1]);

    const [bitgoMsg2] = bitgoDsg.handleIncomingMessages([bitgoMsg1, userMsg1]);
    const bitgoSignedMsg2 = await MPSComms.detachSignMpsMessage(Buffer.from(bitgoMsg2.payload), bitgoGpgPrivKey);
    const bitgoDeserializedMsg2 = await verifyPeerMessageRoundTwo(
      { type: 'round2Output', data: { msg2: bitgoSignedMsg2 } },
      bitgoGpgPubKey
    );
    const [userMsg3] = userDsg.handleIncomingMessages([userMsg2, bitgoDeserializedMsg2]);

    const share: SignatureShareRecord = await getSignatureShareRoundThree(userMsg3, userGpgPrivKey);

    assert.strictEqual(share.from, SignatureShareType.USER);
    assert.strictEqual(share.to, SignatureShareType.BITGO);

    const parsed = decodeWithCodec(
      EddsaMPCv2SignatureShareRound3Input,
      JSON.parse(share.share),
      'EddsaMPCv2SignatureShareRound3Input'
    );
    assert.strictEqual(parsed.type, 'round3Input');
    assert.ok(parsed.data.msg3.message, 'msg3.message should be set');
    assert.ok(parsed.data.msg3.signature, 'msg3.signature should be set');
  });

  it('getSignatureShareRoundThree should build a valid backup round-3 share', async () => {
    const messageBuffer = Buffer.from(signableHex, 'hex');
    const backupDsg = new EddsaMPSDsg.DSG(MPCv2PartiesEnum.BACKUP);
    await backupDsg.initDsg(backupKeyShare, messageBuffer, derivationPath, MPCv2PartiesEnum.BITGO);
    const backupMsg1 = backupDsg.getFirstMessage();

    const bitgoDsg = new EddsaMPSDsg.DSG(MPCv2PartiesEnum.BITGO);
    await bitgoDsg.initDsg(bitgoKeyShare, messageBuffer, derivationPath, MPCv2PartiesEnum.BACKUP);
    const bitgoMsg1 = bitgoDsg.getFirstMessage();

    const bitgoSignedMsg1 = await MPSComms.detachSignMpsMessage(Buffer.from(bitgoMsg1.payload), bitgoGpgPrivKey);
    const bitgoDeserializedMsg1 = await verifyPeerMessageRoundOne(
      { type: 'round1Output', data: { msg1: bitgoSignedMsg1 } },
      bitgoGpgPubKey
    );
    const [backupMsg2] = backupDsg.handleIncomingMessages([backupMsg1, bitgoDeserializedMsg1]);

    const [bitgoMsg2] = bitgoDsg.handleIncomingMessages([bitgoMsg1, backupMsg1]);
    const bitgoSignedMsg2 = await MPSComms.detachSignMpsMessage(Buffer.from(bitgoMsg2.payload), bitgoGpgPrivKey);
    const bitgoDeserializedMsg2 = await verifyPeerMessageRoundTwo(
      { type: 'round2Output', data: { msg2: bitgoSignedMsg2 } },
      bitgoGpgPubKey
    );
    const [backupMsg3] = backupDsg.handleIncomingMessages([backupMsg2, bitgoDeserializedMsg2]);

    const share: SignatureShareRecord = await getSignatureShareRoundThree(
      backupMsg3,
      backupGpgPrivKey,
      MPCv2PartiesEnum.BACKUP
    );

    assert.strictEqual(share.from, SignatureShareType.BACKUP);
    assert.strictEqual(share.to, SignatureShareType.BITGO);

    const parsed = decodeWithCodec(
      EddsaMPCv2SignatureShareRound3Input,
      JSON.parse(share.share),
      'EddsaMPCv2SignatureShareRound3Input'
    );
    assert.strictEqual(parsed.type, 'round3Input');
    assert.ok(parsed.data.msg3.message, 'msg3.message should be set');
    assert.ok(parsed.data.msg3.signature, 'msg3.signature should be set');
  });
});

describe('getEddsaMPCv2RecoveryKeyShares', () => {
  const walletPassphrase = 'testPass';

  const encryptKey = (keyShare: Buffer): string => sjcl.encrypt(walletPassphrase, keyShare.toString('base64'));

  it('should return recovery key shares from v1-encrypted reduced keys (no bitgo instance)', async () => {
    const [userDkg, backupDkg] = await MPSUtil.generateEdDsaDKGKeyShares();
    const result = await EDDSAUtils.getEddsaMpcV2RecoveryKeySharesFromReducedKey(
      encryptKey(userDkg.getReducedKeyShare()),
      encryptKey(backupDkg.getReducedKeyShare()),
      walletPassphrase
    );

    assert.deepStrictEqual(result.userKeyShare, userDkg.getKeyShare());
    assert.deepStrictEqual(result.backupKeyShare, backupDkg.getKeyShare());
    assert.strictEqual(result.commonKeyChain, userDkg.getCommonKeychain());
  });

  it('should route decryption through bitgo.decryptAsync when a bitgo instance is provided', async () => {
    // sdk-core has no devDependency on sdk-api or argon2, so we cannot encrypt with a real v2 envelope here.
    // The stub verifies that the function delegates to bitgo.decryptAsync (which supports v1 + v2 in
    // production) rather than falling back to sjcl.decrypt.
    const [userDkg, backupDkg] = await MPSUtil.generateEdDsaDKGKeyShares();
    const userKeyBase64 = userDkg.getReducedKeyShare().toString('base64');
    const backupKeyBase64 = backupDkg.getReducedKeyShare().toString('base64');

    const mockBitgo = {
      decryptAsync: sinon.stub().onFirstCall().resolves(userKeyBase64).onSecondCall().resolves(backupKeyBase64),
    } as unknown as BitGoBase;

    const result = await EDDSAUtils.getEddsaMpcV2RecoveryKeySharesFromReducedKey(
      'encrypted-user-key',
      'encrypted-backup-key',
      walletPassphrase,
      mockBitgo
    );

    sinon.assert.calledTwice(mockBitgo.decryptAsync as sinon.SinonStub);
    assert.deepStrictEqual(result.userKeyShare, userDkg.getKeyShare());
    assert.deepStrictEqual(result.backupKeyShare, backupDkg.getKeyShare());
    assert.strictEqual(result.commonKeyChain, userDkg.getCommonKeychain());
  });

  it('should reject a malformed keycard with a descriptive error', async () => {
    const [userDkg] = await MPSUtil.generateEdDsaDKGKeyShares();
    const malformedKey = sjcl.encrypt(walletPassphrase, randomBytes(64).toString('base64'));
    await assert.rejects(
      EDDSAUtils.getEddsaMpcV2RecoveryKeySharesFromReducedKey(
        malformedKey,
        encryptKey(userDkg.getReducedKeyShare()),
        walletPassphrase
      ),
      /unable to decode reduced key share/
    );
  });

  it('should reject reduced keys from different wallets', async () => {
    const [userDkg] = await MPSUtil.generateEdDsaDKGKeyShares();
    const [, backupDkg] = await MPSUtil.generateEdDsaDKGKeyShares();
    await assert.rejects(
      EDDSAUtils.getEddsaMpcV2RecoveryKeySharesFromReducedKey(
        encryptKey(userDkg.getReducedKeyShare()),
        encryptKey(backupDkg.getReducedKeyShare()),
        walletPassphrase
      ),
      /pub keys do not match/
    );
  });

  it('should reject reduced keys with matching pub but mismatched rootChainCodes', async () => {
    const [userDkg, backupDkg] = await MPSUtil.generateEdDsaDKGKeyShares();
    const userReducedKeyShare = userDkg.getReducedKeyShare();
    const backupReducedKeyShare = backupDkg.getReducedKeyShare();
    const getDecodedReducedKeyShare = MPSTypes.getDecodedReducedKeyShare;
    const decodeStub = sinon.stub(MPSTypes, 'getDecodedReducedKeyShare').callsFake((buf) => {
      const reduced = getDecodedReducedKeyShare(buf);
      if (Buffer.from(buf).equals(backupReducedKeyShare)) {
        return {
          ...reduced,
          rootChainCode: Array.from(randomBytes(32)),
        };
      }
      return reduced;
    });

    try {
      await assert.rejects(
        EDDSAUtils.getEddsaMpcV2RecoveryKeySharesFromReducedKey(
          encryptKey(userReducedKeyShare),
          encryptKey(backupReducedKeyShare),
          walletPassphrase
        ),
        /rootChainCodes do not match/
      );
    } finally {
      decodeStub.restore();
    }
  });
});

describe('EddsaMPCv2Utils.createOfflineRound1Share', () => {
  let eddsaMPCv2Utils: EddsaMPCv2Utils;
  let mockBitgo: BitGoBase;
  let userKeyShare: Buffer;

  const walletPassphrase = 'testPass';
  const signableHex = 'deadbeef';
  const derivationPath = 'm/0/0';
  const expectedAdata = `${signableHex}:${derivationPath}`;
  const txRequest: TxRequest = {
    txRequestId: 'txreq-eddsa-round1',
    walletId: 'wallet-eddsa-round1',
    enterpriseId: 'enterprise-eddsa-round1',
    apiVersion: 'full',
    transactions: [
      {
        unsignedTx: {
          signableHex,
          derivationPath,
          serializedTxHex: signableHex,
        },
        signatureShares: [],
      },
    ],
    intent: { intentType: 'payment' },
    unsignedTxs: [],
  } as unknown as TxRequest;

  before('generate EdDSA user key share', async () => {
    const [userDkg] = await MPSUtil.generateEdDsaDKGKeyShares();
    userKeyShare = userDkg.getKeyShare();
  });

  beforeEach(() => {
    const sjclEncrypt = (params: { password: string; input: string; adata?: string }) => {
      const salt = randomBytes(8);
      const iv = randomBytes(16);
      return sjcl.encrypt(params.password, params.input, {
        salt: [bytesToWord(salt.subarray(0, 4)), bytesToWord(salt.subarray(4))],
        iv: [
          bytesToWord(iv.subarray(0, 4)),
          bytesToWord(iv.subarray(4, 8)),
          bytesToWord(iv.subarray(8, 12)),
          bytesToWord(iv.subarray(12, 16)),
        ],
        adata: params.adata,
      });
    };
    mockBitgo = {
      encrypt: sinon.stub().callsFake(sjclEncrypt),
      encryptAsync: sinon.stub().callsFake(async (params) => sjclEncrypt(params)),
    } as unknown as BitGoBase;

    const mockCoin = {
      getMPCAlgorithm: sinon.stub().returns('eddsa'),
    } as unknown as IBaseCoin;

    eddsaMPCv2Utils = new EddsaMPCv2Utils(mockBitgo, mockCoin);
  });

  it('should create a round-1 share and encrypted SJCL session payload', async () => {
    const result = await eddsaMPCv2Utils.createOfflineRound1Share({
      txRequest,
      prv: userKeyShare.toString('base64'),
      walletPassphrase,
    });

    assert.strictEqual(result.signatureShareRound1.from, SignatureShareType.USER);
    assert.strictEqual(result.signatureShareRound1.to, SignatureShareType.BITGO);
    assert.ok(result.userGpgPubKey.includes('BEGIN PGP PUBLIC KEY BLOCK'));
    assert.ok(JSON.parse(result.encryptedRound1Session).ct, 'encryptedRound1Session should be an SJCL JSON blob');
    assert.ok(JSON.parse(result.encryptedUserGpgPrvKey).ct, 'encryptedUserGpgPrvKey should be an SJCL JSON blob');

    const parsedShare = decodeWithCodec(
      EddsaMPCv2SignatureShareRound1Input,
      JSON.parse(result.signatureShareRound1.share),
      'EddsaMPCv2SignatureShareRound1Input'
    );
    assert.strictEqual(parsedShare.type, 'round1Input');
    assert.ok(parsedShare.data.msg1.message, 'msg1.message should be set');
    assert.ok(parsedShare.data.msg1.signature, 'msg1.signature should be set');

    const encryptedRound1Session = JSON.parse(result.encryptedRound1Session);
    const encryptedUserGpgPrvKey = JSON.parse(result.encryptedUserGpgPrvKey);
    assert.strictEqual(
      decodeURIComponent(encryptedRound1Session.adata),
      `MPS_DSG_SIGNING_ROUND1_STATE:${expectedAdata}`,
      'round-1 session adata should bind the signing context'
    );
    assert.strictEqual(
      decodeURIComponent(encryptedUserGpgPrvKey.adata),
      `MPS_DSG_SIGNING_USER_GPG_KEY:${expectedAdata}`,
      'GPG private key adata should bind the signing context'
    );

    const sessionPayload = JSON.parse(sjcl.decrypt(walletPassphrase, result.encryptedRound1Session));
    assert.ok(sessionPayload.dsgSession, 'dsgSession should be persisted for round 2');
    assert.ok(sessionPayload.userMsgPayload, 'userMsgPayload should be persisted for round 2');
  });

  it('should use v2 encryption when encryptedPrv is a v2 envelope', async () => {
    const encrypt = sinon
      .stub()
      .callsFake((input: string, adata: string) => Promise.resolve(JSON.stringify({ v: 2, input, adata })));
    const destroy = sinon.stub();
    const createEncryptionSession = sinon.stub().resolves({ encrypt, destroy });
    mockBitgo.createEncryptionSession = createEncryptionSession;

    const result = await eddsaMPCv2Utils.createOfflineRound1Share({
      txRequest,
      prv: userKeyShare.toString('base64'),
      walletPassphrase,
      encryptedPrv: JSON.stringify({ v: 2 }),
    });

    sinon.assert.calledOnce(createEncryptionSession);
    assert.strictEqual(createEncryptionSession.getCall(0).args[0], walletPassphrase);
    sinon.assert.notCalled(mockBitgo.encryptAsync as sinon.SinonStub);
    sinon.assert.calledTwice(encrypt);
    sinon.assert.calledOnce(destroy);

    const encryptedRound1Session = JSON.parse(result.encryptedRound1Session);
    const encryptedUserGpgPrvKey = JSON.parse(result.encryptedUserGpgPrvKey);
    assert.strictEqual(encryptedRound1Session.v, 2);
    assert.strictEqual(encryptedRound1Session.adata, `MPS_DSG_SIGNING_ROUND1_STATE:${expectedAdata}`);
    assert.strictEqual(encryptedUserGpgPrvKey.v, 2);
    assert.strictEqual(encryptedUserGpgPrvKey.adata, `MPS_DSG_SIGNING_USER_GPG_KEY:${expectedAdata}`);

    const sessionPayload = JSON.parse(encryptedRound1Session.input);
    assert.ok(sessionPayload.dsgSession, 'dsgSession should be persisted for round 2');
    assert.ok(sessionPayload.userMsgPayload, 'userMsgPayload should be persisted for round 2');
  });

  it('should use SJCL encryption when encryptedPrv is a v1 blob', async () => {
    mockBitgo.createEncryptionSession = sinon.stub();
    const encryptedPrv = sjcl.encrypt(walletPassphrase, userKeyShare.toString('base64'));

    const result = await eddsaMPCv2Utils.createOfflineRound1Share({
      txRequest,
      prv: userKeyShare.toString('base64'),
      walletPassphrase,
      encryptedPrv,
    });

    sinon.assert.notCalled(mockBitgo.createEncryptionSession as sinon.SinonStub);
    sinon.assert.calledTwice(mockBitgo.encryptAsync as sinon.SinonStub);
    assert.ok(JSON.parse(result.encryptedRound1Session).ct, 'encryptedRound1Session should be an SJCL JSON blob');
    assert.ok(JSON.parse(result.encryptedUserGpgPrvKey).ct, 'encryptedUserGpgPrvKey should be an SJCL JSON blob');
  });

  it('should propagate the tx-only guard when transactions are missing', async () => {
    await assert.rejects(
      () =>
        eddsaMPCv2Utils.createOfflineRound1Share({
          txRequest: { ...txRequest, transactions: undefined } as unknown as TxRequest,
          prv: userKeyShare.toString('base64'),
          walletPassphrase,
        }),
      /Unable to find transactions in txRequest/
    );
  });
});

describe('EddsaMPCv2Utils.createOfflineRound2Share', () => {
  let eddsaMPCv2Utils: EddsaMPCv2Utils;
  let mockBitgo: BitGoBase;
  let userKeyShare: Buffer;
  let bitgoKeyShare: Buffer;
  let bitgoGpgKeyPair: pgp.SerializedKeyPair<string>;
  let bitgoGpgPrivKey: pgp.PrivateKey;

  const walletPassphrase = 'testPass';
  const signableHex = 'deadbeef';
  const derivationPath = 'm/0/0';
  const expectedAdata = `${signableHex}:${derivationPath}`;

  const baseTxRequest: TxRequest = {
    txRequestId: 'txreq-eddsa-round2',
    walletId: 'wallet-eddsa-round2',
    enterpriseId: 'enterprise-eddsa-round2',
    apiVersion: 'full',
    transactions: [
      {
        unsignedTx: {
          signableHex,
          derivationPath,
          serializedTxHex: signableHex,
        },
        signatureShares: [],
      },
    ],
    intent: { intentType: 'payment' },
    unsignedTxs: [],
  } as unknown as TxRequest;

  before('generate EdDSA key shares and GPG keys', async () => {
    const [userDkg, , bitgoDkg] = await MPSUtil.generateEdDsaDKGKeyShares();
    userKeyShare = userDkg.getKeyShare();
    bitgoKeyShare = bitgoDkg.getKeyShare();

    bitgoGpgKeyPair = await generateGPGKeyPair('ed25519');
    bitgoGpgPrivKey = await pgp.readPrivateKey({ armoredKey: bitgoGpgKeyPair.privateKey });
  });

  beforeEach(() => {
    mockBitgo = {
      encrypt: sinon.stub().callsFake((params) => {
        const salt = randomBytes(8);
        const iv = randomBytes(16);
        return sjcl.encrypt(params.password, params.input, {
          salt: [bytesToWord(salt.subarray(0, 4)), bytesToWord(salt.subarray(4))],
          iv: [
            bytesToWord(iv.subarray(0, 4)),
            bytesToWord(iv.subarray(4, 8)),
            bytesToWord(iv.subarray(8, 12)),
            bytesToWord(iv.subarray(12, 16)),
          ],
          adata: params.adata,
        });
      }),
      encryptAsync: sinon.stub().callsFake(async (params) => {
        const salt = randomBytes(8);
        const iv = randomBytes(16);
        return sjcl.encrypt(params.password, params.input, {
          salt: [bytesToWord(salt.subarray(0, 4)), bytesToWord(salt.subarray(4))],
          iv: [
            bytesToWord(iv.subarray(0, 4)),
            bytesToWord(iv.subarray(4, 8)),
            bytesToWord(iv.subarray(8, 12)),
            bytesToWord(iv.subarray(12, 16)),
          ],
          adata: params.adata,
        });
      }),
      decrypt: sinon.stub().callsFake((params) => sjcl.decrypt(params.password, params.input)),
      decryptAsync: sinon.stub().callsFake(async (params) => sjcl.decrypt(params.password, params.input)),
    } as unknown as BitGoBase;

    const mockCoin = {
      getMPCAlgorithm: sinon.stub().returns('eddsa'),
    } as unknown as IBaseCoin;

    eddsaMPCv2Utils = new EddsaMPCv2Utils(mockBitgo, mockCoin);
  });

  it('should create a round-2 share from offline round 1', async () => {
    const round1 = await eddsaMPCv2Utils.createOfflineRound1Share({
      txRequest: baseTxRequest,
      prv: userKeyShare.toString('base64'),
      walletPassphrase,
    });

    const messageBuffer = Buffer.from(signableHex, 'hex');
    const bitgoDsg = new EddsaMPSDsg.DSG(MPCv2PartiesEnum.BITGO);
    await bitgoDsg.initDsg(bitgoKeyShare, messageBuffer, derivationPath, MPCv2PartiesEnum.USER);

    const txRequestRound1 = await signBitgoEddsaRound1(
      bitgoDsg,
      cloneTxRequestWithEmptySignatureShares(baseTxRequest),
      round1.signatureShareRound1,
      round1.userGpgPubKey,
      bitgoGpgPrivKey
    );

    const round2 = await eddsaMPCv2Utils.createOfflineRound2Share({
      txRequest: txRequestRound1,
      walletPassphrase,
      bitgoPublicGpgKey: bitgoGpgKeyPair.publicKey,
      encryptedUserGpgPrvKey: round1.encryptedUserGpgPrvKey,
      encryptedRound1Session: round1.encryptedRound1Session,
    });

    assert.strictEqual(round2.signatureShareRound2.from, SignatureShareType.USER);
    assert.strictEqual(round2.signatureShareRound2.to, SignatureShareType.BITGO);

    const parsedShare = decodeWithCodec(
      EddsaMPCv2SignatureShareRound2Input,
      JSON.parse(round2.signatureShareRound2.share),
      'EddsaMPCv2SignatureShareRound2Input'
    );
    assert.strictEqual(parsedShare.type, 'round2Input');
    assert.ok(parsedShare.data.msg2.message, 'msg2.message should be set');
    assert.ok(parsedShare.data.msg2.signature, 'msg2.signature should be set');

    const encryptedRound2Session = JSON.parse(round2.encryptedRound2Session);
    assert.strictEqual(
      decodeURIComponent(encryptedRound2Session.adata),
      `MPS_DSG_SIGNING_ROUND2_STATE:${expectedAdata}`
    );

    const sessionPayload = JSON.parse(sjcl.decrypt(walletPassphrase, round2.encryptedRound2Session));
    assert.ok(sessionPayload.dsgSession, 'dsgSession should be persisted for round 3');
    assert.ok(sessionPayload.userMsgPayload, 'userMsgPayload should be persisted for round 3');
  });

  it('should use v2 decryption when encryptedRound1Session is a v2 envelope', async () => {
    const encrypt = sinon
      .stub()
      .callsFake((input: string, adata: string) => Promise.resolve(JSON.stringify({ v: 2, input, adata })));
    const destroy = sinon.stub();
    const createEncryptionSession = sinon.stub().resolves({ encrypt, destroy });
    mockBitgo.createEncryptionSession = createEncryptionSession;

    const round1 = await eddsaMPCv2Utils.createOfflineRound1Share({
      txRequest: baseTxRequest,
      prv: userKeyShare.toString('base64'),
      walletPassphrase,
      encryptedPrv: JSON.stringify({ v: 2 }),
    });

    const messageBuffer = Buffer.from(signableHex, 'hex');
    const bitgoDsg = new EddsaMPSDsg.DSG(MPCv2PartiesEnum.BITGO);
    await bitgoDsg.initDsg(bitgoKeyShare, messageBuffer, derivationPath, MPCv2PartiesEnum.USER);

    const txRequestRound1 = await signBitgoEddsaRound1(
      bitgoDsg,
      cloneTxRequestWithEmptySignatureShares(baseTxRequest),
      round1.signatureShareRound1,
      round1.userGpgPubKey,
      bitgoGpgPrivKey
    );

    const decryptAsync = sinon.stub().callsFake(async (params: { input: string }) => {
      const envelope = JSON.parse(params.input);
      return envelope.input;
    });
    mockBitgo.decryptAsync = decryptAsync;

    const round2 = await eddsaMPCv2Utils.createOfflineRound2Share({
      txRequest: txRequestRound1,
      walletPassphrase,
      bitgoPublicGpgKey: bitgoGpgKeyPair.publicKey,
      encryptedUserGpgPrvKey: round1.encryptedUserGpgPrvKey,
      encryptedRound1Session: round1.encryptedRound1Session,
    });

    sinon.assert.called(mockBitgo.decryptAsync as sinon.SinonStub);
    assert.strictEqual(round2.signatureShareRound2.from, SignatureShareType.USER);

    const encryptedRound2Session = JSON.parse(round2.encryptedRound2Session);
    assert.strictEqual(encryptedRound2Session.v, 2);
    assert.strictEqual(encryptedRound2Session.adata, `MPS_DSG_SIGNING_ROUND2_STATE:${expectedAdata}`);
  });

  it('should reject tampered encryptedRound1Session adata', async () => {
    const otherTxRequest: TxRequest = {
      ...baseTxRequest,
      transactions: [
        {
          unsignedTx: {
            signableHex: 'cafebabe',
            derivationPath: 'm/1/2',
            serializedTxHex: 'cafebabe',
          },
          signatureShares: [],
        },
      ],
    } as unknown as TxRequest;

    const round1Other = await eddsaMPCv2Utils.createOfflineRound1Share({
      txRequest: otherTxRequest,
      prv: userKeyShare.toString('base64'),
      walletPassphrase,
    });

    const round1 = await eddsaMPCv2Utils.createOfflineRound1Share({
      txRequest: baseTxRequest,
      prv: userKeyShare.toString('base64'),
      walletPassphrase,
    });

    const messageBuffer = Buffer.from(signableHex, 'hex');
    const bitgoDsg = new EddsaMPSDsg.DSG(MPCv2PartiesEnum.BITGO);
    await bitgoDsg.initDsg(bitgoKeyShare, messageBuffer, derivationPath, MPCv2PartiesEnum.USER);

    const txRequestRound1 = await signBitgoEddsaRound1(
      bitgoDsg,
      cloneTxRequestWithEmptySignatureShares(baseTxRequest),
      round1.signatureShareRound1,
      round1.userGpgPubKey,
      bitgoGpgPrivKey
    );

    await assert.rejects(
      () =>
        eddsaMPCv2Utils.createOfflineRound2Share({
          txRequest: txRequestRound1,
          walletPassphrase,
          bitgoPublicGpgKey: bitgoGpgKeyPair.publicKey,
          encryptedUserGpgPrvKey: round1.encryptedUserGpgPrvKey,
          encryptedRound1Session: round1Other.encryptedRound1Session,
        }),
      /Adata does not match cyphertext adata/
    );
  });

  it('should reject tampered encryptedUserGpgPrvKey adata', async () => {
    const otherTxRequest: TxRequest = {
      ...baseTxRequest,
      transactions: [
        {
          unsignedTx: {
            signableHex: 'cafebabe',
            derivationPath: 'm/1/2',
            serializedTxHex: 'cafebabe',
          },
          signatureShares: [],
        },
      ],
    } as unknown as TxRequest;

    const round1Other = await eddsaMPCv2Utils.createOfflineRound1Share({
      txRequest: otherTxRequest,
      prv: userKeyShare.toString('base64'),
      walletPassphrase,
    });

    const round1 = await eddsaMPCv2Utils.createOfflineRound1Share({
      txRequest: baseTxRequest,
      prv: userKeyShare.toString('base64'),
      walletPassphrase,
    });

    const messageBuffer = Buffer.from(signableHex, 'hex');
    const bitgoDsg = new EddsaMPSDsg.DSG(MPCv2PartiesEnum.BITGO);
    await bitgoDsg.initDsg(bitgoKeyShare, messageBuffer, derivationPath, MPCv2PartiesEnum.USER);

    const txRequestRound1 = await signBitgoEddsaRound1(
      bitgoDsg,
      cloneTxRequestWithEmptySignatureShares(baseTxRequest),
      round1.signatureShareRound1,
      round1.userGpgPubKey,
      bitgoGpgPrivKey
    );

    await assert.rejects(
      () =>
        eddsaMPCv2Utils.createOfflineRound2Share({
          txRequest: txRequestRound1,
          walletPassphrase,
          bitgoPublicGpgKey: bitgoGpgKeyPair.publicKey,
          encryptedUserGpgPrvKey: round1Other.encryptedUserGpgPrvKey,
          encryptedRound1Session: round1.encryptedRound1Session,
        }),
      /Adata does not match cyphertext adata/
    );
  });

  it('should reject when BitGo signature share is missing', async () => {
    const round1 = await eddsaMPCv2Utils.createOfflineRound1Share({
      txRequest: baseTxRequest,
      prv: userKeyShare.toString('base64'),
      walletPassphrase,
    });

    const baseTransaction = assertSingleTransaction(baseTxRequest);
    const txRequestNoBitgoShare: TxRequest = {
      ...baseTxRequest,
      transactions: [
        {
          ...baseTransaction,
          signatureShares: [round1.signatureShareRound1],
        },
      ],
    };

    await assert.rejects(
      () =>
        eddsaMPCv2Utils.createOfflineRound2Share({
          txRequest: txRequestNoBitgoShare,
          walletPassphrase,
          bitgoPublicGpgKey: bitgoGpgKeyPair.publicKey,
          encryptedUserGpgPrvKey: round1.encryptedUserGpgPrvKey,
          encryptedRound1Session: round1.encryptedRound1Session,
        }),
      /Missing BitGo round1Output signature share/
    );
  });

  it('should propagate the tx-only guard when transactions are missing', async () => {
    const round1 = await eddsaMPCv2Utils.createOfflineRound1Share({
      txRequest: baseTxRequest,
      prv: userKeyShare.toString('base64'),
      walletPassphrase,
    });

    await assert.rejects(
      () =>
        eddsaMPCv2Utils.createOfflineRound2Share({
          txRequest: { ...baseTxRequest, transactions: undefined } as unknown as TxRequest,
          walletPassphrase,
          bitgoPublicGpgKey: bitgoGpgKeyPair.publicKey,
          encryptedUserGpgPrvKey: round1.encryptedUserGpgPrvKey,
          encryptedRound1Session: round1.encryptedRound1Session,
        }),
      /Unable to find transactions in txRequest/
    );
  });

  it('should reject when transactions array is empty', async () => {
    const round1 = await eddsaMPCv2Utils.createOfflineRound1Share({
      txRequest: baseTxRequest,
      prv: userKeyShare.toString('base64'),
      walletPassphrase,
    });

    await assert.rejects(
      () =>
        eddsaMPCv2Utils.createOfflineRound2Share({
          txRequest: { ...baseTxRequest, transactions: [] },
          walletPassphrase,
          bitgoPublicGpgKey: bitgoGpgKeyPair.publicKey,
          encryptedUserGpgPrvKey: round1.encryptedUserGpgPrvKey,
          encryptedRound1Session: round1.encryptedRound1Session,
        }),
      /Unable to find transactions in txRequest/
    );
  });
});

describe('EddsaMPCv2Utils.createOfflineRound3Share', () => {
  let eddsaMPCv2Utils: EddsaMPCv2Utils;
  let mockBitgo: BitGoBase;
  let userKeyShare: Buffer;
  let bitgoKeyShare: Buffer;
  let bitgoGpgKeyPair: pgp.SerializedKeyPair<string>;
  let bitgoGpgPrivKey: pgp.PrivateKey;

  const walletPassphrase = 'testPass';
  const signableHex = 'deadbeef';
  const derivationPath = 'm/0/0';

  const baseTxRequest: TxRequest = {
    txRequestId: 'txreq-eddsa-round3',
    walletId: 'wallet-eddsa-round3',
    enterpriseId: 'enterprise-eddsa-round3',
    apiVersion: 'full',
    transactions: [
      {
        unsignedTx: {
          signableHex,
          derivationPath,
          serializedTxHex: signableHex,
        },
        signatureShares: [],
      },
    ],
    intent: { intentType: 'payment' },
    unsignedTxs: [],
  } as unknown as TxRequest;

  before('generate EdDSA key shares and GPG keys', async () => {
    const [userDkg, , bitgoDkg] = await MPSUtil.generateEdDsaDKGKeyShares();
    userKeyShare = userDkg.getKeyShare();
    bitgoKeyShare = bitgoDkg.getKeyShare();

    bitgoGpgKeyPair = await generateGPGKeyPair('ed25519');
    bitgoGpgPrivKey = await pgp.readPrivateKey({ armoredKey: bitgoGpgKeyPair.privateKey });
  });

  beforeEach(() => {
    mockBitgo = {
      encrypt: sinon.stub().callsFake((params) => {
        const salt = randomBytes(8);
        const iv = randomBytes(16);
        return sjcl.encrypt(params.password, params.input, {
          salt: [bytesToWord(salt.subarray(0, 4)), bytesToWord(salt.subarray(4))],
          iv: [
            bytesToWord(iv.subarray(0, 4)),
            bytesToWord(iv.subarray(4, 8)),
            bytesToWord(iv.subarray(8, 12)),
            bytesToWord(iv.subarray(12, 16)),
          ],
          adata: params.adata,
        });
      }),
      encryptAsync: sinon.stub().callsFake(async (params) => {
        const salt = randomBytes(8);
        const iv = randomBytes(16);
        return sjcl.encrypt(params.password, params.input, {
          salt: [bytesToWord(salt.subarray(0, 4)), bytesToWord(salt.subarray(4))],
          iv: [
            bytesToWord(iv.subarray(0, 4)),
            bytesToWord(iv.subarray(4, 8)),
            bytesToWord(iv.subarray(8, 12)),
            bytesToWord(iv.subarray(12, 16)),
          ],
          adata: params.adata,
        });
      }),
      decrypt: sinon.stub().callsFake((params) => sjcl.decrypt(params.password, params.input)),
      decryptAsync: sinon.stub().callsFake(async (params) => sjcl.decrypt(params.password, params.input)),
    } as unknown as BitGoBase;

    const mockCoin = {
      getMPCAlgorithm: sinon.stub().returns('eddsa'),
    } as unknown as IBaseCoin;

    eddsaMPCv2Utils = new EddsaMPCv2Utils(mockBitgo, mockCoin);
  });

  async function createRound2Flow(
    txRequest: TxRequest,
    encryptedPrv?: string
  ): Promise<{
    round1: {
      signatureShareRound1: SignatureShareRecord;
      userGpgPubKey: string;
      encryptedRound1Session: string;
      encryptedUserGpgPrvKey: string;
    };
    round2: {
      signatureShareRound2: SignatureShareRecord;
      encryptedRound2Session: string;
    };
    txRequestRound1: TxRequest;
    txRequestRound2: TxRequest;
    messageBuffer: Buffer;
  }> {
    const round1 = await eddsaMPCv2Utils.createOfflineRound1Share({
      txRequest,
      prv: userKeyShare.toString('base64'),
      walletPassphrase,
      encryptedPrv,
    });

    const transaction = assertSingleTransaction(txRequest);
    const messageBuffer = Buffer.from(transaction.unsignedTx.signableHex, 'hex');
    const bitgoDsg = new EddsaMPSDsg.DSG(MPCv2PartiesEnum.BITGO);
    await bitgoDsg.initDsg(bitgoKeyShare, messageBuffer, transaction.unsignedTx.derivationPath, MPCv2PartiesEnum.USER);

    const txRequestRound1 = await signBitgoEddsaRound1(
      bitgoDsg,
      cloneTxRequestWithEmptySignatureShares(txRequest),
      round1.signatureShareRound1,
      round1.userGpgPubKey,
      bitgoGpgPrivKey
    );

    const round2 = await eddsaMPCv2Utils.createOfflineRound2Share({
      txRequest: txRequestRound1,
      walletPassphrase,
      bitgoPublicGpgKey: bitgoGpgKeyPair.publicKey,
      encryptedUserGpgPrvKey: round1.encryptedUserGpgPrvKey,
      encryptedRound1Session: round1.encryptedRound1Session,
    });

    const round1Transaction = assertSingleTransaction(txRequestRound1);
    const txRequestRound2 = await signBitgoEddsaRound2(
      bitgoDsg,
      {
        ...txRequestRound1,
        transactions: [
          {
            ...round1Transaction,
            signatureShares: [...round1Transaction.signatureShares],
          },
        ],
      },
      round2.signatureShareRound2,
      round1.userGpgPubKey,
      bitgoGpgPrivKey
    );

    return { round1, round2, txRequestRound1, txRequestRound2, messageBuffer };
  }

  it('should create a round-3 share from offline round 2', async () => {
    const { round1, round2, txRequestRound2 } = await createRound2Flow(baseTxRequest);

    const round3 = await eddsaMPCv2Utils.createOfflineRound3Share({
      txRequest: txRequestRound2,
      walletPassphrase,
      bitgoPublicGpgKey: bitgoGpgKeyPair.publicKey,
      encryptedUserGpgPrvKey: round1.encryptedUserGpgPrvKey,
      encryptedRound2Session: round2.encryptedRound2Session,
    });

    assert.strictEqual(round3.signatureShareRound3.from, SignatureShareType.USER);
    assert.strictEqual(round3.signatureShareRound3.to, SignatureShareType.BITGO);

    const parsedShare = decodeWithCodec(
      EddsaMPCv2SignatureShareRound3Input,
      JSON.parse(round3.signatureShareRound3.share),
      'EddsaMPCv2SignatureShareRound3Input'
    );
    assert.strictEqual(parsedShare.type, 'round3Input');
    assert.ok(parsedShare.data.msg3.message, 'msg3.message should be set');
    assert.ok(parsedShare.data.msg3.signature, 'msg3.signature should be set');
  });

  it('should use v2 decryption when encryptedRound2Session is a v2 envelope', async () => {
    const encrypt = sinon
      .stub()
      .callsFake((input: string, adata: string) => Promise.resolve(JSON.stringify({ v: 2, input, adata })));
    const destroy = sinon.stub();
    const createEncryptionSession = sinon.stub().resolves({ encrypt, destroy });
    mockBitgo.createEncryptionSession = createEncryptionSession;

    const decryptAsync = sinon.stub().callsFake(async (params: { input: string }) => {
      const envelope = JSON.parse(params.input);
      return envelope.input;
    });
    mockBitgo.decryptAsync = decryptAsync;

    const { round1, round2, txRequestRound2 } = await createRound2Flow(baseTxRequest, JSON.stringify({ v: 2 }));

    const round3 = await eddsaMPCv2Utils.createOfflineRound3Share({
      txRequest: txRequestRound2,
      walletPassphrase,
      bitgoPublicGpgKey: bitgoGpgKeyPair.publicKey,
      encryptedUserGpgPrvKey: round1.encryptedUserGpgPrvKey,
      encryptedRound2Session: round2.encryptedRound2Session,
    });

    assert.strictEqual((mockBitgo.decryptAsync as sinon.SinonStub).callCount, 4);
    assert.strictEqual(round3.signatureShareRound3.from, SignatureShareType.USER);
  });

  it('should reject tampered encryptedRound2Session adata', async () => {
    const otherTxRequest: TxRequest = {
      ...baseTxRequest,
      transactions: [
        {
          unsignedTx: {
            signableHex: 'cafebabe',
            derivationPath: 'm/1/2',
            serializedTxHex: 'cafebabe',
          },
          signatureShares: [],
        },
      ],
    } as unknown as TxRequest;

    const otherFlow = await createRound2Flow(otherTxRequest);
    const { round1, txRequestRound2 } = await createRound2Flow(baseTxRequest);

    await assert.rejects(
      () =>
        eddsaMPCv2Utils.createOfflineRound3Share({
          txRequest: txRequestRound2,
          walletPassphrase,
          bitgoPublicGpgKey: bitgoGpgKeyPair.publicKey,
          encryptedUserGpgPrvKey: round1.encryptedUserGpgPrvKey,
          encryptedRound2Session: otherFlow.round2.encryptedRound2Session,
        }),
      /Adata does not match cyphertext adata/
    );
  });

  it('should reject tampered encryptedUserGpgPrvKey adata', async () => {
    const otherTxRequest: TxRequest = {
      ...baseTxRequest,
      transactions: [
        {
          unsignedTx: {
            signableHex: 'cafebabe',
            derivationPath: 'm/1/2',
            serializedTxHex: 'cafebabe',
          },
          signatureShares: [],
        },
      ],
    } as unknown as TxRequest;

    const otherFlow = await createRound2Flow(otherTxRequest);
    const { round2, txRequestRound2 } = await createRound2Flow(baseTxRequest);

    await assert.rejects(
      () =>
        eddsaMPCv2Utils.createOfflineRound3Share({
          txRequest: txRequestRound2,
          walletPassphrase,
          bitgoPublicGpgKey: bitgoGpgKeyPair.publicKey,
          encryptedUserGpgPrvKey: otherFlow.round1.encryptedUserGpgPrvKey,
          encryptedRound2Session: round2.encryptedRound2Session,
        }),
      /Adata does not match cyphertext adata/
    );
  });

  it('should reject when BitGo round-2 signature share is missing', async () => {
    const { round1, round2, txRequestRound1 } = await createRound2Flow(baseTxRequest);

    const round1Transaction = assertSingleTransaction(txRequestRound1);
    const txRequestNoBitgoRound2Share: TxRequest = {
      ...txRequestRound1,
      transactions: [
        {
          ...round1Transaction,
          signatureShares: [...round1Transaction.signatureShares, round2.signatureShareRound2],
        },
      ],
    };

    await assert.rejects(
      () =>
        eddsaMPCv2Utils.createOfflineRound3Share({
          txRequest: txRequestNoBitgoRound2Share,
          walletPassphrase,
          bitgoPublicGpgKey: bitgoGpgKeyPair.publicKey,
          encryptedUserGpgPrvKey: round1.encryptedUserGpgPrvKey,
          encryptedRound2Session: round2.encryptedRound2Session,
        }),
      /Missing BitGo round2Output signature share/
    );
  });

  it('should propagate the tx-only guard when transactions are missing', async () => {
    const { round1, round2 } = await createRound2Flow(baseTxRequest);

    await assert.rejects(
      () =>
        eddsaMPCv2Utils.createOfflineRound3Share({
          txRequest: { ...baseTxRequest, transactions: undefined } as unknown as TxRequest,
          walletPassphrase,
          bitgoPublicGpgKey: bitgoGpgKeyPair.publicKey,
          encryptedUserGpgPrvKey: round1.encryptedUserGpgPrvKey,
          encryptedRound2Session: round2.encryptedRound2Session,
        }),
      /Unable to find transactions in txRequest/
    );
  });

  it('should reject when transactions array is empty', async () => {
    const { round1, round2 } = await createRound2Flow(baseTxRequest);

    await assert.rejects(
      () =>
        eddsaMPCv2Utils.createOfflineRound3Share({
          txRequest: { ...baseTxRequest, transactions: [] },
          walletPassphrase,
          bitgoPublicGpgKey: bitgoGpgKeyPair.publicKey,
          encryptedUserGpgPrvKey: round1.encryptedUserGpgPrvKey,
          encryptedRound2Session: round2.encryptedRound2Session,
        }),
      /Unable to find transactions in txRequest/
    );
  });
});

describe('getBitgoSignatureShare', () => {
  const round1OutputShare: SignatureShareRecord = {
    from: SignatureShareType.BITGO,
    to: SignatureShareType.USER,
    share: JSON.stringify({ type: 'round1Output', data: {} }),
  };
  const round2OutputShare: SignatureShareRecord = {
    from: SignatureShareType.BITGO,
    to: SignatureShareType.USER,
    share: JSON.stringify({ type: 'round2Output', data: {} }),
  };

  it('selects the requested BitGo round output when multiple round outputs are present', () => {
    const signatureShares = [round1OutputShare, round2OutputShare];

    assert.strictEqual(
      getBitgoSignatureShare(signatureShares, SignatureShareType.USER, 'round2Output'),
      round2OutputShare
    );
    assert.strictEqual(
      getBitgoSignatureShare(signatureShares, SignatureShareType.USER, 'round1Output'),
      round1OutputShare
    );
  });

  it('skips malformed share records while selecting the requested BitGo round output', () => {
    const malformedShare: SignatureShareRecord = {
      from: SignatureShareType.BITGO,
      to: SignatureShareType.USER,
      share: 'not-json',
    };

    assert.strictEqual(
      getBitgoSignatureShare([malformedShare, round2OutputShare], SignatureShareType.USER, 'round2Output'),
      round2OutputShare
    );
  });
});

type TxRequestTransaction = NonNullable<TxRequest['transactions']>[number];

function assertSingleTransaction(txRequest: TxRequest): TxRequestTransaction {
  assert.ok(txRequest.transactions, 'txRequest must include transactions');
  assert.strictEqual(txRequest.transactions.length, 1, 'txRequest must have exactly one transaction');
  return txRequest.transactions[0];
}

function cloneTxRequestWithEmptySignatureShares(txRequest: TxRequest): TxRequest {
  const transaction = assertSingleTransaction(txRequest);
  return {
    ...txRequest,
    transactions: [{ ...transaction, signatureShares: [] }],
  };
}

async function signBitgoEddsaRound1(
  bitgoDsg: EddsaMPSDsg.DSG,
  txRequest: TxRequest,
  userRound1Share: SignatureShareRecord,
  userGpgPubKeyArmored: string,
  bitgoGpgPrivKey: pgp.PrivateKey
): Promise<TxRequest> {
  const transaction = assertSingleTransaction(txRequest);
  transaction.signatureShares.push(userRound1Share);

  const bitgoMsg1 = bitgoDsg.getFirstMessage();

  const parsedUserShare = decodeWithCodec(
    EddsaMPCv2SignatureShareRound1Input,
    JSON.parse(userRound1Share.share),
    'EddsaMPCv2SignatureShareRound1Input'
  );
  const userGpgKey = await pgp.readKey({ armoredKey: userGpgPubKeyArmored });
  const userRawMsg1Bytes = await MPSComms.verifyMpsMessage(parsedUserShare.data.msg1, userGpgKey);
  const userMsg1 = {
    from: MPCv2PartiesEnum.USER,
    payload: new Uint8Array(userRawMsg1Bytes),
  };

  const [bitgoMsg2] = bitgoDsg.handleIncomingMessages([bitgoMsg1, userMsg1]);
  assert.ok(bitgoMsg2, 'BitGo DSG produced no round-2 output');
  (bitgoDsg as EddsaMPSDsg.DSG & { round2Message?: MPSTypes.DeserializedMessage }).round2Message = bitgoMsg2;

  const bitgoSignedMsg1 = await MPSComms.detachSignMpsMessage(Buffer.from(bitgoMsg1.payload), bitgoGpgPrivKey);
  const round1Output: EddsaMPCv2SignatureShareRound1Output = {
    type: 'round1Output',
    data: { msg1: bitgoSignedMsg1 },
  };

  transaction.signatureShares.push({
    from: SignatureShareType.BITGO,
    to: SignatureShareType.USER,
    share: JSON.stringify(round1Output),
  });

  return txRequest;
}

async function signBitgoEddsaRound2(
  bitgoDsg: EddsaMPSDsg.DSG,
  txRequest: TxRequest,
  userRound2Share: SignatureShareRecord,
  userGpgPubKeyArmored: string,
  bitgoGpgPrivKey: pgp.PrivateKey
): Promise<TxRequest> {
  const transaction = assertSingleTransaction(txRequest);
  transaction.signatureShares.push(userRound2Share);

  const userGpgKey = await pgp.readKey({ armoredKey: userGpgPubKeyArmored });
  const bitgoMsg2 = (bitgoDsg as EddsaMPSDsg.DSG & { round2Message?: MPSTypes.DeserializedMessage }).round2Message;
  assert.ok(bitgoMsg2, 'BitGo DSG is missing the cached round-2 output');

  const parsedUserRound2Share = decodeWithCodec(
    EddsaMPCv2SignatureShareRound2Input,
    JSON.parse(userRound2Share.share),
    'EddsaMPCv2SignatureShareRound2Input'
  );
  const userRawMsg2Bytes = await MPSComms.verifyMpsMessage(parsedUserRound2Share.data.msg2, userGpgKey);
  const userMsg2 = {
    from: MPCv2PartiesEnum.USER,
    payload: new Uint8Array(userRawMsg2Bytes),
  };

  const bitgoSignedMsg2 = await MPSComms.detachSignMpsMessage(Buffer.from(bitgoMsg2.payload), bitgoGpgPrivKey);
  const round2Output: EddsaMPCv2SignatureShareRound2Output = {
    type: 'round2Output',
    data: { msg2: bitgoSignedMsg2 },
  };

  transaction.signatureShares.push({
    from: SignatureShareType.BITGO,
    to: SignatureShareType.USER,
    share: JSON.stringify(round2Output),
  });

  bitgoDsg.handleIncomingMessages([bitgoMsg2, userMsg2]);

  return txRequest;
}

describe('EddsaMPCv2Utils.signEddsaMPCv2TssUsingExternalSigner', () => {
  let sandbox: sinon.SinonSandbox;
  let eddsaMPCv2Utils: EddsaMPCv2Utils;
  let mockBitgo: BitGoBase;
  let bitgoGpgKeyPair: pgp.SerializedKeyPair<string>;
  let bitgoGpgPubKey: pgp.Key;

  const walletId = 'abc123wallet';
  const txRequestId = 'txreq-001';
  const enterpriseId = 'ent-001';

  const mockTxRequest: TxRequest = {
    txRequestId,
    walletId,
    enterpriseId,
    apiVersion: 'full',
    transactions: [
      {
        unsignedTx: {
          signableHex: 'deadbeef',
          derivationPath: 'm/0',
          serializedTxHex: 'deadbeef',
        },
        signatureShares: [
          {
            from: SignatureShareType.BITGO,
            to: SignatureShareType.USER,
            share: JSON.stringify({ type: 'round1Output', data: {} }),
          },
        ],
      },
    ],
    intent: { intentType: 'payment' },
    unsignedTxs: [],
  } as unknown as TxRequest;

  const mockTxRequestTransaction = assertSingleTransaction(mockTxRequest);
  const mockTxRequestRound2: TxRequest = {
    ...mockTxRequest,
    transactions: [
      {
        ...mockTxRequestTransaction,
        signatureShares: [
          {
            from: SignatureShareType.BITGO,
            to: SignatureShareType.USER,
            share: JSON.stringify({ type: 'round2Output', data: {} }),
          },
        ],
      },
    ],
  };

  const dummyShare: SignatureShareRecord = {
    from: SignatureShareType.USER,
    to: SignatureShareType.BITGO,
    share: JSON.stringify({ type: 'round1Input', data: {} }),
  };

  // Returns a chain compatible with: bitgo.post(url).send(body).result()
  const makePostChain = (response: TxRequest): BitGoRequest<TxRequest> =>
    ({ send: () => ({ result: sinon.stub().resolves(response) }) } as unknown as BitGoRequest<TxRequest>);

  // Returns a chain compatible with: bitgo.get(url).query(params).retry(n).result()
  const makeGetChain = (txRequests: TxRequest[]): BitGoRequest<{ txRequests: TxRequest[] }> =>
    ({
      query: () => ({
        retry: () => ({ result: sinon.stub().resolves({ txRequests }) }),
      }),
    } as unknown as BitGoRequest<{ txRequests: TxRequest[] }>);

  before(async () => {
    bitgoGpgKeyPair = await generateGPGKeyPair('ed25519');
    bitgoGpgPubKey = await pgp.readKey({ armoredKey: bitgoGpgKeyPair.publicKey });
  });

  beforeEach(async () => {
    sandbox = sinon.createSandbox();

    // Full mock of the BitGo HTTP client (consistent with other sdk-core tests such as
    // tokenApproval.ts and walletsEvmKeyring.ts).  Module-level stubs on tssCommon functions
    // do not work under tsx 4.x (ESM live bindings), so we mock at the bitgo object level.
    mockBitgo = {
      getEnv: sinon.stub().returns('test'),
      setRequestTracer: sinon.stub(),
      url: sinon.stub().callsFake((path: string) => `https://test.bitgo.com${path}`),
      post: sinon.stub(),
      get: sinon.stub(),
    } as unknown as BitGoBase;

    const mockCoin = {
      getMPCAlgorithm: sinon.stub().returns('eddsa'),
    } as unknown as IBaseCoin;

    const mockWallet = {
      id: sinon.stub().returns(walletId),
      keyIds: sinon.stub().returns(['userKeyId', 'backupKeyId', 'bitgoKeyId']),
      multisigTypeVersion: sinon.stub().returns('MPCv2'),
    } as unknown as IWallet;

    eddsaMPCv2Utils = new EddsaMPCv2Utils(mockBitgo, mockCoin, mockWallet);

    sandbox.stub(eddsaMPCv2Utils, 'pickBitgoPubGpgKeyForSigning').resolves(bitgoGpgPubKey);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should call all 3 generators and return the final tx request', async () => {
    const finalTxRequest = { ...mockTxRequest, txRequestId };

    // sendSignatureShareV2 is called 3 times (one per round), sendTxRequest once — all use bitgo.post
    (mockBitgo.post as sinon.SinonStub)
      .onCall(0)
      .returns(makePostChain(mockTxRequest)) // round 1 sign
      .onCall(1)
      .returns(makePostChain(mockTxRequestRound2)) // round 2 sign
      .onCall(2)
      .returns(makePostChain(mockTxRequestRound2)) // round 3 sign
      .onCall(3)
      .returns(makePostChain(finalTxRequest)); // sendTxRequest (send)

    const encryptedRound1Session = 'encrypted-r1-session';
    const encryptedRound2Session = 'encrypted-r2-session';
    const encryptedUserGpgPrvKey = 'encrypted-gpg-key';
    const userGpgPubKey = bitgoGpgKeyPair.publicKey;

    const round1Share: SignatureShareRecord = { ...dummyShare };
    const round2Share: SignatureShareRecord = { ...dummyShare, share: JSON.stringify({ type: 'round2Input' }) };
    const round3Share: SignatureShareRecord = { ...dummyShare, share: JSON.stringify({ type: 'round3Input' }) };

    const round1Generator = sinon
      .stub()
      .resolves({ signatureShareRound1: round1Share, userGpgPubKey, encryptedRound1Session, encryptedUserGpgPrvKey });
    const round2Generator = sinon.stub().resolves({ signatureShareRound2: round2Share, encryptedRound2Session });
    const round3Generator = sinon.stub().resolves({ signatureShareRound3: round3Share });

    const result = await eddsaMPCv2Utils.signEddsaMPCv2TssUsingExternalSigner(
      { txRequest: mockTxRequest, reqId: new RequestTracer() },
      round1Generator as unknown as CustomEddsaMPCv2SigningRound1GeneratingFunction,
      round2Generator as unknown as CustomEddsaMPCv2SigningRound2GeneratingFunction,
      round3Generator as unknown as CustomEddsaMPCv2SigningRound3GeneratingFunction
    );

    assert.deepStrictEqual(result, finalTxRequest);

    sinon.assert.calledOnce(round1Generator);
    sinon.assert.calledWith(round1Generator, { txRequest: mockTxRequest });

    sinon.assert.calledOnce(round2Generator);
    const round2Call = round2Generator.getCall(0);
    assert.strictEqual(round2Call.args[0].txRequest, mockTxRequest);
    assert.strictEqual(round2Call.args[0].encryptedRound1Session, encryptedRound1Session);
    assert.strictEqual(round2Call.args[0].encryptedUserGpgPrvKey, encryptedUserGpgPrvKey);
    assert.strictEqual(round2Call.args[0].bitgoPublicGpgKey, bitgoGpgPubKey.armor());

    sinon.assert.calledOnce(round3Generator);
    const round3Call = round3Generator.getCall(0);
    assert.strictEqual(round3Call.args[0].txRequest, mockTxRequestRound2);
    assert.strictEqual(round3Call.args[0].encryptedRound2Session, encryptedRound2Session);
    assert.strictEqual(round3Call.args[0].encryptedUserGpgPrvKey, encryptedUserGpgPrvKey);
    assert.strictEqual(round3Call.args[0].bitgoPublicGpgKey, bitgoGpgPubKey.armor());

    // 3 sendSignatureShareV2 calls + 1 sendTxRequest = 4 POST calls total
    assert.strictEqual((mockBitgo.post as sinon.SinonStub).callCount, 4);
  });

  it('should resolve txRequest by ID string using getTxRequest', async () => {
    // getTxRequest uses bitgo.get; sendSignatureShareV2 (×3) + sendTxRequest use bitgo.post
    (mockBitgo.get as sinon.SinonStub).returns(makeGetChain([mockTxRequest]));
    (mockBitgo.post as sinon.SinonStub)
      .onCall(0)
      .returns(makePostChain(mockTxRequest))
      .onCall(1)
      .returns(makePostChain(mockTxRequestRound2))
      .onCall(2)
      .returns(makePostChain(mockTxRequestRound2))
      .onCall(3)
      .returns(makePostChain(mockTxRequest));

    const round1Generator = sinon.stub().resolves({
      signatureShareRound1: dummyShare,
      userGpgPubKey: bitgoGpgKeyPair.publicKey,
      encryptedRound1Session: 'r1',
      encryptedUserGpgPrvKey: 'key',
    });
    const round2Generator = sinon.stub().resolves({ signatureShareRound2: dummyShare, encryptedRound2Session: 'r2' });
    const round3Generator = sinon.stub().resolves({ signatureShareRound3: dummyShare });

    await eddsaMPCv2Utils.signEddsaMPCv2TssUsingExternalSigner(
      { txRequest: txRequestId, reqId: new RequestTracer() },
      round1Generator as unknown as CustomEddsaMPCv2SigningRound1GeneratingFunction,
      round2Generator as unknown as CustomEddsaMPCv2SigningRound2GeneratingFunction,
      round3Generator as unknown as CustomEddsaMPCv2SigningRound3GeneratingFunction
    );

    sinon.assert.calledOnce(mockBitgo.get as sinon.SinonStub);
    sinon.assert.calledWith(round1Generator, { txRequest: mockTxRequest });
  });

  it('should throw when round 2 txRequest is missing signatureShares', async () => {
    const round2NoShares: TxRequest = {
      ...mockTxRequest,
      transactions: [{ ...mockTxRequestTransaction, signatureShares: undefined as unknown as [] }],
    };

    (mockBitgo.post as sinon.SinonStub)
      .onCall(0)
      .returns(makePostChain(mockTxRequest))
      .onCall(1)
      .returns(makePostChain(round2NoShares));

    const round1Generator = sinon.stub().resolves({
      signatureShareRound1: dummyShare,
      userGpgPubKey: bitgoGpgKeyPair.publicKey,
      encryptedRound1Session: 'r1',
      encryptedUserGpgPrvKey: 'key',
    });
    const round2Generator = sinon.stub().resolves({ signatureShareRound2: dummyShare, encryptedRound2Session: 'r2' });
    const round3Generator = sinon.stub().resolves({ signatureShareRound3: dummyShare });

    await assert.rejects(
      () =>
        eddsaMPCv2Utils.signEddsaMPCv2TssUsingExternalSigner(
          { txRequest: mockTxRequest, reqId: new RequestTracer() },
          round1Generator as unknown as CustomEddsaMPCv2SigningRound1GeneratingFunction,
          round2Generator as unknown as CustomEddsaMPCv2SigningRound2GeneratingFunction,
          round3Generator as unknown as CustomEddsaMPCv2SigningRound3GeneratingFunction
        ),
      /Missing signature shares in round 2 txRequest/
    );
  });

  it('should pass armored BitGo public GPG key to round 2 and round 3 generators', async () => {
    (mockBitgo.post as sinon.SinonStub)
      .onCall(0)
      .returns(makePostChain(mockTxRequest))
      .onCall(1)
      .returns(makePostChain(mockTxRequestRound2))
      .onCall(2)
      .returns(makePostChain(mockTxRequestRound2))
      .onCall(3)
      .returns(makePostChain(mockTxRequest));

    const round1Generator = sinon.stub().resolves({
      signatureShareRound1: dummyShare,
      userGpgPubKey: bitgoGpgKeyPair.publicKey,
      encryptedRound1Session: 'r1',
      encryptedUserGpgPrvKey: 'key',
    });
    const round2Generator = sinon.stub().resolves({ signatureShareRound2: dummyShare, encryptedRound2Session: 'r2' });
    const round3Generator = sinon.stub().resolves({ signatureShareRound3: dummyShare });

    await eddsaMPCv2Utils.signEddsaMPCv2TssUsingExternalSigner(
      { txRequest: mockTxRequest, reqId: new RequestTracer() },
      round1Generator as unknown as CustomEddsaMPCv2SigningRound1GeneratingFunction,
      round2Generator as unknown as CustomEddsaMPCv2SigningRound2GeneratingFunction,
      round3Generator as unknown as CustomEddsaMPCv2SigningRound3GeneratingFunction
    );

    const armoredKey = bitgoGpgPubKey.armor();
    assert.strictEqual(
      round2Generator.getCall(0).args[0].bitgoPublicGpgKey,
      armoredKey,
      'round 2 should receive armored BitGo GPG key'
    );
    assert.strictEqual(
      round3Generator.getCall(0).args[0].bitgoPublicGpgKey,
      armoredKey,
      'round 3 should receive armored BitGo GPG key'
    );
  });
});

function bytesToWord(bytes?: Uint8Array | number[]): number {
  if (!(bytes instanceof Uint8Array) || bytes.length !== 4) {
    throw new Error('bytes must be a Uint8Array with length 4');
  }

  return bytes.reduce((num, byte) => num * 0x100 + byte, 0);
}

describe('EDDSAUtils.isEddsaMpcV1SigningMaterial', () => {
  const PASSPHRASE = 'test-passphrase';

  const MPCv1_MATERIAL_BACKUP = {
    uShare: { i: 1, t: 2, n: 3, y: 'aabbcc', seed: 'deadbeef01234567', chaincode: '00' },
    bitgoYShare: { i: 3, j: 1, y: 'aabbcc', u: 'bitgo-u-value', chaincode: '00' },
    backupYShare: { i: 2, j: 1, y: 'aabbcc', u: 'backup-u-value', chaincode: '00' },
  };

  const MPCv1_MATERIAL_USER = {
    uShare: { i: 2, t: 2, n: 3, y: 'aabbcc', seed: 'deadbeef01234567', chaincode: '00' },
    bitgoYShare: { i: 3, j: 2, y: 'aabbcc', u: 'bitgo-u-value', chaincode: '00' },
    userYShare: { i: 1, j: 2, y: 'aabbcc', u: 'user-u-value', chaincode: '00' },
  };

  const MPCv2_CBOR_BYTES = Buffer.from([0xd9, 0x01, 0x04, 0xa3, 0x61, 0x78, 0x18, 0x00]).toString('base64');

  let mockBitgo: BitGoBase;
  beforeEach(() => {
    // sdk-core has no devDependency on sdk-api/argon2, so v2 envelopes are simulated here.
    // Real bitgo.decryptAsync routes v2 to Argon2id; the stub returns MPCv2 CBOR plaintext instead.
    mockBitgo = {
      decryptAsync: sinon.stub().callsFake(async (params: { input: string; password: string }) => {
        if (isV2Envelope(params.input)) {
          return MPCv2_CBOR_BYTES;
        }
        return sjcl.decrypt(params.password, params.input);
      }),
    } as unknown as BitGoBase;
  });

  it('returns true for MPCv1 SJCL-encrypted keycard with backupYShare + correct passphrase', async () => {
    const encrypted = sjcl.encrypt(PASSPHRASE, JSON.stringify(MPCv1_MATERIAL_BACKUP));
    assert.strictEqual(await EDDSAUtils.isEddsaMpcV1SigningMaterial(encrypted, PASSPHRASE), true);
  });

  it('returns true for MPCv1 SJCL-encrypted keycard with userYShare + correct passphrase', async () => {
    const encrypted = sjcl.encrypt(PASSPHRASE, JSON.stringify(MPCv1_MATERIAL_USER));
    assert.strictEqual(await EDDSAUtils.isEddsaMpcV1SigningMaterial(encrypted, PASSPHRASE), true);
  });

  it('returns false for MPCv2 CBOR content wrapped in SJCL envelope + correct passphrase', async () => {
    const encrypted = sjcl.encrypt(PASSPHRASE, MPCv2_CBOR_BYTES);
    assert.strictEqual(await EDDSAUtils.isEddsaMpcV1SigningMaterial(encrypted, PASSPHRASE), false);
  });

  it('returns false for MPCv2 Argon2id envelope (v2) + correct passphrase (forward-compat)', async () => {
    const fakeV2Envelope = JSON.stringify({ v: 2, m: 65536, t: 3, p: 4, salt: 'AAAA', iv: 'AAAA', ct: 'AAAA' });
    assert.strictEqual(await EDDSAUtils.isEddsaMpcV1SigningMaterial(fakeV2Envelope, PASSPHRASE, mockBitgo), false);
  });

  it('throws on wrong passphrase', async () => {
    const encrypted = sjcl.encrypt(PASSPHRASE, JSON.stringify(MPCv1_MATERIAL_BACKUP));
    await assert.rejects(
      EDDSAUtils.isEddsaMpcV1SigningMaterial(encrypted, 'wrong-passphrase'),
      /ccm: tag doesn't match/
    );
  });

  it('returns false when neither backupYShare.u nor userYShare.u is present', async () => {
    const partial = { uShare: { seed: 'abc' }, bitgoYShare: { u: 'xyz' } };
    const encrypted = sjcl.encrypt(PASSPHRASE, JSON.stringify(partial));
    assert.strictEqual(await EDDSAUtils.isEddsaMpcV1SigningMaterial(encrypted, PASSPHRASE), false);
  });
});

describe('signRecoveryEddsaMPCv2', () => {
  const derivationPath = 'm/0/0';

  it('should return a 64-byte signature that verifies against the derived public key', async () => {
    const [userDkg, backupDkg] = await MPSUtil.generateEdDsaDKGKeyShares();
    const message = Buffer.from('deadbeef', 'hex');
    const commonKeyChain = userDkg.getCommonKeychain();

    const signature = await EDDSAUtils.signRecoveryEddsaMPCv2(
      message,
      derivationPath,
      userDkg.getKeyShare(),
      backupDkg.getKeyShare(),
      commonKeyChain
    );

    assert.strictEqual(signature.length, 64);

    const derivedKeychain = deriveUnhardenedMps(commonKeyChain, derivationPath);
    const publicKeyBytes = Buffer.from(derivedKeychain.slice(0, 64), 'hex');
    const ok = ed25519.verify(new Uint8Array(signature), new Uint8Array(message), new Uint8Array(publicKeyBytes));
    assert.strictEqual(ok, true);
  });

  it('should throw when the signed message is different from the verified message', async () => {
    const [userDkg, backupDkg] = await MPSUtil.generateEdDsaDKGKeyShares();
    const message = Buffer.from('deadbeef', 'hex');
    const commonKeyChain = userDkg.getCommonKeychain();

    const signature = await EDDSAUtils.signRecoveryEddsaMPCv2(
      message,
      derivationPath,
      userDkg.getKeyShare(),
      backupDkg.getKeyShare(),
      commonKeyChain
    );

    const differentMessage = Buffer.from('cafebabe', 'hex');
    const derivedKeychain = deriveUnhardenedMps(commonKeyChain, derivationPath);
    const publicKeyBytes = Buffer.from(derivedKeychain.slice(0, 64), 'hex');
    const ok = ed25519.verify(
      new Uint8Array(signature),
      new Uint8Array(differentMessage),
      new Uint8Array(publicKeyBytes)
    );
    assert.strictEqual(ok, false);
  });

  it('should throw when a wrong commonKeyChain is provided (verification mismatch)', async () => {
    const [userDkg, backupDkg] = await MPSUtil.generateEdDsaDKGKeyShares();
    const [wrongDkg] = await MPSUtil.generateEdDsaDKGKeyShares();
    const message = Buffer.from('deadbeef', 'hex');

    await assert.rejects(
      EDDSAUtils.signRecoveryEddsaMPCv2(
        message,
        derivationPath,
        userDkg.getKeyShare(),
        backupDkg.getKeyShare(),
        wrongDkg.getCommonKeychain() // key chain from a different wallet
      ),
      /EdDSA MPCv2 recovery signature verification failed/
    );
  });
});
