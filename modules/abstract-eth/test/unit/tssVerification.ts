import 'should';
import BN from 'bn.js';
import EthereumCommon from '@ethereumjs/common';
import { FeeMarketEIP1559Transaction } from '@ethereumjs/tx';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import {
  BaseCoin as StaticsBaseCoin,
  coins,
  ContractAddressDefinedToken,
  EthereumNetwork as EthLikeNetwork,
} from '@bitgo/statics';
import { BitGoBase, TransactionType } from '@bitgo/sdk-core';

import { AbstractEthLikeNewCoins, Fee, optionalDeps, TransactionBuilder, TransferBuilder } from '../../src';

/**
 * Focused coverage for the minimal EVM TSS payment + consolidation verification:
 * definite mismatches throw, unverifiable checks warn, malformed bytes always fail.
 */
const chain = 'hteth';
const staticsCoin = coins.get(chain);
const baseAddress = '0x1111111111111111111111111111111111111111';
const recipientAddress = '0x174cfd823af8ce27ed0afee3fcf3c3ba259116be';
const attackerAddress = '0x7e85bdc27c050e3905ebf4b8e634d9ad6edd0de6';
const tokenName = 'hteth:tusdc';
const tokenContractAddress = String((coins.get(tokenName) as ContractAddressDefinedToken).contractAddress);
const batcherContractAddress = (staticsCoin.network as EthLikeNetwork).batcherContractAddress as string;

class TestEthLikeCoin extends AbstractEthLikeNewCoins {
  constructor(bitgo: BitGoBase, coinConfig: Readonly<StaticsBaseCoin>) {
    super(bitgo, coinConfig);
  }

  protected getTransactionBuilder(_common?: EthereumCommon): TransactionBuilder {
    return new TestTransactionBuilder(this.staticsCoin as Readonly<StaticsBaseCoin>);
  }
}

/**
 * Concrete builder for the raw payment / contract-call transactions this suite signs. The base
 * `TransactionBuilder` is abstract only because a wallet `Send` needs a transfer encoding, which
 * these fixtures never build.
 */
class TestTransactionBuilder extends TransactionBuilder {
  transfer(): TransferBuilder {
    return new TransferBuilder();
  }
}

const word = (value: bigint): string => value.toString(16).padStart(64, '0');
const addrWord = (address: string): string => address.toLowerCase().replace(/^0x/, '').padStart(64, '0');

function encodeErc20Transfer(to: string, amount: string): string {
  return `${'0xa9059cbb'}${addrWord(to)}${word(BigInt(amount))}`;
}

function encodeBatch(recipients: Array<{ address: string; amount: string }>): string {
  const selector = optionalDeps.ethAbi.methodID('batch', ['address[]', 'uint256[]']);
  const args = optionalDeps.ethAbi.rawEncode(
    ['address[]', 'uint256[]'],
    [recipients.map((recipient) => recipient.address), recipients.map((recipient) => new BN(recipient.amount))]
  );
  return `0x${Buffer.concat([selector, args]).toString('hex')}`;
}

function encodeBatchTransferFrom(tokenAddress: string, recipients: Array<{ address: string; amount: string }>): string {
  const selector = optionalDeps.ethAbi.methodID('batchTransferFrom', ['address', 'address[]', 'uint256[]']);
  const args = optionalDeps.ethAbi.rawEncode(
    ['address', 'address[]', 'uint256[]'],
    [tokenAddress, recipients.map((recipient) => recipient.address), recipients.map((r) => new BN(r.amount))]
  );
  return `0x${Buffer.concat([selector, args]).toString('hex')}`;
}

type Kernel = Parameters<AbstractEthLikeNewCoins['verifyTssTransaction']>[0];

