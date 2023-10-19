import * as assert from 'assert';
import * as _ from 'lodash';
import * as nock from 'nock';
import * as openpgp from 'openpgp';
import * as should from 'should';
import * as sinon from 'sinon';

import {
  mockSerializedChallengeWithProofs,
  mockSerializedChallengeWithProofs2,
  TestableBG,
  TestBitGo,
} from '@bitgo/sdk-test';
import { BitGo, createSharedDataProof, TssUtils, RequestType } from '../../../../../src';
import {
  BackupGpgKey,
  BackupKeyShare,
  BaseCoin,
  BitgoGPGPublicKey,
  BitgoHeldBackupKeyShare,
  common,
  Ecdsa,
  ECDSA,
  ECDSAMethods,
  ECDSAUtils,
  EnterpriseData,
  Keychain,
  RequestTracer,
  SignatureShareRecord,
  SignatureShareType,
  TxRequest,
  Wallet,
} from '@bitgo/sdk-core';
import { EcdsaPaillierProof, EcdsaRangeProof, EcdsaTypes, hexToBigInt } from '@bitgo/sdk-lib-mpc';
import { keyShares, otherKeyShares } from '../../../fixtures/tss/ecdsaFixtures';
import { nockSendSignatureShareWithResponse } from './common';
import {
  createWalletSignatures,
  nockGetChallenge,
  nockGetChallenges,
  nockGetEnterprise,
  nockGetSigningKey,
  nockGetTxRequest,
} from '../../tss/helpers';
import { bip32, ecc } from '@bitgo/utxo-lib';
import { Hash } from 'crypto';
import { mockChallengeA, mockChallengeB, mockChallengeC } from './mocks/ecdsaNtilde';

const createKeccakHash = require('keccak');

const encryptNShare = ECDSAMethods.encryptNShare;
type KeyShare = ECDSA.KeyShare;

