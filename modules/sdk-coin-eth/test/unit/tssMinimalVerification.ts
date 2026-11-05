import 'should';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BaseCoin as StaticsBaseCoin, coins, ContractAddressDefinedToken, EthereumNetwork } from '@bitgo/statics';
import {
  IBaseCoin,
  PopulatedIntent,
  resolveEffectiveTxParams,
  TxIntentMismatchRecipientError,
  TransactionParams,
  TransactionType,
  TxRequest,
  Wallet,
} from '@bitgo/sdk-core';

import { Erc20Token, Eth, Hteth, optionalDeps, TransactionBuilder } from '../../src';

/**
 * Minimal fail-closed EVM TSS payment + compatible consolidation verification
 * (TOB-BITGOEDMPC-2 / INFOSEC-671 / CECHO-2460).
 *
 * Every case builds the real serialized transaction bytes the user's key share would sign and
 * runs them through the coin's real verification entry point
 * (`verifyTransaction({ walletType: 'tss' })` -> `verifyTssTransaction`). Nothing is stubbed:
 * intent types, calldata, serialization formats and statics token contracts are the production
 * ones.
 *
 * The behaviour this file pins:
 * - a definite mismatch between the bytes and the user intent always throws, with no opt-in;
 * - metadata that cannot be resolved locally only warns (it is not a mismatch) and never hides a
 *   definite mismatch that is independently provable;
 * - `contractCall` / `customTx` are always rejected: EVM has no verifiable shape for them;
 * - intent types without a handler warn instead of silently passing.
 */

const recipientAddress = '0x174cfd823af8ce27ed0afee3fcf3c3ba259116be';
const secondRecipientAddress = '0x9c7e8ce6825bd48278b3ab59228ee26f8be7925b';
const attackerAddress = '0x7e85bdc27c050e3905ebf4b8e634d9ad6edd0de6';
const baseAddress = '0x1111111111111111111111111111111111111111';
const otherTokenAddress = '0x2222222222222222222222222222222222222222';
const MAX_UINT256 = ((1n << 256n) - 1n).toString();

/** Two distinct tokens registered in statics, resolved locally by name. */
const tokenName = 'hteth:tusdc';
const otherTokenName = 'hteth:tusdt';

const tokenContractOf = (name: string): string => {
  const token = coins.get(name);
  if (!(token instanceof ContractAddressDefinedToken)) {
    throw new Error(`${name} has no contract address in statics`);
  }
  return String(token.contractAddress);
};

const tokenContractAddress = tokenContractOf(tokenName);
const otherTokenContractAddress = tokenContractOf(otherTokenName);

/** Network batcher configured in statics for the chain under test. */
const batcherAddress = String((coins.get('hteth').network as EthereumNetwork).batcherContractAddress ?? '');
if (!/^0x[0-9a-fA-F]{40}$/.test(batcherAddress)) {
  // A batch test built against a network with no batcher would silently exercise the
  // unresolved-batcher warning instead of the comparison it names.
  throw new Error(`hteth has no statics batcher contract address (got '${batcherAddress}')`);
}

// ---------------------------------------------------------------------------------------------
// Calldata encoding — built with the ABI library the SDK ships, never hand-written hex.
// ---------------------------------------------------------------------------------------------

const selector = (signature: string, types: string[]): string =>
  optionalDeps.ethAbi.methodID(signature, types).toString('hex');

const encode = (signature: string, types: string[], values: unknown[]): string =>
  `0x${selector(signature, types)}${optionalDeps.ethAbi.rawEncode(types, values).toString('hex')}`;

const word = (value: bigint): string => value.toString(16).padStart(64, '0');
const addrWord = (address: string): string => address.toLowerCase().replace(/^0x/, '').padStart(64, '0');

/** ERC-20 `transfer(address,uint256)` calldata. */
const erc20Transfer = (to: string, amount: string): string =>
  `0x${selector('transfer', ['address', 'uint256'])}${addrWord(to)}${word(BigInt(amount))}`;

/** ERC-20 `approve(address,uint256)` calldata — a known payment-wrong function. */
const erc20Approve = (spender: string, amount: string): string =>
  `0x${selector('approve', ['address', 'uint256'])}${addrWord(spender)}${word(BigInt(amount))}`;

/** Native batch `batch(address[],uint256[])` calldata. */
const nativeBatch = (recipients: { address: string; amount: string }[]): string =>
  encode('batch', ['address[]', 'uint256[]'], [recipients.map((r) => r.address), recipients.map((r) => r.amount)]);

/** Token batch `batchTransferFrom(address,address[],uint256[])` calldata. */
const tokenBatch = (contract: string, recipients: { address: string; amount: string }[]): string =>
  encode(
    'batchTransferFrom',
    ['address', 'address[]', 'uint256[]'],
    [contract, recipients.map((r) => r.address), recipients.map((r) => r.amount)]
  );

