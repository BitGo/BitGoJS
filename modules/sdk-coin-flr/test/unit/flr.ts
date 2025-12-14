import * as should from 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Flr, Tflr } from '../../src/index';
import { ExplainTransactionOptions } from '../../src/iface';
import { UnsignedSweepTxMPCv2 } from '@bitgo/abstract-eth';
import { mockDataUnsignedSweep, mockDataNonBitGoRecovery, EXPORT_C_TEST_DATA } from '../resources';
import nock from 'nock';
import { common, TransactionType, Wallet } from '@bitgo/sdk-core';
import { FeeMarketEIP1559Transaction } from '@ethereumjs/tx';
import { stripHexPrefix } from '@ethereumjs/util';
import * as sinon from 'sinon';
import { bip32 } from '@bitgo/secp256k1';
import * as secp256k1 from 'secp256k1';
import Keccak from 'keccak';

// Helper to calculate tx hash like Flr.getTxHash
function getTxHash(tx: string): Buffer {
  const hash = Keccak('keccak256');
  hash.update(tx.startsWith('0x') ? tx.slice(2) : tx, 'hex');
  return hash.digest();
}

describe('flr', function () {
  let bitgo: TestBitGoAPI;
  let tflrCoin;
  let flrCoin;
  let hopExportTxBitgoSignature;

  const address2 = '0x7e85bdc27c050e3905ebf4b8e634d9ad6edd0de6';
  const hopExportTx = EXPORT_C_TEST_DATA.fullsigntxHex;
  const hopExportTxId = '0x' + getTxHash(hopExportTx).toString('hex');

  before(function () {
    const bitgoKeyXprv =
      'xprv9s21ZrQH143K3tpWBHWe31sLoXNRQ9AvRYJgitkKxQ4ATFQMwvr7hHNqYRUnS7PsjzB7aK1VxqHLuNQjj1sckJ2Jwo2qxmsvejwECSpFMfC';
    const bitgoKey = bip32.fromBase58(bitgoKeyXprv);
    if (!bitgoKey.privateKey) {
      throw new Error('no privateKey');
    }
    const bitgoXpub = bitgoKey.neutered().toBase58();

    hopExportTxBitgoSignature =
      '0xaa' +
      Buffer.from(
        secp256k1.ecdsaSign(Buffer.from(hopExportTxId.slice(2), 'hex'), bitgoKey.privateKey).signature
      ).toString('hex');

    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.safeRegister('flr', Flr.createInstance);
    bitgo.safeRegister('tflr', Tflr.createInstance);
    common.Environments[bitgo.getEnv()].hsmXpub = bitgoXpub;
    bitgo.initializeTestVars();
  });

  beforeEach(function () {
    tflrCoin = bitgo.coin('tflr') as Tflr;
    flrCoin = bitgo.coin('flr') as Flr;
  });

  describe('Basic Coin Info', function () {
    it('should return the right info for flr', function () {
      const flr = bitgo.coin('flr');

      flr.should.be.an.instanceof(Flr);
      flr.getChain().should.equal('flr');
      flr.getFamily().should.equal('flr');
      flr.getFullName().should.equal('Flare');
      flr.getBaseFactor().should.equal(1e18);
      flr.supportsTss().should.equal(true);
      flr.allowsAccountConsolidations().should.equal(false);
    });

    it('should return the right info for tflr', function () {
      const tflr = bitgo.coin('tflr');

      tflr.should.be.an.instanceof(Tflr);
      tflr.getChain().should.equal('tflr');
      tflr.getFamily().should.equal('flr');
      tflr.getFullName().should.equal('Testnet flare');
      tflr.getBaseFactor().should.equal(1e18);
      tflr.supportsTss().should.equal(true);
      tflr.allowsAccountConsolidations().should.equal(false);
    });
  });

  describe('P-Chain Methods', function () {
    it('should return flrp for mainnet', function () {
      (flrCoin as any).getFlrP().should.equal('flrp');
    });

    it('should return tflrp for testnet', function () {
      (tflrCoin as any).getFlrP().should.equal('tflrp');
    });
  });

  describe('Address Validation', function () {
    it('should validate valid eth address', function () {
      const address = '0x1374a2046661f914d1687d85dbbceb9ac7910a29';
      tflrCoin.isValidAddress(address).should.be.true();
      flrCoin.isValidAddress(address).should.be.true();
    });

    it('should validate a P-chain address', function () {
      const pAddresses = EXPORT_C_TEST_DATA.pAddresses;
      for (const addr of pAddresses) {
        tflrCoin.isValidAddress(addr).should.be.true();
        flrCoin.isValidAddress(addr).should.be.true();
      }
    });

    it('should validate a P-chain multisig address string', function () {
      const address = EXPORT_C_TEST_DATA.pMultisigAddress;
      tflrCoin.isValidAddress(address).should.be.true();
      flrCoin.isValidAddress(address).should.be.true();
    });

    it('should return false for empty address', function () {
      tflrCoin.isValidAddress('').should.be.false();
      flrCoin.isValidAddress('').should.be.false();
    });
  });

  describe('Token Check', function () {
    it('should return false for isToken', function () {
      tflrCoin.isToken().should.be.false();
      flrCoin.isToken().should.be.false();
    });
  });

  describe('Hop Transaction Parameters', function () {
    const sandbox = sinon.createSandbox();

    afterEach(function () {
      sandbox.restore();
    });

    it('should create hop transaction parameters with gasPriceMax > 0', async function () {
      const mockFeeEstimate = {
        feeEstimate: 120000,
        gasLimitEstimate: 500000,
      };
      sandbox.stub(tflrCoin, 'feeEstimate').resolves(mockFeeEstimate);
      const recipients = [
        {
          address: EXPORT_C_TEST_DATA.pMultisigAddress,
          amount: '100000000000000000',
        },
      ];

      const result = await (tflrCoin as any).createHopTransactionParams({
        recipients,
        type: 'Export' as keyof typeof TransactionType,
      });

      result.should.have.property('hopParams');
      result.hopParams.should.have.properties(['userReqSig', 'gasPriceMax', 'paymentId', 'gasLimit']);
      result.hopParams.userReqSig.should.equal('0x');
      result.hopParams.gasPriceMax.should.be.above(0);
      result.hopParams.paymentId.should.be.a.String();
      result.hopParams.gasLimit.should.equal(500000);
    });

    it('should throw error if no recipients provided', async function () {
      await (tflrCoin as any)
        .createHopTransactionParams({
          recipients: [],
          type: 'Export' as keyof typeof TransactionType,
        })
        .should.be.rejectedWith('must send to exactly 1 recipient');
    });

    it('should throw error if more than 1 recipient provided', async function () {
      const recipients = [
        {
          address: EXPORT_C_TEST_DATA.pMultisigAddress,
          amount: '100000000000000000',
        },
        {
          address: EXPORT_C_TEST_DATA.cHexAddress,
          amount: '50000000000000000',
        },
      ];

      await (tflrCoin as any)
        .createHopTransactionParams({
          recipients,
          type: 'Export' as keyof typeof TransactionType,
        })
        .should.be.rejectedWith('must send to exactly 1 recipient');
    });
  });

  describe('Explain Transaction', function () {
    it('should explain an unsigned export in C transaction', async function () {
      const testData = EXPORT_C_TEST_DATA;
      const txExplain = await tflrCoin.explainTransaction({
        txHex: testData.unsignedTxHex,
        crossChainType: 'export',
      });
      txExplain.type.should.equal(TransactionType.Export);
      txExplain.inputs[0].address.toLowerCase().should.equal(testData.cHexAddress.toLowerCase());
      // Output address is the sorted P-chain addresses joined with ~
      const sortedPAddresses = testData.pAddresses.slice().sort().join('~');
      txExplain.outputs[0].address.should.equal(sortedPAddresses);
      txExplain.outputAmount.should.equal(testData.amount);
      should.exist(txExplain.fee);
      txExplain.fee.fee.should.equal(testData.fee);
      txExplain.changeOutputs.should.be.empty();
    });

    it('should explain a signed export in C transaction', async function () {
      const testData = EXPORT_C_TEST_DATA;
      const txExplain = await tflrCoin.explainTransaction({
        txHex: testData.fullsigntxHex,
        crossChainType: 'export',
      });
      txExplain.type.should.equal(TransactionType.Export);
      txExplain.inputs[0].address.toLowerCase().should.equal(testData.cHexAddress.toLowerCase());
      // Output address is the sorted P-chain addresses joined with ~
      const sortedPAddresses = testData.pAddresses.slice().sort().join('~');
      txExplain.outputs[0].address.should.equal(sortedPAddresses);
      txExplain.outputAmount.should.equal(testData.amount);
      should.exist(txExplain.fee);
      txExplain.fee.fee.should.equal(testData.fee);
      txExplain.changeOutputs.should.be.empty();
    });

    it('should throw error when missing txHex', async function () {
      await tflrCoin
        .explainTransaction({ crossChainType: 'export' } as ExplainTransactionOptions)
        .should.be.rejectedWith('missing txHex in explain tx parameters');
    });

    it('should throw error when missing feeInfo for non-crossChain transaction', async function () {
      await tflrCoin
        .explainTransaction({ txHex: '0x123' } as ExplainTransactionOptions)
        .should.be.rejectedWith('missing feeInfo in explain tx parameters');
    });
  });

  describe('Transaction Verification', function () {
    it('should reject when client txParams are missing', async function () {
      const wallet = new Wallet(bitgo, tflrCoin, {});

      const txParams = null;

      const txPrebuild = {
        recipients: [{ amount: '1000000000000', address: '0x1374a2046661f914d1687d85dbbceb9ac7910a29' }],
        nextContractSequenceId: 0,
        gasPrice: 20000000000,
        gasLimit: 500000,
        isBatch: false,
        coin: 'tflr',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
      };

      const verification = {};

      await tflrCoin
        .verifyTransaction({ txParams: txParams as any, txPrebuild: txPrebuild as any, wallet, verification })
        .should.be.rejectedWith('missing params');
    });

    it('should reject txPrebuild that is both batch and hop', async function () {
      const wallet = new Wallet(bitgo, tflrCoin, {});

      const txParams = {
        recipients: [
          { amount: '1000000000000', address: '0x1374a2046661f914d1687d85dbbceb9ac7910a29' },
          { amount: '2500000000000', address: '0x7e85bdc27c050e3905ebf4b8e634d9ad6edd0de6' },
        ],
        wallet: wallet,
        walletPassphrase: 'fakeWalletPassphrase',
        hop: true,
      };

      const txPrebuild = {
        recipients: [{ amount: '3500000000000', address: '0x1374a2046661f914d1687d85dbbceb9ac7910a29' }],
        nextContractSequenceId: 0,
        gasPrice: 20000000000,
        gasLimit: 500000,
        isBatch: true,
        coin: 'tflr',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
        hopTransaction: {
          tx: '0x0',
          id: '0x0',
          signature: '0x0',
          paymentId: '0',
          gasPrice: 20000000000,
          gasLimit: 500000,
          amount: 1000000000000000,
          recipient: '0x1374a2046661f914d1687d85dbbceb9ac7910a29',
          nonce: 0,
          userReqSig: '0x0',
          gasPriceMax: 500000000000,
        },
      };

      const verification = {};

      await tflrCoin
        .verifyTransaction({ txParams, txPrebuild: txPrebuild as any, wallet, verification })
        .should.be.rejectedWith('tx cannot be both a batch and hop transaction');
    });

    it('should reject a txPrebuild with more than one recipient', async function () {
      const wallet = new Wallet(bitgo, tflrCoin, {});

      const txParams = {
        recipients: [
          { amount: '1000000000000', address: '0x1374a2046661f914d1687d85dbbceb9ac7910a29' },
          { amount: '2500000000000', address: '0x7e85bdc27c050e3905ebf4b8e634d9ad6edd0de6' },
        ],
        wallet: wallet,
        walletPassphrase: 'fakeWalletPassphrase',
      };

      const txPrebuild = {
        recipients: [
          { amount: '1000000000000', address: '0x1374a2046661f914d1687d85dbbceb9ac7910a29' },
          { amount: '2500000000000', address: '0x7e85bdc27c050e3905ebf4b8e634d9ad6edd0de6' },
        ],
        nextContractSequenceId: 0,
        gasPrice: 20000000000,
        gasLimit: 500000,
        isBatch: true,
        coin: 'tflr',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
      };

      const verification = {};

      await tflrCoin
        .verifyTransaction({ txParams, txPrebuild: txPrebuild as any, wallet, verification })
        .should.be.rejectedWith(
          `tflr doesn't support sending to more than 1 destination address within a single transaction. Try again, using only a single recipient.`
        );
    });

    it('should reject a txPrebuild from the bitgo server with the wrong coin', async function () {
      const wallet = new Wallet(bitgo, tflrCoin, {});

      const txParams = {
        recipients: [{ amount: '1000000000000', address: '0x1374a2046661f914d1687d85dbbceb9ac7910a29' }],
        wallet: wallet,
        walletPassphrase: 'fakeWalletPassphrase',
      };

      const txPrebuild = {
        recipients: [{ amount: '1000000000000', address: '0x1374a2046661f914d1687d85dbbceb9ac7910a29' }],
        nextContractSequenceId: 0,
        gasPrice: 20000000000,
        gasLimit: 500000,
        isBatch: false,
        coin: 'btc',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
      };

      const verification = {};

      await tflrCoin
        .verifyTransaction({ txParams, txPrebuild: txPrebuild as any, wallet, verification })
        .should.be.rejectedWith('coin in txPrebuild did not match that in txParams supplied by client');
    });

    describe('Hop export tx verify', () => {
      const wallet = new Wallet(bitgo, tflrCoin, {});
      const hopDestinationAddress =
        'P-costwo15msvr27szvhhpmah0c38gcml7vm29xjh7tcek8~P-costwo1cwrdtrgf4xh80ncu7palrjw7gn4mpj0n4dxghh~P-costwo1zt9n96hey4fsvnde35n3k4kt5pu7c784dzewzd';
      const hopAddress = '0x28A05933dC76e4e6c25f35D5c9b2A58769700E76';
      const importTxFee = 1e6;
      const amount = 49000000000000000;
      const txParams = {
        recipients: [{ amount, address: hopDestinationAddress }],
        wallet: wallet,
        walletPassphrase: 'fakeWalletPassphrase',
        hop: true,
        type: 'Export',
      };

      const txPrebuild = {
        recipients: [{ amount: '51000050000000000', address: hopAddress }],
        nextContractSequenceId: 0,
        gasPrice: 20000000000,
        gasLimit: 500000,
        isBatch: false,
        coin: 'tflr',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
        hopTransaction: {
          tx: hopExportTx,
          id: hopExportTxId,
          signature: hopExportTxBitgoSignature,
          paymentId: '4933349984',
          gasPrice: '50',
          gasLimit: 1,
          amount: '50000000',
          recipient: hopDestinationAddress,
          nonce: 0,
          userReqSig:
            '0x06fd0b1f8859a40d9fb2d1a65d54da5d645a1d81bbb8c1c5b037051843ec0d3c22433ec7f50cc97fa041cbf8d9ff5ddf7ed41f72a08fa3f1983fd651a33a4441',
          gasPriceMax: 7187500000,
          type: 'Export',
        },
      };

      const verification = {};
      const sandbox = sinon.createSandbox();

      before(() => {
        txPrebuild.hopTransaction.signature = hopExportTxBitgoSignature;
      });

      beforeEach(() => {
        sandbox.stub(tflrCoin as any, 'verifySignatureForAtomicTransaction').resolves(true);
      });

      afterEach(() => {
        sandbox.restore();
      });

      it('should verify successfully', async function () {
        const verifyFlrTransactionOptions = { txParams, txPrebuild, wallet, verification };
        const isTransactionVerified = await tflrCoin.verifyTransaction(verifyFlrTransactionOptions);
        isTransactionVerified.should.equal(true);
      });

      it('should fail verify for amount plus 1', async function () {
        const verifyFlrTransactionOptions = {
          txParams: { ...txParams, recipients: [{ amount: amount + 1e9, address: hopDestinationAddress }] },
          txPrebuild,
          wallet,
          verification,
        };

        await tflrCoin
          .verifyTransaction(verifyFlrTransactionOptions)
          .should.be.rejectedWith(
            `Hop amount: ${amount / 1e9 + importTxFee} does not equal original amount: ${
              amount / 1e9 + importTxFee + 1
            }`
          );
      });

      it('should fail verify for changed prebuild hop address', async function () {
        const verifyFlrTransactionOptions = {
          txParams,
          txPrebuild: { ...txPrebuild, recipients: [{ address: address2, amount: '51000050000000000' }] },
          wallet,
          verification,
        };
        await tflrCoin
          .verifyTransaction(verifyFlrTransactionOptions)
          .should.be.rejectedWith(`recipient address of txPrebuild does not match hop address`);
      });

      it('should fail verify for changed address', async function () {
        const hopDestinationAddressDiff =
          'P-costwo15msvr27szvhhpmah0c38gcml7vm29xjh7tcek9~P-costwo1cwrdtrgf4xh80ncu7palrjw7gn4mpj0n4dxghh~P-costwo1zt9n96hey4fsvnde35n3k4kt5pu7c784dzewzd';
        const verifyFlrTransactionOptions = {
          txParams: { ...txParams, recipients: [{ amount: amount, address: hopDestinationAddressDiff }] },
          txPrebuild,
          wallet,
          verification,
        };
        await tflrCoin
          .verifyTransaction(verifyFlrTransactionOptions)
          .should.be.rejectedWith(
            `Hop destination: ${hopDestinationAddress} does not equal original recipient: ${hopDestinationAddressDiff}`
          );
      });

      it('should verify if walletId is used instead of address', async function () {
        const verifyFlrTransactionOptions = {
          txParams: { ...txParams, recipients: [{ amount: amount, walletId: 'same wallet' }] },
          txPrebuild,
          wallet,
          verification,
        };
        const isTransactionVerified = await tflrCoin.verifyTransaction(verifyFlrTransactionOptions);
        isTransactionVerified.should.equal(true);
      });
    });
  });

  describe('validateHopPrebuild', function () {
    const validateHopSandbox = sinon.createSandbox();

    afterEach(() => {
      validateHopSandbox.restore();
    });

    it('should throw error for invalid HSM signature', async function () {
      const wallet = new Wallet(bitgo, tflrCoin, {});
      const hopPrebuild = {
        tx: hopExportTx,
        id: hopExportTxId,
        signature: '0x' + 'aa'.repeat(65), // Invalid signature
        paymentId: '12345',
        gasPrice: 20000000000,
        gasLimit: 500000,
        amount: 1000000000000000,
        recipient: EXPORT_C_TEST_DATA.pMultisigAddress,
        nonce: 0,
        userReqSig: '0x',
        gasPriceMax: 500000000000,
        type: 'Export' as const,
      };

      await (tflrCoin as any)
        .validateHopPrebuild(wallet, hopPrebuild)
        .should.be.rejectedWith('Hop txid signature invalid');
    });

    it('should validate Export hop prebuild successfully', async function () {
      validateHopSandbox.stub(tflrCoin as any, 'verifySignatureForAtomicTransaction').resolves(true);

      const wallet = new Wallet(bitgo, tflrCoin, {});
      const hopPrebuild = {
        tx: hopExportTx,
        id: hopExportTxId,
        signature: hopExportTxBitgoSignature,
        paymentId: '12345',
        gasPrice: 20000000000,
        gasLimit: 500000,
        amount: 50000000,
        recipient: EXPORT_C_TEST_DATA.pMultisigAddress,
        nonce: 0,
        userReqSig: '0x',
        gasPriceMax: 500000000000,
        type: 'Export' as const,
      };

      // Should not throw
      await (tflrCoin as any).validateHopPrebuild(wallet, hopPrebuild);
    });

    it('should throw error for Export hop prebuild with mismatched amount', async function () {
      const wallet = new Wallet(bitgo, tflrCoin, {});
      const hopPrebuild = {
        tx: hopExportTx,
        id: hopExportTxId,
        signature: hopExportTxBitgoSignature,
        paymentId: '12345',
        gasPrice: 20000000000,
        gasLimit: 500000,
        amount: 50000000,
        recipient: EXPORT_C_TEST_DATA.pMultisigAddress,
        nonce: 0,
        userReqSig: '0x',
        gasPriceMax: 500000000000,
        type: 'Export' as const,
      };

      const originalParams = {
        recipients: [
          {
            address: EXPORT_C_TEST_DATA.pMultisigAddress,
            amount: '999999999999999999', // Wrong amount
          },
        ],
      };

      await (tflrCoin as any)
        .validateHopPrebuild(wallet, hopPrebuild, originalParams)
        .should.be.rejectedWith(/Hop amount: .* does not equal original amount/);
    });

    it('should throw error for Export hop prebuild with mismatched destination', async function () {
      const wallet = new Wallet(bitgo, tflrCoin, {});
      const hopPrebuild = {
        tx: hopExportTx,
        id: hopExportTxId,
        signature: hopExportTxBitgoSignature,
        paymentId: '12345',
        gasPrice: 20000000000,
        gasLimit: 500000,
        amount: 50000000,
        recipient: EXPORT_C_TEST_DATA.pMultisigAddress,
        nonce: 0,
        userReqSig: '0x',
        gasPriceMax: 500000000000,
        type: 'Export' as const,
      };

      const originalParams = {
        recipients: [
          {
            address: 'P-costwo1different~P-costwo1address~P-costwo1here',
            amount: '49000000000000000',
          },
        ],
      };

      await (tflrCoin as any)
        .validateHopPrebuild(wallet, hopPrebuild, originalParams)
        .should.be.rejectedWith(/Hop destination: .* does not equal original recipient/);
    });
  });

  describe('presignTransaction', function () {
    it('should return params unchanged when no hopTransaction', async function () {
      const params = {
        txHex: '0x123',
        wallet: new Wallet(bitgo, tflrCoin, {}),
        buildParams: { recipients: [] },
      };

      const result = await tflrCoin.presignTransaction(params as any);
      result.should.equal(params);
    });

    it('should call validateHopPrebuild when hopTransaction is present', async function () {
      const sandbox = sinon.createSandbox();
      const validateStub = sandbox.stub(tflrCoin as any, 'validateHopPrebuild').resolves();

      const wallet = new Wallet(bitgo, tflrCoin, {});
      const hopTransaction = {
        tx: hopExportTx,
        id: hopExportTxId,
        signature: hopExportTxBitgoSignature,
        paymentId: '12345',
        gasPrice: 20000000000,
        gasLimit: 500000,
        amount: 50000000,
        recipient: EXPORT_C_TEST_DATA.pMultisigAddress,
        nonce: 0,
        userReqSig: '0x',
        gasPriceMax: 500000000000,
        type: 'Export' as const,
      };

      const params = {
        txHex: '0x123',
        wallet: wallet,
        buildParams: { recipients: [] },
        hopTransaction: hopTransaction,
      };

      await tflrCoin.presignTransaction(params as any);
      validateStub.calledOnce.should.be.true();
      sandbox.restore();
    });
  });

  describe('postProcessPrebuild', function () {
    it('should return params unchanged when no hopTransaction', async function () {
      const params = {
        txHex: '0x123',
        coin: 'tflr',
      };

      const result = await tflrCoin.postProcessPrebuild(params as any);
      result.should.equal(params);
    });

    it('should call validateHopPrebuild when hopTransaction is present', async function () {
      const sandbox = sinon.createSandbox();
      const validateStub = sandbox.stub(tflrCoin as any, 'validateHopPrebuild').resolves();

      const wallet = new Wallet(bitgo, tflrCoin, {});
      const hopTransaction = {
        tx: hopExportTx,
        id: hopExportTxId,
        signature: hopExportTxBitgoSignature,
        paymentId: '12345',
        gasPrice: 20000000000,
        gasLimit: 500000,
        amount: 50000000,
        recipient: EXPORT_C_TEST_DATA.pMultisigAddress,
        nonce: 0,
        userReqSig: '0x',
        gasPriceMax: 500000000000,
        type: 'Export' as const,
      };

      const params = {
        txHex: '0x123',
        wallet: wallet,
        buildParams: { recipients: [{ address: EXPORT_C_TEST_DATA.pMultisigAddress, amount: '100000000' }] },
        hopTransaction: hopTransaction,
        coin: 'tflr',
      };

      await tflrCoin.postProcessPrebuild(params as any);
      validateStub.calledOnce.should.be.true();
      sandbox.restore();
    });
  });

  describe('getExtraPrebuildParams', function () {
    const sandbox = sinon.createSandbox();

    afterEach(function () {
      sandbox.restore();
    });

    it('should return empty object when hop is not set', async function () {
      const buildParams = {
        recipients: [{ address: '0x1234', amount: '1000000' }],
      };

      const result = await tflrCoin.getExtraPrebuildParams(buildParams);
      result.should.deepEqual({});
    });

    it('should return empty object when hop is false', async function () {
      const buildParams = {
        hop: false,
        recipients: [{ address: '0x1234', amount: '1000000' }],
        wallet: new Wallet(bitgo, tflrCoin, {}),
      };

      const result = await tflrCoin.getExtraPrebuildParams(buildParams);
      result.should.deepEqual({});
    });

    it('should return empty object when wallet is missing', async function () {
      const buildParams = {
        hop: true,
        recipients: [{ address: '0x1234', amount: '1000000' }],
      };

      const result = await tflrCoin.getExtraPrebuildParams(buildParams);
      result.should.deepEqual({});
    });

    it('should return empty object when recipients is missing', async function () {
      const buildParams = {
        hop: true,
        wallet: new Wallet(bitgo, tflrCoin, {}),
      };

      const result = await tflrCoin.getExtraPrebuildParams(buildParams);
      result.should.deepEqual({});
    });

    it('should call createHopTransactionParams when hop is true with all required params', async function () {
      const mockFeeEstimate = {
        feeEstimate: 120000,
        gasLimitEstimate: 500000,
      };
      sandbox.stub(tflrCoin, 'feeEstimate').resolves(mockFeeEstimate);

      const buildParams = {
        hop: true,
        wallet: new Wallet(bitgo, tflrCoin, {}),
        recipients: [{ address: EXPORT_C_TEST_DATA.pMultisigAddress, amount: '100000000000000000' }],
        type: 'Export' as const,
      };

      const result = await tflrCoin.getExtraPrebuildParams(buildParams);
      result.should.have.property('hopParams');
    });
  });

  describe('feeEstimate', function () {
    it('should make API call with correct query parameters', async function () {
      const expectedFeeEstimate = {
        feeEstimate: 120000,
        gasLimitEstimate: 500000,
      };

      nock('https://app.bitgo-test.com')
        .get('/api/v2/tflr/tx/fee')
        .query({
          hop: true,
          recipient: '0x1234',
          amount: '1000000',
          type: 'Export',
        })
        .reply(200, expectedFeeEstimate);

      const result = await tflrCoin.feeEstimate({
        hop: true,
        recipient: '0x1234',
        amount: '1000000',
        type: 'Export',
      });

      result.feeEstimate.should.equal(expectedFeeEstimate.feeEstimate);
      result.gasLimitEstimate.should.equal(expectedFeeEstimate.gasLimitEstimate);
    });

    it('should make API call with data parameter', async function () {
      const expectedFeeEstimate = {
        feeEstimate: 150000,
        gasLimitEstimate: 600000,
      };

      nock('https://app.bitgo-test.com')
        .get('/api/v2/tflr/tx/fee')
        .query({
          recipient: '0x5678',
          data: '0xabcdef',
        })
        .reply(200, expectedFeeEstimate);

      const result = await tflrCoin.feeEstimate({
        recipient: '0x5678',
        data: '0xabcdef',
      });

      result.feeEstimate.should.equal(expectedFeeEstimate.feeEstimate);
      result.gasLimitEstimate.should.equal(expectedFeeEstimate.gasLimitEstimate);
    });
  });

  describe('getTxHash', function () {
    it('should calculate correct keccak256 hash for tx hex', function () {
      const txHex = EXPORT_C_TEST_DATA.fullsigntxHex;
      const hash = (tflrCoin.constructor as typeof Flr).getTxHash(txHex);

      hash.should.be.instanceOf(Buffer);
      hash.length.should.equal(32);

      // Verify it matches our helper function
      const expectedHash = getTxHash(txHex);
      hash.toString('hex').should.equal(expectedHash.toString('hex'));
    });

    it('should handle tx hex with 0x prefix', function () {
      const txHex = '0x' + 'abcd'.repeat(10);
      const hash = (tflrCoin.constructor as typeof Flr).getTxHash(txHex);

      hash.should.be.instanceOf(Buffer);
      hash.length.should.equal(32);
    });

    it('should handle tx hex without 0x prefix', function () {
      const txHex = 'abcd'.repeat(10);
      const hash = (tflrCoin.constructor as typeof Flr).getTxHash(txHex);

      hash.should.be.instanceOf(Buffer);
      hash.length.should.equal(32);
    });
  });
});

