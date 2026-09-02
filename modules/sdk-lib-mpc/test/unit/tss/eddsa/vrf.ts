import assert from 'assert';
import crypto from 'crypto';
import { isLeft } from 'fp-ts/Either';
import * as t from 'io-ts';
import { generateEdDsaDKGKeyShares } from './util';

const otherIndices: ReadonlyArray<ReadonlyArray<number>> = [
  [1, 2],
  [0, 2],
  [0, 1],
];

const Uint8ArrayCodec = new t.Type<Uint8Array, Uint8Array, unknown>(
  'Uint8Array',
  (u): u is Uint8Array => u instanceof Uint8Array,
  (u, c) => (u instanceof Uint8Array ? t.success(u) : t.failure(u, c)),
  t.identity
);

/** wasm-mps round1 VRF messages are a party-id → bytes map. */
const VrfDkgRound1Msg = t.record(t.string, Uint8ArrayCodec);

function vrfRound1MsgForParty(msg: unknown, partyId: number): Uint8Array {
  const decoded = VrfDkgRound1Msg.decode(msg);
  if (isLeft(decoded)) {
    throw new Error('VRF DKG round1 message is not a party-id map of byte arrays');
  }
  const bytes = decoded.right[String(partyId)];
  if (bytes === undefined) {
    throw new Error(`VRF DKG round1 message missing party ${partyId}`);
  }
  return bytes;
}

describe('EdDSA MPS VRF DKG and hard derive (@bitgo/wasm-mps)', function () {
  it('completes a 2-of-3 VRF DKG and a 2-party hard derive', async function () {
    const mps = await import('@bitgo/wasm-mps');
    const [user, backup, bitgo] = await generateEdDsaDKGKeyShares();
    const rootShares = [user.getKeyShare(), backup.getKeyShare(), bitgo.getKeyShare()];

    const vrfRound0 = [0, 1, 2].map((i) => mps.ed25519_vrf_dkg_round0_process(i, crypto.randomBytes(32)));
    const vrfRound1 = [0, 1, 2].map((i) =>
      mps.ed25519_vrf_dkg_round1_process(
        otherIndices[i].map((j) => vrfRound0[j].msg),
        vrfRound0[i].state
      )
    );
    const vrfShares = [0, 1, 2].map((i) =>
      mps.ed25519_vrf_dkg_round2_process(
        otherIndices[i].map((j) => vrfRound1MsgForParty(vrfRound1[j].msg, i)),
        vrfRound1[i].state
      )
    );
    for (const share of vrfShares) {
      assert.ok(share.share.length > 0);
    }

    const path = "m/0'";
    const deriveRound0 = [0, 2].map((i) =>
      mps.ed25519_hard_derive_round0_process(vrfShares[i].share, rootShares[i], path)
    );
    const deriveRound1 = [0, 1].map((i) =>
      mps.ed25519_hard_derive_round1_process(deriveRound0[1 - i].msg, deriveRound0[i].state)
    );
    const derived = [0, 1].map((i) =>
      mps.ed25519_hard_derive_round2_process(deriveRound1[1 - i].msg, deriveRound1[i].state)
    );

    const backupDeriveRound0 = [0, 1].map((i) =>
      mps.ed25519_hard_derive_round0_process(vrfShares[i].share, rootShares[i], path)
    );
    const backupDeriveRound1 = [0, 1].map((i) =>
      mps.ed25519_hard_derive_round1_process(backupDeriveRound0[1 - i].msg, backupDeriveRound0[i].state)
    );
    const backupDerived = [0, 1].map((i) =>
      mps.ed25519_hard_derive_round2_process(backupDeriveRound1[1 - i].msg, backupDeriveRound1[i].state)
    );

    assert.deepStrictEqual(derived[0].pk, derived[1].pk);
    assert.deepStrictEqual(derived[0].chaincode, derived[1].chaincode);
    assert.notDeepStrictEqual(Buffer.from(derived[0].pk), user.getSharePublicKey());
    assert.deepStrictEqual(backupDerived[0].pk, derived[0].pk);
    assert.deepStrictEqual(backupDerived[0].chaincode, derived[0].chaincode);
  });
});
