import * as assert from 'assert';
import * as sinon from 'sinon';
import { Hash, createHash, randomBytes } from 'crypto';
import createKeccakHash from 'keccak';
import {
  MPCv2PartyFromStringOrNumber,
  MPCv2SignatureShareRound1Input,
  MPCv2SignatureShareRound1Output,
  MPCv2SignatureShareRound2Input,
  MPCv2SignatureShareRound2Output,
  MPCv2SignatureShareRound3Input,
} from '@bitgo/public-types';
import { DklsComms, DklsDsg, DklsTypes, DklsUtils } from '@bitgo/sdk-lib-mpc';
import * as sjcl from '@bitgo/sjcl';
import {
  BitGoBase,
  EcdsaMPCv2Utils,
  IBaseCoin,
  SignatureShareRecord,
  SignatureShareType,
  TxRequest,
} from '../../../../../../src';
import { bitgoGpgKey } from './gpgKeys';

describe('ECDSA MPC v2', async () => {
  let userShare: Buffer;
  let bitgoShare: Buffer;

  before('generate key shares for testing', async () => {
    const [userDkgSession, backupDkgSession, bitgoDkgSession] = await DklsUtils.generateDKGKeyShares();
    assert.ok(userDkgSession);
    assert.ok(backupDkgSession);
    assert.ok(bitgoDkgSession);

    userShare = userDkgSession.getKeyShare();
    bitgoShare = bitgoDkgSession.getKeyShare();
  });

  let ecdsaMPCv2Utils: EcdsaMPCv2Utils;

  before('initialize EcdsaMPCv2Utils', async () => {
    const mockBg = {} as BitGoBase;
    mockBg.getEnv = sinon.stub().returns('test');
    const encryptImpl = (params: { password: string; input: string; adata?: string }) => {
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
    const decryptImpl = (params: { password: string; input: string }) => {
      return sjcl.decrypt(params.password, params.input);
    };
    mockBg.encrypt = sinon.stub().callsFake(encryptImpl);
    mockBg.encryptAsync = sinon.stub().callsFake(async (params) => encryptImpl(params));
    mockBg.decrypt = sinon.stub().callsFake(decryptImpl);
    mockBg.decryptAsync = sinon.stub().callsFake(async (params) => decryptImpl(params));

    const mockCoin = {} as IBaseCoin;
    mockCoin.getHashFunction = sinon.stub().callsFake(() => createKeccakHash('keccak256') as Hash);
    mockCoin.isSignablePreHashed = (unsignedTx) => unsignedTx.serializedTxHex?.startsWith('0000') ?? false;

    ecdsaMPCv2Utils = new EcdsaMPCv2Utils(mockBg, mockCoin);
  });

  const walletID = '62fe536a6b4cf70007acb48c0e7bb0b0';
  const walletPassphrase = 'testPass';

  it('should sign a message hash using ECDSA MPC v2 offline rounds', async () => {
    const tMessage = 'testMessage';
    const derivationPath = 'm/0';

    // round 1
    const reqMPCv2SigningRound1 = {
      txRequest: {
        txRequestId: '123456',
        apiVersion: 'full',
        walletId: walletID,
        transactions: [
          {
            unsignedTx: {
              derivationPath,
              signableHex: tMessage,
            },
            signatureShares: [],
          },
        ],
      },
      prv: userShare.toString('base64'),
      walletPassphrase,
    };

    const resMPCv2SigningRound1 = await ecdsaMPCv2Utils.createOfflineRound1Share(reqMPCv2SigningRound1 as any);
    resMPCv2SigningRound1.should.have.property('signatureShareRound1');
    resMPCv2SigningRound1.should.have.property('userGpgPubKey');
    resMPCv2SigningRound1.should.have.property('encryptedRound1Session');
    resMPCv2SigningRound1.should.have.property('encryptedUserGpgPrvKey');

    const encryptedRound1Session = resMPCv2SigningRound1.encryptedRound1Session;
    const encryptedUserGpgPrvKey = resMPCv2SigningRound1.encryptedUserGpgPrvKey;

    const hashBuffer = createKeccakHash('keccak256').update(Buffer.from(tMessage, 'hex')).digest();
    const bitgoSession = new DklsDsg.Dsg(bitgoShare, 2, derivationPath, hashBuffer);

    const txRequestRound1 = await signBitgoMPCv2Round1(
      bitgoSession,
      reqMPCv2SigningRound1.txRequest as any,
      resMPCv2SigningRound1.signatureShareRound1,
      resMPCv2SigningRound1.userGpgPubKey
    );
    assert.ok(
      txRequestRound1.transactions &&
        txRequestRound1.transactions.length === 1 &&
        txRequestRound1.transactions[0].signatureShares.length === 2,
      'txRequestRound1.transactions is not an array of length 1 with 2 signatureShares'
    );

    // round 2
    const reqMPCv2SigningRound2 = {
      ...reqMPCv2SigningRound1,
      txRequest: txRequestRound1,
      encryptedRound1Session,
      encryptedUserGpgPrvKey,
      bitgoPublicGpgKey: bitgoGpgKey.public,
    };

    const resMPCv2SigningRound2 = await ecdsaMPCv2Utils.createOfflineRound2Share(reqMPCv2SigningRound2 as any);
    resMPCv2SigningRound2.should.have.property('signatureShareRound2');
    resMPCv2SigningRound2.should.have.property('encryptedRound2Session');

    const encryptedRound2Session = resMPCv2SigningRound2.encryptedRound2Session;

    const { txRequest: txRequestRound2, bitgoMsg4 } = await signBitgoMPCv2Round2(
      bitgoSession,
      reqMPCv2SigningRound2.txRequest,
      resMPCv2SigningRound2.signatureShareRound2,
      resMPCv2SigningRound1.userGpgPubKey
    );
    assert.ok(
      txRequestRound2.transactions &&
        txRequestRound2.transactions.length === 1 &&
        txRequestRound2.transactions[0].signatureShares.length === 4,
      'txRequestRound2.transactions is not an array of length 1 with 4 signatureShares'
    );
    bitgoMsg4.should.have.property('signatureR');

    // round 3
    const reqMPCv2SigningRound3 = {
      ...reqMPCv2SigningRound2,
      txRequest: txRequestRound2,
      encryptedRound1Session: null, // not needed for round 3
      encryptedRound2Session,
    };

    const resMPCv2SigningRound3 = await ecdsaMPCv2Utils.createOfflineRound3Share(reqMPCv2SigningRound3 as any);
    resMPCv2SigningRound3.should.have.property('signatureShareRound3');

    const { userMsg4 } = await signBitgoMPCv2Round3(
      bitgoSession,
      resMPCv2SigningRound3.signatureShareRound3,
      resMPCv2SigningRound1.userGpgPubKey
    );

    // signature generation and validation
    assert.ok(userMsg4.data.msg4.signatureR === bitgoMsg4.signatureR, 'User and BitGo signaturesR do not match');

    const deserializedBitgoMsg4 = DklsTypes.deserializeMessages({
      p2pMessages: [],
      broadcastMessages: [bitgoMsg4],
    });

    const deserializedUserMsg4 = DklsTypes.deserializeMessages({
      p2pMessages: [],
      broadcastMessages: [
        {
          from: userMsg4.data.msg4.from,
          payload: userMsg4.data.msg4.message,
        },
      ],
    });

    const combinedSigUsingUtil = DklsUtils.combinePartialSignatures(
      [deserializedUserMsg4.broadcastMessages[0].payload, deserializedBitgoMsg4.broadcastMessages[0].payload],
      Buffer.from(userMsg4.data.msg4.signatureR, 'base64').toString('hex')
    );

    const convertedSignature = DklsUtils.verifyAndConvertDklsSignature(
      Buffer.from(tMessage, 'hex'),
      combinedSigUsingUtil,
      DklsTypes.getCommonKeychain(userShare),
      derivationPath,
      createKeccakHash('keccak256') as Hash
    );
    assert.ok(convertedSignature, 'Signature is not valid');
    assert.ok(convertedSignature.split(':').length === 4, 'Signature is not valid');
  });

  it('should fail to sign using session after round X when session after round Y is expected', async () => {
    const tMessage = 'testMessage';
    const derivationPath = 'm/1/2';

    // round 1
    const reqMPCv2SigningRound1 = {
      txRequest: {
        txRequestId: '123456',
        apiVersion: 'full',
        walletId: walletID,
        transactions: [
          {
            unsignedTx: {
              derivationPath,
              signableHex: tMessage,
            },
            signatureShares: [],
          },
        ],
      },
      prv: userShare.toString('base64'),
      walletPassphrase,
    };

    const resMPCv2SigningRound1 = await ecdsaMPCv2Utils.createOfflineRound1Share(reqMPCv2SigningRound1 as any);
    resMPCv2SigningRound1.should.have.property('signatureShareRound1');
    resMPCv2SigningRound1.should.have.property('userGpgPubKey');
    resMPCv2SigningRound1.should.have.property('encryptedRound1Session');
    resMPCv2SigningRound1.should.have.property('encryptedUserGpgPrvKey');

    const encryptedRound1Session = resMPCv2SigningRound1.encryptedRound1Session;
    const encryptedUserGpgPrvKey = resMPCv2SigningRound1.encryptedUserGpgPrvKey;

    const hashBuffer = createKeccakHash('keccak256').update(Buffer.from(tMessage, 'hex')).digest();
    const bitgoSession = new DklsDsg.Dsg(bitgoShare, 2, derivationPath, hashBuffer);

    const txRequestRound1 = await signBitgoMPCv2Round1(
      bitgoSession,
      reqMPCv2SigningRound1.txRequest as any,
      resMPCv2SigningRound1.signatureShareRound1,
      resMPCv2SigningRound1.userGpgPubKey
    );
    assert.ok(
      txRequestRound1.transactions &&
        txRequestRound1.transactions.length === 1 &&
        txRequestRound1.transactions[0].signatureShares.length === 2,
      'txRequestRound1.transactions is not an array of length 1 with 2 signatureShares'
    );

    // round 2
    const reqMPCv2SigningRound2 = {
      ...reqMPCv2SigningRound1,
      txRequest: txRequestRound1,
      encryptedRound1Session,
      encryptedUserGpgPrvKey,
      bitgoPublicGpgKey: bitgoGpgKey.public,
    };

    const resMPCv2SigningRound2 = await ecdsaMPCv2Utils.createOfflineRound2Share(reqMPCv2SigningRound2 as any);
    resMPCv2SigningRound2.should.have.property('signatureShareRound2');
    resMPCv2SigningRound2.should.have.property('encryptedRound2Session');

    const { txRequest: txRequestRound2, bitgoMsg4 } = await signBitgoMPCv2Round2(
      bitgoSession,
      reqMPCv2SigningRound2.txRequest,
      resMPCv2SigningRound2.signatureShareRound2,
      resMPCv2SigningRound1.userGpgPubKey
    );
    assert.ok(
      txRequestRound2.transactions &&
        txRequestRound2.transactions.length === 1 &&
        txRequestRound2.transactions[0].signatureShares.length === 4,
      'txRequestRound2.transactions is not an array of length 1 with 4 signatureShares'
    );
    bitgoMsg4.should.have.property('signatureR');

    const encryptedRound2Session = resMPCv2SigningRound2.encryptedRound2Session;

    // A bogus round 3 signing request containing encrypted session from round 1 instead of round 2 should fail.
    const bogusReqMPCv2SigningRound3 = {
      ...reqMPCv2SigningRound2,
      txRequest: txRequestRound2,
      encryptedRound1Session: null, // not needed for round 3
      encryptedRound2Session: encryptedRound1Session, // instaed of encryptedRound2Session
    };

    await ecdsaMPCv2Utils
      .createOfflineRound3Share(bogusReqMPCv2SigningRound3 as any)
      .should.be.rejectedWith('Adata does not match cyphertext adata');

    // A bogus round 2 signing request containing encrypted session from round 2 instead of round 1 should fail.
    const bogusReqMPCv2SigningRound2 = {
      ...reqMPCv2SigningRound2,
      encryptedRound1Session: encryptedRound2Session, // instaed of encryptedRound1Session
    };

    await ecdsaMPCv2Utils
      .createOfflineRound2Share(bogusReqMPCv2SigningRound2 as any)
      .should.be.rejectedWith('Unexpected signature share response. Unable to parse data.');
  });

  it('should fail to sign reusing a session on different message', async () => {
    const tMessage1 = 'testMessage1';
    const tMessage2 = 'testMessage2';
    const derivationPath = 'm/3/4';

    // round 1 of signing tMessage1
    const reqMPCv2SigningMsg1Round1 = {
      txRequest: {
        txRequestId: '123456',
        apiVersion: 'full',
        walletId: walletID,
        transactions: [
          {
            unsignedTx: {
              derivationPath,
              signableHex: tMessage1,
            },
            signatureShares: [],
          },
        ],
      },
      prv: userShare.toString('base64'),
      walletPassphrase,
    };

    const resMPCv2SigningMsg1Round1 = await ecdsaMPCv2Utils.createOfflineRound1Share(reqMPCv2SigningMsg1Round1 as any);
    resMPCv2SigningMsg1Round1.should.have.property('signatureShareRound1');
    resMPCv2SigningMsg1Round1.should.have.property('userGpgPubKey');
    resMPCv2SigningMsg1Round1.should.have.property('encryptedRound1Session');
    resMPCv2SigningMsg1Round1.should.have.property('encryptedUserGpgPrvKey');

    const encryptedMsg1Round1Session = resMPCv2SigningMsg1Round1.encryptedRound1Session;

    const hashBuffer1 = createKeccakHash('keccak256').update(Buffer.from(tMessage1, 'hex')).digest();
    const bitgoSession1 = new DklsDsg.Dsg(bitgoShare, 2, derivationPath, hashBuffer1);

    const txRequestMsg1Round1 = await signBitgoMPCv2Round1(
      bitgoSession1,
      reqMPCv2SigningMsg1Round1.txRequest as any,
      resMPCv2SigningMsg1Round1.signatureShareRound1,
      resMPCv2SigningMsg1Round1.userGpgPubKey
    );
    assert.ok(
      txRequestMsg1Round1.transactions &&
        txRequestMsg1Round1.transactions.length === 1 &&
        txRequestMsg1Round1.transactions[0].signatureShares.length === 2,
      'txRequestMsg1Round1.transactions is not an array of length 1 with 2 signatureShares'
    );

    // round 1 of signing tMessage2
    const reqMPCv2SigningMsg2Round1 = {
      ...reqMPCv2SigningMsg1Round1,
      txRequest: {
        ...reqMPCv2SigningMsg1Round1.txRequest,
        transactions: [
          {
            unsignedTx: {
              derivationPath,
              signableHex: tMessage2,
            },
            signatureShares: [],
          },
        ],
      },
    };

    const resMPCv2SigningMsg2Round1 = await ecdsaMPCv2Utils.createOfflineRound1Share(reqMPCv2SigningMsg2Round1 as any);
    resMPCv2SigningMsg2Round1.should.have.property('signatureShareRound1');
    resMPCv2SigningMsg2Round1.should.have.property('userGpgPubKey');
    resMPCv2SigningMsg2Round1.should.have.property('encryptedRound1Session');
    resMPCv2SigningMsg2Round1.should.have.property('encryptedUserGpgPrvKey');

    const encryptedMsg2UserGpgPrvKey = resMPCv2SigningMsg2Round1.encryptedUserGpgPrvKey;

    const hashBuffer2 = createKeccakHash('keccak256').update(Buffer.from(tMessage2, 'hex')).digest();
    const bitgoSession2 = new DklsDsg.Dsg(bitgoShare, 2, derivationPath, hashBuffer2);

    const txRequestMsg2Round1 = await signBitgoMPCv2Round1(
      bitgoSession2,
      reqMPCv2SigningMsg2Round1.txRequest as any,
      resMPCv2SigningMsg2Round1.signatureShareRound1,
      resMPCv2SigningMsg2Round1.userGpgPubKey
    );
    assert.ok(
      txRequestMsg2Round1.transactions &&
        txRequestMsg2Round1.transactions.length === 1 &&
        txRequestMsg2Round1.transactions[0].signatureShares.length === 2,
      'txRequestMsg2Round1.transactions is not an array of length 1 with 2 signatureShares'
    );

    // Attempting to reuse round 1 session from signing tMessage1 for signing tMessage2 should fail at round 2.
    const reqMPCv2SigningMsg2Round2WithMsg1Session = {
      ...reqMPCv2SigningMsg2Round1,
      txRequest: txRequestMsg2Round1,
      encryptedRound1Session: encryptedMsg1Round1Session, // instead of resMPCv2SigningMsg2Round1.encryptedRound1Session
      encryptedUserGpgPrvKey: encryptedMsg2UserGpgPrvKey,
      bitgoPublicGpgKey: bitgoGpgKey.public,
    };

    await ecdsaMPCv2Utils
      .createOfflineRound2Share(reqMPCv2SigningMsg2Round2WithMsg1Session as any)
      .should.be.rejectedWith('Error while creating messages from party 0, round 2: Error: Invalid final_session_id');
  });

  it('should sign a pre-hashed Avalanche atomic export tx without applying keccak256', async () => {
    // Real Avalanche ExportInC transaction from sdk-coin-flr test resources.
    // Mirrors the sandbox flow: c2pMpcToMpcTss.ts → signWithMpc() where
    // FlareJS builds an ExportInC tx, SHA-256 hashes the unsigned bytes,
    // and MPC signs the raw SHA-256 hash (NOT keccak256 of it).
    //
    // serializedTxHex = full unsigned Avalanche atomic tx (codec type ID 0x0000)
    // signableHex     = SHA-256(txBody) — 32 bytes, already the final signing hash
    //
    // Sandbox reference (coins-sandbox/flareCP/flrC_MPC_to_flrP_MPC):
    //
    // C→P direction (c2pMpcToMpcTss.ts — export from C-chain):
    //   Message hash (SHA-256): 9b3e1c8fc9322b667ec61619487b3993e91dcfc5...
    //   Signature r: d5bc2e2cad314023...  s: 47af9d7109135f7a...  Recovery: 1
    //   Export TX ID: 2Z5ELShnmmMgvTeupzLQzEKtAgbvZkDvq6KRYqbzVgcyBGVGpb
    //
    // P→C direction (p2cMpcToMpcTss.ts — export from P-chain):
    //   Threshold: 1 (MPC single-sig on-chain, NO hop transaction)
    //   Message hash (SHA-256): f1afd7bb3df2019ee61b41334abf95172d469d18...
    //   Signature r: fae44ca89e7a0d3effd0912c16d69735aabbc73ad2d140ffa2c3b46af48d159c
    //   Signature s: 1dec05d0d477a5b245a0a2e5f3a67e75489ff9b98b29780fc757b12d9f687db3
    //   Recovery: 0
    //   Export TX ID: 2tDQmQUtDMyVWe8Bo36yHXykV2RMvh8rft3to5QsgoNhATMDXz
    //   Network: Coston2 Testnet (ID: 114)
    const serializedTxHex =
      '0000000000010000007278db5c30bed04c05ce209179812850bbb3fe6d46d7eef3744d814c0da5552479' +
      '00000000000000000000000000000000000000000000000000000000000000000000000128a05933dc76' +
      'e4e6c25f35d5c9b2a58769700e760000000002ff3d1658734f94af871c3d131b56131b6fb7a0291eac' +
      'add261e69dfb42a9cdf6f7fddd00000000000000090000000158734f94af871c3d131b56131b6fb7a029' +
      '1eacadd261e69dfb42a9cdf6f7fddd000000070000000002faf08000000000000000000000000200000003' +
      '12cb32eaf92553064db98d271b56cba079ec78f5a6e0c1abd0132f70efb77e2274637ff336a29a57c386' +
      'd58d09a9ae77cf1cf07bf1c9de44ebb0c9f3';
    // SHA-256(serializedTxHex bytes) — same as FlareJS unsignedTx.toBytes() → sha256
    const signableHex = createHash('sha256').update(Buffer.from(serializedTxHex, 'hex')).digest('hex');
    const derivationPath = 'm/0';

    // Validate fixture properties match sandbox expectations:
    // - serializedTxHex starts with Avalanche codec type ID (0x0000)
    // - signableHex is exactly 64 hex chars (32-byte SHA-256 digest)
    assert.ok(serializedTxHex.startsWith('0000'), 'Fixture must start with Avalanche codec prefix');
    assert.strictEqual(signableHex.length, 64, 'signableHex must be 32-byte SHA-256 (64 hex chars)');
    // Verify keccak256(signableHex) differs — proves skipping hash matters
    const keccakHash = createKeccakHash('keccak256').update(Buffer.from(signableHex, 'hex')).digest('hex');
    assert.notStrictEqual(signableHex, keccakHash, 'SHA-256 and keccak256 hashes must differ');

    // round 1
    const reqMPCv2SigningRound1 = {
      txRequest: {
        txRequestId: 'flr-export-c2p',
        apiVersion: 'full',
        walletId: walletID,
        transactions: [
          {
            unsignedTx: {
              derivationPath,
              signableHex,
              serializedTxHex,
            },
            signatureShares: [],
          },
        ],
      },
      prv: userShare.toString('base64'),
      walletPassphrase,
    };

    const resMPCv2SigningRound1 = await ecdsaMPCv2Utils.createOfflineRound1Share(reqMPCv2SigningRound1 as any);
    resMPCv2SigningRound1.should.have.property('signatureShareRound1');
    resMPCv2SigningRound1.should.have.property('encryptedRound1Session');
    resMPCv2SigningRound1.should.have.property('encryptedUserGpgPrvKey');

    const encryptedRound1Session = resMPCv2SigningRound1.encryptedRound1Session;
    const encryptedUserGpgPrvKey = resMPCv2SigningRound1.encryptedUserGpgPrvKey;

    // BitGo/HSM party uses the raw SHA-256 hash directly (no keccak256).
    // This matches WP's MPCv2Signer isPreHashed=true path where
    // txHash = signableMaterial (raw signableHex bytes).
    // If the SDK incorrectly applied keccak256, user party would use
    // keccak256(SHA-256(txBody)) while HSM uses SHA-256(txBody) — the
    // two DKLS parties would disagree, producing an invalid combined sig.
    const hashBuffer = Buffer.from(signableHex, 'hex');
    assert.strictEqual(hashBuffer.length, 32, 'DKLS message hash must be 32 bytes');
    const bitgoSession = new DklsDsg.Dsg(bitgoShare, 2, derivationPath, hashBuffer);

    const txRequestRound1 = await signBitgoMPCv2Round1(
      bitgoSession,
      reqMPCv2SigningRound1.txRequest as any,
      resMPCv2SigningRound1.signatureShareRound1,
      resMPCv2SigningRound1.userGpgPubKey
    );
    assert.ok(
      txRequestRound1.transactions &&
        txRequestRound1.transactions.length === 1 &&
        txRequestRound1.transactions[0].signatureShares.length === 2
    );

    // round 2
    const reqMPCv2SigningRound2 = {
      ...reqMPCv2SigningRound1,
      txRequest: txRequestRound1,
      encryptedRound1Session,
      encryptedUserGpgPrvKey,
      bitgoPublicGpgKey: bitgoGpgKey.public,
    };

    const resMPCv2SigningRound2 = await ecdsaMPCv2Utils.createOfflineRound2Share(reqMPCv2SigningRound2 as any);
    resMPCv2SigningRound2.should.have.property('signatureShareRound2');
    resMPCv2SigningRound2.should.have.property('encryptedRound2Session');

    const encryptedRound2Session = resMPCv2SigningRound2.encryptedRound2Session;

    const { txRequest: txRequestRound2, bitgoMsg4 } = await signBitgoMPCv2Round2(
      bitgoSession,
      reqMPCv2SigningRound2.txRequest,
      resMPCv2SigningRound2.signatureShareRound2,
      resMPCv2SigningRound1.userGpgPubKey
    );
    assert.ok(
      txRequestRound2.transactions &&
        txRequestRound2.transactions.length === 1 &&
        txRequestRound2.transactions[0].signatureShares.length === 4
    );
    bitgoMsg4.should.have.property('signatureR');

    // round 3
    const reqMPCv2SigningRound3 = {
      ...reqMPCv2SigningRound2,
      txRequest: txRequestRound2,
      encryptedRound1Session: null,
      encryptedRound2Session,
    };

    const resMPCv2SigningRound3 = await ecdsaMPCv2Utils.createOfflineRound3Share(reqMPCv2SigningRound3 as any);
    resMPCv2SigningRound3.should.have.property('signatureShareRound3');

    const { userMsg4 } = await signBitgoMPCv2Round3(
      bitgoSession,
      resMPCv2SigningRound3.signatureShareRound3,
      resMPCv2SigningRound1.userGpgPubKey
    );

    // Both parties must produce matching R values for a valid combined signature
    assert.ok(userMsg4.data.msg4.signatureR === bitgoMsg4.signatureR, 'User and BitGo signaturesR do not match');

    const deserializedBitgoMsg4 = DklsTypes.deserializeMessages({
      p2pMessages: [],
      broadcastMessages: [bitgoMsg4],
    });

    const deserializedUserMsg4 = DklsTypes.deserializeMessages({
      p2pMessages: [],
      broadcastMessages: [
        {
          from: userMsg4.data.msg4.from,
          payload: userMsg4.data.msg4.message,
        },
      ],
    });

    const combinedSigUsingUtil = DklsUtils.combinePartialSignatures(
      [deserializedUserMsg4.broadcastMessages[0].payload, deserializedBitgoMsg4.broadcastMessages[0].payload],
      Buffer.from(userMsg4.data.msg4.signatureR, 'base64').toString('hex')
    );

    // Combined signature must have valid R and S components (32 bytes each)
    assert.strictEqual(combinedSigUsingUtil.R.length, 32, 'Signature R must be 32 bytes');
    assert.strictEqual(combinedSigUsingUtil.S.length, 32, 'Signature S must be 32 bytes');

    // Verify with shouldHash=false — signableHex is already SHA-256(txBody).
    // This mirrors WP's combineSigSharesMPCv2 where shouldHash=false for
    // pre-hashed Avalanche atomic transactions (isSignablePreHashed=true).
    // On-chain, Avalanche verifies: ecdsaRecover(SHA-256(txBody)) == signerPubKey
    const convertedSignature = DklsUtils.verifyAndConvertDklsSignature(
      Buffer.from(signableHex, 'hex'),
      combinedSigUsingUtil,
      DklsTypes.getCommonKeychain(userShare),
      derivationPath,
      createHash('sha256') as Hash,
      false // shouldHash=false: message is already SHA-256(txBody)
    );
    assert.ok(convertedSignature, 'Pre-hashed Avalanche atomic signature is not valid');
    // Format: recid:R_hex:S_hex:publicKey_hex
    // Sandbox produces the same structure — e.g. P→C export:
    //   r: fae44ca89e7a0d3effd0912c16d69735aabbc73ad2d140ffa2c3b46af48d159c (32 bytes)
    //   s: 1dec05d0d477a5b245a0a2e5f3a67e75489ff9b98b29780fc757b12d9f687db3 (32 bytes)
    //   Recovery: 0
    const sigParts = convertedSignature.split(':');
    assert.strictEqual(sigParts.length, 4, 'Signature must be recid:R:S:pubkey format');
    assert.ok(['0', '1'].includes(sigParts[0]), 'Recovery ID must be 0 or 1');
    assert.strictEqual(sigParts[1].length, 64, 'Signature R must be 32 bytes hex');
    assert.strictEqual(sigParts[2].length, 64, 'Signature S must be 32 bytes hex');
  });

  it('signRequestBase (hot wallet path) should skip keccak256 for Avalanche atomic tx', async () => {
    const serializedTxHex =
      '0000000000010000007278db5c30bed04c05ce209179812850bbb3fe6d46d7eef3744d814c0da5552479' +
      '00000000000000000000000000000000000000000000000000000000000000000000000128a05933dc76' +
      'e4e6c25f35d5c9b2a58769700e760000000002ff3d1658734f94af871c3d131b56131b6fb7a0291eac' +
      'add261e69dfb42a9cdf6f7fddd00000000000000090000000158734f94af871c3d131b56131b6fb7a029' +
      '1eacadd261e69dfb42a9cdf6f7fddd000000070000000002faf08000000000000000000000000200000003' +
      '12cb32eaf92553064db98d271b56cba079ec78f5a6e0c1abd0132f70efb77e2274637ff336a29a57c386' +
      'd58d09a9ae77cf1cf07bf1c9de44ebb0c9f3';
    const signableHex = createHash('sha256').update(Buffer.from(serializedTxHex, 'hex')).digest('hex');
    const derivationPath = 'm/0';

    const mockBgWithPost = {} as BitGoBase;
    mockBgWithPost.getEnv = sinon.stub().returns('test');
    mockBgWithPost.setRequestTracer = sinon.stub();
    mockBgWithPost.encrypt = sinon.stub().returns('encrypted');
    mockBgWithPost.encryptAsync = sinon.stub().resolves('encrypted');
    mockBgWithPost.decrypt = sinon.stub().returns('decrypted');
    mockBgWithPost.decryptAsync = sinon.stub().resolves('decrypted');
    mockBgWithPost.post = sinon.stub().returns({
      send: sinon.stub().returnsThis(),
      set: sinon.stub().returnsThis(),
      result: sinon.stub().rejects(new Error('mock: HTTP not available')),
    });

    const hashFunctionSpy = sinon.stub().callsFake(() => createKeccakHash('keccak256') as Hash);
    const mockCoinForHotWallet = {
      getHashFunction: hashFunctionSpy,
      verifyTransaction: sinon.stub().resolves(true),
      getMPCAlgorithm: sinon.stub().returns('ecdsa'),
      getConfig: sinon.stub().returns({ family: 'flrp' }),
      isSignablePreHashed: (unsignedTx: { serializedTxHex?: string }) =>
        unsignedTx.serializedTxHex?.startsWith('0000') ?? false,
    } as unknown as IBaseCoin;

    const mockWallet = {
      id: sinon.stub().returns(walletID),
      multisigType: sinon.stub().returns('tss'),
      multisigTypeVersion: sinon.stub().returns('MPCv2'),
    };

    const hotWalletUtils = new EcdsaMPCv2Utils(mockBgWithPost, mockCoinForHotWallet, mockWallet as any);
    sinon.stub(hotWalletUtils as any, 'pickBitgoPubGpgKeyForSigning').resolves(bitgoGpgKey.public);

    const txRequest = {
      txRequestId: 'flrp-export-test',
      apiVersion: 'full',
      walletId: walletID,
      transactions: [
        {
          unsignedTx: {
            derivationPath,
            signableHex,
            serializedTxHex,
          },
          signatureShares: [],
        },
      ],
    } as unknown as TxRequest;

    try {
      await hotWalletUtils.signTxRequest({
        txRequest,
        txParams: { recipients: [{ address: '0x' + '00'.repeat(20), amount: '1000' }] },
        prv: userShare.toString('base64'),
        reqId: { inc: sinon.stub(), toString: sinon.stub().returns('test-req') } as any,
      });
    } catch (e) {}

    assert.strictEqual(
      hashFunctionSpy.callCount,
      0,
      'getHashFunction must NOT be called for Avalanche atomic tx (serializedTxHex starts with 0000)'
    );
  });

  it('signRequestBase (hot wallet path) should apply keccak256 for regular EVM tx', async () => {
    const serializedTxHex = 'f86c808504a817c80082520894' + '00'.repeat(20) + '80808080';
    const signableHex = serializedTxHex;
    const derivationPath = 'm/0';

    assert.ok(!serializedTxHex.startsWith('0000'), 'EVM tx must not start with Avalanche prefix');

    const mockBgWithPost = {} as BitGoBase;
    mockBgWithPost.getEnv = sinon.stub().returns('test');
    mockBgWithPost.setRequestTracer = sinon.stub();
    mockBgWithPost.encrypt = sinon.stub().returns('encrypted');
    mockBgWithPost.encryptAsync = sinon.stub().resolves('encrypted');
    mockBgWithPost.decrypt = sinon.stub().returns('decrypted');
    mockBgWithPost.decryptAsync = sinon.stub().resolves('decrypted');
    mockBgWithPost.post = sinon.stub().returns({
      send: sinon.stub().returnsThis(),
      set: sinon.stub().returnsThis(),
      result: sinon.stub().rejects(new Error('mock: HTTP not available')),
    });

    const hashFunctionSpy = sinon.stub().callsFake(() => createKeccakHash('keccak256') as Hash);
    const mockCoinForEvmWallet = {
      getHashFunction: hashFunctionSpy,
      verifyTransaction: sinon.stub().resolves(true),
      getMPCAlgorithm: sinon.stub().returns('ecdsa'),
      getConfig: sinon.stub().returns({ family: 'flr' }),
    } as unknown as IBaseCoin;

    const mockWallet = {
      id: sinon.stub().returns(walletID),
      multisigType: sinon.stub().returns('tss'),
      multisigTypeVersion: sinon.stub().returns('MPCv2'),
    };

    const evmUtils = new EcdsaMPCv2Utils(mockBgWithPost, mockCoinForEvmWallet, mockWallet as any);
    sinon.stub(evmUtils as any, 'pickBitgoPubGpgKeyForSigning').resolves(bitgoGpgKey.public);

    const txRequest = {
      txRequestId: 'flr-evm-test',
      apiVersion: 'full',
      walletId: walletID,
      transactions: [
        {
          unsignedTx: {
            derivationPath,
            signableHex,
            serializedTxHex,
          },
          signatureShares: [],
        },
      ],
    } as unknown as TxRequest;

    try {
      await evmUtils.signTxRequest({
        txRequest,
        txParams: { recipients: [{ address: '0x' + '00'.repeat(20), amount: '1000' }] },
        prv: userShare.toString('base64'),
        reqId: { inc: sinon.stub(), toString: sinon.stub().returns('test-req') } as any,
      });
    } catch (e) {}

    assert.strictEqual(
      hashFunctionSpy.callCount,
      1,
      'getHashFunction must be called for regular EVM tx (serializedTxHex does not start with 0000)'
    );
  });

  it('should still apply keccak256 for regular FLR EVM transactions', async () => {
    // Regular EVM transaction on FLR (e.g. token transfer, not cross-chain).
    // serializedTxHex starts with 'f8' (RLP prefix), NOT '0000'.
    // The SDK must apply keccak256 as the hash function — standard EVM path.
    // Use valid hex for signableHex (unlike the pre-existing 'testMessage' pattern
    // in earlier tests) so keccak256 operates on a realistic byte buffer.
    const serializedTxHex = 'f86c808504a817c80082520894' + '00'.repeat(20) + '80808080';
    const signableHex = serializedTxHex; // In EVM, signableHex is the RLP-encoded unsigned tx
    const derivationPath = 'm/0';

    // Verify fixture does NOT trigger the Avalanche detection
    assert.ok(!serializedTxHex.startsWith('0000'), 'EVM tx must not start with Avalanche prefix');

    // round 1
    const reqMPCv2SigningRound1 = {
      txRequest: {
        txRequestId: 'flr-evm-transfer',
        apiVersion: 'full',
        walletId: walletID,
        transactions: [
          {
            unsignedTx: {
              derivationPath,
              signableHex,
              serializedTxHex,
            },
            signatureShares: [],
          },
        ],
      },
      prv: userShare.toString('base64'),
      walletPassphrase,
    };

    const resMPCv2SigningRound1 = await ecdsaMPCv2Utils.createOfflineRound1Share(reqMPCv2SigningRound1 as any);
    resMPCv2SigningRound1.should.have.property('signatureShareRound1');
    resMPCv2SigningRound1.should.have.property('encryptedRound1Session');
    resMPCv2SigningRound1.should.have.property('encryptedUserGpgPrvKey');

    const encryptedRound1Session = resMPCv2SigningRound1.encryptedRound1Session;
    const encryptedUserGpgPrvKey = resMPCv2SigningRound1.encryptedUserGpgPrvKey;

    // BitGo party uses keccak256(signableHex) — standard EVM path.
    // Both SDK and WP/HSM apply keccak256 for regular EVM transactions.
    const hashBuffer = createKeccakHash('keccak256').update(Buffer.from(signableHex, 'hex')).digest();
    const bitgoSession = new DklsDsg.Dsg(bitgoShare, 2, derivationPath, hashBuffer);

    const txRequestRound1 = await signBitgoMPCv2Round1(
      bitgoSession,
      reqMPCv2SigningRound1.txRequest as any,
      resMPCv2SigningRound1.signatureShareRound1,
      resMPCv2SigningRound1.userGpgPubKey
    );
    assert.ok(
      txRequestRound1.transactions &&
        txRequestRound1.transactions.length === 1 &&
        txRequestRound1.transactions[0].signatureShares.length === 2
    );

    // round 2
    const reqMPCv2SigningRound2 = {
      ...reqMPCv2SigningRound1,
      txRequest: txRequestRound1,
      encryptedRound1Session,
      encryptedUserGpgPrvKey,
      bitgoPublicGpgKey: bitgoGpgKey.public,
    };

    const resMPCv2SigningRound2 = await ecdsaMPCv2Utils.createOfflineRound2Share(reqMPCv2SigningRound2 as any);
    resMPCv2SigningRound2.should.have.property('signatureShareRound2');
    resMPCv2SigningRound2.should.have.property('encryptedRound2Session');

    const encryptedRound2Session = resMPCv2SigningRound2.encryptedRound2Session;

    const { txRequest: txRequestRound2, bitgoMsg4 } = await signBitgoMPCv2Round2(
      bitgoSession,
      reqMPCv2SigningRound2.txRequest,
      resMPCv2SigningRound2.signatureShareRound2,
      resMPCv2SigningRound1.userGpgPubKey
    );
    assert.ok(
      txRequestRound2.transactions &&
        txRequestRound2.transactions.length === 1 &&
        txRequestRound2.transactions[0].signatureShares.length === 4
    );
    bitgoMsg4.should.have.property('signatureR');

    // round 3
    const reqMPCv2SigningRound3 = {
      ...reqMPCv2SigningRound2,
      txRequest: txRequestRound2,
      encryptedRound1Session: null,
      encryptedRound2Session,
    };

    const resMPCv2SigningRound3 = await ecdsaMPCv2Utils.createOfflineRound3Share(reqMPCv2SigningRound3 as any);
    resMPCv2SigningRound3.should.have.property('signatureShareRound3');

    const { userMsg4 } = await signBitgoMPCv2Round3(
      bitgoSession,
      resMPCv2SigningRound3.signatureShareRound3,
      resMPCv2SigningRound1.userGpgPubKey
    );

    assert.ok(userMsg4.data.msg4.signatureR === bitgoMsg4.signatureR, 'User and BitGo signaturesR do not match');

    const deserializedBitgoMsg4 = DklsTypes.deserializeMessages({
      p2pMessages: [],
      broadcastMessages: [bitgoMsg4],
    });

    const deserializedUserMsg4 = DklsTypes.deserializeMessages({
      p2pMessages: [],
      broadcastMessages: [
        {
          from: userMsg4.data.msg4.from,
          payload: userMsg4.data.msg4.message,
        },
      ],
    });

    const combinedSigUsingUtil = DklsUtils.combinePartialSignatures(
      [deserializedUserMsg4.broadcastMessages[0].payload, deserializedBitgoMsg4.broadcastMessages[0].payload],
      Buffer.from(userMsg4.data.msg4.signatureR, 'base64').toString('hex')
    );

    // Verify with shouldHash=true and keccak256 — standard EVM verification
    const convertedSignature = DklsUtils.verifyAndConvertDklsSignature(
      Buffer.from(signableHex, 'hex'),
      combinedSigUsingUtil,
      DklsTypes.getCommonKeychain(userShare),
      derivationPath,
      createKeccakHash('keccak256') as Hash
    );
    assert.ok(convertedSignature, 'EVM signature with serializedTxHex is not valid');
    const sigParts = convertedSignature.split(':');
    assert.strictEqual(sigParts.length, 4, 'Signature must be recid:R:S:pubkey format');
    assert.strictEqual(sigParts[1].length, 64, 'Signature R must be 32 bytes hex');
    assert.strictEqual(sigParts[2].length, 64, 'Signature S must be 32 bytes hex');
  });

  describe('createOfflineRound1Share and createOfflineRound2Share - encryptionVersion: 1 in v1 path', async () => {
    let ecdsaMPCv2UtilsWithSpy: EcdsaMPCv2Utils;
    let encryptAsyncSpy: sinon.SinonStub;

    before(async () => {
      const mockBg = {} as BitGoBase;
      mockBg.getEnv = sinon.stub().returns('test');
      const encryptImpl = (params: { password: string; input: string; adata?: string }) => {
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
      encryptAsyncSpy = sinon.stub().callsFake(async (params) => encryptImpl(params));
      mockBg.encrypt = sinon.stub().callsFake(encryptImpl);
      mockBg.encryptAsync = encryptAsyncSpy;
      mockBg.decrypt = sinon.stub().callsFake((params) => sjcl.decrypt(params.password, params.input));
      mockBg.decryptAsync = sinon.stub().callsFake(async (params) => sjcl.decrypt(params.password, params.input));

      const mockCoin = {} as IBaseCoin;
      mockCoin.getHashFunction = sinon.stub().callsFake(() => createKeccakHash('keccak256') as Hash);
      mockCoin.isSignablePreHashed = (unsignedTx) => unsignedTx.serializedTxHex?.startsWith('0000') ?? false;
      ecdsaMPCv2UtilsWithSpy = new EcdsaMPCv2Utils(mockBg, mockCoin);
    });

    it('createOfflineRound1Share uses encryptionVersion: 1 in v1 (non-v2 envelope) path', async () => {
      const txRequest = {
        txRequestId: 'req-id',
        walletId: walletID,
        transactions: [{ unsignedTx: { signableHex: 'deadbeef01', derivationPath: 'm/0', serializedTxHex: '' } }],
        apiVersion: 'full',
      } as any;

      encryptAsyncSpy.resetHistory();

      await ecdsaMPCv2UtilsWithSpy.createOfflineRound1Share({
        txRequest,
        prv: Buffer.from(userShare).toString('base64'),
        walletPassphrase,
        encryptedPrv: undefined,
      });

      assert.ok(encryptAsyncSpy.called, 'encryptAsync should be called in v1 path');
      for (const call of encryptAsyncSpy.getCalls()) {
        assert.strictEqual(
          call.args[0].encryptionVersion,
          1,
          'encryptionVersion should be hardcoded to 1 in the v1 signing session path'
        );
      }
    });
  });
});

function bytesToWord(bytes?: Uint8Array | number[]): number {
  if (!(bytes instanceof Uint8Array) || bytes.length !== 4) {
    throw new Error('bytes must be a Uint8Array with length 4');
  }

  return bytes.reduce((num, byte) => num * 0x100 + byte, 0);
}

function getUserPartyGpgKeyPublic(userPubKey: string): DklsTypes.PartyGpgKey {
  return {
    partyId: 0,
    gpgKey: userPubKey,
  };
}

function getBitGoPartyGpgKeyPrv(bitgoPrvKey: string): DklsTypes.PartyGpgKey {
  return {
    partyId: 2,
    gpgKey: bitgoPrvKey,
  };
}

async function signBitgoMPCv2Round1(
  bitgoSession: DklsDsg.Dsg,
  txRequest: TxRequest,
  userShare: SignatureShareRecord,
  userGPGPubKey: string
): Promise<TxRequest> {
  assert.ok(
    txRequest.transactions && txRequest.transactions.length === 1,
    'txRequest.transactions is not an array of length 1'
  );
  txRequest.transactions[0].signatureShares.push(userShare);
  // Do the actual signing on BitGo's side based on User's messages
  const signatureShare = JSON.parse(userShare.share) as MPCv2SignatureShareRound1Input;
  const deserializedMessages = DklsTypes.deserializeMessages({
    p2pMessages: [],
    broadcastMessages: [
      {
        from: signatureShare.data.msg1.from,
        payload: signatureShare.data.msg1.message,
      },
    ],
  });
  const bitgoToUserRound1BroadcastMsg = await bitgoSession.init();
  const bitgoToUserRound2Msg = bitgoSession.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: deserializedMessages.broadcastMessages,
  });
  const serializedBitGoToUserRound1And2Msgs = DklsTypes.serializeMessages({
    p2pMessages: bitgoToUserRound2Msg.p2pMessages,
    broadcastMessages: [bitgoToUserRound1BroadcastMsg],
  });

  const authEncMessages = await DklsComms.encryptAndAuthOutgoingMessages(
    serializedBitGoToUserRound1And2Msgs,
    [getUserPartyGpgKeyPublic(userGPGPubKey)],
    [getBitGoPartyGpgKeyPrv(bitgoGpgKey.private)]
  );

  const bitgoToUserSignatureShare: MPCv2SignatureShareRound1Output = {
    type: 'round1Output',
    data: {
      msg1: {
        from: authEncMessages.broadcastMessages[0].from as MPCv2PartyFromStringOrNumber,
        signature: authEncMessages.broadcastMessages[0].payload.signature,
        message: authEncMessages.broadcastMessages[0].payload.message,
      },
      msg2: {
        from: authEncMessages.p2pMessages[0].from as MPCv2PartyFromStringOrNumber,
        to: authEncMessages.p2pMessages[0].to as MPCv2PartyFromStringOrNumber,
        encryptedMessage: authEncMessages.p2pMessages[0].payload.encryptedMessage,
        signature: authEncMessages.p2pMessages[0].payload.signature,
      },
    },
  };
  txRequest.transactions[0].signatureShares.push({
    from: SignatureShareType.BITGO,
    to: SignatureShareType.USER,
    share: JSON.stringify(bitgoToUserSignatureShare),
  });
  return txRequest;
}

