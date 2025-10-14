import sinon from 'sinon';
import 'should';
import { BuildTokenApprovalResponse, Wallet } from '../../../../src';

describe('Wallet - Token Approval', function () {
  let wallet: Wallet;
  let mockBitGo: any;
  let mockBaseCoin: any;
  let mockWalletData: any;

  beforeEach(function () {
    mockBitGo = {
      post: sinon.stub(),
      get: sinon.stub(),
      setRequestTracer: sinon.stub(),
    };

    mockBaseCoin = {
      getFamily: sinon.stub().returns('eth'),
      url: sinon.stub(),
      keychains: sinon.stub(),
      supportsTss: sinon.stub().returns(false),
      getMPCAlgorithm: sinon.stub(),
    };

    mockWalletData = {
      id: 'test-wallet-id',
      coin: 'teth',
      keys: ['user-key', 'backup-key', 'bitgo-key'],
    };

    wallet = new Wallet(mockBitGo, mockBaseCoin, mockWalletData);
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('buildErc20TokenApproval', function () {
    const mockTokenApprovalBuild: BuildTokenApprovalResponse = {
      txHex: '0x123456',
      txInfo: {
        amount: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        contractAddress: '0x1234567890123456789012345678901234567890',
        spender: '0x0987654321098765432109876543210987654321',
      },
      recipients: [
        {
          address: '0x0987654321098765432109876543210987654321',
          amount: '0',
          data: '0x095ea7b30000000000000000000000000987654321098765432109876543210987654321ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        },
      ],
      eip1559: {
        maxFeePerGas: '0x3b9aca00',
        maxPriorityFeePerGas: '0x3b9aca00',
      },
      nextContractSequenceId: 0,
      coin: 'teth',
      walletId: 'test-wallet-id',
    };

    it('should build token approval transaction without signing', async function () {
      mockBaseCoin.url.returns('/test/wallet/token/approval/build');
      mockBitGo.post.returns({
        send: sinon.stub().returns({
          result: sinon.stub().resolves(mockTokenApprovalBuild),
        }),
      });

      const result = await wallet.buildErc20TokenApproval('USDC');

      result.should.eql(mockTokenApprovalBuild);
      sinon.assert.calledWith(mockBaseCoin.url, '/wallet/test-wallet-id/token/approval/build');
      sinon.assert.calledOnce(mockBitGo.post);
      sinon.assert.calledOnce(mockBitGo.setRequestTracer);
      const postRequest = mockBitGo.post.getCall(0);
      const sendCall = postRequest.returnValue.send.getCall(0);
      sendCall.args[0].should.eql({ tokenName: 'USDC' });
    });

    it('should throw error if token build request fails', async function () {
      mockBaseCoin.url.returns('/test/wallet/token/approval/build');
      mockBitGo.post.returns({
        send: sinon.stub().returns({
          result: sinon.stub().rejects(new Error('token not supported')),
        }),
      });

      await wallet
        .buildErc20TokenApproval('INVALID_TOKEN')
        .should.be.rejectedWith(/error building erc20 token approval tx: Error: token not supported/);
    });

    it('should build, sign, and send token approval transaction when passphrase is provided', async function () {
      mockBaseCoin.url.returns('/test/wallet/token/approval/build');
      mockBitGo.post.returns({
        send: sinon.stub().returns({
          result: sinon.stub().resolves(mockTokenApprovalBuild),
        }),
      });

      const mockKeychain = { id: 'user-key', pub: 'pub-key', encryptedPrv: 'encrypted-prv' };
      mockBaseCoin.keychains.returns({
        get: sinon.stub().resolves(mockKeychain),
      });

      const signTransactionStub = sinon.stub(wallet, 'signTransaction' as keyof Wallet).resolves({ txHex: '0xsigned' });
      const sendTransactionStub = sinon.stub(wallet, 'sendTransaction' as keyof Wallet).resolves({ txid: '0xtxid' });
      const getKeychainsStub = sinon.stub(wallet as any, 'getKeychainsAndValidatePassphrase').resolves([mockKeychain]);

      const result = await wallet.buildErc20TokenApproval('USDC', 'passphrase123');

      result.should.have.property('txid', '0xtxid');

      sinon.assert.calledOnce(getKeychainsStub);
      getKeychainsStub.getCall(0).args[0].should.have.property('walletPassphrase', 'passphrase123');

      sinon.assert.calledOnce(signTransactionStub);
      const signCall = signTransactionStub.getCall(0);
      if (signCall && signCall.args[0]) {
        signCall.args[0].should.have.property('txPrebuild', mockTokenApprovalBuild);
        signCall.args[0].should.have.property('keychain', mockKeychain);
        signCall.args[0].should.have.property('walletPassphrase', 'passphrase123');
      }

      sinon.assert.calledOnce(sendTransactionStub);
      const sendCall = sendTransactionStub.getCall(0);
      if (sendCall && sendCall.args[0]) {
        sendCall.args[0].should.have.property('txHex', '0xsigned');
      }
    });

    it('should handle signing errors', async function () {
      mockBaseCoin.url.returns('/test/wallet/token/approval/build');
      mockBitGo.post.returns({
        send: sinon.stub().returns({
          result: sinon.stub().resolves(mockTokenApprovalBuild),
        }),
      });

      const mockKeychain = { id: 'user-key', pub: 'pub-key', encryptedPrv: 'encrypted-prv' };
      mockBaseCoin.keychains.returns({
        get: sinon.stub().resolves(mockKeychain),
      });

      sinon.stub(wallet as any, 'getKeychainsAndValidatePassphrase').resolves([mockKeychain]);
      sinon.stub(wallet, 'signTransaction' as keyof Wallet).rejects(new Error('signing error'));

      await wallet.buildErc20TokenApproval('USDC', 'passphrase123').should.be.rejectedWith('signing error');
    });
  });
});
