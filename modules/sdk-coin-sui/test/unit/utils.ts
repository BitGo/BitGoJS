import assert from 'assert/strict';
import should from 'should';
import * as testData from '../resources/sui';
import utils from '../../src/lib/utils';
import { SuiGrpcClient, SuiGrpcCoreClient } from '../../src/lib/grpcClient';
import { RecoveryProviderError } from '@bitgo/sdk-core';
import sinon from 'sinon';
import BigNumber from 'bignumber.js';
import { Buffer } from 'buffer';

// The utils node-call helpers take a SuiGrpcCoreClient as their first argument.
// Tests build a partial fake client whose methods are sinon stubs; only the
// methods a given helper uses are stubbed, so a missing method surfaces as an
// assertion failure instead of a silent pass.
function fakeGrpcClient(stubNames: Array<keyof SuiGrpcCoreClient>): SuiGrpcClient {
  const core: Record<string, sinon.SinonStub> = {};
  for (const name of stubNames) {
    core[name] = sinon.stub();
  }
  return { core } as unknown as SuiGrpcClient;
}

describe('Sui util library', function () {
  describe('isValidAddress', function () {
    it('should succeed to validate valid address', function () {
      for (const address of testData.addresses.validAddresses) {
        should.equal(utils.isValidAddress(address), true);
      }
    });
    it('should fail to validate invalid addresses', function () {
      for (const address of testData.addresses.invalidAddresses) {
        should.doesNotThrow(() => utils.isValidAddress(address));
        should.equal(utils.isValidAddress(address), false);
      }
      // @ts-expect-error Testing for missing param, should not throw an error
      should.doesNotThrow(() => utils.isValidAddress(undefined));
      // @ts-expect-error Testing for missing param, should return false
      should.equal(utils.isValidAddress(undefined), false);
    });
  });

  describe('isValidRawTransaction', function () {
    it('should succeed to validate a valid raw transaction', function () {
      should.equal(utils.isValidRawTransaction(testData.TRANSFER), true);
    });

    it('should fail to validate an invalid raw transaction', function () {
      should.doesNotThrow(() => utils.isValidRawTransaction(testData.INVALID_RAW_TX));
      should.equal(utils.isValidRawTransaction(testData.INVALID_RAW_TX), false);
    });
  });

  describe('normalizeHexId', function () {
    it('should succeed to normalize hexId with no prefix', function () {
      const hexId = 'cba4a48bb0f8b586c167e5dcefaa1c5e96ab3f08';
      const expectedNormalized = '0xcba4a48bb0f8b586c167e5dcefaa1c5e96ab3f08';
      should.equal(utils.normalizeHexId(hexId), expectedNormalized);
    });
    it('should return the hexId with prefix already', function () {
      const hexId = '0xcba4a48bb0f8b586c167e5dcefaa1c5e96ab3f08';
      should.equal(utils.normalizeHexId(hexId), hexId);
    });
  });

  describe('getBalance', function () {
    const owner = '[SECRET:ethereum-private-key]';
    let client: SuiGrpcClient;
    let getBalanceStub: sinon.SinonStub;

    beforeEach(function () {
      client = fakeGrpcClient(['getBalance']);
      getBalanceStub = client.core.getBalance as unknown as sinon.SinonStub;
    });

    it('should return all funds in address balance when fundsInAddressBalance equals totalBalance', async function () {
      // Real response from testnet: all 2 SUI held in address balance, not in coin objects.
      // The gRPC balance service reports coin and address balances separately, so the
      // legacy suix_getBalance totalBalance maps to coinBalance + addressBalance.
      getBalanceStub.resolves({
        balance: { coinBalance: '0', addressBalance: '2000000' },
      });

      const balanceInfo = await utils.getBalance(client, owner);
      balanceInfo.totalBalance.should.equal('2000000');
      balanceInfo.fundsInAddressBalance.should.equal('2000000');
      balanceInfo.coinObjectBalance.should.equal('0');
    });

    it('should correctly split totalBalance into coinObjectBalance and fundsInAddressBalance', async function () {
      getBalanceStub.resolves({
        balance: { coinBalance: '1000000000', addressBalance: '900000000' },
      });

      const balanceInfo = await utils.getBalance(client, owner);
      balanceInfo.totalBalance.should.equal('1900000000');
      balanceInfo.fundsInAddressBalance.should.equal('900000000');
      balanceInfo.coinObjectBalance.should.equal('1000000000');
    });

    it('should handle legacy response without fundsInAddressBalance (all funds in coin objects)', async function () {
      getBalanceStub.resolves({
        balance: { coinBalance: '1900000000', addressBalance: '0' },
      });

      const balanceInfo = await utils.getBalance(client, owner);
      balanceInfo.totalBalance.should.equal('1900000000');
      balanceInfo.fundsInAddressBalance.should.equal('0');
      balanceInfo.coinObjectBalance.should.equal('1900000000');
    });

    it('should throw when the gRPC response carries no balance object', async function () {
      // a missing balance object must not be read as "no funds" by sweep flows
      getBalanceStub.resolves({});

      await utils
        .getBalance(client, owner)
        .should.be.rejectedWith('Failed to get balance: no balance object in gRPC response for ' + owner);
    });

    it('should return zero balances for an empty account', async function () {
      getBalanceStub.resolves({
        balance: { coinBalance: '0', addressBalance: '0' },
      });

      const balanceInfo = await utils.getBalance(client, owner);
      balanceInfo.totalBalance.should.equal('0');
      balanceInfo.fundsInAddressBalance.should.equal('0');
      balanceInfo.coinObjectBalance.should.equal('0');
    });

    it('should query with a custom coin type', async function () {
      const packageId = '[SECRET:ethereum-private-key]';
      const coinType = `${packageId}::deep::DEEP`;

      getBalanceStub.resolves({
        balance: { coinBalance: '1000', addressBalance: '0' },
      });

      const balanceInfo = await utils.getBalance(client, owner, coinType);
      balanceInfo.totalBalance.should.equal('1000');
      balanceInfo.fundsInAddressBalance.should.equal('0');
      balanceInfo.coinObjectBalance.should.equal('1000');
      // the requested coin type must be forwarded to the node call
      sinon.assert.calledWith(getBalanceStub, { owner, coinType });
    });
  });

  describe('getFeeEstimate', function () {
    const txHex =
      'AAACAAgA0klrAAAAAAAgAOTqpqKR/gKRhFLmRbVlPNJgpfwPs19hk9WAkWqp44kCAgABAQAAAQECAAABAQCR8l4je4OgCmJyT9xKgeQ/SU3GtBoSQUkoJtNuTRMdowHAXHZeJuauhMePokXziiP7IEBqXPP2G1e9MjoN+dmAA8MAAAAAAAAAIFvJiJBdEAhi14cxcSr/HUIhBZMbLMd4rczUTCMIb3UmkfJeI3uDoApick/cSoHkP0lNxrQaEkFJKCbTbk0THaPoAwAAAAAAAADh9QUAAAAAAA==';
    let client: SuiGrpcClient;
    let simulateTransactionStub: sinon.SinonStub;

    beforeEach(function () {
      client = fakeGrpcClient(['simulateTransaction']);
      simulateTransactionStub = client.core.simulateTransaction as unknown as sinon.SinonStub;
    });

    it('should return the net gas cost when simulation succeeds', async function () {
      // fee = max(computation + storage - rebate, computation); here the net cost dominates
      simulateTransactionStub.resolves({
        $kind: 'Transaction',
        Transaction: {
          effects: {
            status: { success: true },
            gasUsed: { computationCost: '1000', storageCost: '2000', storageRebate: '500' },
          },
        },
      });

      const fee = await utils.getFeeEstimate(client, txHex);
      fee.toString().should.equal('2500');
      sinon.assert.calledWith(simulateTransactionStub, {
        transaction: Buffer.from(txHex, 'base64'),
        // dry-run parity: full checks, unlike the devInspect-style unchecked mode
        checksEnabled: true,
        include: { effects: true },
      });
    });

    it('should return the computation cost when the rebate exceeds the net cost', async function () {
      // net cost would go negative; the fee must never fall below the computation cost
      simulateTransactionStub.resolves({
        $kind: 'Transaction',
        Transaction: {
          effects: {
            status: { success: true },
            gasUsed: { computationCost: '100', storageCost: '0', storageRebate: '500' },
          },
        },
      });

      const fee = await utils.getFeeEstimate(client, txHex);
      fee.toString().should.equal('100');
    });

    it('should throw when the simulated transaction fails', async function () {
      simulateTransactionStub.resolves({
        $kind: 'Transaction',
        Transaction: {
          effects: {
            status: { success: false },
            gasUsed: { computationCost: '1000', storageCost: '0', storageRebate: '0' },
          },
        },
      });

      await utils.getFeeEstimate(client, txHex).should.be.rejectedWith('Failed to get fee estimate');
    });

    it('should throw when a gas field is missing from the simulation response', async function () {
      // a missing proto field must not silently become a '0' fee
      simulateTransactionStub.resolves({
        $kind: 'Transaction',
        Transaction: {
          effects: {
            status: { success: true },
            gasUsed: { computationCost: '1000', storageCost: '2000' },
          },
        },
      });

      await utils
        .getFeeEstimate(client, txHex)
        .should.be.rejectedWith('Failed to get fee estimate: missing storageRebate in simulation response');
    });

    it('should throw when the simulation response carries no gas summary', async function () {
      simulateTransactionStub.resolves({ $kind: 'FailedTransaction', FailedTransaction: { digest: 'abc' } });

      await utils
        .getFeeEstimate(client, txHex)
        .should.be.rejectedWith('Failed to get fee estimate: no gas summary in simulation response');
    });
  });

  describe('getChainContext', function () {
    let client: SuiGrpcClient;
    let getCurrentSystemStateStub: sinon.SinonStub;
    let getChainIdentifierStub: sinon.SinonStub;

    beforeEach(function () {
      client = fakeGrpcClient(['getCurrentSystemState', 'getChainIdentifier']);
      getCurrentSystemStateStub = client.core.getCurrentSystemState as unknown as sinon.SinonStub;
      getChainIdentifierStub = client.core.getChainIdentifier as unknown as sinon.SinonStub;
    });

    it('should return the current epoch and chain identifier', async function () {
      // epoch is reported as a string by the gRPC system state service; it must be
      // surfaced as a number, and the chain identifier is the genesis checkpoint digest
      getCurrentSystemStateStub.resolves({ systemState: { epoch: '123' } });
      getChainIdentifierStub.resolves({ chainIdentifier: '3ZsdHzC9Bg3tqGvh7LearnGVCgmmBftWbnsPQGD7PrjP' });

      const context = await utils.getChainContext(client);
      context.should.deepEqual({ epoch: 123, chainId: '3ZsdHzC9Bg3tqGvh7LearnGVCgmmBftWbnsPQGD7PrjP' });
    });

    it('should throw when the system state has no epoch', async function () {
      getCurrentSystemStateStub.resolves({ systemState: {} });
      getChainIdentifierStub.resolves({ chainIdentifier: '3ZsdHzC9Bg3tqGvh7LearnGVCgmmBftWbnsPQGD7PrjP' });

      await utils.getChainContext(client).should.be.rejectedWith('Failed to get current epoch from gRPC system state');
    });

    it('should throw when the chain identifier is missing', async function () {
      getCurrentSystemStateStub.resolves({ systemState: { epoch: '123' } });
      getChainIdentifierStub.resolves({});

      await utils
        .getChainContext(client)
        .should.be.rejectedWith('Failed to get chain identifier from gRPC service info');
    });
  });

  describe('getInputCoins', function () {
    const owner = '[SECRET:ethereum-private-key]';
    let client: SuiGrpcClient;
    let listCoinsStub: sinon.SinonStub;

    beforeEach(function () {
      client = fakeGrpcClient(['listCoins']);
      listCoinsStub = client.core.listCoins as unknown as sinon.SinonStub;
    });

    it('should aggregate paginated coin lists and default the coin type to SUI', async function () {
      // two pages: the helper must follow the cursor until hasNextPage is false
      const page1 = {
        objects: [{ objectId: '0x1', version: '1', digest: 'd1', balance: '100' }],
        hasNextPage: true,
        cursor: 'cursor1',
      };
      const page2 = {
        objects: [{ objectId: '0x2', version: '2', digest: 'd2', balance: '200' }],
        hasNextPage: false,
        cursor: null,
      };
      listCoinsStub.onFirstCall().resolves(page1);
      listCoinsStub.onSecondCall().resolves(page2);

      const coins = await utils.getInputCoins(client, owner);
      coins.should.deepEqual([
        { coinType: '0x2::sui::SUI', objectId: '0x1', version: '1', digest: 'd1', balance: new BigNumber('100') },
        { coinType: '0x2::sui::SUI', objectId: '0x2', version: '2', digest: 'd2', balance: new BigNumber('200') },
      ]);
      // first call has no cursor, second call resumes from the first page's cursor
      sinon.assert.calledWith(listCoinsStub.firstCall, { owner, coinType: '0x2::sui::SUI', cursor: null });
      sinon.assert.calledWith(listCoinsStub.secondCall, { owner, coinType: '0x2::sui::SUI', cursor: 'cursor1' });
    });

    it('should query with a custom coin type', async function () {
      const coinType = '0xabc::deep::DEEP';
      listCoinsStub.resolves({
        objects: [{ objectId: '0x3', version: '3', digest: 'd3', balance: '50' }],
        hasNextPage: false,
        cursor: null,
      });

      const coins = await utils.getInputCoins(client, owner, coinType);
      coins.should.deepEqual([{ coinType, objectId: '0x3', version: '3', digest: 'd3', balance: new BigNumber('50') }]);
      sinon.assert.calledWith(listCoinsStub, { owner, coinType, cursor: null });
    });

    it('should wrap node errors in a RecoveryProviderError', async function () {
      listCoinsStub.rejects(new Error('connection refused'));

      const err: Error = await utils.getInputCoins(client, owner).should.be.rejected();
      err.should.be.instanceof(RecoveryProviderError);
      err.message.should.equal('Failed to get input coins from the node.');
    });
  });

  describe('executeTransactionBlock', function () {
    const serializedTx = 'AAACAAgA0klrAAAAAAAgAOTqpqKR/gKRhFLmRbVlPNJgpfwPs19hk9WAkWqp44kCAgABAQAAAQECAAABAQ==';
    const signatures = ['MEUCIQ=='];
    let client: SuiGrpcClient;
    let executeTransactionStub: sinon.SinonStub;

    beforeEach(function () {
      client = fakeGrpcClient(['executeTransaction']);
      executeTransactionStub = client.core.executeTransaction as unknown as sinon.SinonStub;
    });

    it('should return the digest of a successfully executed transaction', async function () {
      executeTransactionStub.resolves({ $kind: 'Transaction', Transaction: { digest: 'digest1' } });

      const digest = await utils.executeTransactionBlock(client, serializedTx, signatures);
      digest.should.equal('digest1');
      sinon.assert.calledWith(executeTransactionStub, {
        transaction: Buffer.from(serializedTx, 'base64'),
        signatures,
      });
    });

    it('should return the digest of a failed transaction execution', async function () {
      // a node-level execution failure still produces a digest that callers must surface
      executeTransactionStub.resolves({ $kind: 'FailedTransaction', FailedTransaction: { digest: 'digest2' } });

      const digest = await utils.executeTransactionBlock(client, serializedTx, signatures);
      digest.should.equal('digest2');
    });

    it('should throw when the response carries no digest', async function () {
      executeTransactionStub.resolves({ $kind: 'Transaction' });

      await utils
        .executeTransactionBlock(client, serializedTx, signatures)
        .should.be.rejectedWith('Failed to broadcast transaction, no digest in response');
    });

    it('should propagate transport errors', async function () {
      executeTransactionStub.rejects(new Error('transport error'));

      await utils.executeTransactionBlock(client, serializedTx, signatures).should.be.rejectedWith('transport error');
    });
  });
  describe('legacy url signature — backwards compatibility', function () {
    // Pre-migration callers passed a node URL as the first argument. The gRPC
    // migration must keep that signature working: a URL constructs a client
    // on the fly (network inferred from the URL), preserving the old call
    // shape without a major-version break.
    const urlOwner = '0x' + 'ab'.repeat(32);
    const urlTxHex = 'dHhCeXRlcw==';

    afterEach(function () {
      utils.__setUrlClientFactoryForTest(undefined);
    });

    it('getBalance(url, owner) constructs a testnet client and serves the balance', async function () {
      const urlClient = fakeGrpcClient(['getBalance']);
      let factoryArgs: Array<string | 'mainnet' | 'testnet'> = [];
      utils.__setUrlClientFactoryForTest(async (u, network) => {
        factoryArgs = [u, network];
        return urlClient;
      });
      (urlClient.core.getBalance as unknown as sinon.SinonStub).resolves({
        balance: { balance: '5', coinType: '0x2::sui::SUI', coinBalance: '10', addressBalance: '2' },
      });

      const balanceInfo = await utils.getBalance('fullnode.testnet.sui.io:443', urlOwner);

      balanceInfo.totalBalance.should.equal('12');
      factoryArgs.should.deepEqual(['fullnode.testnet.sui.io:443', 'testnet']);
      sinon.assert.calledWith(urlClient.core.getBalance as unknown as sinon.SinonStub, {
        owner: urlOwner,
        coinType: '0x2::sui::SUI',
      });
    });

    it('getFeeEstimate(url, txHex) constructs a mainnet client for mainnet urls', async function () {
      const urlClient = fakeGrpcClient(['simulateTransaction']);
      let factoryArgs: Array<string | 'mainnet' | 'testnet'> = [];
      utils.__setUrlClientFactoryForTest(async (u, network) => {
        factoryArgs = [u, network];
        return urlClient;
      });
      (urlClient.core.simulateTransaction as unknown as sinon.SinonStub).resolves({
        $kind: 'Transaction',
        Transaction: {
          effects: {
            status: { success: true },
            gasUsed: { computationCost: '1000', storageCost: '2000', storageRebate: '500' },
          },
        },
      });

      const fee = await utils.getFeeEstimate('fullnode.mainnet.sui.io:443', urlTxHex);

      fee.toString().should.equal('2500');
      factoryArgs.should.deepEqual(['fullnode.mainnet.sui.io:443', 'mainnet']);
      // full checks remain the dry-run parity semantic in the url path too
      sinon.assert.calledWithMatch(urlClient.core.simulateTransaction as unknown as sinon.SinonStub, {
        checksEnabled: true,
      });
    });

    it('client-style calls do not construct a new client', async function () {
      const urlClient = fakeGrpcClient(['getBalance']);
      let factoryCalled = false;
      utils.__setUrlClientFactoryForTest(async () => {
        factoryCalled = true;
        return urlClient;
      });
      (urlClient.core.getBalance as unknown as sinon.SinonStub).resolves({
        balance: { balance: '1', coinType: '0x2::sui::SUI', coinBalance: '1', addressBalance: '0' },
      });

      await utils.getBalance(urlClient, urlOwner);

      factoryCalled.should.equal(false);
    });
  });

  describe('createSuiGrpcClient — environment guard', function () {
    it('refuses to run in browser environments', async function () {
      // Native gRPC cannot run in a browser and Sui JSON-RPC is deprecated, so
      // node calls must fail loudly there instead of with an opaque transport
      // error (or silently, via the webpack stub).
      const { createSuiGrpcClient } = require('../../src/lib/grpcClient');
      (global as any).window = { document: {} };
      try {
        await assert.rejects(
          createSuiGrpcClient('fullnode.testnet.sui.io:443', 'testnet'),
          /not supported in browser environments/
        );
      } finally {
        delete (global as any).window;
      }
    });
  });
});
