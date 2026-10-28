import 'should';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { coins, Erc7984Coin } from '@bitgo/statics';
import { TransactionType, TssVerificationWarning, Wallet } from '@bitgo/sdk-core';
import { optionalDeps } from '@bitgo/abstract-eth';

import { Tbsc } from '../../src';
import { TransactionBuilder } from '../../src/lib';

/**
 * Fail-closed EVM TSS verification for batcher-contract flows (CECHO-2460).
 *
 * Native batches (`batch(address[],uint256[])`) and token batches
 * (`batchTransferFrom(address,address[],uint256[])`) must reach the network's batcher
 * contract with the intent's recipients 1:1, and `tokenApproval` must be
 * `approve(batcher, MAX)` on the intent token contract. tbsc is used because its statics
 * network carries a real batcher contract address.
 */

const recipientAddress = '0x174cfd823af8ce27ed0afee3fcf3c3ba259116be';
const attackerAddress = '0x7e85bdc27c050e3905ebf4b8e634d9ad6edd0de6';
const tokenContractAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const MAX_UINT256 = ((1n << 256n) - 1n).toString();

const erc7984Pair = coins.get('hteth:cusdt') as Erc7984Coin;
const erc7984WrapperAddress = String(erc7984Pair.contractAddress);

const word = (value: bigint): string => value.toString(16).padStart(64, '0');
const addrWord = (address: string): string => address.toLowerCase().replace(/^0x/, '').padStart(64, '0');

function encodeApprove(spender: string, amount: string): string {
  return `0x095ea7b3${addrWord(spender)}${word(BigInt(amount))}`;
}

function encodeWithAbi(signature: string, types: string[], values: unknown[]): string {
  const selector = optionalDeps.ethAbi.methodID(signature, types);
  const args = optionalDeps.ethAbi.rawEncode(types, values);
  return '0x' + Buffer.concat([selector, args]).toString('hex');
}

function encodeBatch(addresses: string[], amounts: string[]): string {
  return encodeWithAbi('batch', ['address[]', 'uint256[]'], [addresses, amounts]);
}

function encodeBatchTransferFrom(token: string, addresses: string[], amounts: string[]): string {
  return encodeWithAbi('batchTransferFrom', ['address', 'address[]', 'uint256[]'], [token, addresses, amounts]);
}

async function buildTxHex(opts: { to: string; value?: string; data?: string }): Promise<string> {
  const builder = new TransactionBuilder(coins.get('tbsc'));
  builder.type(opts.data && opts.data !== '0x' ? TransactionType.ContractCall : TransactionType.SingleSigSend);
  builder.fee({ fee: '10', gasLimit: '21000' });
  builder.counter(1);
  builder.contract(opts.to);
  if (opts.data) {
    builder.data(opts.data);
  }
  if (opts.value) {
    builder.value(opts.value);
  }
  return (await builder.build()).toBroadcastFormat();
}

