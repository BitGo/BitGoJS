import * as bs58 from 'bs58';
import * as _ from 'lodash';
import * as nock from 'nock';
import * as openpgp from 'openpgp';
import * as should from 'should';

import Eddsa, { KeyShare } from '../../../../../account-lib/dist/src/mpc/tss';
import { Keychain } from '../../../../src';
import { TssUtils } from '../../../../src/v2/internal/tssUtils';
import { TestBitGo } from '../../../lib/test_bitgo';
import * as common from '../../../../src/common';

describe('TSS Utils:', async function () {
  let MPC;
  let bgUrl: string;
  let tssUtils: TssUtils;
  let bitgoKeyShare;

  const coinName = 'tsol';

  before(async function () {
    MPC = await Eddsa();
    bitgoKeyShare = await MPC.keyShare(3, 2, 3);

    const bitGoGPGKey = await openpgp.generateKey({
      userIDs: [
        {
          name: 'bitgo',
          email: 'bitgo@test.com',
        },
      ],
    });
    const constants = {
      tss: {
        bitgoPublicKey: bitGoGPGKey.publicKey,
      },
    };

    nock('https://bitgo.fakeurl')
      .persist()
      .get('/api/v1/client/constants')
      .reply(200, { ttl: 3600, constants });

    const bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();

    const baseCoin = bitgo.coin(coinName);

    bgUrl = common.Environments[bitgo.getEnv()].uri;
    tssUtils = new TssUtils(bitgo, baseCoin);
  });

  it('should generate TSS key chains', async function () {
    const userKeyShare = MPC.keyShare(1, 2, 3);
    const backupKeyShare = MPC.keyShare(2, 2, 3);
    const userGpgKey = await openpgp.generateKey({
      userIDs: [
        {
          name: 'test',
          email: 'test@test.com',
        },
      ],
    });

    const nockedBitGoKeychain = await nockBitgoKeychain({
      coin: coinName,
      userKeyShare,
      backupKeyShare,
      userGpgKey,
    });
    const nockedUserKeychain = await nockUserKeychain({ coin: coinName });
    await nockBackupKeychain({ coin: coinName });

    const bitgoKeychain = await tssUtils.createBitgoKeychain(userGpgKey, userKeyShare, backupKeyShare);
    const userKeychain = await tssUtils.createUserKeychain(
      userGpgKey,
      userKeyShare,
      backupKeyShare,
      bitgoKeychain,
      'passphrase');
    const backupKeychain = await tssUtils.createBackupKeychain(
      userGpgKey,
      userKeyShare,
      backupKeyShare,
      bitgoKeychain,
      'passphrase');

    const backupCombined = MPC.keyCombine(backupKeyShare.uShare, [userKeyShare.yShares[2], bitgoKeyShare.yShares[2]]);

    bitgoKeychain.should.deepEqual(nockedBitGoKeychain);
    userKeychain.should.deepEqual(nockedUserKeychain);

    // unencrypted `prv` property should exist on backup keychain
    JSON.stringify(backupCombined.pShare).should.equal(backupKeychain.prv);
    should.exist(backupKeychain.encryptedPrv);

  });

  it('should fail to generate TSS key chains', async function () {
    const userKeyShare = MPC.keyShare(1, 2, 3);
    const backupKeyShare = MPC.keyShare(2, 2, 3);
    const userGpgKey = await openpgp.generateKey({
      userIDs: [
        {
          name: 'test',
          email: 'test@test.com',
        },
      ],
    });

    const nockedBitGoKeychain = await nockBitgoKeychain({
      coin: coinName,
      userKeyShare,
      backupKeyShare,
      userGpgKey,
    });
    const bitgoKeychain = await tssUtils.createBitgoKeychain(userGpgKey, userKeyShare, backupKeyShare);
    bitgoKeychain.should.deepEqual(nockedBitGoKeychain);

    await tssUtils.createUserKeychain(
        userGpgKey,
        userKeyShare,
        MPC.keyShare(2, 2, 3),
        bitgoKeychain,
        'passphrase')
      .should.be.rejectedWith('Failed to create user keychain - commonPubs do not match.');
    await tssUtils.createUserKeychain(
      userGpgKey,
      MPC.keyShare(1, 2, 3),
      backupKeyShare,
      bitgoKeychain,
      'passphrase')
      .should.be.rejectedWith('Failed to create user keychain - commonPubs do not match.');

    await tssUtils.createBackupKeychain(
      userGpgKey,
      MPC.keyShare(1, 2, 3),
      backupKeyShare,
      bitgoKeychain,
      'passphrase')
      .should.be.rejectedWith('Failed to create backup keychain - commonPubs do not match.');
    await tssUtils.createBackupKeychain(
      userGpgKey,
      userKeyShare,
      MPC.keyShare(2, 2, 3),
      bitgoKeychain,
      'passphrase')
      .should.be.rejectedWith('Failed to create backup keychain - commonPubs do not match.');
  });

  // Nock helpers

  async function nockBitgoKeychain(params: {
    coin: string,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare,
    userGpgKey: openpgp.SerializedKeyPair<string>,
  }): Promise<Keychain> {
    const bitgoCombined = MPC.keyCombine(bitgoKeyShare.uShare, [params.userKeyShare.yShares[3], params.backupKeyShare.yShares[3]]);
    const userGpgKeyActual = await openpgp.readKey({ armoredKey: params.userGpgKey.publicKey });

    const bitgoToUserMessage = await openpgp.createMessage({ text: bitgoKeyShare.yShares[1].u });
    const encryptedBitgoToUserMessage = await openpgp.encrypt({
      message: bitgoToUserMessage,
      encryptionKeys: [userGpgKeyActual.toPublic()],
      format: 'armored',
    });

    const bitgoToBackupMessage = await openpgp.createMessage({
      text: Buffer.from(bitgoKeyShare.yShares[2].u, 'hex').toString('hex')
    });
    const encryptedBitgoToBackupMessage = await openpgp.encrypt({
      message: bitgoToBackupMessage,
      encryptionKeys: [userGpgKeyActual.toPublic()],
      format: 'armored',
    });


    const bitgoKeychain: Keychain = {
      id: '3',
      pub: bitgoCombined.pShare.y,
      commonPub: bs58.encode(Buffer.from(bitgoCombined.pShare.y, 'hex')),
      keyShares: [
        {
          from: 'bitgo',
          to: 'user',
          publicShare: bs58.encode(Buffer.from(bitgoKeyShare.yShares[1].y, 'hex')),
          privateShare: encryptedBitgoToUserMessage.toString(),
        },
        {
          from: 'bitgo',
          to: 'backup',
          publicShare: bs58.encode(Buffer.from(bitgoKeyShare.yShares[2].y, 'hex')),
          privateShare: encryptedBitgoToBackupMessage.toString(),
        },
      ],
    };

    nock(bgUrl)
      .post(`/api/v2/${params.coin}/key`, _.matches({ type: 'tss', source: 'bitgo' }))
      .reply(200, bitgoKeychain);

    return bitgoKeychain;
  }

  async function nockUserKeychain(params: {
    coin: string,
  }): Promise<Keychain> {
    const userKeychain: Keychain = {
      id: '1',
      pub: '',
    };

    nock('https://bitgo.fakeurl')
      .post(`/api/v2/${params.coin}/key`, _.matches({ type: 'tss', source: 'user' }))
      .reply(200, userKeychain);

    return userKeychain;
  }

  async function nockBackupKeychain(params: {
    coin: string,
  }): Promise<Keychain> {
    const backupKeychain: Keychain = {
      id: '2',
      pub: '',
    };

    nock('https://bitgo.fakeurl')
      .post(`/api/v2/${params.coin}/key`, _.matches({ type: 'tss', source: 'backup' }))
      .reply(200, backupKeychain);

    return backupKeychain;
  }
});