describe('TSS Ecdsa Utils:', async function () {
  const isThirdPartyBackup = false;
  const coinName = 'hteth';
  const reqId = new RequestTracer();
  const walletId = '5b34252f1bf349930e34020a00000000';
  const enterpriseId = '6449153a6f6bc20006d66771cdbe15d3';
  const enterpriseData = { id: enterpriseId, name: 'Test Enterprise' };

  let sandbox: sinon.SinonSandbox;
  let MPC: Ecdsa;
  let bgUrl: string;
  let tssUtils: ECDSAUtils.EcdsaUtils;
  let wallet: Wallet;
  let bitgo: TestableBG & BitGo;
  let baseCoin: BaseCoin;
  let bitgoKeyShare;
  let userKeyShare: KeyShare;
  let backupKeyShare: KeyShare;
  let bitgoPublicKey: openpgp.Key;
  let thirdPartyBackupPublicGpgKey: openpgp.Key;

  let userGpgKey: openpgp.SerializedKeyPair<string> & {
    revocationCertificate: string;
  };
  let userLocalBackupGpgKey: openpgp.SerializedKeyPair<string> & {
    revocationCertificate: string;
  };
  let thirdPartyBackupGpgKeyPair: openpgp.SerializedKeyPair<string> & {
    revocationCertificate: string;
  };
  let bitGoGPGKeyPair: openpgp.SerializedKeyPair<string> & {
    revocationCertificate: string;
  };
  let nockedBitGoKeychain: Keychain;
  let nockedUserKeychain: Keychain;

  beforeEach(async function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  before(async function () {
    nock.cleanAll();
    MPC = new Ecdsa();
    userKeyShare = keyShares.userKeyShare;
    backupKeyShare = keyShares.backupKeyShare;
    bitgoKeyShare = keyShares.bitgoKeyShare;

    const gpgKeyPromises = [
      openpgp.generateKey({
        userIDs: [
          {
            name: 'test',
            email: 'test@test.com',
          },
        ],
        curve: 'secp256k1',
      }),
      openpgp.generateKey({
        userIDs: [
          {
            name: 'backup',
            email: 'backup@test.com',
          },
        ],
        curve: 'secp256k1',
      }),
      openpgp.generateKey({
        userIDs: [
          {
            name: 'thirdPartyBackup',
            email: 'thirdPartybackup@test.com',
          },
        ],
        curve: 'secp256k1',
      }),
      openpgp.generateKey({
        userIDs: [
          {
            name: 'bitgo',
            email: 'bitgo@test.com',
          },
        ],
        curve: 'secp256k1',
      }),
    ];
    [userGpgKey, userLocalBackupGpgKey, thirdPartyBackupGpgKeyPair, bitGoGPGKeyPair] = await Promise.all(
      gpgKeyPromises
    );
    thirdPartyBackupPublicGpgKey = await openpgp.readKey({ armoredKey: thirdPartyBackupGpgKeyPair.publicKey });
    bitgoPublicKey = await openpgp.readKey({ armoredKey: bitGoGPGKeyPair.publicKey });
    const constants = {
      mpc: {
        bitgoPublicKey: bitGoGPGKeyPair.publicKey,
      },
    };

    bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    bitgo.initializeTestVars();

    baseCoin = bitgo.coin(coinName);

    bgUrl = common.Environments[bitgo.getEnv()].uri;

    // TODO(WP-346): sdk-test mocks conflict so we can't use persist
    nock(bgUrl).get('/api/v1/client/constants').times(16).reply(200, { ttl: 3600, constants });

    const nockPromises = [
      nockBitgoKeychain({
        coin: coinName,
        userKeyShare,
        backupKeyShare,
        bitgoKeyShare,
        userGpgKey,
        userLocalBackupGpgKey,
        bitgoGpgKey: bitGoGPGKeyPair,
      }),
      nockKeychain({ coin: coinName, keyChain: { id: '1', pub: '', type: 'tss' }, source: 'user' }),
      nockKeychain({ coin: coinName, keyChain: { id: '2', pub: '', type: 'tss' }, source: 'backup' }),
    ];
    [nockedBitGoKeychain, nockedUserKeychain] = await Promise.all(nockPromises);

    const walletData = {
      id: walletId,
      enterprise: enterpriseId,
      coin: coinName,
      coinSpecific: {},
      multisigType: 'tss',
    };
    wallet = new Wallet(bitgo, baseCoin, walletData);
    tssUtils = new ECDSAUtils.EcdsaUtils(bitgo, baseCoin, wallet);
  });

  after(function () {
    nock.cleanAll();
  });

  describe('TSS key chains', async function () {
    it('should create backup key share held by BitGo', async function () {
      const enterpriseId = 'enterprise id';
      const expectedKeyShare = await nockCreateBitgoHeldBackupKeyShare(
        coinName,
        enterpriseId,
        userGpgKey,
        backupKeyShare,
        bitGoGPGKeyPair
      );
      const result = await tssUtils.createBitgoHeldBackupKeyShare(userGpgKey, enterpriseId);
      result.should.eql(expectedKeyShare);
    });

    it('should finalize backup key share held by BitGo', async function () {
      const commonKeychain = '4428';
      const originalKeyShare = await createIncompleteBitgoHeldBackupKeyShare(
        userGpgKey,
        backupKeyShare,
        bitGoGPGKeyPair
      );
      const expectedFinalKeyShare = await nockFinalizeBitgoHeldBackupKeyShare(
        coinName,
        originalKeyShare,
        commonKeychain,
        userKeyShare,
        bitGoGPGKeyPair,
        nockedBitGoKeychain
      );

      const result = await tssUtils.finalizeBitgoHeldBackupKeyShare(
        originalKeyShare.id,
        commonKeychain,
        userKeyShare,
        nockedBitGoKeychain,
        userGpgKey,
        bitgoPublicKey
      );
      result.should.eql(expectedFinalKeyShare);
    });

    it('should create a user keychain from third party backup provider', async function () {
      const backupKeyShares = await createIncompleteBitgoHeldBackupKeyShare(
        userGpgKey,
        backupKeyShare,
        bitGoGPGKeyPair
      );
      const backupShareHolder: BackupKeyShare = {
        bitGoHeldKeyShares: backupKeyShares,
      };
      assert(backupShareHolder.bitGoHeldKeyShares);
      const userKeychain = await tssUtils.createUserKeychainFromThirdPartyBackup(
        userGpgKey,
        bitgoPublicKey,
        thirdPartyBackupPublicGpgKey,
        userKeyShare,
        backupShareHolder.bitGoHeldKeyShares?.keyShares,
        nockedBitGoKeychain,
        'password',
        '1234'
      );
      userKeychain.should.deepEqual(nockedUserKeychain);
    });

    it('should get the respective backup key shares based on provider', async function () {
      const enterpriseId = 'enterprise id';
      await nockCreateBitgoHeldBackupKeyShare(coinName, enterpriseId, userGpgKey, backupKeyShare, bitGoGPGKeyPair);
      let backupKeyShares = await tssUtils.createBackupKeyShares(true, userGpgKey, enterpriseId);
      should.exist(backupKeyShares.bitGoHeldKeyShares);
      should.not.exist(backupKeyShares.userHeldKeyShare);

      await nockCreateBitgoHeldBackupKeyShare(coinName, enterpriseId, userGpgKey, backupKeyShare, bitGoGPGKeyPair);
      backupKeyShares = await tssUtils.createBackupKeyShares(false, userGpgKey, enterpriseId);
      should.exist(backupKeyShares.userHeldKeyShare);
      should.not.exist(backupKeyShares.bitGoHeldKeyShares);
    });

    it('should get the correct bitgo gpg key based on coin and feature flags', async function () {
      const nitroGPGKeypair = await openpgp.generateKey({
        userIDs: [
          {
            name: 'bitgo nitro',
            email: 'bitgo@test.com',
          },
        ],
      });
      const nockGPGKey = await nockGetBitgoPublicKeyBasedOnFeatureFlags(coinName, 'enterprise_id', nitroGPGKeypair);
      const bitgoGpgPublicKey = await tssUtils.getBitgoGpgPubkeyBasedOnFeatureFlags('enterprise_id');
      should.equal(nockGPGKey.publicKey, bitgoGpgPublicKey.armor());
    });

    it('getBackupEncryptedNShare should get valid encrypted n shares based on provider', async function () {
      // Backup key held by third party
      const bitgoHeldBackupKeyShare = await createIncompleteBitgoHeldBackupKeyShare(
        userGpgKey,
        backupKeyShare,
        bitGoGPGKeyPair
      );
      const backupShareHolder: BackupKeyShare = {
        bitGoHeldKeyShares: bitgoHeldBackupKeyShare,
      };
      const backupToBitgoShare = bitgoHeldBackupKeyShare.keyShares.find(
        (keyShare) => keyShare.from === 'backup' && keyShare.to === 'bitgo'
      );
      const bitgoGpgKeyPubKey = await tssUtils.getBitgoPublicGpgKey();
      let backupToBitgoEncryptedNShare = await tssUtils.getBackupEncryptedNShare(
        backupShareHolder,
        3,
        bitgoGpgKeyPubKey.armor(),
        userGpgKey,
        true
      );
      should.exist(backupToBitgoEncryptedNShare);
      should.equal(backupToBitgoEncryptedNShare.encryptedPrivateShare, backupToBitgoShare?.privateShare);

      // Backup key held by user
      const backupShareHolderNew: BackupKeyShare = {
        userHeldKeyShare: backupKeyShare,
      };
      backupToBitgoEncryptedNShare = await tssUtils.getBackupEncryptedNShare(
        backupShareHolderNew,
        3,
        bitgoGpgKeyPubKey.armor(),
        userGpgKey,
        false
      );
      const encryptedNShare = await encryptNShare(backupKeyShare, 3, bitgoGpgKeyPubKey.armor(), userGpgKey);
      // cant verify the encrypted shares, since they will be encrypted with diff. values
      should.equal(backupToBitgoEncryptedNShare.publicShare, encryptedNShare.publicShare);
    });

    it('should generate TSS key chains', async function () {
      const backupShareHolder: BackupKeyShare = {
        userHeldKeyShare: backupKeyShare,
      };
      const backupGpgKey: BackupGpgKey = isThirdPartyBackup ? thirdPartyBackupPublicGpgKey : userLocalBackupGpgKey;
      const bitgoKeychain = await tssUtils.createBitgoKeychain({
        userGpgKey,
        backupGpgKey,
        userKeyShare,
        backupKeyShare: backupShareHolder,
        bitgoPublicGpgKey: bitgoPublicKey,
        isThirdPartyBackup,
      });
      const usersKeyChainPromises = [
        tssUtils.createParticipantKeychain(
          userGpgKey,
          userLocalBackupGpgKey,
          bitgoPublicKey,
          1,
          userKeyShare,
          backupKeyShare,
          bitgoKeychain,
          'passphrase'
        ),
        tssUtils.createParticipantKeychain(
          userGpgKey,
          userLocalBackupGpgKey,
          bitgoPublicKey,
          2,
          userKeyShare,
          backupKeyShare,
          bitgoKeychain,
          'passphrase'
        ),
      ];
      const [userKeychain, backupKeychain] = await Promise.all(usersKeyChainPromises);

      bitgoKeychain.should.deepEqual(nockedBitGoKeychain);
      userKeychain.should.deepEqual(nockedUserKeychain);

      // unencrypted `prv` property should exist on backup keychain
      const keyChainPrv = JSON.parse(backupKeychain.prv ?? '');
      _.isEqual(keyChainPrv.pShare, backupKeyShare.pShare).should.be.true();
      _.isEqual(keyChainPrv.bitgoNShare, bitgoKeyShare.nShares[2]).should.be.true();
      _.isEqual(keyChainPrv.userNShare, userKeyShare.nShares[2]).should.be.true();
      should.exist(backupKeychain.encryptedPrv);
    });

    it('should generate TSS key chains when backup provider is BitGo', async function () {
      const backupProvider = 'BitGoTrustAsKrs';

      const nitroGPGKeypair = await openpgp.generateKey({
        userIDs: [
          {
            name: 'bitgo nitro',
            email: 'bitgo@test.com',
          },
        ],
      });

      await nockGetBitgoPublicKeyBasedOnFeatureFlags(coinName, 'enterprise_id', nitroGPGKeypair);
      const bitgoGpgPublicKey = await tssUtils.getBitgoGpgPubkeyBasedOnFeatureFlags('enterprise_id');

      const isThirdPartyBackup = tssUtils.isValidThirdPartyBackupProvider('BitGoTrustAsKrs');
      const bitgoHeldBackupShares = await createIncompleteBitgoHeldBackupKeyShare(
        userGpgKey,
        backupKeyShare,
        nitroGPGKeypair
      );
      const backupShareHolder: BackupKeyShare = {
        bitGoHeldKeyShares: bitgoHeldBackupShares,
      };
      const backupGpgKey: BackupGpgKey = isThirdPartyBackup ? thirdPartyBackupPublicGpgKey : userLocalBackupGpgKey;

      const bitgoKeychain = await tssUtils.createBitgoKeychain({
        userGpgKey,
        backupGpgKey,
        userKeyShare,
        backupKeyShare: backupShareHolder,
        enterprise: undefined,
        isThirdPartyBackup,
        bitgoPublicGpgKey: bitgoGpgPublicKey,
      });
      assert(bitgoKeychain.commonKeychain);

      await nockFinalizeBitgoHeldBackupKeyShare(
        coinName,
        bitgoHeldBackupShares,
        bitgoKeychain.commonKeychain,
        userKeyShare,
        nitroGPGKeypair,
        bitgoKeychain
      );

      const userBackupKeyChainPromises = [
        tssUtils.createUserKeychain({
          userGpgKey,
          backupGpgKey,
          userKeyShare,
          backupKeyShare: backupShareHolder,
          bitgoKeychain,
          passphrase: 'passphrase',
          enterprise: undefined,
          isThirdPartyBackup,
          bitgoPublicGpgKey: bitgoGpgPublicKey,
        }),
        tssUtils.createBackupKeychain({
          userGpgKey,
          backupGpgKey,
          userKeyShare,
          backupKeyShare: backupShareHolder,
          bitgoKeychain,
          enterprise: undefined,
          bitgoPublicGpgKey: bitgoGpgPublicKey,
          backupProvider,
        }),
      ];
      const [userKeychain, backupKeychain] = await Promise.all(userBackupKeyChainPromises);

      bitgoKeychain.should.deepEqual(nockedBitGoKeychain);
      userKeychain.should.deepEqual(nockedUserKeychain);
      backupKeychain.id.should.equal('2');
      backupKeychain.provider?.should.equal(backupProvider);

      // verify that all four key shares are included on the response of the backup keychain
      assert(backupKeychain.keyShares);
      backupKeychain.keyShares.length.should.equal(4);
      for (const keyShare of bitgoHeldBackupShares.keyShares) {
        backupKeychain.keyShares.should.matchAny(keyShare);
      }
      const bitgoToBackupShare = bitgoKeychain.keyShares?.find(
        (keyShare) => keyShare.from === 'bitgo' && keyShare.to === 'backup'
      );
      assert(bitgoToBackupShare);
      backupKeychain.keyShares.should.matchAny(bitgoToBackupShare);

      const userToBackupShare = backupKeychain.keyShares.find(
        (keyShare) => keyShare.from === 'user' && keyShare.to === 'backup'
      );
      assert(userToBackupShare);
      userToBackupShare.publicShare.should.equal(
        Buffer.concat([
          Buffer.from(userKeyShare.nShares[2].y, 'hex'),
          Buffer.from(userKeyShare.nShares[2].chaincode, 'hex'),
        ]).toString('hex')
      );
    });

    it('should generate TSS key chains with optional params', async function () {
      const enterprise = 'enterprise_id';
      const backupShareHolder: BackupKeyShare = {
        userHeldKeyShare: backupKeyShare,
      };
      const backupGpgKey: BackupGpgKey = isThirdPartyBackup ? thirdPartyBackupPublicGpgKey : userLocalBackupGpgKey;
      const bitgoKeychain = await tssUtils.createBitgoKeychain({
        userGpgKey,
        backupGpgKey,
        userKeyShare,
        backupKeyShare: backupShareHolder,
        enterprise,
        bitgoPublicGpgKey: bitgoPublicKey,
      });
      const usersKeyChainPromises = [
        tssUtils.createParticipantKeychain(
          userGpgKey,
          userLocalBackupGpgKey,
          bitgoPublicKey,
          1,
          userKeyShare,
          backupKeyShare,
          bitgoKeychain,
          'passphrase',
          'originalPasscodeEncryptionCode'
        ),
        tssUtils.createParticipantKeychain(
          userGpgKey,
          userLocalBackupGpgKey,
          bitgoPublicKey,
          2,
          userKeyShare,
          backupKeyShare,
          bitgoKeychain,
          'passphrase'
        ),
      ];

      const [userKeychain, backupKeychain] = await Promise.all(usersKeyChainPromises);
      bitgoKeychain.should.deepEqual(nockedBitGoKeychain);
      userKeychain.should.deepEqual(nockedUserKeychain);

      // unencrypted `prv` property should exist on backup keychain
      const keyChainPrv = JSON.parse(backupKeychain.prv ?? '');
      _.isEqual(keyChainPrv.pShare, backupKeyShare.pShare).should.be.true();
      _.isEqual(keyChainPrv.bitgoNShare, bitgoKeyShare.nShares[2]).should.be.true();
      _.isEqual(keyChainPrv.userNShare, userKeyShare.nShares[2]).should.be.true();
      should.exist(backupKeychain.encryptedPrv);
    });

    it('should fail to generate TSS key chains', async function () {
      const backupShareHolder: BackupKeyShare = {
        userHeldKeyShare: backupKeyShare,
      };
      const backupGpgKey: BackupGpgKey = isThirdPartyBackup ? thirdPartyBackupPublicGpgKey : userLocalBackupGpgKey;
      const bitgoKeychain = await tssUtils.createBitgoKeychain({
        userGpgKey,
        backupGpgKey,
        userKeyShare,
        backupKeyShare: backupShareHolder,
        bitgoPublicGpgKey: bitgoPublicKey,
      });
      bitgoKeychain.should.deepEqual(nockedBitGoKeychain);
      const testKeyShares = otherKeyShares;
      const testCasesPromises = [
        tssUtils
          .createParticipantKeychain(
            userGpgKey,
            userLocalBackupGpgKey,
            bitgoPublicKey,
            1,
            userKeyShare,
            testKeyShares[0],
            bitgoKeychain,
            'passphrase'
          )
          .should.be.rejectedWith('Common keychains do not match'),
        tssUtils
          .createParticipantKeychain(
            userGpgKey,
            userLocalBackupGpgKey,
            bitgoPublicKey,
            1,
            testKeyShares[1],
            backupKeyShare,
            bitgoKeychain,
            'passphrase'
          )
          .should.be.rejectedWith('Common keychains do not match'),
        tssUtils
          .createParticipantKeychain(
            userGpgKey,
            userLocalBackupGpgKey,
            bitgoPublicKey,
            2,
            testKeyShares[2],
            backupKeyShare,
            bitgoKeychain,
            'passphrase'
          )
          .should.be.rejectedWith('Common keychains do not match'),
        tssUtils
          .createParticipantKeychain(
            userGpgKey,
            userLocalBackupGpgKey,
            bitgoPublicKey,
            2,
            userKeyShare,
            testKeyShares[3],
            bitgoKeychain,
            'passphrase'
          )
          .should.be.rejectedWith('Common keychains do not match'),
      ];
      await Promise.all(testCasesPromises);
    });

    it('should fail to generate TSS keychains when received invalid number of wallet signatures', async function () {
      const bitgoKeychain = await generateBitgoKeychain({
        coin: coinName,
        userKeyShare,
        backupKeyShare,
        bitgoKeyShare,
        userGpgKey,
        userLocalBackupGpgKey,
        bitgoGpgKey: bitGoGPGKeyPair,
      });

      const certsString = await createSharedDataProof(bitGoGPGKeyPair.privateKey, userGpgKey.publicKey, []);
      const certsKey = await openpgp.readKey({ armoredKey: certsString });
      const finalKey = new openpgp.PacketList();
      certsKey.toPacketList().forEach((packet) => finalKey.push(packet));
      // Once the following PR has been merged and released we no longer need the ts-ignore:
      // https://github.com/openpgpjs/openpgpjs/pull/1576
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      bitgoKeychain.walletHSMGPGPublicKeySigs = openpgp.armor(openpgp.enums.armor.publicKey, finalKey.write());
      await tssUtils
        .verifyWalletSignatures(userLocalBackupGpgKey.publicKey, userLocalBackupGpgKey.publicKey, bitgoKeychain, '', 1)
        .should.be.rejectedWith(`Invalid wallet signatures`);
    });

    it('should fail to generate TSS keychains when wallet signature fingerprints do not match passed user/backup fingerprints', async function () {
      const customUserKeyShare = await MPC.keyShare(1, 2, 3);
      const customBackupKeyShare = await MPC.keyShare(2, 2, 3);
      const backupShareHolder: BackupKeyShare = {
        userHeldKeyShare: customBackupKeyShare,
      };
      const backupGpgKey: BackupGpgKey = isThirdPartyBackup ? thirdPartyBackupPublicGpgKey : userLocalBackupGpgKey;

      const bitgoKeychain = await tssUtils.createBitgoKeychain({
        userGpgKey,
        backupGpgKey,
        userKeyShare: customUserKeyShare,
        backupKeyShare: backupShareHolder,
        bitgoPublicGpgKey: bitgoPublicKey,
      });

      // using the backup gpg here instead of the user gpg key to simulate that the first signature has a different
      // fingerprint from the passed in first gpg key
      await tssUtils
        .verifyWalletSignatures(userLocalBackupGpgKey.publicKey, userLocalBackupGpgKey.publicKey, bitgoKeychain, '', 1)
        .should.be.rejectedWith(
          `first wallet signature's fingerprint does not match passed user gpg key's fingerprint`
        );

      // using the user gpg here instead of the backup gpg key to simulate that the second signature has a different
      // fingerprint from the passed in second gpg key
      await tssUtils
        .verifyWalletSignatures(userGpgKey.publicKey, userGpgKey.publicKey, bitgoKeychain, '', 1)
        .should.be.rejectedWith(
          `second wallet signature's fingerprint does not match passed backup gpg key's fingerprint`
        );
    });
  });

  describe('signTxRequest:', () => {
    const txRequestId = 'randomidEcdsa';
    const txRequest: TxRequest = {
      txRequestId,
      transactions: [
        {
          unsignedTx: {
            serializedTxHex: 'TOO MANY SECRETS',
            signableHex: 'TOO MANY SECRETS',
            derivationPath: '', // Needs this when key derivation is supported
          },
          state: 'pendingSignature',
          signatureShares: [],
        },
      ],
      unsignedTxs: [
        {
          serializedTxHex: 'TOO MANY SECRETS',
          signableHex: 'TOO MANY SECRETS',
          derivationPath: '', // Needs this when key derivation is supported
        },
      ],
      date: new Date().toISOString(),
      intent: {
        intentType: 'payment',
      },
      latest: true,
      state: 'pendingUserSignature',
      walletType: 'hot',
      walletId: 'walletId',
      policiesChecked: true,
      version: 1,
      userId: 'userId',
    };
    let aShare, dShare, wShare, oShare, userSignShare, bitgoChallenges, enterpriseChallenges;

    beforeEach(async () => {
      // Initializing user and bitgo for creating shares for nocks
      const userSigningKey = MPC.keyCombine(userKeyShare.pShare, [bitgoKeyShare.nShares[1], backupKeyShare.nShares[1]]);
      const bitgoSigningKey = MPC.keyCombine(bitgoKeyShare.pShare, [
        userKeyShare.nShares[3],
        backupKeyShare.nShares[3],
      ]);

      const serializedEntChallenge = mockChallengeA;
      const serializedBitgoChallenge = mockChallengeB;

      const deserializedEntChallenge = EcdsaTypes.deserializeNtildeWithProofs(serializedEntChallenge);
      sinon.stub(EcdsaRangeProof, 'generateNtilde').resolves(deserializedEntChallenge);

      const [userToBitgoPaillierChallenge, bitgoToUserPaillierChallenge] = await Promise.all([
        EcdsaPaillierProof.generateP(hexToBigInt(userSigningKey.yShares[3].n)),
        EcdsaPaillierProof.generateP(hexToBigInt(bitgoSigningKey.yShares[1].n)),
      ]);

      bitgoChallenges = {
        ...serializedBitgoChallenge,
        p: EcdsaTypes.serializePaillierChallenge({ p: bitgoToUserPaillierChallenge }).p,
        n: bitgoSigningKey.xShare.n,
      };
      enterpriseChallenges = {
        ...serializedEntChallenge,
        p: EcdsaTypes.serializePaillierChallenge({ p: userToBitgoPaillierChallenge }).p,
        n: bitgoSigningKey.xShare.n,
      };
      sinon.stub(ECDSAUtils.EcdsaUtils.prototype, 'getEcdsaSigningChallenges').resolves({
        enterpriseChallenge: enterpriseChallenges,
        bitgoChallenge: bitgoChallenges,
      });

      const [userXShare, bitgoXShare] = [
        MPC.appendChallenge(
          userSigningKey.xShare,
          serializedEntChallenge,
          EcdsaTypes.serializePaillierChallenge({ p: userToBitgoPaillierChallenge })
        ),
        MPC.appendChallenge(
          bitgoSigningKey.xShare,
          serializedBitgoChallenge,
          EcdsaTypes.serializePaillierChallenge({ p: bitgoToUserPaillierChallenge })
        ),
      ];
      const bitgoYShare = MPC.appendChallenge(
        userSigningKey.yShares[3],
        serializedBitgoChallenge,
        EcdsaTypes.serializePaillierChallenge({ p: bitgoToUserPaillierChallenge })
      );
      /**
       * START STEP ONE
       * 1) User creates signShare, saves wShare and sends kShare to bitgo
       * 2) Bitgo performs signConvert operation using its private xShare , yShare
       *  and KShare from user and responds back with aShare and saves bShare for later use
       */
      userSignShare = await ECDSAMethods.createUserSignShare(userXShare, bitgoYShare);
      wShare = userSignShare.wShare;
      const signatureShareOneFromUser: SignatureShareRecord = {
        from: SignatureShareType.USER,
        to: SignatureShareType.BITGO,
        share: ECDSAMethods.convertKShare(userSignShare.kShare).share.replace(ECDSAMethods.delimeter, ''),
      };
      const getBitgoAandBShare = await MPC.signConvertStep1({
        xShare: bitgoXShare,
        yShare: bitgoSigningKey.yShares[1], // corresponds to the user
        kShare: userSignShare.kShare,
      });
      const bitgoAshare = getBitgoAandBShare.aShare;
      aShare = bitgoAshare;
      const aShareBitgoResponse = ECDSAMethods.convertAShare(bitgoAshare).share.replace(ECDSAMethods.delimeter, '');
      const signatureShareOneFromBitgo: SignatureShareRecord = {
        from: SignatureShareType.BITGO,
        to: SignatureShareType.USER,
        share: aShareBitgoResponse,
      };
      await nockSendSignatureShareWithResponse({
        walletId: wallet.id(),
        txRequestId: txRequest.txRequestId,
        signatureShare: signatureShareOneFromUser,
        response: signatureShareOneFromBitgo,
        tssType: 'ecdsa',
      });
      /**  END STEP ONE */

      /**
       * START STEP TWO
       * 1) Using the aShare got from bitgo and wShare from previous step,
       * user creates gShare and muShare and sends muShare to bitgo
       * 2) Bitgo using the signConvert step using bShare from previous step
       * and muShare from user generates its gShare.
       * 3) Using the signCombine operation using gShare, Bitgo generates oShare
       * which it saves and dShare which is send back to the user.
       */
      const userGammaAndMuShares = await ECDSAMethods.createUserGammaAndMuShare(userSignShare.wShare, bitgoAshare);
      const signatureShareTwoFromUser: SignatureShareRecord = {
        from: SignatureShareType.USER,
        to: SignatureShareType.BITGO,
        share: ECDSAMethods.convertMuShare(userGammaAndMuShares.muShare!).share.replace(ECDSAMethods.delimeter, ''),
      };
      const getBitGoGShareAndSignerIndexes = await MPC.signConvertStep3({
        bShare: getBitgoAandBShare.bShare,
        muShare: userGammaAndMuShares.muShare,
      });

      const getBitgoOShareAndDShares = MPC.signCombine({
        gShare: getBitGoGShareAndSignerIndexes.gShare as ECDSA.GShare,
        signIndex: {
          i: 1,
          j: 3,
        },
      });
      const bitgoDshare = getBitgoOShareAndDShares.dShare as ECDSA.DShare;
      dShare = bitgoDshare;
      const dShareBitgoResponse = (bitgoDshare.delta as string) + (bitgoDshare.Gamma as string);
      const signatureShareTwoFromBitgo: SignatureShareRecord = {
        from: SignatureShareType.BITGO,
        to: SignatureShareType.USER,
        share: dShareBitgoResponse,
      };
      await nockSendSignatureShareWithResponse({
        walletId: wallet.id(),
        txRequestId: txRequest.txRequestId,
        signatureShare: signatureShareTwoFromUser,
        response: signatureShareTwoFromBitgo,
        tssType: 'ecdsa',
      });
      /**  END STEP TWO */

      /**
       * START STEP THREE
       * 1) User creates its oShare and  dShare using the  private gShare
       * from step two
       * 2) User uses the private oShare and dShare from bitgo from step
       * two to generate its signature share which it sends back along with dShare that
       * user generated from the above step
       * 3) Bitgo using its private oShare from step two and dShare from bitgo creates
       * its signature share. Using the Signature Share received from user from the above
       * step, bitgo constructs the final signature and is returned to the user
       */
      const userOmicronAndDeltaShare = await ECDSAMethods.createUserOmicronAndDeltaShare(
        userGammaAndMuShares.gShare as ECDSA.GShare
      );
      oShare = userOmicronAndDeltaShare.oShare;
      const signablePayload = Buffer.from(txRequest.unsignedTxs[0].signableHex, 'hex');
      const userSShare = await ECDSAMethods.createUserSignatureShare(
        userOmicronAndDeltaShare.oShare,
        bitgoDshare,
        signablePayload
      );
      const signatureShareThreeFromUser: SignatureShareRecord = {
        from: SignatureShareType.USER,
        to: SignatureShareType.BITGO,
        share:
          userSShare.R +
          userSShare.s +
          userSShare.y +
          userOmicronAndDeltaShare.dShare.delta +
          userOmicronAndDeltaShare.dShare.Gamma,
      };
      const getBitGoSShare = MPC.sign(
        signablePayload,
        getBitgoOShareAndDShares.oShare,
        userOmicronAndDeltaShare.dShare,
        createKeccakHash('keccak256') as Hash
      );
      const getBitGoFinalSignature = MPC.constructSignature([getBitGoSShare, userSShare]);
      const finalSigantureBitgoResponse =
        getBitGoFinalSignature.r + getBitGoFinalSignature.s + getBitGoFinalSignature.y;
      const signatureShareThreeFromBitgo: SignatureShareRecord = {
        from: SignatureShareType.BITGO,
        to: SignatureShareType.USER,
        share: finalSigantureBitgoResponse,
      };
      await nockSendSignatureShareWithResponse({
        walletId: wallet.id(),
        txRequestId: txRequest.txRequestId,
        signatureShare: signatureShareThreeFromUser,
        response: signatureShareThreeFromBitgo,
        tssType: 'ecdsa',
      });
      /* END STEP THREE */
      const signature = MPC.constructSignature([userSShare, getBitGoSShare]);
      MPC.verify(signablePayload, signature, createKeccakHash('keccak256') as Hash).should.be.true;
    });

    afterEach(async () => {
      sinon.restore();
    });

    it('signTxRequest should fail if wallet is in pendingEcdsaTssInitialization', async function () {
      sandbox.stub(wallet, 'coinSpecific').returns({
        customChangeWalletId: '',
        pendingEcdsaTssInitialization: true,
      });
      await tssUtils
        .signTxRequest({
          txRequest,
          prv: JSON.stringify({
            pShare: userKeyShare.pShare,
            bitgoNShare: bitgoKeyShare.nShares[1],
            backupNShare: backupKeyShare.nShares[1],
          }),
          reqId,
        })
        .should.be.rejectedWith(
          'Wallet is not ready for TSS ECDSA signing. Please contact your enterprise admin to finish the enterprise TSS initialization.'
        );
    });

    it('signTxRequest should succeed with txRequest object as input', async function () {
      const sendShareSpy = sinon.spy(ECDSAMethods, 'sendShareToBitgo' as any);
      await setupSignTxRequestNocks(false, userSignShare, aShare, dShare, enterpriseData);
      const signedTxRequest = await tssUtils.signTxRequest({
        txRequest,
        prv: JSON.stringify({
          pShare: userKeyShare.pShare,
          bitgoNShare: bitgoKeyShare.nShares[1],
          backupNShare: backupKeyShare.nShares[1],
        }),
        reqId,
      });
      signedTxRequest.unsignedTxs.should.deepEqual(txRequest.unsignedTxs);
      const userGpgActual = sendShareSpy.getCalls()[0].args[10];
      userGpgActual.should.startWith('-----BEGIN PGP PUBLIC KEY BLOCK-----');
    });

    it('signTxRequest should succeed with txRequest id as input', async function () {
      const sendShareSpy = sinon.spy(ECDSAMethods, 'sendShareToBitgo' as any);
      await setupSignTxRequestNocks(true, userSignShare, aShare, dShare, enterpriseData);
      const signedTxRequest = await tssUtils.signTxRequest({
        txRequest: txRequestId,
        prv: JSON.stringify({
          pShare: userKeyShare.pShare,
          bitgoNShare: bitgoKeyShare.nShares[1],
          backupNShare: backupKeyShare.nShares[1],
        }),
        reqId,
      });
      signedTxRequest.unsignedTxs.should.deepEqual(txRequest.unsignedTxs);
      const userGpgActual = sendShareSpy.getCalls()[0].args[10];
      userGpgActual.should.startWith('-----BEGIN PGP PUBLIC KEY BLOCK-----');
    });

    it('getOfflineSignerPaillierModulus should succeed', async function () {
      const paillierModulus = tssUtils.getOfflineSignerPaillierModulus({
        prv: JSON.stringify({
          pShare: userKeyShare.pShare,
          bitgoNShare: bitgoKeyShare.nShares[1],
          backupNShare: backupKeyShare.nShares[1],
        }),
      });
      paillierModulus.userPaillierModulus.should.equal(userKeyShare.pShare.n);
    });

    it('createOfflineKShare should succeed', async function () {
      const mockPassword = 'password';
      const step1SigningMaterial = await tssUtils.createOfflineKShare({
        tssParams: {
          txRequest,
          prv: '',
          reqId: reqId,
        },
        challenges: {
          enterpriseChallenge: enterpriseChallenges,
          bitgoChallenge: bitgoChallenges,
        },
        prv: JSON.stringify({
          pShare: userKeyShare.pShare,
          bitgoNShare: bitgoKeyShare.nShares[1],
          backupNShare: backupKeyShare.nShares[1],
        }),
        requestType: RequestType.tx,
        walletPassphrase: mockPassword,
      });
      step1SigningMaterial.privateShareProof.should.startWith('-----BEGIN PGP PUBLIC KEY BLOCK-----');
      step1SigningMaterial.vssProof?.length.should.equal(userKeyShare.nShares[3].v?.length);
      step1SigningMaterial.publicShare.length.should.equal(
        userKeyShare.nShares[3].y.length + userKeyShare.nShares[3].chaincode.length
      );
      step1SigningMaterial.encryptedSignerOffsetShare.should.startWith('-----BEGIN PGP MESSAGE-----');
      step1SigningMaterial.userPublicGpgKey.should.startWith('-----BEGIN PGP PUBLIC KEY BLOCK-----');
      step1SigningMaterial.kShare.n.should.equal(userKeyShare.pShare.n);
      step1SigningMaterial.wShare.should.startWith('{"iv":');
    });

    it('createOfflineKShare should fail with txId passed', async function () {
      const mockPassword = 'password';
      await tssUtils
        .createOfflineKShare({
          tssParams: {
            txRequest: txRequest.txRequestId,
            prv: '',
            reqId: reqId,
          },
          challenges: {
            enterpriseChallenge: enterpriseChallenges,
            bitgoChallenge: bitgoChallenges,
          },
          prv: JSON.stringify({
            pShare: userKeyShare.pShare,
            bitgoNShare: bitgoKeyShare.nShares[1],
            backupNShare: backupKeyShare.nShares[1],
          }),
          requestType: RequestType.tx,
          walletPassphrase: mockPassword,
        })
        .should.be.rejectedWith('Invalid txRequest type');
    });

    // Seems to be flaky on CI, failed here: https://github.com/BitGo/BitGoJS/actions/runs/5902489990/job/16010623888?pr=3822
    it.skip('createOfflineMuDeltaShare should succeed', async function () {
      const mockPassword = 'password';
      const alphaLength = 1536;
      const deltaLength = 64;
      const bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
      const step2SigningMaterial = await tssUtils.createOfflineMuDeltaShare({
        aShareFromBitgo: aShare,
        bitgoChallenge: bitgoChallenges,
        encryptedWShare: bitgo.encrypt({ input: JSON.stringify(wShare), password: mockPassword }),
        walletPassphrase: mockPassword,
      });
      step2SigningMaterial.muDShare.muShare.alpha.length.should.equal(alphaLength);
      step2SigningMaterial.muDShare.dShare.delta.length.should.equal(deltaLength);
      step2SigningMaterial.oShare.should.startWith('{"iv":');
    });

    it('createOfflineMuDeltaShare should fail with incorrect password', async function () {
      const mockPassword = 'password';
      const bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
      await tssUtils
        .createOfflineMuDeltaShare({
          aShareFromBitgo: aShare,
          bitgoChallenge: bitgoChallenges,
          encryptedWShare: bitgo.encrypt({ input: JSON.stringify(wShare), password: mockPassword }),
          walletPassphrase: 'password1',
        })
        .should.be.rejectedWith("password error - ccm: tag doesn't match");
    });

    it('createOfflineSShare should succeed', async function () {
      const mockPassword = 'password';
      const pubKeyLength = 66;
      const privKeyLength = 64;
      const bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
      const step3SigningMaterial = await tssUtils.createOfflineSShare({
        tssParams: {
          txRequest: txRequest,
          prv: '',
          reqId: reqId,
        },
        dShareFromBitgo: dShare,
        encryptedOShare: bitgo.encrypt({ input: JSON.stringify(oShare), password: mockPassword }),
        walletPassphrase: mockPassword,
        requestType: RequestType.tx,
      });
      step3SigningMaterial.R.length.should.equal(pubKeyLength);
      step3SigningMaterial.y.length.should.equal(pubKeyLength);
      step3SigningMaterial.s.length.should.equal(privKeyLength);
    });

    it('createOfflineSShare should fail with txId passed', async function () {
      const mockPassword = 'password';
      const bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
      await tssUtils
        .createOfflineSShare({
          tssParams: {
            txRequest: txRequest.txRequestId,
            prv: '',
            reqId: reqId,
          },
          dShareFromBitgo: dShare,
          encryptedOShare: bitgo.encrypt({ input: JSON.stringify(oShare), password: mockPassword }),
          walletPassphrase: mockPassword,
          requestType: RequestType.tx,
        })
        .should.be.rejectedWith('Invalid txRequest type');
    });

    it('signTxRequest should fail with invalid user prv', async function () {
      const invalidUserKey = { ...userKeyShare, pShare: { ...userKeyShare.pShare, i: 2 } };
      await tssUtils
        .signTxRequest({
          txRequest: txRequestId,
          prv: JSON.stringify({
            pShare: invalidUserKey.pShare,
            bitgoNShare: bitgoKeyShare.nShares[1],
            backupNShare: backupKeyShare.nShares[1],
          }),
          reqId,
        })
        .should.be.rejectedWith('Invalid user key');
    });

    it('signTxRequest should fail with no backupNShares', async function () {
      const getTxRequest = sandbox.stub(tssUtils, 'getTxRequest');
      getTxRequest.resolves(txRequest);
      getTxRequest.calledWith(txRequestId);
      setupSignTxRequestNocks(false, userSignShare, aShare, dShare, enterpriseData);
      await tssUtils
        .signTxRequest({
          txRequest: txRequestId,
          prv: JSON.stringify({
            pShare: userKeyShare.pShare,
            bitgoNShare: bitgoKeyShare.nShares[1],
          }),
          reqId,
        })
        .should.be.rejectedWith('Invalid user key - missing backupNShare');
    });

    async function setupSignTxRequestNocks(
      isTxRequest = true,
      userSignShare: ECDSA.SignShareRT,
      aShare: ECDSA.AShare,
      dShare: ECDSA.DShare,
      enterpriseData?: EnterpriseData
    ) {
      if (enterpriseData) {
        await nockGetEnterprise({ enterpriseId: enterpriseData.id, response: enterpriseData, times: 1 });
      }
      const derivationPath = '';
      sinon.stub(ECDSAMethods, 'createUserSignShare').resolves(userSignShare);
      let response = {
        txRequests: [
          {
            ...txRequest,
            transactions: [
              {
                ...txRequest,
                unsignedTx: {
                  signableHex: txRequest.unsignedTxs[0].signableHex,
                  serializedTxHex: txRequest.unsignedTxs[0].serializedTxHex,
                  derivationPath,
                },
              },
            ],
          },
        ],
      };
      if (isTxRequest) {
        await nockGetTxRequest({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, response: response });
      }
      const aRecord = ECDSAMethods.convertAShare(aShare);
      const signatureShares = [aRecord];
      txRequest.signatureShares = signatureShares;
      response = {
        txRequests: [
          {
            ...txRequest,
            transactions: [
              {
                ...txRequest,
                unsignedTx: {
                  signableHex: txRequest.unsignedTxs[0].signableHex,
                  serializedTxHex: txRequest.unsignedTxs[0].serializedTxHex,
                  derivationPath,
                },
              },
            ],
          },
        ],
      };
      await nockGetTxRequest({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, response: response });
      const dRecord = ECDSAMethods.convertDShare(dShare);
      signatureShares.push(dRecord);
      response = {
        txRequests: [
          {
            ...txRequest,
            transactions: [
              {
                ...txRequest,
                unsignedTx: {
                  signableHex: txRequest.unsignedTxs[0].signableHex,
                  serializedTxHex: txRequest.unsignedTxs[0].serializedTxHex,
                  derivationPath,
                },
              },
            ],
          },
        ],
      };
      await nockGetTxRequest({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, response: response });
      await nockGetTxRequest({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, response: response });
    }
  });

  describe('getEcdsaSigningChallenges', function () {
    const mockWalletPaillierKey = {
      n: 'f47be4c2d8bc1e28f88c6c4da634da97d92a1c279a7b0fe7b87c337c36a27b32ce0ff0c45f16e4e15bbd20e4e640de12047eff9b1a2b98144f9a268d406bd000d192a35b6847a17e40fb85f55b314d001ff87393481cafe391807d0eb83eff9e38614b38e5f25fc4449cb01caed805584d026b5d866c723f3d4d4f1e462662f2113b1561eb2bf755b4b91d0308d8eacc439167da8b7d6e108524f226960360af00215d9614457414ebdbe8834999689e2e903208c8713ff5d9901f9eaba3aa81d705323cbbba61ba7fa9f3228f30853fb55da1b3d3ed7db1dfc6545bc96aa8d2eb848931c1b807fdfe8f65af72f68638a82fe9e22ac1f0f032e621066806a1f144b5719a5f091986867b384be6c34146c8241cbfbd781966ebbcd19e6caa27fab040e62e5a162888aa8624d046c8fe3b72244f04a7264c4a36b6366dbe7da98afb201d34be2c0d6dd11982af35bf7535582b263914725aaec280d52290527382d3ab297d746c41aacd8de98c09fcfb85a95e02de1b34d4933e51045e2f1ce8af',
      lambda:
        'f47be4c2d8bc1e28f88c6c4da634da97d92a1c279a7b0fe7b87c337c36a27b32ce0ff0c45f16e4e15bbd20e4e640de12047eff9b1a2b98144f9a268d406bd000d192a35b6847a17e40fb85f55b314d001ff87393481cafe391807d0eb83eff9e38614b38e5f25fc4449cb01caed805584d026b5d866c723f3d4d4f1e462662f2113b1561eb2bf755b4b91d0308d8eacc439167da8b7d6e108524f226960360af00215d9614457414ebdbe8834999689e2e903208c8713ff5d9901f9eaba3aa7fc3d0c0bcc5bff644156ab887146d51bcee1eef70f45c486147d687ee37def1f8a16bc945eff22dd4dca3614a99158823acd9492e347f7ec79a7771024205d07f27b30cd20340e330411da8fa2da209e5cc688da94d1dbef54bfd9c69b4e99cf06d67309a3420b82c78a0fe0dd0b9c31382eae38746cfdd27fa90022a50532246c8ae1339c93e183c03bf6fd7014be3658abc73baae1fa5b86dab94b9f125395a818e54dde6235c45d3dbc032b3078e9df1cad69d8ac19a7cb6405a558b7bfba8',
    };
    const mockBitgoPaillierKey = {
      n: 'f010d294effceb8c4f96af1978ab367c4fbb272c2169317e41ae87220652cae2ce929696ee55ec6831aa6b4b3b931babc2bac9c1a20fddbca925cc99680791f7c3157b3d31256ee72c47d47db567e0f070dce121c3a4d9e003c1f1389073acb252c65d2b0723e86e3265f67a137cb1e23f4551544405644d0ae63d35f25f40becd2b693879f3bdbec3f7250791a3f3c975a5ac78a0e81dcd1a87eb2ca67010dff880b2338556275de23d9e88d21b77da0d524ddc2b394f8de00b1af0ce85f6eee2e05a184e05494d66d2c636045bf70ed15ebd0f41a8eea2920af85e6d68a0ce11fc2abbcb3cebcc3c23ec2e148c318683a5426e15b5207efd3b9b05cb919ec4340f74dff336986d0c923df10a789007b1da9daddf8edf3014e93989f30243f27f9a307d55d630cbfcd16cd6a95a41dee10c31acc293df6834ce0e3ea5b68f170bd7938ea0c2eeb788e16f30af57b3f0888fb44d3610e7eeba60e7fd8cc4a8f044718dfc6174bf4a380690dc1dc77472a48892eb3e81775540ea0acc9e89b639',
      lambda:
        'f010d294effceb8c4f96af1978ab367c4fbb272c2169317e41ae87220652cae2ce929696ee55ec6831aa6b4b3b931babc2bac9c1a20fddbca925cc99680791f7c3157b3d31256ee72c47d47db567e0f070dce121c3a4d9e003c1f1389073acb252c65d2b0723e86e3265f67a137cb1e23f4551544405644d0ae63d35f25f40becd2b693879f3bdbec3f7250791a3f3c975a5ac78a0e81dcd1a87eb2ca67010dff880b2338556275de23d9e88d21b77da0d524ddc2b394f8de00b1af0ce85f6ecdef8a4bc955a28ecef7d97cded079d390e77c80998d78ad9510cbabfeb8f0a157dbfc590b4d59ee8c0b088f9d89473b557320078a117478624f5d1df36e30f320b6722a4217dcb46b978cc6c8f1a21c8a6c74bce84d82c481402c99a69b798e3c05f23350b4aade4f79784b1c09692b6a33cfba7f145597d82b799cccef620c36f1fbbe2cb4ac0ea395c476e381bc475d41722320f541ae9bf56aa4a12dff3ea7ab11174fb5b8df7429c9f57d36f8fc51e1a8c647d5b8fa0189fb8acdbd0a780',
    };
    const bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    const txRequestId = 'fakeTxRequestId';
    const rawEntChallengeWithProofs: EcdsaTypes.SerializedNtildeWithProofs = mockSerializedChallengeWithProofs;
    let rawBitgoChallenge: EcdsaTypes.SerializedEcdsaChallenges & { n: string };
    const adminEcdhKey = bitgo.keychains().create();
    const fakeAdminEcdhKey = bitgo.keychains().create();
    const derivationPath = 'm/0/0';
    const mockedSigningKey = {
      userId: 'id',
      userEmail: 'user@bitgo.com',
      derivedPubkey: bip32.fromBase58(adminEcdhKey.xpub).derivePath(derivationPath).publicKey.toString('hex'),
      derivationPath: derivationPath,
      ecdhKeychain: 'my keychain',
    };

    before(async function () {
      const p = await EcdsaPaillierProof.generateP(hexToBigInt(mockWalletPaillierKey.n));
      rawBitgoChallenge = {
        ...EcdsaTypes.serializeNtilde(EcdsaTypes.deserializeNtilde(mockSerializedChallengeWithProofs2)),
        p: EcdsaTypes.serializePaillierChallenge({ p }).p,
        n: mockBitgoPaillierKey.n,
      };
    });

    afterEach(function () {
      sinon.restore();
      nock.cleanAll();
    });

    it('should fetch static ent and bitgo challenges with the ent feature flag and verify them', async function () {
      await nockGetChallenge({ walletId, txRequestId, addendum: '/transactions/0', response: rawBitgoChallenge });
      await nockGetSigningKey({ enterpriseId, userId: mockedSigningKey.userId, response: mockedSigningKey, times: 1 });
      const adminSignatureEntChallenge = ECDSAUtils.EcdsaUtils.signChallenge(
        rawEntChallengeWithProofs,
        adminEcdhKey.xprv,
        derivationPath
      );
      const adminSignatureBitGoChallenge = ECDSAUtils.EcdsaUtils.signChallenge(
        rawBitgoChallenge,
        adminEcdhKey.xprv,
        derivationPath
      );
      const mockChallengesResponse = {
        enterpriseChallenge: {
          ...rawEntChallengeWithProofs,
          verifiers: {
            adminSignature: adminSignatureEntChallenge.toString('hex'),
          },
        },
        bitgoChallenge: {
          ...rawBitgoChallenge,
          verifiers: {
            adminSignature: adminSignatureBitGoChallenge.toString('hex'),
          },
        },
        createdBy: 'id',
      };

      await nockGetChallenges({ walletId: walletId, response: mockChallengesResponse });
      const challenges = await tssUtils.getEcdsaSigningChallenges(txRequestId, 0, mockWalletPaillierKey.n, 0);
      should.exist(challenges);
      const expectedRangeProofChallenges = {
        enterpriseChallenge: {
          ntilde: challenges.enterpriseChallenge.ntilde,
          h1: challenges.enterpriseChallenge.h1,
          h2: challenges.enterpriseChallenge.h2,
        },
        bitgoChallenge: rawBitgoChallenge,
      };
      expectedRangeProofChallenges.should.deepEqual({
        enterpriseChallenge: {
          ntilde: rawEntChallengeWithProofs.ntilde,
          h1: rawEntChallengeWithProofs.h1,
          h2: rawEntChallengeWithProofs.h2,
        },
        bitgoChallenge: rawBitgoChallenge,
      });
    });

    it('Fails if the enterprise challenge signature is different from the admin ecdh key', async function () {
      await nockGetChallenge({ walletId, txRequestId, addendum: '/transactions/0', response: rawBitgoChallenge });
      await nockGetEnterprise({
        enterpriseId: enterpriseData.id,
        response: {
          ...enterpriseData,
          featureFlags: ['useEnterpriseEcdsaTssChallenge'],
        },
        times: 1,
      });
      await nockGetSigningKey({ enterpriseId, userId: mockedSigningKey.userId, response: mockedSigningKey, times: 1 });
      // Bad sign
      const adminSignedEntChallenge = ECDSAUtils.EcdsaUtils.signChallenge(
        rawEntChallengeWithProofs,
        fakeAdminEcdhKey.xprv,
        derivationPath
      );
      const adminSignedBitGoChallenge = ECDSAUtils.EcdsaUtils.signChallenge(
        rawBitgoChallenge,
        adminEcdhKey.xprv,
        derivationPath
      );
      const mockChallengesResponse = {
        enterpriseChallenge: {
          ...rawEntChallengeWithProofs,
          verifiers: {
            adminSignature: adminSignedEntChallenge.toString('hex'),
          },
        },
        bitgoChallenge: {
          ...rawBitgoChallenge,
          verifiers: {
            adminSignature: adminSignedBitGoChallenge.toString('hex'),
          },
        },
        createdBy: 'id',
      };
      await nockGetChallenges({ walletId: walletId, response: mockChallengesResponse });
      await tssUtils
        .getEcdsaSigningChallenges(txRequestId, 0, mockWalletPaillierKey.n)
        .should.be.rejectedWith(
          'Admin signature for enterprise challenge is not valid. Please contact your enterprise admin.'
        );
    });

    it('Fails if the bitgo challenge signature is different from the admin ecdh key', async function () {
      await nockGetChallenge({ walletId, txRequestId, addendum: '/transactions/0', response: rawBitgoChallenge });
      await nockGetEnterprise({
        enterpriseId: enterpriseData.id,
        response: {
          ...enterpriseData,
          featureFlags: ['useEnterpriseEcdsaTssChallenge'],
        },
        times: 1,
      });
      await nockGetSigningKey({ enterpriseId, userId: mockedSigningKey.userId, response: mockedSigningKey, times: 1 });
      const adminSignedEntChallenge = ECDSAUtils.EcdsaUtils.signChallenge(
        rawEntChallengeWithProofs,
        adminEcdhKey.xprv,
        derivationPath
      );
      // Bad sign
      const adminSignedBitGoChallenge = ECDSAUtils.EcdsaUtils.signChallenge(
        rawBitgoChallenge,
        fakeAdminEcdhKey.xprv,
        derivationPath
      );
      const mockChallengesResponse = {
        enterpriseChallenge: {
          ...rawEntChallengeWithProofs,
          verifiers: {
            adminSignature: adminSignedEntChallenge.toString('hex'),
          },
        },
        bitgoChallenge: {
          ...rawBitgoChallenge,
          verifiers: {
            adminSignature: adminSignedBitGoChallenge.toString('hex'),
          },
        },
        createdBy: 'id',
      };
      await nockGetChallenges({ walletId: walletId, response: mockChallengesResponse });
      await tssUtils
        .getEcdsaSigningChallenges(txRequestId, 0, mockWalletPaillierKey.n)
        .should.be.rejectedWith(
          "Admin signature for BitGo's challenge is not valid. Please contact your enterprise admin."
        );
    });
  });

  describe('getVerifyAndSignBitGoChallenges', function () {
    const bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    const adminEcdhKey = bitgo.keychains().create();
    const derivationPath = 'm/0/0';
    const bitgoInstChallenge = mockChallengeA;
    const bitgoNitroChallenge = mockChallengeB;
    const userPassword = 'password123';
    const encryptedXprv = bitgo.encrypt({
      password: userPassword,
      input: adminEcdhKey.xprv,
    });

    beforeEach(async function () {
      sinon.stub(bitgo, 'getSigningKeyForUser').resolves({
        userId: 'id',
        userEmail: 'user@bitgo.com',
        derivedPubkey: bip32.fromBase58(adminEcdhKey.xpub).derivePath(derivationPath).publicKey.toString('hex'),
        derivationPath: derivationPath,
        ecdhKeychain: 'my keychain',
      });
      sinon.stub(bitgo, 'getECDHKeychain').resolves({
        encryptedXprv: encryptedXprv,
      });
    });

    afterEach(async function () {
      sinon.restore();
      nock.cleanAll();
    });

    function nockGetBitgoChallenges(response: unknown): nock.Scope {
      return nock(bgUrl)
        .get(`/api/v2/tss/ecdsa/challenges`)
        .times(1)
        .reply(() => [200, response]);
    }

    it('succeeds for valid bitgo proofs', async function () {
      const nockGetBitgoChallengesApi = nockGetBitgoChallenges({
        bitgoNitroHsm: bitgoNitroChallenge,
        bitgoInstitutionalHsm: bitgoInstChallenge,
      });

      await ECDSAUtils.EcdsaUtils.getVerifyAndSignBitGoChallenges(
        bitgo,
        'ent_id',
        userPassword
      ).should.not.be.rejected();
      nockGetBitgoChallengesApi.isDone().should.be.true();
    });

    it('Fails if bitgo challenge proofs are not present', async function () {
      const nockGetBitgoChallengesApi = nockGetBitgoChallenges({
        bitgoNitroHsm: {
          ...bitgoNitroChallenge,
          ntildeProof: undefined,
        },
        bitgoInstitutionalHsm: bitgoInstChallenge,
      });
      await ECDSAUtils.EcdsaUtils.getVerifyAndSignBitGoChallenges(bitgo, 'ent_id', userPassword).should.be.rejectedWith(
        'Expected BitGo challenge proof to be present. Contact support@bitgo.com.'
      );
      nockGetBitgoChallengesApi.isDone().should.be.true();
    });

    it('Fails if the user password to decrypt the ecdhkeychain is wrong', async function () {
      const nockGetBitgoChallengesApi = nockGetBitgoChallenges({
        bitgoNitroHsm: bitgoNitroChallenge,
        bitgoInstitutionalHsm: bitgoInstChallenge,
      });
      await ECDSAUtils.EcdsaUtils.getVerifyAndSignBitGoChallenges(bitgo, 'ent_id', 'bro').should.be.rejectedWith(
        'Incorrect password. Please try again.'
      );
      nockGetBitgoChallengesApi.isDone().should.be.true();
    });

    it('Fails bitgo challenge proofs for faulty nitro h2WrtH1 proof', async function () {
      const nockGetBitgoChallengesApi = nockGetBitgoChallenges({
        bitgoNitroHsm: {
          ...bitgoNitroChallenge,
          ntildeProof: {
            ...bitgoNitroChallenge.ntildeProof,
            h2WrtH1: bitgoNitroChallenge.ntildeProof.h1WrtH2,
          },
        },
        bitgoInstitutionalHsm: bitgoInstChallenge,
      });
      await ECDSAUtils.EcdsaUtils.getVerifyAndSignBitGoChallenges(bitgo, 'ent_id', userPassword).should.be.rejectedWith(
        "Failed to verify BitGo's challenge needed to enable ECDSA signing. Please contact support@bitgo.com"
      );
      nockGetBitgoChallengesApi.isDone().should.be.true();
    });

    it('Fails bitgo challenge proofs for faulty nitro h1WrtH2 proof', async function () {
      const nockGetBitgoChallengesApi = nockGetBitgoChallenges({
        bitgoNitroHsm: {
          ...bitgoNitroChallenge,
          ntildeProof: {
            ...bitgoNitroChallenge.ntildeProof,
            h1WrtH2: bitgoNitroChallenge.ntildeProof.h2WrtH1,
          },
        },
        bitgoInstitutionalHsm: bitgoInstChallenge,
      });
      await ECDSAUtils.EcdsaUtils.getVerifyAndSignBitGoChallenges(bitgo, 'ent_id', userPassword).should.be.rejectedWith(
        "Failed to verify BitGo's challenge needed to enable ECDSA signing. Please contact support@bitgo.com"
      );
      nockGetBitgoChallengesApi.isDone().should.be.true();
    });

    it('Fails bitgo challenge proofs for faulty inst h2WrtH1 proof', async function () {
      const nockGetBitgoChallengesApi = nock(bgUrl)
        .get(`/api/v2/tss/ecdsa/challenges`)
        .times(1)
        .reply(200, {
          bitgoNitroHsm: bitgoNitroChallenge,
          bitgoInstitutionalHsm: {
            ...bitgoInstChallenge,
            ntildeProof: {
              ...bitgoInstChallenge.ntildeProof,
              h2WrtH1: bitgoInstChallenge.ntildeProof.h1WrtH2,
            },
          },
        });
      await ECDSAUtils.EcdsaUtils.getVerifyAndSignBitGoChallenges(bitgo, 'ent_id', userPassword).should.be.rejectedWith(
        "Failed to verify BitGo's challenge needed to enable ECDSA signing. Please contact support@bitgo.com"
      );
      nockGetBitgoChallengesApi.isDone().should.be.true();
    });

    it('Fails bitgo challenge proofs for faulty inst h1WrtH2 proof', async function () {
      const nockGetBitgoChallengesApi = nock(bgUrl)
        .get(`/api/v2/tss/ecdsa/challenges`)
        .times(1)
        .reply(200, {
          bitgoNitroHsm: bitgoNitroChallenge,
          bitgoInstitutionalHsm: {
            ...bitgoInstChallenge,
            ntildeProof: {
              ...bitgoInstChallenge.ntildeProof,
              h1WrtH2: bitgoInstChallenge.ntildeProof.h2WrtH1,
            },
          },
        });
      await ECDSAUtils.EcdsaUtils.getVerifyAndSignBitGoChallenges(bitgo, 'ent_id', userPassword).should.be.rejectedWith(
        "Failed to verify BitGo's challenge needed to enable ECDSA signing. Please contact support@bitgo.com"
      );
      nockGetBitgoChallengesApi.isDone().should.be.true();
    });
  });

  describe('supportedTxRequestVersions', function () {
    it('returns only full for hot wallets', function () {
      const hotWallet = new Wallet(bitgo, baseCoin, { type: 'hot', multisigType: 'tss' });
      const hotWalletTssUtils = new ECDSAUtils.EcdsaUtils(bitgo, baseCoin, hotWallet);
      hotWalletTssUtils.supportedTxRequestVersions().should.deepEqual(['full']);
    });
    it('returns only full for cold wallets', function () {
      const coldWallet = new Wallet(bitgo, baseCoin, {
        type: 'cold',
        multisigType: 'tss',
      });
      const coldWalletTssUtils = new ECDSAUtils.EcdsaUtils(bitgo, baseCoin, coldWallet);

      coldWalletTssUtils.supportedTxRequestVersions().should.deepEqual(['full']);
    });
    it('returns only full for custodial wallets', function () {
      const custodialWallet = new Wallet(bitgo, baseCoin, { type: 'custodial', multisigType: 'tss' });
      const custodialWalletTssUtils = new ECDSAUtils.EcdsaUtils(bitgo, baseCoin, custodialWallet);
      custodialWalletTssUtils.supportedTxRequestVersions().should.deepEqual(['full']);
    });
    it('returns empty for trading wallets', function () {
      const tradingWallet = new Wallet(bitgo, baseCoin, { type: 'trading', multisigType: 'tss' });
      const tradingWalletTssUtils = new ECDSAUtils.EcdsaUtils(bitgo, baseCoin, tradingWallet);
      tradingWalletTssUtils.supportedTxRequestVersions().should.deepEqual([]);
    });
    it('returns empty for non-tss wallets', function () {
      const nonTssWalletData = { coin: 'tbtc', multisigType: 'onchain' };
      const btcCoin = bitgo.coin('tbtc');
      const nonTssWallet = new Wallet(bitgo, btcCoin, nonTssWalletData);
      const nonTssWalletTssUtils = new TssUtils(bitgo, btcCoin, nonTssWallet);
      nonTssWalletTssUtils.supportedTxRequestVersions().should.deepEqual([]);
    });
  });

  describe('initiateChallengesForEnterprise', function () {
    const bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    const adminEcdhKey = bitgo.keychains().create();
    const derivationPath = 'm/0/0';
    const bitgoInstChallenge = mockChallengeA;
    const bitgoNitroChallenge = mockChallengeB;
    const serializedEntChallenge = mockChallengeC;
    const userPassword = 'password123';
    const encryptedXprv = bitgo.encrypt({
      password: userPassword,
      input: adminEcdhKey.xprv,
    });

    beforeEach(async function () {
      sinon.stub(bitgo, 'getSigningKeyForUser').resolves({
        userId: 'id',
        userEmail: 'user@bitgo.com',
        derivedPubkey: bip32.fromBase58(adminEcdhKey.xpub).derivePath(derivationPath).publicKey.toString('hex'),
        derivationPath: derivationPath,
        ecdhKeychain: 'my keychain',
      });

      sinon.stub(bitgo, 'getECDHKeychain').resolves({
        encryptedXprv: encryptedXprv,
      });
    });

    afterEach(async function () {
      sinon.restore();
    });

    it('should upload challenge without generating if passed in', async function () {
      const stubUploadChallenge = sinon.stub(ECDSAUtils.EcdsaUtils, 'uploadChallengesToEnterprise');
      const deserializedEntChallenge = EcdsaTypes.deserializeNtildeWithProofs(serializedEntChallenge);

      const signedEntChallenge = ECDSAUtils.EcdsaUtils.signChallenge(
        serializedEntChallenge,
        adminEcdhKey.xprv,
        derivationPath
      );
      const signedInstChallenge = ECDSAUtils.EcdsaUtils.signChallenge(
        bitgoInstChallenge,
        adminEcdhKey.xprv,
        derivationPath
      );
      const signedNitroChallenge = ECDSAUtils.EcdsaUtils.signChallenge(
        bitgoNitroChallenge,
        adminEcdhKey.xprv,
        derivationPath
      );

      await ECDSAUtils.EcdsaUtils.initiateChallengesForEnterprise(
        bitgo,
        'ent_id',
        userPassword,
        signedInstChallenge,
        signedNitroChallenge,
        deserializedEntChallenge
      ).should.not.be.rejected();
      stubUploadChallenge.should.be.calledWith(
        bitgo,
        'ent_id',
        serializedEntChallenge,
        signedEntChallenge.toString('hex'),
        signedInstChallenge.toString('hex'),
        signedNitroChallenge.toString('hex')
      );
    });

    it('should generate a challenge and if one is not provided', async function () {
      const stubUploadChallenge = sinon.stub(ECDSAUtils.EcdsaUtils, 'uploadChallengesToEnterprise');
      const deserializedEntChallenge = EcdsaTypes.deserializeNtildeWithProofs(serializedEntChallenge);
      sinon.stub(EcdsaRangeProof, 'generateNtilde').resolves(deserializedEntChallenge);

      const signedEntChallenge = ECDSAUtils.EcdsaUtils.signChallenge(
        serializedEntChallenge,
        adminEcdhKey.xprv,
        derivationPath
      );
      const signedInstChallenge = ECDSAUtils.EcdsaUtils.signChallenge(
        bitgoInstChallenge,
        adminEcdhKey.xprv,
        derivationPath
      );
      const signedNitroChallenge = ECDSAUtils.EcdsaUtils.signChallenge(
        bitgoNitroChallenge,
        adminEcdhKey.xprv,
        derivationPath
      );

      await ECDSAUtils.EcdsaUtils.initiateChallengesForEnterprise(
        bitgo,
        'ent_id',
        userPassword,
        signedInstChallenge,
        signedNitroChallenge
      ).should.not.be.rejected();
      stubUploadChallenge.should.be.calledWith(
        bitgo,
        'ent_id',
        serializedEntChallenge,
        signedEntChallenge.toString('hex'),
        signedInstChallenge.toString('hex'),
        signedNitroChallenge.toString('hex')
      );
    });
  });

  it('getMessageToSignFromChallenge concatenates the challenge values only', function () {
    const challenge = mockChallengeA;
    const expectedMessageToSign = challenge.ntilde.concat(challenge.h1).concat(challenge.h2);
    const message = ECDSAUtils.EcdsaUtils.getMessageToSignFromChallenge(challenge);
    message.should.equal(expectedMessageToSign);
  });
  describe('validateCommonKeychainPublicKey', function () {
    it('validateCommonKeychainPublicKey returns correct public key', function () {
      const commonKeychain =
        '03f40c70545b519bb7bbc7195fd4b7d5bbfc873bfd38b18596e4b47a05b6a88d552e2e8319cb31e279b99dbe54115a983d35e86679af96d81b7478d1df368f76a8';
      const expectedPubKeyResult = `f40c70545b519bb7bbc7195fd4b7d5bbfc873bfd38b18596e4b47a05b6a88d556a10d6ab8055dc0b3a9af9dc4e42f4f9773c590afcc298d017c1b1ce29a88041`;
      const actualPubKey = ECDSAUtils.EcdsaUtils.validateCommonKeychainPublicKey(commonKeychain);
      actualPubKey.should.equal(expectedPubKeyResult);
    });
    it('validateCommonKeychainPublicKey throws correctly with invalid length', function () {
      const commonKeychain = '03f40c70548';
      should(() => ECDSAUtils.EcdsaUtils.validateCommonKeychainPublicKey(commonKeychain)).throwError(
        'Invalid commonKeychain length, expected 130, got 11'
      );
    });
    it('validateCommonKeychainPublicKey throws correctly with invalid commonKeychain', function () {
      const commonKeychainWithInvalidCharacters =
        '!@#$^0c70545b519bb7bbc7195fd4b7d5bfc873bfd38b18596e4b47a05b6a88d552e2e8319cb31e279b99dbe54115a983d35e86679af96d81b7478d1df368f76a8'; // 129 chars
      should(() =>
        ECDSAUtils.EcdsaUtils.validateCommonKeychainPublicKey(commonKeychainWithInvalidCharacters)
      ).throwError('Unknown point format');
    });
  });

  // #region Nock helpers
  async function createIncompleteBitgoHeldBackupKeyShare(
    userGpgKey: openpgp.SerializedKeyPair<string>,
    backupKeyShare: KeyShare,
    bitgoGpgKey: openpgp.SerializedKeyPair<string>
  ): Promise<BitgoHeldBackupKeyShare> {
    const nSharePromises = [
      encryptNShare(backupKeyShare, 1, userGpgKey.publicKey, userGpgKey, false),
      encryptNShare(backupKeyShare, 3, bitgoGpgKey.publicKey, userGpgKey, false),
    ];

    const backupToUserPublicShare = Buffer.concat([
      Buffer.from(backupKeyShare.nShares[1].y, 'hex'),
      Buffer.from(backupKeyShare.nShares[1].chaincode, 'hex'),
    ]).toString('hex');

    const backupToBitgoPublicShare = Buffer.concat([
      Buffer.from(backupKeyShare.nShares[3].y, 'hex'),
      Buffer.from(backupKeyShare.nShares[3].chaincode, 'hex'),
    ]).toString('hex');

    return {
      id: '4711',
      keyShares: [
        {
          from: 'backup',
          to: 'user',
          publicShare: backupToUserPublicShare,
          privateShare: (await nSharePromises[0]).encryptedPrivateShare,
        },
        {
          from: 'backup',
          to: 'bitgo',
          publicShare: backupToBitgoPublicShare,
          privateShare: (await nSharePromises[1]).encryptedPrivateShare,
        },
      ],
    };
  }

  async function nockGetBitgoPublicKeyBasedOnFeatureFlags(
    coin: string,
    enterpriseId: string,
    bitgoGpgKeyPair: openpgp.SerializedKeyPair<string>
  ): Promise<BitgoGPGPublicKey> {
    const bitgoGPGPublicKeyResponse: BitgoGPGPublicKey = {
      name: 'irrelevant',
      publicKey: bitgoGpgKeyPair.publicKey,
      enterpriseId,
    };
    nock(bgUrl).get(`/api/v2/${coin}/tss/pubkey`).query({ enterpriseId }).reply(200, bitgoGPGPublicKeyResponse);

    return bitgoGPGPublicKeyResponse;
  }

  async function nockCreateBitgoHeldBackupKeyShare(
    coin: string,
    enterpriseId: string,
    userGpgKey: openpgp.SerializedKeyPair<string>,
    backupKeyShare: KeyShare,
    bitgoGpgKey: openpgp.SerializedKeyPair<string>
  ): Promise<BitgoHeldBackupKeyShare> {
    const keyShare = await createIncompleteBitgoHeldBackupKeyShare(userGpgKey, backupKeyShare, bitgoGpgKey);

    nock(bgUrl)
      .post(
        `/api/v2/${coin}/krs/backupkeys`,
        _.matches({ enterprise: enterpriseId, userGPGPublicKey: userGpgKey.publicKey })
      )
      .reply(201, keyShare);

    return keyShare;
  }

  async function nockFinalizeBitgoHeldBackupKeyShare(
    coin: string,
    originalKeyShare: BitgoHeldBackupKeyShare,
    commonKeychain: string,
    userKeyShare: KeyShare,
    userLocalBackupGpgKey: openpgp.SerializedKeyPair<string>,
    bitgoKeychain: Keychain
  ): Promise<BitgoHeldBackupKeyShare> {
    const encryptedUserToBackupKeyShare = await encryptNShare(
      userKeyShare,
      2,
      userLocalBackupGpgKey.publicKey,
      userGpgKey,
      false
    );

    assert(bitgoKeychain.keyShares);
    const bitgoToBackupKeyShare = bitgoKeychain.keyShares.find(
      (keyShare) => keyShare.from === 'bitgo' && keyShare.to === 'backup'
    );
    assert(bitgoToBackupKeyShare);

    const userPublicShare = Buffer.concat([
      Buffer.from(userKeyShare.nShares[2].y, 'hex'),
      Buffer.from(userKeyShare.nShares[2].chaincode, 'hex'),
    ]).toString('hex');

    const expectedKeyShares = [
      {
        from: 'user',
        to: 'backup',
        publicShare: userPublicShare,
        // Omitting the private share, the actual encryption happens inside the function where we make the matching call
        // to this nock. We cannot recreate the same encrypted value here because gpg encryption is not deterministic
      },
      bitgoToBackupKeyShare,
    ];

    const updatedKeyShare: BitgoHeldBackupKeyShare = {
      id: originalKeyShare.id,
      commonKeychain,
      keyShares: [
        ...originalKeyShare.keyShares,
        {
          from: 'user',
          to: 'backup',
          publicShare: userPublicShare,
          privateShare: encryptedUserToBackupKeyShare.encryptedPrivateShare,
        },
        bitgoToBackupKeyShare,
      ],
    };

    nock(bgUrl)
      .put(
        `/api/v2/${coin}/krs/backupkeys/${originalKeyShare.id}`,
        _.matches({ commonKeychain, keyShares: expectedKeyShares })
      )
      .reply(200, updatedKeyShare);

    return updatedKeyShare;
  }

  /**
   * Helper function to generate a bitgo keychain given the full set of keyshares and GPG keys.
   * Also mocks the wallet signatures added by the HSM.
   * @param params
   */
  async function generateBitgoKeychain(params: {
    coin: string;
    userKeyShare: KeyShare;
    backupKeyShare: KeyShare;
    bitgoKeyShare: KeyShare;
    userGpgKey: openpgp.SerializedKeyPair<string>;
    userLocalBackupGpgKey: openpgp.SerializedKeyPair<string>;
    bitgoGpgKey: openpgp.SerializedKeyPair<string>;
  }): Promise<Keychain> {
    const bitgoCombined = MPC.keyCombine(params.bitgoKeyShare.pShare, [
      params.userKeyShare.nShares[3],
      params.backupKeyShare.nShares[3],
    ]);
    const userGpgKeyActual = await openpgp.readKey({ armoredKey: params.userGpgKey.publicKey });
    const backupGpgKeyActual = await openpgp.readKey({ armoredKey: params.userLocalBackupGpgKey.publicKey });

    const nSharePromises = [
      encryptNShare(params.bitgoKeyShare, 1, params.userGpgKey.publicKey, params.userGpgKey, false),
      encryptNShare(
        params.bitgoKeyShare,
        2,
        params.userLocalBackupGpgKey.publicKey,
        params.userLocalBackupGpgKey,
        false
      ),
    ];
    const [userToBitgoShare, backupToBitgoShare] = await Promise.all(nSharePromises);
    const bitgoKeychain: Keychain = {
      id: '3',
      pub: '',
      commonKeychain: bitgoCombined.xShare.y + bitgoCombined.xShare.chaincode,
      keyShares: [
        {
          from: 'bitgo',
          to: 'user',
          publicShare: userToBitgoShare.publicShare,
          privateShare: userToBitgoShare.encryptedPrivateShare,
          n: userToBitgoShare.n,
          vssProof: userToBitgoShare.vssProof,
          privateShareProof: userToBitgoShare.privateShareProof,
        },
        {
          from: 'bitgo',
          to: 'backup',
          publicShare: backupToBitgoShare.publicShare,
          privateShare: backupToBitgoShare.encryptedPrivateShare,
          n: backupToBitgoShare.n,
          vssProof: backupToBitgoShare.vssProof,
          privateShareProof: backupToBitgoShare.privateShareProof,
        },
      ],
      type: 'tss',
    };

    const userKeyId = userGpgKeyActual.keyPacket.getFingerprint();
    const backupKeyId = backupGpgKeyActual.keyPacket.getFingerprint();
    const bitgoToUserPublicU =
      Buffer.from(
        ecc.pointFromScalar(Buffer.from(params.bitgoKeyShare.nShares[1].u, 'hex'), true) as Uint8Array
      ).toString('hex') + params.bitgoKeyShare.nShares[1].chaincode;
    const bitgoToBackupPublicU =
      Buffer.from(
        ecc.pointFromScalar(Buffer.from(params.bitgoKeyShare.nShares[2].u, 'hex'), true) as Uint8Array
      ).toString('hex') + params.bitgoKeyShare.nShares[2].chaincode;

    bitgoKeychain.walletHSMGPGPublicKeySigs = await createWalletSignatures(
      params.bitgoGpgKey.privateKey,
      params.userGpgKey.publicKey,
      params.userLocalBackupGpgKey.publicKey,
      [
        { name: 'commonKeychain', value: bitgoCombined.xShare.y + bitgoCombined.xShare.chaincode },
        { name: 'userKeyId', value: userKeyId },
        { name: 'backupKeyId', value: backupKeyId },
        { name: 'bitgoToUserPublicShare', value: bitgoToUserPublicU },
        { name: 'bitgoToBackupPublicShare', value: bitgoToBackupPublicU },
      ]
    );

    return bitgoKeychain;
  }

  async function nockBitgoKeychain(params: {
    coin: string;
    userKeyShare: KeyShare;
    backupKeyShare: KeyShare;
    bitgoKeyShare: KeyShare;
    userGpgKey: openpgp.SerializedKeyPair<string>;
    userLocalBackupGpgKey: openpgp.SerializedKeyPair<string>;
    bitgoGpgKey: openpgp.SerializedKeyPair<string>;
  }): Promise<Keychain> {
    const bitgoKeychain = await generateBitgoKeychain(params);

    nock(bgUrl)
      .persist()
      .post(`/api/v2/${params.coin}/key`, _.matches({ keyType: 'tss', source: 'bitgo' }))
      .reply(200, bitgoKeychain);

    return bitgoKeychain;
  }

  async function nockKeychain(params: {
    coin: string;
    keyChain: Keychain;
    source: 'user' | 'backup';
  }): Promise<Keychain> {
    nock('https://bitgo.fakeurl')
      .persist()
      .post(`/api/v2/${params.coin}/key`, _.matches({ keyType: 'tss', source: params.source }))
      .reply(200, params.keyChain);

    return params.keyChain;
  }
  // #endregion Nock helpers
});
