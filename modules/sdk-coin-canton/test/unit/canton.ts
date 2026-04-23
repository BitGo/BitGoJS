import 'should';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { coins } from '@bitgo/statics';

import { Canton, Tcanton, TransactionBuilderFactory } from '../../src';
import {
  CantonTokenPreApprovalPrepareResponse,
  OneStepEnablement,
  OneStepPreApprovalPrepareResponse,
} from '../resources';

/**
 * Builds a base64-encoded raw transaction for a OneStepPreApproval (enable token flow).
 * For TSS wallets (which Canton always is), verifyTransaction receives txParams.enableTokens,
 * not txParams.recipients. The wallet SDK's buildTokenEnablements passes enableTokens through
 * unchanged for TSS wallets rather than converting them to recipients.
 */
function buildOneStepPreApprovalRawTx(
  prepareResponse: typeof OneStepPreApprovalPrepareResponse,
  commandId: string
): string {
  const data = {
    prepareCommandResponse: prepareResponse,
    txType: 'OneStepPreApproval',
    preparedTransaction: '',
    partySignatures: { signatures: [] },
    deduplicationPeriod: { Empty: {} },
    submissionId: commandId,
    hashingSchemeVersion: 'HASHING_SCHEME_VERSION_V2',
    minLedgerTime: { time: { Empty: {} } },
  };
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

/** Returns a mock wallet whose coinSpecific().rootAddress matches the given party ID. */
function walletWithRootAddress(rootAddress: string): any {
  return { coinSpecific: () => ({ rootAddress }) };
}

describe('Canton verifyTransaction:', function () {
  let bitgo: TestBitGoAPI;
  let basecoin: Canton;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('canton', Canton.createInstance);
    bitgo.safeRegister('tcanton', Tcanton.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tcanton') as Canton;
  });

  describe('OneStepPreApproval (enable token flow):', function () {
    it('should return true when txParams has no type (non-enabletoken flow)', async function () {
      const txHex = buildOneStepPreApprovalRawTx(OneStepPreApprovalPrepareResponse, OneStepEnablement.commandId);
      const result = await basecoin.verifyTransaction({
        txPrebuild: { txHex },
        txParams: {},
        wallet: {} as any,
      });
      result.should.equal(true);
    });

    it('should return true when enableTokens is absent', async function () {
      const txHex = buildOneStepPreApprovalRawTx(OneStepPreApprovalPrepareResponse, OneStepEnablement.commandId);
      const result = await basecoin.verifyTransaction({
        txPrebuild: { txHex },
        txParams: { type: 'enabletoken' },
        wallet: {} as any,
      });
      result.should.equal(true);
    });

    it('should return true when enableTokens is empty', async function () {
      const txHex = buildOneStepPreApprovalRawTx(OneStepPreApprovalPrepareResponse, OneStepEnablement.commandId);
      const result = await basecoin.verifyTransaction({
        txPrebuild: { txHex },
        txParams: { type: 'enabletoken', enableTokens: [] },
        wallet: {} as any,
      });
      result.should.equal(true);
    });

    describe('coin pre-approval (TransferPreapprovalProposal):', function () {
      let txHex: string;
      let receiver: string;

      before(function () {
        txHex = buildOneStepPreApprovalRawTx(OneStepPreApprovalPrepareResponse, OneStepEnablement.commandId);
        // Dynamically derive receiver from parsed transaction to avoid hardcoding protobuf-decoded addresses
        const txBuilder = new TransactionBuilderFactory(coins.get('tcanton')).from(txHex);
        receiver = (txBuilder.transaction as any).toJson().receiver as string;
      });

      it('should return true when wallet has no coinSpecific (receiver check skipped)', async function () {
        // Typical case: wallet mock has no coinSpecific() method, and no address in enableTokens
        const result = await basecoin.verifyTransaction({
          txPrebuild: { txHex },
          txParams: {
            type: 'enabletoken',
            enableTokens: [{ name: 'canton' }],
          },
          wallet: {} as any,
        });
        result.should.equal(true);
      });

      it('should return true when wallet rootAddress matches receiver', async function () {
        // Typical UI flow: enableTokens has no address, receiver validated from wallet.coinSpecific().rootAddress
        const result = await basecoin.verifyTransaction({
          txPrebuild: { txHex },
          txParams: {
            type: 'enabletoken',
            enableTokens: [{ name: 'canton' }],
          },
          wallet: walletWithRootAddress(receiver),
        });
        result.should.equal(true);
      });

      it('should return true when enableToken.address matches receiver (explicit address)', async function () {
        const result = await basecoin.verifyTransaction({
          txPrebuild: { txHex },
          txParams: {
            type: 'enabletoken',
            enableTokens: [{ name: 'canton', address: receiver }],
          },
          wallet: {} as any,
        });
        result.should.equal(true);
      });

      it('should throw when wallet rootAddress does not match receiver', async function () {
        const wrongAddress = 'wrong-party::1220aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
        await basecoin
          .verifyTransaction({
            txPrebuild: { txHex },
            txParams: {
              type: 'enabletoken',
              enableTokens: [{ name: 'canton' }],
            },
            wallet: walletWithRootAddress(wrongAddress),
          })
          .should.be.rejectedWith(/OneStepPreApproval receiver mismatch/);
      });

      it('should throw when explicit enableToken.address does not match receiver', async function () {
        const wrongAddress = 'wrong-party::1220aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
        await basecoin
          .verifyTransaction({
            txPrebuild: { txHex },
            txParams: {
              type: 'enabletoken',
              enableTokens: [{ name: 'canton', address: wrongAddress }],
            },
            wallet: {} as any,
          })
          .should.be.rejectedWith(/OneStepPreApproval receiver mismatch/);
      });
    });

    describe('token pre-approval (TransferPreapproval):', function () {
      let txHex: string;
      let receiver: string;

      before(function () {
        const commandId = '7d99789d-2f22-49e1-85cb-79d2ce5a69c1';
        txHex = buildOneStepPreApprovalRawTx(CantonTokenPreApprovalPrepareResponse, commandId);
        const txBuilder = new TransactionBuilderFactory(coins.get('tcanton')).from(txHex);
        receiver = (txBuilder.transaction as any).toJson().receiver as string;
      });

      it('should return true when wallet rootAddress matches receiver', async function () {
        const result = await basecoin.verifyTransaction({
          txPrebuild: { txHex },
          txParams: {
            type: 'enabletoken',
            enableTokens: [{ name: 'tcanton:testcoin1' }],
          },
          wallet: walletWithRootAddress(receiver),
        });
        result.should.equal(true);
      });

      it('should return true when enableToken.address matches receiver (explicit address)', async function () {
        const result = await basecoin.verifyTransaction({
          txPrebuild: { txHex },
          txParams: {
            type: 'enabletoken',
            enableTokens: [{ name: 'tcanton:testcoin1', address: receiver }],
          },
          wallet: {} as any,
        });
        result.should.equal(true);
      });

      it('should throw when wallet rootAddress does not match receiver', async function () {
        const wrongAddress = 'wrong-party::1220bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
        await basecoin
          .verifyTransaction({
            txPrebuild: { txHex },
            txParams: {
              type: 'enabletoken',
              enableTokens: [{ name: 'tcanton:testcoin1' }],
            },
            wallet: walletWithRootAddress(wrongAddress),
          })
          .should.be.rejectedWith(/OneStepPreApproval receiver mismatch/);
      });

      it('should throw when explicit enableToken.address does not match receiver', async function () {
        const wrongAddress = 'wrong-party::1220bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
        await basecoin
          .verifyTransaction({
            txPrebuild: { txHex },
            txParams: {
              type: 'enabletoken',
              enableTokens: [{ name: 'tcanton:testcoin1', address: wrongAddress }],
            },
            wallet: {} as any,
          })
          .should.be.rejectedWith(/OneStepPreApproval receiver mismatch/);
      });
    });
  });
});
