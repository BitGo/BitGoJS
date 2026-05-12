import sinon from 'sinon';
import should from 'should';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, CoinFamily } from '@bitgo/statics';
import { Tempo } from '../../src/tempo';
import { PATH_USD_ADDRESS } from '../../src/lib/constants';

// secp256k1 generator point G — a well-known valid compressed public key
const TEST_BACKUP_KEY = '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798';
const TEST_RECOVERY_DESTINATION = '0x80151ebf635e6ec8a5455258f617be6cda1fbd7e';

describe('Tempo Recovery', function () {
  let bitgo: TestBitGoAPI;
  let basecoin: Tempo;
  let sandbox: sinon.SinonSandbox;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('tempo', (b: BitGoBase) => {
      const mockStaticsCoin: Readonly<StaticsBaseCoin> = {
        name: 'tempo',
        fullName: 'Tempo',
        family: CoinFamily.TEMPO,
        network: { type: 'mainnet' },
        features: [],
      } as any;
      return Tempo.createInstance(b, mockStaticsCoin);
    });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tempo') as Tempo;
  });

  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('queryTempoRpc (via recoveryBlockchainExplorerQuery)', function () {
    function mockFetch(responseBody: Record<string, unknown>): sinon.SinonStub {
      return sandbox.stub(global, 'fetch' as any).resolves({
        ok: true,
        json: async () => responseBody,
      } as any);
    }

    it('returns { result: "0" } for account/balance without calling RPC', async function () {
      const fetchStub = mockFetch({});
      const result = await basecoin.recoveryBlockchainExplorerQuery({
        module: 'account',
        action: 'balance',
        address: '0xabc',
      });
      result.should.deepEqual({ result: '0' });
      fetchStub.called.should.equal(false);
    });

    it('calls eth_call with balanceOf selector for account/tokenbalance', async function () {
      const fetchStub = mockFetch({ result: '0x4e20' }); // 20000 decimal
      const result = await basecoin.recoveryBlockchainExplorerQuery({
        module: 'account',
        action: 'tokenbalance',
        address: '0x1234567890123456789012345678901234567890',
        contractaddress: PATH_USD_ADDRESS,
        tag: 'latest',
      });
      result.should.deepEqual({ result: '20000' });
      const body = JSON.parse(fetchStub.firstCall.args[1].body);
      body.method.should.equal('eth_call');
      body.params[0].data.should.startWith('0x70a08231');
    });

    it('calls eth_getTransactionCount for account/txlist and parses nonce', async function () {
      mockFetch({ result: '0x5' });
      const result = await basecoin.recoveryBlockchainExplorerQuery({
        module: 'account',
        action: 'txlist',
        address: '0xabc',
      });
      result.should.deepEqual({ nonce: 5 });
    });

    it('returns { result: "0" } when RPC returns null body.result', async function () {
      mockFetch({ result: null });
      const result = await basecoin.recoveryBlockchainExplorerQuery({
        module: 'account',
        action: 'tokenbalance',
        address: '0xabc',
        contractaddress: PATH_USD_ADDRESS,
      });
      result.should.deepEqual({ result: '0' });
    });

    it('returns { result: "0" } when RPC returns malformed body.result', async function () {
      mockFetch({ result: 'not-a-number' });
      const result = await basecoin.recoveryBlockchainExplorerQuery({
        module: 'account',
        action: 'tokenbalance',
        address: '0xabc',
        contractaddress: PATH_USD_ADDRESS,
      });
      result.should.deepEqual({ result: '0' });
    });

    it('throws when the RPC returns an error field', async function () {
      mockFetch({ error: { message: 'execution reverted' } });
      await basecoin
        .recoveryBlockchainExplorerQuery({
          module: 'account',
          action: 'tokenbalance',
          address: '0xabc',
          contractaddress: PATH_USD_ADDRESS,
        })
        .should.be.rejectedWith('Tempo RPC error: execution reverted');
    });

    it('throws for unsupported module/action', async function () {
      await basecoin
        .recoveryBlockchainExplorerQuery({ module: 'proxy', action: 'eth_blockNumber' })
        .should.be.rejectedWith('queryTempoRpc: unsupported module=proxy action=eth_blockNumber');
    });
  });

  describe('buildUnsignedSweepTxnTSS — gas margin calculation', function () {
    function stubBalanceAndNonce(balance: string, nonce = 0) {
      sandbox.stub(basecoin as any, 'queryAddressTokenBalance').resolves(balance);
      sandbox.stub(basecoin as any, 'getAddressNonce').resolves(nonce);
    }

    it('deducts gasLimit × maxFeePerGas / 10^12 from pathUSD balance', async function () {
      // gasMargin = 1_000_000 * 20_000_000_000 / 10^12 = 20_000
      // sweepAmount = 1_000_000 - 20_000 = 980_000
      stubBalanceAndNonce('1000000');
      const result = (await (basecoin as any).buildUnsignedSweepTxnTSS({
        backupKey: TEST_BACKUP_KEY,
        recoveryDestination: TEST_RECOVERY_DESTINATION,
        gasLimit: 1_000_000,
        eip1559: { maxFeePerGas: 20_000_000_000, maxPriorityFeePerGas: 10_000_000_000 },
      })) as any;
      should.exist(result.txRequests);
      result.txRequests[0].transactions[0].unsignedTx.should.have.property('serializedTxHex');
    });

    it('uses smaller margin when gasLimit is halved', async function () {
      // gasMargin = 500_000 * 20_000_000_000 / 10^12 = 10_000
      // sweepAmount = 15_000 - 10_000 = 5_000
      stubBalanceAndNonce('15000');
      const result = (await (basecoin as any).buildUnsignedSweepTxnTSS({
        backupKey: TEST_BACKUP_KEY,
        recoveryDestination: TEST_RECOVERY_DESTINATION,
        gasLimit: 500_000,
        eip1559: { maxFeePerGas: 20_000_000_000, maxPriorityFeePerGas: 10_000_000_000 },
      })) as any;
      should.exist(result.txRequests);
    });

    it('throws when balance exactly equals the gas margin', async function () {
      // gasMargin = 1_000_000 * 20_000_000_000 / 10^12 = 20_000; balance = 20_000 → sweepAmount = 0
      stubBalanceAndNonce('20000');
      await (basecoin as any)
        .buildUnsignedSweepTxnTSS({
          backupKey: TEST_BACKUP_KEY,
          recoveryDestination: TEST_RECOVERY_DESTINATION,
          gasLimit: 1_000_000,
          eip1559: { maxFeePerGas: 20_000_000_000, maxPriorityFeePerGas: 10_000_000_000 },
        })
        .should.be.rejectedWith(/Insufficient balance/);
    });

    it('does not deduct margin when sweeping a non-pathUSD token', async function () {
      const otherToken = '0x1111111111111111111111111111111111111111';
      stubBalanceAndNonce('500');
      const result = (await (basecoin as any).buildUnsignedSweepTxnTSS({
        backupKey: TEST_BACKUP_KEY,
        recoveryDestination: TEST_RECOVERY_DESTINATION,
        tokenContractAddress: otherToken,
        gasLimit: 1_000_000,
        eip1559: { maxFeePerGas: 20_000_000_000, maxPriorityFeePerGas: 10_000_000_000 },
      })) as any;
      // Full balance of 500 swept; no margin deducted
      should.exist(result.txRequests);
    });

    it('returns correct UnsignedSweepTxMPCv2 structure', async function () {
      stubBalanceAndNonce('1000000');
      const result = (await (basecoin as any).buildUnsignedSweepTxnTSS({
        backupKey: TEST_BACKUP_KEY,
        recoveryDestination: TEST_RECOVERY_DESTINATION,
        gasLimit: 1_000_000,
        eip1559: { maxFeePerGas: 20_000_000_000, maxPriorityFeePerGas: 10_000_000_000 },
      })) as any;
      const tx = result.txRequests[0].transactions[0];
      tx.unsignedTx.derivationPath.should.equal('m/0');
      tx.unsignedTx.coinSpecific.commonKeyChain.should.equal(TEST_BACKUP_KEY);
      tx.signatureShares.should.deepEqual([]);
      tx.nonce.should.equal(0);
    });
  });

  describe('recoverTSS — unsigned sweep dispatch', function () {
    it('routes to buildUnsignedSweepTxnTSS when keys are plain public keys', async function () {
      const buildStub = sandbox.stub(basecoin as any, 'buildUnsignedSweepTxnTSS').resolves({ txRequests: [] });
      sandbox.stub(basecoin as any, 'validateRecoveryParams').returns(undefined);

      await (basecoin as any).recoverTSS({
        userKey: TEST_BACKUP_KEY,
        backupKey: TEST_BACKUP_KEY,
        isTss: true,
        recoveryDestination: TEST_RECOVERY_DESTINATION,
      });

      buildStub.calledOnce.should.equal(true);
    });
  });
});
