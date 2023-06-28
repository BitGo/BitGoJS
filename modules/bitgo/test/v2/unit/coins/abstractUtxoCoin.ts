import * as utxolib from '@bitgo/utxo-lib';
import * as should from 'should';
import * as sinon from 'sinon';
import { UnexpectedAddressError, VerificationOptions } from '@bitgo/sdk-core';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src/bitgo';
import {
  AbstractUtxoCoin,
  AbstractUtxoCoinWallet,
  Output,
  TransactionExplanation,
  TransactionParams,
} from '@bitgo/abstract-utxo';

describe('Abstract UTXO Coin:', () => {
  describe('Parse Transaction:', () => {
    const bitgo: BitGo = TestBitGo.decorate(BitGo, { env: 'mock' });
    const coin = bitgo.coin('tbtc') as AbstractUtxoCoin;

    /*
     * mock objects which get passed into parse transaction.
     * These objects are structured to force parse transaction into a
     * particular execution path for these tests.
     */
    const verification: VerificationOptions = {
      disableNetworking: true,
      keychains: {
        user: { id: '0', pub: 'aaa', type: 'independent' },
        backup: { id: '1', pub: 'bbb', type: 'independent' },
        bitgo: { id: '2', pub: 'ccc', type: 'independent' },
      },
    };

    const wallet = sinon.createStubInstance(AbstractUtxoCoinWallet, {
      migratedFrom: 'v1_wallet_base_address',
    });

    const outputAmount = (0.01 * 1e8).toString();

    async function runClassifyOutputsTest(
      outputAddress,
      verification,
      expectExternal,
      txParams: TransactionParams = {}
    ) {
      sinon.stub(coin, 'explainTransaction').resolves({
        outputs: [] as Output[],
        changeOutputs: [
          {
            address: outputAddress,
            amount: outputAmount,
          },
        ],
      } as TransactionExplanation);

      if (!txParams.changeAddress) {
        sinon.stub(coin, 'verifyAddress').throws(new UnexpectedAddressError('test error'));
      }

      const parsedTransaction = await coin.parseTransaction({
        txParams,
        txPrebuild: { txHex: '' },
        wallet: wallet as any,
        verification,
      });

      should.exist(parsedTransaction.outputs[0]);
      parsedTransaction.outputs[0].should.deepEqual({
        address: outputAddress,
        amount: outputAmount,
        external: expectExternal,
      });

      const isExplicit =
        txParams.recipients !== undefined &&
        txParams.recipients.some((recipient) => recipient.address === outputAddress);
      should.equal(parsedTransaction.explicitExternalSpendAmount, isExplicit && expectExternal ? outputAmount : '0');
      should.equal(parsedTransaction.implicitExternalSpendAmount, !isExplicit && expectExternal ? outputAmount : '0');

      (coin.explainTransaction as any).restore();

      if (!txParams.changeAddress) {
        (coin.verifyAddress as any).restore();
      }
    }

    it('should classify outputs which spend change back to a v1 wallet base address as internal', async function () {
      return runClassifyOutputsTest(wallet.migratedFrom(), verification, false);
    });

    it(
      'should classify outputs which spend change back to a v1 wallet base address as external ' +
        'if considerMigratedFromAddressInternal is set and false',
      async function () {
        return runClassifyOutputsTest(
          wallet.migratedFrom(),
          { ...verification, considerMigratedFromAddressInternal: false },
          true
        );
      }
    );

    it('should classify outputs which spend to addresses not on the wallet as external', async function () {
      return runClassifyOutputsTest('external_address', verification, true);
    });

    it('should accept a custom change address', async function () {
      const changeAddress = '2NAuziD75WnPPHJVwnd4ckgY4SuJaDVVbMD';
      return runClassifyOutputsTest(changeAddress, verification, false, { changeAddress, recipients: [] });
    });

    it('should classify outputs with external address in recipients as explicit', async function () {
      const externalAddress = '2NAuziD75WnPPHJVwnd4ckgY4SuJaDVVbMD';
      return runClassifyOutputsTest(externalAddress, verification, true, {
        recipients: [{ address: externalAddress, amount: outputAmount }],
      });
    });
  });

  describe('Custom Change Wallets', () => {
    const bitgo: BitGo = TestBitGo.decorate(BitGo, { env: 'mock' });
    const coin = bitgo.coin('tbtc') as AbstractUtxoCoin;

    const keys = {
      send: {
        user: { id: '0', key: coin.keychains().create() },
        backup: { id: '1', key: coin.keychains().create() },
        bitgo: { id: '2', key: coin.keychains().create() },
      },
      change: {
        user: { id: '3', key: coin.keychains().create() },
        backup: { id: '4', key: coin.keychains().create() },
        bitgo: { id: '5', key: coin.keychains().create() },
      },
    };

    const customChangeKeySignatures = {
      user: '',
      backup: '',
      bitgo: '',
    };

    const addressData = {
      chain: 11,
      index: 1,
      addressType: 'p2shP2wsh' as const,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      keychains: [
        { pub: keys.change.user.key.pub! },
        { pub: keys.change.backup.key.pub! },
        { pub: keys.change.bitgo.key.pub! },
      ],
      threshold: 2,
    };

    const { address: changeAddress, coinSpecific } = coin.generateAddress(addressData);

    const changeWalletId = 'changeWalletId';
    const stubData = {
      signedSendingWallet: {
        keyIds: sinon.stub().returns([keys.send.user.id, keys.send.backup.id, keys.send.bitgo.id]),
        coinSpecific: sinon.stub().returns({ customChangeWalletId: changeWalletId }),
      },
      changeWallet: {
        keyIds: sinon.stub().returns([keys.change.user.id, keys.change.backup.id, keys.change.bitgo.id]),
        createAddress: sinon.stub().resolves(changeAddress),
      },
    };

    before(async () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const sign = async ({ key }) =>
        (await coin.signMessage({ prv: keys.send.user.key.prv }, key.pub!)).toString('hex');
      customChangeKeySignatures.user = await sign(keys.change.user);
      customChangeKeySignatures.backup = await sign(keys.change.backup);
      customChangeKeySignatures.bitgo = await sign(keys.change.bitgo);
    });

    it('should consider addresses derived from the custom change keys as internal spends', async () => {
      const signedSendingWallet = sinon.createStubInstance(AbstractUtxoCoinWallet, stubData.signedSendingWallet as any);
      const changeWallet = sinon.createStubInstance(AbstractUtxoCoinWallet, stubData.changeWallet as any);

      sinon.stub(coin, 'keychains').returns({
        get: sinon.stub().callsFake(({ id }) => {
          switch (id) {
            case keys.send.user.id:
              return Promise.resolve({ id, ...keys.send.user.key });
            case keys.send.backup.id:
              return Promise.resolve({ id, ...keys.send.backup.key });
            case keys.send.bitgo.id:
              return Promise.resolve({ id, ...keys.send.bitgo.key });
            case keys.change.user.id:
              return Promise.resolve({ id, ...keys.change.user.key });
            case keys.change.backup.id:
              return Promise.resolve({ id, ...keys.change.backup.key });
            case keys.change.bitgo.id:
              return Promise.resolve({ id, ...keys.change.bitgo.key });
          }
        }),
      } as any);

      sinon.stub(coin, 'wallets').returns({
        get: sinon.stub().callsFake(() => Promise.resolve(changeWallet)),
      } as any);

      const outputAmount = 10000;
      const recipients = [];

      sinon.stub(coin, 'explainTransaction').resolves({
        outputs: [],
        changeOutputs: [
          {
            address: changeAddress,
            amount: outputAmount,
          },
        ],
      } as any);

      signedSendingWallet._wallet = signedSendingWallet._wallet || { customChangeKeySignatures };

      const parsedTransaction = await coin.parseTransaction({
        txParams: { changeAddress, recipients },
        txPrebuild: { txHex: '' },
        wallet: signedSendingWallet as any,
        verification: {
          addresses: {
            [changeAddress]: {
              coinSpecific,
              chain: addressData.chain,
              index: addressData.index,
            },
          },
        },
      });

      should.exist(parsedTransaction.outputs[0]);
      parsedTransaction.outputs[0].should.deepEqual({
        address: changeAddress,
        amount: outputAmount,
        external: false,
        needsCustomChangeKeySignatureVerification: true,
      });

      (coin.explainTransaction as any).restore();
      (coin.wallets as any).restore();
      (coin.keychains as any).restore();
    });
  });

  describe('Verify Transaction', () => {
    const bitgo: BitGo = TestBitGo.decorate(BitGo, { env: 'mock' });
    const coin = bitgo.coin('tbtc') as AbstractUtxoCoin;

    const userKeychain = coin.keychains().create();
    const otherKeychain = coin.keychains().create();

    const changeKeys = {
      user: coin.keychains().create(),
      backup: coin.keychains().create(),
      bitgo: coin.keychains().create(),
    };

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const sign = async (key, keychain) => (await coin.signMessage(keychain, key.pub!)).toString('hex');
    const signUser = (key) => sign(key, userKeychain);
    const signOther = (key) => sign(key, otherKeychain);
    const passphrase = 'test_passphrase';

    const stubData = {
      unsignedSendingWallet: {
        keyIds: sinon.stub().returns(['0', '1', '2']),
      },
      parseTransactionData: {
        badKey: {
          keychains: {
            // user public key swapped out
            user: {
              pub: otherKeychain.pub,
              encryptedPrv: bitgo.encrypt({ input: userKeychain.prv, password: passphrase }),
            },
          },
          needsCustomChangeKeySignatureVerification: true,
        },
        noCustomChange: {
          keychains: { user: userKeychain },
          needsCustomChangeKeySignatureVerification: true,
        },
        emptyCustomChange: {
          keychains: { user: userKeychain },
          needsCustomChangeKeySignatureVerification: true,
          customChange: {},
        },
        // needs to be async function to create signatures
        badSigs: async () => ({
          keychains: { user: userKeychain },
          needsCustomChangeKeySignatureVerification: true,
          customChange: {
            keys: [changeKeys.user, changeKeys.backup, changeKeys.bitgo],
            signatures: [
              await signOther(changeKeys.user),
              await signOther(changeKeys.backup),
              await signOther(changeKeys.bitgo),
            ],
          },
        }),
        goodSigs: async () => ({
          keychains: { user: userKeychain },
          needsCustomChangeKeySignatureVerification: true,
          customChange: {
            keys: [changeKeys.user, changeKeys.backup, changeKeys.bitgo],
            signatures: [
              await signUser(changeKeys.user),
              await signUser(changeKeys.backup),
              await signUser(changeKeys.bitgo),
            ],
          },
          missingOutputs: 1,
        }),
      },
    };

    const unsignedSendingWallet = sinon.createStubInstance(
      AbstractUtxoCoinWallet,
      stubData.unsignedSendingWallet as any
    );

    it('should fail if the user private key cannot be verified to match the user public key', async () => {
      sinon.stub(coin, 'parseTransaction').resolves(stubData.parseTransactionData.badKey as any);
      const verifyWallet = sinon.createStubInstance(AbstractUtxoCoinWallet, {});

      await coin
        .verifyTransaction({
          txParams: {
            walletPassphrase: passphrase,
          },
          txPrebuild: {},
          wallet: verifyWallet as any,
          verification: {},
        })
        .should.be.rejectedWith(
          /transaction requires verification of user public key, but it was unable to be verified/
        );

      (coin.parseTransaction as any).restore();
    });

    it('should fail if the custom change verification data is required but missing', async () => {
      sinon.stub(coin, 'parseTransaction').resolves(stubData.parseTransactionData.noCustomChange as any);

      await coin
        .verifyTransaction({
          txParams: {
            walletPassphrase: passphrase,
          },
          txPrebuild: {},
          wallet: unsignedSendingWallet as any,
          verification: {},
        })
        .should.be.rejectedWith(/parsed transaction is missing required custom change verification data/);

      (coin.parseTransaction as any).restore();
    });

    it('should fail if the custom change keys or key signatures are missing', async () => {
      sinon.stub(coin, 'parseTransaction').resolves(stubData.parseTransactionData.emptyCustomChange as any);

      await coin
        .verifyTransaction({
          txParams: {
            walletPassphrase: passphrase,
          },
          txPrebuild: {},
          wallet: unsignedSendingWallet as any,
          verification: {},
        })
        .should.be.rejectedWith(/customChange property is missing keys or signatures/);

      (coin.parseTransaction as any).restore();
    });

    it('should fail if the custom change key signatures cannot be verified', async () => {
      sinon.stub(coin, 'parseTransaction').resolves((await stubData.parseTransactionData.badSigs()) as any);

      await coin
        .verifyTransaction({
          txParams: {
            walletPassphrase: passphrase,
          },
          txPrebuild: {},
          wallet: unsignedSendingWallet as any,
          verification: {},
        })
        .should.be.rejectedWith(
          /transaction requires verification of custom change key signatures, but they were unable to be verified/
        );

      (coin.parseTransaction as any).restore();
    });

    it('should successfully verify a custom change transaction when change keys and signatures are valid', async () => {
      sinon.stub(coin, 'parseTransaction').resolves((await stubData.parseTransactionData.goodSigs()) as any);

      // if verify transaction gets rejected with the outputs missing error message,
      // then we know that the verification of the custom change key signatures was successful
      await coin
        .verifyTransaction({
          txParams: {
            walletPassphrase: passphrase,
          },
          txPrebuild: {},
          wallet: unsignedSendingWallet as any,
          verification: {},
        })
        .should.be.rejectedWith(/expected outputs missing in transaction prebuild/);

      (coin.parseTransaction as any).restore();
    });

    it('should not allow more than 150 basis points of implicit external outputs (for paygo outputs)', async () => {
      const coinMock = sinon.stub(coin, 'parseTransaction').resolves({
        keychains: {},
        keySignatures: {},
        outputs: [],
        missingOutputs: [],
        explicitExternalOutputs: [],
        implicitExternalOutputs: [],
        changeOutputs: [],
        explicitExternalSpendAmount: 10000,
        implicitExternalSpendAmount: 151,
        needsCustomChangeKeySignatureVerification: false,
      });

      await coin
        .verifyTransaction({
          txParams: {
            walletPassphrase: passphrase,
          },
          txPrebuild: {},
          wallet: unsignedSendingWallet as any,
        })
        .should.be.rejectedWith('prebuild attempts to spend to unintended external recipients');

      coinMock.restore();
    });

    it('should allow 150 basis points of implicit external outputs (for paygo outputs)', async () => {
      const coinMock = sinon.stub(coin, 'parseTransaction').resolves({
        keychains: {},
        keySignatures: {},
        outputs: [],
        missingOutputs: [],
        explicitExternalOutputs: [],
        implicitExternalOutputs: [],
        changeOutputs: [],
        explicitExternalSpendAmount: 1000,
        implicitExternalSpendAmount: 15,
        needsCustomChangeKeySignatureVerification: false,
      });

      const bitcoinMock = sinon
        .stub(coin, 'createTransactionFromHex')
        .returns({ ins: [] } as unknown as utxolib.bitgo.UtxoTransaction);

      await coin
        .verifyTransaction({
          txParams: {
            walletPassphrase: passphrase,
          },
          txPrebuild: {
            txHex: '00',
          },
          wallet: unsignedSendingWallet as any,
        })
        .should.eventually.be.true();

      coinMock.restore();
      bitcoinMock.restore();
    });

    it('should not allow any implicit external outputs if paygo outputs are disallowed', async () => {
      const coinMock = sinon.stub(coin, 'parseTransaction').resolves({
        keychains: {},
        keySignatures: {},
        outputs: [],
        missingOutputs: [],
        explicitExternalOutputs: [],
        implicitExternalOutputs: [],
        changeOutputs: [],
        explicitExternalSpendAmount: 0,
        implicitExternalSpendAmount: 10,
        needsCustomChangeKeySignatureVerification: false,
      });

      await coin
        .verifyTransaction({
          txParams: {
            walletPassphrase: passphrase,
          },
          txPrebuild: {
            txHex: '00',
          },
          wallet: unsignedSendingWallet as any,
          verification: {
            allowPaygoOutput: false,
          },
        })
        .should.be.rejectedWith('prebuild attempts to spend to unintended external recipients');

      coinMock.restore();
    });

    it('should allow paygo outputs if empty verification object is passed', async () => {
      const coinMock = sinon.stub(coin, 'parseTransaction').resolves({
        keychains: {},
        keySignatures: {},
        outputs: [],
        missingOutputs: [],
        explicitExternalOutputs: [],
        implicitExternalOutputs: [],
        changeOutputs: [],
        explicitExternalSpendAmount: 1000,
        implicitExternalSpendAmount: 15,
        needsCustomChangeKeySignatureVerification: false,
      });

      const bitcoinMock = sinon
        .stub(coin, 'createTransactionFromHex')
        .returns({ ins: [] } as unknown as utxolib.bitgo.UtxoTransaction);

      await coin
        .verifyTransaction({
          txParams: {
            walletPassphrase: passphrase,
          },
          txPrebuild: {
            txHex: '00',
          },
          wallet: unsignedSendingWallet as any,
          verification: {},
        })
        .should.eventually.be.true();

      coinMock.restore();
      bitcoinMock.restore();
    });

    it('should work with bigint amounts', async () => {
      // need a coin that uses bigint
      const bigintCoin = bitgo.coin('tdoge') as AbstractUtxoCoin;

      const coinMock = sinon.stub(bigintCoin, 'parseTransaction').resolves({
        keychains: {},
        keySignatures: {},
        outputs: [],
        missingOutputs: [],
        explicitExternalOutputs: [{ address: 'external_address', amount: '10000' }],
        implicitExternalOutputs: [{ address: 'external_address_2', amount: '15' }],
        changeOutputs: [],
        explicitExternalSpendAmount: BigInt(10000),
        implicitExternalSpendAmount: BigInt(15),
        needsCustomChangeKeySignatureVerification: false,
      });

      const bitcoinMock = sinon
        .stub(bigintCoin, 'createTransactionFromHex')
        .returns({ ins: [] } as unknown as utxolib.bitgo.UtxoTransaction);

      await bigintCoin
        .verifyTransaction({
          txParams: {
            walletPassphrase: passphrase,
          },
          txPrebuild: {
            txHex: '00',
          },
          wallet: unsignedSendingWallet as any,
          verification: {},
        })
        .should.eventually.be.true();

      coinMock.restore();
      bitcoinMock.restore();
    });
  });
});
