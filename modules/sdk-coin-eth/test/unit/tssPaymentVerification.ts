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
  resolveEffectiveTxParams,
  TransactionType,
  TxIntentMismatchRecipientError,
  TxRequest,
  Wallet,
} from '@bitgo/sdk-core';
import { AbstractEthLikeNewCoins, TransferBuilderERC7984 } from '@bitgo/abstract-eth';
import { BaseCoin as StaticsBaseCoin, CoinFeature, coins, Erc7984Coin, EthereumNetwork } from '@bitgo/statics';
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

  // CECHO-2680 / INFOSEC-671: contractCall and customTx (both spellings) are verified against a
  // single declared recipient instead of returning true unchecked.
  describe('contractCall / customTx verification', function () {
    const callData = calldata('deposit', ['uint256', 'address'], ['5', baseAddress]);

    for (const type of ['contractCall', 'contract-call', 'customTx', 'custom-tx']) {
      it(`verifies a matching ${type} call`, async function () {
        const txHex = await buildTx({ to: otherRecipient, value: '0', data: callData });
        const txParams = { type, recipients: [{ address: otherRecipient, amount: '0', data: callData }] };
        (await verify(txParams, txHex)).should.be.true();
        warn.called.should.be.false();
      });

      it(`rejects a ${type} call to a different destination`, async function () {
        const txHex = await buildTx({ to: recipient, value: '0', data: callData });
        const txParams = { type, recipients: [{ address: otherRecipient, amount: '0', data: callData }] };
        await expectMismatch(verify(txParams, txHex), /destination address does not match/);
      });

      it(`rejects a ${type} call with a different native value`, async function () {
        const txHex = await buildTx({ to: otherRecipient, value: '1', data: callData });
        const txParams = { type, recipients: [{ address: otherRecipient, amount: '0', data: callData }] };
        await expectMismatch(verify(txParams, txHex), /amount in txPrebuild does not match/);
      });

      it(`rejects a ${type} call with different calldata`, async function () {
        const txHex = await buildTx({ to: otherRecipient, value: '0', data: callData });
        const declared = calldata('deposit', ['uint256', 'address'], ['6', baseAddress]);
        const txParams = { type, recipients: [{ address: otherRecipient, amount: '0', data: declared }] };
        await expectMismatch(verify(txParams, txHex), /calldata does not match/);
      });

      it(`rejects a ${type} with no recipients`, async function () {
        const txHex = await buildTx({ to: otherRecipient, value: '1' });
        await expectMismatch(verify({ type }, txHex), /requires a declared recipient/);
        await expectMismatch(verify({ type, recipients: [] }, txHex), /requires a declared recipient/);
      });

      it(`rejects a ${type} with more than one recipient`, async function () {
        const txHex = await buildTx({ to: otherRecipient, value: '0', data: callData });
        const txParams = {
          type,
          recipients: [
            { address: otherRecipient, amount: '0', data: callData },
            { address: recipient, amount: '0', data: callData },
          ],
        };
        await expectMismatch(verify(txParams, txHex), /must declare a single recipient/);
      });
    }

    it('defaults a contractCall value to 0 and empty calldata when the intent declares neither', async function () {
      const txHex = await buildTx({ to: otherRecipient, value: '0' });
      (await verify({ type: 'contractCall', recipients: [{ address: otherRecipient }] }, txHex)).should.be.true();
    });

    it('rejects a contractCall whose tx carries value the intent did not declare', async function () {
      const txHex = await buildTx({ to: otherRecipient, value: '1' });
      await expectMismatch(
        verify({ type: 'contractCall', recipients: [{ address: otherRecipient }] }, txHex),
        /amount in txPrebuild does not match/
      );
    });

    // The builder drops calldata shorter than a 4-byte selector when it reserializes, so the check
    // must read the original signed bytes, not a rebuilt copy.
    it('rejects a contractCall whose signed bytes carry sub-selector calldata the intent did not declare', async function () {
      const common = AbstractEthLikeNewCoins.getCustomChainCommon(coin.getChainId());
      const tx = FeeMarketEIP1559Transaction.fromTxData(
        {
          nonce: 1,
          maxPriorityFeePerGas: 10,
          maxFeePerGas: 100,
          gasLimit: 100000,
          to: otherRecipient,
          value: 0,
          data: '0x01',
          chainId: coin.getChainId(),
        },
        { common }
      );
      const txHex = '0x' + tx.serialize().toString('hex');
      await expectMismatch(
        verify({ type: 'contractCall', recipients: [{ address: otherRecipient, amount: '0' }] }, txHex),
        /calldata does not match/
      );
      (
        await verify(
          { type: 'contractCall', recipients: [{ address: otherRecipient, amount: '0', data: '0x01' }] },
          txHex
        )
      ).should.be.true();
    });
  });

  describe('other intents', function () {
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
      it(`verifies a stored confidential payment from ${route} and warns only about the encrypted amount`, async function () {
        const request = storedPaymentRequest(
          confidentialRecipient,
          { value: confidentialSendAmount, symbol: confidentialToken },
          confidentialTransferBytes()
        );
        const { error, boundary } = await runSigning(request, useSerializedTxHex);
        error.should.be.exactly(boundary);
        // The calldata is now verified; only the encrypted amount is unverifiable.
        warned(/encrypted amount cannot be verified/).should.be.true();
        warned(/the payment calldata was not verified/).should.be.false();
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

  describe('consolidation recognised from the declared intent', function () {
    // No `consolidationToBaseAddress`: the declared intent type or a consolidateId alone must
    // trigger the same sweep check.
    function verifyWith(
      target: Wallet,
      txParams: Record<string, unknown>,
      txHex: string,
      prebuildExtra: Record<string, unknown> = {},
      verification = {}
    ) {
      return coin.verifyTransaction({
        txParams: { wallet: target, ...txParams } as never,
        txPrebuild: { txHex, coin: 'hteth', walletId: 'fakeWalletId', ...prebuildExtra } as never,
        wallet: target,
        verification,
        walletType: 'tss',
      });
    }

    const maxUint256 = '115792089237316195423570985008687907853269984665640564039457584007913129639935';

    for (const type of ['consolidate', 'consolidateToken', 'consolidate-token']) {
      it(`rejects approve(attacker, MAX) declared as ${type} without the flag`, async function () {
        const data = calldata('approve', ['address', 'uint256'], [otherRecipient, maxUint256]);
        const txHex = await buildTx({ to: tokenContract, data });
        await expectMismatch(verify({ type }, txHex), /does not match wallet base address/);
      });
    }

    it('rejects approve(attacker, MAX) when only a consolidateId is present', async function () {
      const data = calldata('approve', ['address', 'uint256'], [otherRecipient, maxUint256]);
      const txHex = await buildTx({ to: tokenContract, data });
      await expectMismatch(
        verifyWith(wallet, {}, txHex, { consolidateId: 'cid' }),
        /does not match wallet base address/
      );
    });

    it('rejects a native sweep to a non-base address declared as consolidate', async function () {
      const txHex = await buildTx({ to: otherRecipient, value: '1000' });
      await expectMismatch(verify({ type: 'consolidate' }, txHex), /does not match wallet base address/);
    });

    it('rejects calldata on a native sweep without the flag', async function () {
      const data = calldata('approve', ['address', 'uint256'], [recipient, '1']);
      const txHex = await buildTx({ to: baseAddress, value: '1000', data });
      await expectMismatch(verify({ type: 'consolidate' }, txHex), /must not carry calldata/);
    });

    it('rejects short non-empty calldata on a native sweep', async function () {
      // Under 4 bytes of calldata: the TransactionBuilder reclassifies this as a native send and
      // rebuilds it with empty calldata, so the check must read the serialized transaction.
      const txHex = await buildTx({ to: baseAddress, value: '1000', data: '0x1234' });
      await expectMismatch(verify({ type: 'consolidate' }, txHex), /must not carry calldata/);
    });

    it('rejects a truncated ERC-20 transfer as a recipient mismatch', async function () {
      // Selector plus four bytes: starts with transfer(address,uint256) but cannot be decoded.
      const truncated = erc20Transfer(baseAddress, '1').slice(0, 18);
      const txHex = await buildTx({ to: tokenContract, data: truncated });
      await expectMismatch(verify({ type: 'consolidateToken', tokenName }, txHex), /not a canonical ERC-20 transfer/);
    });

    it('uses the top-level consolidateId when the nested one is empty', async function () {
      const data = calldata('approve', ['address', 'uint256'], [otherRecipient, maxUint256]);
      const txHex = await buildTx({ to: tokenContract, data });
      await expectMismatch(
        verifyWith(wallet, { prebuildTx: { consolidateId: '' } }, txHex, { consolidateId: 'cid' }),
        /does not match wallet base address/
      );
    });

    it('rejects an ERC-20 sweep carrying native value without the flag', async function () {
      const txHex = await buildTx({ to: tokenContract, value: '1', data: erc20Transfer(baseAddress, '1') });
      await expectMismatch(verify({ type: 'consolidateToken', tokenName }, txHex), /must not carry native value/);
    });

    it('verifies a native sweep declared as consolidate', async function () {
      const txHex = await buildTx({ to: baseAddress, value: '1000' });
      (await verify({ type: 'consolidate' }, txHex)).should.be.true();
    });

    it('verifies an ERC-20 sweep declared as consolidate-token', async function () {
      const txHex = await buildTx({ to: tokenContract, data: erc20Transfer(baseAddress, '123') });
      (await verify({ type: 'consolidate-token', tokenName }, txHex)).should.be.true();
    });

    it('warns instead of throwing when the wallet has no base address on the intent path', async function () {
      const noBaseWallet = new Wallet(bitgo, coin, { coinSpecific: {} });
      const txHex = await buildTx({ to: recipient, value: '1' });
      (await verifyWith(noBaseWallet, { type: 'consolidate' }, txHex)).should.be.true();
      warned(/wallet has no base address/).should.be.true();
    });

    it('throws when the wallet has no base address and the flag is set', async function () {
      const noBaseWallet = new Wallet(bitgo, coin, { coinSpecific: {} });
      const txHex = await buildTx({ to: recipient, value: '1' });
      await verifyWith(
        noBaseWallet,
        { type: 'consolidate' },
        txHex,
        {},
        { consolidationToBaseAddress: true }
      ).should.be.rejectedWith('Unable to determine base address for consolidation');
    });

    it('does not turn a declared payment into a sweep when a consolidateId is present', async function () {
      const txHex = await buildTx({ to: recipient, value: '1000' });
      const result = await verifyWith(
        wallet,
        { type: 'transfer', recipients: [{ address: recipient, amount: '1000' }] },
        txHex,
        { consolidateId: 'cid' }
      );
      result.should.be.true();
    });

    it('still verifies the payment destination when a consolidateId is present', async function () {
      const txHex = await buildTx({ to: baseAddress, value: '1000' });
      await expectMismatch(
        verifyWith(wallet, { type: 'transfer', recipients: [{ address: recipient, amount: '1000' }] }, txHex, {
          consolidateId: 'cid',
        }),
        /destination address does not match/
      );
    });
  });

  // CECHO-2689: tokenApproval must be verified, not merely warned about. Expected shape is
  // approve(batcher, MAX_UINT256) on the declared token contract with zero native value.
  describe('tokenApproval verification', function () {
    const approveData = (spender: string, amount: string) =>
      calldata('approve', ['address', 'uint256'], [spender, amount]);
    const maxUint256 = ((1n << 256n) - 1n).toString();
    const approvalIntent = (declaredToken: string | undefined) => ({
      type: 'tokenApproval',
      ...(declaredToken === undefined ? {} : { tokenName: declaredToken }),
    });

    it('verifies approve(batcher, MAX_UINT256) on the declared token contract', async function () {
      const txHex = await buildTx({ to: tokenContract, data: approveData(batcher, maxUint256) });
      (await verify(approvalIntent(tokenName), txHex)).should.be.true();
      warn.called.should.be.false();
    });

    it('rejects an approval on a different token contract', async function () {
      const txHex = await buildTx({ to: otherTokenContract, data: approveData(batcher, maxUint256) });
      await expectMismatch(verify(approvalIntent(tokenName), txHex), /not sent to the declared token contract/);
    });

    it('rejects approve() of an attacker spender', async function () {
      const txHex = await buildTx({ to: tokenContract, data: approveData(otherRecipient, maxUint256) });
      await expectMismatch(verify(approvalIntent(tokenName), txHex), /spender does not match the network batcher/);
    });

    it('rejects a finite approval amount', async function () {
      const txHex = await buildTx({ to: tokenContract, data: approveData(batcher, '1000') });
      await expectMismatch(verify(approvalIntent(tokenName), txHex), /must be MAX_UINT256/);
    });

    it('rejects native value on an approval', async function () {
      const txHex = await buildTx({ to: tokenContract, value: '1', data: approveData(batcher, maxUint256) });
      await expectMismatch(verify(approvalIntent(tokenName), txHex), /must not carry native value/);
    });

    it('rejects a non-approve selector', async function () {
      const txHex = await buildTx({ to: tokenContract, data: erc20Transfer(recipient, '1000') });
      await expectMismatch(verify(approvalIntent(tokenName), txHex), /must use ERC-20 approve/);
    });

    it('rejects trailing bytes after the approve arguments', async function () {
      const txHex = await buildTx({
        to: tokenContract,
        data: approveData(batcher, maxUint256) + '00'.repeat(32),
      });
      await expectMismatch(verify(approvalIntent(tokenName), txHex), /not canonical/);
    });

    it('rejects a tokenApproval with no declared token', async function () {
      const txHex = await buildTx({ to: tokenContract, data: approveData(batcher, maxUint256) });
      await expectMismatch(verify(approvalIntent(undefined), txHex), /requires a declared tokenName/);
    });

    it('rejects a token that cannot be resolved on this network', async function () {
      const txHex = await buildTx({ to: tokenContract, data: approveData(batcher, maxUint256) });
      await expectMismatch(
        verify(approvalIntent('hteth:notatoken'), txHex),
        /cannot be resolved to a contract on this network/
      );
    });

    it('still rejects approve(wrapper, MAX) relabelled as tokenApproval', async function () {
      const pair = coins.get('hteth:cusdt') as Erc7984Coin;
      const txHex = await buildTx({
        to: String(pair.underlyingErc20Address),
        data: approveData(String(pair.contractAddress), maxUint256),
      });
      await expectMismatch(verify(approvalIntent('hteth:cusdt'), txHex), /must be declared as a wrapApprove intent/);
    });
  });

  // CECHO-2689 (Nov 19): a payment of an ERC-7984 token must use confidentialTransfer and name the
  // declared recipient, token contract and zero native value. The encrypted amount stays a warning.
  describe('ERC-7984 confidential payment verification', function () {
    const confidentialToken = 'hteth:ctest1';
    const confidentialContract = String((coins.get(confidentialToken) as Erc7984Coin).contractAddress);
    const encryptedHandle = '0x' + 'ab'.repeat(32);
    const inputProof = '0x' + 'cd'.repeat(50);
    const confidentialIntent = (address: string) => ({
      type: 'payment',
      recipients: [{ address, amount: '1000000', tokenName: confidentialToken }],
    });
    const confidentialTransferTo = (to: string) =>
      new TransferBuilderERC7984()
        .to(to)
        .tokenContractAddress(confidentialContract)
        .encryptedHandle(encryptedHandle)
        .inputProof(inputProof)
        .build();

    it('verifies a confidentialTransfer to the declared recipient on the declared token', async function () {
      const txHex = await buildTx({ to: confidentialContract, data: confidentialTransferTo(recipient) });
      (await verify(confidentialIntent(recipient), txHex)).should.be.true();
      warned(/encrypted amount cannot be verified/).should.be.true();
    });

    it('enforces confidentialTransfer when the recipient supplies explicit calldata', async function () {
      // A declared ERC-7984 payment must not skip the confidential-transfer checks by presenting
      // caller-authored explicit calldata: the ERC-7984 rules run before the generic explicit branch.
      const attack = calldata('approve', ['address', 'uint256'], [otherRecipient, '1']);
      const txHex = await buildTx({ to: confidentialContract, data: attack });
      const intent = {
        type: 'payment',
        recipients: [{ address: confidentialContract, amount: '0', tokenName: confidentialToken, data: attack }],
      };
      await expectMismatch(verify(intent, txHex), /must use confidentialTransfer/);
    });

    it('rejects approve(attacker, MAX) relabelled as a confidential payment', async function () {
      const attack = calldata(
        'approve',
        ['address', 'uint256'],
        [otherRecipient, '115792089237316195423570985008687907853269984665640564039457584007913129639935']
      );
      const txHex = await buildTx({ to: confidentialContract, data: attack });
      await expectMismatch(verify(confidentialIntent(recipient), txHex), /must use confidentialTransfer/);
    });

    it('rejects a confidentialTransfer to a different recipient', async function () {
      const txHex = await buildTx({ to: confidentialContract, data: confidentialTransferTo(otherRecipient) });
      await expectMismatch(verify(confidentialIntent(recipient), txHex), /destination address does not match/);
    });

    it('rejects a confidentialTransfer sent to a different token contract', async function () {
      const txHex = await buildTx({ to: otherTokenContract, data: confidentialTransferTo(recipient) });
      await expectMismatch(verify(confidentialIntent(recipient), txHex), /not sent to the declared token contract/);
    });

    it('rejects native value on a confidential payment', async function () {
      const txHex = await buildTx({ to: confidentialContract, value: '1', data: confidentialTransferTo(recipient) });
      await expectMismatch(verify(confidentialIntent(recipient), txHex), /must not carry native value/);
    });

    it('rejects trailing bytes after the confidentialTransfer arguments', async function () {
      const txHex = await buildTx({
        to: confidentialContract,
        data: confidentialTransferTo(recipient) + '00'.repeat(32),
      });
      await expectMismatch(verify(confidentialIntent(recipient), txHex), /not canonical/);
    });

    it('rejects a batch that names an ERC-7984 token', async function () {
      const txHex = await buildTx({
        to: batcher,
        data: tokenBatch(confidentialContract, [recipient, otherRecipient], ['100', '200']),
      });
      const intent = {
        type: 'transfer',
        recipients: [
          { address: recipient, amount: '100', tokenName: confidentialToken },
          { address: otherRecipient, amount: '200', tokenName: confidentialToken },
        ],
      };
      await expectMismatch(verify(intent, txHex), /cannot be paid through a batch/);
    });
  });

  // Stored-intent signing carries no caller txParams, so the token survives only in the persisted
  // intent. Both MPC versions must still verify the approval (tokenName propagation).
  describe('stored tokenApproval intent without caller txParams', function () {
    const approvalToken = tokenName;
    const approvalTokenContract = tokenContract;
    const maxUint256 = ((1n << 256n) - 1n).toString();
    const signingBoundaryMessage = 'signing boundary reached after intent verification';
    const signingMaterial = JSON.stringify({
      pShare: { i: 1, n: 'stub-user-paillier-modulus' },
      backupNShare: { i: 3, n: 'stub-backup-paillier-modulus' },
    });

    function approvalBytes(spender: string) {
      const common = AbstractEthLikeNewCoins.getCustomChainCommon(coin.getChainId());
      const tx = FeeMarketEIP1559Transaction.fromTxData(
        {
          nonce: 1,
          maxPriorityFeePerGas: 10,
          maxFeePerGas: 100,
          gasLimit: 200000,
          to: approvalTokenContract,
          value: 0,
          data: calldata('approve', ['address', 'uint256'], [spender, maxUint256]),
          chainId: coin.getChainId(),
        },
        { common }
      );
      return {
        signableHex: tx.getMessageToSign(false).toString('hex'),
        serializedTxHex: tx.serialize().toString('hex'),
      };
    }

    function storedApprovalRequest(txBytes: { signableHex: string; serializedTxHex: string }): TxRequest {
      return {
        txRequestId: 'stored-token-approval',
        apiVersion: 'full',
        walletId: 'storedApprovalWallet',
        intent: { intentType: 'tokenApproval', tokenName: approvalToken },
        transactions: [{ unsignedTx: { derivationPath: 'm/0', ...txBytes }, signatureShares: [] }],
      } as unknown as TxRequest;
    }

    async function runMpcv2(
      txRequest: TxRequest,
      useSerializedTxHex: boolean
    ): Promise<{ error: Error; boundary: Error }> {
      const signingWallet = new Wallet(bitgo, coin, {
        id: 'storedApprovalWallet',
        multisigType: 'tss',
        multisigTypeVersion: 'MPCv2',
        coinSpecific: { baseAddress },
      });
      const utils = new EcdsaMPCv2Utils(bitgo, coin, signingWallet);
      sinon
        .stub(utils as unknown as Record<string, () => Promise<string>>, 'pickBitgoPubGpgKeyForSigning')
        .resolves('stubbed-gpg-key');

      const baseConfig = coin.getConfig();
      const features = baseConfig.features.filter((f) => f !== CoinFeature.TSS_VERIFY_USE_SERIALIZED_TX_HEX);
      sinon.stub(coin, 'getConfig').returns({
        ...baseConfig,
        features: useSerializedTxHex ? [...features, CoinFeature.TSS_VERIFY_USE_SERIALIZED_TX_HEX] : features,
      } as unknown as Readonly<StaticsBaseCoin>);

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

    async function runMpcv1(
      txRequest: TxRequest,
      useSerializedTxHex: boolean
    ): Promise<{ error: Error; boundary: Error }> {
      const signingWallet = new Wallet(bitgo, coin, {
        id: 'storedApprovalWallet',
        multisigType: 'tss',
        coinSpecific: { baseAddress },
      });
      const utils = new EcdsaUtils(bitgo, coin, signingWallet);
      const baseConfig = coin.getConfig();
      const features = baseConfig.features.filter((f) => f !== CoinFeature.TSS_VERIFY_USE_SERIALIZED_TX_HEX);
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

    const routes = [
      { route: 'signableHex', useSerializedTxHex: false },
      { route: 'serializedTxHex', useSerializedTxHex: true },
    ];

    for (const { route, useSerializedTxHex } of routes) {
      it(`verifies a stored approval from ${route} (MPCv2)`, async function () {
        const { error, boundary } = await runMpcv2(storedApprovalRequest(approvalBytes(batcher)), useSerializedTxHex);
        error.should.be.exactly(boundary);
        warn.called.should.be.false();
      });

      it(`verifies a stored approval from ${route} (MPCv1)`, async function () {
        const { error, boundary } = await runMpcv1(storedApprovalRequest(approvalBytes(batcher)), useSerializedTxHex);
        error.should.be.exactly(boundary);
        warn.called.should.be.false();
      });

      it(`rejects a stored approval naming an attacker spender from ${route} (MPCv2)`, async function () {
        const { error } = await runMpcv2(storedApprovalRequest(approvalBytes(otherRecipient)), useSerializedTxHex);
        error.should.be.instanceOf(TxIntentMismatchRecipientError);
        error.message.should.match(/spender does not match the network batcher/);
      });
    }
  });

  // CECHO-2690: fillNonce must be a plain self-send (no calldata) to the wallet address with value 0 or 1 wei.
  describe('fillNonce verification', function () {
    it('verifies a prod-shaped fillNonce self-send (1 wei, empty calldata, to == baseAddress)', async function () {
      const txHex = await buildTx({ to: baseAddress, value: '1' });
      (await verify({ type: 'fillNonce' }, txHex)).should.be.true();
      warn.called.should.be.false();
    });

    it('verifies a 0 wei fillNonce self-send', async function () {
      const txHex = await buildTx({ to: baseAddress, value: '0' });
      (await verify({ type: 'fillNonce' }, txHex)).should.be.true();
    });

    it('ignores a caller-declared receiveAddress and still requires the wallet base address', async function () {
      // Every production fillNonce row is a self-send (senderAddressIndex 0 to baseAddress); a
      // caller-supplied address must never redirect the filler.
      const txHex = await buildTx({ to: recipient, value: '1' });
      await expectMismatch(
        verify({ type: 'fillNonce', receiveAddress: recipient }, txHex),
        /destination does not match wallet base address/
      );
    });

    it('rejects a fillNonce sent to an address other than the wallet address', async function () {
      const txHex = await buildTx({ to: otherRecipient, value: '1' });
      await expectMismatch(verify({ type: 'fillNonce' }, txHex), /destination does not match wallet base address/);
    });

    it('verifies a declared nonce that matches and rejects any other nonce', async function () {
      const txHex = await buildTx({ to: baseAddress, value: '1' });
      // buildTx increments to counter 1, so the signed nonce is 1.
      (await verify({ type: 'fillNonce', nonce: '1' }, txHex)).should.be.true();
      (await verify({ type: 'fillNonce', nonce: 1 }, txHex)).should.be.true();
      await expectMismatch(
        verify({ type: 'fillNonce', nonce: '2' }, txHex),
        /nonce 1 does not match the declared nonce 2/
      );
      await expectMismatch(
        verify({ type: 'fillNonce', nonce: 'abc' }, txHex),
        /declared nonce must be a non-negative integer/
      );
    });

    it('enforces numeric stored nonce 0 through resolveEffectiveTxParams reconstruction', async function () {
      const common = AbstractEthLikeNewCoins.getCustomChainCommon(coin.getChainId());
      const buildWithNonce = (nonce: number) => {
        const tx = FeeMarketEIP1559Transaction.fromTxData(
          {
            nonce,
            maxPriorityFeePerGas: 10,
            maxFeePerGas: 100,
            gasLimit: 21000,
            to: baseAddress,
            value: 1,
            data: '0x',
            chainId: coin.getChainId(),
          },
          { common }
        );
        return '0x' + tx.serialize().toString('hex');
      };

      const txParams = resolveEffectiveTxParams(
        {
          txRequestId: 'stored-fill-nonce-zero',
          walletId: 'fakeWalletId',
          intent: { intentType: 'fillNonce', nonce: 0 },
        } as unknown as TxRequest,
        undefined,
        'hteth'
      );
      String(txParams.nonce).should.equal('0');

      (await verify(txParams as Record<string, unknown>, buildWithNonce(0))).should.be.true();
      await expectMismatch(
        verify(txParams as Record<string, unknown>, buildWithNonce(1)),
        /nonce 1 does not match the declared nonce 0/
      );
    });

    it('rejects a fillNonce carrying calldata (including sub-selector raw bytes)', async function () {
      const txHex = await buildTx({ to: baseAddress, value: '1', data: erc20Transfer(otherRecipient, '100') });
      await expectMismatch(verify({ type: 'fillNonce' }, txHex), /must not carry calldata/);

      const common = AbstractEthLikeNewCoins.getCustomChainCommon(coin.getChainId());
      const subSelectorTx = FeeMarketEIP1559Transaction.fromTxData(
        {
          nonce: 1,
          maxPriorityFeePerGas: 10,
          maxFeePerGas: 100,
          gasLimit: 21000,
          to: baseAddress,
          value: 1,
          data: '0x01',
          chainId: coin.getChainId(),
        },
        { common }
      );
      await expectMismatch(
        verify({ type: 'fillNonce' }, '0x' + subSelectorTx.serialize().toString('hex')),
        /must not carry calldata/
      );
    });

    it('rejects a fillNonce with value greater than 1 wei', async function () {
      const txHex = await buildTx({ to: baseAddress, value: '2' });
      await expectMismatch(verify({ type: 'fillNonce' }, txHex), /value must be 0 or 1 wei/);
    });

    it('rejects a fillNonce when the wallet has no baseAddress and no receiveAddress is declared', async function () {
      const noBaseWallet = new Wallet(bitgo, coin, { coinSpecific: {} });
      const txHex = await buildTx({ to: baseAddress, value: '1' });
      await expectMismatch(
        coin.verifyTransaction({
          txParams: { type: 'fillNonce' } as never,
          txPrebuild: { txHex, coin: 'hteth', walletId: 'fakeWalletId' } as never,
          wallet: noBaseWallet,
          verification: {},
          walletType: 'tss',
        }),
        /requires a wallet base address/
      );
    });
  });

  // CECHO-2690: transferToken ERC-20 fails closed (coordinated with COINS-2263 amount semantics);
  // ERC-721 / ERC-1155 NFT transferToken stays warn-only while enforcing canonical NFT calldata and value == 0.
  describe('transferToken verification', function () {
    const nftContract = '0x5df4076613e714a4cc4284abac87caa927b918a8';
    const erc721Safe3 = (from: string, to: string, tokenId: string) =>
      calldata('safeTransferFrom', ['address', 'address', 'uint256'], [from, to, tokenId]);
    const erc1155Safe = (from: string, to: string, tokenId: string, qty: string) =>
      calldata(
        'safeTransferFrom',
        ['address', 'address', 'uint256', 'uint256', 'bytes'],
        [from, to, tokenId, qty, Buffer.alloc(0)]
      );
    const erc20TransferFrom = (from: string, to: string, qty: string) =>
      calldata('transferFrom', ['address', 'address', 'uint256'], [from, to, qty]);

    for (const type of ['transferToken', 'transfertoken']) {
      it(`verifies prod eth/arbeth shape (${type}, amount='0' placeholder + tokenData.tokenQuantity)`, async function () {
        const txHex = await buildTx({ to: tokenContract, data: erc20Transfer(recipient, '1000000') });
        const txParams = {
          type,
          recipients: [
            {
              address: recipient,
              amount: '0',
              tokenData: {
                tokenType: 'ERC20',
                tokenQuantity: '1000000',
                tokenName,
                tokenContractAddress: tokenContract,
              },
            },
          ],
        };
        (await verify(txParams, txHex)).should.be.true();
        warn.called.should.be.false();
      });
    }

    it('verifies prod bsc/polygon shape (amount === tokenData.tokenQuantity)', async function () {
      const txHex = await buildTx({ to: tokenContract, data: erc20Transfer(recipient, '500000') });
      const txParams = {
        type: 'transferToken',
        recipients: [
          {
            address: recipient,
            amount: '500000',
            tokenName,
            tokenData: { tokenType: 'ERC20', tokenQuantity: '500000', tokenName },
          },
        ],
      };
      (await verify(txParams, txHex)).should.be.true();
      warn.called.should.be.false();
    });

    it('verifies contract-only ERC-20 transferToken resolved through @bitgo/statics', async function () {
      const txHex = await buildTx({ to: tokenContract, data: erc20Transfer(recipient, '250') });
      const txParams = {
        type: 'transferToken',
        recipients: [
          {
            address: recipient,
            amount: '250',
            tokenData: { tokenType: 'ERC20', tokenQuantity: '250', tokenContractAddress: tokenContract },
          },
        ],
      };
      (await verify(txParams, txHex)).should.be.true();
    });

    it('rejects amount vs tokenData.tokenQuantity spoofing (COINS-2263)', async function () {
      const txHex = await buildTx({ to: tokenContract, data: erc20Transfer(recipient, '1000000') });
      const txParams = {
        type: 'transferToken',
        recipients: [
          {
            address: recipient,
            amount: '3',
            tokenData: { tokenType: 'ERC20', tokenQuantity: '1000000', tokenName },
          },
        ],
      };
      await expectMismatch(verify(txParams, txHex), /does not match tokenData\.tokenQuantity/);
    });

    it('rejects non-integer tokenQuantity', async function () {
      const txHex = await buildTx({ to: tokenContract, data: erc20Transfer(recipient, '100') });
      const txParams = {
        type: 'transferToken',
        recipients: [
          {
            address: recipient,
            amount: '0',
            tokenData: { tokenType: 'ERC20', tokenQuantity: '1.5', tokenName },
          },
        ],
      };
      await expectMismatch(verify(txParams, txHex), /tokenQuantity must be a non-negative integer/);
    });

    it('rejects recipient, amount, contract, native value, selector, trailing bytes, and missing/multiple recipients', async function () {
      const baseIntent = {
        type: 'transferToken',
        recipients: [
          {
            address: recipient,
            amount: '0',
            tokenData: { tokenType: 'ERC20', tokenQuantity: '1000', tokenName },
          },
        ],
      };

      await expectMismatch(
        verify(baseIntent, await buildTx({ to: tokenContract, data: erc20Transfer(otherRecipient, '1000') })),
        /destination address does not match/
      );
      await expectMismatch(
        verify(baseIntent, await buildTx({ to: tokenContract, data: erc20Transfer(recipient, '999') })),
        /does not match the declared token amount/
      );
      await expectMismatch(
        verify(baseIntent, await buildTx({ to: otherTokenContract, data: erc20Transfer(recipient, '1000') })),
        /not sent to the declared token contract/
      );
      await expectMismatch(
        verify(baseIntent, await buildTx({ to: tokenContract, value: '1', data: erc20Transfer(recipient, '1000') })),
        /must not carry native value/
      );
      await expectMismatch(
        verify(
          baseIntent,
          await buildTx({
            to: tokenContract,
            data: calldata('approve', ['address', 'uint256'], [otherRecipient, '1000']),
          })
        ),
        /must use ERC-20 transfer/
      );
      await expectMismatch(
        verify(
          baseIntent,
          await buildTx({ to: tokenContract, data: erc20Transfer(recipient, '1000') + '00'.repeat(32) })
        ),
        /not canonical/
      );
      await expectMismatch(
        verify(
          { type: 'transferToken', recipients: [] },
          await buildTx({ to: tokenContract, data: erc20Transfer(recipient, '1000') })
        ),
        /must declare a single recipient/
      );
      await expectMismatch(
        verify(
          {
            type: 'transferToken',
            recipients: [
              { address: recipient, amount: '1000', tokenName },
              { address: otherRecipient, amount: '1000', tokenName },
            ],
          },
          await buildTx({ to: tokenContract, data: erc20Transfer(recipient, '1000') })
        ),
        /must declare a single recipient/
      );
    });

    it('fails closed when the ERC-20 token cannot be resolved in @bitgo/statics', async function () {
      const txHex = await buildTx({ to: otherTokenContract, data: erc20Transfer(recipient, '1000') });
      await expectMismatch(
        verify(
          {
            type: 'transferToken',
            recipients: [
              {
                address: recipient,
                amount: '0',
                tokenData: { tokenType: 'ERC20', tokenQuantity: '1000', tokenName: 'hteth:notatoken' },
              },
            ],
          },
          txHex
        ),
        /cannot be resolved to a contract on this network/
      );
    });

    it('rejects mismatched declared tokenContractAddress vs registered statics contract', async function () {
      const txHex = await buildTx({ to: tokenContract, data: erc20Transfer(recipient, '1000') });
      await expectMismatch(
        verify(
          {
            type: 'transferToken',
            recipients: [
              {
                address: recipient,
                amount: '0',
                tokenData: {
                  tokenType: 'ERC20',
                  tokenQuantity: '1000',
                  tokenName,
                  tokenContractAddress: otherTokenContract,
                },
              },
            ],
          },
          txHex
        ),
        /declared tokenContractAddress does not match/
      );
    });

    it('warns on ERC-721 and ERC-1155 NFT transferToken with canonical safeTransferFrom and value == 0', async function () {
      const erc721Tx = await buildTx({ to: nftContract, data: erc721Safe3(baseAddress, recipient, '42') });
      (
        await verify(
          {
            type: 'transferToken',
            recipients: [
              {
                address: recipient,
                amount: '0',
                tokenData: {
                  tokenType: 'ERC721',
                  tokenQuantity: '1',
                  tokenId: '42',
                  tokenContractAddress: nftContract,
                },
              },
            ],
          },
          erc721Tx
        )
      ).should.be.true();
      warned(/NFT token transfer \(ERC721\)/).should.be.true();

      warn.resetHistory();
      const erc1155Tx = await buildTx({ to: nftContract, data: erc1155Safe(baseAddress, recipient, '7', '3') });
      (
        await verify(
          {
            type: 'transferToken',
            recipients: [
              {
                address: recipient,
                amount: '0',
                tokenData: {
                  tokenType: 'ERC1155',
                  tokenQuantity: '3',
                  tokenId: '7',
                  tokenContractAddress: nftContract,
                },
              },
            ],
          },
          erc1155Tx
        )
      ).should.be.true();
      warned(/NFT token transfer \(ERC1155\)/).should.be.true();
    });

    it('rejects NFT transferToken smuggling nonzero native value, wrong contract, or ERC-20 transferFrom on non-Hedera chains', async function () {
      const erc721Intent = {
        type: 'transferToken',
        recipients: [
          {
            address: recipient,
            amount: '0',
            tokenData: {
              tokenType: 'ERC721',
              tokenQuantity: '1',
              tokenId: '42',
              tokenContractAddress: nftContract,
            },
          },
        ],
      };

      await expectMismatch(
        verify(
          erc721Intent,
          await buildTx({ to: nftContract, value: '1', data: erc721Safe3(baseAddress, recipient, '42') })
        ),
        /must not carry native value/
      );
      await expectMismatch(
        verify(
          erc721Intent,
          await buildTx({ to: otherTokenContract, data: erc721Safe3(baseAddress, recipient, '42') })
        ),
        /not sent to the declared contract/
      );
      await expectMismatch(
        verify(erc721Intent, await buildTx({ to: tokenContract, data: erc20Transfer(otherRecipient, '999999') })),
        /canonical NFT safeTransferFrom/
      );
      // ERC-20 transferFrom shares selector 0x23b872dd — must NEVER bypass on non-Hedera chains
      await expectMismatch(
        verify(
          erc721Intent,
          await buildTx({ to: nftContract, data: erc20TransferFrom(baseAddress, otherRecipient, '999999') })
        ),
        /canonical NFT safeTransferFrom/
      );
      await expectMismatch(
        verify(
          { type: 'transferToken', recipients: [{ address: recipient, amount: '0' }] },
          await buildTx({ to: tokenContract, data: erc20TransferFrom(baseAddress, otherRecipient, '999999') })
        ),
        /requires a declared ERC-20 token/
      );
    });

    it('binds the NFT decoded recipient to the declared recipient', async function () {
      // The tokenId/quantity stays warn-only, but the signed destination must still be the declared one.
      const erc721Intent = {
        type: 'transferToken',
        recipients: [
          {
            address: recipient,
            amount: '0',
            tokenData: { tokenType: 'ERC721', tokenQuantity: '1', tokenId: '42', tokenContractAddress: nftContract },
          },
        ],
      };
      await expectMismatch(
        verify(erc721Intent, await buildTx({ to: nftContract, data: erc721Safe3(baseAddress, otherRecipient, '42') })),
        /NFT transferToken destination address does not match the recipient address/
      );
      // A matching calldata recipient still verifies (with the warning) so the binding is not over-tight.
      (
        await verify(erc721Intent, await buildTx({ to: nftContract, data: erc721Safe3(baseAddress, recipient, '42') }))
      ).should.be.true();
    });
  });

  // CECHO-2690 P0: a stored transferToken intent keeps tokenData (tokenQuantity / tokenType / contract);
  // the sdk-core reconstruction must carry it into verifyTssTransaction, otherwise MPCv1/MPCv2
  // re-signing has only the '0' amount placeholder to verify against.
  describe('stored transferToken intent without caller txParams', function () {
    const signingBoundaryMessage = 'signing boundary reached after intent verification';
    const tokenQuantity = '1000000';

    function transferBytes(to: string, amount: string) {
      const common = AbstractEthLikeNewCoins.getCustomChainCommon(coin.getChainId());
      const tx = FeeMarketEIP1559Transaction.fromTxData(
        {
          nonce: 1,
          maxPriorityFeePerGas: 10,
          maxFeePerGas: 100,
          gasLimit: 200000,
          to,
          value: 0,
          data: erc20Transfer(recipient, amount),
          chainId: coin.getChainId(),
        },
        { common }
      );
      return {
        signableHex: tx.getMessageToSign(false).toString('hex'),
        serializedTxHex: tx.serialize().toString('hex'),
      };
    }

    function storedTransferRequest(
      bytes: { signableHex: string; serializedTxHex: string },
      tokenData: Record<string, unknown>
    ): TxRequest {
      return {
        txRequestId: 'stored-transfer-token',
        apiVersion: 'full',
        walletId: 'storedTransferWallet',
        intent: {
          intentType: 'transferToken',
          recipients: [{ address: { address: recipient }, amount: { value: '0', symbol: 'stgusd1' }, tokenData }],
        },
        transactions: [{ unsignedTx: { derivationPath: 'm/0', ...bytes }, signatureShares: [] }],
      } as unknown as TxRequest;
    }

    async function runMpcv2(txRequest: TxRequest): Promise<{ error: Error; boundary: Error }> {
      const signingWallet = new Wallet(bitgo, coin, {
        id: 'storedTransferWallet',
        multisigType: 'tss',
        multisigTypeVersion: 'MPCv2',
        coinSpecific: { baseAddress },
      });
      const utils = new EcdsaMPCv2Utils(bitgo, coin, signingWallet);
      sinon
        .stub(utils as unknown as Record<string, () => Promise<string>>, 'pickBitgoPubGpgKeyForSigning')
        .resolves('stubbed-gpg-key');

      const baseConfig = coin.getConfig();
      sinon.stub(coin, 'getConfig').returns({
        ...baseConfig,
        features: baseConfig.features.filter((f) => f !== CoinFeature.TSS_VERIFY_USE_SERIALIZED_TX_HEX),
      } as unknown as Readonly<StaticsBaseCoin>);

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

    it('verifies the prod eth/arbeth shape from the reconstructed stored intent (MPCv2)', async function () {
      const { error, boundary } = await runMpcv2(
        storedTransferRequest(transferBytes(tokenContract, tokenQuantity), {
          tokenName,
          tokenQuantity,
          tokenType: 'ERC20',
        })
      );
      error.should.be.exactly(boundary);
      warn.called.should.be.false();
    });

    it('verifies a contract-only stored intent resolved through @bitgo/statics (MPCv2)', async function () {
      const { error, boundary } = await runMpcv2(
        storedTransferRequest(transferBytes(tokenContract, '250'), {
          tokenQuantity: '250',
          tokenType: 'ERC20',
          tokenContractAddress: tokenContract,
        })
      );
      error.should.be.exactly(boundary);
    });

    it('verifies a stored bare-symbol intent on a token wallet (prod shape)', async function () {
      // Production rows persist tokenData.tokenName as the bare symbol ('usdt') with no contract, so the
      // name resolves to nothing; the wallet's own `chain:token` identity must bind the signed bytes.
      // Testnet token statics omit EIP1559 while mainnet ETH token coins enable it; production
      // transferToken bytes are EIP-1559, so mirror that feature on the token coin.
      const tokenStatics = coins.get(tokenName);
      const tokenCoin = Hteth.createInstance(bitgo, {
        ...tokenStatics,
        features: [...tokenStatics.features, CoinFeature.EIP1559],
      } as unknown as Readonly<StaticsBaseCoin>);
      const tokenWallet = new Wallet(bitgo, tokenCoin, { coinSpecific: { baseAddress } });
      const bytes = transferBytes(tokenContract, tokenQuantity);
      const txParams = resolveEffectiveTxParams(
        storedTransferRequest(bytes, { tokenName: 'stgusd1', tokenQuantity, tokenType: 'ERC20' }),
        undefined,
        tokenCoin.getChain()
      );
      txParams.recipients![0].tokenData!.tokenQuantity.should.equal(tokenQuantity);

      const result = await tokenCoin.verifyTransaction({
        txParams: txParams as never,
        txPrebuild: { txHex: '0x' + bytes.serializedTxHex, coin: tokenName, walletId: 'fakeWalletId' } as never,
        wallet: tokenWallet,
        verification: {},
        walletType: 'tss',
      });
      result.should.be.true();
      warn.called.should.be.false();
    });

    it('rejects a stored intent whose signed amount differs from tokenQuantity (MPCv2)', async function () {
      const { error } = await runMpcv2(
        storedTransferRequest(transferBytes(tokenContract, '999999'), {
          tokenName,
          tokenQuantity,
          tokenType: 'ERC20',
        })
      );
      error.should.be.instanceOf(TxIntentMismatchRecipientError);
      error.message.should.match(/does not match the declared token amount/);
    });
  });

  // CECHO-2690: bridgeFunds is rejected outright on non-HyperEVM EVM chains.
  describe('bridgeFunds on non-HyperEVM chains', function () {
    it('rejects bridgeFunds outright on hteth', async function () {
      const txHex = await buildTx({ to: '0x3333333333333333333333333333333333333333', value: '0' });
      await expectMismatch(
        verify({ type: 'bridgeFunds', intentAmount: { value: '10000000000000000', symbol: 'hteth' } }, txHex),
        /bridgeFunds is not supported on EVM coin 'hteth'/
      );
    });
  });

  // CECHO-2690: DeFi intents (defiApprove, defiDeposit, defiWithdraw) never carry native ETH value
  // and must use canonical ABI calldata.
  describe('DeFi native value and canonical calldata verification', function () {
    const defiParams = { vaultId: 'hteth-usdc-test', amount: '10', operationId: 'op-1' };
    const approveData = calldata('approve', ['address', 'uint256'], [recipient, '10']);
    const depositData = calldata('deposit', ['uint256', 'address'], ['10', baseAddress]);
    const redeemData = calldata('redeem', ['uint256', 'address', 'address'], ['10', baseAddress, baseAddress]);

    it('rejects nonzero native value on defiApprove, defiDeposit, and defiWithdraw', async function () {
      await expectMismatch(
        verify(
          { type: 'defiApprove', defiParams },
          await buildTx({ to: tokenContract, value: '1', data: approveData })
        ),
        /defiApprove transaction must not carry native value/
      );
      await expectMismatch(
        verify(
          { type: 'defiDeposit', defiParams },
          await buildTx({ to: tokenContract, value: '10', data: depositData })
        ),
        /defiDeposit transaction must not carry native value/
      );
      await expectMismatch(
        verify(
          { type: 'defiWithdraw', defiParams },
          await buildTx({ to: tokenContract, value: '1', data: redeemData })
        ),
        /defiWithdraw transaction must not carry native value/
      );
    });

    it('rejects non-canonical trailing bytes on defiApprove, defiDeposit, and defiWithdraw', async function () {
      await expectMismatch(
        verify(
          { type: 'defiApprove', defiParams },
          await buildTx({ to: tokenContract, data: approveData + '00'.repeat(32) })
        ),
        /not canonical/
      );
      await expectMismatch(
        verify(
          { type: 'defiDeposit', defiParams },
          await buildTx({ to: tokenContract, data: depositData + '00'.repeat(32) })
        ),
        /not canonical/
      );
      await expectMismatch(
        verify(
          { type: 'defiWithdraw', defiParams },
          await buildTx({ to: tokenContract, data: redeemData + '00'.repeat(32) })
        ),
        /not canonical/
      );
    });
  });
});