describe(`EVM TSS verification (${chain})`, function () {
  let coin: TestEthLikeCoin;
  let bitgo: TestBitGoAPI;
  let warnings: string[];
  const originalWarn = console.warn;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    coin = new TestEthLikeCoin(bitgo, staticsCoin);
  });

  beforeEach(function () {
    warnings = [];
    console.warn = ((...args: unknown[]) => warnings.push(args.map(String).join(' '))) as typeof console.warn;
  });

  afterEach(function () {
    console.warn = originalWarn;
  });

  async function buildTxFor(
    coinConfig: Readonly<StaticsBaseCoin>,
    opts: { to: string; value?: string; data?: string; eip1559?: boolean }
  ): Promise<string> {
    const builder = new TestTransactionBuilder(coinConfig);
    builder.type(opts.data && opts.data !== '0x' ? TransactionType.ContractCall : TransactionType.SingleSigSend);
    builder.counter(1);
    const fee: Fee = opts.eip1559
      ? {
          fee: '10',
          gasLimit: '100000',
          eip1559: { maxFeePerGas: '10', maxPriorityFeePerGas: '1' },
        }
      : { fee: '10', gasLimit: '100000' };
    builder.fee(fee);
    builder.contract(opts.to);
    if (opts.value !== undefined) {
      builder.value(opts.value);
    }
    if (opts.data !== undefined) {
      builder.data(opts.data);
    }
    return (await builder.build()).toBroadcastFormat();
  }

  const buildTx = (opts: { to: string; value?: string; data?: string }): Promise<string> =>
    buildTxFor(staticsCoin, opts);

  function verify(params: {
    caller?: Record<string, unknown>;
    intent?: Record<string, unknown>;
    txParams?: Record<string, unknown>;
    txHex: string;
    omitBaseAddress?: boolean;
    verification?: { consolidationToBaseAddress?: boolean };
  }): Promise<boolean> {
    return coin.verifyTssTransaction({
      callerTxParams: params.caller,
      intent: params.intent,
      txParams: params.txParams ?? params.caller ?? {},
      txPrebuild: { txHex: params.txHex },
      wallet: { coinSpecific: () => (params.omitBaseAddress ? {} : { baseAddress }) },
      verification: params.verification,
    } as unknown as Kernel);
  }

  describe('payments', function () {
    it('verifies a native payment that matches the caller intent', async function () {
      const txHex = await buildTx({ to: recipientAddress, value: '1000' });
      const result = await verify({
        caller: { type: 'transfer', recipients: [{ address: recipientAddress, amount: '1000' }] },
        txHex,
      });
      result.should.equal(true);
      warnings.should.have.length(0);
    });

    it('rejects a native payment to a different destination', async function () {
      const txHex = await buildTx({ to: attackerAddress, value: '1000' });
      await verify({
        caller: { type: 'transfer', recipients: [{ address: recipientAddress, amount: '1000' }] },
        txHex,
      }).should.be.rejectedWith(/destination address does not match/);
    });

    it('rejects a native payment with a different value', async function () {
      const txHex = await buildTx({ to: recipientAddress, value: '999' });
      await verify({
        caller: { type: 'transfer', recipients: [{ address: recipientAddress, amount: '1000' }] },
        txHex,
      }).should.be.rejectedWith(/does not match the value given by client/);
    });

    it('verifies the stored payment intent when the caller declared nothing', async function () {
      const intent = {
        intentType: 'payment',
        recipients: [{ address: { address: recipientAddress }, amount: { value: '1000', symbol: chain } }],
      };
      const txHex = await buildTx({ to: recipientAddress, value: '1000' });
      const result = await verify({
        intent,
        txParams: { type: 'payment', recipients: [{ address: recipientAddress, amount: '1000' }] },
        txHex,
      });
      result.should.equal(true);
      warnings.should.have.length(0);
    });

    it('rejects the stored payment intent when the bytes pay someone else', async function () {
      const intent = {
        intentType: 'payment',
        recipients: [{ address: { address: recipientAddress }, amount: { value: '1000', symbol: chain } }],
      };
      const txHex = await buildTx({ to: attackerAddress, value: '1000' });
      await verify({
        intent,
        txParams: { type: 'payment', recipients: [{ address: recipientAddress, amount: '1000' }] },
        txHex,
      }).should.be.rejectedWith(/destination address does not match/);
    });

    it('rejects a caller-declared payment without recipients instead of using stored ones', async function () {
      // The stored intent back-fills txParams.recipients, but the caller declared only the type:
      // the stored recipients are server data and must not stand in for the caller intent.
      const intent = {
        intentType: 'payment',
        recipients: [{ address: { address: attackerAddress }, amount: { value: '1000', symbol: chain } }],
      };
      const txHex = await buildTx({ to: attackerAddress, value: '1000' });
      await verify({
        caller: { type: 'transfer' },
        intent,
        txParams: { type: 'payment', recipients: [{ address: attackerAddress, amount: '1000' }] },
        txHex,
      }).should.be.rejectedWith(/caller declared a payment without recipients/);
    });

    it('verifies an ERC-20 payment to the declared token contract', async function () {
      const txHex = await buildTx({
        to: tokenContractAddress,
        value: '0',
        data: encodeErc20Transfer(recipientAddress, '1000'),
      });
      const result = await verify({
        caller: { type: 'transfer', tokenName, recipients: [{ address: recipientAddress, amount: '1000' }] },
        txHex,
      });
      result.should.equal(true);
      warnings.should.have.length(0);
    });

    it('rejects an ERC-20 payment to a different token contract', async function () {
      const txHex = await buildTx({
        to: attackerAddress,
        value: '0',
        data: encodeErc20Transfer(recipientAddress, '1000'),
      });
      await verify({
        caller: { type: 'transfer', tokenName, recipients: [{ address: recipientAddress, amount: '1000' }] },
        txHex,
      }).should.be.rejectedWith(/token contract/);
    });

    it('rejects an ERC-20 payment carrying native value', async function () {
      const txHex = await buildTx({
        to: tokenContractAddress,
        value: '1',
        data: encodeErc20Transfer(recipientAddress, '1000'),
      });
      await verify({
        caller: { type: 'transfer', tokenName, recipients: [{ address: recipientAddress, amount: '1000' }] },
        txHex,
      }).should.be.rejectedWith(/native value/);
    });

    it('rejects ERC-20 calldata on a payment that declares no token identity', async function () {
      // No `tokenName` / `tokenAddress` / `tokenData` on a native-chain payment is a native send
      // (the SDK convention for wallet.send / sendMany), so token calldata is a definite mismatch.
      const txHex = await buildTx({
        to: tokenContractAddress,
        value: '0',
        data: encodeErc20Transfer(recipientAddress, '1000'),
      });
      await verify({
        caller: { type: 'transfer', recipients: [{ address: recipientAddress, amount: '1000' }] },
        txHex,
      }).should.be.rejectedWith(/declares a native asset but the transaction carries token or batch calldata/);
    });

    it('verifies the same ERC-20 transfer once the recipient declares the token contract', async function () {
      const txHex = await buildTx({
        to: tokenContractAddress,
        value: '0',
        data: encodeErc20Transfer(recipientAddress, '1000'),
      });
      const result = await verify({
        caller: {
          type: 'transfer',
          recipients: [{ address: recipientAddress, amount: '1000', tokenAddress: tokenContractAddress }],
        },
        txHex,
      });
      result.should.equal(true);
      warnings.should.have.length(0);
    });

    it('rejects ERC-20 calldata with trailing bytes', async function () {
      const data = `${encodeErc20Transfer(recipientAddress, '1000')}${'00'.repeat(32)}`;
      const txHex = await buildTx({ to: tokenContractAddress, value: '0', data });
      await verify({
        caller: { type: 'transfer', tokenName, recipients: [{ address: recipientAddress, amount: '1000' }] },
        txHex,
      }).should.be.rejectedWith(/not canonical/);
    });

    it('rejects an approve disguised as a native payment', async function () {
      const data = `0x095ea7b3${addrWord(attackerAddress)}${word((1n << 256n) - 1n)}`;
      const txHex = await buildTx({ to: recipientAddress, value: '0', data });
      await verify({
        caller: { type: 'transfer', recipients: [{ address: recipientAddress, amount: '0' }] },
        txHex,
      }).should.be.rejectedWith(/not a recognized payment shape/);
    });

    it('verifies an explicitly declared calldata payload exactly', async function () {
      const data = `0x095ea7b3${addrWord(recipientAddress)}${word(1n)}`;
      const txHex = await buildTx({ to: recipientAddress, value: '5', data });
      const result = await verify({
        caller: { type: 'transfer', recipients: [{ address: recipientAddress, amount: '5', data }] },
        txHex,
      });
      result.should.equal(true);
      warnings.should.have.length(0);
    });

    it('rejects explicitly declared calldata that does not match', async function () {
      const data = `0x095ea7b3${addrWord(recipientAddress)}${word(1n)}`;
      const otherData = `0x095ea7b3${addrWord(attackerAddress)}${word(1n)}`;
      const txHex = await buildTx({ to: recipientAddress, value: '5', data });
      await verify({
        caller: { type: 'transfer', recipients: [{ address: recipientAddress, amount: '5', data: otherData }] },
        txHex,
      }).should.be.rejectedWith(/calldata does not match/);
    });

    it('warns about an unresolvable token name', async function () {
      const txHex = await buildTx({
        to: tokenContractAddress,
        value: '0',
        data: encodeErc20Transfer(recipientAddress, '1000'),
      });
      const result = await verify({
        caller: {
          type: 'transfer',
          tokenName: 'hteth:not-a-registered-token',
          recipients: [{ address: recipientAddress, amount: '1000' }],
        },
        txHex,
      });
      result.should.equal(true);
      warnings.some((warning) => /cannot be resolved/.test(warning)).should.equal(true);
    });

    it('still rejects an inner amount mismatch when the token identity is unresolved', async function () {
      const txHex = await buildTx({
        to: tokenContractAddress,
        value: '0',
        data: encodeErc20Transfer(recipientAddress, '999'),
      });
      await verify({
        caller: {
          type: 'transfer',
          tokenName: 'hteth:not-a-registered-token',
          recipients: [{ address: recipientAddress, amount: '1000' }],
        },
        txHex,
      }).should.be.rejectedWith(/does not match the value given by client/);
    });

    it('treats empty declared calldata as no calldata for a native payment', async function () {
      const txHex = await buildTx({ to: recipientAddress, value: '1000' });
      const result = await verify({
        caller: { type: 'transfer', recipients: [{ address: recipientAddress, amount: '1000', data: '' }] },
        txHex,
      });
      result.should.equal(true);
      warnings.should.have.length(0);
    });

    describe('realistic ERC-20 tokenData', function () {
      // The intent tokenData shape is used by ERC-20 too: tokenType 'ERC20' plus tokenQuantity and
      // tokenName. It must not divert the payment to the NFT/incomplete path.
      const erc20TokenData = () => ({ tokenType: 'ERC20', tokenQuantity: '1000', tokenName });

      it('verifies an ERC-20 payment that carries ERC-20 tokenData', async function () {
        const txHex = await buildTx({
          to: tokenContractAddress,
          value: '0',
          data: encodeErc20Transfer(recipientAddress, '1000'),
        });
        const result = await verify({
          caller: {
            type: 'transfer',
            tokenName,
            recipients: [{ address: recipientAddress, amount: '1000', tokenData: erc20TokenData() }],
          },
          txHex,
        });
        result.should.equal(true);
        warnings.should.have.length(0);
      });

      it('does not reclassify an ERC-20 payment when the caller passes empty data', async function () {
        const txHex = await buildTx({
          to: tokenContractAddress,
          value: '0',
          data: encodeErc20Transfer(recipientAddress, '1000'),
        });
        const result = await verify({
          caller: {
            type: 'transfer',
            tokenName,
            recipients: [{ address: recipientAddress, amount: '1000', data: '', tokenData: erc20TokenData() }],
          },
          txHex,
        });
        result.should.equal(true);
        warnings.should.have.length(0);
      });

      it('rejects an ERC-20 payment with ERC-20 tokenData sent to another contract', async function () {
        const txHex = await buildTx({
          to: attackerAddress,
          value: '0',
          data: encodeErc20Transfer(recipientAddress, '1000'),
        });
        await verify({
          caller: {
            type: 'transfer',
            tokenName,
            recipients: [{ address: recipientAddress, amount: '1000', tokenData: erc20TokenData() }],
          },
          txHex,
        }).should.be.rejectedWith(/token contract/);
      });

      it('rejects an ERC-20 payment with ERC-20 tokenData carrying native value', async function () {
        const txHex = await buildTx({
          to: tokenContractAddress,
          value: '1',
          data: encodeErc20Transfer(recipientAddress, '1000'),
        });
        await verify({
          caller: {
            type: 'transfer',
            tokenName,
            recipients: [{ address: recipientAddress, amount: '1000', tokenData: erc20TokenData() }],
          },
          txHex,
        }).should.be.rejectedWith(/native value/);
      });

      const storedIntent = () => ({
        intentType: 'payment',
        tokenName,
        recipients: [
          {
            address: { address: recipientAddress },
            amount: { value: '1000', symbol: tokenName },
            tokenData: {
              tokenType: 'ERC20',
              tokenQuantity: '1000',
              tokenName,
              tokenContractAddress,
            },
          },
        ],
      });
      const effectiveParams = () => ({
        type: 'payment',
        tokenName,
        recipients: [{ address: recipientAddress, amount: '1000', tokenName }],
      });

      it('verifies a stored ERC-20 payment whose stored intent carries ERC-20 tokenData', async function () {
        const txHex = await buildTx({
          to: tokenContractAddress,
          value: '0',
          data: encodeErc20Transfer(recipientAddress, '1000'),
        });
        const result = await verify({
          intent: storedIntent(),
          txParams: effectiveParams(),
          txHex,
        });
        result.should.equal(true);
        warnings.should.have.length(0);
      });

      it('rejects a stored ERC-20 payment sent to another contract', async function () {
        const txHex = await buildTx({
          to: attackerAddress,
          value: '0',
          data: encodeErc20Transfer(recipientAddress, '1000'),
        });
        await verify({ intent: storedIntent(), txParams: effectiveParams(), txHex }).should.be.rejectedWith(
          /token contract/
        );
      });

      it('rejects a stored ERC-20 payment carrying native value', async function () {
        const txHex = await buildTx({
          to: tokenContractAddress,
          value: '1',
          data: encodeErc20Transfer(recipientAddress, '1000'),
        });
        await verify({ intent: storedIntent(), txParams: effectiveParams(), txHex }).should.be.rejectedWith(
          /native value/
        );
      });
    });

    it('warns about an NFT payment it cannot model', async function () {
      const txHex = await buildTx({
        to: tokenContractAddress,
        value: '0',
        data: encodeErc20Transfer(recipientAddress, '1000'),
      });
      const result = await verify({
        caller: {
          type: 'transfer',
          tokenName,
          recipients: [{ address: recipientAddress, amount: '1000', tokenData: { tokenType: 'ERC721' } }],
        },
        txHex,
      });
      result.should.equal(true);
      warnings.some((warning) => /NFT payment verification is not implemented/.test(warning)).should.equal(true);
    });
  });

  describe('batch payments', function () {
    const recipients = [
      { address: recipientAddress, amount: '1000' },
      { address: attackerAddress, amount: '2000' },
    ];

    it('verifies a native batch to the network batcher', async function () {
      const txHex = await buildTx({ to: batcherContractAddress, value: '3000', data: encodeBatch(recipients) });
      const result = await verify({
        caller: { type: 'transfer', recipients: recipients.map((r) => ({ ...r })) },
        txHex,
      });
      result.should.equal(true);
      warnings.should.have.length(0);
    });

    it('rejects a native batch whose value is not the sum of the intent amounts', async function () {
      const txHex = await buildTx({ to: batcherContractAddress, value: '2999', data: encodeBatch(recipients) });
      await verify({
        caller: { type: 'transfer', recipients: recipients.map((r) => ({ ...r })) },
        txHex,
      }).should.be.rejectedWith(/sum of intent amounts/);
    });

    it('rejects a native batch whose entry does not match the intent', async function () {
      const txHex = await buildTx({ to: batcherContractAddress, value: '3000', data: encodeBatch(recipients) });
      await verify({
        caller: {
          type: 'transfer',
          recipients: [
            { address: recipientAddress, amount: '1000' },
            { address: recipientAddress, amount: '2000' },
          ],
        },
        txHex,
      }).should.be.rejectedWith(/batch calldata entry 1 does not match intent recipient/);
    });

    it('rejects a native batch sent somewhere other than the batcher', async function () {
      const txHex = await buildTx({ to: attackerAddress, value: '3000', data: encodeBatch(recipients) });
      await verify({
        caller: { type: 'transfer', recipients: recipients.map((r) => ({ ...r })) },
        txHex,
      }).should.be.rejectedWith(/does not match the network batcher/);
    });

    it('verifies a token batch that matches the declared token', async function () {
      const txHex = await buildTx({
        to: batcherContractAddress,
        value: '0',
        data: encodeBatchTransferFrom(tokenContractAddress, recipients),
      });
      const result = await verify({
        caller: {
          type: 'transfer',
          tokenName,
          recipients: recipients.map((r) => ({ ...r })),
        },
        txHex,
      });
      result.should.equal(true);
      warnings.should.have.length(0);
    });
  });

  describe('unimplemented intents and malformed bytes', function () {
    it('rejects contractCall outright', async function () {
      const txHex = await buildTx({ to: recipientAddress, value: '0' });
      await verify({
        caller: { type: 'contractCall' },
        txParams: { type: 'contractCall' },
        txHex,
      }).should.be.rejectedWith(/unsupported intent type for EVM TSS/);
    });

    it('validates the EVM encoding of an intent without rules and warns', async function () {
      const txHex = await buildTx({ to: recipientAddress, value: '0' });
      const result = await verify({
        caller: { type: 'enableToken' },
        txParams: { type: 'enableToken' },
        txHex,
      });
      result.should.equal(true);
      warnings
        .some((warning) => /no fail-closed verifier for intent type 'enableToken'/.test(warning))
        .should.equal(true);
    });

    it('rejects malformed bytes even when the intent type has no rules', async function () {
      await verify({
        caller: { type: 'enableToken' },
        txParams: { type: 'enableToken' },
        txHex: '0x1234',
      }).should.be.rejectedWith(/could not be decoded as an EVM transaction/);
    });

    it('rejects non-EVM bytes even when the intent type has no rules', async function () {
      // No generic format sniffing here: a coin that owns a non-EVM format handles it in its own
      // verifier override. Anything reaching this verifier must decode as an EVM transaction.
      await verify({
        caller: { type: 'import', recipients: [{ address: recipientAddress, amount: '1' }] },
        txHex: '0x0000000000000001',
      }).should.be.rejected();
    });
  });

  describe('consolidations', function () {
    const otherTokenName = 'hteth:tusdt';
    const otherTokenContractAddress = String(
      (coins.get(otherTokenName) as ContractAddressDefinedToken).contractAddress
    );

    /** The recipient shape WP persists for a token consolidation: identity lives in `tokenData`. */
    const tokenIntentRecipient = (amount: string, intentTokenName: string = tokenName) => ({
      address: { address: baseAddress },
      amount: { value: amount, symbol: chain },
      tokenData: { tokenName: intentTokenName, tokenQuantity: amount, tokenType: 'ERC20' },
    });

    /**
     * The effective params the signing path derives from a consolidation intent
     * (`resolveEffectiveTxParams` sets the type from `intent.intentType` and back-fills the
     * recipients). Without them the missing-params guard rejects the call, which stays true for
     * token consolidations exactly as it was before they were recognised.
     */
    const effectiveTokenParams = () => ({
      type: 'consolidateToken',
      recipients: [{ address: baseAddress, amount: '1000' }],
    });

    it('verifies a native consolidation to the wallet base address', async function () {
      const txHex = await buildTx({ to: baseAddress, value: '1000' });
      const result = await verify({ caller: { type: 'consolidate' }, txParams: { type: 'consolidate' }, txHex });
      result.should.equal(true);
      warnings.should.have.length(0);
    });

    it('rejects a native consolidation that does not pay the base address', async function () {
      const txHex = await buildTx({ to: attackerAddress, value: '1000' });
      await verify({
        caller: { type: 'consolidate' },
        txParams: { type: 'consolidate' },
        txHex,
      }).should.be.rejectedWith(/base address/);
    });

    it('rejects calldata when a field declares the chain asset', async function () {
      // Naming the chain coin is a native declaration: a native sweep is a plain send.
      const data = `0x095ea7b3${addrWord(attackerAddress)}${word(1n)}`;
      const txHex = await buildTx({ to: baseAddress, value: '1000', data });
      await verify({
        caller: { type: 'consolidate', tokenName: chain },
        txParams: { type: 'consolidate', tokenName: chain },
        txHex,
      }).should.be.rejectedWith(/must not carry calldata/);
    });

    it('warns for arbitrary calldata when the consolidation declares no asset', async function () {
      // A generic `consolidate` may be an ERC-20 or specialised sweep (the v6 server builds token
      // sweeps on this type), so arbitrary calldata is reported rather than called a mismatch.
      const data = `0x095ea7b3${addrWord(attackerAddress)}${word(1n)}`;
      const txHex = await buildTx({ to: baseAddress, value: '1000', data });
      const result = await verify({ caller: { type: 'consolidate' }, txParams: { type: 'consolidate' }, txHex });
      result.should.equal(true);
      warnings.should.have.length(1);
      warnings[0].should.match(/declares no asset/);
    });

    it('verifies an ERC-20 consolidation on the token the caller declares', async function () {
      const txHex = await buildTx({
        to: tokenContractAddress,
        value: '0',
        data: encodeErc20Transfer(baseAddress, '1000'),
      });
      const result = await verify({
        caller: { type: 'consolidateToken', tokenName },
        txParams: effectiveTokenParams(),
        txHex,
      });
      result.should.equal(true);
      warnings.should.have.length(0);
    });

    it('warns that the token contract is unchecked when no token is declared', async function () {
      // Caller-compatible shape: a generic `consolidate` with ERC-20 calldata declares no token
      // contract, so the contract is not claimed as verified — but the base address, the calldata
      // shape and the zero native value are.
      const txHex = await buildTx({
        to: tokenContractAddress,
        value: '0',
        data: encodeErc20Transfer(baseAddress, '1000'),
      });
      const result = await verify({ caller: { type: 'consolidate' }, txParams: { type: 'consolidate' }, txHex });
      result.should.equal(true);
      warnings.should.have.length(1);
      warnings[0].should.match(/consolidate: consolidation declares no token contract/);
      warnings[0].should.match(/the token contract cannot be checked/);
      warnings[0].should.not.match(/no fail-closed verifier/);
    });

    it('rejects a wrong recipient and a nonzero value even with no token metadata', async function () {
      // The token contract cannot be checked without metadata, but that must never downgrade the
      // checks that do not need it: a wrong sweep recipient and a native value riding along stay
      // definite mismatches, and nothing is reported as unverifiable before they are enforced.
      const wrongRecipientHex = await buildTx({
        to: tokenContractAddress,
        value: '0',
        data: encodeErc20Transfer(attackerAddress, '1000'),
      });
      await verify({
        caller: { type: 'consolidateToken' },
        txParams: effectiveTokenParams(),
        txHex: wrongRecipientHex,
      }).should.be.rejectedWith(/Consolidation transaction recipient does not match wallet base address/);
      warnings.should.have.length(0);

      const nativeValueHex = await buildTx({
        to: tokenContractAddress,
        value: '1',
        data: encodeErc20Transfer(baseAddress, '1000'),
      });
      await verify({
        caller: { type: 'consolidateToken' },
        txParams: effectiveTokenParams(),
        txHex: nativeValueHex,
      }).should.be.rejectedWith(/Consolidation token transfer must not carry native value/);
      warnings.should.have.length(0);
    });

    it('rejects an ERC-20 consolidation that calls a different token contract', async function () {
      const txHex = await buildTx({
        to: attackerAddress,
        value: '0',
        data: encodeErc20Transfer(baseAddress, '1000'),
      });
      await verify({
        caller: { type: 'consolidateToken', tokenName },
        txParams: effectiveTokenParams(),
        txHex,
      }).should.be.rejectedWith(/does not call the declared token contract/);
    });

    it('rejects an ERC-20 consolidation carrying native value', async function () {
      const txHex = await buildTx({
        to: tokenContractAddress,
        value: '1',
        data: encodeErc20Transfer(baseAddress, '1000'),
      });
      await verify({
        caller: { type: 'consolidateToken', tokenName },
        txParams: effectiveTokenParams(),
        txHex,
      }).should.be.rejectedWith(/native value/);
    });

    it('rejects ERC-20 consolidation calldata with trailing words', async function () {
      const data = `${encodeErc20Transfer(baseAddress, '1000')}${'00'.repeat(32)}`;
      const txHex = await buildTx({ to: tokenContractAddress, value: '0', data });
      await verify({
        caller: { type: 'consolidateToken', tokenName },
        txParams: effectiveTokenParams(),
        txHex,
      }).should.be.rejectedWith(/not canonical/);
    });

    it('never compares the swept amount', async function () {
      // A consolidation moves whatever the address holds: the calldata amount is not intent data.
      const swept = '123456789012345678901234567890';
      const txHex = await buildTx({
        to: tokenContractAddress,
        value: '0',
        data: encodeErc20Transfer(baseAddress, swept),
      });
      const result = await verify({
        intent: { intentType: 'consolidateToken', recipients: [tokenIntentRecipient('1')] },
        txParams: effectiveTokenParams(),
        txHex,
      });
      result.should.equal(true);
      warnings.should.have.length(0);
    });

    it('verifies a stored consolidateToken intent without a consolidation id', async function () {
      // The signing path derives `txParams.type` from `intent.intentType`; a missing consolidate id
      // must not downgrade the intent to "unknown type".
      const txHex = await buildTx({
        to: tokenContractAddress,
        value: '0',
        data: encodeErc20Transfer(baseAddress, '1000'),
      });
      const result = await verify({
        intent: { intentType: 'consolidateToken', recipients: [tokenIntentRecipient('1000')] },
        txParams: effectiveTokenParams(),
        txHex,
      });
      result.should.equal(true);
      warnings.should.have.length(0);
    });

    it('rejects a stored consolidateToken intent that pays a different recipient', async function () {
      const txHex = await buildTx({
        to: tokenContractAddress,
        value: '0',
        data: encodeErc20Transfer(attackerAddress, '1000'),
      });
      await verify({
        intent: { intentType: 'consolidateToken', recipients: [tokenIntentRecipient('1000')] },
        txParams: effectiveTokenParams(),
        txHex,
      }).should.be.rejectedWith(/Consolidation transaction recipient does not match wallet base address/);
    });

    it('rejects a stored consolidateToken intent that calls a different token contract', async function () {
      const txHex = await buildTx({
        to: otherTokenContractAddress,
        value: '0',
        data: encodeErc20Transfer(baseAddress, '1000'),
      });
      await verify({
        intent: { intentType: 'consolidateToken', recipients: [tokenIntentRecipient('1000')] },
        txParams: effectiveTokenParams(),
        txHex,
      }).should.be.rejectedWith(/does not call the declared token contract/);
    });

    it('warns instead of guessing when the stored token name cannot be resolved', async function () {
      const txHex = await buildTx({
        to: tokenContractAddress,
        value: '0',
        data: encodeErc20Transfer(baseAddress, '1000'),
      });
      const result = await verify({
        intent: {
          intentType: 'consolidateToken',
          recipients: [tokenIntentRecipient('1000', 'hteth:notaregisteredtoken')],
        },
        txParams: effectiveTokenParams(),
        txHex,
      });
      result.should.equal(true);
      warnings.should.have.length(1);
      warnings[0].should.match(/consolidateToken: .*cannot be checked/);
      warnings[0].should.not.match(/no fail-closed verifier/);
      // Console output reaches log pipelines: declared/decoded addresses and calldata stay out of it.
      warnings[0].should.not.match(/0x[0-9a-fA-F]{40}/);
      warnings[0].should.not.match(/expected|decoded/);
    });

    it('prefers the caller token declaration over the stored one', async function () {
      // Stored intent names a different token; the caller names the one the bytes target.
      const txHex = await buildTx({
        to: tokenContractAddress,
        value: '0',
        data: encodeErc20Transfer(baseAddress, '1000'),
      });
      const result = await verify({
        caller: { type: 'consolidateToken', tokenName },
        intent: { intentType: 'consolidateToken', recipients: [tokenIntentRecipient('1000', otherTokenName)] },
        txParams: effectiveTokenParams(),
        txHex,
      });
      result.should.equal(true);
      warnings.should.have.length(0);
    });

    it('rejects a consolidateToken intent that carries no transfer calldata', async function () {
      const txHex = await buildTx({ to: baseAddress, value: '1000' });
      await verify({
        caller: { type: 'consolidateToken' },
        txParams: effectiveTokenParams(),
        txHex,
      }).should.be.rejectedWith(/carries no ERC-20 transfer/);
    });

    it('keeps rejecting a consolidateToken call with no recipients and no consolidate id', async function () {
      // Recognising the type must not relax the missing-params guard: with no recipients and no
      // consolidate id there is nothing to verify the bytes against, so this stays a rejection
      // rather than becoming a warning on the way to signing.
      const txHex = await buildTx({
        to: tokenContractAddress,
        value: '0',
        data: encodeErc20Transfer(baseAddress, '1000'),
      });
      await verify({
        caller: { type: 'consolidateToken' },
        txParams: { type: 'consolidateToken' },
        txHex,
      }).should.be.rejectedWith(/missing txParams/);
      // A stored intent alone does not supply the params the guard requires either.
      await verify({
        intent: { intentType: 'consolidateToken', recipients: [tokenIntentRecipient('1000')] },
        txParams: { type: 'consolidateToken' },
        txHex,
      }).should.be.rejectedWith(/missing txParams/);
    });

    it('rejects malformed consolidation bytes even when the base address is unavailable', async function () {
      await verify({
        caller: { type: 'consolidate' },
        txParams: { type: 'consolidate' },
        txHex: '0x1234',
        omitBaseAddress: true,
      }).should.be.rejected();
    });

    it('decodes a consolidation before warning that the base address is unavailable', async function () {
      const txHex = await buildTx({ to: recipientAddress, value: '1000' });
      const result = await verify({
        caller: { type: 'consolidate' },
        txParams: { type: 'consolidate' },
        txHex,
        omitBaseAddress: true,
      });
      result.should.equal(true);
      warnings.some((warning) => /base address is not available/.test(warning)).should.equal(true);
    });

    it('rejects batch calldata when a field declares the chain asset', async function () {
      const batchData = encodeBatch([{ address: recipientAddress, amount: '1000' }]);
      const txHex = await buildTx({ to: batcherContractAddress, value: '1000', data: batchData });
      await verify({
        caller: { type: 'consolidate', tokenName: chain },
        txParams: { type: 'consolidate', tokenName: chain },
        txHex,
      }).should.be.rejectedWith(/must not carry calldata/);
      warnings.should.have.length(0);
    });

    it('warns for batch calldata when the consolidation declares no asset', async function () {
      // With no asset declared the batch could belong to a token or specialised sweep, so it is
      // reported as an unimplemented shape instead of being called a mismatch.
      const batchData = encodeBatch([{ address: recipientAddress, amount: '1000' }]);
      const txHex = await buildTx({ to: batcherContractAddress, value: '1000', data: batchData });
      const result = await verify({ caller: { type: 'consolidate' }, txParams: { type: 'consolidate' }, txHex });
      result.should.equal(true);
      warnings.should.have.length(1);
      warnings[0].should.match(/\[tss verification\] consolidate: batch consolidation calldata cannot be verified/);
      // Console output reaches log pipelines: decoded addresses and calldata stay out of it.
      warnings[0].should.not.match(/0x[0-9a-fA-F]{40}/);
      warnings[0].should.not.containEql(batchData.slice(10));
      warnings[0].should.not.match(/expected|decoded/);
    });

    it('rejects batch calldata on a token consolidation', async function () {
      const txHex = await buildTx({
        to: batcherContractAddress,
        value: '0',
        data: encodeBatchTransferFrom(tokenContractAddress, [{ address: baseAddress, amount: '1000' }]),
      });
      await verify({
        caller: { type: 'consolidateToken', tokenName },
        txParams: effectiveTokenParams(),
        txHex,
      }).should.be.rejectedWith(/does not use ERC-20 transfer/);
      warnings.should.have.length(0);
    });

    it('keeps the historic consolidationToBaseAddress check', async function () {
      const txHex = await buildTx({ to: attackerAddress, value: '1000' });
      await verify({
        caller: { type: 'transfer', recipients: [{ address: attackerAddress, amount: '1000' }] },
        txHex,
        verification: { consolidationToBaseAddress: true },
      }).should.be.rejectedWith(/Consolidation transaction recipient does not match wallet base address/);
    });

    it('keeps every historic flag rejection ahead of any unverifiable report', async function () {
      // The flag has always compared `tx.to` with the base address for every calldata that is not
      // an ERC-20 transfer, so neither a plain function call nor a batch may be downgraded to a
      // warning on this path.
      const approveData = `0x095ea7b3${addrWord(attackerAddress)}${word(1n)}`;
      const approveHex = await buildTx({ to: attackerAddress, value: '0', data: approveData });
      await verify({
        caller: { type: 'consolidate' },
        txHex: approveHex,
        verification: { consolidationToBaseAddress: true },
      }).should.be.rejectedWith(/Consolidation transaction recipient does not match wallet base address/);

      const batchData = encodeBatch([{ address: baseAddress, amount: '1000' }]);
      const batchHex = await buildTx({ to: batcherContractAddress, value: '1000', data: batchData });
      await verify({
        caller: { type: 'consolidate' },
        txHex: batchHex,
        verification: { consolidationToBaseAddress: true },
      }).should.be.rejectedWith(/Consolidation transaction recipient does not match wallet base address/);
      warnings.should.have.length(0);
    });

    it('keeps the historic flag pass for token-shaped calldata', async function () {
      // The flag's ERC-20 branch never compared `to` with the base address, so a v6 token
      // consolidation still verifies and reports only the contract it cannot check.
      const txHex = await buildTx({
        to: tokenContractAddress,
        value: '0',
        data: encodeErc20Transfer(baseAddress, '1000'),
      });
      const result = await verify({
        caller: { type: 'consolidate' },
        txHex,
        verification: { consolidationToBaseAddress: true },
      });
      result.should.equal(true);
      warnings.should.have.length(1);
      warnings[0].should.match(/token contract cannot be checked/);
    });

    it('rejects a wrong function on an established token contract', async function () {
      // The intent names the token and the transaction calls that contract, but not with
      // transfer(address,uint256): the declared token cannot reach the base address this way.
      const approve = `0x095ea7b3${addrWord(attackerAddress)}${word((1n << 256n) - 1n)}`;
      const txHex = await buildTx({ to: tokenContractAddress, value: '0', data: approve });
      await verify({
        caller: { type: 'consolidateToken', tokenName },
        txParams: effectiveTokenParams(),
        txHex,
      }).should.be.rejectedWith(/does not use ERC-20 transfer/);
      warnings.should.have.length(0);
    });

    it('rejects native value on an unresolved token consolidation with unknown calldata', async function () {
      // The contract is unknown, but a token sweep carrying native value is a definite mismatch:
      // the missing address must not suppress that check.
      const approve = `0x095ea7b3${addrWord(attackerAddress)}${word(1n)}`;
      const txHex = await buildTx({ to: attackerAddress, value: '5', data: approve });
      await verify({
        caller: { type: 'consolidateToken' },
        txParams: effectiveTokenParams(),
        txHex,
      }).should.be.rejectedWith(/must not carry native value/);
      warnings.should.have.length(0);
    });

    it('warns for non-transfer calldata while the token contract is unresolved', async function () {
      // The contract is unknown, so the shape cannot be anchored to it; the native-value check and
      // the zero-value case below are the independent expectations this intent establishes.
      const approve = `0x095ea7b3${addrWord(attackerAddress)}${word(1n)}`;
      const txHex = await buildTx({ to: attackerAddress, value: '0', data: approve });
      const result = await verify({
        caller: { type: 'consolidateToken' },
        txParams: effectiveTokenParams(),
        txHex,
      });
      result.should.equal(true);
      warnings.should.have.length(1);
      warnings[0].should.match(/token contract nor the calldata can be verified/);
      warnings[0].should.not.match(/no fail-closed verifier/);
    });

    it('does not treat another chain coin name as this chain native asset', async function () {
      // `btc` is a statics coin, but not this chain's asset: the declaration cannot be trusted to
      // mean "native here", so the shape is reported instead of being rejected as native calldata.
      const approve = `0x095ea7b3${addrWord(attackerAddress)}${word(1n)}`;
      const txHex = await buildTx({ to: baseAddress, value: '0', data: approve });
      const result = await verify({
        caller: { type: 'consolidate', tokenName: 'btc' },
        txParams: { type: 'consolidate', tokenName: 'btc' },
        txHex,
      });
      result.should.equal(true);
      warnings.should.have.length(1);
      warnings[0].should.match(/asset 'btc' on another network/);
    });

    it('does not adopt a token contract declared on another network', async function () {
      // Bare `usdc` resolves in statics to the Ethereum contract; on BSC it names no local asset,
      // so it must warn instead of rejecting the BSC token contract as the wrong one.
      const bscStatics = coins.get('bsc');
      const txHex = await buildTxFor(bscStatics, {
        to: tokenContractAddress,
        value: '0',
        data: encodeErc20Transfer(baseAddress, '1000'),
      });
      const result = await new TestEthLikeCoin(bitgo, bscStatics).verifyTssTransaction({
        callerTxParams: { type: 'consolidateToken', tokenName: 'usdc' },
        txParams: { type: 'consolidateToken', recipients: [{ address: baseAddress, amount: '1000' }] },
        txPrebuild: { txHex },
        wallet: { coinSpecific: () => ({ baseAddress }) },
      } as unknown as Kernel);
      result.should.equal(true);
      warnings.should.have.length(1);
      warnings[0].should.match(/another network/);
      warnings[0].should.match(/token contract cannot be checked/);
    });

    it('keeps bare usdc resolvable on its own network', async function () {
      const ethStatics = coins.get('eth');
      const usdcContract = String((coins.get('usdc') as ContractAddressDefinedToken).contractAddress);
      const txHex = await buildTxFor(ethStatics, {
        to: usdcContract,
        value: '0',
        data: encodeErc20Transfer(baseAddress, '1000'),
      });
      const result = await new TestEthLikeCoin(bitgo, ethStatics).verifyTssTransaction({
        callerTxParams: { type: 'consolidateToken', tokenName: 'usdc' },
        txParams: { type: 'consolidateToken', recipients: [{ address: baseAddress, amount: '1000' }] },
        txPrebuild: { txHex },
        wallet: { coinSpecific: () => ({ baseAddress }) },
      } as unknown as Kernel);
      result.should.equal(true);
      warnings.should.have.length(0);
    });

    it('verifies a BSC token consolidation on its own network', async function () {
      // BSC tokens are BscCoin, not Erc20Coin: the ERC-20 family is established by the statics
      // class, not by one concrete class name.
      const bscStatics = coins.get('bsc');
      const bscTokenName = 'bsc:busd';
      const bscContract = String((coins.get(bscTokenName) as ContractAddressDefinedToken).contractAddress);
      const txHex = await buildTxFor(bscStatics, {
        to: bscContract,
        value: '0',
        data: encodeErc20Transfer(baseAddress, '1000'),
      });
      const result = await new TestEthLikeCoin(bitgo, bscStatics).verifyTssTransaction({
        callerTxParams: { type: 'consolidateToken', tokenName: bscTokenName },
        txParams: { type: 'consolidateToken', recipients: [{ address: baseAddress, amount: '1000' }] },
        txPrebuild: { txHex },
        wallet: { coinSpecific: () => ({ baseAddress }) },
      } as unknown as Kernel);
      result.should.equal(true);
      warnings.should.have.length(0);
    });

    it('rejects a wrong function on a BSC token consolidation', async function () {
      const bscStatics = coins.get('bsc');
      const bscTokenName = 'bsc:busd';
      const bscContract = String((coins.get(bscTokenName) as ContractAddressDefinedToken).contractAddress);
      const approve = `0x095ea7b3${addrWord(attackerAddress)}${word(1n)}`;
      const txHex = await buildTxFor(bscStatics, { to: bscContract, value: '0', data: approve });
      await new TestEthLikeCoin(bitgo, bscStatics)
        .verifyTssTransaction({
          callerTxParams: { type: 'consolidateToken', tokenName: bscTokenName },
          txParams: { type: 'consolidateToken', recipients: [{ address: baseAddress, amount: '1000' }] },
          txPrebuild: { txHex },
          wallet: { coinSpecific: () => ({ baseAddress }) },
        } as unknown as Kernel)
        .should.be.rejectedWith(/does not use ERC-20 transfer/);
    });

    it('verifies an XDC token consolidation on its own network', async function () {
      const xdcStatics = coins.get('xdc');
      const xdcTokenName = 'xdc:usdc';
      const xdcContract = String((coins.get(xdcTokenName) as ContractAddressDefinedToken).contractAddress);
      const txHex = await buildTxFor(xdcStatics, {
        to: xdcContract,
        value: '0',
        data: encodeErc20Transfer(baseAddress, '1000'),
      });
      const result = await new TestEthLikeCoin(bitgo, xdcStatics).verifyTssTransaction({
        callerTxParams: { type: 'consolidateToken', tokenName: xdcTokenName },
        txParams: { type: 'consolidateToken', recipients: [{ address: baseAddress, amount: '1000' }] },
        txPrebuild: { txHex },
        wallet: { coinSpecific: () => ({ baseAddress }) },
      } as unknown as Kernel);
      result.should.equal(true);
      warnings.should.have.length(0);
    });

    it('rejects a wrong function on an XDC token consolidation', async function () {
      const xdcStatics = coins.get('xdc');
      const xdcTokenName = 'xdc:usdc';
      const xdcContract = String((coins.get(xdcTokenName) as ContractAddressDefinedToken).contractAddress);
      const approve = `0x095ea7b3${addrWord(attackerAddress)}${word(1n)}`;
      const txHex = await buildTxFor(xdcStatics, { to: xdcContract, value: '0', data: approve });
      await new TestEthLikeCoin(bitgo, xdcStatics)
        .verifyTssTransaction({
          callerTxParams: { type: 'consolidateToken', tokenName: xdcTokenName },
          txParams: { type: 'consolidateToken', recipients: [{ address: baseAddress, amount: '1000' }] },
          txPrebuild: { txHex },
          wallet: { coinSpecific: () => ({ baseAddress }) },
        } as unknown as Kernel)
        .should.be.rejectedWith(/does not use ERC-20 transfer/);
    });

    it('warns for a known NFT instead of forcing it through ERC-20', async function () {
      // Erc721Coin also extends ContractAddressDefinedToken; its standard is unclassified, so a
      // transfer-shaped call is reported rather than accepted as an ERC-20 sweep.
      const nftChain = 'thbarevm';
      const nftStatics = coins.get(nftChain);
      const nftTokenName = 'thbarevm:tmnft';
      const nftContract = String((coins.get(nftTokenName) as ContractAddressDefinedToken).contractAddress);
      const txHex = await buildTxFor(nftStatics, {
        to: nftContract,
        value: '0',
        data: encodeErc20Transfer(baseAddress, '1'),
      });
      const result = await new TestEthLikeCoin(bitgo, nftStatics).verifyTssTransaction({
        callerTxParams: { type: 'consolidateToken', tokenName: nftTokenName },
        txParams: { type: 'consolidateToken', recipients: [{ address: baseAddress, amount: '1' }] },
        txPrebuild: { txHex },
        wallet: { coinSpecific: () => ({ baseAddress }) },
      } as unknown as Kernel);
      result.should.equal(true);
      warnings.should.have.length(1);
      warnings[0].should.match(/not established as ERC-20/);
    });

    it('reports, not rejects, native value on a specialised token shape', async function () {
      const specialisedToken = 'hteth:ctest1';
      const specialisedContract = String((coins.get(specialisedToken) as ContractAddressDefinedToken).contractAddress);
      const approve = `0x095ea7b3${addrWord(attackerAddress)}${word(1n)}`;
      const txHex = await buildTx({ to: specialisedContract, value: '5', data: approve });
      const result = await verify({
        caller: { type: 'consolidateToken', tokenName: specialisedToken },
        txParams: effectiveTokenParams(),
        txHex,
      });
      result.should.equal(true);
      warnings.should.have.length(1);
      warnings[0].should.match(/specialised token consolidation/);
    });

    it('does not reject a specialised token consolidation it does not model', async function () {
      // ERC-7984 sweeps are verified by the token coin's own verifier; a format this verifier does
      // not own is reported here, never rejected.
      const specialisedToken = 'hteth:ctest1';
      const specialisedContract = String((coins.get(specialisedToken) as ContractAddressDefinedToken).contractAddress);
      const approve = `0x095ea7b3${addrWord(attackerAddress)}${word(1n)}`;
      const txHex = await buildTx({ to: specialisedContract, value: '0', data: approve });
      const result = await verify({
        caller: { type: 'consolidateToken', tokenName: specialisedToken },
        txParams: effectiveTokenParams(),
        txHex,
      });
      result.should.equal(true);
      warnings.should.have.length(1);
      warnings[0].should.match(/specialised token consolidation/);
    });

    it('warns for batch calldata while the token contract is unresolved', async function () {
      const txHex = await buildTx({
        to: batcherContractAddress,
        value: '0',
        data: encodeBatchTransferFrom(tokenContractAddress, [{ address: baseAddress, amount: '1000' }]),
      });
      const result = await verify({
        caller: { type: 'consolidateToken' },
        txParams: effectiveTokenParams(),
        txHex,
      });
      result.should.equal(true);
      warnings.should.have.length(1);
      warnings[0].should.match(/batch consolidation calldata cannot be verified/);
    });

    it('rejects native value on an unresolved token batch', async function () {
      // Native value on a declared token does not depend on knowing the contract: the non-batch
      // branch already rejects it, and the batch encoding must not be a way around that.
      const txHex = await buildTx({
        to: batcherContractAddress,
        value: '5',
        data: encodeBatchTransferFrom(tokenContractAddress, [{ address: baseAddress, amount: '1000' }]),
      });
      await verify({
        caller: { type: 'consolidateToken' },
        txParams: effectiveTokenParams(),
        txHex,
      }).should.be.rejectedWith(/must not carry native value/);
      warnings.should.have.length(0);
    });

    it('rejects native value and any batch encoding on a token batch', async function () {
      const recipients = [{ address: baseAddress, amount: '1000' }];
      const withValueHex = await buildTx({
        to: batcherContractAddress,
        value: '5',
        data: encodeBatchTransferFrom(tokenContractAddress, recipients),
      });
      await verify({
        caller: { type: 'consolidateToken', tokenName },
        txParams: effectiveTokenParams(),
        txHex: withValueHex,
      }).should.be.rejectedWith(/must not carry native value/);

      const zeroValueHex = await buildTx({
        to: batcherContractAddress,
        value: '0',
        data: encodeBatchTransferFrom(tokenContractAddress, recipients),
      });
      await verify({
        caller: { type: 'consolidateToken', tokenName },
        txParams: effectiveTokenParams(),
        txHex: zeroValueHex,
      }).should.be.rejectedWith(/does not use ERC-20 transfer/);
      warnings.should.have.length(0);
    });
  });

  describe('assertSignableConsistency envelope handling', function () {
    const tbscCoin = coins.get('tbsc');
    const tbscChainId = (tbscCoin.network as EthLikeNetwork).chainId;

    it('parses a legacy type-0 envelope on an EIP-1559 chain and compares its preimage', async function () {
      const txHex = await buildTxFor(staticsCoin, { to: recipientAddress, value: '1000' });
      txHex.startsWith('0x02').should.equal(false);
      (() => coin.assertSignableConsistency(txHex, 'deadbeef')).should.throw(/signableHex is inconsistent/);
    });

    it('parses a type-2 envelope on an EIP-1559 chain and compares its preimage', async function () {
      const txHex = await buildTxFor(staticsCoin, { to: recipientAddress, value: '1000', eip1559: true });
      txHex.startsWith('0x02').should.equal(true);
      (() => coin.assertSignableConsistency(txHex, 'deadbeef')).should.throw(/signableHex is inconsistent/);
    });

    it('uses the base chain fork for a token coin on an EIP-1559 chain', async function () {
      const tokenCoin = new TestEthLikeCoin(bitgo, coins.get(tokenName));
      const txHex = await buildTxFor(coins.get(tokenName), { to: recipientAddress, value: '1000', eip1559: true });
      (() => tokenCoin.assertSignableConsistency(txHex, 'deadbeef')).should.throw(/signableHex is inconsistent/);
    });

    it('parses a legacy type-0 envelope on a chain without EIP-1559', async function () {
      const legacyCoin = new TestEthLikeCoin(bitgo, tbscCoin);
      const txHex = await buildTxFor(tbscCoin, { to: recipientAddress, value: '1000' });
      (() => legacyCoin.assertSignableConsistency(txHex, 'deadbeef')).should.throw(/signableHex is inconsistent/);
    });

    it('rejects a type-2 envelope on a chain without EIP-1559 before comparing preimages', function () {
      const legacyCoin = new TestEthLikeCoin(bitgo, tbscCoin);
      const common = EthereumCommon.forCustomChain(
        'mainnet',
        { name: 'tbsc', networkId: tbscChainId, chainId: tbscChainId },
        'london'
      );
      const typed = FeeMarketEIP1559Transaction.fromTxData(
        {
          nonce: 1,
          gasLimit: '0x186a0',
          maxFeePerGas: '0x0a',
          maxPriorityFeePerGas: '0x01',
          to: recipientAddress,
          value: '0x3e8',
          data: '0x',
          chainId: tbscChainId,
        },
        { common }
      );
      (() => legacyCoin.assertSignableConsistency(`0x${typed.serialize().toString('hex')}`, 'deadbeef')).should.throw(
        /EIP-1559 not enabled/
      );
    });
  });
});
