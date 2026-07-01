import * as assert from 'assert';
import * as should from 'should';
import { decrypt } from '@bitgo/sdk-api';
import { generateLightningQrData, generateQrData } from '../../src/generateQrData';
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
  it('hot wallet, backup key provided by user with encryptedPrv', async function () {
    const userEncryptedPrv = 'prv123encrypted';
    const backupEncryptedPrv = 'prv456encrypted';
    const bitgoPub = 'pub789bitgo';
    const passphrase = 'testingIsFun';
    const passcodeEncryptionCode = '123456';
    const qrData = await generateQrData({
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

    assert.ok(qrData.backup);
    qrData.backup.title.should.equal('B: Backup Key');
    qrData.backup.description.should.equal('This is your backup private key, encrypted with your wallet password.');
    qrData.backup.data.should.equal(backupEncryptedPrv);

    assert.ok(qrData.bitgo);
    qrData.bitgo.title.should.equal('C: BitGo Key');
    qrData.bitgo.description.should.equal('This is the public part of the key held by BitGo.');
    qrData.bitgo.data.should.equal(bitgoPub);

    assert.ok(qrData.passcode);
    qrData.passcode.title.should.equal('D: Encrypted Wallet Password');
    qrData.passcode.description.should.equal(
      'This is the wallet password, encrypted client-side with a key held by BitGo.'
    );
    const decryptedData = await decrypt(passcodeEncryptionCode, qrData.passcode.data);
    decryptedData.should.equal(passphrase);
  });

  describe('cold wallet', function () {
    const testSets: { coinName: string; keyType: KeyType }[] = [
      { coinName: 'btc', keyType: 'independent' },
      { coinName: 'sol', keyType: 'tss' },
      { coinName: 'eth', keyType: 'blsdkg' },
    ];
    for (const testSet of testSets) {
      it(`key type ${testSet.keyType}`, async function () {
        const userPub = 'pub012user';
        const userMasterKey = 'userMasterKey';
        const backupPub = 'pub345backup';
        const backupMasterKey = 'backupMasterKey';
        const bitgoPub = 'pub789bitgo';
        const qrData = await generateQrData({
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

        assert.ok(qrData.backup);
        qrData.backup.title.should.equal('B: Provided Backup Key');
        qrData.backup.description.should.equal('This is the public key you provided for your wallet.');
        qrData.backup.data.should.equal(backupPub);
        should.equal(qrData.backup?.publicMasterKey, backupMasterKey);

        assert.ok(qrData.bitgo);
        qrData.bitgo.data.should.equal(bitgoPub);

        should.not.exist(qrData.passcode);
      });
    }
  });

  describe('generateLightningQrData', function () {
    it('lightning wallet with encrypted key and passcode', async function () {
      const userAuthEncryptedPrv = 'userAuthPrv123encrypted';
      const passphrase = 'testingIsFun';
      const passcodeEncryptionCode = '123456';

      const qrData = await generateLightningQrData({
        userAuthKeychain: createKeychain({ encryptedPrv: userAuthEncryptedPrv }),
        coin: coins.get('lnbtc'),
        passcodeEncryptionCode,
        passphrase,
      });

      qrData.user.title.should.equal('A: User Auth Key');
      qrData.user.description.should.match(/user authentication private key/);
      qrData.user.data.should.equal(userAuthEncryptedPrv);

      should.not.exist(qrData.backup);
      should.not.exist(qrData.bitgo);

      assert.ok(qrData.passcode);
      qrData.passcode.title.should.equal('D: Encrypted Wallet Password');
      const decryptedData = await decrypt(passcodeEncryptionCode, qrData.passcode.data);
      decryptedData.should.equal(passphrase);
    });

    it('lightning wallet without passcode', async function () {
      const qrData = await generateLightningQrData({
        userAuthKeychain: createKeychain({ encryptedPrv: 'userAuthPrv' }),
        coin: coins.get('lnbtc'),
      });

      should.not.exist(qrData.passcode);
    });

    it('throws when userAuthKeychain is missing encryptedPrv', async function () {
      await assert.rejects(
        () =>
          generateLightningQrData({
            userAuthKeychain: createKeychain({ pub: 'pub123' }),
            coin: coins.get('lnbtc'),
          }),
        /userAuthKeychain must have an encryptedPrv/
      );
    });
  });

  it('backup key from provider', async function () {
    const coin = coins.get('btc');
    const userEncryptedPrv = 'prv123encrypted';
    const backupPub = 'pub673backup';
    const provider = '3rd Party Provider';
    const bitgoPub = 'pub789bitgo';
    const qrData = await generateQrData({
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

    assert.ok(qrData.backup);
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

    assert.ok(qrData.bitgo);
    qrData.bitgo.data.should.equal(bitgoPub);
  });
});

describe('generateQrData', function () {
  it('encrypts passcode with encrypt', async function () {
    const passphrase = 'testingIsFun';
    const passcodeEncryptionCode = '123456';
    const qrData = await generateQrData({
      backupKeychain: createKeychain({ encryptedPrv: 'backupPrv' }),
      bitgoKeychain: createKeychain({ pub: 'bitgoPub' }),
      coin: coins.get('btc'),
      passcodeEncryptionCode,
      passphrase,
      userKeychain: createKeychain({ encryptedPrv: 'userPrv' }),
    });

    assert.ok(qrData.passcode);
    const decryptedData = await decrypt(passcodeEncryptionCode, qrData.passcode.data);
    decryptedData.should.equal(passphrase);
  });

  it('produces a v2 Box D when encryptionVersion is not set', async function () {
    const passphrase = 'testingIsFun';
    const passcodeEncryptionCode = '123456';
    const qrData = await generateQrData({
      backupKeychain: createKeychain({ encryptedPrv: 'backupPrv' }),
      bitgoKeychain: createKeychain({ pub: 'bitgoPub' }),
      coin: coins.get('btc'),
      passcodeEncryptionCode,
      passphrase,
      userKeychain: createKeychain({ encryptedPrv: 'userPrv' }),
    });

    assert.ok(qrData.passcode);
    const envelope = JSON.parse(qrData.passcode.data);
    assert.strictEqual(envelope.v, 2, 'should default to v2 envelope');
  });

  it('produces a v2 Box D when encryptionVersion: 2', async function () {
    const passphrase = 'testingIsFun';
    const passcodeEncryptionCode = '123456';
    const qrData = await generateQrData({
      backupKeychain: createKeychain({ encryptedPrv: 'backupPrv' }),
      bitgoKeychain: createKeychain({ pub: 'bitgoPub' }),
      coin: coins.get('btc'),
      passcodeEncryptionCode,
      passphrase,
      userKeychain: createKeychain({ encryptedPrv: 'userPrv' }),
      encryptionVersion: 2,
    });

    assert.ok(qrData.passcode);
    const envelope = JSON.parse(qrData.passcode.data);
    assert.strictEqual(envelope.v, 2, 'should produce v2 envelope');
    const decryptedData = await decrypt(passcodeEncryptionCode, qrData.passcode.data);
    decryptedData.should.equal(passphrase);
  });

  it('produces a v1 Box D when encryptionVersion: 1 is explicit', async function () {
    const passphrase = 'testingIsFun';
    const passcodeEncryptionCode = '123456';
    const qrData = await generateQrData({
      backupKeychain: createKeychain({ encryptedPrv: 'backupPrv' }),
      bitgoKeychain: createKeychain({ pub: 'bitgoPub' }),
      coin: coins.get('btc'),
      passcodeEncryptionCode,
      passphrase,
      userKeychain: createKeychain({ encryptedPrv: 'userPrv' }),
      encryptionVersion: 1,
    });

    assert.ok(qrData.passcode);
    const envelope = JSON.parse(qrData.passcode.data);
    assert.notStrictEqual(envelope.v, 2, 'should produce v1 envelope');
  });

  it('omits Box D when passphrase or passcodeEncryptionCode is missing', async function () {
    const qrData = await generateQrData({
      backupKeychain: createKeychain({ encryptedPrv: 'backupPrv' }),
      bitgoKeychain: createKeychain({ pub: 'bitgoPub' }),
      coin: coins.get('btc'),
      userKeychain: createKeychain({ encryptedPrv: 'userPrv' }),
      encryptionVersion: 2,
    });
    assert.strictEqual(qrData.passcode, undefined);
  });
});

describe('generateLightningQrData', function () {
  it('encrypts passcode with encrypt', async function () {
    const passphrase = 'testingIsFun';
    const passcodeEncryptionCode = '123456';
    const qrData = await generateLightningQrData({
      userAuthKeychain: createKeychain({ encryptedPrv: 'userAuthPrv' }),
      coin: coins.get('lnbtc'),
      passcodeEncryptionCode,
      passphrase,
    });

    assert.ok(qrData.passcode);
    const decryptedData = await decrypt(passcodeEncryptionCode, qrData.passcode.data);
    decryptedData.should.equal(passphrase);
  });

  it('produces a v2 Box D when encryptionVersion: 2', async function () {
    const passphrase = 'testingIsFun';
    const passcodeEncryptionCode = '123456';
    const qrData = await generateLightningQrData({
      userAuthKeychain: createKeychain({ encryptedPrv: 'userAuthPrv' }),
      coin: coins.get('lnbtc'),
      passcodeEncryptionCode,
      passphrase,
      encryptionVersion: 2,
    });

    assert.ok(qrData.passcode);
    const envelope = JSON.parse(qrData.passcode.data);
    assert.strictEqual(envelope.v, 2);
    const decryptedData = await decrypt(passcodeEncryptionCode, qrData.passcode.data);
    decryptedData.should.equal(passphrase);
  });
});
