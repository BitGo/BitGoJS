import { TestBitGo } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { EvmRPCWrapper } from '../../src/evmRPCWrapper';
import {
  Wallet,
  common,
  ECDSAUtils,
  Keychains,
  Ecdsa,
  SignedMessage,
  SignTypedDataVersion,
  SendManyOptions,
} from '@bitgo/sdk-core';
import { EVMRPCRequest } from '../../src/types';
import { Hteth } from '@bitgo/sdk-coin-eth';
import * as sinon from 'sinon';
import {
  ethWalletData,
  txRequestForMessageSigning,
  reqId,
  typedMessage,
  txRequestForTypedDataSigning,
  transactionOptions,
} from '../fixtures/evmRPCWrapperFixtures';
import nock = require('nock');
import { personal_sign, eth_signTypedData, eth_sendTransaction } from '../../src/constants';

describe('EVMRPCWrapper handleRPCCall', function () {
  const bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
  const coin = 'gteth';
  let params: EVMRPCRequest;
  let txHash;
  const sandbox = sinon.createSandbox();
  let bgUrl;
  const walletPassphrase = 'bitGo';

  let wallet;
  let evmRPCWrapper;
  let signTxRequestForMessage;

  before(function () {
    bitgo.initializeTestVars();
    bitgo.safeRegister(coin, Hteth.createInstance);
    wallet = new Wallet(bitgo, bitgo.coin(coin), ethWalletData);
    bgUrl = common.Environments[bitgo.getEnv()].uri;
    evmRPCWrapper = new EvmRPCWrapper(wallet);
    sandbox
      .stub(Keychains.prototype, 'getKeysForSigning')
      .resolves([{ commonKeychain: 'test', id: '', pub: '', type: 'independent' }]);
    sinon.stub(Ecdsa.prototype, 'verify').resolves(true);
    signTxRequestForMessage = sandbox.stub(ECDSAUtils.EcdsaUtils.prototype, 'signTxRequestForMessage');
    nock.cleanAll();
  });

  after(function () {
    nock.cleanAll();
  });

  it('should throw for unknown method', async function () {
    const badMethod = 'bad_method';
    params = {
      method: badMethod,
      params: [''],
    };
    await evmRPCWrapper
      .handleRPCCall(params, walletPassphrase)
      .should.be.rejectedWith(`method '${badMethod}' not yet implemented`);
  });

  it('personal_sign should call wallet signMessage', async function () {
    signTxRequestForMessage.resolves(txRequestForMessageSigning);
    const messageRaw = 'test message';
    params = {
      method: personal_sign,
      params: [messageRaw],
    };
    const expected: SignedMessage = { txRequestId: reqId.toString(), txHash, messageRaw, coin };
    const signStub = sandbox.stub(Wallet.prototype, 'signMessage').resolves(expected);
    nock(bgUrl)
      .get(
        `/api/v2/wallet/${wallet.id()}/txrequests?txRequestIds=${txRequestForMessageSigning.txRequestId}&latest=true`
      )
      .reply(200, { txRequests: [txRequestForMessageSigning] });

    const actual = await evmRPCWrapper.handleRPCCall(params, walletPassphrase);
    signStub.calledOnceWith({ message: { messageRaw }, walletPassphrase });
    actual.result.should.deepEqual(expected);
  });

  it('eth_signTypedData should call wallet signTypedData', async function () {
    signTxRequestForMessage.resolves(txRequestForTypedDataSigning);
    params = {
      method: eth_signTypedData,
      params: [JSON.stringify(typedMessage)],
    };
    const messageRaw = JSON.stringify(typedMessage);
    const expected: SignedMessage = {
      txRequestId: reqId.toString(),
      messageRaw,
      txHash,
      coin,
    };
    const signStub = sandbox.stub(Wallet.prototype, 'signTypedData').resolves(expected);
    nock(bgUrl)
      .get(
        `/api/v2/wallet/${wallet.id()}/txrequests?txRequestIds=${txRequestForTypedDataSigning.txRequestId}&latest=true`
      )
      .reply(200, { txRequests: [txRequestForTypedDataSigning] });
    const actual = await evmRPCWrapper.handleRPCCall(params, walletPassphrase);
    signStub.calledOnceWith({
      typedData: { typedDataRaw: messageRaw, version: SignTypedDataVersion.V4 },
      walletPassphrase,
    });
    actual.result.should.deepEqual(expected);
  });

  it('eth_sendTransaction should call wallet sendMany', async function () {
    params = {
      method: eth_sendTransaction,
      params: [JSON.stringify(transactionOptions)],
    };
    const expected = 'sendTxRequest';
    const sendManyStub = sandbox.stub(Wallet.prototype, 'sendMany').resolves(expected);
    const actual = await evmRPCWrapper.handleRPCCall(params, walletPassphrase);
    sendManyStub.calledOnceWith(transactionOptions as unknown as SendManyOptions);
    actual.result.should.equal(expected);
  });
});
