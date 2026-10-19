import * as assert from 'assert';
import * as pgp from 'openpgp';
import { RedPallasMPSComms, RedPallasMPSTypes } from '@bitgo/sdk-lib-mpc';
import {
  RedpallasMPCv2RerandShareRound1Input,
  RedpallasMPCv2RerandShareRound1Output,
  RedpallasMPCv2RerandShareRound2Input,
  RedpallasMPCv2RerandShareRound2Output,
  RedpallasMPCv2SignatureShareRound1Input,
  RedpallasMPCv2SignatureShareRound1Output,
  RedpallasMPCv2SignatureShareRound2Input,
  RedpallasMPCv2SignatureShareRound2Output,
  RedpallasMPCv2SignatureShareRound3Input,
  RedpallasMPCv2SignatureShareRound3Output,
} from '@bitgo/public-types';
import { SignatureShareRecord, SignatureShareType } from '../../../../../src';
import {
  getRerandShareRoundOne,
  getRerandShareRoundTwo,
  getSignatureShareRoundOne,
  getSignatureShareRoundTwo,
  getSignatureShareRoundThree,
  verifyPeerRerandMessageRoundOne,
  verifyPeerRerandMessageRoundTwo,
  verifyPeerMessageRoundOne,
  verifyPeerMessageRoundTwo,
  verifyPeerMessageRoundThree,
} from '../../../../../src/bitgo/tss/redpallas/redpallasMPCv2';
import { decodeWithCodec } from '../../../../../src/bitgo/utils/codecs';
import { generateGPGKeyPair } from '../../../../../src/bitgo/utils/opengpgUtils';
import { MPCv2PartiesEnum } from '../../../../../src/bitgo/utils/tss/ecdsa/typesMPCv2';

/** N distinct spend payloads for one round, spend-index order baked into the bytes. */
const payloads = (party: MPCv2PartiesEnum, round: number, n: number): RedPallasMPSTypes.DeserializedMessage[] =>
  Array.from({ length: n }, (_, spendIndex) => ({
    from: party,
    payload: new Uint8Array(Buffer.from(`${party}-round-${round}-spend-${spendIndex}-payload`)),
  }));

const TAMPERED_SIGNATURE = '-----BEGIN PGP SIGNATURE-----\n\nINVALID\n-----END PGP SIGNATURE-----\n';

const tamperedMessage = () => ({
  message: Buffer.from('tampered').toString('base64'),
  signature: TAMPERED_SIGNATURE,
});