async function signBitgoMPCv2Round2(
  bitgoSession: DklsDsg.Dsg,
  txRequest: TxRequest,
  userShare: SignatureShareRecord,
  userGPGPubKey: string
): Promise<{ txRequest: TxRequest; bitgoMsg4: DklsTypes.SerializedBroadcastMessage }> {
  assert.ok(
    txRequest.transactions && txRequest.transactions.length === 1,
    'txRequest.transactions is not an array of length 1'
  );
  txRequest.transactions[0].signatureShares.push(userShare);

  // Do the actual signing on BitGo's side based on User's messages
  const parsedSignatureShare = JSON.parse(userShare.share) as MPCv2SignatureShareRound2Input;
  const serializedMessages = await DklsComms.decryptAndVerifyIncomingMessages(
    {
      p2pMessages: [
        {
          from: parsedSignatureShare.data.msg2.from,
          to: parsedSignatureShare.data.msg2.to,
          payload: {
            encryptedMessage: parsedSignatureShare.data.msg2.encryptedMessage,
            signature: parsedSignatureShare.data.msg2.signature,
          },
        },
        {
          from: parsedSignatureShare.data.msg3.from,
          to: parsedSignatureShare.data.msg3.to,
          payload: {
            encryptedMessage: parsedSignatureShare.data.msg3.encryptedMessage,
            signature: parsedSignatureShare.data.msg3.signature,
          },
        },
      ],
      broadcastMessages: [],
    },
    [getUserPartyGpgKeyPublic(userGPGPubKey)],
    [getBitGoPartyGpgKeyPrv(bitgoGpgKey.private)]
  );
  const deserializedMessages2 = DklsTypes.deserializeMessages({
    p2pMessages: [serializedMessages.p2pMessages[0]],
    broadcastMessages: [],
  });

  const bitgoToUserRound3Msg = bitgoSession.handleIncomingMessages(deserializedMessages2);
  const serializedBitGoToUserRound3Msgs = DklsTypes.serializeMessages(bitgoToUserRound3Msg);

  const authEncMessages = await DklsComms.encryptAndAuthOutgoingMessages(
    serializedBitGoToUserRound3Msgs,
    [getUserPartyGpgKeyPublic(userGPGPubKey)],
    [getBitGoPartyGpgKeyPrv(bitgoGpgKey.private)]
  );

  const bitgoToUserSignatureShare: MPCv2SignatureShareRound2Output = {
    type: 'round2Output',
    data: {
      msg3: {
        from: authEncMessages.p2pMessages[0].from as MPCv2PartyFromStringOrNumber,
        to: authEncMessages.p2pMessages[0].to as MPCv2PartyFromStringOrNumber,
        encryptedMessage: authEncMessages.p2pMessages[0].payload.encryptedMessage,
        signature: authEncMessages.p2pMessages[0].payload.signature,
      },
    },
  };

  // handling user msg3 but not returning bitgo msg4 since its stored on bitgo side only
  const deserializedMessages3 = DklsTypes.deserializeMessages({
    p2pMessages: [serializedMessages.p2pMessages[1]],
    broadcastMessages: [],
  });
  const deserializedBitgoMsg4 = bitgoSession.handleIncomingMessages(deserializedMessages3);
  const serializedBitGoToUserRound4Msgs = DklsTypes.serializeMessages(deserializedBitgoMsg4);

  txRequest.transactions[0].signatureShares.push({
    from: SignatureShareType.BITGO,
    to: SignatureShareType.USER,
    share: JSON.stringify(bitgoToUserSignatureShare),
  });
  return { txRequest, bitgoMsg4: serializedBitGoToUserRound4Msgs.broadcastMessages[0] };
}