// ---------------------------------------------------------------------------------------------
// Serialized bytes
// ---------------------------------------------------------------------------------------------

type Serialization = 'legacy' | 'eip1559';

/**
 * Build the real transaction bytes for a send on `chain`. `legacy` builds a type-0 transaction,
 * `eip1559` a type-2 one: the same intent must verify identically on both encodings.
 */
const buildTx = async (
  opts: { to: string; value?: string; data?: string },
  serialization: Serialization = 'legacy',
  chain = 'hteth'
): Promise<string> => {
  const builder = new TransactionBuilder(coins.get(chain));
  builder.type(opts.data && opts.data !== '0x' ? TransactionType.ContractCall : TransactionType.SingleSigSend);
  builder.fee(
    serialization === 'eip1559'
      ? { fee: '10', gasLimit: '100000', eip1559: { maxFeePerGas: '10', maxPriorityFeePerGas: '1' } }
      : { fee: '10', gasLimit: '100000' }
  );
  builder.counter(1);
  builder.contract(opts.to);
  if (opts.value !== undefined) {
    builder.value(opts.value);
  }
  if (opts.data !== undefined) {
    builder.data(opts.data);
  }
  return (await builder.build()).toBroadcastFormat();
};

// ---------------------------------------------------------------------------------------------
// Verification harness
// ---------------------------------------------------------------------------------------------

/**
 * The verifier accepts the loose EVM signing shapes (`tokenData` on recipients, a stored
 * `PopulatedIntent`, a caller `txParams` that predates `resolveEffectiveTxParams`). The public
 * option type narrows some of those, so the call is made through its runtime signature; the
 * object below is the exact one the TSS signing path passes.
 */
interface TssVerifyCall {
  txParams: Record<string, unknown>;
  txPrebuild: { txHex: string; coin: string; walletId: string };
  wallet: Wallet;
  verification: Record<string, unknown>;
  walletType: 'tss';
  intent?: PopulatedIntent;
  callerTxParams?: Record<string, unknown>;
}

interface TssVerifier {
  verifyTransaction(params: TssVerifyCall): Promise<boolean>;
}

const asVerifier = (coin: Eth): TssVerifier => coin as unknown as TssVerifier;

let sharedClient: TestBitGoAPI | undefined;

/**
 * The decorated client registers every ERC-20 token constructor, which is expensive and has no
 * per-test state, so one shared instance serves every harness. Only the coin and wallet under
 * test are built per test.
 */
const makeClient = (): TestBitGoAPI => {
  if (sharedClient) {
    return sharedClient;
  }
  const client = TestBitGo.decorate(BitGoAPI, { env: 'test' });
  Erc20Token.createTokenConstructors().forEach(({ name, coinConstructor }) =>
    client.safeRegister(name, coinConstructor)
  );
  client.safeRegister('eth', Eth.createInstance);
  client.safeRegister('hteth', Hteth.createInstance);
  client.initializeTestVars();
  sharedClient = client;
  return client;
};

/**
 * A coin instance for `staticsCoin`, used for chains this module does not register (kavaevm has
 * no statics batcher contract, so it exercises the unresolved-batcher path with real bytes).
 */
const makeChainCoin = (client: TestBitGoAPI, staticsCoin: Readonly<StaticsBaseCoin>): Eth =>
  Eth.createInstance(client, staticsCoin) as unknown as Eth;

interface VerifyOptions {
  /** Stored tx request intent (pending-approval path). */
  intent?: Record<string, unknown>;
  /** Untouched caller params: `undefined` means the caller supplied none. */
  callerTxParams?: Record<string, unknown>;
  verification?: Record<string, unknown>;
}

interface Harness {
  client: TestBitGoAPI;
  verify: (txParams: Record<string, unknown>, txHex: string, opts?: VerifyOptions) => Promise<boolean>;
  /** Mirrors the TSS signing path: the stored intent is folded into the effective txParams. */
  verifySigningPath: (
    callerTxParams: Record<string, unknown> | undefined,
    intent: Record<string, unknown>,
    txHex: string
  ) => Promise<boolean>;
}

interface HarnessOptions {
  chain?: string;
  staticsCoin?: Readonly<StaticsBaseCoin>;
  /** Wallet coinSpecific; the default harness carries the base address consolidations go to. */
  coinSpecific?: Record<string, unknown>;
}