describe('Build Unsigned Sweep for Self-Custody Cold Wallets - (MPCv2)', function () {
  const bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
  const explorerUrl = common.Environments[bitgo.getEnv()].flrExplorerBaseUrl as string;
  const maxFeePerGasvalue = 30000000000;
  const maxPriorityFeePerGasValue = 15000000000;
  const chain_id = 114;
  const gasLimitvalue = 500000;

  it('should generate an unsigned sweep without derivation path', async () => {
    nock(explorerUrl)
      .get('/api')
      .twice()
      .query(mockDataUnsignedSweep.getTxListRequest)
      .reply(200, mockDataUnsignedSweep.getTxListResponse);
    nock(explorerUrl)
      .get('/api')
      .query(mockDataUnsignedSweep.getBalanceRequest)
      .reply(200, mockDataUnsignedSweep.getBalanceResponse);

    const baseCoin: any = bitgo.coin('tflr');
    const transaction = (await baseCoin.recover({
      userKey: mockDataUnsignedSweep.userKey,
      backupKey: mockDataUnsignedSweep.backupKey,
      walletContractAddress: mockDataUnsignedSweep.walletBaseAddress,
      recoveryDestination: mockDataUnsignedSweep.recoveryDestination,
      isTss: true,
      eip1559: { maxFeePerGas: maxFeePerGasvalue, maxPriorityFeePerGas: maxPriorityFeePerGasValue },
      gasLimit: gasLimitvalue,
      replayProtectionOptions: {
        chain: chain_id,
        hardfork: 'london',
      },
    })) as UnsignedSweepTxMPCv2;
    should.exist(transaction);
    transaction.should.have.property('txRequests');
    transaction.txRequests.length.should.equal(1);
    const txRequest = transaction.txRequests[0];
    txRequest.should.have.property('walletCoin');
    txRequest.walletCoin.should.equal('tflr');
    txRequest.should.have.property('transactions');
    txRequest.transactions.length.should.equal(1);
    const tx = txRequest.transactions[0];
    tx.should.have.property('nonce');
    tx.should.have.property('unsignedTx');
    tx.unsignedTx.should.have.property('serializedTxHex');
    tx.unsignedTx.should.have.property('signableHex');
    tx.unsignedTx.should.have.property('derivationPath');
    tx.unsignedTx.should.have.property('feeInfo');
    tx.unsignedTx.feeInfo?.should.have.property('fee');
    tx.unsignedTx.feeInfo?.should.have.property('feeString');
    tx.unsignedTx.should.have.property('parsedTx');
    tx.unsignedTx.parsedTx?.should.have.property('spendAmount');
    tx.unsignedTx.parsedTx?.should.have.property('outputs');
  });
});

