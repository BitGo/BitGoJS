import 'should';
import sinon from 'sinon';
import { Hash } from 'crypto';
import EthereumAbi from 'ethereumjs-abi';
import { FeeMarketEIP1559Transaction } from '@ethereumjs/tx';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import {
  EcdsaMPCv2Utils,
  EcdsaUtils,
  RequestTracer,
  TransactionType,
  TxIntentMismatchRecipientError,
  TxRequest,
  Wallet,
} from '@bitgo/sdk-core';
import { AbstractEthLikeNewCoins, TransferBuilderERC7984 } from '@bitgo/abstract-eth';
import { BaseCoin as StaticsBaseCoin, CoinFeature, coins, EthereumNetwork } from '@bitgo/statics';
import { Hteth, TransactionBuilder } from '../../src';
import { getBuilder } from './getBuilder';

/**
 * verifyTssTransaction payment / consolidation checks (CECHO-2460). Each case builds real hteth
 * transaction bytes and checks them against the declared intent.
 */
describe('TSS payment verification', function () {
  const baseAddress = '0x174cfd823af8ce27ed0afee3fcf3c3ba259116be';
  const recipient = '0x7e85bdc27c050e3905ebf4b8e634d9ad6edd0de6';
  const otherRecipient = '0x9f8d0b5e1b3c3f0e2f4b7a6c1d2e3f4a5b6c7d8e';
  const tokenName = 'hteth:stgusd1';
  const tokenContract = '0xe4cf91a5bf7cc3d75ac85639e591e51d34948954';
  const otherTokenContract = '0x5ce9c87a0b7208491f9fe52bcc8e919eb43c58b2';
  const batcher = (coins.get('hteth').network as EthereumNetwork).batcherContractAddress as string;

  let bitgo: TestBitGoAPI;
  let coin: Hteth;
  let wallet: Wallet;
  let warn: sinon.SinonStub;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.safeRegister('hteth', Hteth.createInstance);
    bitgo.initializeTestVars();
    coin = bitgo.coin('hteth') as Hteth;
    wallet = new Wallet(bitgo, coin, { coinSpecific: { baseAddress } });
  });

  beforeEach(function () {
    warn = sinon.stub(console, 'warn');
  });

  afterEach(function () {
    sinon.restore();
  });

  const calldata = (name: string, types: string[], values: unknown[]): string =>
    '0x' + Buffer.concat([EthereumAbi.methodID(name, types), EthereumAbi.rawEncode(types, values)]).toString('hex');
  const erc20Transfer = (to: string, amount: string) => calldata('transfer', ['address', 'uint256'], [to, amount]);
  const nativeBatch = (addresses: string[], amounts: string[]) =>
    calldata('batch', ['address[]', 'uint256[]'], [addresses, amounts]);
  const tokenBatch = (token: string, addresses: string[], amounts: string[]) =>
    calldata('batchTransferFrom', ['address', 'address[]', 'uint256[]'], [token, addresses, amounts]);

  async function buildTx({ to, value = '0', data }: { to: string; value?: string; data?: string }): Promise<string> {
    const txBuilder = getBuilder('hteth') as TransactionBuilder;
    txBuilder.type(data ? TransactionType.ContractCall : TransactionType.SingleSigSend);
    txBuilder.fee({ fee: '10', gasLimit: '100000' });
    txBuilder.counter(1);
    txBuilder.contract(to);
    txBuilder.value(value);
    if (data) {
      txBuilder.data(data);
    }
    return (await txBuilder.build()).toBroadcastFormat();
  }

  function verify(txParams: Record<string, unknown>, txHex: string, verification = {}) {
    return coin.verifyTransaction({
      txParams: { wallet, ...txParams } as never,
      txPrebuild: { txHex, coin: 'hteth', walletId: 'fakeWalletId' } as never,
      wallet,
      verification,
      walletType: 'tss',
    });
  }

  async function expectMismatch(p: Promise<unknown>, pattern: RegExp): Promise<void> {
    try {
      await p;
    } catch (e) {
      e.should.be.instanceOf(TxIntentMismatchRecipientError);
      (e as Error).message.should.match(pattern);
      return;
    }
    throw new Error('expected verifyTransaction to reject');
  }

  const warned = (pattern: RegExp): boolean => warn.getCalls().some((call) => pattern.test(String(call.args[0])));

  describe('single native payment', function () {
    it('verifies a matching native send', async function () {
      const txHex = await buildTx({ to: recipient, value: '1000' });
      (
        await verify({ type: 'transfer', recipients: [{ address: recipient, amount: '1000' }] }, txHex)
      ).should.be.true();
    });

    it('treats a stored payment intent as a transfer', async function () {
      const txHex = await buildTx({ to: otherRecipient, value: '1000' });
      await expectMismatch(
        verify({ type: 'payment', recipients: [{ address: recipient, amount: '1000' }] }, txHex),
        /destination address does not match/
      );
    });

    it('rejects a wrong amount', async function () {
      const txHex = await buildTx({ to: recipient, value: '999' });
      await expectMismatch(
        verify({ type: 'transfer', recipients: [{ address: recipient, amount: '1000' }] }, txHex),
        /amount in txPrebuild does not match/
      );
    });

    it('rejects calldata on a native payment', async function () {
      const data = calldata('approve', ['address', 'uint256'], [otherRecipient, '1000']);
      const txHex = await buildTx({ to: recipient, value: '1000', data });
      await expectMismatch(
        verify({ type: 'transfer', recipients: [{ address: recipient, amount: '1000' }] }, txHex),
        /not a native send or an ERC-20 transfer/
      );
    });

    it('warns for ERC-20 calldata with no declared token but still enforces the transfer', async function () {
      const intent = { type: 'transfer', recipients: [{ address: recipient, amount: '1000' }] };
      const good = await buildTx({ to: tokenContract, data: erc20Transfer(recipient, '1000') });
      (await verify(intent, good)).should.be.true();
      warned(/payment declares no token: the token contract was not verified/).should.be.true();

      const redirected = await buildTx({ to: tokenContract, data: erc20Transfer(otherRecipient, '1000') });
      await expectMismatch(verify(intent, redirected), /destination address does not match/);
      const withValue = await buildTx({ to: tokenContract, value: '1', data: erc20Transfer(recipient, '1000') });
      await expectMismatch(verify(intent, withValue), /must not carry native value/);
    });
  });

  describe('single ERC-20 payment', function () {
    const intent = { type: 'transfer', recipients: [{ address: recipient, amount: '1000', tokenName }] };

    it('verifies a matching transfer on the declared token contract', async function () {
      const txHex = await buildTx({ to: tokenContract, data: erc20Transfer(recipient, '1000') });
      (await verify(intent, txHex)).should.be.true();
      warn.called.should.be.false();
    });

    it('accepts the token declared at the top level', async function () {
      const txHex = await buildTx({ to: tokenContract, data: erc20Transfer(recipient, '1000') });
      const txParams = { type: 'transfer', tokenName, recipients: [{ address: recipient, amount: '1000' }] };
      (await verify(txParams, txHex)).should.be.true();
    });

    it('rejects a different token contract', async function () {
      const txHex = await buildTx({ to: otherTokenContract, data: erc20Transfer(recipient, '1000') });
      await expectMismatch(verify(intent, txHex), /not sent to the declared token contract/);
    });

    it('rejects native value', async function () {
      const txHex = await buildTx({ to: tokenContract, value: '1', data: erc20Transfer(recipient, '1000') });
      await expectMismatch(verify(intent, txHex), /must not carry native value/);
    });

    it('rejects a wrong function on the token contract', async function () {
      const data = calldata('approve', ['address', 'uint256'], [recipient, '1000']);
      const txHex = await buildTx({ to: tokenContract, data });
      await expectMismatch(verify(intent, txHex), /not a native send or an ERC-20 transfer/);
    });

    it('rejects trailing bytes after the transfer arguments', async function () {
      const txHex = await buildTx({ to: tokenContract, data: erc20Transfer(recipient, '1000') + '00'.repeat(32) });
      await expectMismatch(verify(intent, txHex), /not canonical/);
    });

    it('rejects a wrong token amount', async function () {
      const txHex = await buildTx({ to: tokenContract, data: erc20Transfer(recipient, '999') });
      await expectMismatch(verify(intent, txHex), /amount in txPrebuild does not match/);
    });

    it('rejects a token payment with no calldata', async function () {
      const txHex = await buildTx({ to: recipient, value: '1000' });
      await expectMismatch(verify(intent, txHex), /carries no ERC-20 transfer calldata/);
    });

    it('warns for an unresolved token but still rejects a wrong amount', async function () {
      const unresolved = {
        type: 'transfer',
        recipients: [{ address: recipient, amount: '1000', tokenName: 'hteth:notatoken' }],
      };
      const good = await buildTx({ to: tokenContract, data: erc20Transfer(recipient, '1000') });
      (await verify(unresolved, good)).should.be.true();
      warned(/cannot be resolved/).should.be.true();

      const bad = await buildTx({ to: tokenContract, data: erc20Transfer(recipient, '999') });
      await expectMismatch(verify(unresolved, bad), /amount in txPrebuild does not match/);
    });
  });

  describe('explicit calldata', function () {
    const data = calldata('deposit', ['uint256', 'address'], ['5', baseAddress]);

    it('verifies an exact to / value / data match, including nonzero native value', async function () {
      const txHex = await buildTx({ to: otherRecipient, value: '77', data });
      const txParams = { type: 'transfer', recipients: [{ address: otherRecipient, amount: '77', data }] };
      (await verify(txParams, txHex)).should.be.true();
    });

    it('rejects calldata that differs from the declared calldata', async function () {
      const txHex = await buildTx({ to: otherRecipient, value: '77', data });
      const declared = calldata('deposit', ['uint256', 'address'], ['6', baseAddress]);
      const txParams = { type: 'transfer', recipients: [{ address: otherRecipient, amount: '77', data: declared }] };
      await expectMismatch(verify(txParams, txHex), /calldata does not match/);
    });

    it('rejects a different native value', async function () {
      const txHex = await buildTx({ to: otherRecipient, value: '78', data });
      const txParams = { type: 'transfer', recipients: [{ address: otherRecipient, amount: '77', data }] };
      await expectMismatch(verify(txParams, txHex), /amount in txPrebuild does not match/);
    });
  });

  describe('batch payments', function () {
    const nativeIntent = {
      type: 'transfer',
      recipients: [
        { address: recipient, amount: '100' },
        { address: otherRecipient, amount: '200' },
      ],
    };
    const tokenIntent = {
      type: 'transfer',
      recipients: [
        { address: recipient, amount: '100', tokenName },
        { address: otherRecipient, amount: '200', tokenName },
      ],
    };

    it('verifies a native batch to the network batcher', async function () {
      const txHex = await buildTx({
        to: batcher,
        value: '300',
        data: nativeBatch([recipient, otherRecipient], ['100', '200']),
      });
      (await verify(nativeIntent, txHex)).should.be.true();
    });

    it('rejects a native batch value that is not the sum', async function () {
      const txHex = await buildTx({
        to: batcher,
        value: '301',
        data: nativeBatch([recipient, otherRecipient], ['100', '200']),
      });
      await expectMismatch(verify(nativeIntent, txHex), /value does not match the sum/);
    });

    it('rejects a native batch that is not sent to the batcher', async function () {
      const txHex = await buildTx({
        to: otherRecipient,
        value: '300',
        data: nativeBatch([recipient, otherRecipient], ['100', '200']),
      });
      await expectMismatch(verify(nativeIntent, txHex), /not sent to the network batcher/);
    });

    it('rejects a batch entry that does not match the intent', async function () {
      const txHex = await buildTx({
        to: batcher,
        value: '300',
        data: nativeBatch([recipient, otherRecipient], ['200', '100']),
      });
      await expectMismatch(verify(nativeIntent, txHex), /entry 0 does not match/);
    });

    it('still rejects wrong batch amounts when no batcher is configured', async function () {
      sinon
        .stub(coin, 'getNetwork')
        .returns({ ...(coin.getNetwork() as EthereumNetwork), batcherContractAddress: undefined });
      const txHex = await buildTx({
        to: otherRecipient,
        value: '300',
        data: nativeBatch([recipient, otherRecipient], ['100', '199']),
      });
      await expectMismatch(verify(nativeIntent, txHex), /entry 1 does not match/);
      warned(/no batcher contract is configured/).should.be.true();
    });

    it('verifies a token batch with no top-level tokenName', async function () {
      const txHex = await buildTx({
        to: batcher,
        data: tokenBatch(tokenContract, [recipient, otherRecipient], ['100', '200']),
      });
      (await verify(tokenIntent, txHex)).should.be.true();
    });

    it('rejects a token batch that moves a different token', async function () {
      const txHex = await buildTx({
        to: batcher,
        data: tokenBatch(otherTokenContract, [recipient, otherRecipient], ['100', '200']),
      });
      await expectMismatch(verify(tokenIntent, txHex), /token contract does not match/);
    });

    it('rejects a token batch carrying native value', async function () {
      const txHex = await buildTx({
        to: batcher,
        value: '1',
        data: tokenBatch(tokenContract, [recipient, otherRecipient], ['100', '200']),
      });
      await expectMismatch(verify(tokenIntent, txHex), /must not carry native value/);
    });

    it('rejects a token batch sent through the native batch function', async function () {
      const txHex = await buildTx({
        to: batcher,
        data: nativeBatch([recipient, otherRecipient], ['100', '200']),
      });
      await expectMismatch(verify(tokenIntent, txHex), /must use batchTransferFrom/);
    });
  });

  describe('other intents', function () {
    it('warns for contractCall instead of claiming it was verified', async function () {
      const txHex = await buildTx({ to: recipient, value: '1' });
      (await verify({ type: 'contractCall', recipients: [] }, txHex)).should.be.true();
      warned(/contractCall: no verifier is implemented/).should.be.true();
    });

    it('warns for an intent type with no verifier', async function () {
      const txHex = await buildTx({ to: recipient, value: '1' });
      (await verify({ type: 'acceleration' }, txHex)).should.be.true();
      warned(/acceleration: no verifier is implemented/).should.be.true();
    });
  });

  // Approval recreation carries no caller txParams; the token survives only in amount.symbol.
  // Exercise both verification routes with the real coin verifier, stopping before signing.
  describe('MPCv2 signing of a stored confidential payment without caller txParams', function () {
    const confidentialToken = 'hteth:ctest1';
    const confidentialRecipient = '0x19645032c7f1533395d44a629462e751084d3e4c';
    const confidentialSendAmount = '1000000';
    const encryptedHandle = '0x' + 'ab'.repeat(32);
    const inputProof = '0x' + 'cd'.repeat(50);
    const gpgKeyStub = 'stubbed-gpg-key';
    const signedBoundaryMessage = 'signing boundary reached after recipient verification';

    function tokenContractAddress(tokenName: string): string {
      const token = coins.get(tokenName);
      if (!('contractAddress' in token) || typeof token.contractAddress !== 'string') {
        throw new Error(`${tokenName} has no contract address in statics`);
      }
      return token.contractAddress;
    }

    function buildConfidentialTransferBytes(): { signableHex: string; serializedTxHex: string } {
      const tokenContract = tokenContractAddress(confidentialToken);
      const common = AbstractEthLikeNewCoins.getCustomChainCommon(coin.getChainId());
      const confidentialTransfer = new TransferBuilderERC7984()
        .to(confidentialRecipient)
        .tokenContractAddress(tokenContract)
        .encryptedHandle(encryptedHandle)
        .inputProof(inputProof)
        .build();
      const tx = FeeMarketEIP1559Transaction.fromTxData(
        {
          nonce: 1,
          maxPriorityFeePerGas: 10,
          maxFeePerGas: 100,
          gasLimit: 200000,
          to: tokenContract,
          value: 0,
          data: confidentialTransfer,
          chainId: coin.getChainId(),
        },
        { common }
      );
      return {
        signableHex: tx.getMessageToSign(false).toString('hex'),
        serializedTxHex: tx.serialize().toString('hex'),
      };
    }

    async function expectSigningBoundary(useSerializedTxHex: boolean): Promise<void> {
      const { signableHex, serializedTxHex } = buildConfidentialTransferBytes();
      const signingWallet = new Wallet(bitgo, coin, {
        id: 'confidentialSigningWallet',
        multisigType: 'tss',
        multisigTypeVersion: 'MPCv2',
        coinSpecific: { baseAddress },
      });
      const utils = new EcdsaMPCv2Utils(bitgo, coin, signingWallet);
      // Avoid the remote GPG lookup; verification does not consume this key.
      const stubbableUtils = utils as unknown as Record<string, (...args: unknown[]) => Promise<string>>;
      sinon.stub(stubbableUtils, 'pickBitgoPubGpgKeyForSigning').resolves(gpgKeyStub);

      const realFeatures = coin
        .getConfig()
        .features.filter((feature) => feature !== CoinFeature.TSS_VERIFY_USE_SERIALIZED_TX_HEX);
      sinon.stub(coin, 'getConfig').returns({
        ...coin.getConfig(),
        features: useSerializedTxHex ? [...realFeatures, CoinFeature.TSS_VERIFY_USE_SERIALIZED_TX_HEX] : realFeatures,
      } as unknown as Readonly<StaticsBaseCoin>);

      // The MPCv2 flow hashes the verified bytes before it exchanges any signature share. Throwing
      // here proves verification succeeded: a recipient mismatch rejects before this boundary.
      const boundary = new Error(signedBoundaryMessage);
      sinon.stub(coin, 'getHashFunction').returns({
        update: () => {
          throw boundary;
        },
      } as unknown as Hash);

      const txRequest = {
        txRequestId: 'confidential-payment-signing',
        apiVersion: 'full',
        walletId: 'confidentialSigningWallet',
        intent: {
          intentType: 'payment',
          recipients: [
            {
              address: { address: confidentialRecipient },
              amount: { value: confidentialSendAmount, symbol: confidentialToken },
            },
          ],
        },
        transactions: [
          {
            unsignedTx: { derivationPath: 'm/0', signableHex, serializedTxHex },
            signatureShares: [],
          },
        ],
      } as unknown as TxRequest;

      try {
        await utils.signTxRequest({
          txRequest,
          prv: '',
          reqId: new RequestTracer(),
        });
      } catch (e) {
        e.should.be.exactly(boundary);
        return;
      }
      throw new Error('expected signTxRequest to stop at the signing boundary');
    }

    it('verifies the stored payment from signableHex', async function () {
      await expectSigningBoundary(false);
    });

    it('verifies the stored payment from serializedTxHex', async function () {
      await expectSigningBoundary(true);
    });
  });

  // MPCv1 approvals take the same route: recreateTxRequest() -> signTxRequest() carries no caller
  // txParams, so token identity survives only in the stored intent. Verification is followed
  // immediately by the Paillier modulus lookup, before any share is generated or exchanged;
  // throwing there proves the real coin verifier accepted the bytes.
  describe('MPCv1 signing of a stored payment without caller txParams', function () {
    const confidentialToken = 'hteth:ctest1';
    const confidentialRecipient = '0x19645032c7f1533395d44a629462e751084d3e4c';
    const confidentialSendAmount = '1000000';
    const encryptedHandle = '0x' + 'ab'.repeat(32);
    const inputProof = '0x' + 'cd'.repeat(50);
    const signingBoundaryMessage = 'signing boundary reached after recipient verification';
    // signRequestBase only inspects the user share index and the presence of the backup share
    // before verification; the Paillier modulus and everything after it are stubbed out.
    const signingMaterial = JSON.stringify({
      pShare: { i: 1, n: 'stub-user-paillier-modulus' },
      backupNShare: { i: 3, n: 'stub-backup-paillier-modulus' },
    });

    const routes = [
      { route: 'signableHex', useSerializedTxHex: false },
      { route: 'serializedTxHex', useSerializedTxHex: true },
    ];

    function tokenContractAddress(tokenName: string): string {
      const token = coins.get(tokenName);
      if (!('contractAddress' in token) || typeof token.contractAddress !== 'string') {
        throw new Error(`${tokenName} has no contract address in statics`);
      }
      return token.contractAddress;
    }

    function buildTxBytes({ to, value, data }: { to: string; value?: number; data?: string }) {
      const common = AbstractEthLikeNewCoins.getCustomChainCommon(coin.getChainId());
      const tx = FeeMarketEIP1559Transaction.fromTxData(
        {
          nonce: 1,
          maxPriorityFeePerGas: 10,
          maxFeePerGas: 100,
          gasLimit: 200000,
          to,
          value: value ?? 0,
          data,
          chainId: coin.getChainId(),
        },
        { common }
      );
      return {
        signableHex: tx.getMessageToSign(false).toString('hex'),
        serializedTxHex: tx.serialize().toString('hex'),
      };
    }

    function confidentialTransferBytes() {
      const tokenContract = tokenContractAddress(confidentialToken);
      const data = new TransferBuilderERC7984()
        .to(confidentialRecipient)
        .tokenContractAddress(tokenContract)
        .encryptedHandle(encryptedHandle)
        .inputProof(inputProof)
        .build();
      return buildTxBytes({ to: tokenContract, data });
    }

    function storedPaymentRequest(
      recipientAddress: string,
      amount: { value: string; symbol: string },
      txBytes: { signableHex: string; serializedTxHex: string }
    ): TxRequest {
      return {
        txRequestId: 'mpcv1-stored-payment',
        apiVersion: 'full',
        walletId: 'mpcv1SigningWallet',
        intent: {
          intentType: 'payment',
          recipients: [{ address: { address: recipientAddress }, amount }],
        },
        transactions: [
          {
            unsignedTx: { derivationPath: 'm/0', ...txBytes },
            signatureShares: [],
          },
        ],
      } as unknown as TxRequest;
    }

    async function runSigning(
      txRequest: TxRequest,
      useSerializedTxHex: boolean
    ): Promise<{ error: Error; boundary: Error }> {
      const signingWallet = new Wallet(bitgo, coin, {
        id: 'mpcv1SigningWallet',
        multisigType: 'tss',
        coinSpecific: { baseAddress },
      });
      const utils = new EcdsaUtils(bitgo, coin, signingWallet);
      const baseConfig = coin.getConfig();
      const features = baseConfig.features.filter(
        (feature) => feature !== CoinFeature.TSS_VERIFY_USE_SERIALIZED_TX_HEX
      );
      sinon.stub(coin, 'getConfig').returns({
        ...baseConfig,
        features: useSerializedTxHex ? [...features, CoinFeature.TSS_VERIFY_USE_SERIALIZED_TX_HEX] : features,
      } as unknown as Readonly<StaticsBaseCoin>);

      const boundary = new Error(signingBoundaryMessage);
      sinon.stub(utils, 'getOfflineSignerPaillierModulus').throws(boundary);

      try {
        await utils.signTxRequest({ txRequest, prv: signingMaterial, reqId: new RequestTracer() });
      } catch (e) {
        return { error: e as Error, boundary };
      }
      throw new Error('expected signTxRequest to reject');
    }

    for (const { route, useSerializedTxHex } of routes) {
      it(`verifies a stored confidential payment from ${route}`, async function () {
        const request = storedPaymentRequest(
          confidentialRecipient,
          { value: confidentialSendAmount, symbol: confidentialToken },
          confidentialTransferBytes()
        );
        const { error, boundary } = await runSigning(request, useSerializedTxHex);
        error.should.be.exactly(boundary);
        warned(/ERC-7984 token: the payment calldata was not verified/).should.be.true();
      });

      it(`verifies a stored native payment from ${route} without warnings`, async function () {
        const request = storedPaymentRequest(
          recipient,
          { value: '1000', symbol: 'hteth' },
          buildTxBytes({ to: recipient, value: 1000 })
        );
        const { error, boundary } = await runSigning(request, useSerializedTxHex);
        error.should.be.exactly(boundary);
        warned(/\[tss verification\]/).should.be.false();
      });

      it(`verifies a stored ERC-20 payment from ${route} without an unresolved contract warning`, async function () {
        const request = storedPaymentRequest(
          recipient,
          { value: '1000', symbol: tokenName },
          buildTxBytes({ to: tokenContractAddress(tokenName), data: erc20Transfer(recipient, '1000') })
        );
        const { error, boundary } = await runSigning(request, useSerializedTxHex);
        error.should.be.exactly(boundary);
        warned(/the token contract was not verified/).should.be.false();
      });

      it(`rejects a stored ERC-20 payment sent to a different contract from ${route}`, async function () {
        const request = storedPaymentRequest(
          recipient,
          { value: '1000', symbol: tokenName },
          buildTxBytes({ to: otherTokenContract, data: erc20Transfer(recipient, '1000') })
        );
        const { error } = await runSigning(request, useSerializedTxHex);
        error.should.be.instanceOf(TxIntentMismatchRecipientError);
        error.message.should.match(/not sent to the declared token contract/);
      });
    }
  });

  describe('consolidation to base address', function () {
    const consolidation = { consolidationToBaseAddress: true };

    it('rejects calldata on a native consolidation', async function () {
      const data = calldata('approve', ['address', 'uint256'], [recipient, '1']);
      const txHex = await buildTx({ to: baseAddress, value: '1000', data });
      await expectMismatch(verify({ type: 'consolidate' }, txHex, consolidation), /must not carry calldata/);
    });

    it('verifies an ERC-20 sweep on the declared token without comparing the amount', async function () {
      const txHex = await buildTx({ to: tokenContract, data: erc20Transfer(baseAddress, '123456789') });
      (await verify({ type: 'consolidate', tokenName }, txHex, consolidation)).should.be.true();
    });

    it('rejects an ERC-20 sweep carrying native value', async function () {
      const txHex = await buildTx({ to: tokenContract, value: '1', data: erc20Transfer(baseAddress, '1') });
      await expectMismatch(
        verify({ type: 'consolidate', tokenName }, txHex, consolidation),
        /must not carry native value/
      );
    });

    it('rejects an ERC-20 sweep on a different token contract', async function () {
      const txHex = await buildTx({ to: otherTokenContract, data: erc20Transfer(baseAddress, '1') });
      await expectMismatch(
        verify({ type: 'consolidate', tokenName }, txHex, consolidation),
        /does not call the declared token contract/
      );
    });
  });
});
