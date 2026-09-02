import * as assert from 'assert';
import * as pgp from 'openpgp';
import { RedPallasMPSComms, RedPallasMPSDsg, RedPallasMPSTypes, RedPallasMPSUtil } from '@bitgo/sdk-lib-mpc';
import {
  RedpallasMPCv2SignatureShareRound1Input,
  RedpallasMPCv2SignatureShareRound1Output,
  RedpallasMPCv2SignatureShareRound2Input,
  RedpallasMPCv2SignatureShareRound2Output,
  RedpallasMPCv2SignatureShareRound3Input,
  RedpallasMPCv2SignatureShareRound3Output,
} from '@bitgo/public-types';
import { SignatureShareRecord, SignatureShareType } from '../../../../../../src';
import {
  getSignatureShareRoundOne,
  getSignatureShareRoundTwo,
  getSignatureShareRoundThree,
  verifyPeerMessageRoundOne,
  verifyPeerMessageRoundTwo,
  verifyPeerMessageRoundThree,
} from '../../../../../../src/bitgo/tss/redpallas/redpallasMPCv2';
import { decodeWithCodec } from '../../../../../../src/bitgo/utils/codecs';
import { generateGPGKeyPair } from '../../../../../../src/bitgo/utils/opengpgUtils';
import { MPCv2PartiesEnum } from '../../../../../../src/bitgo/utils/tss/ecdsa/typesMPCv2';