describe('Non Bitgo Recovery for Hot Wallets', function () {
  const bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
  const explorerUrl = common.Environments[bitgo.getEnv()].flrExplorerBaseUrl as string;
  const maxFeePerGasvalue = 30000000000;
  const maxPriorityFeePerGasValue = 15000000000;
  const chain_id = 114;
  const gasLimitvalue = 500000;

  it('should generate a signed non-bitgo recovery tx', async () => {
    nock(explorerUrl)
      .get('/api')
      .twice()
      .query(mockDataNonBitGoRecovery.getTxListRequest)
      .reply(200, mockDataNonBitGoRecovery.getTxListResponse);
    nock(explorerUrl)
      .get('/api')
      .query(mockDataNonBitGoRecovery.getBalanceRequest)
      .reply(200, mockDataNonBitGoRecovery.getBalanceResponse);

    const baseCoin: any = bitgo.coin('tflr');
    const transaction = await baseCoin.recover({
      userKey: mockDataNonBitGoRecovery.userKeyData,
      backupKey: mockDataNonBitGoRecovery.backupKeyData,
      walletContractAddress: mockDataNonBitGoRecovery.walletRootAddress,
      walletPassphrase: mockDataNonBitGoRecovery.walletPassphrase,
      recoveryDestination: mockDataNonBitGoRecovery.recoveryDestination,
      isTss: true,
      eip1559: { maxFeePerGas: maxFeePerGasvalue, maxPriorityFeePerGas: maxPriorityFeePerGasValue },
      gasLimit: gasLimitvalue,
      replayProtectionOptions: {
        chain: chain_id,
        hardfork: 'london',
      },
    });
    should.exist(transaction);
    transaction.should.have.property('id');
    transaction.should.have.property('tx');
    const tx = FeeMarketEIP1559Transaction.fromSerializedTx(Buffer.from(stripHexPrefix(transaction.tx), 'hex'));
    tx.getSenderAddress().toString().should.equal(mockDataNonBitGoRecovery.walletRootAddress);
    const jsonTx = tx.toJSON();
    jsonTx.to?.should.equal(mockDataNonBitGoRecovery.recoveryDestination);
  });
});
