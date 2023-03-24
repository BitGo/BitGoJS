//
// Test for Keychains
//

import { CoinKind, coins, KeyCurve, CoinFamily, UnderlyingAsset } from '@bitgo/statics';
import * as _ from 'lodash';
import * as nock from 'nock';
import * as should from 'should';
import * as sinon from 'sinon';

import { BlsUtils, common, ECDSAUtils, EDDSAUtils, KeychainsTriplet } from '@bitgo/sdk-core';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../src/bitgo';

describe('V2 Keychains', function () {
  let bitgo;
  let basecoin;
  let keychains;
  let bgUrl;

  before(function() {
    bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    bitgo.initializeTestVars();
    bitgo.setValidate(false);
    basecoin = bitgo.coin('tltc');
    keychains = basecoin.keychains();

    bgUrl = common.Environments[bitgo.getEnv()].uri;
  });

  describe('Add Keychain', function() {
    it('should add a keychain', async function() {
      const scope = nock(bgUrl)
        .post('/api/v2/tltc/key', function(body) {
          body.pub.should.equal('pub');
          body.derivedFromParentWithSeed.should.equal('derivedFromParentWithSeed');
          return true;
        })
        .reply(200, {});
      await keychains.add({ pub: 'pub', derivedFromParentWithSeed: 'derivedFromParentWithSeed' });
      scope.done();
    });
  });

  /**
   * This section's intention is to provide some key generation sanity checking. generateKeyPair is a general surface
   * for key generation but the keys are treated the same by BitGo down the line. Any SECP256K1 based coins key-pairs can
   * be re-used so need to be the same.
   **/
  describe('Key generation enforcement for SECP256K1', function() {
    // iterate over non-fiat crypto secp coins
    const coinFamilyValues = Object.keys(CoinFamily).map(n => n.toLowerCase());
    const cryptoSecpCoins = coins.filter(n => n.primaryKeyCurve === KeyCurve.Secp256k1
      && n.kind === CoinKind.CRYPTO
      && n.asset !== UnderlyingAsset.USD
      && n.asset !== UnderlyingAsset.AVAXP
      && n.asset !== UnderlyingAsset.DOGE
      && n.asset !== UnderlyingAsset.ATOM  // ToDo(BG-64363) remove flag after adding coin specific module
      && n.asset !== UnderlyingAsset.ETHW
      && coinFamilyValues.includes(n.name));

    const expectedXpub = 'xpub661MyMwAqRbcGpZf8mxNWhSPdWaLGvQzzage6vq2oQFzq8toVzmkjygYZ3HcZw6eCzAfn9ZdyGjKoKkcpKwackdgznVbiunpq7rkxDu7quS';
    const expectedXprv = 'xprv9s21ZrQH143K4LVC2kRN9ZVf5UjqsTh9dMm3JYRRF4j1xLZexTTWCBN4hmdZUHeT3vCJPL181ErVaY489ArBKSWaB7Du7vyVS6XC43WtK7A';

    const seed = Buffer.from('this is some random seed we will use', 'utf-8');

    cryptoSecpCoins.forEach((coin) => {
      it(`should create the same ${coin.name} key with the same seed`, function() {
        const currentCoin = bitgo.coin(coin.name);
        const keyPair = currentCoin.generateKeyPair(seed);

        should.exist(keyPair.pub);
        should.exist(keyPair.prv);

        keyPair.pub.should.equal(expectedXpub);
        keyPair.prv.should.equal(expectedXprv);
      });
    });
  });

  describe('Update Password', function() {

    const oldPassword = 'oldPassword';
    const newPassword = 'newPassword';
    const otherPassword = 'otherPassword';

    describe('should fail', function() {
      let sandbox;
      beforeEach(function() {
        sandbox = sinon.createSandbox();
      });

      afterEach(function() {
        sandbox.restore();
      });

      it('to update the password', async function() {
        await keychains.updatePassword({ newPassword: '5678' })
          .should.be.rejectedWith('Missing parameter: oldPassword');

        await keychains.updatePassword({ oldPassword: 1234, newPassword: '5678' })
          .should.be.rejectedWith('Expecting parameter string: oldPassword but found number');

        await keychains.updatePassword({ oldPassword: '1234' })
          .should.be.rejectedWith('Missing parameter: newPassword');

        await keychains.updatePassword({ oldPassword: '1234', newPassword: 5678 })
          .should.be.rejectedWith('Expecting parameter string: newPassword but found number');
      });

      it('to update the password for a single keychain', function() {
        (() => keychains.updateSingleKeychainPassword({ newPassword: '5678' }))
          .should.throw('expected old password to be a string');

        (() => keychains.updateSingleKeychainPassword({ oldPassword: 1234, newPassword: '5678' }))
          .should.throw('expected old password to be a string');

        (() => keychains.updateSingleKeychainPassword({ oldPassword: '1234' }))
          .should.throw('expected new password to be a string');

        (() => keychains.updateSingleKeychainPassword({ oldPassword: '1234', newPassword: 5678 }))
          .should.throw('expected new password to be a string');

        (() => keychains.updateSingleKeychainPassword({ oldPassword: '1234', newPassword: '5678' }))
          .should.throw('expected keychain to be an object with an encryptedPrv property');

        (() => keychains.updateSingleKeychainPassword({ oldPassword: '1234', newPassword: '5678', keychain: {} }))
          .should.throw('expected keychain to be an object with an encryptedPrv property');

        (() => keychains.updateSingleKeychainPassword({
          oldPassword: '1234',
          newPassword: '5678',
          keychain: { encryptedPrv: 123 },
        }))
          .should.throw('expected keychain to be an object with an encryptedPrv property');

        const keychain = { encryptedPrv: bitgo.encrypt({ input: 'xprv1', password: otherPassword }) };
        (() => keychains.updateSingleKeychainPassword({ oldPassword, newPassword, keychain }))
          .should.throw('password used to decrypt keychain private key is incorrect');
      });

      it('on any other error', async function() {
        nock(bgUrl)
          .get('/api/v2/tltc/key')
          .query(true)
          .reply(200, {
            keys: [
              {
                pub: 'xpub1',
                encryptedPrv: bitgo.encrypt({ input: 'xprv1', password: oldPassword }),
              },
            ],
          });

        sandbox.stub(keychains, 'updateSingleKeychainPassword').throws('error', 'some random error');

        await keychains.updatePassword({ oldPassword, newPassword })
          .should.be.rejectedWith('some random error');
      });
    });

    describe('successful password update', function() {
      const validateKeys = function(keys, newPassword) {
        _.each(keys, function(encryptedPrv, pub) {
          pub.should.startWith('xpub');
          const decryptedPrv = bitgo.decrypt({ input: encryptedPrv, password: newPassword });
          decryptedPrv.should.startWith('xprv');
        });
      };

      it('receive only one page when listing keychains', async function() {
        nock(bgUrl)
          .get('/api/v2/tltc/key')
          .query(true)
          .reply(200, {
            keys: [
              {
                pub: 'xpub1',
                encryptedPrv: bitgo.encrypt({ input: 'xprv1', password: oldPassword }),
              },
              {
                pub: 'xpub2',
                encryptedPrv: bitgo.encrypt({ input: 'xprv2', password: otherPassword }),
              },
            ],
          });

        const keys = await keychains.updatePassword({ oldPassword: oldPassword, newPassword: newPassword });
        validateKeys(keys, newPassword);
      });

      it('receive multiple pages when listing keychains', async function() {
        const prevId = 'prevId';
        nock(bgUrl)
          .get('/api/v2/tltc/key')
          .query(true)
          .reply(200, {
            nextBatchPrevId: prevId,
            keys: [
              {
                pub: 'xpub1',
                encryptedPrv: bitgo.encrypt({ input: 'xprv1', password: oldPassword }),
              },
              {
                pub: 'xpub2',
                encryptedPrv: bitgo.encrypt({ input: 'xprv2', password: otherPassword }),
              },
            ],
          });

        nock(bgUrl)
          .get('/api/v2/tltc/key')
          .query(function queryNextPageMatch(queryObject) {
            return queryObject.prevId === prevId;
          })
          .reply(200, {
            keys: [
              {
                pub: 'xpub3',
                encryptedPrv: bitgo.encrypt({ input: 'xprv3', password: oldPassword }),
              },
              {
                pub: 'xpub4',
                encryptedPrv: bitgo.encrypt({ input: 'xprv4', password: otherPassword }),
              },
            ],
          });

        const keys = await keychains.updatePassword({ oldPassword: oldPassword, newPassword: newPassword });
        validateKeys(keys, newPassword);
      });

      it('single keychain password update', () => {
        const prv = 'xprvtest';
        const keychain = {
          xpub: 'xpub123',
          encryptedPrv: bitgo.encrypt({ input: prv, password: oldPassword }),
        };

        const newKeychain = keychains.updateSingleKeychainPassword({ keychain, oldPassword, newPassword });

        const decryptedPrv = bitgo.decrypt({ input: newKeychain.encryptedPrv, password: newPassword });
        decryptedPrv.should.equal(prv);
      });
    });

    describe('Create TSS Keychains', function() {
      const stubbedKeychainsTriplet = {
        userKeychain: {
          id: '1',
          pub: 'userPub',
        },
        backupKeychain: {
          id: '2',
          pub: 'userPub',
        },
        bitgoKeychain: {
          id: '3',
          pub: 'userPub',
        },
      };

      let sandbox;
      beforeEach(function() {
        sandbox = sinon.createSandbox();
      });

      afterEach(function() {
        sandbox.restore();
      });

      ['tsol', 'tdot', 'tnear'].forEach((coin) => {
        it('should create EDDSA TSS Keychains', async function() {
          sandbox.stub(EDDSAUtils.default.prototype, 'createKeychains').resolves(stubbedKeychainsTriplet);
          const keychains = await bitgo.coin(coin).keychains().createMpc({
            multisigType: 'tss',
            passphrase: 'password',
            enterprise: 'enterprise',
            originalPasscodeEncryptionCode: 'originalPasscodeEncryptionCode',
          });
          keychains.should.deepEqual(stubbedKeychainsTriplet);
        });
      });

      ['tbsc'].forEach((coin) => {
        it('should create ECDSA TSS Keychains', async function() {
          sandbox.stub(ECDSAUtils.EcdsaUtils.prototype, 'createKeychains').resolves(stubbedKeychainsTriplet);
          const keychains = await bitgo.coin(coin).keychains().createMpc({
            multisigType: 'tss',
            passphrase: 'password',
            enterprise: 'enterprise',
            originalPasscodeEncryptionCode: 'originalPasscodeEncryptionCode',
          });
          keychains.should.deepEqual(stubbedKeychainsTriplet);
        });
      });
    });

    describe('Create BLS-DKG Keychains', function() {
      it('should create BLS-DKG Keychains', async function() {
        const stubbedKeychainsTriplet: KeychainsTriplet = {
          userKeychain: {
            id: '1',
            pub: 'userPub',
            type: 'independent',
          },
          backupKeychain: {
            id: '2',
            pub: 'userPub',
            type: 'independent',
          },
          bitgoKeychain: {
            id: '3',
            pub: 'userPub',
            type: 'independent',
          },
        };
        sinon.stub(BlsUtils.prototype, 'createKeychains').resolves(stubbedKeychainsTriplet);
        const keychains = await bitgo.coin('eth2').keychains().createMpc({
          multisigType: 'blsdkg',
          passphrase: 'password',
        });
        keychains.should.deepEqual(stubbedKeychainsTriplet);
      });
    });

    after(function afterUpdatePassword() {
      nock.pendingMocks().should.be.empty();
    });
  });

  describe('Create BitGo Key from OVC JSON', function() {

    it('Parses the OVC JSON file properly and creates the next input for OVC', async function() {
      const bitGoKeyResult = {
        id: '6421eb755fea9e0006c2c040072f74bb',
        commonKeychain: '123',
        walletHSMGPGPublicKeySigs: '123',
        verifiedVssProof: true,
        keyShares: [
          {
            from: 'bitgo',
            to: 'user',
            publicShare: 'ccc',
            privateShare: 'ccc private',
            vssProof: 'ccc vss proof',
          },
          {
            from: 'bitgo',
            to: 'backup',
            publicShare: 'fff',
            privateShare: 'fff private',
            vssProof: 'fff vss proof',
          },
        ],
      };
      nock(bgUrl)
        .post('/api/v2/tsol/key', _.matches({ source: 'bitgo', keyType: 'tss' }))
        .reply(200, bitGoKeyResult);

      const ovcOutputJson = {
        tssVersion: '0.0.1',
        walletType: 'tss',
        coin: 'sol',
        state: 1,
        ovc: {
          1: {
            gpgPubKey: '-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nxk8EZBsq9RMFK4EEAAoCAwRgDpgm1bptRT5yLOMadcGAHuvkxISL8/3xPy/D\nYA+1NgBqIFK/3OOXxp73Tv86bt1dgH7OD1ACO0mVXAoX5EaVzWZvdmMtMS11\nc2VyLWRmMjQwOWY0NWNhMTZmNTU3OGNkMzAxMyA8b3ZjLTEtdXNlci1kZjI0\nMDlmNDVjYTE2ZjU1NzhjZDMwMTNAZGYyNDA5ZjQ1Y2ExNmY1NTc4Y2QzMDEz\nLmNvbT7CjAQQEwgAHQUCZBsq9QQLCQcIAxUICgQWAAIBAhkBAhsDAh4BACEJ\nEOUeC7QrGL+2FiEEjN6vPUFRweVtDKFZ5R4LtCsYv7Z7oAEAvNKaJrTIs3ky\nbxjkUicsuxOyA2oWGarJH6TGlWF6WD8A/3EIeZzPKSLaW+3enpbCPiU8RVDp\nC6yo6NMAqKp4XlyQzlMEZBsq9RIFK4EEAAoCAwQWlWPNMpk3afEzfgG0xFg4\nCEjY7fGO35n47nZ4qxjEXz2XN4I23xFMiwZbXbptDXlqm7W9ZAHKi892h+Yt\nU4B6AwEIB8J4BBgTCAAJBQJkGyr1AhsMACEJEOUeC7QrGL+2FiEEjN6vPUFR\nweVtDKFZ5R4LtCsYv7YqZwD8DLRuneB0HEzBCyrE4YL+UHaofoHQX1+nRh0j\n82qaDzAA/i3U1SoEIi32YMrorNG50vb4vaEPbbYmfglb+JQ1Yx7o\n=vjgl\n-----END PGP PUBLIC KEY BLOCK-----\n',
            ovcToBitgoShare: {
              publicShare: '07bfbb052a1f4b106b315bd5a9d6a71604653289f861320d9801881e952f8550753c89511a360e3b599d9f239a8d36a4956437ed0b152180e22cb94fb08fdc81',
              privateShare: '-----BEGIN PGP MESSAGE-----\n\nwX4DUQ8XhGVGcTISAgMEd/wQ/AhwIRsSf/6iHwmHKvEYAwfaLtTQotS6BwZm\naX00T7LumGIrNZzBgcggBKMl+8Omom8mX5sP8FUE451iZjBmXlkpHlpAqskS\nEi5SfjlsT31utoLaBLA7NjNSmyYHIiyfh6YnwfV5U72k6hhfpuDSsQGy8Yxp\nM2dVlN4uoO31zgQPf+fgJkZvAPwvjYLBL4O8hs21HGf0VvG99brk4xlFVRhw\nQnuPpM51GOs4vUtbLNSYnAuhU4ReXwwDV9Xu0MXAjfQMk2E3wQLGQ+82uv2B\n1hPD9nDHTtAdWrXd6ZjXFrG4Mf2MQBxySFvVSnFi6yStjfZeiKcD5Vg38PjG\nWg1O5N3/paq98HfH0Q4qNKGZljwo3oEQZzlYm2kVnI0PULoMYg==\n=ovAx\n-----END PGP MESSAGE-----\n',
              vssProof: 'be8198c2cef94cb381aa8aa9277a0a46ba5a54b0ac9930034b4af66b1b805234',
              i: 3,
              j: 1,
              uSig: '-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nxk8EZBsq9RMFK4EEAAoCAwRgDpgm1bptRT5yLOMadcGAHuvkxISL8/3xPy/D\nYA+1NgBqIFK/3OOXxp73Tv86bt1dgH7OD1ACO0mVXAoX5EaVzWZvdmMtMS11\nc2VyLWRmMjQwOWY0NWNhMTZmNTU3OGNkMzAxMyA8b3ZjLTEtdXNlci1kZjI0\nMDlmNDVjYTE2ZjU1NzhjZDMwMTNAZGYyNDA5ZjQ1Y2ExNmY1NTc4Y2QzMDEz\nLmNvbT7CjAQQEwgAHQUCZBsq9QQLCQcIAxUICgQWAAIBAhkBAhsDAh4BACEJ\nEOUeC7QrGL+2FiEEjN6vPUFRweVtDKFZ5R4LtCsYv7Z7oAEAvNKaJrTIs3ky\nbxjkUicsuxOyA2oWGarJH6TGlWF6WD8A/3EIeZzPKSLaW+3enpbCPiU8RVDp\nC6yo6NMAqKp4XlyQzlMEZBsq9RIFK4EEAAoCAwQWlWPNMpk3afEzfgG0xFg4\nCEjY7fGO35n47nZ4qxjEXz2XN4I23xFMiwZbXbptDXlqm7W9ZAHKi892h+Yt\nU4B6AwEIB8J4BBgTCAAJBQJkGyr1AhsMACEJEOUeC7QrGL+2FiEEjN6vPUFR\nweVtDKFZ5R4LtCsYv7YqZwD8DLRuneB0HEzBCyrE4YL+UHaofoHQX1+nRh0j\n82qaDzAA/i3U1SoEIi32YMrorNG50vb4vaEPbbYmfglb+JQ1Yx7ozjMEZBsq\n9RYJKwYBBAHaRw8BAQdAS1534LdCC60ASpEgnEBC8pWPSOWWBLXyWaBhEOW2\n/ijCeAQYEwgACQUCZBsq9QIbIAAhCRDlHgu0Kxi/thYhBIzerz1BUcHlbQyh\nWeUeC7QrGL+2FUYA/AgMU4V7C7I/5HwK73mctaGXNdfVr/muRMNOGW/CAxVL\nAP9KaBr95o32oEN5eo7tWFByoOCCk9JMjs36Cq7o+sR31A==\n=eZ3B\n-----END PGP PUBLIC KEY BLOCK-----\n',
            },
          },
          2: {
            gpgPubKey: '-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nxk8EZBsrNBMFK4EEAAoCAwT2xXv/mG/daPdKGD/fHIUEE2ZtcK+njtCZtMEr\nkIubmUwe3Dj8+hQxt3SKaTxQbuD+WaLSj986QYUr4Zw4T+W3zWpvdmMtMi1i\nYWNrdXAtNTQ3YmJkZjMwOGMxZTYxY2Q5ZGI4NmU4IDxvdmMtMi1iYWNrdXAt\nNTQ3YmJkZjMwOGMxZTYxY2Q5ZGI4NmU4QDU0N2JiZGYzMDhjMWU2MWNkOWRi\nODZlOC5jb20+wowEEBMIAB0FAmQbKzQECwkHCAMVCAoEFgACAQIZAQIbAwIe\nAQAhCRC2Ak5G2Sk7ZRYhBLTpSkFOe3ajbqouerYCTkbZKTtlxtYBALLIBnAa\n4AS77XvXmmznNCWO/HNuDPD2ugRqVhqU4SxmAQDma14APuMNSVyi17xomZjW\n0nimtaMIBjc0A4MXE6G4Xc5TBGQbKzQSBSuBBAAKAgMEUHoQDY98y8CAVouu\ny4y3Q2QnBpnUBK/0PELV7VANXd9lY7CShyogJScgPliUm97Au9FC17vqZa1B\n5bBMJAdXVwMBCAfCeAQYEwgACQUCZBsrNAIbDAAhCRC2Ak5G2Sk7ZRYhBLTp\nSkFOe3ajbqouerYCTkbZKTtlR5wA/3zOFTSeXXRRemXl3hY10spxabE4O2J8\nZD2VRfjbDpZjAQDWg1W+jPbM2Htikd1N01V+zweNDhJEH65r0Qr8BlXh2w==\n=Ettu\n-----END PGP PUBLIC KEY BLOCK-----\n',
            ovcToBitgoShare: {
              publicShare: 'ecf95e9ba6f02c0bc4c2ab254565d21a1562059c8a1ab70d286fa04ae2c511e0491410b6d6fa8ab22e691bed7938a7adaabfa8d9d59aab9cc2c078cd37dde01b',
              privateShare: '-----BEGIN PGP MESSAGE-----\n\nwX4DUQ8XhGVGcTISAgMEe1nYNv9DnHl8HX8jNs3reGs5nPT2bNzGMCFL0N3P\nKLwGd8DBkDJIMpoClaAS/HTUTPTRzj4U1GShV79I+bbfTDBV6uhyfZ7a88dV\nRDTXl6rchFl/fmwLoXnqH+BDPEXytpAvKwDrAg55T/H7aop5QbfSsQErEv7X\nTpTLHHHflEEQL62p1Rnnq2kKvwJK7TY1g5RtPgYXH6GEs33DLulPeUs8UkKq\nTPLf2+1KCLYyzMwmSi8KEC8HJb0vAkXZAlZ1+DoZ2PfiIJcVnz7a3omjiP77\nhmC8phTcJ718UxIB09f8uic0/fM7FNu0JHFgRDA69zzeFYnZc2XNQg5hs/dZ\nZ8AitP4rnaAfprsq4rAEE/c3Trm9tzQHZPCqr/2s4LluyUMVJw==\n=IJZH\n-----END PGP MESSAGE-----\n',
              vssProof: '309d2fef2272ad31375954b99a862742f22d8023eef9855b8ae26ea84e08bf5e',
              i: 3,
              j: 2,
              uSig: '-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nxk8EZBsrNBMFK4EEAAoCAwT2xXv/mG/daPdKGD/fHIUEE2ZtcK+njtCZtMEr\nkIubmUwe3Dj8+hQxt3SKaTxQbuD+WaLSj986QYUr4Zw4T+W3zWpvdmMtMi1i\nYWNrdXAtNTQ3YmJkZjMwOGMxZTYxY2Q5ZGI4NmU4IDxvdmMtMi1iYWNrdXAt\nNTQ3YmJkZjMwOGMxZTYxY2Q5ZGI4NmU4QDU0N2JiZGYzMDhjMWU2MWNkOWRi\nODZlOC5jb20+wowEEBMIAB0FAmQbKzQECwkHCAMVCAoEFgACAQIZAQIbAwIe\nAQAhCRC2Ak5G2Sk7ZRYhBLTpSkFOe3ajbqouerYCTkbZKTtlxtYBALLIBnAa\n4AS77XvXmmznNCWO/HNuDPD2ugRqVhqU4SxmAQDma14APuMNSVyi17xomZjW\n0nimtaMIBjc0A4MXE6G4Xc5TBGQbKzQSBSuBBAAKAgMEUHoQDY98y8CAVouu\ny4y3Q2QnBpnUBK/0PELV7VANXd9lY7CShyogJScgPliUm97Au9FC17vqZa1B\n5bBMJAdXVwMBCAfCeAQYEwgACQUCZBsrNAIbDAAhCRC2Ak5G2Sk7ZRYhBLTp\nSkFOe3ajbqouerYCTkbZKTtlR5wA/3zOFTSeXXRRemXl3hY10spxabE4O2J8\nZD2VRfjbDpZjAQDWg1W+jPbM2Htikd1N01V+zweNDhJEH65r0Qr8BlXh284z\nBGQbKzQWCSsGAQQB2kcPAQEHQIVTmlt8a/fjJCY9UyP8J51eTPX9PMRF3/Hr\nBYwtfOZYwngEGBMIAAkFAmQbKzQCGyAAIQkQtgJORtkpO2UWIQS06UpBTnt2\no26qLnq2Ak5G2Sk7ZcthAQD4ek3aqUDEbhfRHolm4jFhIPIbb9hUJwuBR0R4\n+gvaeAEAk8uk5cEACeqmpdEF52oGx7jmGCoX73AIILYVcf9iMkI=\n=92Hf\n-----END PGP PUBLIC KEY BLOCK-----\n',
            },
            ovcToOvcShare: {
              publicShare: 'ecf95e9ba6f02c0bc4c2ab254565d21a1562059c8a1ab70d286fa04ae2c511e0491410b6d6fa8ab22e691bed7938a7adaabfa8d9d59aab9cc2c078cd37dde01b',
              privateShare: '-----BEGIN PGP MESSAGE-----\n\nwX4D+F3vI962zVMSAgMENy2X9xDIOm1gwOfMdL/1vZjeMW/ile/f2dRIP2GV\nv4w60K92+mHI9yooU1VT77jZrVOcNK41DFNCF/fuoUU+VzBON0I1hHyXm2QJ\nwL+nNdvAXwRv7nSFD3ABUmRYdG71AFIWjW2L+1C2hxpsNlmdxffSsQHHT9uP\nBNpFYgQN77OUxcgrweSVrPyer1rCQ8o+QnoK2/hIx9PlJZkcl3uwF6TpBtjs\nqvRxThomoHyo0hJHG0vmI42Gq5u0tcSeU902efpCDaeJhPVOiqISoJ96wn0r\nFB3lYLSflOpCLAE7nsZJRoXA6akU7xMCMNA++d4tv6p98FQ+MZ6e9x6kiSw1\nM+VWj+PvN1dtQ8fNYwpJf7KBfD1w6ISMFDmewkDE7iBOXF6FLw==\n=+3Yc\n-----END PGP MESSAGE-----\n',
              vssProof: '309d2fef2272ad31375954b99a862742f22d8023eef9855b8ae26ea84e08bf5e',
              i: 1,
              j: 2,
              uSig: '-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nxk8EZBsrNBMFK4EEAAoCAwT2xXv/mG/daPdKGD/fHIUEE2ZtcK+njtCZtMEr\nkIubmUwe3Dj8+hQxt3SKaTxQbuD+WaLSj986QYUr4Zw4T+W3zWpvdmMtMi1i\nYWNrdXAtNTQ3YmJkZjMwOGMxZTYxY2Q5ZGI4NmU4IDxvdmMtMi1iYWNrdXAt\nNTQ3YmJkZjMwOGMxZTYxY2Q5ZGI4NmU4QDU0N2JiZGYzMDhjMWU2MWNkOWRi\nODZlOC5jb20+wowEEBMIAB0FAmQbKzQECwkHCAMVCAoEFgACAQIZAQIbAwIe\nAQAhCRC2Ak5G2Sk7ZRYhBLTpSkFOe3ajbqouerYCTkbZKTtlxtYBALLIBnAa\n4AS77XvXmmznNCWO/HNuDPD2ugRqVhqU4SxmAQDma14APuMNSVyi17xomZjW\n0nimtaMIBjc0A4MXE6G4Xc5TBGQbKzQSBSuBBAAKAgMEUHoQDY98y8CAVouu\ny4y3Q2QnBpnUBK/0PELV7VANXd9lY7CShyogJScgPliUm97Au9FC17vqZa1B\n5bBMJAdXVwMBCAfCeAQYEwgACQUCZBsrNAIbDAAhCRC2Ak5G2Sk7ZRYhBLTp\nSkFOe3ajbqouerYCTkbZKTtlR5wA/3zOFTSeXXRRemXl3hY10spxabE4O2J8\nZD2VRfjbDpZjAQDWg1W+jPbM2Htikd1N01V+zweNDhJEH65r0Qr8BlXh284z\nBGQbKzQWCSsGAQQB2kcPAQEHQNVGg0vPsfK1yJjFuDYB8Tj7CQRHKGAVEDcj\nh/QIqr0KwngEGBMIAAkFAmQbKzQCGyAAIQkQtgJORtkpO2UWIQS06UpBTnt2\no26qLnq2Ak5G2Sk7ZS9oAQCe2zJD5ItW2GEgAitnY+NrLBjbXI6+LY29GjRa\nf6yFTQD/cP0E1DleqXMjgfR+ewt6quVFMZebhr3tBr/H0Zv/9EA=\n=8ai+\n-----END PGP PUBLIC KEY BLOCK-----\n',
            },
          },
        },
      };
      const expectedBitGoOutput = {
        ...ovcOutputJson,
        state: 2,
        platform: {
          commonKeychain: bitGoKeyResult.commonKeychain,
          walletHSMGPGPublicKeySigs: bitGoKeyResult.walletHSMGPGPublicKeySigs,
          ovc: {
            1: {
              bitgoToOvcShare: {
                i: 1,
                j: 3,
                publicShare: bitGoKeyResult.keyShares[0].publicShare,
                privateShare: bitGoKeyResult.keyShares[0].privateShare,
                vssProof: bitGoKeyResult.keyShares[0].vssProof,
              },
            },
            2: {
              bitgoToOvcShare: {
                i: 2,
                j: 3,
                publicShare: bitGoKeyResult.keyShares[1].publicShare,
                privateShare: bitGoKeyResult.keyShares[1].privateShare,
                vssProof: bitGoKeyResult.keyShares[1].vssProof,
              },
            },
          },
        },
      };
      const platformOutput = await bitgo.coin('tsol').keychains().createTssBitGoKeyFromOvcShares(ovcOutputJson);
      should.equal(platformOutput.bitGoKeyId, bitGoKeyResult.id);
      should.deepEqual(platformOutput.bitGoOutputJsonForOvc, expectedBitGoOutput);
    });
  });
});
