import 'should';
import sinon from 'sinon';
import { Hash } from 'crypto';
import EthereumAbi from 'ethereumjs-abi';
import { FeeMarketEIP1559Transaction, Transaction as LegacyTransaction, TransactionFactory } from '@ethereumjs/tx';
import { addHexPrefix, bufArrToArr, rlp, stripHexPrefix, toBuffer } from 'ethereumjs-util';
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

  // CECHO-2681: a legacy (type-0) EVM transaction's signableHex is the EIP-155 signing
  // preimage RLP([nonce, gasPrice, gasLimit, to, value, data, chainId, 0, 0]) — not a
  // parseable serialized transaction. The envelope must route verification to
  // serializedTxHex even on an EIP-1559 coin like hteth; type-2 keeps signableHex.
  describe('legacy type-0 envelope routing', function () {
    function deriveSignableHex(serializedTxHex: string): string {
      const common = AbstractEthLikeNewCoins.getCustomChainCommon(coin.getChainId());
      const ethTx = TransactionFactory.fromSerializedData(toBuffer(addHexPrefix(serializedTxHex)), { common });
      if (ethTx instanceof LegacyTransaction) {
        return Buffer.from(rlp.encode(bufArrToArr(ethTx.getMessageToSign(false)))).toString('hex');
      }
      return Buffer.from(ethTx.getMessageToSign(false)).toString('hex');
    }
    async function buildTypedTxBytes(
      kind: 'legacy' | 'eip1559',
      { to, value = '0', data }: { to: string; value?: string; data?: string }
    ): Promise<{ serializedTxHex: string; signableHex: string }> {
      const txBuilder = getBuilder('hteth') as TransactionBuilder;
      txBuilder.type(data ? TransactionType.ContractCall : TransactionType.SingleSigSend);
      txBuilder.counter(1);
      txBuilder.contract(to);
      txBuilder.value(value);
      if (data) {
        txBuilder.data(data);
      }
      if (kind === 'legacy') {
        txBuilder.fee({ fee: '10', gasLimit: '100000' });
      } else {
        txBuilder.fee({ fee: '10', gasLimit: '100000', eip1559: { maxFeePerGas: '10', maxPriorityFeePerGas: '1' } });
      }
      const serializedTxHex = stripHexPrefix((await txBuilder.build()).toBroadcastFormat());
      return { serializedTxHex, signableHex: deriveSignableHex(serializedTxHex) };
    }

    function storedRequest(
      txBytes: { serializedTxHex: string; signableHex: string },
      recipients: { address: string; amount: string }[],
      opts: { serializedTxHex?: string | undefined } = {}
    ): TxRequest {
      return {
        txRequestId: 'cecho-2681-legacy-envelope',
        apiVersion: 'full',
        walletId: 'cecho-2681-wallet',
        intent: {
          intentType: 'payment',
          recipients: recipients.map((r) => ({
            address: { address: r.address },
            amount: { value: r.amount, symbol: 'hteth' },
          })),
        },
        transactions: [
          {
            unsignedTx: {
              derivationPath: 'm/0',
              ...txBytes,
              ...(opts.serializedTxHex !== undefined ? { serializedTxHex: opts.serializedTxHex } : {}),
            },
            signatureShares: [],
          },
        ],
      } as unknown as TxRequest;
    }

    it('detects a type-0 envelope and keeps type-2 and pre-hashed signables on their own routes', async function () {
      const legacy = await buildTypedTxBytes('legacy', { to: recipient, value: '1000' });
      coin.shouldVerifyWithSerializedTxHex(legacy).should.be.true();

      const eip1559 = await buildTypedTxBytes('eip1559', { to: recipient, value: '1000' });
      eip1559.signableHex.startsWith('02').should.be.true();
      coin.shouldVerifyWithSerializedTxHex(eip1559).should.be.false();

      // Pre-EIP-155 6-element legacy signing preimage is also a legacy type-0 envelope.
      const preEip155Signable = Buffer.from(
        rlp.encode([
          Buffer.from([1]),
          Buffer.from([10]),
          Buffer.from([0x52, 0x08]),
          toBuffer(recipient),
          Buffer.from([1]),
          Buffer.from([]),
        ])
      ).toString('hex');
      coin
        .shouldVerifyWithSerializedTxHex({ serializedTxHex: legacy.serializedTxHex, signableHex: preEip155Signable })
        .should.be.true();

      // Signed 9-element legacy RLP (non-empty r/s) is not an unsigned signing preimage.
      const signedLike = Buffer.from(
        rlp.encode([
          Buffer.from([1]),
          Buffer.from([10]),
          Buffer.from([0x52, 0x08]),
          toBuffer(recipient),
          Buffer.from([1]),
          Buffer.from([]),
          Buffer.from([27]),
          Buffer.from([1]),
          Buffer.from([2]),
        ])
      ).toString('hex');
      coin
        .shouldVerifyWithSerializedTxHex({ serializedTxHex: legacy.serializedTxHex, signableHex: signedLike })
        .should.be.false();

      // FLR/FLRP atomic shape (32-byte pre-hashed digest) and Tempo 0x76 envelope stay off the legacy route.
      coin
        .shouldVerifyWithSerializedTxHex({ serializedTxHex: '0000' + 'bb'.repeat(32), signableHex: 'a'.repeat(64) })
        .should.be.false();
      coin
        .shouldVerifyWithSerializedTxHex({ serializedTxHex: '0x76f8308080', signableHex: '76f8308080' })
        .should.be.false();
    });
    it('verifies a type-0 payment against its serialized bytes through the full payment verifier', async function () {
      const txBytes = await buildTypedTxBytes('legacy', { to: recipient, value: '1000' });
      (
        await verify(
          { type: 'transfer', recipients: [{ address: recipient, amount: '1000' }] },
          txBytes.serializedTxHex
        )
      ).should.be.true();

      const redirected = await buildTypedTxBytes('legacy', { to: otherRecipient, value: '1000' });
      await expectMismatch(
        verify({ type: 'transfer', recipients: [{ address: recipient, amount: '1000' }] }, redirected.serializedTxHex),
        /destination address does not match/
      );
    });

    it('cannot verify a type-0 payment from its signableHex preimage alone', async function () {
      const txBytes = await buildTypedTxBytes('legacy', { to: recipient, value: '1000' });
      try {
        await verify({ type: 'transfer', recipients: [{ address: recipient, amount: '1000' }] }, txBytes.signableHex);
      } catch (e) {
        // The EIP-155 preimage (v = chainId, r = 0, s = 0) is not a parseable transaction;
        // this is exactly why the envelope must route to serializedTxHex.
        (e as Error).should.be.instanceOf(Error);
        return;
      }
      throw new Error('expected signableHex preimage to be unparsable');
    });

    it('leaves a type-2 payment on the signableHex route', async function () {
      const txBytes = await buildTypedTxBytes('eip1559', { to: recipient, value: '1000' });
      (
        await verify({ type: 'transfer', recipients: [{ address: recipient, amount: '1000' }] }, txBytes.signableHex)
      ).should.be.true();

      const redirected = await buildTypedTxBytes('eip1559', { to: otherRecipient, value: '1000' });
      await expectMismatch(
        verify({ type: 'transfer', recipients: [{ address: recipient, amount: '1000' }] }, redirected.signableHex),
        /destination address does not match/
      );
    });

    describe('MPCv1 signing entry point (EcdsaUtils)', function () {
      const signingBoundaryMessage = 'signing boundary reached after recipient verification';
      const signingMaterial = JSON.stringify({
        pShare: { i: 1, n: 'stub-user-paillier-modulus' },
        backupNShare: { i: 3, n: 'stub-backup-paillier-modulus' },
      });

      async function runMpcv1Signing(txRequest: TxRequest): Promise<{ error: Error; boundary: Error }> {
        const signingWallet = new Wallet(bitgo, coin, {
          id: 'cecho-2681-wallet',
          multisigType: 'tss',
          coinSpecific: { baseAddress },
        });
        const utils = new EcdsaUtils(bitgo, coin, signingWallet);
        const boundary = new Error(signingBoundaryMessage);
        sinon.stub(utils, 'getOfflineSignerPaillierModulus').throws(boundary);
        try {
          await utils.signTxRequest({ txRequest, prv: signingMaterial, reqId: new RequestTracer() });
        } catch (e) {
          return { error: e as Error, boundary };
        }
        throw new Error('expected signTxRequest to reject');
      }

      it('verifies a matching type-0 payment from serializedTxHex and reaches the signing boundary', async function () {
        const txBytes = await buildTypedTxBytes('legacy', { to: recipient, value: '1000' });
        const { error, boundary } = await runMpcv1Signing(
          storedRequest(txBytes, [{ address: recipient, amount: '1000' }])
        );
        error.should.be.exactly(boundary);
      });

      it('rejects a mismatched type-0 payment before any signing share is produced', async function () {
        const txBytes = await buildTypedTxBytes('legacy', { to: otherRecipient, value: '1000' });
        const { error } = await runMpcv1Signing(storedRequest(txBytes, [{ address: recipient, amount: '1000' }]));
        error.should.be.instanceOf(TxIntentMismatchRecipientError);
      });

      it('rejects a type-0 payment when signableHex is tampered relative to serializedTxHex', async function () {
        const benign = await buildTypedTxBytes('legacy', { to: recipient, value: '1000' });
        const malicious = await buildTypedTxBytes('legacy', { to: otherRecipient, value: '1000' });
        const { error } = await runMpcv1Signing(
          storedRequest({ serializedTxHex: benign.serializedTxHex, signableHex: malicious.signableHex }, [
            { address: recipient, amount: '1000' },
          ])
        );
        error.message.should.match(/signableHex is inconsistent with serializedTxHex/);
      });

      it('fails closed when serializedTxHex is missing on the legacy route', async function () {
        const txBytes = await buildTypedTxBytes('legacy', { to: recipient, value: '1000' });
        const { error } = await runMpcv1Signing(
          storedRequest(txBytes, [{ address: recipient, amount: '1000' }], { serializedTxHex: '' })
        );
        error.message.should.match(/Missing serializedTxHex for transaction requiring serialized verification/);
      });

      it('keeps a matching type-2 payment on the direct signableHex route', async function () {
        const txBytes = await buildTypedTxBytes('eip1559', { to: recipient, value: '1000' });
        const verifySpy = sinon.spy(coin, 'verifyTransaction');
        const consistencySpy = sinon.spy(coin, 'assertSignableConsistency');
        const { error, boundary } = await runMpcv1Signing(
          storedRequest(txBytes, [{ address: recipient, amount: '1000' }])
        );
        error.should.be.exactly(boundary);
        verifySpy.callCount.should.eql(1);
        (verifySpy.firstCall.args[0].txPrebuild.txHex ?? '').should.eql(txBytes.signableHex);
        consistencySpy.callCount.should.eql(0);
      });
    });

    describe('MPCv2 signing entry point (EcdsaMPCv2Utils)', function () {
      const signingBoundaryMessage = 'signing boundary reached after recipient verification';

      async function runMpcv2Signing(txRequest: TxRequest): Promise<{ error: Error; boundary: Error }> {
        const signingWallet = new Wallet(bitgo, coin, {
          id: 'cecho-2681-wallet',
          multisigType: 'tss',
          multisigTypeVersion: 'MPCv2',
          coinSpecific: { baseAddress },
        });
        const utils = new EcdsaMPCv2Utils(bitgo, coin, signingWallet);
        // Avoid the remote GPG lookup; verification does not consume this key.
        const stubbableUtils = utils as unknown as Record<string, (...args: unknown[]) => Promise<string>>;
        sinon.stub(stubbableUtils, 'pickBitgoPubGpgKeyForSigning').resolves('stub-bitgo-gpg-key');
        // The MPCv2 flow hashes the verified bytes before exchanging any signature share.
        // Throwing here proves verification ran on the routed bytes and accepted the intent.
        const boundary = new Error(signingBoundaryMessage);
        sinon.stub(coin, 'getHashFunction').returns({
          update: () => {
            throw boundary;
          },
        } as unknown as Hash);
        try {
          await utils.signTxRequest({ txRequest, prv: '', reqId: new RequestTracer() });
        } catch (e) {
          return { error: e as Error, boundary };
        }
        throw new Error('expected signTxRequest to reject');
      }

      it('verifies a matching type-0 payment from serializedTxHex and reaches the signing boundary', async function () {
        const txBytes = await buildTypedTxBytes('legacy', { to: recipient, value: '1000' });
        const { error, boundary } = await runMpcv2Signing(
          storedRequest(txBytes, [{ address: recipient, amount: '1000' }])
        );
        error.should.be.exactly(boundary);
      });

      it('rejects a mismatched type-0 payment before any signing share is produced', async function () {
        const txBytes = await buildTypedTxBytes('legacy', { to: otherRecipient, value: '1000' });
        const { error } = await runMpcv2Signing(storedRequest(txBytes, [{ address: recipient, amount: '1000' }]));
        error.should.be.instanceOf(TxIntentMismatchRecipientError);
      });

      it('rejects a type-0 payment when signableHex is tampered relative to serializedTxHex', async function () {
        const benign = await buildTypedTxBytes('legacy', { to: recipient, value: '1000' });
        const malicious = await buildTypedTxBytes('legacy', { to: otherRecipient, value: '1000' });
        const { error } = await runMpcv2Signing(
          storedRequest({ serializedTxHex: benign.serializedTxHex, signableHex: malicious.signableHex }, [
            { address: recipient, amount: '1000' },
          ])
        );
        error.message.should.match(/signableHex is inconsistent with serializedTxHex/);
      });

      it('fails closed when serializedTxHex is missing on the legacy route', async function () {
        const txBytes = await buildTypedTxBytes('legacy', { to: recipient, value: '1000' });
        const { error } = await runMpcv2Signing(
          storedRequest(txBytes, [{ address: recipient, amount: '1000' }], { serializedTxHex: '' })
        );
        error.message.should.match(/Missing serializedTxHex for transaction requiring serialized verification/);
      });

      it('keeps a matching type-2 payment on the direct signableHex route', async function () {
        const txBytes = await buildTypedTxBytes('eip1559', { to: recipient, value: '1000' });
        const verifySpy = sinon.spy(coin, 'verifyTransaction');
        const consistencySpy = sinon.spy(coin, 'assertSignableConsistency');
        const { error, boundary } = await runMpcv2Signing(
          storedRequest(txBytes, [{ address: recipient, amount: '1000' }])
        );
        error.should.be.exactly(boundary);
        verifySpy.callCount.should.eql(1);
        (verifySpy.firstCall.args[0].txPrebuild.txHex ?? '').should.eql(txBytes.signableHex);
        consistencySpy.callCount.should.eql(0);
      });
    });
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
