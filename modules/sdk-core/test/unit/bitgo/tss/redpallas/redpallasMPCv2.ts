import * as assert from 'assert';
import * as pgp from 'openpgp';
import { RedPallasMPSComms, RedPallasMPSTypes } from '@bitgo/sdk-lib-mpc';
import {
  RedpallasMPCv2SignatureShareRound1Input,
  RedpallasMPCv2SignatureShareRound1Output,
  RedpallasMPCv2SignatureShareRound2Input,
  RedpallasMPCv2SignatureShareRound2Output,
  RedpallasMPCv2SignatureShareRound3Input,
  RedpallasMPCv2SignatureShareRound3Output,
} from '@bitgo/public-types';
import { SignatureShareRecord, SignatureShareType } from '../../../../../src';
import {
  getSignatureShareRoundOne,
  getSignatureShareRoundTwo,
  getSignatureShareRoundThree,
  verifyPeerMessageRoundOne,
  verifyPeerMessageRoundTwo,
  verifyPeerMessageRoundThree,
} from '../../../../../src/bitgo/tss/redpallas/redpallasMPCv2';
import { decodeWithCodec } from '../../../../../src/bitgo/utils/codecs';
import { generateGPGKeyPair } from '../../../../../src/bitgo/utils/opengpgUtils';
import { MPCv2PartiesEnum } from '../../../../../src/bitgo/utils/tss/ecdsa/typesMPCv2';

