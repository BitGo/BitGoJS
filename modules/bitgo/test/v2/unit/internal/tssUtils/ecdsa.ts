import * as assert from 'assert';
import * as _ from 'lodash';
import * as nock from 'nock';
import * as openpgp from 'openpgp';
import * as should from 'should';
import * as sinon from 'sinon';

import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo, createSharedDataProof } from '../../../../../src';
import {
  common,
  Keychain,
  Wallet,
  Ecdsa,
  ECDSA,
  ECDSAUtils,
  ECDSAMethods,
  TxRequest,
  SignatureShareType,
  SignatureShareRecord,
  RequestTracer,
  BitgoHeldBackupKeyShare,
  BackupKeyShare,
  BitgoGPGPublicKey,
  BackupGpgKey,
} from '@bitgo/sdk-core';
import { keyShares, mockAShare, mockDShare, otherKeyShares } from '../../../fixtures/tss/ecdsaFixtures';
import { nockSendSignatureShareWithResponse } from './common';
import { createWalletSignatures, nockGetTxRequest } from '../../tss/helpers';
import { ecc } from '@bitgo/utxo-lib';

const encryptNShare = ECDSAMethods.encryptNShare;
type KeyShare = ECDSA.KeyShare;

describe('TSS Ecdsa Utils:', async function () {
  let sandbox: sinon.SinonSandbox;
  let MPC: Ecdsa;
  let bgUrl: string;
  let tssUtils: ECDSAUtils.EcdsaUtils;
  let wallet: Wallet;
  let bitgoKeyShare;
  let userKeyShare: KeyShare;
  let backupKeyShare: KeyShare;
  let bitgoPublicKey: openpgp.Key;
  let thirdPartyBackupPublicGpgKey: openpgp.Key;
  const isThirdPartyBackup = false;
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

  const coinName = 'gteth';
  const reqId = new RequestTracer;

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

    const gpgKeyPromises = [openpgp.generateKey({
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
    })];
    [userGpgKey, userLocalBackupGpgKey, thirdPartyBackupGpgKeyPair, bitGoGPGKeyPair] = await Promise.all(gpgKeyPromises);
    thirdPartyBackupPublicGpgKey = await openpgp.readKey({ armoredKey: thirdPartyBackupGpgKeyPair.publicKey });
    bitgoPublicKey = await openpgp.readKey({ armoredKey: bitGoGPGKeyPair.publicKey });
    const constants = {
      mpc: {
        bitgoPublicKey: bitGoGPGKeyPair.publicKey,
      },
    };

    const bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    bitgo.initializeTestVars();

    const baseCoin = bitgo.coin(coinName);

    bgUrl = common.Environments[bitgo.getEnv()].uri;

    nock(bgUrl)
      .persist()
      .get('/api/v1/client/constants')
      .reply(200, { ttl: 3600, constants });

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
      id: '5b34252f1bf349930e34020a00000000',
      coin: coinName,
      coinSpecific: {},
    };
    wallet = new Wallet(bitgo, baseCoin, walletData);
    tssUtils = new ECDSAUtils.EcdsaUtils(bitgo, baseCoin, wallet);
  });

  after(function () {
    nock.cleanAll();
  });

  describe('TSS key chains', async function() {
    it('should create backup key share held by BitGo', async function () {
      const enterpriseId = 'enterprise id';
      const expectedKeyShare = await nockCreateBitgoHeldBackupKeyShare(coinName, enterpriseId, userGpgKey, backupKeyShare, bitGoGPGKeyPair);
      const result = await tssUtils.createBitgoHeldBackupKeyShare(userGpgKey, enterpriseId);
      result.should.eql(expectedKeyShare);
    });

    it('should finalize backup key share held by BitGo', async function () {
      const commonKeychain = '4428';
      const originalKeyShare = await createIncompleteBitgoHeldBackupKeyShare(userGpgKey, backupKeyShare, bitGoGPGKeyPair);
      const expectedFinalKeyShare = await nockFinalizeBitgoHeldBackupKeyShare(coinName, originalKeyShare, commonKeychain, userKeyShare, bitGoGPGKeyPair, nockedBitGoKeychain);

      const result = await tssUtils.finalizeBitgoHeldBackupKeyShare(originalKeyShare.id, commonKeychain, userKeyShare, nockedBitGoKeychain, userGpgKey, bitgoPublicKey);
      result.should.eql(expectedFinalKeyShare);
    });

    it('should create a user keychain from third party backup provider', async function() {
      const backupKeyShares = await createIncompleteBitgoHeldBackupKeyShare(userGpgKey, backupKeyShare, bitGoGPGKeyPair);
      const backupShareHolder: BackupKeyShare = {
        bitGoHeldKeyShares: backupKeyShares,
      };
      assert(backupShareHolder.bitGoHeldKeyShares);
      const userKeychain = await tssUtils.createUserKeychainFromThirdPartyBackup(userGpgKey, bitgoPublicKey, thirdPartyBackupPublicGpgKey, userKeyShare, backupShareHolder.bitGoHeldKeyShares?.keyShares, nockedBitGoKeychain, 'password', '1234');
      userKeychain.should.deepEqual(nockedUserKeychain);
    });

    it('should get the respective backup key shares based on provider', async function() {
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

    it('should get the correct bitgo gpg key based on coin and feature flags', async function() {
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

    it('getBackupEncryptedNShare should get valid encrypted n shares based on provider', async function() {
      // Backup key held by third party
      const bitgoHeldBackupKeyShare = await createIncompleteBitgoHeldBackupKeyShare(userGpgKey, backupKeyShare, bitGoGPGKeyPair);
      const backupShareHolder: BackupKeyShare = {
        bitGoHeldKeyShares: bitgoHeldBackupKeyShare,
      };
      const backupToBitgoShare = bitgoHeldBackupKeyShare.keyShares.find(
        (keyShare) => keyShare.from === 'backup' && keyShare.to === 'bitgo'
      );
      const bitgoGpgKeyPubKey = await tssUtils.getBitgoPublicGpgKey();
      let backupToBitgoEncryptedNShare = await tssUtils.getBackupEncryptedNShare(backupShareHolder, 3, bitgoGpgKeyPubKey.armor(), userGpgKey, true);
      should.exist(backupToBitgoEncryptedNShare);
      should.equal(backupToBitgoEncryptedNShare.encryptedPrivateShare, backupToBitgoShare?.privateShare);

      // Backup key held by user
      const backupShareHolderNew: BackupKeyShare = {
        userHeldKeyShare: backupKeyShare,
      };
      backupToBitgoEncryptedNShare = await tssUtils.getBackupEncryptedNShare(backupShareHolderNew, 3, bitgoGpgKeyPubKey.armor(), userGpgKey, false);
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
      const bitgoHeldBackupShares = await createIncompleteBitgoHeldBackupKeyShare(userGpgKey, backupKeyShare, nitroGPGKeypair);
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

      await nockFinalizeBitgoHeldBackupKeyShare(coinName, bitgoHeldBackupShares, bitgoKeychain.commonKeychain, userKeyShare, nitroGPGKeypair, bitgoKeychain);

      const userBackupKeyChainPromises = [tssUtils.createUserKeychain({
        userGpgKey,
        backupGpgKey,
        userKeyShare,
        backupKeyShare: backupShareHolder,
        bitgoKeychain,
        passphrase: 'passphrase',
        enterprise: undefined,
        isThirdPartyBackup,
        bitgoPublicGpgKey: bitgoGpgPublicKey,
      }), tssUtils.createBackupKeychain({
        userGpgKey,
        backupGpgKey,
        userKeyShare,
        backupKeyShare: backupShareHolder,
        bitgoKeychain,
        enterprise: undefined,
        bitgoPublicGpgKey: bitgoGpgPublicKey,
        backupProvider,
      })];
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
      const bitgoToBackupShare = bitgoKeychain.keyShares?.find((keyShare) => keyShare.from === 'bitgo' && keyShare.to === 'backup');
      assert(bitgoToBackupShare);
      backupKeychain.keyShares.should.matchAny(bitgoToBackupShare);

      const userToBackupShare = backupKeychain.keyShares.find((keyShare) => keyShare.from === 'user' && keyShare.to === 'backup');
      assert(userToBackupShare);
      userToBackupShare.publicShare.should.equal(Buffer.concat([
        Buffer.from(userKeyShare.nShares[2].y, 'hex'),
        Buffer.from(userKeyShare.nShares[2].chaincode, 'hex'),
      ]).toString('hex'));
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
          'passphrase'),
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
        tssUtils.createParticipantKeychain(
          userGpgKey,
          userLocalBackupGpgKey,
          bitgoPublicKey,
          1,
          userKeyShare,
          testKeyShares[0],
          bitgoKeychain,
          'passphrase').should.be.rejectedWith('Common keychains do not match'),
        tssUtils.createParticipantKeychain(
          userGpgKey,
          userLocalBackupGpgKey,
          bitgoPublicKey,
          1,
          testKeyShares[1],
          backupKeyShare,
          bitgoKeychain,
          'passphrase')
          .should.be.rejectedWith('Common keychains do not match'),
        tssUtils.createParticipantKeychain(
          userGpgKey,
          userLocalBackupGpgKey,
          bitgoPublicKey,
          2,
          testKeyShares[2],
          backupKeyShare,
          bitgoKeychain,
          'passphrase')
          .should.be.rejectedWith('Common keychains do not match'),
        tssUtils.createParticipantKeychain(
          userGpgKey,
          userLocalBackupGpgKey,
          bitgoPublicKey,
          2,
          userKeyShare,
          testKeyShares[3],
          bitgoKeychain,
          'passphrase').should.be.rejectedWith('Common keychains do not match'),
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
      await tssUtils.verifyWalletSignatures(userLocalBackupGpgKey.publicKey, userLocalBackupGpgKey.publicKey, bitgoKeychain, '', 1).should.be.rejectedWith(`Invalid wallet signatures`);
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
      await tssUtils.verifyWalletSignatures(userLocalBackupGpgKey.publicKey, userLocalBackupGpgKey.publicKey, bitgoKeychain, '', 1).should.be.rejectedWith(`first wallet signature's fingerprint does not match passed user gpg key's fingerprint`);

      // using the user gpg here instead of the backup gpg key to simulate that the second signature has a different
      // fingerprint from the passed in second gpg key
      await tssUtils.verifyWalletSignatures(userGpgKey.publicKey, userGpgKey.publicKey, bitgoKeychain, '', 1).should.be.rejectedWith(`second wallet signature's fingerprint does not match passed backup gpg key's fingerprint`);
    });
  });

  describe('signTxRequest:', () => {
    const txRequestId = 'randomidEcdsa';
    const txRequest: TxRequest = {
      txRequestId,
      transactions: [{
        unsignedTx: {
          serializedTxHex: 'TOO MANY SECRETS',
          signableHex: 'TOO MANY SECRETS',
          derivationPath: '', // Needs this when key derivation is supported
        },
        state: 'pendingSignature',
        signatureShares: [],
      }],
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

    beforeEach(async () => {

      // Initializing user and bitgo for creating shares for nocks
      const userSigningKey = MPC.keyCombine(userKeyShare.pShare, [
        bitgoKeyShare.nShares[1], backupKeyShare.nShares[1],
      ]);
      const bitgoSigningKey = MPC.keyCombine(bitgoKeyShare.pShare, [
        userKeyShare.nShares[3], backupKeyShare.nShares[3],
      ]);

      /**
       * START STEP ONE
       * 1) User creates signShare, saves wShare and sends kShare to bitgo
       * 2) Bitgo performs signConvert operation using its private xShare , yShare
       *  and KShare from user and responds back with aShare and saves bShare for later use
       */
      const userSignShare = await ECDSAMethods.createUserSignShare(userSigningKey.xShare, userSigningKey.yShares[3]);
      const signatureShareOneFromUser: SignatureShareRecord = {
        from: SignatureShareType.USER,
        to: SignatureShareType.BITGO,
        share: userSignShare.kShare.k + userSignShare.kShare.n,
      };
      const getBitgoAandBShare = MPC.signConvert({
        kShare: userSignShare.kShare,
        xShare: bitgoSigningKey.xShare,
        yShare: bitgoSigningKey.yShares['1'], // corresponds to the user
      });
      const bitgoAshare = getBitgoAandBShare.aShare as ECDSA.AShare;
      const aShareBitgoResponse = (bitgoAshare.k as string) + (bitgoAshare.alpha as string) + (bitgoAshare.mu as string) + (bitgoAshare.n as string);
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
        share: (userGammaAndMuShares?.muShare?.alpha as string) + (userGammaAndMuShares?.muShare?.mu as string),
      };
      const getBitGoGShareAndSignerIndexes = MPC.signConvert({
        bShare: getBitgoAandBShare.bShare,
        muShare: userGammaAndMuShares.muShare,
      });

      const getBitgoOShareAndDShares = MPC.signCombine(
        {
          gShare: getBitGoGShareAndSignerIndexes.gShare as ECDSA.GShare,
          signIndex: {
            i: 1,
            j: 3,
          },
        }
      );
      const bitgoDshare = getBitgoOShareAndDShares.dShare as ECDSA.DShare;
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
      const userOmicronAndDeltaShare = await ECDSAMethods.createUserOmicronAndDeltaShare(userGammaAndMuShares.gShare as ECDSA.GShare);
      const signablePayload = Buffer.from(txRequest.unsignedTxs[0].signableHex, 'hex');
      const userSShare = await ECDSAMethods.createUserSignatureShare(userOmicronAndDeltaShare.oShare, bitgoDshare, signablePayload);
      const signatureShareThreeFromUser: SignatureShareRecord = {
        from: SignatureShareType.USER,
        to: SignatureShareType.BITGO,
        share: userSShare.R + userSShare.s + userSShare.y + userOmicronAndDeltaShare.dShare.delta + userOmicronAndDeltaShare.dShare.Gamma,
      };
      const getBitGoSShare = MPC.sign(signablePayload, getBitgoOShareAndDShares.oShare, userOmicronAndDeltaShare.dShare);
      const getBitGoFinalSignature = MPC.constructSignature([getBitGoSShare, userSShare]);
      const finalSigantureBitgoResponse = getBitGoFinalSignature.r + getBitGoFinalSignature.s + getBitGoFinalSignature.y;
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
    });

    it('signTxRequest should succeed with txRequest object as input', async function () {
      await setupSignTxRequestNocks(false);
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
    });

    it('signTxRequest should succeed with txRequest id as input', async function () {
      await setupSignTxRequestNocks();
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
    });

    it('signTxRequest should fail with invalid user prv', async function () {
      const getTxRequest = sandbox.stub(tssUtils, 'getTxRequest');
      getTxRequest.resolves(txRequest);
      getTxRequest.calledWith(txRequestId);

      setupSignTxRequestNocks();

      const invalidUserKey = { ...userKeyShare, pShare: { ...userKeyShare.pShare, i: 2 } };
      await tssUtils.signTxRequest({
        txRequest: txRequestId,
        prv: JSON.stringify({
          pShare: invalidUserKey.pShare,
          bitgoNShare: bitgoKeyShare.nShares[1],
          backupNShare: backupKeyShare.nShares[1],
        }),
        reqId,
      }).should.be.rejectedWith('Invalid user key');

      sandbox.verifyAndRestore();
    });

    it('signTxRequest should fail with no backupNShares', async function () {
      const getTxRequest = sandbox.stub(tssUtils, 'getTxRequest');
      getTxRequest.resolves(txRequest);
      getTxRequest.calledWith(txRequestId);

      setupSignTxRequestNocks();

      await tssUtils.signTxRequest({
        txRequest: txRequestId,
        prv: JSON.stringify({
          pShare: userKeyShare.pShare,
          bitgoNShare: bitgoKeyShare.nShares[1],
        }),
        reqId,
      }).should.be.rejectedWith('Invalid user key - missing backupNShare');

      sandbox.verifyAndRestore();
    });

    async function setupSignTxRequestNocks(isTxRequest = true) {
      let response = { txRequests: [{ ...txRequest, transactions: [{ ...txRequest, unsignedTx: { signableHex: txRequest.unsignedTxs[0].signableHex, serializedTxHex: txRequest.unsignedTxs[0].serializedTxHex } }] }] };
      if (isTxRequest) {
        await nockGetTxRequest({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, response: response });
      }
      const aRecord = ECDSAMethods.convertAShare(mockAShare);
      const signatureShares = [aRecord];
      txRequest.signatureShares = signatureShares;
      response = { txRequests: [{ ...txRequest, transactions: [{ ...txRequest, unsignedTx: { signableHex: txRequest.unsignedTxs[0].signableHex, serializedTxHex: txRequest.unsignedTxs[0].serializedTxHex } }] }] };
      await nockGetTxRequest({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, response: response });
      const dRecord = ECDSAMethods.convertDShare(mockDShare);
      signatureShares.push(dRecord);
      response = { txRequests: [{ ...txRequest, transactions: [{ ...txRequest, unsignedTx: { signableHex: txRequest.unsignedTxs[0].signableHex, serializedTxHex: txRequest.unsignedTxs[0].serializedTxHex } }] }] };
      await nockGetTxRequest({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, response: response });
      await nockGetTxRequest({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, response: response });
    }
  });


  // #region Nock helpers
  async function createIncompleteBitgoHeldBackupKeyShare(userGpgKey: openpgp.SerializedKeyPair<string>, backupKeyShare: KeyShare, bitgoGpgKey: openpgp.SerializedKeyPair<string>): Promise<BitgoHeldBackupKeyShare> {
    const nSharePromises = [encryptNShare(
      backupKeyShare,
      1,
      userGpgKey.publicKey,
      userGpgKey,
      false,
    ), encryptNShare(
      backupKeyShare,
      3,
      bitgoGpgKey.publicKey,
      userGpgKey,
      false,
    )];

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
      keyShares: [{
        from: 'backup',
        to: 'user',
        publicShare: backupToUserPublicShare,
        privateShare: (await nSharePromises[0]).encryptedPrivateShare,
      }, {
        from: 'backup',
        to: 'bitgo',
        publicShare: backupToBitgoPublicShare,
        privateShare: (await nSharePromises[1]).encryptedPrivateShare,
      }],
    };
  }

  async function nockGetBitgoPublicKeyBasedOnFeatureFlags(coin: string, enterpriseId: string, bitgoGpgKeyPair: openpgp.SerializedKeyPair<string>): Promise<BitgoGPGPublicKey> {
    const bitgoGPGPublicKeyResponse: BitgoGPGPublicKey = {
      name: 'irrelevant',
      publicKey: bitgoGpgKeyPair.publicKey,
      enterpriseId,
    };
    nock(bgUrl)
      .get(`/api/v2/${coin}/tss/pubkey`)
      .query({ enterpriseId })
      .reply(200, bitgoGPGPublicKeyResponse);

    return bitgoGPGPublicKeyResponse;
  }

  async function nockCreateBitgoHeldBackupKeyShare(coin: string, enterpriseId: string, userGpgKey: openpgp.SerializedKeyPair<string>, backupKeyShare: KeyShare, bitgoGpgKey: openpgp.SerializedKeyPair<string>): Promise<BitgoHeldBackupKeyShare> {
    const keyShare = await createIncompleteBitgoHeldBackupKeyShare(userGpgKey, backupKeyShare, bitgoGpgKey);

    nock(bgUrl)
      .post(`/api/v2/${coin}/krs/backupkeys`, _.matches({ enterprise: enterpriseId, userGPGPublicKey: userGpgKey.publicKey }))
      .reply(201, keyShare);

    return keyShare;
  }

  async function nockFinalizeBitgoHeldBackupKeyShare(coin: string, originalKeyShare: BitgoHeldBackupKeyShare, commonKeychain: string, userKeyShare: KeyShare, userLocalBackupGpgKey: openpgp.SerializedKeyPair<string>, bitgoKeychain: Keychain): Promise<BitgoHeldBackupKeyShare> {
    const encryptedUserToBackupKeyShare = await encryptNShare(
      userKeyShare,
      2,
      userLocalBackupGpgKey.publicKey,
      userGpgKey,
      false,
    );

    assert(bitgoKeychain.keyShares);
    const bitgoToBackupKeyShare = bitgoKeychain.keyShares.find((keyShare) => keyShare.from === 'bitgo' && keyShare.to === 'backup');
    assert(bitgoToBackupKeyShare);

    const userPublicShare = Buffer.concat([
      Buffer.from(userKeyShare.nShares[2].y, 'hex'),
      Buffer.from(userKeyShare.nShares[2].chaincode, 'hex'),
    ]).toString('hex');

    const expectedKeyShares = [{
      from: 'user',
      to: 'backup',
      publicShare: userPublicShare,
      // Omitting the private share, the actual encryption happens inside the function where we make the matching call
      // to this nock. We cannot recreate the same encrypted value here because gpg encryption is not deterministic
    }, bitgoToBackupKeyShare];

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
      .put(`/api/v2/${coin}/krs/backupkeys/${originalKeyShare.id}`, _.matches({ commonKeychain, keyShares: expectedKeyShares }))
      .reply(200, updatedKeyShare);

    return updatedKeyShare;
  }

  /**
   * Helper function to generate a bitgo keychain given the full set of keyshares and GPG keys.
   * Also mocks the wallet signatures added by the HSM.
   * @param params
   */
  async function generateBitgoKeychain(params: {
    coin: string,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare,
    bitgoKeyShare: KeyShare,
    userGpgKey: openpgp.SerializedKeyPair<string>,
    userLocalBackupGpgKey: openpgp.SerializedKeyPair<string>,
    bitgoGpgKey: openpgp.SerializedKeyPair<string>,
  }): Promise<Keychain> {
    const bitgoCombined = MPC.keyCombine(params.bitgoKeyShare.pShare, [params.userKeyShare.nShares[3], params.backupKeyShare.nShares[3]]);
    const userGpgKeyActual = await openpgp.readKey({ armoredKey: params.userGpgKey.publicKey });
    const backupGpgKeyActual = await openpgp.readKey({ armoredKey: params.userLocalBackupGpgKey.publicKey });

    const nSharePromises = [
      encryptNShare(
        params.bitgoKeyShare,
        1,
        params.userGpgKey.publicKey,
        params.userGpgKey,
        false,
      ),
      encryptNShare(
        params.bitgoKeyShare,
        2,
        params.userLocalBackupGpgKey.publicKey,
        params.userLocalBackupGpgKey,
        false,
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
    const bitgoToUserPublicU = (ecc.pointFromScalar(Buffer.from(params.bitgoKeyShare.nShares[1].u, 'hex'), false) as Uint8Array).toString()
      + params.bitgoKeyShare.nShares[1].chaincode;
    const bitgoToBackupPublicU = (ecc.pointFromScalar(Buffer.from(params.bitgoKeyShare.nShares[2].u, 'hex'), false) as Uint8Array).toString()
      + params.bitgoKeyShare.nShares[2].chaincode;

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
    coin: string,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare,
    bitgoKeyShare: KeyShare,
    userGpgKey: openpgp.SerializedKeyPair<string>,
    userLocalBackupGpgKey: openpgp.SerializedKeyPair<string>,
    bitgoGpgKey: openpgp.SerializedKeyPair<string>
  }): Promise<Keychain> {
    const bitgoKeychain = await generateBitgoKeychain(params);

    nock(bgUrl)
      .persist()
      .post(`/api/v2/${params.coin}/key`, _.matches({ keyType: 'tss', source: 'bitgo' }))
      .reply(200, bitgoKeychain);

    return bitgoKeychain;
  }

  async function nockKeychain(params: {
    coin: string,
    keyChain: Keychain,
    source: 'user' | 'backup'
  }): Promise<Keychain> {

    nock('https://bitgo.fakeurl')
      .persist()
      .post(`/api/v2/${params.coin}/key`, _.matches({ keyType: 'tss', source: params.source }))
      .reply(200, params.keyChain);

    return params.keyChain;
  }
  // #endregion Nock helpers
});