describe('EVM TSS fail-closed verification (batcher contract flows)', function () {
  const batcherAddress = String(
    (coins.get('tbsc').network as unknown as { batcherContractAddress: string }).batcherContractAddress
  );

  let bitgo: TestBitGoAPI;
  let strictBitgo: TestBitGoAPI;
  let warnings: TssVerificationWarning[];
  let coin: Tbsc;
  let wallet: Wallet;

  beforeEach(function () {
    warnings = [];
    bitgo = TestBitGo.decorate(BitGoAPI, {
      env: 'test',
      onVerificationWarning: (warning) => warnings.push(warning),
    });
    strictBitgo = TestBitGo.decorate(BitGoAPI, {
      env: 'test',
      strictTssVerification: true,
    });
    bitgo.safeRegister('tbsc', Tbsc.createInstance);
    bitgo.initializeTestVars();
    strictBitgo.safeRegister('tbsc', Tbsc.createInstance);
    strictBitgo.initializeTestVars();
    coin = bitgo.coin('tbsc') as Tbsc;
    wallet = new Wallet(
      bitgo,
      coin as any,
      {
        coinSpecific: { baseAddress: recipientAddress },
      } as any
    );
  });

  const verify = (txParams: Record<string, unknown>, txHex: string, strict = false): Promise<boolean> => {
    const target = strict ? (strictBitgo.coin('tbsc') as Tbsc) : coin;
    const w = strict
      ? new Wallet(strictBitgo, target as any, { coinSpecific: { baseAddress: recipientAddress } } as any)
      : wallet;
    return (target as any).verifyTransaction({
      txParams,
      txPrebuild: { txHex, coin: 'tbsc', walletId: 'w' },
      wallet: w,
      verification: {},
      walletType: 'tss',
    });
  };

  it('pins the hardcoded batch selectors to their runtime-computed values', function () {
    encodeBatch([recipientAddress], ['1']).slice(0, 10).should.equal('0xc00c4e9e');
    encodeBatchTransferFrom(tokenContractAddress, [recipientAddress], ['1']).slice(0, 10).should.equal('0x4885b254');
  });

  describe('native batch', function () {
    const recipients = [
      { address: recipientAddress, amount: '10' },
      { address: attackerAddress, amount: '20' },
    ];

    it('verifies batch calldata against the batcher contract and the intent arrays', async function () {
      const txHex = await buildTxHex({
        to: batcherAddress,
        value: '30',
        data: encodeBatch([recipientAddress, attackerAddress], ['10', '20']),
      });
      (await verify({ type: 'transfer', recipients }, txHex)).should.equal(true);
      warnings.should.have.length(0);
    });

    it('flags swapped inner recipients and inflated batch value', async function () {
      const swappedHex = await buildTxHex({
        to: batcherAddress,
        value: '30',
        data: encodeBatch([attackerAddress, recipientAddress], ['10', '20']),
      });
      (await verify({ type: 'transfer', recipients }, swappedHex)).should.equal(true);
      warnings.some((w) => /entry 0 does not match/.test(w.reason)).should.equal(true);
      await verify({ type: 'transfer', recipients }, swappedHex, true).should.be.rejectedWith(/entry 0 does not match/);

      warnings = [];
      const inflatedHex = await buildTxHex({
        to: batcherAddress,
        value: '999',
        data: encodeBatch([recipientAddress, attackerAddress], ['10', '20']),
      });
      (await verify({ type: 'transfer', recipients }, inflatedHex)).should.equal(true);
      warnings.some((w) => /value does not match the sum/.test(w.reason)).should.equal(true);
    });

    it('flags a batch sent somewhere other than the network batcher contract', async function () {
      const txHex = await buildTxHex({
        to: attackerAddress,
        value: '30',
        data: encodeBatch([recipientAddress, attackerAddress], ['10', '20']),
      });
      (await verify({ type: 'transfer', recipients }, txHex)).should.equal(true);
      warnings.some((w) => /does not match the network batcher contract/.test(w.reason)).should.equal(true);
    });

    it('flags batch-shaped sends whose calldata is not batch or batchTransferFrom', async function () {
      const txHex = await buildTxHex({
        to: batcherAddress,
        value: '30',
        data: encodeWithAbi('transfer', ['address', 'uint256'], [recipientAddress, '30']),
      });
      (await verify({ type: 'transfer', recipients }, txHex)).should.equal(true);
      warnings.some((w) => /must use batch\(address\[\],uint256\[\]\)/.test(w.reason)).should.equal(true);
    });
  });

  describe('token batch', function () {
    const recipients = [
      { address: recipientAddress, amount: '10', tokenName: 'hteth:cusdt' },
      { address: attackerAddress, amount: '20', tokenName: 'hteth:cusdt' },
    ];

    it('verifies batchTransferFrom against the intent token contract with zero value', async function () {
      const txHex = await buildTxHex({
        to: batcherAddress,
        value: '0',
        data: encodeBatchTransferFrom(erc7984WrapperAddress, [recipientAddress, attackerAddress], ['10', '20']),
      });
      (await verify({ type: 'transfer', recipients }, txHex)).should.equal(true);
      warnings.should.have.length(0);
    });

    it('flags a token batch whose token contract is not the intent token', async function () {
      const txHex = await buildTxHex({
        to: batcherAddress,
        value: '0',
        data: encodeBatchTransferFrom(tokenContractAddress, [recipientAddress, attackerAddress], ['10', '20']),
      });
      (await verify({ type: 'transfer', recipients }, txHex)).should.equal(true);
      warnings.some((w) => /token contract does not match/.test(w.reason)).should.equal(true);
      await verify({ type: 'transfer', recipients }, txHex, true).should.be.rejectedWith(
        /token contract does not match/
      );
    });
  });

  describe('tokenApproval', function () {
    const approvalParams = { type: 'tokenApproval', tokenName: 'hteth:cusdt' };

    it('verifies approve(batcher, MAX) on the intent token contract', async function () {
      const txHex = await buildTxHex({
        to: erc7984WrapperAddress,
        value: '0',
        data: encodeApprove(batcherAddress, MAX_UINT256),
      });
      (await verify(approvalParams, txHex)).should.equal(true);
      warnings.should.have.length(0);
    });

    it('flags approve(attacker, MAX) under a tokenApproval intent (TOB-BITGOEDMPC-2)', async function () {
      const txHex = await buildTxHex({
        to: erc7984WrapperAddress,
        value: '0',
        data: encodeApprove(attackerAddress, MAX_UINT256),
      });
      (await verify(approvalParams, txHex)).should.equal(true);
      warnings.some((w) => /spender is not the network batcher contract/.test(w.reason)).should.equal(true);
      await verify(approvalParams, txHex, true).should.be.rejectedWith(/spender is not the network batcher contract/);
    });
  });
});