const makeHarness = (options: HarnessOptions = {}): Harness => {
  const chain = options.chain ?? 'hteth';
  const client = makeClient();
  const coin = options.staticsCoin
    ? makeChainCoin(client, options.staticsCoin)
    : (client.coin(chain) as unknown as Eth);
  const wallet = new Wallet(client, coin as unknown as IBaseCoin, {
    coinSpecific: options.coinSpecific ?? { baseAddress },
  });

  const verify = (txParams: Record<string, unknown>, txHex: string, opts: VerifyOptions = {}): Promise<boolean> =>
    asVerifier(coin).verifyTransaction({
      txParams,
      txPrebuild: { txHex, coin: chain, walletId: 'wallet-id' },
      wallet,
      verification: opts.verification ?? {},
      walletType: 'tss',
      ...(opts.intent ? { intent: opts.intent as unknown as PopulatedIntent } : {}),
      ...(opts.callerTxParams ? { callerTxParams: opts.callerTxParams } : {}),
    });

  const verifySigningPath = (
    callerTxParams: Record<string, unknown> | undefined,
    intent: Record<string, unknown>,
    txHex: string
  ): Promise<boolean> => {
    const txRequest = { txRequestId: 'signing-path', walletId: 'wallet-id', intent } as unknown as TxRequest;
    // Caller params are the loose signing shapes (a `type` string, `tokenData` on recipients);
    // resolveEffectiveTxParams only spreads them, so the structural cast is exact at runtime.
    const effective = resolveEffectiveTxParams(
      txRequest,
      callerTxParams as unknown as TransactionParams | undefined,
      chain
    );
    return verify(effective as unknown as Record<string, unknown>, txHex, {
      intent,
      ...(callerTxParams ? { callerTxParams } : {}),
    });
  };

  return { client, verify, verifySigningPath };
};

interface CapturedRun {
  result: boolean;
  /** Every `console.warn` line the verifier emitted while running, pre-joined. */
  warnings: string[];
}

/**
 * Run a verification while collecting the verifier's warning lines. Warnings are the only
 * channel for cases the verifier cannot decide locally; they never change the return value.
 */
const captureWarnings = async (run: () => Promise<boolean>): Promise<CapturedRun> => {
  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]): void => {
    warnings.push(args.map((arg) => String(arg)).join(' '));
  };
  try {
    return { result: await run(), warnings };
  } finally {
    console.warn = originalWarn;
  }
};

const matching = (warnings: string[], reason: RegExp): string[] => warnings.filter((line) => reason.test(line));

/**
 * The verifier refuses the bytes outright: it throws and never downgrades the case to a warning.
 * Used where the failure is malformed bytes rather than a value mismatch with the intent.
 */
const expectFailClosed = async (run: () => Promise<boolean>): Promise<void> => {
  let rejected = false;
  const { warnings } = await captureWarnings(async () => {
    try {
      await run();
    } catch {
      rejected = true;
    }
    return !rejected;
  });
  rejected.should.equal(true, 'the verifier must reject these bytes');
  warnings.should.have.length(0);
};

// ---------------------------------------------------------------------------------------------

