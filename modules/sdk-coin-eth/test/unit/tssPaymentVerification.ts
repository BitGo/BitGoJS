import 'should';
import sinon from 'sinon';
import EthereumAbi from 'ethereumjs-abi';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TransactionType, TxIntentMismatchRecipientError, Wallet } from '@bitgo/sdk-core';
import { coins, EthereumNetwork } from '@bitgo/statics';
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
