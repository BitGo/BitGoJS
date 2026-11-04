import 'should';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BaseCoin as StaticsBaseCoin, coins, ContractAddressDefinedToken, Erc7984Coin } from '@bitgo/statics';
import {
  PopulatedIntent,
  resolveEffectiveTxParams,
  TransactionParams,
  TransactionType,
  TssVerificationWarning,
  TxRequest,
  Wallet,
} from '@bitgo/sdk-core';
import { optionalDeps } from '@bitgo/abstract-eth';

import { EvmCoin } from '../../src/evmCoin';
import { TransactionBuilder } from '../../src/lib';

/**
 * Fail-closed EVM TSS verification (TOB-BITGOEDMPC-2 / INFOSEC-671 / CECHO-2460).
 *
 * The user's key share must not sign EVM TSS bytes unless the decoded to / value / data match
 * the intent. Checks that threw before this change keep throwing (including on the
 * pending-approval path); every new check flags the violation (warn by default, throw under
 * `strictTssVerification`).
 *
 * Runs on kavaevm (legacy, non-EIP-1559 — the chains that used to bypass the verifier through
 * `EvmCoin.verifyLegacyTssTransaction`) and hbarevm (EIP-1559). Batcher-contract cases
 * (native/token batch sends, tokenApproval spender) need a chain with a statics batcher
 * address and live in @bitgo/sdk-coin-bsc's tssBatcherVerification tests.
 */

const recipientAddress = '0x174cfd823af8ce27ed0afee3fcf3c3ba259116be';
const attackerAddress = '0x7e85bdc27c050e3905ebf4b8e634d9ad6edd0de6';
const baseAddress = '0x1111111111111111111111111111111111111111';
const tokenContractAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const MAX_UINT256 = ((1n << 256n) - 1n).toString();

const erc7984Pair = coins.get('hteth:cusdt') as Erc7984Coin;
const erc7984WrapperAddress = String(erc7984Pair.contractAddress);

// Two distinct registered tokens whose contracts resolve locally from statics. The caller
// and the stored intent name different tokens to prove the server cannot replace local identity.
const tokenContractOf = (tokenName: string): string => {
  const token = coins.get(tokenName);
  if (!(token instanceof ContractAddressDefinedToken)) {
    throw new Error(`${tokenName} has no contract address in statics`);
  }
  return String(token.contractAddress);
};
const localTokenName = 'hteth:tusdc';
const serverTokenName = 'hteth:tusdt';
const localTokenContractAddress = tokenContractOf(localTokenName);
const serverTokenContractAddress = tokenContractOf(serverTokenName);

const word = (value: bigint): string => value.toString(16).padStart(64, '0');
const addrWord = (address: string): string => address.toLowerCase().replace(/^0x/, '').padStart(64, '0');

function encodeErc20Transfer(to: string, amount: string): string {
  return `0xa9059cbb${addrWord(to)}${word(BigInt(amount))}`;
}

function encodeApprove(spender: string, amount: string): string {
  return `0x095ea7b3${addrWord(spender)}${word(BigInt(amount))}`;
}

function encodeWithAbi(signature: string, types: string[], values: unknown[]): string {
  const selector = optionalDeps.ethAbi.methodID(signature, types);
  const args = optionalDeps.ethAbi.rawEncode(types, values);
  return '0x' + Buffer.concat([selector, args]).toString('hex');
}

function encodeConfidentialTransferNoProof(to: string): string {
  return encodeWithAbi('confidentialTransfer', ['address', 'bytes32'], [to, '0x' + '11'.repeat(32)]);
}

