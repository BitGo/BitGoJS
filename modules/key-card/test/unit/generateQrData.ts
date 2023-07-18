import * as assert from 'assert';
import * as should from 'should';
import { generateQrData } from '../../src/generateQrData';
import { decrypt } from '@bitgo/sdk-api';
import { ApiKeyShare, Keychain, KeyType } from '@bitgo/sdk-core';
import { coins } from '@bitgo/statics';

function createKeychain({
  commonKeychain,
  commonPub,
  encryptedPrv,
  keyShares,
  provider,
  pub,
  type,
}: {
  commonKeychain?: string;
  commonPub?: string;
  encryptedPrv?: string;
  keyShares?: ApiKeyShare[];
  provider?: string;
  pub?: string;
  type?: KeyType;
}): Keychain {
  return {
    commonKeychain,
    commonPub,
    encryptedPrv,
    id: 'id',
    keyShares,
    provider,
    pub: pub ?? 'pub',
    type: type ?? 'independent',
  };
}

describe('generateQrData', function () {
  it('hot wallet, backup key provided by user with encryptedPrv', function () {
    const userEncryptedPrv = 'prv123encrypted';
    const backupEncryptedPrv = 'prv456encrypted';
    const bitgoPub = 'pub789bitgo';
    const passphrase = 'testingIsFun';
    const passcodeEncryptionCode = '123456';
    const qrData = generateQrData({
      backupKeychain: createKeychain({
        encryptedPrv: backupEncryptedPrv,
      }),
      bitgoKeychain: createKeychain({
        pub: bitgoPub,
      }),
      coin: coins.get('btc'),
      passcodeEncryptionCode,
      passphrase,
      userKeychain: createKeychain({
        encryptedPrv: userEncryptedPrv,
      }),
    });

    qrData.user.title.should.equal('A: User Key');
    qrData.user.description.should.equal('This is your private key, encrypted with your wallet password.');
    qrData.user.data.should.equal(userEncryptedPrv);

    assert(qrData.backup);
    qrData.backup.title.should.equal('B: Backup Key');
    qrData.backup.description.should.equal('This is your backup private key, encrypted with your wallet password.');
    qrData.backup.data.should.equal(backupEncryptedPrv);

    assert(qrData.bitgo);
    qrData.bitgo.title.should.equal('C: BitGo Public Key');
    qrData.bitgo.description.should.equal(
      'This is the public part of the key that BitGo will use to ' + 'co-sign transactions\r\nwith you on your wallet.'
    );
    qrData.bitgo.data.should.equal(bitgoPub);

    assert(qrData.passcode);
    qrData.passcode.title.should.equal('D: Encrypted wallet Password');
    qrData.passcode.description.should.equal(
      'This is the wallet password, encrypted client-side with a key held by BitGo.'
    );
    const decryptedData = decrypt(passcodeEncryptionCode, qrData.passcode.data);
    decryptedData.should.equal(passphrase);
  });

  describe('cold wallet', function () {
    const testSets: { coinName: string; keyType: KeyType }[] = [
      { coinName: 'btc', keyType: 'independent' },
      { coinName: 'sol', keyType: 'tss' },
      { coinName: 'eth', keyType: 'blsdkg' },
    ];
    for (const testSet of testSets) {
      it(`key type ${testSet.keyType}`, function () {
        const userPub = 'pub012user';
        const userMasterKey = 'userMasterKey';
        const backupPub = 'pub345backup';
        const backupMasterKey = 'backupMasterKey';
        const bitgoPub = 'pub789bitgo';
        const qrData = generateQrData({
          backupKeychain: createKeychain({
            commonKeychain: testSet.keyType === 'tss' ? backupPub : undefined,
            commonPub: testSet.keyType === 'blsdkg' ? backupPub : undefined,
            pub: testSet.keyType === 'independent' ? backupPub : undefined,
            type: testSet.keyType,
          }),
          backupMasterKey,
          bitgoKeychain: createKeychain({
            commonKeychain: testSet.keyType === 'tss' ? bitgoPub : undefined,
            commonPub: testSet.keyType === 'blsdkg' ? bitgoPub : undefined,
            pub: testSet.keyType === 'independent' ? bitgoPub : undefined,
            type: testSet.keyType,
          }),
          coin: coins.get('btc'),
          userKeychain: createKeychain({
            commonKeychain: testSet.keyType === 'tss' ? userPub : undefined,
            commonPub: testSet.keyType === 'blsdkg' ? userPub : undefined,
            pub: testSet.keyType === 'independent' ? userPub : undefined,
            type: testSet.keyType,
          }),
          userMasterKey,
        });

        qrData.user.title.should.equal('A: Provided User Key');
        qrData.user.description.should.equal('This is the public key you provided for your wallet.');
        qrData.user.data.should.equal(userPub);
        should.equal(qrData.user.publicMasterKey, userMasterKey);

        assert(qrData.backup);
        qrData.backup.title.should.equal('B: Provided Backup Key');
        qrData.backup.description.should.equal('This is the public key you provided for your wallet.');
        qrData.backup.data.should.equal(backupPub);
        should.equal(qrData.backup?.publicMasterKey, backupMasterKey);

        assert(qrData.bitgo);
        qrData.bitgo.data.should.equal(bitgoPub);

        should.not.exist(qrData.passcode);
      });
    }
  });

  it('backup key from provider', function () {
    const coin = coins.get('btc');
    const userEncryptedPrv = 'prv123encrypted';
    const backupPub = 'pub673backup';
    const provider = '3rd Party Provider';
    const bitgoPub = 'pub789bitgo';
    const qrData = generateQrData({
      backupKeychain: createKeychain({
        pub: backupPub,
        provider,
      }),
      backupKeyProvider: provider,
      bitgoKeychain: createKeychain({
        pub: bitgoPub,
      }),
      coin,
      userKeychain: createKeychain({
        encryptedPrv: userEncryptedPrv,
      }),
    });

    qrData.user.data.should.equal(userEncryptedPrv);

    assert(qrData.backup);
    qrData.backup.title.should.equal('B: Backup Key');
    qrData.backup.description.should.equal(
      'This is the public key held at ' +
        provider +
        ', an ' +
        coin.name +
        ' recovery service. If you lose\r\nyour key, ' +
        provider +
        ' will be able to sign transactions to recover funds.'
    );
    qrData.backup.data.should.equal(backupPub);

    assert(qrData.bitgo);
    qrData.bitgo.data.should.equal(bitgoPub);
  });

  it('tss backup key held at BitGo Trust', function () {
    const coin = coins.get('btc');
    const userEncryptedPrv = 'prv123encrypted';
    const provider = 'BitGoTrustAsKRS';
    const backupKeyProvider = 'BitGo Trust';
    const userToBackupKeyShare: ApiKeyShare = {
      from: 'user',
      to: 'backup',
      publicShare: 'userToBackupPublic',
      privateShare: 'userToBackupPrivate',
    };
    const bitgoToBackupKeyShare: ApiKeyShare = {
      from: 'bitgo',
      to: 'backup',
      publicShare: 'bitgoToBackupPublic',
      privateShare: 'bitgoToBackupPrivate',
    };
    const bitgoCommonKeychain = 'commonCommonBitGo';
    const qrData = generateQrData({
      backupKeychain: createKeychain({
        provider,
        keyShares: [userToBackupKeyShare, bitgoToBackupKeyShare],
        type: 'tss',
      }),
      backupKeyProvider,
      bitgoKeychain: createKeychain({
        type: 'tss',
        commonKeychain: bitgoCommonKeychain,
      }),
      coin,
      userKeychain: createKeychain({
        encryptedPrv: userEncryptedPrv,
        type: 'tss',
      }),
    });

    qrData.user.data.should.equal(userEncryptedPrv);

    assert(qrData.backup);
    qrData.backup.title.should.equal('B: Backup Key Shares');
    qrData.backup.description.should.equal(
      `These are the key shares for ${backupKeyProvider}. If BitGo Inc. goes out of business,\r\ncontact ${backupKeyProvider} and they will help you recover your funds.`
    );
    qrData.backup.data.should.equal(JSON.stringify([userToBackupKeyShare, bitgoToBackupKeyShare]));

    assert(qrData.bitgo);
    qrData.bitgo.title.should.equal('C: BitGo Public Key');
    qrData.bitgo.description.should.equal(
      'This is the public part of the key that BitGo will use to co-sign transactions\r\nwith you on your wallet.'
    );
    qrData.bitgo.data.should.equal(bitgoCommonKeychain);
  });
});