async function signBitgoMPCv2Round3(
  bitgoSession: DklsDsg.Dsg,
  userShare: SignatureShareRecord,
  userGPGPubKey: string
): Promise<{ userMsg4: MPCv2SignatureShareRound3Input }> {
  const parsedSignatureShare = JSON.parse(userShare.share) as MPCv2SignatureShareRound3Input;
  const msg4 = parsedSignatureShare.data.msg4;
  const signatureRAuthMessage =
    msg4.signatureR && msg4.signatureRSignature
      ? { message: msg4.signatureR, signature: msg4.signatureRSignature }
      : undefined;
  const serializedMessages = await DklsComms.decryptAndVerifyIncomingMessages(
    {
      p2pMessages: [],
      broadcastMessages: [
        {
          from: msg4.from,
          payload: {
            message: msg4.message,
            signature: msg4.signature,
          },
          signatureR: signatureRAuthMessage,
        },
      ],
    },
    [getUserPartyGpgKeyPublic(userGPGPubKey)],
    [getBitGoPartyGpgKeyPrv(bitgoGpgKey.private)]
  );
  const deserializedMessages = DklsTypes.deserializeMessages({
    p2pMessages: [],
    broadcastMessages: [serializedMessages.broadcastMessages[0]],
  });
  bitgoSession.handleIncomingMessages(deserializedMessages);

  return {
    userMsg4: parsedSignatureShare,
  };
}