describe('EVM TSS minimal payment verification (CECHO-2460)', function () {
  this.timeout(120000);

  let harness: Harness;

  beforeEach(function () {
    harness = makeHarness();
  });

  describe('native payment', function () {
    const intent = { type: 'transfer', recipients: [{ address: recipientAddress, amount: '1000' }] };

    it('verifies a matching native send with no warnings', async function () {
      for (const serialization of ['legacy', 'eip1559'] as Serialization[]) {
        const txHex = await buildTx({ to: recipientAddress, value: '1000' }, serialization);
        const { result, warnings } = await captureWarnings(() => harness.verify(intent, txHex));
        result.should.equal(true);
        warnings.should.have.length(0);
      }
    });

    it('treats the stored spelling `payment` as the same intent', async function () {
      const txHex = await buildTx({ to: recipientAddress, value: '1000' });
      const { result, warnings } = await captureWarnings(() =>
        harness.verify({ type: 'payment', recipients: [{ address: recipientAddress, amount: '1000' }] }, txHex)
      );
      result.should.equal(true);
      warnings.should.have.length(0);
    });

    it('fails a redirected destination', async function () {
      const txHex = await buildTx({ to: attackerAddress, value: '1000' });
      await harness.verify(intent, txHex).should.be.rejectedWith(TxIntentMismatchRecipientError);
    });

    it('fails an inflated value', async function () {
      const txHex = await buildTx({ to: recipientAddress, value: '9999' });
      await harness.verify(intent, txHex).should.be.rejectedWith(TxIntentMismatchRecipientError);
    });

    it('fails payment calldata it cannot recognize as a payment shape', async function () {
      const txHex = await buildTx({ to: recipientAddress, value: '1000', data: '0xdeadbeef' });
      await harness.verify(intent, txHex).should.be.rejectedWith(TxIntentMismatchRecipientError);
    });
  });

  describe('ERC-20 token payment', function () {
    const tokenRecipient = {
      address: recipientAddress,
      amount: '10000000',
      tokenData: { tokenName },
    };
    const intent = { type: 'transfer', recipients: [tokenRecipient] };

    it('verifies an exact transfer(recipient, amount) to the intended token contract', async function () {
      for (const serialization of ['legacy', 'eip1559'] as Serialization[]) {
        const txHex = await buildTx(
          { to: tokenContractAddress, value: '0', data: erc20Transfer(recipientAddress, '10000000') },
          serialization
        );
        const { result, warnings } = await captureWarnings(() => harness.verify(intent, txHex));
        result.should.equal(true);
        warnings.should.have.length(0);
      }
    });

    it('resolves the token from a bare top-level statics name', async function () {
      const txHex = await buildTx({
        to: tokenContractAddress,
        value: '0',
        data: erc20Transfer(recipientAddress, '10000000'),
      });
      const { result, warnings } = await captureWarnings(() =>
        harness.verify(
          { type: 'transfer', tokenName, recipients: [{ address: recipientAddress, amount: '10000000' }] },
          txHex
        )
      );
      result.should.equal(true);
      warnings.should.have.length(0);
    });

    it('resolves a bare Ethereum mainnet `usdc` name to the trusted statics contract', async function () {
      // Bare means no chain prefix: `usdc`, not `eth:usdc`. The contract the bytes are compared
      // against must come from statics, so a wrong contract cannot be papered over.
      const mainnetTokenName = 'usdc';
      const mainnetUsdc = coins.get(mainnetTokenName);
      if (!(mainnetUsdc instanceof ContractAddressDefinedToken)) {
        throw new Error(`statics has no token contract for '${mainnetTokenName}'`);
      }
      const usdcContractAddress = String(mainnetUsdc.contractAddress);
      // Pin the canonical mainnet USDC contract: a statics change must not silently re-point this test.
      usdcContractAddress.should.equal('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');

      const mainnetHarness = makeHarness({ chain: 'eth' });
      const mainnetIntent = {
        type: 'transfer',
        tokenName: mainnetTokenName,
        recipients: [{ address: recipientAddress, amount: '10000000' }],
      };
      const correctContractHex = await buildTx(
        { to: usdcContractAddress, value: '0', data: erc20Transfer(recipientAddress, '10000000') },
        'legacy',
        'eth'
      );
      const { result, warnings } = await captureWarnings(() =>
        mainnetHarness.verify(mainnetIntent, correctContractHex)
      );
      result.should.equal(true);
      warnings.should.have.length(0);

      // A different, genuinely registered mainnet token must not satisfy a `usdc` intent.
      const mainnetUsdt = coins.get('usdt');
      if (!(mainnetUsdt instanceof ContractAddressDefinedToken)) {
        throw new Error("statics has no token contract for 'usdt'");
      }
      const wrongContractHex = await buildTx(
        { to: String(mainnetUsdt.contractAddress), value: '0', data: erc20Transfer(recipientAddress, '10000000') },
        'legacy',
        'eth'
      );
      await mainnetHarness
        .verify(mainnetIntent, wrongContractHex)
        .should.be.rejectedWith(TxIntentMismatchRecipientError);
    });

    it('resolves the token the coin instance itself represents', async function () {
      const tokenHarness = makeHarness();
      const tokenCoin = tokenHarness.client.coin(tokenName) as unknown as Eth;
      const tokenWallet = new Wallet(tokenHarness.client, tokenCoin as unknown as IBaseCoin, {
        coinSpecific: { baseAddress },
      });
      const txHex = await buildTx({
        to: tokenContractAddress,
        value: '0',
        data: erc20Transfer(recipientAddress, '10000000'),
      });
      const { result, warnings } = await captureWarnings(() =>
        asVerifier(tokenCoin).verifyTransaction({
          txParams: { type: 'transfer', recipients: [{ address: recipientAddress, amount: '10000000' }] },
          txPrebuild: { txHex, coin: tokenName, walletId: 'wallet-id' },
          wallet: tokenWallet,
          verification: {},
          walletType: 'tss',
        })
      );
      result.should.equal(true);
      warnings.should.have.length(0);
    });

    it('fails a transfer sent to a different token contract', async function () {
      const txHex = await buildTx({
        to: otherTokenContractAddress,
        value: '0',
        data: erc20Transfer(recipientAddress, '10000000'),
      });
      await harness.verify(intent, txHex).should.be.rejectedWith(TxIntentMismatchRecipientError);
    });

    it('fails a wrong function under a token payment intent', async function () {
      const txHex = await buildTx({
        to: tokenContractAddress,
        value: '0',
        data: erc20Approve(attackerAddress, MAX_UINT256),
      });
      await harness.verify(intent, txHex).should.be.rejectedWith(TxIntentMismatchRecipientError);
    });

    it('fails a swapped inner recipient', async function () {
      const txHex = await buildTx({
        to: tokenContractAddress,
        value: '0',
        data: erc20Transfer(attackerAddress, '10000000'),
      });
      await harness.verify(intent, txHex).should.be.rejectedWith(TxIntentMismatchRecipientError);
    });

    it('fails a swapped inner amount', async function () {
      const txHex = await buildTx({
        to: tokenContractAddress,
        value: '0',
        data: erc20Transfer(recipientAddress, '99999999'),
      });
      await harness.verify(intent, txHex).should.be.rejectedWith(TxIntentMismatchRecipientError);
    });

    it('fails native value riding along ERC-20 calldata', async function () {
      const txHex = await buildTx({
        to: tokenContractAddress,
        value: '5',
        data: erc20Transfer(recipientAddress, '10000000'),
      });
      await harness.verify(intent, txHex).should.be.rejectedWith(TxIntentMismatchRecipientError);
    });

    it('fails trailing calldata after a complete transfer(address,uint256) payload', async function () {
      // An ERC-20 ignores trailing bytes; the verifier must not, or those bytes could carry a
      // second call nobody verified.
      const txHex = await buildTx({
        to: tokenContractAddress,
        value: '0',
        data: `${erc20Transfer(recipientAddress, '10000000')}${'11'.repeat(32)}`,
      });
      // The canonical payload alone verifies (the case above); the extra word must fail closed.
      await expectFailClosed(() => harness.verify(intent, txHex));
    });
  });

  describe('explicit authorized arbitrary calldata', function () {
    const data = '0xdeadbeef';
    const intent = { type: 'transfer', recipients: [{ address: otherTokenAddress, amount: '7', data }] };

    it('verifies an exact to / value / data match, including nonzero native value', async function () {
      const txHex = await buildTx({ to: otherTokenAddress, value: '7', data });
      const { result, warnings } = await captureWarnings(() => harness.verify(intent, txHex));
      result.should.equal(true);
      warnings.should.have.length(0);
    });

    it('fails a mismatched destination', async function () {
      const txHex = await buildTx({ to: attackerAddress, value: '7', data });
      await harness.verify(intent, txHex).should.be.rejectedWith(TxIntentMismatchRecipientError);
    });

    it('fails a mismatched value', async function () {
      const txHex = await buildTx({ to: otherTokenAddress, value: '8', data });
      await harness.verify(intent, txHex).should.be.rejectedWith(TxIntentMismatchRecipientError);
    });

    it('fails mismatched calldata', async function () {
      const txHex = await buildTx({ to: otherTokenAddress, value: '7', data: '0xdeadbe00' });
      await harness.verify(intent, txHex).should.be.rejectedWith(TxIntentMismatchRecipientError);
    });
  });

  describe('batch payments', function () {
    const batchRecipients = [
      { address: recipientAddress, amount: '10' },
      { address: secondRecipientAddress, amount: '20' },
    ];
    const intent = { type: 'transfer', recipients: batchRecipients };
    const tokenRecipients = batchRecipients.map((recipient) => ({ ...recipient, tokenData: { tokenName } }));

    it('verifies a native batch to the network batcher with value equal to the intent sum', async function () {
      const txHex = await buildTx({ to: batcherAddress, value: '30', data: nativeBatch(batchRecipients) });
      const { result, warnings } = await captureWarnings(() => harness.verify(intent, txHex));
      result.should.equal(true);
      warnings.should.have.length(0);
    });

    it('verifies a token batch without any top-level tokenName', async function () {
      // Asset identity comes from the recipients' own token metadata; a top-level tokenName is
      // not required and must not be invented from the transaction.
      const txHex = await buildTx({
        to: batcherAddress,
        value: '0',
        data: tokenBatch(tokenContractAddress, batchRecipients),
      });
      const { result, warnings } = await captureWarnings(() =>
        harness.verify({ type: 'transfer', recipients: tokenRecipients }, txHex)
      );
      result.should.equal(true);
      warnings.should.have.length(0);
    });

    it('fails a token batch sent through the native batch function', async function () {
      const txHex = await buildTx({ to: batcherAddress, value: '0', data: nativeBatch(batchRecipients) });
      await harness
        .verify({ type: 'transfer', recipients: tokenRecipients }, txHex)
        .should.be.rejectedWith(TxIntentMismatchRecipientError);
    });

    it('fails a native batch sent through batchTransferFrom', async function () {
      const txHex = await buildTx({
        to: batcherAddress,
        value: '30',
        data: tokenBatch(tokenContractAddress, batchRecipients),
      });
      await harness.verify(intent, txHex).should.be.rejectedWith(TxIntentMismatchRecipientError);
    });

    it('fails a batch that is not sent to the network batcher', async function () {
      const txHex = await buildTx({ to: attackerAddress, value: '30', data: nativeBatch(batchRecipients) });
      await harness.verify(intent, txHex).should.be.rejectedWith(TxIntentMismatchRecipientError);
    });

    it('fails a batch whose calldata recipient differs from the intent', async function () {
      const txHex = await buildTx({
        to: batcherAddress,
        value: '30',
        data: nativeBatch([
          { address: attackerAddress, amount: '10' },
          { address: secondRecipientAddress, amount: '20' },
        ]),
      });
      await harness.verify(intent, txHex).should.be.rejectedWith(TxIntentMismatchRecipientError);
    });

    it('fails a batch whose calldata amount differs from the intent', async function () {
      const txHex = await buildTx({
        to: batcherAddress,
        value: '30',
        data: nativeBatch([
          { address: recipientAddress, amount: '11' },
          { address: secondRecipientAddress, amount: '20' },
        ]),
      });
      await harness.verify(intent, txHex).should.be.rejectedWith(TxIntentMismatchRecipientError);
    });

    it('fails a batch whose recipient count differs from the intent', async function () {
      const txHex = await buildTx({
        to: batcherAddress,
        value: '30',
        data: nativeBatch([{ address: recipientAddress, amount: '30' }]),
      });
      await harness.verify(intent, txHex).should.be.rejectedWith(TxIntentMismatchRecipientError);
    });

    it('fails a batch whose native value differs from the intent sum', async function () {
      const txHex = await buildTx({ to: batcherAddress, value: '31', data: nativeBatch(batchRecipients) });
      await harness.verify(intent, txHex).should.be.rejectedWith(TxIntentMismatchRecipientError);
    });

    it('fails a token batch that moves a different token contract', async function () {
      const txHex = await buildTx({
        to: batcherAddress,
        value: '0',
        data: tokenBatch(otherTokenContractAddress, batchRecipients),
      });
      await harness
        .verify({ type: 'transfer', recipients: tokenRecipients }, txHex)
        .should.be.rejectedWith(TxIntentMismatchRecipientError);
    });

    it('fails a token batch that carries native value', async function () {
      const txHex = await buildTx({
        to: batcherAddress,
        value: '5',
        data: tokenBatch(tokenContractAddress, batchRecipients),
      });
      await harness
        .verify({ type: 'transfer', recipients: tokenRecipients }, txHex)
        .should.be.rejectedWith(TxIntentMismatchRecipientError);
    });
  });

  describe('unresolved metadata never hides a definite mismatch', function () {
    it('warns when the declared token cannot be resolved locally', async function () {
      const txHex = await buildTx({
        to: tokenContractAddress,
        value: '0',
        data: erc20Transfer(recipientAddress, '1000'),
      });
      const unresolved = {
        type: 'transfer',
        tokenName: 'hteth:not-a-registered-token',
        recipients: [{ address: recipientAddress, amount: '1000' }],
      };
      const { result, warnings } = await captureWarnings(() => harness.verify(unresolved, txHex));
      result.should.equal(true);
      // The warning must name the identity it could not resolve: that is the missing fact.
      matching(warnings, /hteth:not-a-registered-token/).should.not.be.empty();
    });

    it('still fails the decoded recipient and amount on that transaction', async function () {
      // The asset is unknown, but transfer(address,uint256) decodes exactly: the amount mismatch
      // against the intent is provable without token metadata, so it must throw.
      const amountHex = await buildTx({
        to: tokenContractAddress,
        value: '0',
        data: erc20Transfer(recipientAddress, '9999'),
      });
      await harness
        .verify(
          {
            type: 'transfer',
            tokenName: 'hteth:not-a-registered-token',
            recipients: [{ address: recipientAddress, amount: '1000' }],
          },
          amountHex
        )
        .should.be.rejectedWith(TxIntentMismatchRecipientError);

      const recipientHex = await buildTx({
        to: tokenContractAddress,
        value: '0',
        data: erc20Transfer(attackerAddress, '1000'),
      });
      await harness
        .verify(
          {
            type: 'transfer',
            tokenName: 'hteth:not-a-registered-token',
            recipients: [{ address: recipientAddress, amount: '1000' }],
          },
          recipientHex
        )
        .should.be.rejectedWith(TxIntentMismatchRecipientError);
    });
  });

  describe('batch verification when the network has no batcher contract', function () {
    const batchRecipients = [
      { address: recipientAddress, amount: '10' },
      { address: secondRecipientAddress, amount: '20' },
    ];
    let kavaHarness: Harness;

    beforeEach(function () {
      // kavaevm has no `batcherContractAddress` in statics: the destination cannot be anchored,
      // which is unresolved metadata, not a mismatch.
      kavaHarness = makeHarness({ chain: 'kavaevm', staticsCoin: coins.get('kavaevm') });
    });

    it('warns instead of failing a batch it cannot anchor to a batcher', async function () {
      const txHex = await buildTx(
        { to: attackerAddress, value: '30', data: nativeBatch(batchRecipients) },
        'legacy',
        'kavaevm'
      );
      const { result, warnings } = await captureWarnings(() =>
        kavaHarness.verify({ type: 'transfer', recipients: batchRecipients }, txHex)
      );
      result.should.equal(true);
      matching(warnings, /batcher/).should.not.be.empty();
    });

    it('still fails a batch whose calldata amounts mismatch when the batcher is unresolved', async function () {
      const txHex = await buildTx(
        {
          to: attackerAddress,
          value: '30',
          data: nativeBatch([
            { address: recipientAddress, amount: '11' },
            { address: secondRecipientAddress, amount: '20' },
          ]),
        },
        'legacy',
        'kavaevm'
      );
      await kavaHarness
        .verify({ type: 'transfer', recipients: batchRecipients }, txHex)
        .should.be.rejectedWith(TxIntentMismatchRecipientError);
    });
  });

  describe('direct and stored intent provenance', function () {
    const storedPaymentIntent = (address: string, value: string): Record<string, unknown> => ({
      intentType: 'payment',
      recipients: [{ address: { address }, amount: { value, symbol: 'hteth' } }],
    });

    it('verifies a stored payment intent when the caller declared nothing', async function () {
      const txHex = await buildTx({ to: recipientAddress, value: '1000' });
      const { result, warnings } = await captureWarnings(() =>
        harness.verifySigningPath(undefined, storedPaymentIntent(recipientAddress, '1000'), txHex)
      );
      result.should.equal(true);
      warnings.should.have.length(0);
    });

    it('keeps the historic native checks throwing on the stored intent path', async function () {
      const redirectHex = await buildTx({ to: attackerAddress, value: '1000' });
      await harness
        .verifySigningPath(undefined, storedPaymentIntent(recipientAddress, '1000'), redirectHex)
        .should.be.rejectedWith(TxIntentMismatchRecipientError);
    });

    it('never fills a caller-declared payment that has no recipients from the stored intent', async function () {
      // The caller asked for a payment but named nothing to verify against. The stored intent
      // points at the attacker, so using it would let the server choose the destination.
      const txHex = await buildTx({ to: attackerAddress, value: '9999' });
      await harness
        .verifySigningPath({ type: 'transfer' }, storedPaymentIntent(attackerAddress, '9999'), txHex)
        .should.be.rejectedWith(TxIntentMismatchRecipientError);
    });

    it('uses the caller intent over the stored intent when both are present', async function () {
      const callerIntent = { type: 'transfer', recipients: [{ address: recipientAddress, amount: '1000' }] };
      const goodHex = await buildTx({ to: recipientAddress, value: '1000' });
      const storedIntent = storedPaymentIntent(attackerAddress, '1000');
      (await harness.verifySigningPath(callerIntent, storedIntent, goodHex)).should.equal(true);

      const attackerHex = await buildTx({ to: attackerAddress, value: '1000' });
      await harness
        .verify(callerIntent, attackerHex, { callerTxParams: callerIntent, intent: storedIntent })
        .should.be.rejectedWith(TxIntentMismatchRecipientError);
    });
  });

  describe('intent types without a verifiable handler', function () {
    it('always rejects contractCall and customTx', async function () {
      const txHex = await buildTx({ to: otherTokenAddress, value: '0', data: '0xdeadbeef' });
      // Positive control: the same bytes are verifiable when the intent describes them exactly,
      // so the rejection below comes from the declared type and not from the transaction.
      const exactCall = {
        type: 'transfer',
        recipients: [{ address: otherTokenAddress, amount: '0', data: '0xdeadbeef' }],
      };
      (await harness.verify(exactCall, txHex)).should.equal(true);

      for (const type of ['contractCall', 'customTx']) {
        await harness
          .verify({ type, recipients: [{ address: otherTokenAddress, amount: '0' }] }, txHex)
          .should.be.rejectedWith(Error);
      }
    });

    it('warns for a non-payment intent type that has no handler', async function () {
      const txHex = await buildTx({ to: otherTokenAddress, value: '0', data: '0xdeadbeef' });
      for (const type of ['acceleration', 'bridgeFunds', 'enableToken']) {
        const { result, warnings } = await captureWarnings(() => harness.verify({ type, recipients: [] }, txHex));
        result.should.equal(true, `${type} must not throw`);
        // The warning names the intent type no verifier covers: that is the missing fact.
        matching(warnings, new RegExp(type)).should.not.be.empty();
      }
    });

    it('rejects bytes it cannot decode before any handler runs', async function () {
      const intent = { type: 'transfer', recipients: [{ address: recipientAddress, amount: '1000' }] };
      // A placeholder payload has no transaction at all; a non-transaction payload has a valid
      // looking prefix. Both fail closed instead of falling through to a warning.
      for (const txHex of ['0x', '0xdeadbeef']) {
        await expectFailClosed(() => harness.verify(intent, txHex));
      }
    });
  });

  describe('consolidation to the wallet base address', function () {
    const consolidate = { type: 'consolidate', recipients: [] };

    it('verifies a native consolidation that pays the base address', async function () {
      const txHex = await buildTx({ to: baseAddress, value: '1000' });
      const { result, warnings } = await captureWarnings(() => harness.verify(consolidate, txHex));
      result.should.equal(true);
      warnings.should.have.length(0);
    });

    it('verifies a token consolidation that pays the base address with no native value', async function () {
      const txHex = await buildTx({ to: tokenContractAddress, value: '0', data: erc20Transfer(baseAddress, '5') });
      const { result, warnings } = await captureWarnings(() => harness.verify(consolidate, txHex));
      result.should.equal(true);
      // No token identity is declared, so the base address, the calldata shape and the zero native
      // value are verified while the token contract is not: that gap is reported, never claimed.
      matching(warnings, /token contract cannot be checked/).should.not.be.empty();
      matching(warnings, /no fail-closed verifier/).should.be.empty();
    });

    it('rejects a native consolidation paying someone other than the base address', async function () {
      const txHex = await buildTx({ to: attackerAddress, value: '1000' });
      await harness
        .verify(consolidate, txHex, { verification: { consolidationToBaseAddress: true } })
        .should.be.rejectedWith(TxIntentMismatchRecipientError);
    });

    it('rejects token calldata that pays someone other than the base address', async function () {
      const txHex = await buildTx({ to: tokenContractAddress, value: '0', data: erc20Transfer(attackerAddress, '5') });
      await harness
        .verify(consolidate, txHex, { verification: { consolidationToBaseAddress: true } })
        .should.be.rejectedWith(TxIntentMismatchRecipientError);
    });

    it('rejects the same native redirect on a plain consolidate intent', async function () {
      // The wallet base address is locally known, so the expectation is established even without
      // the caller-supplied verification flag: a definite mismatch must not need an opt-in.
      const txHex = await buildTx({ to: attackerAddress, value: '1000' });
      await harness.verify(consolidate, txHex).should.be.rejectedWith(TxIntentMismatchRecipientError);
    });

    it('rejects token calldata paying a different recipient on a plain consolidate intent', async function () {
      const txHex = await buildTx({ to: tokenContractAddress, value: '0', data: erc20Transfer(attackerAddress, '5') });
      await harness.verify(consolidate, txHex).should.be.rejectedWith(TxIntentMismatchRecipientError);
    });

    it('rejects native value riding along token-shaped consolidation calldata', async function () {
      const txHex = await buildTx({ to: attackerAddress, value: '5000', data: erc20Transfer(baseAddress, '0') });
      await harness
        .verify(consolidate, txHex, { verification: { consolidationToBaseAddress: true } })
        .should.be.rejectedWith(TxIntentMismatchRecipientError);
    });

    it('warns for a consolidation it cannot anchor when the wallet has no base address', async function () {
      const anchorless = makeHarness({ coinSpecific: {} });
      const txHex = await buildTx({ to: baseAddress, value: '1000' });
      const { result, warnings } = await captureWarnings(() => anchorless.verify(consolidate, txHex));
      result.should.equal(true);
      matching(warnings, /base address/).should.not.be.empty();
    });

    it('warns for batch calldata on a consolidation instead of silently passing', async function () {
      // This intent declares no asset, so the batch could belong to a token or specialised sweep:
      // the unimplemented shape is reported, never claimed as verified.
      const txHex = await buildTx({
        to: batcherAddress,
        value: '30',
        data: nativeBatch([
          { address: recipientAddress, amount: '10' },
          { address: secondRecipientAddress, amount: '20' },
        ]),
      });
      const { result, warnings } = await captureWarnings(() => harness.verify(consolidate, txHex));
      result.should.equal(true);
      matching(warnings, /batch/).should.not.be.empty();
    });
  });

  describe('serialization formats', function () {
    const intent = { type: 'transfer', recipients: [{ address: recipientAddress, amount: '1000' }] };

    it('runs the same checks on legacy and type-2 encodings', async function () {
      const legacyHex = await buildTx({ to: attackerAddress, value: '1000' }, 'legacy');
      const eip1559Hex = await buildTx({ to: attackerAddress, value: '1000' }, 'eip1559');
      await harness.verify(intent, legacyHex).should.be.rejectedWith(TxIntentMismatchRecipientError);
      await harness.verify(intent, eip1559Hex).should.be.rejectedWith(TxIntentMismatchRecipientError);
    });

    it('does not misclassify a supported encoding as an unverifiable format', async function () {
      const legacyHex = await buildTx({ to: recipientAddress, value: '1000' }, 'legacy');
      const eip1559Hex = await buildTx({ to: recipientAddress, value: '1000' }, 'eip1559');
      for (const txHex of [legacyHex, eip1559Hex]) {
        const { result, warnings } = await captureWarnings(() => harness.verify(intent, txHex));
        result.should.equal(true);
        warnings.should.have.length(0);
      }
    });
  });
});