describe('RedPallas MPS DSG helper functions', function () {
  let userGpgPrivKey: pgp.PrivateKey;
  let backupGpgPrivKey: pgp.PrivateKey;
  let bitgoGpgPrivKey: pgp.PrivateKey;
  let bitgoGpgPubKey: pgp.Key;

  const userPayload = (round: number): RedPallasMPSTypes.DeserializedMessage => ({
    from: MPCv2PartiesEnum.USER,
    payload: new Uint8Array(Buffer.from(`user-round-${round}-payload`)),
  });
  const backupPayload = (round: number): RedPallasMPSTypes.DeserializedMessage => ({
    from: MPCv2PartiesEnum.BACKUP,
    payload: new Uint8Array(Buffer.from(`backup-round-${round}-payload`)),
  });
  const bitgoPayload = (round: number): RedPallasMPSTypes.DeserializedMessage => ({
    from: MPCv2PartiesEnum.BITGO,
    payload: new Uint8Array(Buffer.from(`bitgo-round-${round}-payload`)),
  });

  before('generate GPG key pairs', async function () {
    const userGpgKeyPair = await generateGPGKeyPair('ed25519');
    const backupGpgKeyPair = await generateGPGKeyPair('ed25519');
    const bitgoGpgKeyPair = await generateGPGKeyPair('ed25519');

    userGpgPrivKey = await pgp.readPrivateKey({ armoredKey: userGpgKeyPair.privateKey });
    backupGpgPrivKey = await pgp.readPrivateKey({ armoredKey: backupGpgKeyPair.privateKey });
    bitgoGpgPrivKey = await pgp.readPrivateKey({ armoredKey: bitgoGpgKeyPair.privateKey });
    bitgoGpgPubKey = await pgp.readKey({ armoredKey: bitgoGpgKeyPair.publicKey });
  });

  // ── Round 1 ─────────────────────────────────────────────────────────────────

  it('getSignatureShareRoundOne should build a valid round-1 share for the user', async function () {
    const share: SignatureShareRecord = await getSignatureShareRoundOne(userPayload(1), userGpgPrivKey);

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

  it('getSignatureShareRoundOne should build a valid round-1 share for the backup', async function () {
    const share: SignatureShareRecord = await getSignatureShareRoundOne(
      backupPayload(1),
      backupGpgPrivKey,
      MPCv2PartiesEnum.BACKUP
    );

    assert.strictEqual(share.from, SignatureShareType.BACKUP);
    assert.strictEqual(share.to, SignatureShareType.BITGO);
  });

  it('verifyPeerMessageRoundOne should verify a valid BitGo round-1 message', async function () {
    const bitgoSignedMsg1 = await RedPallasMPSComms.detachSignMpsMessage(
      Buffer.from(bitgoPayload(1).payload),
      bitgoGpgPrivKey
    );
    const round1Output: RedpallasMPCv2SignatureShareRound1Output = {
      type: 'round1Output',
      data: { msg1: bitgoSignedMsg1 },
    };

    const result = await verifyPeerMessageRoundOne(round1Output, bitgoGpgPubKey);

    assert.strictEqual(result.from, MPCv2PartiesEnum.BITGO);
    assert.deepStrictEqual(Buffer.from(result.payload), Buffer.from(bitgoPayload(1).payload));
  });

  it('verifyPeerMessageRoundOne should throw on a tampered round-1 message', async function () {
    const round1Output: RedpallasMPCv2SignatureShareRound1Output = {
      type: 'round1Output',
      data: {
        msg1: {
          message: Buffer.from('tampered').toString('base64'),
          signature: '-----BEGIN PGP SIGNATURE-----\n\nINVALID\n-----END PGP SIGNATURE-----\n',
        },
      },
    };

    await assert.rejects(verifyPeerMessageRoundOne(round1Output, bitgoGpgPubKey));
  });

  // ── Round 2 ─────────────────────────────────────────────────────────────────

  it('getSignatureShareRoundTwo should build a valid round-2 share for the user', async function () {
    const share: SignatureShareRecord = await getSignatureShareRoundTwo(userPayload(2), userGpgPrivKey);

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

  it('verifyPeerMessageRoundTwo should verify a valid BitGo round-2 message', async function () {
    const bitgoSignedMsg2 = await RedPallasMPSComms.detachSignMpsMessage(
      Buffer.from(bitgoPayload(2).payload),
      bitgoGpgPrivKey
    );
    const round2Output: RedpallasMPCv2SignatureShareRound2Output = {
      type: 'round2Output',
      data: { msg2: bitgoSignedMsg2 },
    };

    const result = await verifyPeerMessageRoundTwo(round2Output, bitgoGpgPubKey);

    assert.strictEqual(result.from, MPCv2PartiesEnum.BITGO);
    assert.deepStrictEqual(Buffer.from(result.payload), Buffer.from(bitgoPayload(2).payload));
  });

  it('verifyPeerMessageRoundTwo should throw on a tampered round-2 message', async function () {
    const round2Output: RedpallasMPCv2SignatureShareRound2Output = {
      type: 'round2Output',
      data: {
        msg2: {
          message: Buffer.from('tampered').toString('base64'),
          signature: '-----BEGIN PGP SIGNATURE-----\n\nINVALID\n-----END PGP SIGNATURE-----\n',
        },
      },
    };

    await assert.rejects(verifyPeerMessageRoundTwo(round2Output, bitgoGpgPubKey));
  });

  // ── Round 3 ─────────────────────────────────────────────────────────────────

  it('getSignatureShareRoundThree should build a valid round-3 share for the backup', async function () {
    const share: SignatureShareRecord = await getSignatureShareRoundThree(
      backupPayload(3),
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

  it('verifyPeerMessageRoundThree should verify a valid BitGo round-3 message', async function () {
    const bitgoSignedMsg3 = await RedPallasMPSComms.detachSignMpsMessage(
      Buffer.from(bitgoPayload(3).payload),
      bitgoGpgPrivKey
    );
    const round3Output: RedpallasMPCv2SignatureShareRound3Output = {
      type: 'round3Output',
      data: { msg3: bitgoSignedMsg3 },
    };

    const result = await verifyPeerMessageRoundThree(round3Output, bitgoGpgPubKey);

    assert.strictEqual(result.from, MPCv2PartiesEnum.BITGO);
    assert.deepStrictEqual(Buffer.from(result.payload), Buffer.from(bitgoPayload(3).payload));
  });

  it('verifyPeerMessageRoundThree should throw on a tampered round-3 message', async function () {
    const round3Output: RedpallasMPCv2SignatureShareRound3Output = {
      type: 'round3Output',
      data: {
        msg3: {
          message: Buffer.from('tampered').toString('base64'),
          signature: '-----BEGIN PGP SIGNATURE-----\n\nINVALID\n-----END PGP SIGNATURE-----\n',
        },
      },
    };

    await assert.rejects(verifyPeerMessageRoundThree(round3Output, bitgoGpgPubKey));
  });

  // ── Envelope round-trip via the independent RedPallas MPS comms layer ───────

  it('a share built by getSignatureShareRoundOne verifies against RedPallasMPSComms directly', async function () {
    const share = await getSignatureShareRoundOne(userPayload(1), userGpgPrivKey);
    const parsed = decodeWithCodec(
      RedpallasMPCv2SignatureShareRound1Input,
      JSON.parse(share.share),
      'RedpallasMPCv2SignatureShareRound1Input'
    );

    const userGpgPubKey = userGpgPrivKey.toPublic();
    const rawBytes = await RedPallasMPSComms.verifyMpsMessage(parsed.data.msg1, userGpgPubKey);

    assert.deepStrictEqual(rawBytes, Buffer.from(userPayload(1).payload));
  });
});
