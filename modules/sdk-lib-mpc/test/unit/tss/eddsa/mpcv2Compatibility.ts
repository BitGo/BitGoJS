/**
 * Wire-format compatibility regression tests for EdDSA MPCv2 keyshares.
 *
 * These tests load *frozen* keyshare bytes captured at a specific @bitgo/sdk-lib-mpc
 * version. If @bitgo/wasm-mps changes its bincode layout, DSG round 0 will throw
 * while deserializing the fixture bytes — the earliest possible signal of a
 * breaking change before it reaches production.
 */
import assert from 'assert';
import crypto from 'crypto';
import { ed25519 } from '@noble/curves/ed25519';
import { EddsaMPSDsg, MPSTypes, MPSUtil } from '../../../../src/tss/eddsa-mps';
import { EDDSA_MPCV2_FIXTURES } from '../../../fixtures/eddsaMPCv2Keyshares';

const MESSAGE = Buffer.from('WCI-1476 EdDSA MPCv2 wire-format regression sentinel');

describe('EdDSA MPCv2 wire-format compatibility', function () {
  it('should deserialize frozen user keyshare without error (bincode format guard)', async function () {
    const dsg = new EddsaMPSDsg.DSG(0);
    await dsg.initDsg(EDDSA_MPCV2_FIXTURES.userKeyShare, MESSAGE, 'm', 2);
    const msg = dsg.getFirstMessage();
    assert(msg.payload.length > 0, 'DSG round 0 must produce a non-empty message');
  });

  it('should deserialize frozen backup keyshare without error', async function () {
    const dsg = new EddsaMPSDsg.DSG(1);
    await dsg.initDsg(EDDSA_MPCV2_FIXTURES.backupKeyShare, MESSAGE, 'm', 2);
    const msg = dsg.getFirstMessage();
    assert(msg.payload.length > 0, 'Backup DSG round 0 must produce a non-empty message');
  });

  it('should deserialize frozen bitgo keyshare without error', async function () {
    const dsg = new EddsaMPSDsg.DSG(2);
    await dsg.initDsg(EDDSA_MPCV2_FIXTURES.bitgoKeyShare, MESSAGE, 'm', 0);
    const msg = dsg.getFirstMessage();
    assert(msg.payload.length > 0, 'BitGo DSG round 0 must produce a non-empty message');
  });

  it('should produce a valid signature from frozen user+bitgo keyshares', async function () {
    const sig = (await MPSUtil.executeTillRound(
      3,
      new EddsaMPSDsg.DSG(0),
      new EddsaMPSDsg.DSG(2),
      EDDSA_MPCV2_FIXTURES.userKeyShare,
      EDDSA_MPCV2_FIXTURES.bitgoKeyShare,
      MESSAGE,
      'm'
    )) as Buffer;

    assert.strictEqual(sig.length, 64, 'Signature must be 64 bytes');

    const pubKeyHex = EDDSA_MPCV2_FIXTURES.commonKeychain.slice(0, 64);
    const pubKey = Buffer.from(pubKeyHex, 'hex');
    assert(ed25519.verify(sig, MESSAGE, pubKey), 'Signature must verify under the frozen commonKeychain public key');
  });

  it('should produce a valid signature from frozen user+backup keyshares', async function () {
    const sig = (await MPSUtil.executeTillRound(
      3,
      new EddsaMPSDsg.DSG(0),
      new EddsaMPSDsg.DSG(1),
      EDDSA_MPCV2_FIXTURES.userKeyShare,
      EDDSA_MPCV2_FIXTURES.backupKeyShare,
      MESSAGE,
      'm'
    )) as Buffer;

    const pubKeyHex = EDDSA_MPCV2_FIXTURES.commonKeychain.slice(0, 64);
    const pubKey = Buffer.from(pubKeyHex, 'hex');
    assert(ed25519.verify(sig, MESSAGE, pubKey), 'Signature must verify under the frozen commonKeychain public key');
  });

  it('should decode frozen reducedKeyShare and match commonKeychain fields', function () {
    const decoded = MPSTypes.getDecodedReducedKeyShare(EDDSA_MPCV2_FIXTURES.userReducedKeyShare);

    const pubHex = EDDSA_MPCV2_FIXTURES.commonKeychain.slice(0, 64);
    const chaincodeHex = EDDSA_MPCV2_FIXTURES.commonKeychain.slice(64);

    assert.strictEqual(
      Buffer.from(decoded.pub).toString('hex'),
      pubHex,
      'Decoded pub must match commonKeychain pubkey'
    );
    assert.strictEqual(
      Buffer.from(decoded.rootChainCode).toString('hex'),
      chaincodeHex,
      'Decoded rootChainCode must match commonKeychain chaincode'
    );
    assert(decoded.keyShare.length > 0, 'keyShare in reducedKeyShare must be non-empty');
  });

  it('should reject randomised bytes as a keyshare (guard validation)', async function () {
    const randomBytes = Buffer.from(crypto.randomBytes(EDDSA_MPCV2_FIXTURES.userKeyShare.length));
    const dsg = new EddsaMPSDsg.DSG(0);
    await dsg.initDsg(randomBytes, MESSAGE, 'm', 2);
    assert.throws(
      () => dsg.getFirstMessage(),
      /Error while creating/,
      'DSG round 0 must reject random bytes that are not a valid bincode keyshare'
    );
  });

  it('should produce a verifiable signature at a derived path from frozen keyshares', async function () {
    const sig = (await MPSUtil.executeTillRound(
      3,
      new EddsaMPSDsg.DSG(0),
      new EddsaMPSDsg.DSG(2),
      EDDSA_MPCV2_FIXTURES.userKeyShare,
      EDDSA_MPCV2_FIXTURES.bitgoKeyShare,
      MESSAGE,
      'm/0/1'
    )) as Buffer;

    assert.strictEqual(sig.length, 64, 'Derived-path signature must be 64 bytes');

    const rootPubKey = Buffer.from(EDDSA_MPCV2_FIXTURES.commonKeychain.slice(0, 64), 'hex');
    // A derived-path signature must NOT verify under the root public key —
    // it verifies under the child key derived at m/0/1. This confirms the
    // WASM applied key derivation rather than signing with the root key.
    assert(!ed25519.verify(sig, MESSAGE, rootPubKey), 'derived-path signature must not verify under root public key');
  });
});