async function buildTxHex(
  coin: Readonly<StaticsBaseCoin>,
  opts: { to: string; value?: string; data?: string }
): Promise<string> {
  const builder = new TransactionBuilder(coin);
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

// kavaevm is legacy (non-EIP-1559) and hbarevm is EIP-1559; neither has a statics batcher
// contract, so the "statics gap" paths are what both exercise for batcher-dependent rules.
['kavaevm', 'hbarevm'].forEach((chain) => {
  describe(`EVM TSS fail-closed verification (${chain})`, function () {
    const staticsCoin = coins.get(chain);

    let bitgo: TestBitGoAPI;
    let strictBitgo: TestBitGoAPI;
    let warnings: TssVerificationWarning[];
    let coin: EvmCoin;
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
      coin = new (EvmCoin as any)(bitgo, staticsCoin);
      wallet = new Wallet(bitgo, coin as any, { coinSpecific: { baseAddress } } as any);
    });

    // Caller params may also carry the EVM-only tokenName that EthTransactionParams adds.
    type SigningPathCallerParams = TransactionParams & { tokenName?: string };

    const verify = (
      txParams: Record<string, unknown>,
      txHex: string,
      opts: {
        strict?: boolean;
        intent?: PopulatedIntent;
        callerTxParams?: SigningPathCallerParams;
        verification?: Record<string, unknown>;
      } = {}
    ): Promise<boolean> => {
      const target = opts.strict ? new (EvmCoin as any)(strictBitgo, staticsCoin) : coin;
      const w = opts.strict ? new Wallet(strictBitgo, target as any, { coinSpecific: { baseAddress } } as any) : wallet;
      return (target as any).verifyTransaction({
        txParams,
        txPrebuild: { txHex, coin: chain, walletId: 'w' },
        wallet: w,
        verification: opts.verification ?? {},
        walletType: 'tss',
        ...(opts.intent ? { intent: opts.intent } : {}),
        ...(opts.callerTxParams ? { callerTxParams: opts.callerTxParams } : {}),
      });
    };

    // Mirrors the ECDSA / MPCv2 signing paths: resolveEffectiveTxParams back-fills the stored
    // intent into the effective txParams, while callerTxParams stays the untouched caller
    // input. This is the wiring that decides which source speaks for the user intent.
    const verifySigningPath = (
      callerTxParams: SigningPathCallerParams | undefined,
      intent: Record<string, unknown>,
      txHex: string,
      strict = false
    ): Promise<boolean> => {
      const txRequest = { txRequestId: 'signing-path', walletId: 'w', intent } as unknown as TxRequest;
      const effective = resolveEffectiveTxParams(txRequest, callerTxParams, chain);
      return verify(effective as unknown as Record<string, unknown>, txHex, {
        strict,
        intent: intent as unknown as PopulatedIntent,
        ...(callerTxParams ? { callerTxParams } : {}),
      });
    };

    const build = (opts: { to: string; value?: string; data?: string }): Promise<string> =>
      buildTxHex(staticsCoin, opts);

    describe('payment handler (transfer)', function () {
      it('verifies a native send that matches the intent, with no warnings', async function () {
        const txHex = await build({ to: recipientAddress, value: '1000' });
        const result = await verify(
          { type: 'transfer', recipients: [{ address: recipientAddress, amount: '1000' }] },
          txHex
        );
        result.should.equal(true);
        warnings.should.have.length(0);
      });

      it('throws on a redirected destination (existing check, both modes)', async function () {
        const txHex = await build({ to: attackerAddress, value: '1000' });
        for (const strict of [false, true]) {
          await verify({ type: 'transfer', recipients: [{ address: recipientAddress, amount: '1000' }] }, txHex, {
            strict,
          }).should.be.rejectedWith(/destination address does not match/);
        }
      });

      it('throws on an inflated value (existing check, both modes)', async function () {
        const txHex = await build({ to: recipientAddress, value: '9999' });
        for (const strict of [false, true]) {
          await verify({ type: 'transfer', recipients: [{ address: recipientAddress, amount: '1000' }] }, txHex, {
            strict,
          }).should.be.rejectedWith(/amount in txPrebuild does not match/);
        }
      });

      it('verifies an exact dApp call (to, value and data equal to the intent)', async function () {
        const data = '0xdeadbeef';
        const txHex = await build({ to: tokenContractAddress, value: '0', data });
        const result = await verify(
          { type: 'transfer', recipients: [{ address: tokenContractAddress, amount: '0', data }] },
          txHex
        );
        result.should.equal(true);
        warnings.should.have.length(0);
      });

      it('flags swapped calldata under a payment intent (warn, throw in strict mode)', async function () {
        // ERC-20 calldata with a swapped inner recipient: the existing inner check throws.
        const intentData = encodeErc20Transfer(recipientAddress, '1000');
        const tamperedData = encodeErc20Transfer(attackerAddress, '1000');
        const tamperedHex = await build({ to: tokenContractAddress, value: '0', data: tamperedData });
        await verify(
          {
            type: 'transfer',
            recipients: [{ address: tokenContractAddress, amount: '0', data: intentData }],
          },
          tamperedHex
        ).should.be.rejectedWith(/destination address does not match/);

        // Non-ERC-20 dApp calldata mismatch is a new check: warn, or throw in strict mode.
        const swappedHex = await build({ to: tokenContractAddress, value: '0', data: '0xdeadbeef' });
        const txParams = {
          type: 'transfer',
          recipients: [{ address: tokenContractAddress, amount: '0', data: '0xdeadbe00' }],
        };
        const result = await verify(txParams, swappedHex);
        result.should.equal(true);
        warnings.should.have.length(1);
        warnings[0].reason.should.match(/calldata does not match/);
        warnings[0].decoded.data.should.equal('0xdeadbeef');
        warnings[0].expected.data.should.equal('0xdeadbe00');
        await verify(txParams, swappedHex, { strict: true }).should.be.rejectedWith(/calldata does not match/);
      });

      it('flags a mismatched destination under an exact-call (dApp) intent', async function () {
        const data = '0xdeadbeef';
        const txHex = await build({ to: attackerAddress, value: '0', data });
        const txParams = {
          type: 'transfer',
          recipients: [{ address: tokenContractAddress, amount: '0', data }],
        };
        (await verify(txParams, txHex)).should.equal(true);
        warnings.some((w) => /to does not match/.test(w.reason)).should.equal(true);
        await verify(txParams, txHex, { strict: true }).should.be.rejectedWith(/to does not match/);
      });

      it('flags a mismatched value under an exact-call (dApp) intent', async function () {
        const data = '0xdeadbeef';
        const txHex = await build({ to: tokenContractAddress, value: '7', data });
        const txParams = {
          type: 'transfer',
          recipients: [{ address: tokenContractAddress, amount: '0', data }],
        };
        (await verify(txParams, txHex)).should.equal(true);
        warnings.some((w) => /value does not match/.test(w.reason)).should.equal(true);
        await verify(txParams, txHex, { strict: true }).should.be.rejectedWith(/value does not match/);
      });

      it('flags approve(attacker, MAX) disguised as a transfer (TOB-BITGOEDMPC-2)', async function () {
        const txHex = await build({
          to: tokenContractAddress,
          value: '0',
          data: encodeApprove(attackerAddress, MAX_UINT256),
        });
        const txParams = { type: 'transfer', recipients: [{ address: recipientAddress, amount: '1000' }] };
        (await verify(txParams, txHex)).should.equal(true);
        warnings.some((w) => /not a recognized payment shape/.test(w.reason)).should.equal(true);
        await verify(txParams, txHex, { strict: true }).should.be.rejectedWith(/not a recognized payment shape/);
      });

      it('rejects missing recipients under a caller-declared payment intent (fail closed)', async function () {
        // An empty recipients array declares nothing to verify the bytes against: signing stops
        // whether or not the client opted into strictTssVerification.
        const txHex = await build({ to: recipientAddress, value: '1000' });
        const txParams = { type: 'transfer', recipients: [] };
        for (const strict of [false, true]) {
          await verify(txParams, txHex, { strict }).should.be.rejectedWith(
            /caller declared a payment without recipients/
          );
        }
        warnings.should.have.length(0);
      });
    });

    describe('payment handler (token transfers)', function () {
      const tokenRecipient = {
        address: recipientAddress,
        amount: '10000000',
        tokenAddress: tokenContractAddress,
      };

      it('verifies an ERC-20 transfer against the intent token contract, value zero', async function () {
        const txHex = await build({
          to: tokenContractAddress,
          value: '0',
          data: encodeErc20Transfer(recipientAddress, '10000000'),
        });
        const result = await verify({ type: 'transfer', recipients: [tokenRecipient] }, txHex);
        result.should.equal(true);
        warnings.should.have.length(0);
      });

      it('flags an ERC-20 transfer whose to is not the intent token contract', async function () {
        const txHex = await build({
          to: attackerAddress,
          value: '0',
          data: encodeErc20Transfer(recipientAddress, '10000000'),
        });
        const txParams = { type: 'transfer', recipients: [tokenRecipient] };
        (await verify(txParams, txHex)).should.equal(true);
        const flag = warnings.find((w) => /not the intent token contract/.test(w.reason));
        should.exist(flag);
        flag?.expected.to?.toLowerCase().should.equal(tokenContractAddress.toLowerCase());
        await verify(txParams, txHex, { strict: true }).should.be.rejectedWith(/not the intent token contract/);
      });

      it('flags an ERC-20 transfer that carries native value', async function () {
        const txHex = await build({
          to: tokenContractAddress,
          value: '5',
          data: encodeErc20Transfer(recipientAddress, '10000000'),
        });
        const txParams = { type: 'transfer', recipients: [tokenRecipient] };
        (await verify(txParams, txHex)).should.equal(true);
        warnings.some((w) => /must not carry native value/.test(w.reason)).should.equal(true);
        await verify(txParams, txHex, { strict: true }).should.be.rejectedWith(/must not carry native value/);
      });

      it('throws on a tampered ERC-20 recipient or amount (existing checks)', async function () {
        const toAttacker = await build({
          to: tokenContractAddress,
          value: '0',
          data: encodeErc20Transfer(attackerAddress, '10000000'),
        });
        await verify({ type: 'transfer', recipients: [tokenRecipient] }, toAttacker).should.be.rejectedWith(
          /destination address does not match/
        );
        const inflated = await build({
          to: tokenContractAddress,
          value: '0',
          data: encodeErc20Transfer(recipientAddress, '99999999'),
        });
        await verify({ type: 'transfer', recipients: [tokenRecipient] }, inflated).should.be.rejectedWith(
          /amount in txPrebuild does not match/
        );
      });

      it('checks the ERC-7984 confidentialTransfer recipient only', async function () {
        const intentParams = {
          type: 'transfer',
          recipients: [{ address: recipientAddress, amount: '0', tokenName: 'hteth:cusdt' }],
        };
        const goodHex = await build({
          to: erc7984WrapperAddress,
          value: '0',
          data: encodeConfidentialTransferNoProof(recipientAddress),
        });
        (await verify(intentParams, goodHex)).should.equal(true);
        warnings.should.have.length(0);

        const tamperedHex = await build({
          to: erc7984WrapperAddress,
          value: '0',
          data: encodeConfidentialTransferNoProof(attackerAddress),
        });
        (await verify(intentParams, tamperedHex)).should.equal(true);
        warnings.some((w) => /confidentialTransfer recipient does not match/.test(w.reason)).should.equal(true);
        await verify(intentParams, tamperedHex, { strict: true }).should.be.rejectedWith(
          /confidentialTransfer recipient does not match/
        );
      });

      it('flags batch calldata carried by a single declared recipient', async function () {
        const txHex = await build({
          to: tokenContractAddress,
          value: '0',
          data: encodeWithAbi('batch', ['address[]', 'uint256[]'], [[recipientAddress], ['1']]),
        });
        const txParams = { type: 'transfer', recipients: [tokenRecipient] };
        (await verify(txParams, txHex)).should.equal(true);
        warnings.some((w) => /single declared recipient/.test(w.reason)).should.equal(true);
      });
    });

    describe('declared intent isolation and asset binding (CECHO-2460)', function () {
      const tokenTransferData = encodeErc20Transfer(recipientAddress, '1000');
      const approvalData = encodeApprove(attackerAddress, MAX_UINT256);

      it('does not let stored calldata fill a caller recipient that declared none', async function () {
        // The caller declares a native payment and supplies no calldata. The stored intent adds
        // approve(attacker, MAX): it must not turn the caller's payment into an exact dApp call.
        const caller = { type: 'transfer', recipients: [{ address: tokenContractAddress, amount: '0' }] };
        const intent = {
          intentType: 'payment',
          recipients: [
            {
              address: { address: tokenContractAddress },
              amount: { value: '0', symbol: 'hteth' },
              data: approvalData,
            },
          ],
        };
        const txHex = await build({ to: tokenContractAddress, value: '0', data: approvalData });

        (await verifySigningPath(caller, intent, txHex)).should.equal(true);
        warnings.some((w) => /not a recognized payment shape/.test(w.reason)).should.equal(true);
        await verifySigningPath(caller, intent, txHex, true).should.be.rejectedWith(/not a recognized payment shape/);
      });

      it('keeps the caller token identity when the stored intent names another token', async function () {
        const caller = {
          type: 'transferToken',
          tokenName: localTokenName,
          recipients: [{ address: recipientAddress, amount: '1000' }],
        };
        const intent = {
          intentType: 'transferToken',
          tokenName: serverTokenName,
          recipients: [{ address: { address: recipientAddress }, amount: { value: '1000', symbol: serverTokenName } }],
        };
        const txHex = await build({ to: serverTokenContractAddress, value: '0', data: tokenTransferData });

        (await verifySigningPath(caller, intent, txHex)).should.equal(true);
        warnings.some((w) => /not the intent token contract/.test(w.reason)).should.equal(true);
        await verifySigningPath(caller, intent, txHex, true).should.be.rejectedWith(/not the intent token contract/);
      });

      it('rejects token calldata for a caller-declared native payment', async function () {
        const caller = { type: 'transfer', recipients: [{ address: recipientAddress, amount: '1000' }] };
        const intent = {
          intentType: 'payment',
          recipients: [
            {
              address: { address: recipientAddress },
              amount: { value: '1000', symbol: 'hteth' },
              tokenData: { tokenName: localTokenName },
            },
          ],
        };
        const txHex = await build({ to: localTokenContractAddress, value: '0', data: tokenTransferData });

        (await verifySigningPath(caller, intent, txHex)).should.equal(true);
        warnings
          .some((w) => /native asset but the transaction carries token or batch calldata/.test(w.reason))
          .should.equal(true);
        await verifySigningPath(caller, intent, txHex, true).should.be.rejectedWith(
          /native asset but the transaction carries token or batch calldata/
        );
      });

      it('rejects a native send for a caller-declared token payment', async function () {
        const caller = {
          type: 'transfer',
          recipients: [{ address: recipientAddress, amount: '1000', tokenAddress: localTokenContractAddress }],
        };
        const intent = {
          intentType: 'payment',
          recipients: [{ address: { address: recipientAddress }, amount: { value: '1000', symbol: localTokenName } }],
        };
        const txHex = await build({ to: recipientAddress, value: '1000' });

        (await verifySigningPath(caller, intent, txHex)).should.equal(true);
        warnings
          .some((w) => /token payment intent but the transaction is a native send/.test(w.reason))
          .should.equal(true);
        await verifySigningPath(caller, intent, txHex, true).should.be.rejectedWith(
          /token payment intent but the transaction is a native send/
        );
      });

      it('flags a tokenAddress that does not match the transaction token', async function () {
        const caller = {
          type: 'transfer',
          recipients: [{ address: recipientAddress, amount: '1000', tokenAddress: localTokenContractAddress }],
        };
        const txHex = await build({ to: serverTokenContractAddress, value: '0', data: tokenTransferData });

        (await verifySigningPath(caller, { intentType: 'payment', recipients: [] }, txHex)).should.equal(true);
        warnings.some((w) => /not the intent token contract/.test(w.reason)).should.equal(true);
        await verifySigningPath(caller, { intentType: 'payment', recipients: [] }, txHex, true).should.be.rejectedWith(
          /not the intent token contract/
        );
      });

      it('flags an unresolvable token name instead of silently skipping the token check', async function () {
        const caller = {
          type: 'transferToken',
          tokenName: 'hteth:not-a-registered-token',
          recipients: [{ address: recipientAddress, amount: '1000' }],
        };
        const txHex = await build({ to: localTokenContractAddress, value: '0', data: tokenTransferData });

        (await verifySigningPath(caller, { intentType: 'transferToken', recipients: [] }, txHex)).should.equal(true);
        warnings.some((w) => /cannot be resolved to a token contract/.test(w.reason)).should.equal(true);
        await verifySigningPath(
          caller,
          { intentType: 'transferToken', recipients: [] },
          txHex,
          true
        ).should.be.rejectedWith(/cannot be resolved to a token contract/);
      });

      it('flags conflicting local token identity (tokenAddress and tokenName name two contracts)', async function () {
        const caller = {
          type: 'transferToken',
          tokenName: serverTokenName,
          recipients: [{ address: recipientAddress, amount: '1000', tokenAddress: localTokenContractAddress }],
        };
        const txHex = await build({ to: localTokenContractAddress, value: '0', data: tokenTransferData });

        (await verifySigningPath(caller, { intentType: 'transferToken', recipients: [] }, txHex)).should.equal(true);
        warnings.some((w) => /name different token contracts/.test(w.reason)).should.equal(true);
        await verifySigningPath(
          caller,
          { intentType: 'transferToken', recipients: [] },
          txHex,
          true
        ).should.be.rejectedWith(/name different token contracts/);
      });

      it('verifies a legitimate caller payment even when the stored intent contradicts it', async function () {
        const caller = { type: 'transfer', recipients: [{ address: recipientAddress, amount: '1000' }] };
        const intent = {
          intentType: 'payment',
          recipients: [
            {
              address: { address: recipientAddress },
              amount: { value: '1000', symbol: 'hteth' },
              data: approvalData,
            },
          ],
        };
        const txHex = await build({ to: recipientAddress, value: '1000' });

        (await verifySigningPath(caller, intent, txHex)).should.equal(true);
        warnings.should.have.length(0);
        (await verifySigningPath(caller, intent, txHex, true)).should.equal(true);
      });

      it('verifies a legitimate caller token payment even when the stored intent names another token', async function () {
        const caller = {
          type: 'transferToken',
          tokenName: localTokenName,
          recipients: [{ address: recipientAddress, amount: '1000' }],
        };
        const intent = {
          intentType: 'transferToken',
          tokenName: serverTokenName,
          recipients: [{ address: { address: recipientAddress }, amount: { value: '1000', symbol: serverTokenName } }],
        };
        const txHex = await build({ to: localTokenContractAddress, value: '0', data: tokenTransferData });

        (await verifySigningPath(caller, intent, txHex)).should.equal(true);
        warnings.should.have.length(0);
      });

      it('uses the stored token identity when the caller declared nothing (pending approval)', async function () {
        const intent = {
          intentType: 'transferToken',
          tokenName: localTokenName,
          recipients: [{ address: { address: recipientAddress }, amount: { value: '1000', symbol: localTokenName } }],
        };
        const txHex = await build({ to: localTokenContractAddress, value: '0', data: tokenTransferData });

        (await verifySigningPath(undefined, intent, txHex)).should.equal(true);
        warnings.should.have.length(0);
      });

      it('fails closed on an unresolvable stored token identity (pending approval)', async function () {
        const intent = {
          intentType: 'transferToken',
          tokenName: 'hteth:not-a-registered-token',
          recipients: [
            {
              address: { address: recipientAddress },
              amount: { value: '1000', symbol: 'hteth:not-a-registered-token' },
            },
          ],
        };
        const txHex = await build({ to: localTokenContractAddress, value: '0', data: tokenTransferData });

        (await verifySigningPath(undefined, intent, txHex)).should.equal(true);
        warnings.some((w) => /cannot be resolved to a token contract/.test(w.reason)).should.equal(true);
        await verifySigningPath(undefined, intent, txHex, true).should.be.rejectedWith(
          /cannot be resolved to a token contract/
        );
      });

      describe('caller-declared payment without recipients (fail closed)', function () {
        // A caller that names a payment type but supplies no recipients leaves nothing to verify
        // the bytes against: the stored intent is dropped (its destination may be attacker
        // chosen), so signing must stop instead of continuing behind a warning. An empty array
        // declares nothing, exactly like omitting the field, and no mode may downgrade this.
        const attackerIntent = {
          intentType: 'payment',
          recipients: [{ address: { address: attackerAddress }, amount: { value: '9999', symbol: 'hteth' } }],
        };

        it('rejects a caller `transfer` type with no recipients, both modes', async function () {
          const txHex = await build({ to: attackerAddress, value: '9999' });
          for (const strict of [false, true]) {
            await verifySigningPath({ type: 'transfer' }, attackerIntent, txHex, strict).should.be.rejectedWith(
              /caller declared a payment without recipients/
            );
          }
          warnings.should.have.length(0);
        });

        it('rejects a caller `transfer` type with an empty recipients array, both modes', async function () {
          const caller = { type: 'transfer', recipients: [] };
          const txHex = await build({ to: attackerAddress, value: '9999' });
          for (const strict of [false, true]) {
            await verifySigningPath(caller, attackerIntent, txHex, strict).should.be.rejectedWith(
              /caller declared a payment without recipients/
            );
          }
          warnings.should.have.length(0);
        });

        it('treats the stored spelling `payment` as the same caller declaration', async function () {
          const txHex = await build({ to: attackerAddress, value: '9999' });
          for (const strict of [false, true]) {
            await verifySigningPath({ type: 'payment' }, attackerIntent, txHex, strict).should.be.rejectedWith(
              /caller declared a payment without recipients/
            );
          }
          warnings.should.have.length(0);
        });

        it('keeps signing a stored payment intent when the caller declared nothing', async function () {
          const intent = {
            intentType: 'payment',
            recipients: [{ address: { address: recipientAddress }, amount: { value: '1000', symbol: 'hteth' } }],
          };
          const txHex = await build({ to: recipientAddress, value: '1000' });
          for (const strict of [false, true]) {
            (await verifySigningPath(undefined, intent, txHex, strict)).should.equal(true);
          }
          warnings.should.have.length(0);
        });

        it('keeps the stored token identity when the caller supplies only a token name', async function () {
          const intent = {
            intentType: 'transferToken',
            tokenName: localTokenName,
            recipients: [{ address: { address: recipientAddress }, amount: { value: '1000', symbol: localTokenName } }],
          };
          const txHex = await build({
            to: localTokenContractAddress,
            value: '0',
            data: encodeErc20Transfer(recipientAddress, '1000'),
          });
          for (const strict of [false, true]) {
            (await verifySigningPath({ tokenName: localTokenName }, intent, txHex, strict)).should.equal(true);
          }
          warnings.should.have.length(0);
        });

        it('leaves other types without recipients on the warn-first policy', async function () {
          // The fail-closed rule is limited to caller-declared payments: a transferToken with no
          // recipients keeps warning by default and keeps throwing only in strict mode.
          const caller = { type: 'transferToken' };
          const intent = {
            intentType: 'transferToken',
            tokenName: localTokenName,
            recipients: [{ address: { address: recipientAddress }, amount: { value: '1000', symbol: localTokenName } }],
          };
          const txHex = await build({
            to: localTokenContractAddress,
            value: '0',
            data: encodeErc20Transfer(recipientAddress, '1000'),
          });

          (await verifySigningPath(caller, intent, txHex)).should.equal(true);
          warnings.some((w) => /must declare exactly one token recipient/.test(w.reason)).should.equal(true);
          await verifySigningPath(caller, intent, txHex, true).should.be.rejectedWith(
            /must declare exactly one token recipient/
          );
        });
      });
    });

    describe('batch payments without a configured batcher contract (statics gap)', function () {
      const recipients = [
        { address: recipientAddress, amount: '10' },
        { address: attackerAddress, amount: '20' },
      ];

      it('flags native batch calldata instead of silently passing it', async function () {
        const txHex = await build({
          to: attackerAddress,
          value: '30',
          data: encodeWithAbi(
            'batch',
            ['address[]', 'uint256[]'],
            [
              [recipientAddress, attackerAddress],
              ['10', '20'],
            ]
          ),
        });
        const txParams = { type: 'transfer', recipients };
        (await verify(txParams, txHex)).should.equal(true);
        warnings.some((w) => /no batcher contract address is configured/.test(w.reason)).should.equal(true);
        await verify(txParams, txHex, { strict: true }).should.be.rejectedWith(
          /no batcher contract address is configured/
        );
      });

      it('flags token batch calldata instead of silently passing it', async function () {
        const txHex = await build({
          to: attackerAddress,
          value: '0',
          data: encodeWithAbi(
            'batchTransferFrom',
            ['address', 'address[]', 'uint256[]'],
            [tokenContractAddress, [recipientAddress, attackerAddress], ['10', '20']]
          ),
        });
        (await verify({ type: 'transfer', recipients }, txHex)).should.equal(true);
        warnings.some((w) => /no batcher contract address is configured/.test(w.reason)).should.equal(true);
      });
    });

    describe('tokenApproval handler', function () {
      const approvalParams = { type: 'tokenApproval', tokenName: 'hteth:cusdt' };

      it('flags a tokenApproval when the network has no configured batcher contract (statics gap)', async function () {
        const txHex = await build({
          to: erc7984WrapperAddress,
          value: '0',
          data: encodeApprove(attackerAddress, MAX_UINT256),
        });
        (await verify(approvalParams, txHex)).should.equal(true);
        warnings.some((w) => /no batcher contract address is configured/.test(w.reason)).should.equal(true);
      });

      it('flags a non-maximum allowance, non-approve calldata, native value and a wrong to', async function () {
        const smallAllowance = await build({
          to: erc7984WrapperAddress,
          value: '0',
          data: encodeApprove(attackerAddress, '5'),
        });
        (await verify(approvalParams, smallAllowance)).should.equal(true);
        warnings.some((w) => /not the maximum ERC-20 allowance/.test(w.reason)).should.equal(true);

        warnings = [];
        const notApprove = await build({
          to: erc7984WrapperAddress,
          value: '0',
          data: encodeErc20Transfer(recipientAddress, '5'),
        });
        (await verify(approvalParams, notApprove)).should.equal(true);
        warnings.some((w) => /must use ERC-20 approve/.test(w.reason)).should.equal(true);

        warnings = [];
        const carriesValue = await build({
          to: erc7984WrapperAddress,
          value: '1',
          data: encodeApprove(attackerAddress, MAX_UINT256),
        });
        (await verify(approvalParams, carriesValue)).should.equal(true);
        warnings.some((w) => /must not carry native value/.test(w.reason)).should.equal(true);

        warnings = [];
        const wrongTo = await build({
          to: attackerAddress,
          value: '0',
          data: encodeApprove(attackerAddress, MAX_UINT256),
        });
        (await verify(approvalParams, wrongTo)).should.equal(true);
        warnings.some((w) => /to is not the intent token contract/.test(w.reason)).should.equal(true);
      });
    });

    describe('fillNonce handler', function () {
      it('verifies a 1-wei self-send to the base address and flags deviations', async function () {
        const good = await build({ to: baseAddress, value: '1' });
        (await verify({ type: 'fillNonce' }, good)).should.equal(true);
        warnings.should.have.length(0);

        const wrongTo = await build({ to: recipientAddress, value: '1' });
        (await verify({ type: 'fillNonce' }, wrongTo)).should.equal(true);
        warnings.some((w) => /must send to the wallet base address/.test(w.reason)).should.equal(true);

        warnings = [];
        const wrongValue = await build({ to: baseAddress, value: '2' });
        (await verify({ type: 'fillNonce' }, wrongValue)).should.equal(true);
        warnings.some((w) => /must send exactly 1 wei/.test(w.reason)).should.equal(true);

        warnings = [];
        const withCalldata = await build({ to: baseAddress, value: '1', data: '0xdeadbeef' });
        (await verify({ type: 'fillNonce' }, withCalldata)).should.equal(true);
        warnings.some((w) => /must not carry calldata/.test(w.reason)).should.equal(true);

        await verify({ type: 'fillNonce' }, wrongTo, { strict: true }).should.be.rejectedWith(
          /must send to the wallet base address/
        );
      });
    });

    describe('consolidation to the wallet base address', function () {
      const consolidate = { type: 'consolidate', recipients: [] };
      const toBase = { consolidationToBaseAddress: true };

      it('verifies a token consolidation that pays the base address and carries no native value', async function () {
        const txHex = await build({
          to: tokenContractAddress,
          value: '0',
          data: encodeErc20Transfer(baseAddress, '5'),
        });
        (await verify(consolidate, txHex, { verification: toBase })).should.equal(true);
        (await verify(consolidate, txHex)).should.equal(true);
        warnings.should.have.length(0);
      });

      it('rejects native value riding along token-shaped calldata when the caller asked for the check', async function () {
        // transfer(baseAddress, 0) passes the recipient check, so without the value check the
        // native balance would go to whatever contract `to` names.
        const txHex = await build({
          to: attackerAddress,
          value: '5000',
          data: encodeErc20Transfer(baseAddress, '0'),
        });
        for (const strict of [false, true]) {
          await verify(consolidate, txHex, { strict, verification: toBase }).should.be.rejectedWith(
            /must not carry native value/
          );
        }
      });

      it('flags the same transaction on a consolidate intent (warn, throw in strict mode)', async function () {
        const txHex = await build({
          to: attackerAddress,
          value: '5000',
          data: encodeErc20Transfer(baseAddress, '0'),
        });
        (await verify(consolidate, txHex)).should.equal(true);
        warnings.some((w) => /must not carry native value/.test(w.reason)).should.equal(true);
        await verify(consolidate, txHex, { strict: true }).should.be.rejectedWith(/must not carry native value/);
      });
    });

    describe('unsupported and unhandled intent types', function () {
      it('rejects contractCall and customTx outright on EVM (INFOSEC-671)', async function () {
        const txHex = await build({ to: attackerAddress, value: '0', data: '0xdeadbeef' });
        for (const type of ['contractCall', 'customTx']) {
          for (const strict of [false, true]) {
            await verify({ type, recipients: [{ address: attackerAddress, amount: '0' }] }, txHex, {
              strict,
            }).should.be.rejectedWith(/unsupported intent type for EVM TSS/);
          }
        }
      });

      it('flags every intent type without a handler instead of silently passing', async function () {
        const txHex = await build({ to: attackerAddress, value: '0', data: '0xdeadbeef' });
        for (const type of ['acceleration', 'bridgeFunds', 'enableToken', 'defiRedeem', 'stakeWithCallData']) {
          warnings = [];
          const result = await verify({ type, recipients: [] }, txHex);
          result.should.equal(true, `${type} must not throw`);
          warnings.some((w) => /no fail-closed verifier/.test(w.reason)).should.equal(true, `${type} must be flagged`);
        }
        await verify({ type: 'bridgeFunds', recipients: [] }, txHex, { strict: true }).should.be.rejectedWith(
          /no fail-closed verifier/
        );
      });
    });

    describe('pending-approval path (stored intent via resolveEffectiveTxParams)', function () {
      const verifyPendingApproval = async (
        intent: Record<string, unknown>,
        txHex: string,
        strict = false
      ): Promise<boolean> => {
        const txRequest = { txRequestId: 'pa', walletId: 'w', intent } as unknown as TxRequest;
        const txParams = resolveEffectiveTxParams(txRequest, undefined, chain);
        return verify(txParams as unknown as Record<string, unknown>, txHex, {
          strict,
          intent: txRequest.intent as PopulatedIntent,
        });
      };

      it('keeps the existing native checks throwing on this path (redirect and inflated value)', async function () {
        const intent = {
          intentType: 'payment',
          recipients: [{ address: { address: recipientAddress }, amount: { value: '1000', symbol: 'eth' } }],
        };
        const redirectHex = await build({ to: attackerAddress, value: '1000' });
        await verifyPendingApproval(intent, redirectHex).should.be.rejectedWith(/destination address does not match/);

        const inflatedHex = await build({ to: recipientAddress, value: '9999' });
        await verifyPendingApproval(intent, inflatedHex).should.be.rejectedWith(/amount in txPrebuild does not match/);
      });

      it('flags swapped calldata on this path (warn, throw in strict mode)', async function () {
        const data = '0xdeadbeef';
        const intent = {
          intentType: 'payment',
          recipients: [{ address: { address: tokenContractAddress }, amount: { value: '0', symbol: 'eth' }, data }],
        };
        const txHex = await build({ to: tokenContractAddress, value: '0', data: '0xdeadbe00' });
        (await verifyPendingApproval(intent, txHex)).should.equal(true);
        warnings.some((w) => /calldata does not match/.test(w.reason)).should.equal(true);
        await verifyPendingApproval(intent, txHex, true).should.be.rejectedWith(/calldata does not match/);
      });

      it('verifies a matching payment intent on this path with no warnings', async function () {
        const data = '0xdeadbeef';
        const intent = {
          intentType: 'payment',
          recipients: [{ address: { address: tokenContractAddress }, amount: { value: '0', symbol: 'eth' }, data }],
        };
        const txHex = await build({ to: tokenContractAddress, value: '0', data });
        (await verifyPendingApproval(intent, txHex)).should.equal(true);
        warnings.should.have.length(0);
      });

      it('verifies stored defi-* intents without InvalidTransactionError and without a silent skip', async function () {
        const defiCases: Array<{ intentType: string; data: string; tampered: string; amountField: string }> = [
          {
            intentType: 'defi-approve',
            data: encodeApprove(attackerAddress, '123'),
            tampered: encodeApprove(attackerAddress, '999'),
            amountField: 'amount',
          },
          {
            intentType: 'defi-deposit',
            data: encodeWithAbi('deposit', ['uint256', 'address'], ['123', baseAddress]),
            tampered: encodeWithAbi('deposit', ['uint256', 'address'], ['999', baseAddress]),
            amountField: 'amount',
          },
          {
            intentType: 'defi-withdraw',
            data: encodeWithAbi('redeem', ['uint256', 'address', 'address'], ['123', baseAddress, baseAddress]),
            tampered: encodeWithAbi('redeem', ['uint256', 'address', 'address'], ['999', baseAddress, baseAddress]),
            amountField: 'shareTokenAmount',
          },
        ];
        for (const { intentType, data, tampered, amountField } of defiCases) {
          warnings = [];
          const intent: Record<string, unknown> = { intentType, vaultId: 'vault', [amountField]: '123' };
          const txHex = await build({ to: tokenContractAddress, value: '0', data });
          const result = await verifyPendingApproval(intent, txHex);
          result.should.equal(true, `${intentType} must verify`);

          // Not a silent skip: tampered amounts are rejected by the DeFi calldata checks.
          const tamperedHex = await build({ to: tokenContractAddress, value: '0', data: tampered });
          await verifyPendingApproval(intent, tamperedHex).should.be.rejectedWith(
            /does not match the requested amount|do not match the requested amount/
          );
        }
      });

      it('keeps rejecting stored defi-redeem intents, which have no handler, as master does', async function () {
        const intent = { intentType: 'defi-redeem', vaultId: 'v', amount: '1' };
        const txHex = await build({ to: tokenContractAddress, value: '0', data: '0xdeadbeef' });
        for (const strict of [false, true]) {
          await verifyPendingApproval(intent, txHex, strict).should.be.rejectedWith(/Recipient details are required/);
        }
        warnings.should.have.length(0);
      });
    });

    describe('legacy (non-EIP-1559) chains run the parent verifier', function () {
      it('rejects contractCall outright instead of returning true', async function () {
        const txHex = await build({ to: attackerAddress, value: '0', data: '0xdeadbeef' });
        await verify(
          { type: 'contractCall', recipients: [{ address: attackerAddress, amount: '0' }] },
          txHex
        ).should.be.rejectedWith(/unsupported intent type for EVM TSS/);
      });

      it('flags a payment with unrecognized calldata instead of returning true', async function () {
        const txHex = await build({
          to: tokenContractAddress,
          value: '0',
          data: encodeApprove(attackerAddress, MAX_UINT256),
        });
        const txParams = { type: 'transfer', recipients: [{ address: recipientAddress, amount: '1000' }] };
        (await verify(txParams, txHex)).should.equal(true);
        warnings.some((w) => /not a recognized payment shape/.test(w.reason)).should.equal(true);
      });
    });

    describe('warning infrastructure', function () {
      it('reports decoded vs expected to / value / data through onVerificationWarning', async function () {
        const data = '0xdeadbeef';
        const txHex = await build({ to: attackerAddress, value: '7', data: '0xdeadbe00' });
        await verify({ type: 'transfer', recipients: [{ address: tokenContractAddress, amount: '0', data }] }, txHex);
        warnings.length.should.be.greaterThanOrEqual(3);
        const destinationWarning = warnings.find((w) => /to does not match/.test(w.reason));
        destinationWarning?.expected.to?.toLowerCase().should.equal(tokenContractAddress.toLowerCase());
        destinationWarning?.decoded.to?.toLowerCase().should.equal(attackerAddress.toLowerCase());
        const valueWarning = warnings.find((w) => /value does not match/.test(w.reason));
        valueWarning?.expected.value?.should.equal('0');
        valueWarning?.decoded.value?.should.equal('7');
        const dataWarning = warnings.find((w) => /calldata does not match/.test(w.reason));
        dataWarning?.expected.data?.should.equal('0xdeadbeef');
        dataWarning?.decoded.data?.should.equal('0xdeadbe00');
      });

      it('does not fire the callback when the transaction matches the intent', async function () {
        const txHex = await build({ to: recipientAddress, value: '1000' });
        await verify({ type: 'transfer', recipients: [{ address: recipientAddress, amount: '1000' }] }, txHex);
        warnings.should.have.length(0);
      });
    });
  });
});
