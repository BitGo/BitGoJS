import * as assert from 'assert';
import * as sinon from 'sinon';
import * as pgp from 'openpgp';
import { EddsaMPSDsg, MPSComms, MPSUtil } from '@bitgo/sdk-lib-mpc';
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
import { decodeWithCodec } from '../../../../../../src/bitgo/utils/codecs';
import { generateGPGKeyPair } from '../../../../../../src/bitgo/utils/opengpgUtils';
import { MPCv2PartiesEnum } from '../../../../../../src/bitgo/utils/tss/ecdsa/typesMPCv2';

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
    userDsg.initDsg(userKeyShare, messageBuffer, derivationPath, MPCv2PartiesEnum.BITGO);
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
    backupDsg.initDsg(backupKeyShare, messageBuffer, derivationPath, MPCv2PartiesEnum.BITGO);
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
    bitgoDsg.initDsg(bitgoKeyShare, messageBuffer, derivationPath, MPCv2PartiesEnum.USER);
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
    userDsg.initDsg(userKeyShare, messageBuffer, derivationPath, MPCv2PartiesEnum.BITGO);
    const userMsg1 = userDsg.getFirstMessage();

    const bitgoDsg = new EddsaMPSDsg.DSG(MPCv2PartiesEnum.BITGO);
    bitgoDsg.initDsg(bitgoKeyShare, messageBuffer, derivationPath, MPCv2PartiesEnum.USER);
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
    backupDsg.initDsg(backupKeyShare, messageBuffer, derivationPath, MPCv2PartiesEnum.BITGO);
    const backupMsg1 = backupDsg.getFirstMessage();

    const bitgoDsg = new EddsaMPSDsg.DSG(MPCv2PartiesEnum.BITGO);
    bitgoDsg.initDsg(bitgoKeyShare, messageBuffer, derivationPath, MPCv2PartiesEnum.BACKUP);
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
    userDsg.initDsg(userKeyShare, messageBuffer, derivationPath, MPCv2PartiesEnum.BITGO);
    const userMsg1 = userDsg.getFirstMessage();

    const bitgoDsg = new EddsaMPSDsg.DSG(MPCv2PartiesEnum.BITGO);
    bitgoDsg.initDsg(bitgoKeyShare, messageBuffer, derivationPath, MPCv2PartiesEnum.USER);
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
    userDsg.initDsg(userKeyShare, messageBuffer, derivationPath, MPCv2PartiesEnum.BITGO);
    const userMsg1 = userDsg.getFirstMessage();

    const bitgoDsg = new EddsaMPSDsg.DSG(MPCv2PartiesEnum.BITGO);
    bitgoDsg.initDsg(bitgoKeyShare, messageBuffer, derivationPath, MPCv2PartiesEnum.USER);
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
    backupDsg.initDsg(backupKeyShare, messageBuffer, derivationPath, MPCv2PartiesEnum.BITGO);
    const backupMsg1 = backupDsg.getFirstMessage();

    const bitgoDsg = new EddsaMPSDsg.DSG(MPCv2PartiesEnum.BITGO);
    bitgoDsg.initDsg(bitgoKeyShare, messageBuffer, derivationPath, MPCv2PartiesEnum.BACKUP);
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

  const mockTxRequestRound2: TxRequest = {
    ...mockTxRequest,
    transactions: [
      {
        ...mockTxRequest.transactions![0],
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
      transactions: [{ ...mockTxRequest.transactions![0], signatureShares: undefined as unknown as [] }],
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
