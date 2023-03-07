import { Ecdsa, ECDSA, rangeProof } from '@bitgo/sdk-core';
import * as sinon from 'sinon';
import createKeccakHash from 'keccak';
import * as paillierBigint from 'paillier-bigint';
import {
  ntildes,
  paillerKeys,
  mockNShares,
  mockPShare,
  mockDKeyShare,
  mockEKeyShare,
  mockFKeyShare,
} from '../fixtures/ecdsa';
import { Hash, randomBytes } from 'crypto';
import { FeeMarketEIP1559Transaction } from '@ethereumjs/tx';
import { addHexPrefix, BN } from 'ethereumjs-util';
import { KeyPair } from '@bitgo/sdk-coin-eth';
import Common from '@ethereumjs/common';
/**
 * @prettier
 */

describe('TSS ECDSA TESTS', function () {
  const MPC = new Ecdsa();
  const base = BigInt('0x010000000000000000000000000000000000000000000000000000000000000000'); // 2^256
  let keyShares: ECDSA.KeyCombined[];
  let commonPublicKey: string;
  const seed = Buffer.from(
    'c4d1583a0b7b88626b56f0c83ee6df4d95d99cca73893ffb57c5e4411fa1b2b9c87456080e8d3f03462f065688abc28be2d4af3164d593c50b55269b435ea48d',
    'hex',
  );
  let A: ECDSA.KeyShare, B: ECDSA.KeyShare, C: ECDSA.KeyShare;
  before(async () => {
    const pallierMock = sinon
      .stub(paillierBigint, 'generateRandomKeys')
      .onCall(0)
      .resolves(paillerKeys[0] as unknown as paillierBigint.KeyPair)
      .onCall(1)
      .resolves(paillerKeys[1] as unknown as paillierBigint.KeyPair)
      .onCall(2)
      .resolves(paillerKeys[2] as unknown as paillierBigint.KeyPair)
      .onCall(3)
      .resolves(paillerKeys[0] as unknown as paillierBigint.KeyPair)
      .onCall(4)
      .resolves(paillerKeys[1] as unknown as paillierBigint.KeyPair)
      .onCall(5)
      .resolves(paillerKeys[2] as unknown as paillierBigint.KeyPair);
    [A, B, C] = await Promise.all([MPC.keyShare(1, 2, 3), MPC.keyShare(2, 2, 3), MPC.keyShare(3, 2, 3)]);

    // Needs to run this serially for testing deterministic key generation
    // to get specific pallier keys to be assigned
    const D = await MPC.keyShare(1, 2, 3, seed);
    const E = await MPC.keyShare(2, 2, 3, seed);
    const F = await MPC.keyShare(3, 2, 3, seed);

    const aKeyCombine = MPC.keyCombine(A.pShare, [B.nShares[1], C.nShares[1]]);
    const bKeyCombine = MPC.keyCombine(B.pShare, [A.nShares[2], C.nShares[2]]);
    const cKeyCombine = MPC.keyCombine(C.pShare, [A.nShares[3], B.nShares[3]]);

    // Shares with specific seeds
    const dKeyCombine = MPC.keyCombine(D.pShare, [E.nShares[1], F.nShares[1]]);
    const eKeyCombine = MPC.keyCombine(E.pShare, [D.nShares[2], F.nShares[2]]);
    const fKeyCombine = MPC.keyCombine(F.pShare, [D.nShares[3], E.nShares[3]]);

    // Shares for derived keys.
    const path = 'm/0/1';
    const aKeyDerive = MPC.keyDerive(A.pShare, [B.nShares[1], C.nShares[1]], path);
    const gKeyCombine: ECDSA.KeyCombined = {
      xShare: aKeyDerive.xShare,
      yShares: aKeyCombine.yShares,
    };
    const hKeyCombine = MPC.keyCombine(B.pShare, [aKeyDerive.nShares[2], C.nShares[2]]);
    keyShares = [
      aKeyCombine,
      bKeyCombine,
      cKeyCombine,
      dKeyCombine,
      eKeyCombine,
      fKeyCombine,
      gKeyCombine,
      hKeyCombine,
    ];
    commonPublicKey = aKeyCombine.xShare.y;
    pallierMock.reset();
    pallierMock.restore();
  });

  describe('Ecdsa Key Generation Test', function () {
    it('should generate keys with correct threshold and share number', async function () {
      for (let index = 0; index < 3; index++) {
        const participantOne = (index % 3) + 1;
        const participantTwo = ((index + 1) % 3) + 1;
        const participantThree = ((index + 2) % 3) + 1;
        keyShares[index].xShare.i.should.equal(participantOne);
        keyShares[index].xShare.y.should.equal(commonPublicKey);
        keyShares[index].xShare.m.should.not.be.Null;
        keyShares[index].xShare.l.should.not.be.Null;
        keyShares[index].xShare.n.should.not.be.Null;

        const chaincode = BigInt('0x' + keyShares[index].xShare.chaincode);
        const isChainCodeValid = chaincode > BigInt(0) && chaincode <= base;
        isChainCodeValid.should.equal(true);

        keyShares[index].yShares[participantTwo].i.should.equal(participantOne);
        keyShares[index].yShares[participantThree].i.should.equal(participantOne);
        keyShares[index].yShares[participantTwo].j.should.equal(participantTwo);
        keyShares[index].yShares[participantThree].j.should.equal(participantThree);
        keyShares[index].yShares[participantTwo].n.should.not.be.Null;
        keyShares[index].yShares[participantThree].n.should.not.be.Null;

        const publicKeyPrefix = keyShares[index].xShare.y.slice(0, 2);
        const isRightPrefix = publicKeyPrefix === '03' || publicKeyPrefix === '02';
        isRightPrefix.should.equal(true);
      }
    });

    it('should generate keyshares with specific seed', async function () {
      // Keys should be deterministic when using seed
      const [, , , D, E, F] = keyShares;
      mockDKeyShare.should.deepEqual(D);
      mockEKeyShare.should.deepEqual(E);
      mockFKeyShare.should.deepEqual(F);
    });

    it('should fail if seed is length less than 64 bytes', async function () {
      await MPC.keyShare(1, 2, 3, randomBytes(16)).should.be.rejectedWith(
        'Seed must have a length of at least 64 bytes',
      );
      await MPC.keyShare(1, 2, 3, randomBytes(32)).should.be.rejectedWith(
        'Seed must have a length of at least 64 bytes',
      );
    });

    it('should pass if seed length is greater than 64', async function () {
      const paillierMock = sinon
        .stub(paillierBigint, 'generateRandomKeys')
        .onCall(0)
        .resolves(paillerKeys[0] as unknown as paillierBigint.KeyPair);
      const seed72Bytes = Buffer.from(
        '4f7e914dc9ec696398675d1544aab61cb7a67662ffcbdb4079ec5d682be565d87c1b2de75c943dec14c96586984860268779498e6732473aed9ed9c2538f50bea0af926bdccc0134',
        'hex',
      );
      (await MPC.keyShare(1, 2, 3, seed72Bytes)).pShare.u.length.should.equal(64);
      paillierMock.restore();
    });

    it('should calculate correct chaincode while combining', async function () {
      const keyCombine = MPC.keyCombine(mockPShare, mockNShares);
      keyCombine.xShare.chaincode.should.equal('fffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc32');
    });

    it('should fail to generate keys with invalid threshold and share number', async function () {
      const invalidConfigs = [
        { index: 1, threshold: 5, numShares: 3 },
        { index: -1, threshold: 2, numShares: 3 },
        { index: 1, threshold: 2, numShares: 1 },
      ];
      for (let index = 0; index < invalidConfigs.length; index++) {
        try {
          await MPC.keyShare(
            invalidConfigs[index].index,
            invalidConfigs[index].threshold,
            invalidConfigs[index].numShares,
          );
        } catch (e) {
          e.should.equal('Invalid KeyShare Config');
        }
      }
    });

    it('should derive unhardened child keys', async function () {
      // parent key
      const aKeyCombine = keyShares[0];
      const commonKeychain = aKeyCombine.xShare.y + aKeyCombine.xShare.chaincode;

      for (let index = 0; index < 10; index++) {
        const path = `m/0/0/${index}`;

        const subkey = MPC.keyDerive(A.pShare, [B.nShares[1], C.nShares[1]], path);

        const derive1: string = MPC.deriveUnhardened(commonKeychain, path);
        const derive2: string = MPC.deriveUnhardened(commonKeychain, path);

        derive1.should.equal(derive2, 'derivation should be deterministic');

        (subkey.xShare.y + subkey.xShare.chaincode).should.equal(
          derive1,
          'subkey common keychain should match derived keychain',
        );
      }
    });
  });

  describe('ECDSA Signing', async function () {
    let config: { signerOne: ECDSA.KeyCombined; signerTwo: ECDSA.KeyCombined; hash?: string; shouldHash?: boolean }[];
    let ntildeMock;

    before(() => {
      const [A, B, C, D, E, F, G, H] = keyShares;

      config = [
        { signerOne: A, signerTwo: B },
        { signerOne: B, signerTwo: C },
        { signerOne: C, signerTwo: A },

        // Checks signing with specific seed
        { signerOne: D, signerTwo: E },
        { signerOne: E, signerTwo: F },
        { signerOne: F, signerTwo: D },

        // Checks with specific hashing algorithm
        { signerOne: A, signerTwo: B, hash: 'keccak256' },

        // checks with no hashing
        { signerOne: A, signerTwo: B, shouldHash: false },

        // Checks with derived subkey
        { signerOne: G, signerTwo: H },
      ];

      ntildeMock = sinon.stub(rangeProof, 'generateNTilde');
      for (let i = 0; i < ntildes.length; i++) {
        ntildeMock.onCall(i).resolves(ntildes[i] as unknown as ECDSA.NTilde);
      }
    });

    after(() => {
      ntildeMock.reset();
    });

    for (let index = 0; index < 9; index++) {
      it(`should properly sign the message case ${index}`, async function () {
        // Step One
        // signerOne, signerTwo have decided to sign the message
        // const signerOne = config[index].signerOne;
        // const signerOneIndex = config[index].signerOne.xShare.i;
        // const signerTwo = config[index].signerTwo;

        const userKeys = {
          pShare: {
            i: 1,
            t: 2,
            c: 3,
            l: 'c33e2cebfa674750c3f3bc5e09a3009f9a80ef0d144b2667064bf106c930df88193d3ba2e47e66d36cc9cbb0fc00753646620f332da5592ab5d32b0d0396375f792658fb4358997ea64e07a5aec7db231577b6678047c8f37bf5b5152a3b8c59800b6336860d622f327c04ac36967a58918116c631934f55073f18d22121187c8f626ec83f65057da509aefa6ea85c22557dc39abdc51d5b5f7669cdfff0298be0dc48bf2e86e6bf058ec218797e710143e4a711803e406c97a0b569ed07e86646a5ef0c8a1d48d714048df4be61bd578bc75572e10635afe9fce8c63c9f2f240279cb82e1bb225de3e25e83822e178324bc1dcd9fe83ed3d8b6f9ab2e898e556ccc1657755bddca9aae731224d4ecd0ece64e7a7cb55d43a32ae8d296105ac30ddbc1a35e6ba5eb76308a489b720bc17e94c45dc3c14293085f215a1c740da8ded6a47c4c40a36c0cc8fc9be9676cd23c28253d3d0aed77fe1425e05ece1e5b6cd52ec07d5f83d054464e8ba89ec2a254eb372bedf3b2e470f2aaf196767400',
            m: '571993803c1f584984c9706450832faaae688cbdb1761e8d219b08f4306c5051db4ee2d214f61f01a6b2d1ff96ba68134a6bf7d288450641b0a2a9a77936874f6e8b145fdee0707dd67b39b65ad9ecd0cbb8cfbc42575a9206b1f37836daaad729fb22834788f572d8629ac5695a44679c93638a87b2e527f03aca2e91d7a8eb1bf36eb9b65096d26088ed72199071d215b5c70d4915c3f75ac9b4ef544546479b30dd638be604fe1c11acede2f410d310ed90e4f9eb00b2cc142f14216616f0228d5fec6045d606ae58ee4b2d3c4ba05dc95251b21c78d41ccc8f1c99136cdcf765af8cd5b49822319f0b2b76774b2d7634a27619210fd7f17be9903f08404ee1f99d12f4c1c3a4315c0d3019b405b57265a6769cae9340536dc61c5c0dd41b1b8d582ee4c835bcbb21dc6056957cbcb05086a36f27e66cfdc4546638dbddd7cf485582c7939bda6d5a936b1d849944f665c8389192306bef4da14b71af067ed9bc9f8dce64731de4283ced01bcf58c540d9a8af7274d4ac05536301fd202c1',
            n: 'c33e2cebfa674750c3f3bc5e09a3009f9a80ef0d144b2667064bf106c930df88193d3ba2e47e66d36cc9cbb0fc00753646620f332da5592ab5d32b0d0396375f792658fb4358997ea64e07a5aec7db231577b6678047c8f37bf5b5152a3b8c59800b6336860d622f327c04ac36967a58918116c631934f55073f18d22121187c8f626ec83f65057da509aefa6ea85c22557dc39abdc51d5b5f7669cdfff0298be0dc48bf2e86e6bf058ec218797e710143e4a711803e406c97a0b569ed07e8680ca602b44d7e7334f7d79316626fdcced37479a9b7313d594f7766eb8b2284e942518e0a8296f1a067b3a237280c29460a523bde56730904289d07400228e0cf37b6de374073e09a35248c9465f6411acbcc5e8d3ddd5b7aa1a185e9d0146f1bd4989056b8dae8b505228dcc8f1d65a196ff2f42760897a11a714c5004309bbe5d1eec1591370d89b2fd69b8c4add0d510d7c0e9ed12cbfa3a243ef83a3363d7ac6f7b8e81f2629e2af01de444649358311c12848a9fb1a6d61d219f5054c8b9',
            y: '034c12bd8f34498cffb8b7ed9ce6b435103cfe066b6fb78509aa648d00288b2fad',
            u: 'ce673bf7da19bd7f1dc5cac34901cbb403408d6d194b5b9d02975e6648f55cf7',
            uu: '36546727313003311846047669061032159759702783041961990758006700877653986330527',
            chaincode: 'f7f4d100148d9f9c3f879e34938d199e3b6f57b688878dfb6fd3580028845d49',
          },
          bitgoNShare: {
            i: 1,
            j: 3,
            y: '03bfa15f6311d8238c55f96f4c0c95d1f9cf15f783759e633625f0d807a688c374',
            u: '6e954a0c4c0a15099bb119d5033a1c60571be1f36fdaefff9e6d0f46f233c88d',
            chaincode: '787844884a8b2d929d343d06e63c5ff4b262d90d7c2f16c7d61403c7459ab126',
            v: '02ce14bf6cf6b348ee1b8bb221966891de305fcfa96cba9a6daef4b5ae0aa38839',
            n: '',
          },
          backupNShare: {
            i: 1,
            j: 2,
            n: 'f1aefcfb50c749a9559449160bc3197626d2b422b89c885b727ed0b3cf3cef726e9c9a4ed0ef9c7021fe6aa1fe5f6118cac8d12619bb8d3a299a2fc6939a6f880d6d0a3ed095fe2db614117216962ad7487ab3b1558d7b5f5814989e913399cc3ca4ba961336464427575bb5113d5da81cfd5cd89c9ca37a5f7a6d8ccb545e5b3cda575a162220fbee6779379540ff6f9123480e25c1361e78aafc65a29fa4f00321aa2a00e8e8bfa2cb91c234a9d8cebea6be2b5d3208be90e9e0651f9afa0883b21f8a7794057a587da6ff26629bc7b7716a2d55732d9425a07716c9af4e7baca16673e9803b13e01b35360c91f4aef254adf2c9cb8af8fc887649a11eb9fd47ed5edbfe3d9b088008f6b50980a0b28191f845893038c277757312d633e245e7cde53ec6d4fa5b65ca40bb3388eda5fdf2d5c0bb7a7c6979c1a95f5c4fec67abeaf8a9a7c9be56d9921a2b9143f5450638e159cfa51c380ba056363b20ef58eb913b8562a555012a1964453c86f6f6913f4a9582564e85fb4c3b762fd92855',
            y: '02f571d1c792031aefa005d2e1bf8f88a30d6e9c84ba1260b8210de881b02b8ba3',
            u: '6f74d622b83a9870c6e4981b7747dea0c317d13a4fe09292823ffbbea4448e6c',
            chaincode: 'f28c1164f1f401c22e72a5e20368e6e11b2d749d38090a7621c69c6b31adb372',
            v: '03b7c6ac7db8df378267eb6bc8b4381c5234f105fc0dc158628f04a6f272e59a01',
          },
        };

        const backupKeys = {
          pShare: {
            i: 2,
            t: 2,
            c: 3,
            l: 'f1aefcfb50c749a9559449160bc3197626d2b422b89c885b727ed0b3cf3cef726e9c9a4ed0ef9c7021fe6aa1fe5f6118cac8d12619bb8d3a299a2fc6939a6f880d6d0a3ed095fe2db614117216962ad7487ab3b1558d7b5f5814989e913399cc3ca4ba961336464427575bb5113d5da81cfd5cd89c9ca37a5f7a6d8ccb545e5b3cda575a162220fbee6779379540ff6f9123480e25c1361e78aafc65a29fa4f00321aa2a00e8e8bfa2cb91c234a9d8cebea6be2b5d3208be90e9e0651f9afa0650de7e2d6b561d84bd3edbb0ebb72c378397427f21848fb263c49b8c68c76539835e9ed61026620fec66d22873ec26da57bff63a94f559dca3f16d9006045daf6a889816361c8b0316089bdc38831a53c3cbc410d34405eda2d4719aa01b975aede398bfae19e19822f85c33c79175e75b4b96bca34e589abff61d654f235a38ac70c4dfdec2d466fcd1519dba85a0b8970c6771f01796e4226357c051ae5317f0a1569099add70786b54f8ce9f4e83a1e97b39affaa300b193a5465750bc08c',
            m: '220e57b2667d25a2104236ac3c2e9dc2541ac0a79beb4f216f6010489544a7877b4c63a68082ea71e44b1116562b191fa9d0549a9ab11f225b8568d532736c64ebe8deeeacf1898dec2a331612968d14646ad2f4a7f618a169f03d742ec5f042d5966e78f358eb37b9d7886c036eee0bbd40bbc6dbec05d05e4a898a3caf6a93be93c4535e12c48a4a7b849e8bf50f1852d0adb6a4b86319191a6e612ad8993b67dfc1c5e1d4be82f03827ade9fcd000cd369124e19fb74af646d80aa053054db81fa86283f73a4ef47bf823e69c7cf526340490732df24ed7f46f836b76ab294ebe949c8029ce2aad9f20c86e65cc19255e5f6ec750ead56bb663783801b716e34df40106c6cac8a0e8b2fed32002f40a65068880b57c32599c4133697ac64de81afbe17eaf2cd4eb3f7529bc77bd708d4b6d5151b604b74cb4bd0cae05bfa37b297cbd343a3acad1af440ae96c22e0bdd2e7fb7feeb3c4ad46a236c19e3dcca58f673c06deebc37a7980f767844d030b6f23d21a915f9cc43e16a899054917',
            n: 'f1aefcfb50c749a9559449160bc3197626d2b422b89c885b727ed0b3cf3cef726e9c9a4ed0ef9c7021fe6aa1fe5f6118cac8d12619bb8d3a299a2fc6939a6f880d6d0a3ed095fe2db614117216962ad7487ab3b1558d7b5f5814989e913399cc3ca4ba961336464427575bb5113d5da81cfd5cd89c9ca37a5f7a6d8ccb545e5b3cda575a162220fbee6779379540ff6f9123480e25c1361e78aafc65a29fa4f00321aa2a00e8e8bfa2cb91c234a9d8cebea6be2b5d3208be90e9e0651f9afa0883b21f8a7794057a587da6ff26629bc7b7716a2d55732d9425a07716c9af4e7baca16673e9803b13e01b35360c91f4aef254adf2c9cb8af8fc887649a11eb9fd47ed5edbfe3d9b088008f6b50980a0b28191f845893038c277757312d633e245e7cde53ec6d4fa5b65ca40bb3388eda5fdf2d5c0bb7a7c6979c1a95f5c4fec67abeaf8a9a7c9be56d9921a2b9143f5450638e159cfa51c380ba056363b20ef58eb913b8562a555012a1964453c86f6f6913f4a9582564e85fb4c3b762fd92855',
            y: '02f571d1c792031aefa005d2e1bf8f88a30d6e9c84ba1260b8210de881b02b8ba3',
            u: 'b1a05e5c9ab58566b362762effdd4935c9c1eb6ef2004790319a0ed303cb7d84',
            uu: '20483595733662505710801164832811594846210964797148111386062700560971307261780',
            chaincode: 'f28c1164f1f401c22e72a5e20368e6e11b2d749d38090a7621c69c6b31adb372',
          },
          bitgoNShare: {
            i: 2,
            j: 3,
            y: '03bfa15f6311d8238c55f96f4c0c95d1f9cf15f783759e633625f0d807a688c374',
            u: '8d3b0d6e9943dae5c516d0b7c9c4dd5d8aa2c6c2f163356198d14676fc36badf',
            chaincode: '787844884a8b2d929d343d06e63c5ff4b262d90d7c2f16c7d61403c7459ab126',
            v: '02ce14bf6cf6b348ee1b8bb221966891de305fcfa96cba9a6daef4b5ae0aa38839',
            n: '',
          },
          userNShare: {
            i: 2,
            j: 1,
            n: 'c33e2cebfa674750c3f3bc5e09a3009f9a80ef0d144b2667064bf106c930df88193d3ba2e47e66d36cc9cbb0fc00753646620f332da5592ab5d32b0d0396375f792658fb4358997ea64e07a5aec7db231577b6678047c8f37bf5b5152a3b8c59800b6336860d622f327c04ac36967a58918116c631934f55073f18d22121187c8f626ec83f65057da509aefa6ea85c22557dc39abdc51d5b5f7669cdfff0298be0dc48bf2e86e6bf058ec218797e710143e4a711803e406c97a0b569ed07e8680ca602b44d7e7334f7d79316626fdcced37479a9b7313d594f7766eb8b2284e942518e0a8296f1a067b3a237280c29460a523bde56730904289d07400228e0cf37b6de374073e09a35248c9465f6411acbcc5e8d3ddd5b7aa1a185e9d0146f1bd4989056b8dae8b505228dcc8f1d65a196ff2f42760897a11a714c5004309bbe5d1eec1591370d89b2fd69b8c4add0d510d7c0e9ed12cbfa3a243ef83a3363d7ac6f7b8e81f2629e2af01de444649358311c12848a9fb1a6d61d219f5054c8b9',
            y: '034c12bd8f34498cffb8b7ed9ce6b435103cfe066b6fb78509aa648d00288b2fad',
            u: '4c01c0fe55c4a6d75c927e3409e5e3a6d2fd547576939b9bbea8d89394bf310e',
            chaincode: 'f7f4d100148d9f9c3f879e34938d199e3b6f57b688878dfb6fd3580028845d49',
            v: '038a25ee7e034d306d8af42e13fed0c6586a5ffd1b4911b034bd9b451056d8b817',
          },
        };

        const signerOneDerive = MPC.keyDerive(userKeys.pShare, [userKeys.backupNShare, userKeys.bitgoNShare], '');
        const signerTwoDerive = MPC.keyDerive(backupKeys.pShare, [backupKeys.userNShare, backupKeys.bitgoNShare], '');
        console.log(`signerOneDerive:\n ${JSON.stringify(signerOneDerive)}`);
        console.log(`signerTwoDerive:\n ${JSON.stringify(signerTwoDerive)}`);

        const userYShare = {
          i: 1,
          j: 2,
          n: signerOneDerive.nShares[2].n,
        };

        const backupYShare = {
          i: 2,
          j: 1,
          n: signerTwoDerive.nShares[1].n,
        };

        const signerOneIndex = 1;
        const signerOneWithChallenge = await MPC.signChallenge(signerOneDerive.xShare, userYShare);
        const signerTwoWithChallenge = await MPC.signChallenge(signerTwoDerive.xShare, backupYShare);

        console.log(`signerOneWithChallenge:\n${JSON.stringify(signerOneWithChallenge)}`);
        console.log(`signerTwoWithChallenge:\n${JSON.stringify(signerTwoWithChallenge)}`);

        // Step Two
        // Second signer generates their range proof challenge.
        // const signerTwoWithChallenge: ECDSA.KeyCombinedWithNTilde = await MPC.signChallenge(
        //   signerTwo.xShare,
        //   // signerTwo.yShares[signerOneIndex],
        //
        // );

        // Step Three
        // Sign Shares are created by one of the participants (signerOne)
        // with its private XShare and YShare corresponding to the other participant (signerTwo)
        // This step produces a private WShare which signerOne saves and KShare which signerOne sends to signerTwo
        const signShares: ECDSA.SignShareRT = await MPC.signShare(
          signerOneWithChallenge.xShare,
          signerTwoWithChallenge.yShares[signerOneIndex],
        );

        // Step Four
        // signerTwo receives the KShare from signerOne and uses it produce private
        // BShare (Beta Share) which signerTwo saves and AShare (Alpha Share)
        // which is sent to signerOne
        let signConvertS21: ECDSA.SignConvertRT = await MPC.signConvert({
          xShare: signerTwoWithChallenge.xShare,
          // yShare: signerTwo.yShares[signerOneIndex], // YShare corresponding to the other participant signerOne
          yShare: {
            i: 2,
            j: 1,
            n: signerOneDerive.nShares[2].n,
          },
          kShare: signShares.kShare,
        });

        // Step Five
        // signerOne receives the AShare from signerTwo and signerOne using the private WShare from step two
        // uses it produce private GShare (Gamma Share) and MUShare (Mu Share) which
        // is sent to signerTwo to produce its Gamma Share
        const signConvertS12: ECDSA.SignConvertRT = await MPC.signConvert({
          aShare: signConvertS21.aShare,
          wShare: signShares.wShare,
        });

        // Step Six
        // signerTwo receives the MUShare from signerOne and signerOne using the private BShare from step three
        // uses it produce private GShare (Gamma Share)
        signConvertS21 = await MPC.signConvert({
          muShare: signConvertS12.muShare,
          bShare: signConvertS21.bShare,
        });

        // Step Seven
        // signerOne and signerTwo both have successfully generated GShares and they use
        // the sign combine function to generate their private omicron shares and
        // delta shares which they share to each other

        const [signCombineOne, signCombineTwo] = [
          MPC.signCombine({
            gShare: signConvertS12.gShare as ECDSA.GShare,
            signIndex: {
              i: (signConvertS12.muShare as ECDSA.MUShare).i,
              j: (signConvertS12.muShare as ECDSA.MUShare).j,
            },
          }),
          MPC.signCombine({
            gShare: signConvertS21.gShare as ECDSA.GShare,
            signIndex: {
              i: (signConvertS21.muShare as ECDSA.MUShare).i,
              j: (signConvertS21.muShare as ECDSA.MUShare).j,
            },
          }),
        ];

        const tx = FeeMarketEIP1559Transaction.fromSerializedTx(
          Buffer.from(
            '02f1050a8501bdd196ff8501bdd196ff82520894ff07a12ee165f0fac3048adb409ab314fcfb142c85e8d4a5100680c0808080',
            'hex',
          ),
        );
        const MESSAGE = tx.getMessageToSign(false);

        console.log(`initial tx: ${JSON.stringify(tx)}`);


        // Step Eight
        // signerOne and signerTwo shares the delta share from each other
        // and finally signs the message using their private OShare
        // and delta share received from the other signer

        const hashGenerator = (hashType?: string): Hash | undefined => {
          return hashType === 'keccak256' ? createKeccakHash('keccak256') : undefined;
        };
        const [signA, signB] = [
          MPC.sign(MESSAGE, signCombineOne.oShare, signCombineTwo.dShare, hashGenerator('keccack256'), true),
          MPC.sign(MESSAGE, signCombineTwo.oShare, signCombineOne.dShare, hashGenerator('keccack256'), true),
        ];

        // Step Nine
        // Construct the final signature

        const signature = MPC.constructSignature([signA, signB]);

        // Step Ten
        // Verify signature

        const isValid = MPC.verify(MESSAGE, signature, hashGenerator('keccack256'), true);
        console.log(`Signature was valid: ${isValid}`);
        // isValid.should.equal(true);
        const txSigned = FeeMarketEIP1559Transaction.fromTxData(
          {
            ...tx,
            r: addHexPrefix(signature.r),
            s: addHexPrefix(signature.s),
            v: new BN(signature.recid!),
          },
          { common: new Common({ chain: 5, hardfork: 'london' }) },
        );
        console.log(`signedTx: ${JSON.stringify(txSigned)}`);
        console.log(`serialized: ${txSigned.serialize().toString('hex')}`);
        console.log(`senderAddress: ${txSigned.getSenderAddress().toString()}`);
        console.log(`signature: ${JSON.stringify(signature)}`);
        const unhardened = MPC.deriveUnhardened(signature.y + signerOneDerive.xShare.chaincode, '');
        const eth = new KeyPair({ pub: unhardened });
        console.log(`address: ${eth.getAddress()}`);
      });
    }
  });
});
