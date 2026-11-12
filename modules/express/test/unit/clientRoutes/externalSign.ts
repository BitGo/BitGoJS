/**
 * @prettier
 */

import {
  common,
  Ed25519BIP32,
  Eddsa,
  EddsaMPCv2Utils,
  Ecdsa,
  HDTree,
  SignatureShareType,
  ShareType,
  ShareKeyPosition,
  TxRequest,
  SignatureShareRecord,
  BitgoMpcGpgPubKeys,
} from '@bitgo/sdk-core';
import { Hash, createPublicKey, randomBytes, verify as cryptoVerify } from 'crypto';
import { logger } from '@bitgo/logger';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import * as should from 'should';
import * as sinon from 'sinon';
import {
  EcdsaPaillierProof,
  EcdsaTypes,
  hexToBigInt,
  DklsUtils,
  DklsTypes,
  DklsComms,
  DklsDsg,
  EddsaMPSDsg,
  MPSUtil,
  MPSComms,
  MPSTypes,
} from '@bitgo/sdk-lib-mpc';
import {
  MPCv2PartyFromStringOrNumber,
  MPCv2SignatureShareRound1Input,
  MPCv2SignatureShareRound1Output,
  MPCv2SignatureShareRound2Input,
  MPCv2SignatureShareRound2Output,
  MPCv2SignatureShareRound3Input,
  EddsaMPCv2SignatureShareRound1Input,
  EddsaMPCv2SignatureShareRound1Output,
  EddsaMPCv2SignatureShareRound2Input,
  EddsaMPCv2SignatureShareRound2Output,
  EddsaMPCv2SignatureShareRound3Input,
} from '@bitgo/public-types';
import * as assert from 'assert';
import nock from 'nock';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import 'should-http';
import 'should-sinon';
import '../../lib/asserts';

import {
  createCustomEddsaMPCv2SigningRound1Generator,
  createCustomEddsaMPCv2SigningRound2Generator,
  createCustomEddsaMPCv2SigningRound3Generator,
  handleV2GenerateShareTSS,
  handleV2Sign,
  handleV2SignTSSWalletTx,
} from '../../../src/clientRoutes';
import { fetchKeys } from '../../../src/fetchEncryptedPrivKeys';
import {
  ConsumedShareRegistry,
  computeConsumedShareKey,
  resetConsumedShareRegistriesForTesting,
} from '../../../src/consumedSharesRegistry';
import { mockChallengeA, mockChallengeB } from './mocks/ecdsaNtilde';
import { ExpressApiRouteRequest } from '../../../src/typedRoutes/api';
import { Coin, BitGo, SignedTransaction } from 'bitgo';
import { keyShareOneEcdsa, keyShareTwoEcdsa, keyShareThreeEcdsa } from './mocks/keyShares';
import { bitgoGpgKey } from './mocks/gpgKeys';

const createKeccakHash = require('keccak');
nock.restore();

type Output = {
  [key: string]: string;
};

