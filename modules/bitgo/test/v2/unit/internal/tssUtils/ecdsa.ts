import * as _ from 'lodash';
import * as nock from 'nock';
import * as openpgp from 'openpgp';
import * as should from 'should';
import * as sinon from 'sinon';

import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../../src/bitgo';
import {
  common,
  Keychain,
  Wallet,
  Ecdsa,
  ECDSA,
  ECDSAUtils,
  ECDSAMethods,
} from '@bitgo/sdk-core';
import { keyShares, otherKeyShares } from '../../../fixtures/tss/ecdsaKeyShares';

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
  let userGpgKey: openpgp.SerializedKeyPair<string> & {
    revocationCertificate: string;
  };
  let backupGpgKey: openpgp.SerializedKeyPair<string> & {
    revocationCertificate: string;
  };
  let bitGoGPGKey: openpgp.SerializedKeyPair<string> & {
    revocationCertificate: string;
  };
  let nockedBitGoKeychain: Keychain;
  let nockedUserKeychain: Keychain;

  const coinName = 'gteth';

  beforeEach(async function () {
    sandbox = sinon.createSandbox();
    const nockPromises = [
      nockBitgoKeychain({
        coin: coinName,
        userKeyShare,
        backupKeyShare,
        userGpgKey,
        backupGpgKey,
      }),
      nockKeychain({ coin: coinName, keyChain: { id: '1', pub: '' }, source: 'user' }),
      nockKeychain({ coin: coinName, keyChain: { id: '2', pub: '' }, source: 'backup' }),
    ];
    [nockedBitGoKeychain, nockedUserKeychain] = await Promise.all(nockPromises);
  });

  afterEach(function () {
    sandbox.restore();
  });

  before(async function () {
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
    }),
    openpgp.generateKey({
      userIDs: [
        {
          name: 'backup',
          email: 'backup@test.com',
        },
      ],
    }),
    openpgp.generateKey({
      userIDs: [
        {
          name: 'bitgo',
          email: 'bitgo@test.com',
        },
      ],
    })];
    [userGpgKey, backupGpgKey, bitGoGPGKey] = await Promise.all(gpgKeyPromises);
    const constants = {
      mpc: {
        bitgoPublicKey: bitGoGPGKey.publicKey,
      },
    };

    nock('https://bitgo.fakeurl')
      .persist()
      .get('/api/v1/client/constants')
      .reply(200, { ttl: 3600, constants });

    const bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    bitgo.initializeTestVars();

    const baseCoin = bitgo.coin(coinName);

    bgUrl = common.Environments[bitgo.getEnv()].uri;

    const walletData = {
      id: '5b34252f1bf349930e34020a00000000',
      coin: coinName,
      coinSpecific: {},
    };
    wallet = new Wallet(bitgo, baseCoin, walletData);
    tssUtils = new ECDSAUtils.EcdsaUtils(bitgo, baseCoin, wallet);
  });

  describe('TSS key chains:', async function() {
    it('should generate TSS key chains', async function () {
      const bitgoKeychain = await tssUtils.createBitgoKeychain(userGpgKey, userKeyShare, backupKeyShare);
      const usersKeyChainPromises = [tssUtils.createParticipantKeychain(
        userGpgKey,
        1,
        userKeyShare,
        backupKeyShare,
        bitgoKeychain,
        'passphrase'), tssUtils.createParticipantKeychain(
        backupGpgKey,
        2,
        userKeyShare,
        backupKeyShare,
        bitgoKeychain,
        'passphrase')];
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

    it('should generate TSS key chains with optional params', async function () {
      const enterprise = 'enterprise';
      const bitgoKeychain = await tssUtils.createBitgoKeychain(userGpgKey, userKeyShare, backupKeyShare, enterprise);
      const usersKeyChainPromises = [tssUtils.createParticipantKeychain(
        userGpgKey,
        1,
        userKeyShare,
        backupKeyShare,
        bitgoKeychain,
        'passphrase',
        'originalPasscodeEncryptionCode'), tssUtils.createParticipantKeychain(
        backupGpgKey,
        2,
        userKeyShare,
        backupKeyShare,
        bitgoKeychain,
        'passphrase')];
      
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
      const bitgoKeychain = await tssUtils.createBitgoKeychain(userGpgKey, userKeyShare, backupKeyShare);
      bitgoKeychain.should.deepEqual(nockedBitGoKeychain);
      const testKeyShares = otherKeyShares;
      const testCasesPromises = [
        tssUtils.createParticipantKeychain(
          userGpgKey,
          1,
          userKeyShare,
          testKeyShares[0],
          bitgoKeychain,
          'passphrase').should.be.rejectedWith('Common keychains do not match'),
        tssUtils.createParticipantKeychain(
          userGpgKey,
          1,
          testKeyShares[1],
          backupKeyShare,
          bitgoKeychain,
          'passphrase')
          .should.be.rejectedWith('Common keychains do not match'),
        tssUtils.createParticipantKeychain(
          backupGpgKey,
          2,
          testKeyShares[2],
          backupKeyShare,
          bitgoKeychain,
          'passphrase')
          .should.be.rejectedWith('Common keychains do not match'),
        tssUtils.createParticipantKeychain(
          backupGpgKey,
          2,
          userKeyShare,
          testKeyShares[3],
          bitgoKeychain,
          'passphrase').should.be.rejectedWith('Common keychains do not match'),
      ];
      await Promise.all(testCasesPromises);
    });
  });

  // #region Nock helpers
  async function nockBitgoKeychain(params: {
    coin: string,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare,
    userGpgKey: openpgp.SerializedKeyPair<string>,
    backupGpgKey: openpgp.SerializedKeyPair<string>,
  }): Promise<Keychain> {
    const bitgoCombined = MPC.keyCombine(bitgoKeyShare.pShare, [params.userKeyShare.nShares[3], params.backupKeyShare.nShares[3]]);
    const nSharePromises = [encryptNShare(
      bitgoKeyShare,
      1,
      userGpgKey.publicKey,
      userGpgKey.privateKey
    ),
    encryptNShare(
      bitgoKeyShare,
      2,
      backupGpgKey.publicKey,
      backupGpgKey.privateKey
    )];
    
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
        },
        {
          from: 'bitgo',
          to: 'backup',
          publicShare: backupToBitgoShare.publicShare,
          privateShare: backupToBitgoShare.encryptedPrivateShare,
        },
      ],
    };

    nock(bgUrl)
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
      .post(`/api/v2/${params.coin}/key`, _.matches({ keyType: 'tss', source: params.source }))
      .reply(200, params.keyChain);

    return params.keyChain;
  }
  
  // #endregion Nock helpers
});