describe('RedPallas MPS DSG helper functions', function () {
  let userGpgPrivKey: pgp.PrivateKey;
  let backupGpgPrivKey: pgp.PrivateKey;
  let bitgoGpgPrivKey: pgp.PrivateKey;
  let bitgoGpgPubKey: pgp.Key;

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

  it('getSignatureShareRoundOne should build a valid N=1 round-1 share for the user', async function () {
    const share: SignatureShareRecord = await getSignatureShareRoundOne(
      payloads(MPCv2PartiesEnum.USER, 1, 1),
      userGpgPrivKey
    );

    assert.strictEqual(share.from, SignatureShareType.USER);
    assert.strictEqual(share.to, SignatureShareType.BITGO);

    const parsed = decodeWithCodec(
      RedpallasMPCv2SignatureShareRound1Input,
      JSON.parse(share.share),
      'RedpallasMPCv2SignatureShareRound1Input'
    );
    assert.strictEqual(parsed.type, 'round1Input');
    assert.strictEqual(parsed.data.msg1.length, 1);
    assert.ok(parsed.data.msg1[0].message, 'msg1[0].message should be set');
    assert.ok(parsed.data.msg1[0].signature, 'msg1[0].signature should be set');
  });

  it('getSignatureShareRoundOne should build a valid N=1 round-1 share for the backup', async function () {
    const share: SignatureShareRecord = await getSignatureShareRoundOne(
      payloads(MPCv2PartiesEnum.BACKUP, 1, 1),
      backupGpgPrivKey,
      MPCv2PartiesEnum.BACKUP
    );

    assert.strictEqual(share.from, SignatureShareType.BACKUP);
    assert.strictEqual(share.to, SignatureShareType.BITGO);
  });

  it('getSignatureShareRoundOne N=3 should decode and preserve spend order', async function () {
    const userMsg1s = payloads(MPCv2PartiesEnum.USER, 1, 3);
    const share: SignatureShareRecord = await getSignatureShareRoundOne(userMsg1s, userGpgPrivKey);

    const parsed = decodeWithCodec(
      RedpallasMPCv2SignatureShareRound1Input,
      JSON.parse(share.share),
      'RedpallasMPCv2SignatureShareRound1Input'
    );
    assert.strictEqual(parsed.data.msg1.length, 3);

    const userGpgPubKey = userGpgPrivKey.toPublic();
    for (const [spendIndex, signedMsg1] of parsed.data.msg1.entries()) {
      const rawBytes = await RedPallasMPSComms.verifyMpsMessage(signedMsg1, userGpgPubKey);
      assert.deepStrictEqual(rawBytes, Buffer.from(userMsg1s[spendIndex].payload), `spend ${spendIndex} out of order`);
    }
  });

  it('getSignatureShareRoundOne should reject an empty message array', async function () {
    await assert.rejects(getSignatureShareRoundOne([], userGpgPrivKey), /Expected at least 1 round-1 message/);
  });

  it('verifyPeerMessageRoundOne should verify valid N=3 BitGo round-1 messages in order', async function () {
    const bitgoMsg1s = payloads(MPCv2PartiesEnum.BITGO, 1, 3);
    const signedMsg1s = await Promise.all(
      bitgoMsg1s.map((msg) => RedPallasMPSComms.detachSignMpsMessage(Buffer.from(msg.payload), bitgoGpgPrivKey))
    );
    const round1Output: RedpallasMPCv2SignatureShareRound1Output = {
      type: 'round1Output',
      data: { msg1: signedMsg1s },
    };

    const results = await verifyPeerMessageRoundOne(round1Output, bitgoGpgPubKey);

    assert.strictEqual(results.length, 3);
    results.forEach((result, spendIndex) => {
      assert.strictEqual(result.from, MPCv2PartiesEnum.BITGO);
      assert.deepStrictEqual(
        Buffer.from(result.payload),
        Buffer.from(bitgoMsg1s[spendIndex].payload),
        `spend ${spendIndex} out of order`
      );
    });
  });

  it('verifyPeerMessageRoundOne should fail the whole N=3 round when one spend signature is bad', async function () {
    const bitgoMsg1s = payloads(MPCv2PartiesEnum.BITGO, 1, 3);
    const signedMsg1s = await Promise.all(
      bitgoMsg1s.map((msg) => RedPallasMPSComms.detachSignMpsMessage(Buffer.from(msg.payload), bitgoGpgPrivKey))
    );
    signedMsg1s[1] = tamperedMessage();
    const round1Output: RedpallasMPCv2SignatureShareRound1Output = {
      type: 'round1Output',
      data: { msg1: signedMsg1s },
    };

    await assert.rejects(verifyPeerMessageRoundOne(round1Output, bitgoGpgPubKey));
  });

  it('verifyPeerMessageRoundOne should throw on a tampered round-1 message', async function () {
    const round1Output: RedpallasMPCv2SignatureShareRound1Output = {
      type: 'round1Output',
      data: { msg1: [tamperedMessage()] },
    };

    await assert.rejects(verifyPeerMessageRoundOne(round1Output, bitgoGpgPubKey));
  });

  // ── Round 2 ─────────────────────────────────────────────────────────────────

  it('getSignatureShareRoundTwo should build a valid N=1 round-2 share for the user', async function () {
    const share: SignatureShareRecord = await getSignatureShareRoundTwo(
      payloads(MPCv2PartiesEnum.USER, 2, 1),
      userGpgPrivKey
    );

    assert.strictEqual(share.from, SignatureShareType.USER);
    assert.strictEqual(share.to, SignatureShareType.BITGO);

    const parsed = decodeWithCodec(
      RedpallasMPCv2SignatureShareRound2Input,
      JSON.parse(share.share),
      'RedpallasMPCv2SignatureShareRound2Input'
    );
    assert.strictEqual(parsed.type, 'round2Input');
    assert.strictEqual(parsed.data.msg2.length, 1);
    assert.ok(parsed.data.msg2[0].message, 'msg2[0].message should be set');
    assert.ok(parsed.data.msg2[0].signature, 'msg2[0].signature should be set');
  });

  it('getSignatureShareRoundTwo N=3 should decode and preserve spend order', async function () {
    const userMsg2s = payloads(MPCv2PartiesEnum.USER, 2, 3);
    const share: SignatureShareRecord = await getSignatureShareRoundTwo(userMsg2s, userGpgPrivKey);

    const parsed = decodeWithCodec(
      RedpallasMPCv2SignatureShareRound2Input,
      JSON.parse(share.share),
      'RedpallasMPCv2SignatureShareRound2Input'
    );
    assert.strictEqual(parsed.data.msg2.length, 3);

    const userGpgPubKey = userGpgPrivKey.toPublic();
    for (const [spendIndex, signedMsg2] of parsed.data.msg2.entries()) {
      const rawBytes = await RedPallasMPSComms.verifyMpsMessage(signedMsg2, userGpgPubKey);
      assert.deepStrictEqual(rawBytes, Buffer.from(userMsg2s[spendIndex].payload), `spend ${spendIndex} out of order`);
    }
  });

  it('getSignatureShareRoundTwo should reject an empty message array', async function () {
    await assert.rejects(getSignatureShareRoundTwo([], userGpgPrivKey), /Expected at least 1 round-2 message/);
  });

  it('verifyPeerMessageRoundTwo should verify valid N=3 BitGo round-2 messages in order', async function () {
    const bitgoMsg2s = payloads(MPCv2PartiesEnum.BITGO, 2, 3);
    const signedMsg2s = await Promise.all(
      bitgoMsg2s.map((msg) => RedPallasMPSComms.detachSignMpsMessage(Buffer.from(msg.payload), bitgoGpgPrivKey))
    );
    const round2Output: RedpallasMPCv2SignatureShareRound2Output = {
      type: 'round2Output',
      data: { msg2: signedMsg2s },
    };

    const results = await verifyPeerMessageRoundTwo(round2Output, bitgoGpgPubKey);

    assert.strictEqual(results.length, 3);
    results.forEach((result, spendIndex) => {
      assert.strictEqual(result.from, MPCv2PartiesEnum.BITGO);
      assert.deepStrictEqual(
        Buffer.from(result.payload),
        Buffer.from(bitgoMsg2s[spendIndex].payload),
        `spend ${spendIndex} out of order`
      );
    });
  });

  it('verifyPeerMessageRoundTwo should fail the whole N=3 round when one spend signature is bad', async function () {
    const bitgoMsg2s = payloads(MPCv2PartiesEnum.BITGO, 2, 3);
    const signedMsg2s = await Promise.all(
      bitgoMsg2s.map((msg) => RedPallasMPSComms.detachSignMpsMessage(Buffer.from(msg.payload), bitgoGpgPrivKey))
    );
    signedMsg2s[2] = tamperedMessage();
    const round2Output: RedpallasMPCv2SignatureShareRound2Output = {
      type: 'round2Output',
      data: { msg2: signedMsg2s },
    };

    await assert.rejects(verifyPeerMessageRoundTwo(round2Output, bitgoGpgPubKey));
  });

  it('verifyPeerMessageRoundTwo should throw on a tampered round-2 message', async function () {
    const round2Output: RedpallasMPCv2SignatureShareRound2Output = {
      type: 'round2Output',
      data: { msg2: [tamperedMessage()] },
    };

    await assert.rejects(verifyPeerMessageRoundTwo(round2Output, bitgoGpgPubKey));
  });

  // ── Round 3 ─────────────────────────────────────────────────────────────────

  it('getSignatureShareRoundThree should build a valid N=1 round-3 share for the backup', async function () {
    const share: SignatureShareRecord = await getSignatureShareRoundThree(
      payloads(MPCv2PartiesEnum.BACKUP, 3, 1),
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
    assert.strictEqual(parsed.data.msg3.length, 1);
    assert.ok(parsed.data.msg3[0].message, 'msg3[0].message should be set');
    assert.ok(parsed.data.msg3[0].signature, 'msg3[0].signature should be set');
  });

  it('getSignatureShareRoundThree N=3 should decode and preserve spend order', async function () {
    const userMsg3s = payloads(MPCv2PartiesEnum.USER, 3, 3);
    const share: SignatureShareRecord = await getSignatureShareRoundThree(userMsg3s, userGpgPrivKey);

    const parsed = decodeWithCodec(
      RedpallasMPCv2SignatureShareRound3Input,
      JSON.parse(share.share),
      'RedpallasMPCv2SignatureShareRound3Input'
    );
    assert.strictEqual(parsed.data.msg3.length, 3);

    const userGpgPubKey = userGpgPrivKey.toPublic();
    for (const [spendIndex, signedMsg3] of parsed.data.msg3.entries()) {
      const rawBytes = await RedPallasMPSComms.verifyMpsMessage(signedMsg3, userGpgPubKey);
      assert.deepStrictEqual(rawBytes, Buffer.from(userMsg3s[spendIndex].payload), `spend ${spendIndex} out of order`);
    }
  });

  it('getSignatureShareRoundThree should reject an empty message array', async function () {
    await assert.rejects(getSignatureShareRoundThree([], userGpgPrivKey), /Expected at least 1 round-3 message/);
  });

  it('verifyPeerMessageRoundThree should verify valid N=3 BitGo round-3 messages in order', async function () {
    const bitgoMsg3s = payloads(MPCv2PartiesEnum.BITGO, 3, 3);
    const signedMsg3s = await Promise.all(
      bitgoMsg3s.map((msg) => RedPallasMPSComms.detachSignMpsMessage(Buffer.from(msg.payload), bitgoGpgPrivKey))
    );
    const round3Output: RedpallasMPCv2SignatureShareRound3Output = {
      type: 'round3Output',
      data: { msg3: signedMsg3s },
    };

    const results = await verifyPeerMessageRoundThree(round3Output, bitgoGpgPubKey);

    assert.strictEqual(results.length, 3);
    results.forEach((result, spendIndex) => {
      assert.strictEqual(result.from, MPCv2PartiesEnum.BITGO);
      assert.deepStrictEqual(
        Buffer.from(result.payload),
        Buffer.from(bitgoMsg3s[spendIndex].payload),
        `spend ${spendIndex} out of order`
      );
    });
  });

  it('verifyPeerMessageRoundThree should fail the whole N=3 round when one spend signature is bad', async function () {
    const bitgoMsg3s = payloads(MPCv2PartiesEnum.BITGO, 3, 3);
    const signedMsg3s = await Promise.all(
      bitgoMsg3s.map((msg) => RedPallasMPSComms.detachSignMpsMessage(Buffer.from(msg.payload), bitgoGpgPrivKey))
    );
    signedMsg3s[0] = tamperedMessage();
    const round3Output: RedpallasMPCv2SignatureShareRound3Output = {
      type: 'round3Output',
      data: { msg3: signedMsg3s },
    };

    await assert.rejects(verifyPeerMessageRoundThree(round3Output, bitgoGpgPubKey));
  });

  it('verifyPeerMessageRoundThree should throw on a tampered round-3 message', async function () {
    const round3Output: RedpallasMPCv2SignatureShareRound3Output = {
      type: 'round3Output',
      data: { msg3: [tamperedMessage()] },
    };

    await assert.rejects(verifyPeerMessageRoundThree(round3Output, bitgoGpgPubKey));
  });

  // ── Rerand (must run before every DSG, same 2 parties, once per spend) ──────

  it('getRerandShareRoundOne should build a valid N=1 rerand round-1 share for the user', async function () {
    const share: SignatureShareRecord = await getRerandShareRoundOne(
      payloads(MPCv2PartiesEnum.USER, 1, 1),
      userGpgPrivKey
    );

    assert.strictEqual(share.from, SignatureShareType.USER);
    assert.strictEqual(share.to, SignatureShareType.BITGO);

    const parsed = decodeWithCodec(
      RedpallasMPCv2RerandShareRound1Input,
      JSON.parse(share.share),
      'RedpallasMPCv2RerandShareRound1Input'
    );
    assert.strictEqual(parsed.type, 'round1Input');
    assert.strictEqual(parsed.data.msg1.length, 1);
    assert.ok(parsed.data.msg1[0].message, 'msg1[0].message should be set');
    assert.ok(parsed.data.msg1[0].signature, 'msg1[0].signature should be set');
  });

  it('getRerandShareRoundOne should build a valid N=1 rerand round-1 share for the backup', async function () {
    const share: SignatureShareRecord = await getRerandShareRoundOne(
      payloads(MPCv2PartiesEnum.BACKUP, 1, 1),
      backupGpgPrivKey,
      MPCv2PartiesEnum.BACKUP
    );

    assert.strictEqual(share.from, SignatureShareType.BACKUP);
    assert.strictEqual(share.to, SignatureShareType.BITGO);
  });

  it('getRerandShareRoundOne N=3 should decode and preserve spend order', async function () {
    const userMsg1s = payloads(MPCv2PartiesEnum.USER, 1, 3);
    const share: SignatureShareRecord = await getRerandShareRoundOne(userMsg1s, userGpgPrivKey);

    const parsed = decodeWithCodec(
      RedpallasMPCv2RerandShareRound1Input,
      JSON.parse(share.share),
      'RedpallasMPCv2RerandShareRound1Input'
    );
    assert.strictEqual(parsed.data.msg1.length, 3);

    const userGpgPubKey = userGpgPrivKey.toPublic();
    for (const [spendIndex, signedMsg1] of parsed.data.msg1.entries()) {
      const rawBytes = await RedPallasMPSComms.verifyMpsMessage(signedMsg1, userGpgPubKey);
      assert.deepStrictEqual(rawBytes, Buffer.from(userMsg1s[spendIndex].payload), `spend ${spendIndex} out of order`);
    }
  });

  it('getRerandShareRoundOne should reject an empty message array', async function () {
    await assert.rejects(getRerandShareRoundOne([], userGpgPrivKey), /Expected at least 1 rerand round-1 message/);
  });

  it('verifyPeerRerandMessageRoundOne should verify valid N=3 BitGo rerand round-1 messages in order', async function () {
    const bitgoMsg1s = payloads(MPCv2PartiesEnum.BITGO, 1, 3);
    const signedMsg1s = await Promise.all(
      bitgoMsg1s.map((msg) => RedPallasMPSComms.detachSignMpsMessage(Buffer.from(msg.payload), bitgoGpgPrivKey))
    );
    const round1Output: RedpallasMPCv2RerandShareRound1Output = {
      type: 'round1Output',
      data: { msg1: signedMsg1s },
    };

    const results = await verifyPeerRerandMessageRoundOne(round1Output, bitgoGpgPubKey);

    assert.strictEqual(results.length, 3);
    results.forEach((result, spendIndex) => {
      assert.strictEqual(result.from, MPCv2PartiesEnum.BITGO);
      assert.deepStrictEqual(
        Buffer.from(result.payload),
        Buffer.from(bitgoMsg1s[spendIndex].payload),
        `spend ${spendIndex} out of order`
      );
    });
  });

  it('verifyPeerRerandMessageRoundOne should fail the whole N=3 round when one spend signature is bad', async function () {
    const bitgoMsg1s = payloads(MPCv2PartiesEnum.BITGO, 1, 3);
    const signedMsg1s = await Promise.all(
      bitgoMsg1s.map((msg) => RedPallasMPSComms.detachSignMpsMessage(Buffer.from(msg.payload), bitgoGpgPrivKey))
    );
    signedMsg1s[1] = tamperedMessage();
    const round1Output: RedpallasMPCv2RerandShareRound1Output = {
      type: 'round1Output',
      data: { msg1: signedMsg1s },
    };

    await assert.rejects(verifyPeerRerandMessageRoundOne(round1Output, bitgoGpgPubKey));
  });

  it('verifyPeerRerandMessageRoundOne should throw on a tampered rerand round-1 message', async function () {
    const round1Output: RedpallasMPCv2RerandShareRound1Output = {
      type: 'round1Output',
      data: { msg1: [tamperedMessage()] },
    };

    await assert.rejects(verifyPeerRerandMessageRoundOne(round1Output, bitgoGpgPubKey));
  });

  it('getRerandShareRoundTwo should build a valid N=1 rerand round-2 share for the user', async function () {
    const share: SignatureShareRecord = await getRerandShareRoundTwo(
      payloads(MPCv2PartiesEnum.USER, 2, 1),
      userGpgPrivKey
    );

    assert.strictEqual(share.from, SignatureShareType.USER);
    assert.strictEqual(share.to, SignatureShareType.BITGO);

    const parsed = decodeWithCodec(
      RedpallasMPCv2RerandShareRound2Input,
      JSON.parse(share.share),
      'RedpallasMPCv2RerandShareRound2Input'
    );
    assert.strictEqual(parsed.type, 'round2Input');
    assert.strictEqual(parsed.data.msg2.length, 1);
    assert.ok(parsed.data.msg2[0].message, 'msg2[0].message should be set');
    assert.ok(parsed.data.msg2[0].signature, 'msg2[0].signature should be set');
  });

  it('getRerandShareRoundTwo N=3 should decode and preserve spend order', async function () {
    const userMsg2s = payloads(MPCv2PartiesEnum.USER, 2, 3);
    const share: SignatureShareRecord = await getRerandShareRoundTwo(userMsg2s, userGpgPrivKey);

    const parsed = decodeWithCodec(
      RedpallasMPCv2RerandShareRound2Input,
      JSON.parse(share.share),
      'RedpallasMPCv2RerandShareRound2Input'
    );
    assert.strictEqual(parsed.data.msg2.length, 3);

    const userGpgPubKey = userGpgPrivKey.toPublic();
    for (const [spendIndex, signedMsg2] of parsed.data.msg2.entries()) {
      const rawBytes = await RedPallasMPSComms.verifyMpsMessage(signedMsg2, userGpgPubKey);
      assert.deepStrictEqual(rawBytes, Buffer.from(userMsg2s[spendIndex].payload), `spend ${spendIndex} out of order`);
    }
  });

  it('getRerandShareRoundTwo should reject an empty message array', async function () {
    await assert.rejects(getRerandShareRoundTwo([], userGpgPrivKey), /Expected at least 1 rerand round-2 message/);
  });

  it('verifyPeerRerandMessageRoundTwo should verify valid N=3 BitGo rerand round-2 messages in order', async function () {
    const bitgoMsg2s = payloads(MPCv2PartiesEnum.BITGO, 2, 3);
    const signedMsg2s = await Promise.all(
      bitgoMsg2s.map((msg) => RedPallasMPSComms.detachSignMpsMessage(Buffer.from(msg.payload), bitgoGpgPrivKey))
    );
    const round2Output: RedpallasMPCv2RerandShareRound2Output = {
      type: 'round2Output',
      data: { msg2: signedMsg2s },
    };

    const results = await verifyPeerRerandMessageRoundTwo(round2Output, bitgoGpgPubKey);

    assert.strictEqual(results.length, 3);
    results.forEach((result, spendIndex) => {
      assert.strictEqual(result.from, MPCv2PartiesEnum.BITGO);
      assert.deepStrictEqual(
        Buffer.from(result.payload),
        Buffer.from(bitgoMsg2s[spendIndex].payload),
        `spend ${spendIndex} out of order`
      );
    });
  });

  it('verifyPeerRerandMessageRoundTwo should fail the whole N=3 round when one spend signature is bad', async function () {
    const bitgoMsg2s = payloads(MPCv2PartiesEnum.BITGO, 2, 3);
    const signedMsg2s = await Promise.all(
      bitgoMsg2s.map((msg) => RedPallasMPSComms.detachSignMpsMessage(Buffer.from(msg.payload), bitgoGpgPrivKey))
    );
    signedMsg2s[2] = tamperedMessage();
    const round2Output: RedpallasMPCv2RerandShareRound2Output = {
      type: 'round2Output',
      data: { msg2: signedMsg2s },
    };

    await assert.rejects(verifyPeerRerandMessageRoundTwo(round2Output, bitgoGpgPubKey));
  });

  it('verifyPeerRerandMessageRoundTwo should throw on a tampered rerand round-2 message', async function () {
    const round2Output: RedpallasMPCv2RerandShareRound2Output = {
      type: 'round2Output',
      data: { msg2: [tamperedMessage()] },
    };

    await assert.rejects(verifyPeerRerandMessageRoundTwo(round2Output, bitgoGpgPubKey));
  });

  // ── Envelope round-trip via the independent RedPallas MPS comms layer ───────

  it('N=3 shares built by getSignatureShareRoundOne verify against RedPallasMPSComms directly', async function () {
    const userMsg1s = payloads(MPCv2PartiesEnum.USER, 1, 3);
    const share = await getSignatureShareRoundOne(userMsg1s, userGpgPrivKey);
    const parsed = decodeWithCodec(
      RedpallasMPCv2SignatureShareRound1Input,
      JSON.parse(share.share),
      'RedpallasMPCv2SignatureShareRound1Input'
    );

    const userGpgPubKey = userGpgPrivKey.toPublic();
    for (const [spendIndex, signedMsg1] of parsed.data.msg1.entries()) {
      const rawBytes = await RedPallasMPSComms.verifyMpsMessage(signedMsg1, userGpgPubKey);
      assert.deepStrictEqual(rawBytes, Buffer.from(userMsg1s[spendIndex].payload));
    }
  });
});
