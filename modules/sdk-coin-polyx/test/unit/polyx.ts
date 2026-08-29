import should from 'should';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI, encrypt } from '@bitgo/sdk-api';
import { Polyx, Tpolyx } from '../../src';
import { POLYX_ADDRESS_FORMAT, TPOLYX_ADDRESS_FORMAT } from '../../src/lib/constants';
import utils from '../../src/lib/utils';
import { coins } from '@bitgo/statics';
import * as sinon from 'sinon';
import * as testData from '../resources/wrwUsers';
import { afterEach } from 'mocha';
import { genesisHash, specVersion, txVersion, rawTx, accounts, mockTssSignature } from '../resources';
import { EDDSAMethods, MPCRecoveryOptions, MPCTx, TxIntentMismatchRecipientError } from '@bitgo/sdk-core';
import { TransferBuilder, V8TransferBuilder } from '../../src/lib';
import { testnetV8Material } from '../../src/resources';
import { MPSUtil } from '@bitgo/sdk-lib-mpc';

describe('Polyx:', function () {
  let bitgo: TestBitGoAPI;
  let baseCoin;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('polyx', Polyx.createInstance);
    bitgo.safeRegister('tpolyx', Tpolyx.createInstance);
    bitgo.initializeTestVars();
    baseCoin = bitgo.coin('tpolyx') as Tpolyx;
  });

  describe('Address Format Constants', function () {
    it('should have the correct address format constants', function () {
      // Verify the constants are defined correctly
      POLYX_ADDRESS_FORMAT.should.equal(12);
      TPOLYX_ADDRESS_FORMAT.should.equal(42);
    });
  });

  describe('Recover Transactions:', function () {
    const sandBox = sinon.createSandbox();
    const recoveryDestination = '5H56f31hSYGCRV3URjQHv2Cc4ZSkJNHTM8MKGtkkV6hzCqN7';
    const nonce = 0;
    let accountInfoCB;
    let headerInfoCB;
    let getFeeCB;
    let getMaterialCB;

    beforeEach(function () {
      accountInfoCB = sandBox.stub(Polyx.prototype, 'getAccountInfo' as keyof Polyx);
      headerInfoCB = sandBox.stub(Polyx.prototype, 'getHeaderInfo' as keyof Polyx);
      getFeeCB = sandBox.stub(Polyx.prototype, 'getFee' as keyof Polyx);
      getMaterialCB = sandBox.stub(Polyx.prototype, 'getMaterial' as keyof Polyx);
      getMaterialCB.resolves(utils.getMaterial(coins.get('tpolyx').network.type));
    });

    afterEach(function () {
      sandBox.restore();
    });

    it('should generate unsigned sweep correctly', async function () {
      accountInfoCB
        .withArgs(testData.unsignedSweepUser.walletAddress)
        .resolves({ nonce: 0, freeBalance: 100007000000 });
      headerInfoCB.resolves({
        headerNumber: testData.testnetBlock.blockNumber,
        headerHash: testData.testnetBlock.hash,
      });
      getFeeCB.withArgs(recoveryDestination, testData.unsignedSweepUser.walletAddress, 100007000000).resolves(74401);

      const commonKeyChain = testData.unsignedSweepUser.bitgoKey;

      const unsigned = await baseCoin.recover({ bitgoKey: commonKeyChain, recoveryDestination });

      unsigned.txRequests.should.not.be.undefined();
      unsigned.txRequests.length.should.equal(1);
      unsigned.txRequests[0].transactions.length.should.equal(1);
      unsigned.txRequests[0].walletCoin.should.equal('tpolyx');
      unsigned.txRequests[0].transactions[0].unsignedTx.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.serializedTx.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.scanIndex.should.equal(0);
      unsigned.txRequests[0].transactions[0].unsignedTx.coin.should.equal('tpolyx');
      unsigned.txRequests[0].transactions[0].unsignedTx.signableHex.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.derivationPath.should.equal('m/0');
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.inputs.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.inputs.length.should.equal(1);
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.inputs[0].address.should.equal(
        '5DnZQqbxtB3CWkLgfA6wpqdkCd9Bq7AX49RpLPJwW9mzoT7s'
      );
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.inputs[0].valueString.should.equal('100006255990');
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.inputs[0].value.should.equal(100006255990);
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.outputs.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.outputs.length.should.equal(1);
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.outputs[0].address.should.equal(
        '5H56f31hSYGCRV3URjQHv2Cc4ZSkJNHTM8MKGtkkV6hzCqN7'
      );
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.outputs[0].valueString.should.equal('100006255990');
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.outputs[0].coinName.should.equal('tpolyx');
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.type.should.equal('');
      unsigned.txRequests[0].transactions[0].unsignedTx.feeInfo.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.feeInfo.fee.should.equal(0);
      unsigned.txRequests[0].transactions[0].unsignedTx.feeInfo.feeString.should.equal('0');
      unsigned.txRequests[0].transactions[0].unsignedTx.coinSpecific.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.coinSpecific.firstValid.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.coinSpecific.maxDuration.should.equal(2400);
      unsigned.txRequests[0].transactions[0].unsignedTx.coinSpecific.commonKeychain.should.equal(
        '97d9da8bf544d07f3c7ae8ee06bb12a63f74478d0c461201ab94421a9c81d5b379553f0332daaa85cb8c65e1fe7e6907c62268c00812b08a4e1361178e304ddb'
      );
    });

    it('should recover a tx for non-bitgo recoveries', async function () {
      accountInfoCB.withArgs(testData.wrwUser.walletAddress).resolves({ nonce: 0, freeBalance: 100007000000 });
      headerInfoCB.resolves({
        headerNumber: testData.testnetBlock.blockNumber,
        headerHash: testData.testnetBlock.hash,
      });
      getFeeCB.withArgs(recoveryDestination, testData.wrwUser.walletAddress, 100007000000).resolves(74401);

      const res = await baseCoin.recover({
        userKey: testData.wrwUser.userKey,
        backupKey: testData.wrwUser.backupKey,
        bitgoKey: testData.wrwUser.bitgoKey,
        walletPassphrase: testData.wrwUser.walletPassphrase,
        recoveryDestination: recoveryDestination,
      });

      res.should.not.be.empty();
      res.should.hasOwnProperty('serializedTx');
      res.should.hasOwnProperty('scanIndex');

      const txBuilder = baseCoin.getBuilder().from(res.serializedTx);
      txBuilder
        .validity({
          firstValid: testData.testnetBlock.blockNumber,
          maxDuration: baseCoin.SWEEP_TXN_DURATION,
        })
        .referenceBlock(testData.testnetBlock.hash);

      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.sender, testData.wrwUser.walletAddress);
      should.deepEqual(txJson.blockNumber, testData.testnetBlock.blockNumber);
      should.deepEqual(txJson.referenceBlock, testData.testnetBlock.hash);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, nonce);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.eraPeriod, baseCoin.SWEEP_TXN_DURATION);
    });

    it('should recover a txn for unsigned-sweep recoveries', async function () {
      accountInfoCB
        .withArgs(testData.unsignedSweepUser.walletAddress)
        .resolves({ nonce: 0, freeBalance: 100007000000 });
      headerInfoCB.resolves({
        headerNumber: testData.testnetBlock.blockNumber,
        headerHash: testData.testnetBlock.hash,
      });
      getFeeCB.withArgs(recoveryDestination, testData.unsignedSweepUser.walletAddress, 100007000000).resolves(74401);

      const res = await baseCoin.recover({
        bitgoKey: testData.unsignedSweepUser.bitgoKey,
        recoveryDestination: recoveryDestination,
      });

      res.should.not.be.empty();
      res.txRequests[0].transactions[0].unsignedTx.should.hasOwnProperty('serializedTx');
      res.txRequests[0].transactions[0].unsignedTx.should.hasOwnProperty('scanIndex');

      const txBuilder = baseCoin.getBuilder().from(res.txRequests[0].transactions[0].unsignedTx.serializedTx);
      txBuilder
        .validity({
          firstValid: testData.testnetBlock.blockNumber,
          maxDuration: baseCoin.SWEEP_TXN_DURATION,
        })
        .referenceBlock(testData.testnetBlock.hash)
        .sender({ address: testData.unsignedSweepUser.walletAddress });

      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.sender, testData.unsignedSweepUser.walletAddress);
      should.deepEqual(txJson.blockNumber, testData.testnetBlock.blockNumber);
      should.deepEqual(txJson.referenceBlock, testData.testnetBlock.hash);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 0);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.eraPeriod, baseCoin.SWEEP_TXN_DURATION);
    });

    describe('MPCv2 signed recovery', function () {
      const walletPassphrase = 'test-passphrase-mpcv2';
      let mpcV2UserKey: string;
      let mpcV2BackupKey: string;
      let mpcV2CommonKeyChain: string;
      let mpcV2RecoverParams: MPCRecoveryOptions;

      before(async function () {
        const [userDkg, backupDkg] = await MPSUtil.generateEdDsaDKGKeyShares();
        mpcV2CommonKeyChain = userDkg.getCommonKeychain();
        mpcV2UserKey = await encrypt(walletPassphrase, userDkg.getReducedKeyShare().toString('base64'));
        mpcV2BackupKey = await encrypt(walletPassphrase, backupDkg.getReducedKeyShare().toString('base64'));

        mpcV2RecoverParams = {
          userKey: mpcV2UserKey,
          backupKey: mpcV2BackupKey,
          bitgoKey: mpcV2CommonKeyChain,
          recoveryDestination,
          walletPassphrase,
        };
      });

      beforeEach(function () {
        // Use unrestricted resolves (not .withArgs) since the mismatched-bitgoKey test
        // derives a different sender address than mpcV2WalletAddress.
        accountInfoCB.resolves({ nonce: 0, freeBalance: 100007000000 });
        headerInfoCB.resolves({
          headerNumber: testData.testnetBlock.blockNumber,
          headerHash: testData.testnetBlock.hash,
        });
        getFeeCB.resolves(74401);
      });

      it('should recover a tx using MPCv2 signing material', async function () {
        const getTSSSignatureSpy = sandBox.spy(EDDSAMethods, 'getTSSSignature');
        const addSignatureSpy = sandBox.spy(TransferBuilder.prototype, 'addSignature');

        const result = (await baseCoin.recover(mpcV2RecoverParams)) as MPCTx;

        result.should.not.be.empty();
        result.should.hasOwnProperty('serializedTx');
        result.should.hasOwnProperty('scanIndex');
        should.equal(result.scanIndex, 0);
        (result.serializedTx as string).should.be.a.String().and.not.be.empty();
        sandBox.assert.notCalled(getTSSSignatureSpy);

        // Substrate MultiSignature Ed25519 discriminant (0x00) must prefix the 64-byte signature.
        sandBox.assert.calledOnce(addSignatureSpy);
        const signature: Buffer = addSignatureSpy.firstCall.args[1];
        signature.length.should.equal(65);
        signature[0].should.equal(0x00);
      });

      it('should produce a cryptographically valid Ed25519 signature', async function () {
        const addSignatureSpy = sandBox.spy(TransferBuilder.prototype, 'addSignature');
        const signRecoverySpy = sandBox.spy(
          baseCoin as unknown as { signSubstrateMpcV2Recovery: unknown },
          'signSubstrateMpcV2Recovery'
        );

        await baseCoin.recover(mpcV2RecoverParams);

        // 65-byte sig: 0x00 discriminant + 64-byte Ed25519 sig; signatureVerify handles the prefix.
        const signature: Buffer = addSignatureSpy.firstCall.args[1];

        // Capture the exact bytes signed by the DSG protocol inside signSubstrateMpcV2Recovery.
        const signablePayload: Buffer = (signRecoverySpy.firstCall.args[0] as { message: Buffer }).message;

        const MPC = await EDDSAMethods.getInitializedMpcInstance();
        const accountId = MPC.deriveUnhardened(mpcV2CommonKeyChain, 'm/0').slice(0, 64);

        const senderAddr = baseCoin.getAddressFromPublicKey(accountId);
        const isValid = utils.verifySignature(
          `0x${signablePayload.toString('hex')}`,
          `0x${signature.toString('hex')}`,
          senderAddr
        );
        isValid.should.be.true();
      });

      it('should use MPCv1 path when signing material is MPCv1 format', async function () {
        const userPrv = JSON.stringify({ uShare: { seed: 'aa' }, bitgoYShare: { u: 'bb' }, backupYShare: { u: 'cc' } });
        sandBox
          .stub(baseCoin as unknown as { getEddsaSigningMaterial: unknown }, 'getEddsaSigningMaterial')
          .resolves({ version: 'v1', userPrv });

        const getTSSSignatureStub = sandBox
          .stub(EDDSAMethods, 'getTSSSignature')
          .resolves(
            Buffer.from(
              '1baafa0d62174bf0c78f3256318613ffc44b6dd54ab1a63c2185232f92ede9da' +
                'e1b2818dbeb52a8215fd56f5a5f2a9f94c079ce89e4dc3b1ce6ed6e84ce71857',
              'hex'
            )
          );

        sandBox
          .stub(bitgo, 'decrypt')
          .withArgs(sinon.match({ input: mpcV2BackupKey.replace(/\s/g, '') }))
          .resolves(JSON.stringify({ bShare: {}, yShares: {} }));

        const result = (await baseCoin.recover(mpcV2RecoverParams)) as MPCTx;

        result.should.not.be.empty();
        result.should.hasOwnProperty('serializedTx');
        result.should.hasOwnProperty('scanIndex');
        should.equal(result.scanIndex, 0);
        (result.serializedTx as string).should.be.a.String().and.not.be.empty();
        sandBox.assert.calledOnce(getTSSSignatureStub);
      });

      it('should throw a descriptive error when user keychain decryption fails on the MPCv1 path', async function () {
        sandBox.stub(bitgo, 'decrypt').rejects(new Error('password error'));

        await baseCoin.recover(mpcV2RecoverParams).should.be.rejectedWith(/Error decrypting user keychain/);
      });

      it('should throw when commonKeyChain from MPCv2 keycard does not match bitgoKey', async function () {
        const mismatchedBitgoKey = mpcV2CommonKeyChain.slice(0, -8) + '00000000';
        const mismatchedParams = {
          ...mpcV2RecoverParams,
          bitgoKey: mismatchedBitgoKey,
        };

        await baseCoin
          .recover(mismatchedParams)
          .should.be.rejectedWith('EdDSA MPCv2 recovery: commonKeyChain from keycard does not match bitgoKey');
      });

      it('should throw missing userKey when backupKey and walletPassphrase are present but userKey is not', async function () {
        const paramsWithoutUserKey = { ...mpcV2RecoverParams, userKey: undefined };
        await baseCoin.recover(paramsWithoutUserKey).should.be.rejectedWith('missing userKey');
      });

      it('should throw missing backupKey when userKey and walletPassphrase are present but backupKey is not', async function () {
        const paramsWithoutBackupKey = { ...mpcV2RecoverParams, backupKey: undefined };
        await baseCoin.recover(paramsWithoutBackupKey).should.be.rejectedWith('missing backupKey');
      });

      it('should throw missing wallet passphrase when userKey and backupKey are present but walletPassphrase is not', async function () {
        const paramsWithoutPassphrase = { ...mpcV2RecoverParams, walletPassphrase: undefined };
        await baseCoin.recover(paramsWithoutPassphrase).should.be.rejectedWith('missing wallet passphrase');
      });
    });
  });

  describe('Token Enablement:', function () {
    it('should have correct token enablement config', function () {
      const config = baseCoin.getTokenEnablementConfig();
      should.exist(config);
      config.requiresTokenEnablement.should.equal(true);
      config.supportsMultipleTokenEnablements.should.equal(false);
    });

    it('should validate wallet type for token enablement', function () {
      const config = baseCoin.getTokenEnablementConfig();
      (() => config.validateWallet('custodial')).should.not.throw();
      (() => config.validateWallet('hot')).should.throw(
        /Token enablement for Polymesh \(polyx\) is only supported for custodial wallets/
      );
      (() => config.validateWallet('cold')).should.throw(
        /Token enablement for Polymesh \(polyx\) is only supported for custodial wallets/
      );
    });
  });

  describe('verifyTransaction', function () {
    const transferTo = '5F8jxKE81GhFrphyfMFr5UjeAz5wS4AaZFmeFPnf8wTetD72';
    const transferAmount = '2000000000';
    const wrongAddress = '5GhbC6n2pUFrX98DwyPit67fB5AwQvVCwZ4j2HKA7a4dUK4y';

    describe('transfer transaction', function () {
      it('should return true when address and amount match', async function () {
        const result = await baseCoin.verifyTransaction({
          txPrebuild: { txHex: rawTx.transfer.signed },
          txParams: { recipients: [{ address: transferTo, amount: transferAmount }] },
        });
        result.should.be.true();
      });

      it('should throw TxIntentMismatchRecipientError for address mismatch', async function () {
        await baseCoin
          .verifyTransaction({
            txPrebuild: { txHex: rawTx.transfer.signed },
            txParams: { recipients: [{ address: wrongAddress, amount: transferAmount }] },
          })
          .should.be.rejectedWith(TxIntentMismatchRecipientError);
      });

      it('should throw TxIntentMismatchRecipientError for amount mismatch', async function () {
        await baseCoin
          .verifyTransaction({
            txPrebuild: { txHex: rawTx.transfer.signed },
            txParams: { recipients: [{ address: transferTo, amount: '1' }] },
          })
          .should.be.rejectedWith(TxIntentMismatchRecipientError);
      });
    });

    describe('guard cases', function () {
      it('should throw when txHex is missing', async function () {
        await baseCoin
          .verifyTransaction({
            txPrebuild: {},
            txParams: { recipients: [{ address: transferTo, amount: transferAmount }] },
          })
          .should.be.rejectedWith('missing txHex in txPrebuild');
      });

      it('should throw when recipients has more than 1 entry', async function () {
        await baseCoin
          .verifyTransaction({
            txPrebuild: { txHex: rawTx.transfer.signed },
            txParams: {
              recipients: [
                { address: transferTo, amount: transferAmount },
                { address: wrongAddress, amount: transferAmount },
              ],
            },
          })
          .should.be.rejectedWith(/support sending to more than 1 destination address/);
      });

      it('should throw when recipients is an empty array', async function () {
        await baseCoin
          .verifyTransaction({
            txPrebuild: { txHex: rawTx.transfer.signed },
            txParams: { recipients: [] },
          })
          .should.be.rejectedWith('missing recipients in txParams');
      });
    });

    describe('token enablement (preApproveAsset) transaction', function () {
      it('should return true for enabletoken type with recipients (wallet root address)', async function () {
        // buildTokenEnablements sets recipients[0].address = wallet rootAddress and type = 'enabletoken'.
        // verifyTransaction must short-circuit before the _to check since preApproveAsset has no destination.
        const walletAddress = '5F8jxKE81GhFrphyfMFr5UjeAz5wS4AaZFmeFPnf8wTetD72';
        const result = await baseCoin.verifyTransaction({
          txPrebuild: { txHex: rawTx.preApproveAsset.signed },
          txParams: {
            type: 'enabletoken',
            recipients: [{ address: walletAddress, amount: '0', tokenName: 'tpolyx:sometoken' }],
          },
        });
        result.should.be.true();
      });

      it('should return true for enabletoken type with no recipients', async function () {
        const result = await baseCoin.verifyTransaction({
          txPrebuild: { txHex: rawTx.preApproveAsset.signed },
          txParams: { type: 'enabletoken' },
        });
        result.should.be.true();
      });
    });

    describe('v8 transfer with coinSpecific.material', function () {
      const v8Amount = '1000000';
      const v8Receiver = accounts.account2;
      const v8Sender = accounts.account1;
      let v8SignedTxHex: string;

      before(async function () {
        // Build a signed v8 transfer tx using testnetV8Material.
        // The server embeds this material in coinSpecific during prebuild so that
        // verifyTransaction can decode txHex built against a chain spec newer than
        // the SDK's hardcoded v7 material (CECHO-1471).
        const builder = new V8TransferBuilder(coins.get('tpolyx'))
          .amount(v8Amount)
          .to({ address: v8Receiver.address })
          .sender({ address: v8Sender.address })
          .memo('0')
          .validity({ firstValid: 3933, maxDuration: 64 })
          .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
          .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 1 })
          .fee({ amount: 0, type: 'tip' });
        builder.addSignature({ pub: v8Sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));
        const tx = await builder.build();
        v8SignedTxHex = tx.toBroadcastFormat();
      });

      it('verifies a v8 transfer when coinSpecific.material is provided', async function () {
        const result = await baseCoin.verifyTransaction({
          txPrebuild: {
            txHex: v8SignedTxHex,
            coinSpecific: { material: testnetV8Material },
          },
          txParams: { recipients: [{ address: v8Receiver.address, amount: v8Amount }] },
        });
        result.should.be.true();
      });

      it('throws TxIntentMismatchRecipientError for address mismatch on v8 transfer', async function () {
        await baseCoin
          .verifyTransaction({
            txPrebuild: {
              txHex: v8SignedTxHex,
              coinSpecific: { material: testnetV8Material },
            },
            txParams: { recipients: [{ address: wrongAddress, amount: v8Amount }] },
          })
          .should.be.rejectedWith(TxIntentMismatchRecipientError);
      });

      it('throws TxIntentMismatchRecipientError for amount mismatch on v8 transfer', async function () {
        await baseCoin
          .verifyTransaction({
            txPrebuild: {
              txHex: v8SignedTxHex,
              coinSpecific: { material: testnetV8Material },
            },
            txParams: { recipients: [{ address: v8Receiver.address, amount: '1' }] },
          })
          .should.be.rejectedWith(TxIntentMismatchRecipientError);
      });
    });
  });

  describe('requiresWalletInitializationTransaction', function () {
    it('returns true for polyx', function () {
      const polyxCoin = bitgo.coin('polyx') as Polyx;
      polyxCoin.requiresWalletInitializationTransaction().should.be.true();
    });

    it('returns true for tpolyx', function () {
      baseCoin.requiresWalletInitializationTransaction().should.be.true();
    });
  });
});