describe('RedPallas MPS DSG helper functions', async () => {
  let userKeyShare: Buffer;
  let backupKeyShare: Buffer;
  let bitgoKeyShare: Buffer;
  let userGpgPrivKey: pgp.PrivateKey;
  let backupGpgPrivKey: pgp.PrivateKey;
  let bitgoGpgPrivKey: pgp.PrivateKey;
  let bitgoGpgPubKey: pgp.Key;

  const signableHex = 'deadbeef';
  const derivationSeed = Buffer.from('c526955e37be0a0c8b77a831eb615948772b38df9f04d8c5a2e0e1f1d0c9b8a7', 'hex');

  before('generate RedPallas DKG key shares', async () => {
    const userGpgKeyPair = await generateGPGKeyPair('ed25519');
    const backupGpgKeyPair = await generateGPGKeyPair('ed25519');
    const bitgoGpgKeyPair = await generateGPGKeyPair('ed25519');

    userGpgPrivKey = await pgp.readPrivateKey({ armoredKey: userGpgKeyPair.privateKey });
    backupGpgPrivKey = await pgp.readPrivateKey({ armoredKey: backupGpgKeyPair.privateKey });
    bitgoGpgPrivKey = await pgp.readPrivateKey({ armoredKey: bitgoGpgKeyPair.privateKey });
    bitgoGpgPubKey = await pgp.readKey({ armoredKey: bitgoGpgKeyPair.publicKey });

    const [userDkg, backupDkg, bitgoDkg] = await RedPallasMPSUtil.generateRedPallasDKGKeyShares(derivationSeed);
    userKeyShare = userDkg.getKeyShare();
    backupKeyShare = backupDkg.getKeyShare();
    bitgoKeyShare = bitgoDkg.getKeyShare();
  });

  // ── Round 1 ─────────────────────────────────────────────────────────────────

  it('getSignatureShareRoundOne should build a valid round-1 share', async () => {
    const messageBuffer = Buffer.from(signableHex, 'hex');
    const userDsg = new RedPallasMPSDsg.RedPallasDSG(MPCv2PartiesEnum.USER);
    await userDsg.initDsg(userKeyShare, messageBuffer, MPCv2PartiesEnum.BITGO);
    const userMsg1 = userDsg.getFirstMessage();

    const share: SignatureShareRecord = await getSignatureShareRoundOne(userMsg1, userGpgPrivKey);

    assert.strictEqual(share.from, SignatureShareType.USER);
    assert.strictEqual(share.to, SignatureShareType.BITGO);

    const parsed = decodeWithCodec(
      RedpallasMPCv2SignatureShareRound1Input,
      JSON.parse(share.share),
      'RedpallasMPCv2SignatureShareRound1Input'
    );
    assert.strictEqual(parsed.type, 'round1Input');
    assert.ok(parsed.data.msg1.message, 'msg1.message should be set');
    assert.ok(parsed.data.msg1.signature, 'msg1.signature should be set');
  });

  it('getSignatureShareRoundOne should build a valid backup round-1 share', async () => {
    const messageBuffer = Buffer.from(signableHex, 'hex');
    const backupDsg = new RedPallasMPSDsg.RedPallasDSG(MPCv2PartiesEnum.BACKUP);
    await backupDsg.initDsg(backupKeyShare, messageBuffer, MPCv2PartiesEnum.BITGO);
    const backupMsg1 = backupDsg.getFirstMessage();

    const share: SignatureShareRecord = await getSignatureShareRoundOne(
      backupMsg1,
      backupGpgPrivKey,
      MPCv2PartiesEnum.BACKUP
    );

    assert.strictEqual(share.from, SignatureShareType.BACKUP);
    assert.strictEqual(share.to, SignatureShareType.BITGO);

    const parsed = decodeWithCodec(
      RedpallasMPCv2SignatureShareRound1Input,
      JSON.parse(share.share),
      'RedpallasMPCv2SignatureShareRound1Input'
    );
    assert.strictEqual(parsed.type, 'round1Input');
    assert.ok(parsed.data.msg1.message, 'msg1.message should be set');
    assert.ok(parsed.data.msg1.signature, 'msg1.signature should be set');
  });

  it('verifyPeerMessageRoundOne should verify a valid BitGo round-1 message', async () => {
    const messageBuffer = Buffer.from(signableHex, 'hex');
    const bitgoDsg = new RedPallasMPSDsg.RedPallasDSG(MPCv2PartiesEnum.BITGO);
    await bitgoDsg.initDsg(bitgoKeyShare, messageBuffer, MPCv2PartiesEnum.USER);
    const bitgoMsg1 = bitgoDsg.getFirstMessage();

    const bitgoSignedMsg1 = await RedPallasMPSComms.detachSignMpsMessage(
      Buffer.from(bitgoMsg1.payload),
      bitgoGpgPrivKey
    );
    const round1Output: RedpallasMPCv2SignatureShareRound1Output = {
      type: 'round1Output',
      data: { msg1: bitgoSignedMsg1 },
    };

    const result = await verifyPeerMessageRoundOne(round1Output, bitgoGpgPubKey);

    assert.strictEqual(result.from, MPCv2PartiesEnum.BITGO);
    assert.ok(result.payload.length > 0, 'payload should be non-empty');
  });

  it('verifyPeerMessageRoundOne should throw on a tampered message', async () => {
    const round1Output: RedpallasMPCv2SignatureShareRound1Output = {
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
    const userDsg = new RedPallasMPSDsg.RedPallasDSG(MPCv2PartiesEnum.USER);
    await userDsg.initDsg(userKeyShare, messageBuffer, MPCv2PartiesEnum.BITGO);
    const userMsg1 = userDsg.getFirstMessage();

    const bitgoDsg = new RedPallasMPSDsg.RedPallasDSG(MPCv2PartiesEnum.BITGO);
    await bitgoDsg.initDsg(bitgoKeyShare, messageBuffer, MPCv2PartiesEnum.USER);
    const bitgoMsg1 = bitgoDsg.getFirstMessage();

    const bitgoSignedMsg1 = await RedPallasMPSComms.detachSignMpsMessage(
      Buffer.from(bitgoMsg1.payload),
      bitgoGpgPrivKey
    );
    const bitgoDeserializedMsg1 = await verifyPeerMessageRoundOne(
      { type: 'round1Output', data: { msg1: bitgoSignedMsg1 } },
      bitgoGpgPubKey
    );
    const [userMsg2] = userDsg.handleIncomingMessages([userMsg1, bitgoDeserializedMsg1]);

    const share: SignatureShareRecord = await getSignatureShareRoundTwo(userMsg2, userGpgPrivKey);

    assert.strictEqual(share.from, SignatureShareType.USER);
    assert.strictEqual(share.to, SignatureShareType.BITGO);

    const parsed = decodeWithCodec(
      RedpallasMPCv2SignatureShareRound2Input,
      JSON.parse(share.share),
      'RedpallasMPCv2SignatureShareRound2Input'
    );
    assert.strictEqual(parsed.type, 'round2Input');
    assert.ok(parsed.data.msg2.message, 'msg2.message should be set');
    assert.ok(parsed.data.msg2.signature, 'msg2.signature should be set');
  });

  it('getSignatureShareRoundTwo should build a valid backup round-2 share', async () => {
    const messageBuffer = Buffer.from(signableHex, 'hex');
    const backupDsg = new RedPallasMPSDsg.RedPallasDSG(MPCv2PartiesEnum.BACKUP);
    await backupDsg.initDsg(backupKeyShare, messageBuffer, MPCv2PartiesEnum.BITGO);
    const backupMsg1 = backupDsg.getFirstMessage();

    const bitgoDsg = new RedPallasMPSDsg.RedPallasDSG(MPCv2PartiesEnum.BITGO);
    await bitgoDsg.initDsg(bitgoKeyShare, messageBuffer, MPCv2PartiesEnum.BACKUP);
    const bitgoMsg1 = bitgoDsg.getFirstMessage();

    const bitgoSignedMsg1 = await RedPallasMPSComms.detachSignMpsMessage(
      Buffer.from(bitgoMsg1.payload),
      bitgoGpgPrivKey
    );
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
      RedpallasMPCv2SignatureShareRound2Input,
      JSON.parse(share.share),
      'RedpallasMPCv2SignatureShareRound2Input'
    );
    assert.strictEqual(parsed.type, 'round2Input');
    assert.ok(parsed.data.msg2.message, 'msg2.message should be set');
    assert.ok(parsed.data.msg2.signature, 'msg2.signature should be set');
  });

  it('verifyPeerMessageRoundTwo should verify a valid BitGo round-2 message', async () => {
    const messageBuffer = Buffer.from(signableHex, 'hex');
    const userDsg = new RedPallasMPSDsg.RedPallasDSG(MPCv2PartiesEnum.USER);
    await userDsg.initDsg(userKeyShare, messageBuffer, MPCv2PartiesEnum.BITGO);
    const userMsg1 = userDsg.getFirstMessage();

    const bitgoDsg = new RedPallasMPSDsg.RedPallasDSG(MPCv2PartiesEnum.BITGO);
    await bitgoDsg.initDsg(bitgoKeyShare, messageBuffer, MPCv2PartiesEnum.USER);
    const bitgoMsg1 = bitgoDsg.getFirstMessage();

    const [bitgoMsg2] = bitgoDsg.handleIncomingMessages([bitgoMsg1, userMsg1]);
    const bitgoSignedMsg2 = await RedPallasMPSComms.detachSignMpsMessage(
      Buffer.from(bitgoMsg2.payload),
      bitgoGpgPrivKey
    );

    const round2Output: RedpallasMPCv2SignatureShareRound2Output = {
      type: 'round2Output',
      data: { msg2: bitgoSignedMsg2 },
    };

    const result = await verifyPeerMessageRoundTwo(round2Output, bitgoGpgPubKey);

    assert.strictEqual(result.from, MPCv2PartiesEnum.BITGO);
    assert.ok(result.payload.length > 0, 'payload should be non-empty');
  });

  it('verifyPeerMessageRoundTwo should throw on a tampered message', async () => {
    const round2Output: RedpallasMPCv2SignatureShareRound2Output = {
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
    const userDsg = new RedPallasMPSDsg.RedPallasDSG(MPCv2PartiesEnum.USER);
    await userDsg.initDsg(userKeyShare, messageBuffer, MPCv2PartiesEnum.BITGO);
    const userMsg1 = userDsg.getFirstMessage();

    const bitgoDsg = new RedPallasMPSDsg.RedPallasDSG(MPCv2PartiesEnum.BITGO);
    await bitgoDsg.initDsg(bitgoKeyShare, messageBuffer, MPCv2PartiesEnum.USER);
    const bitgoMsg1 = bitgoDsg.getFirstMessage();

    // Advance to round 2
    const bitgoSignedMsg1 = await RedPallasMPSComms.detachSignMpsMessage(
      Buffer.from(bitgoMsg1.payload),
      bitgoGpgPrivKey
    );
    const bitgoDeserializedMsg1 = await verifyPeerMessageRoundOne(
      { type: 'round1Output', data: { msg1: bitgoSignedMsg1 } },
      bitgoGpgPubKey
    );
    const [userMsg2] = userDsg.handleIncomingMessages([userMsg1, bitgoDeserializedMsg1]);

    const [bitgoMsg2] = bitgoDsg.handleIncomingMessages([bitgoMsg1, userMsg1]);
    const bitgoSignedMsg2 = await RedPallasMPSComms.detachSignMpsMessage(
      Buffer.from(bitgoMsg2.payload),
      bitgoGpgPrivKey
    );
    const bitgoDeserializedMsg2 = await verifyPeerMessageRoundTwo(
      { type: 'round2Output', data: { msg2: bitgoSignedMsg2 } },
      bitgoGpgPubKey
    );
    const [userMsg3] = userDsg.handleIncomingMessages([userMsg2, bitgoDeserializedMsg2]);

    const share: SignatureShareRecord = await getSignatureShareRoundThree(userMsg3, userGpgPrivKey);

    assert.strictEqual(share.from, SignatureShareType.USER);
    assert.strictEqual(share.to, SignatureShareType.BITGO);

    const parsed = decodeWithCodec(
      RedpallasMPCv2SignatureShareRound3Input,
      JSON.parse(share.share),
      'RedpallasMPCv2SignatureShareRound3Input'
    );
    assert.strictEqual(parsed.type, 'round3Input');
    assert.ok(parsed.data.msg3.message, 'msg3.message should be set');
    assert.ok(parsed.data.msg3.signature, 'msg3.signature should be set');
  });

  it('getSignatureShareRoundThree should build a valid backup round-3 share', async () => {
    const messageBuffer = Buffer.from(signableHex, 'hex');
    const backupDsg = new RedPallasMPSDsg.RedPallasDSG(MPCv2PartiesEnum.BACKUP);
    await backupDsg.initDsg(backupKeyShare, messageBuffer, MPCv2PartiesEnum.BITGO);
    const backupMsg1 = backupDsg.getFirstMessage();

    const bitgoDsg = new RedPallasMPSDsg.RedPallasDSG(MPCv2PartiesEnum.BITGO);
    await bitgoDsg.initDsg(bitgoKeyShare, messageBuffer, MPCv2PartiesEnum.BACKUP);
    const bitgoMsg1 = bitgoDsg.getFirstMessage();

    const bitgoSignedMsg1 = await RedPallasMPSComms.detachSignMpsMessage(
      Buffer.from(bitgoMsg1.payload),
      bitgoGpgPrivKey
    );
    const bitgoDeserializedMsg1 = await verifyPeerMessageRoundOne(
      { type: 'round1Output', data: { msg1: bitgoSignedMsg1 } },
      bitgoGpgPubKey
    );
    const [backupMsg2] = backupDsg.handleIncomingMessages([backupMsg1, bitgoDeserializedMsg1]);

    const [bitgoMsg2] = bitgoDsg.handleIncomingMessages([bitgoMsg1, backupMsg1]);
    const bitgoSignedMsg2 = await RedPallasMPSComms.detachSignMpsMessage(
      Buffer.from(bitgoMsg2.payload),
      bitgoGpgPrivKey
    );
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
      RedpallasMPCv2SignatureShareRound3Input,
      JSON.parse(share.share),
      'RedpallasMPCv2SignatureShareRound3Input'
    );
    assert.strictEqual(parsed.type, 'round3Input');
    assert.ok(parsed.data.msg3.message, 'msg3.message should be set');
    assert.ok(parsed.data.msg3.signature, 'msg3.signature should be set');
  });

  it('verifyPeerMessageRoundThree should verify a valid BitGo round-3 message', async () => {
    const messageBuffer = Buffer.from(signableHex, 'hex');
    const [, [bitgoMsg3]] = (await RedPallasMPSUtil.executeTillRound(
      2,
      new RedPallasMPSDsg.RedPallasDSG(MPCv2PartiesEnum.USER),
      new RedPallasMPSDsg.RedPallasDSG(MPCv2PartiesEnum.BITGO),
      userKeyShare,
      bitgoKeyShare,
      messageBuffer
    )) as RedPallasMPSTypes.DeserializedMessages[];
    const bitgoSignedMsg3 = await RedPallasMPSComms.detachSignMpsMessage(
      Buffer.from(bitgoMsg3.payload),
      bitgoGpgPrivKey
    );

    const round3Output: RedpallasMPCv2SignatureShareRound3Output = {
      type: 'round3Output',
      data: { msg3: bitgoSignedMsg3 },
    };

    const result = await verifyPeerMessageRoundThree(round3Output, bitgoGpgPubKey);

    assert.strictEqual(result.from, MPCv2PartiesEnum.BITGO);
    assert.ok(result.payload.length > 0, 'payload should be non-empty');
  });

  it('verifyPeerMessageRoundThree should throw on a tampered message', async () => {
    const round3Output: RedpallasMPCv2SignatureShareRound3Output = {
      type: 'round3Output',
      data: {
        msg3: {
          message: Buffer.from('tampered').toString('base64'),
          signature: '-----BEGIN PGP SIGNATURE-----\n\nINVALID\n-----END PGP SIGNATURE-----\n',
        },
      },
    };

    await assert.rejects(
      verifyPeerMessageRoundThree(round3Output, bitgoGpgPubKey),
      'should throw on invalid signature'
    );
  });
});
