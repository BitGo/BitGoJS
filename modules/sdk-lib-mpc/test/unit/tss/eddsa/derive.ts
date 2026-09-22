import assert from 'assert';
import { ed25519 } from '@noble/curves/ed25519';
import { MpsDerive, EddsaMPSDsg, MPSTypes, MPSUtil, MpsVrfUtils } from '../../../../src/tss';

const MESSAGE = Buffer.from('EdDSA hardened child signing');

describe('EdDSA MPS hardened derivation', function () {
  let signingShares: Buffer[];
  let vrfShares: Buffer[];
  let rootCommonKeychain: string;

  before(async function () {
    const signing = await MPSUtil.generateEdDsaDKGKeyShares();
    const vrf = await MpsVrfUtils.generateVrfDKGKeyShares();
    signingShares = signing.map((party) => party.getKeyShare());
    vrfShares = vrf.map((party) => party.getKeyShare());
    rootCommonKeychain = signing[0].getCommonKeychain();
  });

  async function beginPair(
    firstIdx: number,
    secondIdx: number,
    path: string
  ): Promise<{
    first: MpsDerive.Derive;
    second: MpsDerive.Derive;
    firstRound0: MPSTypes.DeserializedMessage;
    secondRound0: MPSTypes.DeserializedMessage;
  }> {
    const first = new MpsDerive.Derive(3, 2, firstIdx, signingShares[firstIdx], vrfShares[firstIdx], path);
    const second = new MpsDerive.Derive(3, 2, secondIdx, signingShares[secondIdx], vrfShares[secondIdx], path);
    const firstRound0 = await first.initDerive();
    const secondRound0 = await second.initDerive();
    return { first, second, firstRound0, secondRound0 };
  }

  function completePair(
    first: MpsDerive.Derive,
    second: MpsDerive.Derive,
    firstRound0: MPSTypes.DeserializedMessage,
    secondRound0: MPSTypes.DeserializedMessage
  ): void {
    const [firstRound1] = first.handleIncomingMessages([secondRound0]);
    const [secondRound1] = second.handleIncomingMessages([firstRound0]);
    assert.strictEqual(firstRound1.from, firstRound0.from);
    assert.strictEqual(secondRound1.from, secondRound0.from);
    assert.ok(firstRound1.payload.length > 0);
    assert.ok(secondRound1.payload.length > 0);
    assert.deepStrictEqual(first.handleIncomingMessages([secondRound1]), []);
    assert.deepStrictEqual(second.handleIncomingMessages([firstRound1]), []);
  }

  it('agrees on a child key via user/BitGo and user/backup and signs with the child share only', async function () {
    const userBitgo = await beginPair(0, 2, "m/0'");
    assert.throws(() => userBitgo.first.getKeyShare(), /not complete/);
    assert.throws(() => userBitgo.first.getCommonKeychain(), /not complete/);
    assert.throws(() => userBitgo.first.getReducedKeyShare(), /not complete/);
    completePair(userBitgo.first, userBitgo.second, userBitgo.firstRound0, userBitgo.secondRound0);

    const userBackup = await beginPair(0, 1, "m/0'");
    completePair(userBackup.first, userBackup.second, userBackup.firstRound0, userBackup.secondRound0);

    const childKeychain = userBitgo.first.getCommonKeychain();
    assert.strictEqual(childKeychain.length, 128);
    assert.notStrictEqual(childKeychain, rootCommonKeychain);
    assert.strictEqual(userBitgo.second.getCommonKeychain(), childKeychain);
    assert.strictEqual(userBackup.first.getCommonKeychain(), childKeychain);
    assert.strictEqual(userBackup.second.getCommonKeychain(), childKeychain);
    assert.notDeepStrictEqual(userBitgo.first.getKeyShare(), userBitgo.second.getKeyShare());

    const reduced = userBitgo.first.getReducedKeyShare();
    const decoded = MPSTypes.getDecodedReducedKeyShare(reduced);
    assert.deepStrictEqual(Object.keys(decoded).sort(), ['keyShare', 'pub', 'rootChainCode']);
    assert.deepStrictEqual(Buffer.from(decoded.keyShare), userBitgo.first.getKeyShare());
    assert.strictEqual(Buffer.from(decoded.pub).toString('hex'), childKeychain.slice(0, 64));
    assert.strictEqual(Buffer.from(decoded.rootChainCode).toString('hex'), childKeychain.slice(64));
    assert.notDeepStrictEqual(Buffer.from(decoded.keyShare), vrfShares[0]);

    const signature = await MPSUtil.executeTillRound(
      3,
      new EddsaMPSDsg.DSG(0),
      new EddsaMPSDsg.DSG(2),
      userBitgo.first.getKeyShare(),
      userBitgo.second.getKeyShare(),
      MESSAGE,
      'm'
    );
    assert.ok(Buffer.isBuffer(signature));
    assert.ok(ed25519.verify(signature, MESSAGE, Buffer.from(childKeychain.slice(0, 64), 'hex')));
  });

  it('rejects invalid sessions, duplicate and changed peers without advancing rounds', async function () {
    const invalidPath = new MpsDerive.Derive(3, 2, 0, signingShares[0], vrfShares[0], 'm/0');
    await assert.rejects(invalidPath.initDerive(), /hardened derivation path/);
    const invalidParty = new MpsDerive.Derive(3, 2, 3, signingShares[0], vrfShares[0], "m/0'");
    await assert.rejects(invalidParty.initDerive(), /Invalid parameters/);

    const pair = await beginPair(0, 2, "m/1'");
    const backup = new MpsDerive.Derive(3, 2, 1, signingShares[1], vrfShares[1], "m/1'");
    const backupRound0 = await backup.initDerive();
    await assert.rejects(pair.first.initDerive(), /already initialized/);
    assert.throws(() => pair.first.handleIncomingMessages([]), /exactly one peer/);
    assert.throws(() => pair.first.handleIncomingMessages([pair.secondRound0, pair.secondRound0]), /exactly one peer/);
    assert.throws(() => pair.first.handleIncomingMessages([pair.firstRound0]), /Invalid derivation peer/);
    assert.throws(
      () => pair.first.handleIncomingMessages([{ from: 9, payload: backupRound0.payload }]),
      /Invalid derivation peer/
    );
    assert.throws(
      () => pair.first.handleIncomingMessages([{ from: 2, payload: new Uint8Array() }]),
      /Invalid derivation peer/
    );

    const [firstRound1] = pair.first.handleIncomingMessages([pair.secondRound0]);
    const [secondRound1] = pair.second.handleIncomingMessages([pair.firstRound0]);
    assert.throws(
      () => pair.first.handleIncomingMessages([{ from: 1, payload: secondRound1.payload }]),
      /Invalid derivation peer/
    );
    assert.throws(() => pair.first.handleIncomingMessages([pair.secondRound0]));
    assert.deepStrictEqual(pair.first.handleIncomingMessages([secondRound1]), []);
    assert.deepStrictEqual(pair.second.handleIncomingMessages([firstRound1]), []);
    assert.throws(() => pair.first.handleIncomingMessages([secondRound1]), /not awaiting/);
    assert.throws(() => pair.first.handleIncomingMessages([backupRound0]), /not awaiting/);
  });
});