describe('External signer', () => {
  let bitgo: TestBitGoAPI;
  let bgUrl;
  let MPC: Eddsa;
  let mpcEcdsa: Ecdsa;
  let hdTree: HDTree;

  const walletId = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6';
  const walletPassword = 'test-wallet-passphrase';
  const secret =
    'xprv9s21ZrQH143K3EuPWCBuqnWxydaQV6et9htQige4EswvcHKEzNmkVmwTwKoadyHzJYppuADB7Us7AbaNLToNvoFoSxuWqndQRYtnNy5DUY2';
  let validPrv: string;

  before(async function () {
    if (!nock.isActive()) {
      nock.activate();
    }

    bitgo = TestBitGo.decorate(BitGo, { env: 'test' });
    bitgo.initializeTestVars();

    const encryptedPrv = await bitgo.encrypt({
      password: walletPassword,
      input: secret,
      encryptionVersion: 1,
    });
    validPrv = JSON.stringify({ [walletId]: encryptedPrv });

    bgUrl = common.Environments[bitgo.getEnv()].uri;
    hdTree = await Ed25519BIP32.initialize();
    MPC = await Eddsa.initialize(hdTree);
    mpcEcdsa = new Ecdsa();

    const constants = {
      mpc: {
        bitgoPublicKey: bitgoGpgKey.public,
        bitgoMPCv2PublicKey: bitgoGpgKey.public,
      },
    };

    nock(bgUrl).get('/api/v1/client/constants').times(10).reply(200, { ttl: 3600, constants });
  });

  after(() => {
    if (nock.isActive()) {
      nock.restore();
    }
  });

  it('should read an encrypted prv from signerFileSystemPath and pass it to coin.signTransaction', async () => {
    const readFileStub = sinon.stub(fs.promises, 'readFile').resolves(validPrv);
    const envStub = sinon.stub(process, 'env').value({ [`WALLET_${walletId}_PASSPHRASE`]: walletPassword });
    const signTransactionStub = sinon
      .stub(Coin.Btc.prototype, 'signTransaction')
      .resolves({ txHex: 'signedTx', txRequestId: '' } as SignedTransaction);

    const req = {
      bitgo: bitgo,
      body: {
        txPrebuild: {
          walletId: walletId,
        },
      },
      params: {
        coin: 'tbtc',
      },
      decoded: {
        coin: 'tbtc',
        txPrebuild: {
          walletId: walletId,
        },
      },
      config: {
        signerFileSystemPath: 'signerFileSystemPath',
      },
    } as any;

    await handleV2Sign(req);

    readFileStub.calledOnceWith('signerFileSystemPath').should.be.true();
    signTransactionStub
      .calledOnceWith(
        sinon.match({
          prv: secret,
        })
      )
      .should.be.true();
    readFileStub.restore();
    signTransactionStub.restore();
    envStub.restore();
  });

  // Runs a full PaillierModulus -> K -> MuDelta -> S external-signing session through
  // handleV2GenerateShareTSS and returns the requests/results so replay tests can re-send them.
  async function runEcdsaSigningSession(
    opts: { signerRegistryFilePath?: string; registrySameAsFileSystem?: boolean } = {}
  ) {
    const walletID = '62fe536a6b4cf70007acb48c0e7bb0b0';
    const user = keyShareOneEcdsa; // await mpcEcdsa.keyShare(1, 2, 3);
    const backup = keyShareTwoEcdsa; // await mpcEcdsa.keyShare(2, 2, 3);
    const bitgo = keyShareThreeEcdsa; // await mpcEcdsa.keyShare(3, 2, 3);
    const bitgoCombinedKey = await mpcEcdsa.keyCombine(bitgo.pShare, [backup.nShares[3], user.nShares[3]]);
    const userChallenge = mockChallengeA;
    const bitgoChallenge = mockChallengeB;
    const userSigningMaterial = {
      pShare: user.pShare,
      bitgoNShare: bitgo.nShares[1],
      backupNShare: backup.nShares[1],
    };
    const bg = new BitGo({ env: 'test' });
    const walletPassphrase = 'testPass';
    const validPrv = await bg.encrypt({ input: JSON.stringify(userSigningMaterial), password: walletPassphrase });
    const output: Output = {};
    output[walletID] = validPrv;
    const readFileStub = sinon.stub(fs.promises, 'readFile').resolves(JSON.stringify(output));
    // Unique temp path per session so the real consumed-shares persistence writes to a throwaway file
    const signerTmpPath = path.join(
      os.tmpdir(),
      `bitgojs-test-signer-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    const envStub = sinon
      .stub(process, 'env')
      .value({ WALLET_62fe536a6b4cf70007acb48c0e7bb0b0_PASSPHRASE: walletPassphrase });
    resetConsumedShareRegistriesForTesting();
    try {
      const tMessage = 'testMessage';
      const bgTest = new BitGo({ env: 'test' });
      const derivationPath = '';
      const reqPaillierModulus = {
        bitgo: bgTest,
        body: {
          txRequest: {
            apiVersion: 'full',
            walletId: walletID,
            transactions: [
              {
                unsignedTx: {
                  derivationPath,
                  signableHex: tMessage,
                },
              },
            ],
          },
        },
        decoded: {
          coin: 'tbsc',
          sharetype: 'PaillierModulus',
          txRequest: {
            apiVersion: 'full',
            walletId: walletID,
            transactions: [
              {
                unsignedTx: {
                  derivationPath,
                  signableHex: tMessage,
                },
              },
            ],
          },
        },
        params: {
          coin: 'tbsc',
          sharetype: 'PaillierModulus',
        },
        config: {
          signerFileSystemPath: signerTmpPath,
          signerRegistryFilePath: opts.registrySameAsFileSystem ? signerTmpPath : opts.signerRegistryFilePath,
        },
      } as unknown as ExpressApiRouteRequest<'express.v2.tssshare.generate', 'post'>;
      const paillierResult = await handleV2GenerateShareTSS(reqPaillierModulus);
      paillierResult.should.have.property('userPaillierModulus');
      const userPaillierModulus = paillierResult.userPaillierModulus;
      const [bitgoToUserPaillierChallenge, userToBitgoPaillierChallenge] = await Promise.all([
        EcdsaPaillierProof.generateP(hexToBigInt(userPaillierModulus)),
        EcdsaPaillierProof.generateP(hexToBigInt(bitgoCombinedKey.yShares[1].n)),
      ]);
      const reqK = {
        bitgo: bgTest,
        body: {
          tssParams: {
            txRequest: {
              apiVersion: 'full',
              walletId: walletID,
              transactions: [
                {
                  unsignedTx: {
                    derivationPath,
                    signableHex: tMessage,
                  },
                },
              ],
            },
          },
          challenges: {
            enterpriseChallenge: {
              ntilde: userChallenge.ntilde,
              h1: userChallenge.h1,
              h2: userChallenge.h2,
              p: EcdsaTypes.serializePaillierChallenge({ p: userToBitgoPaillierChallenge }).p,
            },
            bitgoChallenge: {
              ntilde: bitgoChallenge.ntilde,
              h1: bitgoChallenge.h1,
              h2: bitgoChallenge.h2,
              p: EcdsaTypes.serializePaillierChallenge({ p: bitgoToUserPaillierChallenge }).p,
              n: bitgo.pShare.n,
            },
          },
          requestType: 0,
        },
        decoded: {
          coin: 'tbsc',
          sharetype: 'K',
          tssParams: {
            txRequest: {
              apiVersion: 'full',
              walletId: walletID,
              transactions: [
                {
                  unsignedTx: {
                    derivationPath,
                    signableHex: tMessage,
                  },
                },
              ],
            },
          },
          challenges: {
            enterpriseChallenge: {
              ntilde: userChallenge.ntilde,
              h1: userChallenge.h1,
              h2: userChallenge.h2,
              p: EcdsaTypes.serializePaillierChallenge({ p: userToBitgoPaillierChallenge }).p,
            },
            bitgoChallenge: {
              ntilde: bitgoChallenge.ntilde,
              h1: bitgoChallenge.h1,
              h2: bitgoChallenge.h2,
              p: EcdsaTypes.serializePaillierChallenge({ p: bitgoToUserPaillierChallenge }).p,
              n: bitgo.pShare.n,
            },
          },
          requestType: 0,
        },
        params: {
          coin: 'tbsc',
          sharetype: 'K',
        },
        config: {
          signerFileSystemPath: signerTmpPath,
          signerRegistryFilePath: opts.registrySameAsFileSystem ? signerTmpPath : opts.signerRegistryFilePath,
        },
      } as unknown as ExpressApiRouteRequest<'express.v2.tssshare.generate', 'post'>;
      const kResult = await handleV2GenerateShareTSS(reqK);
      kResult.should.have.property('kShare');
      kResult.should.have.property('wShare');
      const aShareFromBitgo = await mpcEcdsa.signConvertStep1({
        xShare: mpcEcdsa.appendChallenge(
          bitgoCombinedKey.xShare,
          bitgoChallenge,
          EcdsaTypes.serializePaillierChallenge({ p: bitgoToUserPaillierChallenge })
        ),
        yShare: bitgoCombinedKey.yShares[1],
        kShare: kResult.kShare,
      });
      const reqMuDelta = {
        bitgo: bgTest,
        body: {
          tssParams: {
            txRequest: {
              apiVersion: 'full',
              walletId: walletID,
              transactions: [
                {
                  unsignedTx: {
                    derivationPath,
                    signableHex: tMessage,
                  },
                },
              ],
            },
          },
          requestType: 0,
          aShareFromBitgo: aShareFromBitgo.aShare,
          bitgoChallenge: {
            ntilde: bitgoChallenge.ntilde,
            h1: bitgoChallenge.h1,
            h2: bitgoChallenge.h2,
            p: EcdsaTypes.serializePaillierChallenge({ p: bitgoToUserPaillierChallenge }).p,
            n: bitgo.pShare.n,
          },
          encryptedWShare: kResult.wShare,
        },
        decoded: {
          coin: 'tbsc',
          sharetype: 'MuDelta',
          tssParams: {
            txRequest: {
              apiVersion: 'full',
              walletId: walletID,
              transactions: [
                {
                  unsignedTx: {
                    derivationPath,
                    signableHex: tMessage,
                  },
                },
              ],
            },
          },
          requestType: 0,
          aShareFromBitgo: aShareFromBitgo.aShare,
          bitgoChallenge: {
            ntilde: bitgoChallenge.ntilde,
            h1: bitgoChallenge.h1,
            h2: bitgoChallenge.h2,
            p: EcdsaTypes.serializePaillierChallenge({ p: bitgoToUserPaillierChallenge }).p,
            n: bitgo.pShare.n,
          },
          encryptedWShare: kResult.wShare,
        },
        params: {
          coin: 'tbsc',
          sharetype: 'MuDelta',
        },
        config: {
          signerFileSystemPath: signerTmpPath,
          signerRegistryFilePath: opts.registrySameAsFileSystem ? signerTmpPath : opts.signerRegistryFilePath,
        },
      } as unknown as ExpressApiRouteRequest<'express.v2.tssshare.generate', 'post'>;
      const muDeltaResult = await handleV2GenerateShareTSS(reqMuDelta);
      muDeltaResult.should.have.property('muDShare');
      muDeltaResult.should.have.property('oShare');
      const bitgoGShare = await mpcEcdsa.signConvertStep3({
        bShare: aShareFromBitgo.bShare,
        muShare: muDeltaResult.muDShare.muShare,
      });
      const bitgoDShare = mpcEcdsa.signCombine({
        gShare: bitgoGShare.gShare,
        signIndex: {
          i: 1,
          j: 3,
        },
      });
      const reqS = {
        bitgo: bgTest,
        body: {
          tssParams: {
            txRequest: {
              apiVersion: 'full',
              walletId: walletID,
              transactions: [
                {
                  unsignedTx: {
                    derivationPath,
                    signableHex: tMessage,
                  },
                },
              ],
            },
          },
          dShareFromBitgo: bitgoDShare.dShare,
          requestType: 0,
          encryptedOShare: muDeltaResult.oShare,
        },
        decoded: {
          coin: 'tbsc',
          sharetype: 'S',
          tssParams: {
            txRequest: {
              apiVersion: 'full',
              walletId: walletID,
              transactions: [
                {
                  unsignedTx: {
                    derivationPath,
                    signableHex: tMessage,
                  },
                },
              ],
            },
          },
          dShareFromBitgo: bitgoDShare.dShare,
          requestType: 0,
          encryptedOShare: muDeltaResult.oShare,
        },
        params: {
          coin: 'tbsc',
          sharetype: 'S',
        },
        config: {
          signerFileSystemPath: signerTmpPath,
          signerRegistryFilePath: opts.registrySameAsFileSystem ? signerTmpPath : opts.signerRegistryFilePath,
        },
      } as unknown as ExpressApiRouteRequest<'express.v2.tssshare.generate', 'post'>;
      const sResult = await handleV2GenerateShareTSS(reqS);
      sResult.should.have.property('R');
      sResult.should.have.property('s');
      sResult.should.have.property('y');
      const bitGoSShare = mpcEcdsa.sign(
        Buffer.from(tMessage, 'hex'),
        bitgoDShare.oShare,
        muDeltaResult.muDShare.dShare,
        createKeccakHash('keccak256') as Hash
      );
      const signature = mpcEcdsa.constructSignature([bitGoSShare, sResult]);
      mpcEcdsa.verify(Buffer.from(tMessage, 'hex'), signature, createKeccakHash('keccak256') as Hash).should.be.true;
      fs.promises.unlink(`${signerTmpPath}.consumedShares.json`).catch(() => undefined);
      const cleanup = () => {
        readFileStub.restore();
        envStub.restore();
      };
      return { reqMuDelta, reqS, kResult, muDeltaResult, sResult, cleanup };
    } catch (e) {
      readFileStub.restore();
      envStub.restore();
      throw e;
    }
  }

  it('should read an encrypted prv from signerFileSystemPath and pass it to PaillierModulus, K, MuDelta, and S share generators', async function () {
    // This test performs multiple MPC ECDSA rounds and can exceed Mocha's default 60s timeout on CI
    this.timeout(180000);
    const { sResult, cleanup } = await runEcdsaSigningSession();
    try {
      sResult.should.have.property('R');
      sResult.should.have.property('s');
      sResult.should.have.property('y');
    } finally {
      cleanup();
    }
  });

  it('should reject a replayed MuDelta wShare ciphertext', async function () {
    this.timeout(180000);
    const { reqMuDelta, cleanup } = await runEcdsaSigningSession();
    try {
      await handleV2GenerateShareTSS(reqMuDelta).should.be.rejectedWith(
        'encrypted share has already been consumed; restart the signing session'
      );
    } finally {
      cleanup();
    }
  });

  it('should reject a replayed S oShare ciphertext', async function () {
    this.timeout(180000);
    const { reqS, cleanup } = await runEcdsaSigningSession();
    try {
      await handleV2GenerateShareTSS(reqS).should.be.rejectedWith(
        'encrypted share has already been consumed; restart the signing session'
      );
    } finally {
      cleanup();
    }
  });

  it('should reject an S replay with a different dShareFromBitgo (nonce-reuse attempt)', async function () {
    this.timeout(180000);
    const { reqS, cleanup } = await runEcdsaSigningSession();
    try {
      // same oShare ciphertext, different dShare: must be rejected by the registry before signing
      const tamperDelta = (share: { delta: string } | undefined) => {
        assert.ok(share && typeof share.delta === 'string', 'S request must carry dShareFromBitgo with a delta');
        share.delta = 'ff' + share.delta.slice(2);
      };
      tamperDelta('dShareFromBitgo' in reqS.body ? reqS.body.dShareFromBitgo : undefined);
      tamperDelta('dShareFromBitgo' in reqS.decoded ? reqS.decoded.dShareFromBitgo : undefined);
      await handleV2GenerateShareTSS(reqS).should.be.rejectedWith(
        'encrypted share has already been consumed; restart the signing session'
      );
    } finally {
      cleanup();
    }
  });

  it('should complete a fresh signing session after a rejected replay', async function () {
    this.timeout(180000);
    const first = await runEcdsaSigningSession(); // first session consumes its shares
    first.cleanup();
    const second = await runEcdsaSigningSession(); // fresh K -> new ciphertexts
    try {
      second.sResult.should.have.property('R');
      second.sResult.should.have.property('s');
      second.sResult.should.have.property('y');
    } finally {
      second.cleanup();
    }
  });

  describe('ConsumedShareRegistry', () => {
    let tempDir: string;
    // adata-based keys: the key is sha256(shareType:validatedAdata), so the envelope's
    // byte-level form (JSON serialization, iv/ct encoding) cannot change it.
    const adata = 'GG18_SIGNING_WSHARE_STATE:1730000000000:abc123:m/0';
    const key = computeConsumedShareKey('S', adata);

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bitgojs-registry-test-'));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('should reject a replay after a restart (state survives in the file)', () => {
      const registryFile = path.join(tempDir, 'registry.json');
      new ConsumedShareRegistry(registryFile).markConsumed(key);
      (() => new ConsumedShareRegistry(registryFile).markConsumed(key)).should.throw(
        'encrypted share has already been consumed; restart the signing session'
      );
    });

    it('should give re-serialized envelopes the same adata identity (AEAD-protected)', () => {
      // adata lives inside the AEAD-protected envelope: wrapper re-serialization cannot
      // alter it, so the validated adata — and therefore the key — is stable.
      const registryFile = path.join(tempDir, 'registry.json');
      const registry = new ConsumedShareRegistry(registryFile);
      registry.markConsumed(key);
      const sameAdataDifferentSpelling = 'GG18_SIGNING_WSHARE_STATE:1730000000000:abc123:m/0';
      (() => registry.markConsumed(computeConsumedShareKey('S', sameAdataDifferentSpelling))).should.throw(
        'encrypted share has already been consumed; restart the signing session'
      );
    });

    it('should fail closed when the registry file is corrupt', () => {
      const registryFile = path.join(tempDir, 'registry.json');
      fs.writeFileSync(registryFile, 'not json');
      (() => new ConsumedShareRegistry(registryFile).markConsumed(key)).should.throw(
        /failed to parse consumed share registry/
      );
    });

    it('should fail closed when the registry file is unreadable', () => {
      // a directory at the registry path: reads fail with EISDIR, not ENOENT
      const registryPath = path.join(tempDir, 'registry-dir');
      fs.mkdirSync(registryPath);
      (() => new ConsumedShareRegistry(registryPath).markConsumed(key)).should.throw(
        /failed to read consumed share registry/
      );
    });

    it('should degrade to in-memory protection when persisting fails', () => {
      const registryFile = path.join(tempDir, 'registry.json');
      const registry = new ConsumedShareRegistry(registryFile);
      registry.markConsumed(key);
      // Replace the registry file with a directory: the atomic rename (temp file ->
      // registry) fails with EISDIR regardless of process privileges — root ignores
      // permission bits, so a chmod-based failure would not reproduce for root runs.
      fs.rmSync(registryFile);
      fs.mkdirSync(registryFile);
      // The signer never assumes file write access: a persist failure must not fail the
      // request — protection degrades to in-memory only (lost on restart).
      const newKey = computeConsumedShareKey('S', 'GG18_SIGNING_OSHARE_STATE:1730000001000:def456:m/0');
      registry.markConsumed(newKey);
      // the failed-persist entry is still recorded in memory: replaying it is rejected
      (() => registry.markConsumed(newKey)).should.throw(
        'encrypted share has already been consumed; restart the signing session'
      );
      // the first share is still considered consumed in memory
      (() => registry.markConsumed(key)).should.throw(
        'encrypted share has already been consumed; restart the signing session'
      );
    });
  });

  it('should deny a signerRegistryFilePath equal to signerFileSystemPath', async function () {
    this.timeout(180000);
    // equal paths would make the first GG18 signature overwrite the encrypted private keys
    await runEcdsaSigningSession({ registrySameAsFileSystem: true }).should.be.rejectedWith(
      'signerRegistryFilePath must not equal signerFileSystemPath — the consumed-share registry would overwrite the encrypted private keys file.'
    );
  });

  it('should honor a signerRegistryFilePath override for the consumed-share registry', async function () {
    this.timeout(180000);
    const overridePath = path.join(os.tmpdir(), `bitgojs-registry-override-${process.pid}-${Date.now()}.json`);
    const { cleanup } = await runEcdsaSigningSession({ signerRegistryFilePath: overridePath });
    try {
      fs.existsSync(overridePath).should.be.true('registry must be persisted at the override path');
      const entries = JSON.parse(fs.readFileSync(overridePath, 'utf8'));
      Object.keys(entries).length.should.be.greaterThan(0);
    } finally {
      cleanup();
      fs.promises.unlink(overridePath).catch(() => undefined);
    }
  });

  it('should read an encrypted prv from signerFileSystemPath and pass it to commitment, R and G share generators', async () => {
    const walletID = '62fe536a6b4cf70007acb48c0e7bb0b0';
    const user = MPC.keyShare(1, 2, 3);
    const backup = MPC.keyShare(2, 2, 3);
    const bitgo = MPC.keyShare(3, 2, 3);
    const userSigningMaterial = {
      uShare: user.uShare,
      bitgoYShare: bitgo.yShares[1],
      backupYShare: backup.yShares[1],
    };
    const bg = new BitGo({ env: 'test' });
    const walletPassphrase = 'testPass';
    const validPrv = await bg.encrypt({ input: JSON.stringify(userSigningMaterial), password: walletPassphrase });
    const output: Output = {};
    output[walletID] = validPrv;
    const readFileStub = sinon.stub(fs.promises, 'readFile').resolves(JSON.stringify(output));
    const envStub = sinon
      .stub(process, 'env')
      .value({ WALLET_62fe536a6b4cf70007acb48c0e7bb0b0_PASSPHRASE: walletPassphrase });
    const tMessage = 'testMessage';
    const bgTest = new BitGo({ env: 'test' });
    const derivationPath = 'm/0';

    const reqCommitment = {
      bitgo: bgTest,
      body: {
        bitgoGpgPubKey: bitgoGpgKey.public,
        txRequest: {
          apiVersion: 'full',
          walletId: walletID,
          transactions: [
            {
              unsignedTx: {
                derivationPath,
                signableHex: tMessage,
              },
            },
          ],
        },
      },
      decoded: {
        coin: 'tsol',
        sharetype: 'commitment',
        bitgoGpgPubKey: bitgoGpgKey.public,
        txRequest: {
          apiVersion: 'full',
          walletId: walletID,
          transactions: [
            {
              unsignedTx: {
                derivationPath,
                signableHex: tMessage,
              },
            },
          ],
        },
      },
      params: {
        coin: 'tsol',
        sharetype: 'commitment',
      },
      config: {
        signerFileSystemPath: 'signerFileSystemPath',
      },
    } as unknown as ExpressApiRouteRequest<'express.v2.tssshare.generate', 'post'>;
    const cResult = await handleV2GenerateShareTSS(reqCommitment);
    cResult.should.have.property('userToBitgoCommitment');
    cResult.should.have.property('encryptedSignerShare');
    cResult.should.have.property('encryptedUserToBitgoRShare');
    const encryptedUserToBitgoRShare = cResult.encryptedUserToBitgoRShare;
    const reqR = {
      bitgo: bgTest,
      body: {
        txRequest: {
          apiVersion: 'full',
          walletId: walletID,
          transactions: [
            {
              unsignedTx: {
                derivationPath,
                signableHex: tMessage,
              },
            },
          ],
        },
        encryptedUserToBitgoRShare,
      },
      decoded: {
        coin: 'tsol',
        sharetype: 'R',
        txRequest: {
          apiVersion: 'full',
          walletId: walletID,
          transactions: [
            {
              unsignedTx: {
                derivationPath,
                signableHex: tMessage,
              },
            },
          ],
        },
        encryptedUserToBitgoRShare,
      },
      params: {
        coin: 'tsol',
        sharetype: 'R',
      },
      config: {
        signerFileSystemPath: 'signerFileSystemPath',
      },
    } as unknown as ExpressApiRouteRequest<'express.v2.tssshare.generate', 'post'>;
    const rResult = await handleV2GenerateShareTSS(reqR);
    rResult.should.have.property('rShare');

    const signingKey = MPC.keyDerive(
      userSigningMaterial.uShare,
      [userSigningMaterial.bitgoYShare, userSigningMaterial.backupYShare],
      derivationPath
    );

    const bitgoCombine = MPC.keyCombine(bitgo.uShare, [signingKey.yShares[3], backup.yShares[3]]);
    const bitgoSignShare = await MPC.signShare(Buffer.from(tMessage, 'hex'), bitgoCombine.pShare, [
      bitgoCombine.jShares[1],
    ]);
    const signatureShareRec = {
      from: SignatureShareType.BITGO,
      to: SignatureShareType.USER,
      share: bitgoSignShare.rShares[1].r + bitgoSignShare.rShares[1].R,
    };
    const bitgoToUserCommitmentShare = {
      from: SignatureShareType.BITGO,
      to: SignatureShareType.USER,
      share: bitgoSignShare.rShares[1].commitment,
      type: 'commitment',
    };
    const reqG = {
      bitgo: bgTest,
      body: {
        txRequest: {
          apiVersion: 'full',
          walletId: walletID,
          transactions: [
            {
              unsignedTx: {
                derivationPath,
                signableHex: tMessage,
              },
            },
          ],
        },
        userToBitgoRShare: rResult.rShare,
        bitgoToUserRShare: signatureShareRec,
        bitgoToUserCommitment: bitgoToUserCommitmentShare,
      },
      decoded: {
        coin: 'tsol',
        sharetype: 'G',
        txRequest: {
          apiVersion: 'full',
          walletId: walletID,
          transactions: [
            {
              unsignedTx: {
                derivationPath,
                signableHex: tMessage,
              },
            },
          ],
        },
        userToBitgoRShare: rResult.rShare,
        bitgoToUserRShare: signatureShareRec,
        bitgoToUserCommitment: bitgoToUserCommitmentShare,
      },
      params: {
        coin: 'tsol',
        sharetype: 'G',
      },
      config: {
        signerFileSystemPath: 'signerFileSystemPath',
      },
    } as unknown as ExpressApiRouteRequest<'express.v2.tssshare.generate', 'post'>;
    const userGShare = await handleV2GenerateShareTSS(reqG);
    userGShare.should.have.property('i');
    userGShare.should.have.property('y');
    userGShare.should.have.property('gamma');
    userGShare.should.have.property('R');
    const userToBitgoRShare = {
      i: ShareKeyPosition.BITGO,
      j: ShareKeyPosition.USER,
      u: signingKey.yShares[3].u,
      v: rResult.rShare.rShares[3].v,
      r: rResult.rShare.rShares[3].r,
      R: rResult.rShare.rShares[3].R,
      commitment: rResult.rShare.rShares[3].commitment,
    };
    const bitgoGShare = MPC.sign(
      Buffer.from(tMessage, 'hex'),
      bitgoSignShare.xShare,
      [userToBitgoRShare],
      [backup.yShares[3]]
    );
    const signature = MPC.signCombine([userGShare, bitgoGShare]);
    const veriResult = MPC.verify(Buffer.from(tMessage, 'hex'), signature);
    veriResult.should.be.true();
    readFileStub.restore();
    envStub.restore();
  });

  it('should route EdDSA MPCv2 share types to offline round share generators', async function () {
    const bgTest = new BitGo({ env: 'test' });
    const readFileStub = sinon.stub(fs.promises, 'readFile').resolves(validPrv);
    const envStub = sinon.stub(process, 'env').value({ ['WALLET_' + walletId + '_PASSPHRASE']: walletPassword });
    const round1Response = {
      signatureShareRound1: { from: SignatureShareType.USER, to: SignatureShareType.BITGO, share: 'round1' },
      userGpgPubKey: 'userGpgPubKey',
      encryptedRound1Session: 'encryptedRound1Session',
      encryptedUserGpgPrvKey: 'encryptedUserGpgPrvKey',
    };
    const round2Response = {
      signatureShareRound2: { from: SignatureShareType.USER, to: SignatureShareType.BITGO, share: 'round2' },
      encryptedRound2Session: 'encryptedRound2Session',
    };
    const round3Response = {
      signatureShareRound3: { from: SignatureShareType.USER, to: SignatureShareType.BITGO, share: 'round3' },
    };
    const round1Stub = sinon.stub(EddsaMPCv2Utils.prototype, 'createOfflineRound1Share').resolves(round1Response);
    const round2Stub = sinon.stub(EddsaMPCv2Utils.prototype, 'createOfflineRound2Share').resolves(round2Response);
    const round3Stub = sinon.stub(EddsaMPCv2Utils.prototype, 'createOfflineRound3Share').resolves(round3Response);
    // Round 2/3 now durably mark the encrypted session consumed before the generator runs;
    // supply parseable fake envelopes and a throwaway registry path.
    const stubTestSignerPath = path.join(
      os.tmpdir(),
      `bitgojs-test-eddsa-routing-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    resetConsumedShareRegistriesForTesting();
    // The digest requires a v1 iv at least as long as the CCM nonce (13 bytes).
    const fakeEncryptedSession = JSON.stringify({
      iv: randomBytes(16).toString('base64'),
      ct: Buffer.from('ct').toString('base64'),
    });

    try {
      const round1Result = await handleV2GenerateShareTSS(
        createEddsaMPCv2GenerateShareRequest(bgTest, walletId, ShareType.EddsaMPCv2Round1)
      );
      round1Result.should.eql(round1Response);
      round1Stub.calledOnce.should.be.true();
      round1Stub.firstCall.args[0].prv.should.equal(secret);
      round1Stub.firstCall.args[0].walletPassphrase.should.equal(walletPassword);

      const round2Result = await handleV2GenerateShareTSS(
        createEddsaMPCv2GenerateShareRequest(
          bgTest,
          walletId,
          ShareType.EddsaMPCv2Round2,
          {
            encryptedRound1Session: fakeEncryptedSession,
          },
          stubTestSignerPath
        )
      );
      round2Result.should.eql(round2Response);
      round2Stub.calledOnce.should.be.true();

      const round3Result = await handleV2GenerateShareTSS(
        createEddsaMPCv2GenerateShareRequest(
          bgTest,
          walletId,
          ShareType.EddsaMPCv2Round3,
          {
            encryptedRound2Session: fakeEncryptedSession,
          },
          stubTestSignerPath
        )
      );
      round3Result.should.eql(round3Response);
      round3Stub.calledOnce.should.be.true();
    } finally {
      readFileStub.restore();
      envStub.restore();
      round1Stub.restore();
      round2Stub.restore();
      round3Stub.restore();
      fs.promises.unlink(`${stubTestSignerPath}.consumedShares.json`).catch(() => undefined);
    }
  });

  it('should throw a clear error for unsupported EdDSA MPCv2 share types', async function () {
    const bgTest = new BitGo({ env: 'test' });
    const readFileStub = sinon.stub(fs.promises, 'readFile').resolves(validPrv);
    const envStub = sinon.stub(process, 'env').value({ ['WALLET_' + walletId + '_PASSPHRASE']: walletPassword });
    const loggerErrorStub = sinon.stub(logger, 'error');

    try {
      await assert.rejects(
        handleV2GenerateShareTSS(createEddsaMPCv2GenerateShareRequest(bgTest, walletId, 'EddsaMPCv2Round4')),
        (error: Error) => {
          assert.match(error.message, /Share type EddsaMPCv2Round4 not supported for EdDSA MPCv2/);
          return true;
        }
      );
      loggerErrorStub.calledOnce.should.be.true();
    } finally {
      readFileStub.restore();
      envStub.restore();
      loggerErrorStub.restore();
    }
  });

  it('should create EdDSA MPCv2 external signer generators with correct route paths', async function () {
    const externalSignerUrl = 'http://external-signer.example';
    const coin = 'tsol';
    type Round1GeneratorParams = Parameters<ReturnType<typeof createCustomEddsaMPCv2SigningRound1Generator>>[0];
    type Round2GeneratorParams = Parameters<ReturnType<typeof createCustomEddsaMPCv2SigningRound2Generator>>[0];
    type Round3GeneratorParams = Parameters<ReturnType<typeof createCustomEddsaMPCv2SigningRound3Generator>>[0];
    const round1Params: Round1GeneratorParams = {
      txRequest: createExternalSignerTxRequest('round1TxRequestId'),
    };
    const round2Params: Round2GeneratorParams = {
      txRequest: createExternalSignerTxRequest('round2TxRequestId'),
      bitgoPublicGpgKey: 'bitgoPublicGpgKey',
      encryptedRound1Session: 'encryptedRound1Session',
      encryptedUserGpgPrvKey: 'encryptedUserGpgPrvKey',
    };
    const round3Params: Round3GeneratorParams = {
      txRequest: createExternalSignerTxRequest('round3TxRequestId'),
      bitgoPublicGpgKey: 'bitgoPublicGpgKey',
      encryptedRound2Session: 'encryptedRound2Session',
      encryptedUserGpgPrvKey: 'encryptedUserGpgPrvKey',
    };
    const round1Response = {
      signatureShareRound1: { from: SignatureShareType.USER, to: SignatureShareType.BITGO, share: 'round1' },
      userGpgPubKey: 'userGpgPubKey',
      encryptedRound1Session: 'encryptedRound1Session',
      encryptedUserGpgPrvKey: 'encryptedUserGpgPrvKey',
    };
    const round2Response = {
      signatureShareRound2: { from: SignatureShareType.USER, to: SignatureShareType.BITGO, share: 'round2' },
      encryptedRound2Session: 'encryptedRound2Session',
    };
    const round3Response = {
      signatureShareRound3: { from: SignatureShareType.USER, to: SignatureShareType.BITGO, share: 'round3' },
    };
    const matchRound1Body = sinon.spy((body: Round1GeneratorParams) => {
      assert.deepStrictEqual(body, round1Params);
      return true;
    });
    const matchRound2Body = sinon.spy((body: Round2GeneratorParams) => {
      assert.deepStrictEqual(body, round2Params);
      return true;
    });
    const matchRound3Body = sinon.spy((body: Round3GeneratorParams) => {
      assert.deepStrictEqual(body, round3Params);
      return true;
    });

    const round1Nock = nock(externalSignerUrl)
      .post(`/api/v2/${coin}/tssshare/EddsaMPCv2Round1`, (body: Round1GeneratorParams) => matchRound1Body(body))
      .reply(200, round1Response);
    const round2Nock = nock(externalSignerUrl)
      .post(`/api/v2/${coin}/tssshare/EddsaMPCv2Round2`, (body: Round2GeneratorParams) => matchRound2Body(body))
      .reply(200, round2Response);
    const round3Nock = nock(externalSignerUrl)
      .post(`/api/v2/${coin}/tssshare/EddsaMPCv2Round3`, (body: Round3GeneratorParams) => matchRound3Body(body))
      .reply(200, round3Response);

    const round1Result = await createCustomEddsaMPCv2SigningRound1Generator(externalSignerUrl, coin)(round1Params);
    const round2Result = await createCustomEddsaMPCv2SigningRound2Generator(externalSignerUrl, coin)(round2Params);
    const round3Result = await createCustomEddsaMPCv2SigningRound3Generator(externalSignerUrl, coin)(round3Params);

    round1Nock.done();
    round2Nock.done();
    round3Nock.done();
    matchRound1Body.calledOnce.should.be.true();
    matchRound2Body.calledOnce.should.be.true();
    matchRound3Body.calledOnce.should.be.true();
    round1Result.signatureShareRound1.share.should.equal(round1Response.signatureShareRound1.share);
    round2Result.signatureShareRound2.share.should.equal(round2Response.signatureShareRound2.share);
    round3Result.signatureShareRound3.share.should.equal(round3Response.signatureShareRound3.share);
  });

  it('should attach EdDSA MPCv2 external signer generators for MPCv2 wallets', async function () {
    const ensureCleanSigSharesAndSignTransaction = sinon.stub().callsFake(async (params) => {
      params.customEddsaMPCv2SigningRound1GenerationFunction.should.be.Function();
      params.customEddsaMPCv2SigningRound2GenerationFunction.should.be.Function();
      params.customEddsaMPCv2SigningRound3GenerationFunction.should.be.Function();
      should.not.exist(params.customCommitmentGeneratingFunction);
      should.not.exist(params.customRShareGeneratingFunction);
      should.not.exist(params.customGShareGeneratingFunction);
      return { txRequestId: 'signedTxRequestId' };
    });
    const wallet = {
      _wallet: { multisigTypeVersion: 'MPCv2' },
      ensureCleanSigSharesAndSignTransaction,
    };
    const coin = {
      getMPCAlgorithm: () => 'eddsa',
      wallets: () => ({ get: sinon.stub().resolves(wallet) }),
    };
    const req = {
      bitgo: { coin: sinon.stub().returns(coin) },
      body: { txRequestId: 'txRequestId' },
      decoded: { coin: 'tsol', id: 'walletId' },
      params: { coin: 'tsol' },
      config: { externalSignerUrl: 'http://external-signer.example' },
    } as any;

    const result = await handleV2SignTSSWalletTx(req);

    result.should.eql({ txRequestId: 'signedTxRequestId' });
    ensureCleanSigSharesAndSignTransaction.calledOnce.should.be.true();
  });

  it('should keep EdDSA v1 external signer generators for non-MPCv2 wallets', async function () {
    const ensureCleanSigSharesAndSignTransaction = sinon.stub().callsFake(async (params) => {
      params.customCommitmentGeneratingFunction.should.be.Function();
      params.customRShareGeneratingFunction.should.be.Function();
      params.customGShareGeneratingFunction.should.be.Function();
      should.not.exist(params.customEddsaMPCv2SigningRound1GenerationFunction);
      should.not.exist(params.customEddsaMPCv2SigningRound2GenerationFunction);
      should.not.exist(params.customEddsaMPCv2SigningRound3GenerationFunction);
      return { txRequestId: 'signedTxRequestId' };
    });
    const wallet = {
      _wallet: { multisigTypeVersion: 'MPCv1' },
      ensureCleanSigSharesAndSignTransaction,
    };
    const coin = {
      getMPCAlgorithm: () => 'eddsa',
      wallets: () => ({ get: sinon.stub().resolves(wallet) }),
    };
    const req = {
      bitgo: { coin: sinon.stub().returns(coin) },
      body: { txRequestId: 'txRequestId' },
      decoded: { coin: 'tsol', id: 'walletId' },
      params: { coin: 'tsol' },
      config: { externalSignerUrl: 'http://external-signer.example' },
    } as any;

    const result = await handleV2SignTSSWalletTx(req);

    result.should.eql({ txRequestId: 'signedTxRequestId' });
    ensureCleanSigSharesAndSignTransaction.calledOnce.should.be.true();
  });

  it('should read an encrypted prv from signerFileSystemPath and pass it to MPCv2Round1, MPCv2Round2 and MPCv2Round3 share generators', async function () {
    // MPCv2 DKLS flow is CPU-heavy; extend timeout for CI stability
    this.timeout(180000);
    const walletID = '62fe536a6b4cf70007acb48c0e7bb0b0';
    const tMessage = 'testMessage';
    const derivationPath = 'm/0';
    const walletPassphrase = 'testPass';

    const [userShare, backupShare, bitgoShare] = await DklsUtils.generateDKGKeyShares();
    assert.ok(backupShare, 'backupShare is not defined');

    const bgTest = new BitGo({ env: 'test' });
    const userKeyShare = userShare.getKeyShare().toString('base64');
    const validPrv = await bgTest.encrypt({ input: userKeyShare, password: walletPassphrase });
    const readFileStub = sinon.stub(fs.promises, 'readFile').resolves(JSON.stringify({ [walletID]: validPrv }));
    const envStub = sinon.stub(process, 'env').value({ ['WALLET_' + walletID + '_PASSPHRASE']: walletPassphrase });

    // round 1
    const reqMPCv2Round1 = {
      bitgo: bgTest,
      body: {
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
      },
      decoded: {
        coin: 'hteth',
        sharetype: 'MPCv2Round1',
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
      },
      params: {
        coin: 'hteth',
        sharetype: 'MPCv2Round1',
      },
      config: {
        signerFileSystemPath: 'signerFileSystemPath',
      },
    } as unknown as ExpressApiRouteRequest<'express.v2.tssshare.generate', 'post'>;
    const round1Result = await handleV2GenerateShareTSS(reqMPCv2Round1);
    round1Result.should.have.property('signatureShareRound1');
    round1Result.should.have.property('userGpgPubKey');
    round1Result.should.have.property('encryptedRound1Session');
    round1Result.should.have.property('encryptedUserGpgPrvKey');

    const hashFn = createKeccakHash('keccak256') as Hash;
    const hashBuffer = hashFn.update(Buffer.from(tMessage, 'hex')).digest();
    const bitgoSession = new DklsDsg.Dsg(bitgoShare.getKeyShare(), 2, derivationPath, hashBuffer);

    const txRequestRound1 = await signBitgoMPCv2Round1(
      bitgoSession,
      reqMPCv2Round1.body.txRequest,
      round1Result.signatureShareRound1,
      round1Result.userGpgPubKey
    );
    assert.ok(
      txRequestRound1.transactions &&
        txRequestRound1.transactions.length === 1 &&
        txRequestRound1.transactions[0].signatureShares.length === 2,
      'txRequestRound2.transactions is not an array of length 1 with 2 signatureShares'
    );

    // round 2
    const reqMPCv2Round2 = {
      bitgo: bgTest,
      body: {
        txRequest: txRequestRound1,
        encryptedRound1Session: round1Result.encryptedRound1Session,
        encryptedUserGpgPrvKey: round1Result.encryptedUserGpgPrvKey,
        bitgoPublicGpgKey: bitgoGpgKey.public,
      },
      decoded: {
        coin: 'hteth',
        sharetype: 'MPCv2Round2',
        txRequest: txRequestRound1,
        encryptedRound1Session: round1Result.encryptedRound1Session,
        encryptedUserGpgPrvKey: round1Result.encryptedUserGpgPrvKey,
        bitgoPublicGpgKey: bitgoGpgKey.public,
      },
      params: {
        coin: 'hteth',
        sharetype: 'MPCv2Round2',
      },
      config: {
        signerFileSystemPath: 'signerFileSystemPath',
      },
    } as unknown as ExpressApiRouteRequest<'express.v2.tssshare.generate', 'post'>;
    const round2Result = await handleV2GenerateShareTSS(reqMPCv2Round2);
    round2Result.should.have.property('signatureShareRound2');
    round2Result.should.have.property('encryptedRound2Session');

    const { txRequest: txRequestRound2, bitgoMsg4 } = await signBitgoMPCv2Round2(
      bitgoSession,
      reqMPCv2Round2.body.txRequest,
      round2Result.signatureShareRound2,
      round1Result.userGpgPubKey
    );
    assert.ok(
      txRequestRound2.transactions &&
        txRequestRound2.transactions.length === 1 &&
        txRequestRound2.transactions[0].signatureShares.length === 4,
      'txRequestRound2.transactions is not an array of length 1 with 4 signatureShares'
    );

    // round 3
    const reqMPCv2Round3 = {
      bitgo: bgTest,
      body: {
        txRequest: txRequestRound2,
        encryptedRound2Session: round2Result.encryptedRound2Session,
        encryptedUserGpgPrvKey: round1Result.encryptedUserGpgPrvKey,
        bitgoPublicGpgKey: bitgoGpgKey.public,
      },
      decoded: {
        coin: 'hteth',
        sharetype: 'MPCv2Round3',
        txRequest: txRequestRound2,
        encryptedRound2Session: round2Result.encryptedRound2Session,
        encryptedUserGpgPrvKey: round1Result.encryptedUserGpgPrvKey,
        bitgoPublicGpgKey: bitgoGpgKey.public,
      },
      params: {
        coin: 'hteth',
        sharetype: 'MPCv2Round3',
      },
      config: {
        signerFileSystemPath: 'signerFileSystemPath',
      },
    } as unknown as ExpressApiRouteRequest<'express.v2.tssshare.generate', 'post'>;
    const round3Result = await handleV2GenerateShareTSS(reqMPCv2Round3);
    round3Result.should.have.property('signatureShareRound3');

    const { userMsg4 } = await signBitgoMPCv2Round3(
      bitgoSession,
      round3Result.signatureShareRound3,
      round1Result.userGpgPubKey
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
      DklsTypes.getCommonKeychain(userShare.getKeyShare()),
      derivationPath,
      createKeccakHash('keccak256') as Hash
    );
    assert.ok(convertedSignature, 'Signature is not valid');
    assert.ok(convertedSignature.split(':').length === 4, 'Signature is not valid');
    readFileStub.restore();
    envStub.restore();
  });

  it('should read an encrypted prv from signerFileSystemPath and pass it to EddsaMPCv2Round1, EddsaMPCv2Round2 and EddsaMPCv2Round3 share generators', async function () {
    // EdDSA MPS DSG flow is CPU-heavy; extend timeout for CI stability
    this.timeout(180000);
    const walletID = '6a19371071fdd4b35159f3860fc3c4e2';
    // 16-byte hex — EdDSA takes raw message bytes (no prehashing required)
    const signableHex = 'deadbeef01020304deadbeef01020304';
    const derivationPath = 'm/0';
    const walletPassphrase = 'testPassEdDSA';

    const [userDkg, , bitgoDkg] = await MPSUtil.generateEdDsaDKGKeyShares();
    const userKeyShareBuffer = userDkg.getKeyShare();
    const bitgoKeyShareBuffer = bitgoDkg.getKeyShare();

    const bgTest = new BitGo({ env: 'test' });
    const userKeyShareB64 = userKeyShareBuffer.toString('base64');
    const validPrvEdDSA = await bgTest.encrypt({ input: userKeyShareB64, password: walletPassphrase });
    const readFileStub = sinon.stub(fs.promises, 'readFile').resolves(JSON.stringify({ [walletID]: validPrvEdDSA }));
    const envStub = sinon.stub(process, 'env').value({ ['WALLET_' + walletID + '_PASSPHRASE']: walletPassphrase });
    // Unique temp path so the durable consumed-session registry writes to a throwaway file
    const eddsaSignerTmpPath = path.join(
      os.tmpdir(),
      `bitgojs-test-eddsa-signer-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    resetConsumedShareRegistriesForTesting();

    // EdDSA MPCv2 requires ed25519 GPG keys (not secp256k1) for PGP-authenticated message exchange.
    // GPG auth is tested by the sdk-core unit tests; here we stub the comms layer so the test
    // exercises only the WASM DSG protocol without needing openpgp as a direct express dep.
    // Round 2/3 pin the BitGo GPG key in envs that require BitGo pub key config ('test' here),
    // so the request must carry the hardcoded BitGo onprem EdDSA MPCv2 public key.
    const pinnedBitgoGpgKey = BitgoMpcGpgPubKeys.getBitgoMpcGpgPubKey('test', 'onprem', 'eddsaMpcv2');
    const detachSignStub = sinon
      .stub(MPSComms, 'detachSignMpsMessage')
      .callsFake(async (rawBytes) => ({ message: Buffer.from(rawBytes).toString('base64'), signature: '' }));
    const verifyMsgStub = sinon
      .stub(MPSComms, 'verifyMpsMessage')
      .callsFake(async (msg) => Buffer.from(msg.message, 'base64'));

    // Initialise BitGo-side DSG session (party 2, co-signing with User party 0)
    const message = Buffer.from(signableHex, 'hex');
    const bitgoDsg = new EddsaMPSDsg.DSG(2 /* BITGO */);
    await bitgoDsg.initDsg(bitgoKeyShareBuffer, message, derivationPath, 0 /* USER */);

    const baseTxRequest = {
      txRequestId: 'eddsa-mpcv2-round-trip-test',
      apiVersion: 'full',
      walletId: walletID,
      transactions: [
        {
          unsignedTx: { derivationPath, signableHex },
          signatureShares: [] as SignatureShareRecord[],
        },
      ],
    } as unknown as TxRequest;

    // round 1
    const reqEdDSARound1 = {
      bitgo: bgTest,
      body: { txRequest: baseTxRequest },
      decoded: { coin: 'tsol', sharetype: 'EddsaMPCv2Round1', txRequest: baseTxRequest },
      params: { coin: 'tsol', sharetype: 'EddsaMPCv2Round1' },
      config: { signerFileSystemPath: eddsaSignerTmpPath },
    } as unknown as ExpressApiRouteRequest<'express.v2.tssshare.generate', 'post'>;

    const round1Result = await handleV2GenerateShareTSS(reqEdDSARound1);
    round1Result.should.have.property('signatureShareRound1');
    round1Result.should.have.property('userGpgPubKey');
    round1Result.should.have.property('encryptedRound1Session');
    round1Result.should.have.property('encryptedUserGpgPrvKey');

    const { txRequest: txRequestRound1, bitgoMsg2 } = await signBitgoEddsaMPCv2Round1(
      bitgoDsg,
      baseTxRequest,
      round1Result.signatureShareRound1,
      round1Result.userGpgPubKey
    );
    assert.ok(
      txRequestRound1.transactions &&
        txRequestRound1.transactions.length === 1 &&
        txRequestRound1.transactions[0].signatureShares.length === 2,
      'txRequestRound1 should have 2 signatureShares (user round1 + bitgo round1Output) after BitGo round 1'
    );

    // round 2
    const reqEdDSARound2 = {
      bitgo: bgTest,
      body: {
        txRequest: txRequestRound1,
        encryptedRound1Session: round1Result.encryptedRound1Session,
        encryptedUserGpgPrvKey: round1Result.encryptedUserGpgPrvKey,
        bitgoPublicGpgKey: pinnedBitgoGpgKey,
      },
      decoded: {
        coin: 'tsol',
        sharetype: 'EddsaMPCv2Round2',
        txRequest: txRequestRound1,
        encryptedRound1Session: round1Result.encryptedRound1Session,
        encryptedUserGpgPrvKey: round1Result.encryptedUserGpgPrvKey,
        bitgoPublicGpgKey: pinnedBitgoGpgKey,
      },
      params: { coin: 'tsol', sharetype: 'EddsaMPCv2Round2' },
      config: { signerFileSystemPath: eddsaSignerTmpPath },
    } as unknown as ExpressApiRouteRequest<'express.v2.tssshare.generate', 'post'>;

    const round2Result = await handleV2GenerateShareTSS(reqEdDSARound2);
    round2Result.should.have.property('signatureShareRound2');
    round2Result.should.have.property('encryptedRound2Session');

    const { txRequest: txRequestRound2, bitgoMsg3 } = await signBitgoEddsaMPCv2Round2(
      bitgoDsg,
      txRequestRound1,
      round2Result.signatureShareRound2,
      round1Result.userGpgPubKey,
      bitgoMsg2
    );
    assert.ok(
      txRequestRound2.transactions &&
        txRequestRound2.transactions.length === 1 &&
        txRequestRound2.transactions[0].signatureShares.length === 4,
      'txRequestRound2 should have 4 signatureShares (2 from round1 + user round2 + bitgo round2Output) after BitGo round 2'
    );

    // round 3
    const reqEdDSARound3 = {
      bitgo: bgTest,
      body: {
        txRequest: txRequestRound2,
        encryptedRound2Session: round2Result.encryptedRound2Session,
        encryptedUserGpgPrvKey: round1Result.encryptedUserGpgPrvKey,
        bitgoPublicGpgKey: pinnedBitgoGpgKey,
      },
      decoded: {
        coin: 'tsol',
        sharetype: 'EddsaMPCv2Round3',
        txRequest: txRequestRound2,
        encryptedRound2Session: round2Result.encryptedRound2Session,
        encryptedUserGpgPrvKey: round1Result.encryptedUserGpgPrvKey,
        bitgoPublicGpgKey: pinnedBitgoGpgKey,
      },
      params: { coin: 'tsol', sharetype: 'EddsaMPCv2Round3' },
      config: { signerFileSystemPath: eddsaSignerTmpPath },
    } as unknown as ExpressApiRouteRequest<'express.v2.tssshare.generate', 'post'>;

    const round3Result = await handleV2GenerateShareTSS(reqEdDSARound3);
    round3Result.should.have.property('signatureShareRound3');

    await signBitgoEddsaMPCv2Round3(bitgoDsg, round3Result.signatureShareRound3, round1Result.userGpgPubKey, bitgoMsg3);

    // Verify the 64-byte Ed25519 signature cryptographically, matching the pattern of the
    // legacy EdDSA v1 test (MPC.verify) and ECDSA MPCv2 test (DklsUtils.verifyAndConvert...).
    // Uses Node.js built-in crypto — no extra npm dependency needed.
    const signature = bitgoDsg.getSignature();
    const derivedKeychainHex = MPC.deriveUnhardened(userDkg.getCommonKeychain(), derivationPath);
    const derivedPubKeyBytes = Buffer.from(derivedKeychainHex.slice(0, 64), 'hex');
    // Ed25519 SubjectPublicKeyInfo DER header: SEQUENCE { SEQUENCE { OID 1.3.101.112 } BIT STRING }
    const spkiDer = Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), derivedPubKeyBytes]);
    const pubKeyObj = createPublicKey({ key: spkiDer, format: 'der', type: 'spki' });
    assert.ok(
      cryptoVerify(null, message, pubKeyObj, signature),
      'Ed25519 signature must verify under the derived public key'
    );

    // Session blobs are single-use: replaying the same encryptedRound2Session must be rejected.
    // In-process the sdk-core early check fires first; across signer restarts the
    // durable route-level registry (file-backed, keyed on the canonical digest) rejects.
    await assert.rejects(
      () => handleV2GenerateShareTSS(reqEdDSARound3),
      /Session state has already been used; replay is not allowed/
    );

    fs.promises.unlink(`${eddsaSignerTmpPath}.consumedShares.json`).catch(() => undefined);
    detachSignStub.restore();
    verifyMsgStub.restore();
    readFileStub.restore();
    envStub.restore();
  });

  it('should accept a local secret and password for a wallet', async () => {
    const accessToken = '';
    const walletIds = {
      tbtc: [
        {
          walletId,
          walletPassword,
          secret,
        },
      ],
    };

    const walletResult = {
      walletId,
      keys: [walletId, walletId, walletId],
    };

    const keyResult = {
      walletId,
      encryptedPrv: JSON.parse(validPrv)[walletId],
    };

    nock(bgUrl).get(`/api/v2/tbtc/wallet/${walletId}`).reply(200, walletResult);
    nock(bgUrl).get(`/api/v2/tbtc/key/${walletId}`).reply(200, keyResult);

    const data = await fetchKeys(walletIds, accessToken);

    should.exist(data[walletId]);
    data[walletId].should.startWith('{"iv":"');
  });
});

function createEddsaMPCv2GenerateShareRequest(
  bitgo: BitGo,
  walletId: string,
  sharetype: string,
  extraBody: Record<string, unknown> = {},
  signerFileSystemPath = 'signerFileSystemPath'
): ExpressApiRouteRequest<'express.v2.tssshare.generate', 'post'> {
  return {
    bitgo,
    body: {
      ...extraBody,
      txRequest: {
        txRequestId: '123456',
        apiVersion: 'full',
        walletId,
        transactions: [
          {
            unsignedTx: {
              derivationPath: 'm/0',
              signableHex: 'deadbeef',
            },
            signatureShares: [],
          },
        ],
      },
    },
    decoded: {
      coin: 'tsol',
      sharetype,
    },
    params: {
      coin: 'tsol',
      sharetype,
    },
    config: {
      signerFileSystemPath,
    },
  } as unknown as ExpressApiRouteRequest<'express.v2.tssshare.generate', 'post'>;
}

function createExternalSignerTxRequest(txRequestId: string): TxRequest {
  return {
    txRequestId,
    walletId: 'walletId',
    walletType: 'hot',
    version: 1,
    state: 'pendingUserSignature',
    date: '2026-05-28T00:00:00.000Z',
    userId: 'userId',
    intent: {},
    policiesChecked: true,
    unsignedTxs: [],
    latest: true,
  };
}

// #region EdDSA MPCv2 utils
/**
 * Simulates BitGo's server-side processing for EdDSA MPCv2 DSG round 1.
 *
 * BitGo receives User's round-1 share (WASM-round-0 commitment), runs its own
 * WASM-round-0 (getFirstMessage) and WASM-round-1 (handleIncomingMessages), then
 * responds with its own WASM-round-0 output (msg1) signed with its GPG key.
 *
 * Returns the updated txRequest (with both User and BitGo round-1 shares appended)
 * and `bitgoMsg2` which must be passed to the round-2 simulator.
 */
async function signBitgoEddsaMPCv2Round1(
  bitgoDsg: EddsaMPSDsg.DSG,
  txRequest: TxRequest,
  userShare: SignatureShareRecord,
  userGpgPubKeyArmored: string
): Promise<{ txRequest: TxRequest; bitgoMsg2: MPSTypes.DeserializedMessage }> {
  assert.ok(
    txRequest.transactions && txRequest.transactions.length === 1,
    'txRequest.transactions must be an array of length 1'
  );

  // User's share must be present so createOfflineRound2Share can find it later
  txRequest.transactions[0].signatureShares.push(userShare);

  // MPSComms is stubbed for this test — decode the payload directly from the base64 message field
  const parsedUserShare = JSON.parse(userShare.share) as EddsaMPCv2SignatureShareRound1Input;
  const userMsg1: MPSTypes.DeserializedMessage = {
    from: 0 /* USER */,
    payload: new Uint8Array(Buffer.from(parsedUserShare.data.msg1.message, 'base64')),
  };

  // BitGo WASM-round-0: produce its own commitment
  const bitgoMsg1 = bitgoDsg.getFirstMessage();

  // BitGo WASM-round-1: process User's msg1 → produce BitGo's msg2 (carried to round 2)
  const [bitgoMsg2] = bitgoDsg.handleIncomingMessages([bitgoMsg1, userMsg1]);

  // Build Round1Output using the same shape MPSComms.detachSignMpsMessage stub returns
  const bitgoRound1Output: EddsaMPCv2SignatureShareRound1Output = {
    type: 'round1Output',
    data: { msg1: { message: Buffer.from(bitgoMsg1.payload).toString('base64'), signature: '' } },
  };
  txRequest.transactions[0].signatureShares.push({
    from: SignatureShareType.BITGO,
    to: SignatureShareType.USER,
    share: JSON.stringify(bitgoRound1Output),
  });

  return { txRequest, bitgoMsg2 };
}

/**
 * Simulates BitGo's server-side processing for EdDSA MPCv2 DSG round 2.
 *
 * BitGo receives User's round-2 share (WASM-round-1 response to BitGo's msg1),
 * runs its own WASM-round-2 (handling User's msg2 → producing BitGo's msg3),
 * then responds with its own WASM-round-1 output (msg2) signed with its GPG key.
 *
 * Note: BitGo defers sending msg2 until it has received User's msg2 — this is the
 * EdDSA-specific protocol asymmetry vs ECDSA (which bundles round1+round2 together).
 */
async function signBitgoEddsaMPCv2Round2(
  bitgoDsg: EddsaMPSDsg.DSG,
  txRequest: TxRequest,
  userShare: SignatureShareRecord,
  userGpgPubKeyArmored: string,
  bitgoMsg2: MPSTypes.DeserializedMessage
): Promise<{ txRequest: TxRequest; bitgoMsg3: MPSTypes.DeserializedMessage }> {
  assert.ok(
    txRequest.transactions && txRequest.transactions.length === 1,
    'txRequest.transactions must be an array of length 1'
  );

  txRequest.transactions[0].signatureShares.push(userShare);

  // MPSComms is stubbed — decode payload directly
  const parsedUserShare = JSON.parse(userShare.share) as EddsaMPCv2SignatureShareRound2Input;
  const userMsg2: MPSTypes.DeserializedMessage = {
    from: 0 /* USER */,
    payload: new Uint8Array(Buffer.from(parsedUserShare.data.msg2.message, 'base64')),
  };

  // BitGo WASM-round-2: process User's msg2 → produce BitGo's msg3 (carried to round 3)
  const [bitgoMsg3] = bitgoDsg.handleIncomingMessages([bitgoMsg2, userMsg2]);

  // Build Round2Output: BitGo sends msg2 (its WASM-round-1 output) back to User
  const bitgoRound2Output: EddsaMPCv2SignatureShareRound2Output = {
    type: 'round2Output',
    data: { msg2: { message: Buffer.from(bitgoMsg2.payload).toString('base64'), signature: '' } },
  };
  txRequest.transactions[0].signatureShares.push({
    from: SignatureShareType.BITGO,
    to: SignatureShareType.USER,
    share: JSON.stringify(bitgoRound2Output),
  });

  return { txRequest, bitgoMsg3 };
}

/**
 * Simulates BitGo's server-side processing for EdDSA MPCv2 DSG round 3.
 *
 * BitGo receives User's round-3 share (WASM-round-2 partial signature contribution),
 * runs its own WASM-round-3 to complete the protocol.
 * After this call, `bitgoDsg.getSignature()` returns the 64-byte Ed25519 signature.
 */
async function signBitgoEddsaMPCv2Round3(
  bitgoDsg: EddsaMPSDsg.DSG,
  userShare: SignatureShareRecord,
  userGpgPubKeyArmored: string,
  bitgoMsg3: MPSTypes.DeserializedMessage
): Promise<void> {
  // MPSComms is stubbed — decode payload directly
  const parsedUserShare = JSON.parse(userShare.share) as EddsaMPCv2SignatureShareRound3Input;
  const userMsg3: MPSTypes.DeserializedMessage = {
    from: 0 /* USER */,
    payload: new Uint8Array(Buffer.from(parsedUserShare.data.msg3.message, 'base64')),
  };

  // BitGo WASM-round-3: process User's msg3 → complete DSG
  bitgoDsg.handleIncomingMessages([bitgoMsg3, userMsg3]);
  // bitgoDsg.getSignature() is now available (DsgState.Complete)
}
// #endregion EdDSA MPCv2 utils

// #region MPCv2 utils
function getBitGoPartyGpgKeyPrv(bitgoPrvKey: string): DklsTypes.PartyGpgKey {
  return {
    partyId: 2,
    gpgKey: bitgoPrvKey,
  };
}

function getUserPartyGpgKeyPublic(userPubKey: string): DklsTypes.PartyGpgKey {
  return {
    partyId: 0,
    gpgKey: userPubKey,
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
// #endregion
