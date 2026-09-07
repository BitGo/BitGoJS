import { existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';

import type { IWallet, StakingRequest, StakingTransaction } from '@bitgo/sdk-core';
import { hasPsbtMagic, Psbt } from '@bitgo/wasm-utxo';

import { descriptorDetails } from './api-cli';
import {
  getPox5WalletSpecific,
  parseBitGoWalletType,
  parsePositiveSats,
  redactBitGoError,
  redactBitGoErrorStack,
} from './bitgo-api';
import {
  authenticateBitGoApi,
  createOrGetLiveStakingWallet,
  faucetFundWallet,
  findSufficientWalletUnspent,
  loadBitGoApiIntegrationContext,
} from './bitgo-api.integration-support';
import { waitFor } from './rpc';

const defaultStakeAmountSats = '30000';
const defaultCustodialUnlockHeight = 300_000;
const defaultCustodialStakerCommitment = '00'.repeat(32);
const defaultEarlyExitKey = '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function signedTransactionPsbtHex(value: unknown): string {
  if (!isRecord(value)) throw new Error('BitGo returned no signed transaction');
  const transaction = value;
  if (typeof transaction.txHex === 'string') return transaction.txHex;
  const halfSigned = transaction.halfSigned;
  if (isRecord(halfSigned) && typeof halfSigned.txHex === 'string') {
    return halfSigned.txHex;
  }
  throw new Error('BitGo returned no inspectable signed transaction PSBT');
}

function custodialPendingApproval(
  value: unknown,
  coinName: string
): { id: string; state: string; isUnsigned: boolean; psbtHex: string } {
  const approval = isRecord(value) && isRecord(value.pendingApproval) ? value.pendingApproval : value;
  if (!isRecord(approval) || typeof approval.id !== 'string' || typeof approval.state !== 'string') {
    throw new Error('Wallet Platform returned no custodial staking pending approval');
  }
  const transactionRequest = isRecord(approval.info) ? approval.info.transactionRequest : undefined;
  if (!isRecord(transactionRequest) || typeof transactionRequest.isUnsigned !== 'boolean') {
    throw new Error('Custodial pending approval has no unsigned transaction status');
  }
  const coinSpecific = isRecord(transactionRequest) ? transactionRequest.coinSpecific : undefined;
  const coinTransaction = isRecord(coinSpecific) ? coinSpecific[coinName] : undefined;
  if (!isRecord(coinTransaction) || typeof coinTransaction.txHex !== 'string') {
    throw new Error(`Custodial pending approval has no ${coinName} transaction PSBT`);
  }
  return {
    id: approval.id,
    state: approval.state,
    isUnsigned: transactionRequest.isUnsigned,
    psbtHex: coinTransaction.txHex,
  };
}

function custodialStakingBuildParams(amountSats: string) {
  return {
    type: 'staking' as const,
    recipients: [],
    noSplitChange: true,
    txFormat: 'psbt' as const,
    stakingParams: {
      actionType: 'delegate',
      requestId: randomUUID(),
      pox5: {
        amount: amountSats,
        unlockHeight: defaultCustodialUnlockHeight,
        stakerCommitment: defaultCustodialStakerCommitment,
        earlyExitKey: defaultEarlyExitKey,
      },
    },
  };
}

function parsePox5Psbt(psbtHex: string, amountSats: string): Psbt {
  const psbtBytes = Buffer.from(psbtHex, 'hex');
  assert.ok(hasPsbtMagic(psbtBytes), 'Wallet Platform transaction payload is not a PSBT');
  const psbt = Psbt.deserialize(psbtBytes);
  assert.ok(
    psbt
      .getOutputs()
      .some(
        (output) =>
          output.value === BigInt(amountSats) &&
          output.script.length === 34 &&
          output.script[0] === 0x00 &&
          output.script[1] === 0x20
      ),
    'Wallet Platform transaction does not contain the requested PoX-5 P2WSH lockup output'
  );
  return psbt;
}

function assertPox5PsbtHasPartialSignatures(psbt: Psbt): void {
  assert.ok(
    psbt.getInputs().some((_input, inputIndex) => psbt.hasPartialSignatures(inputIndex)),
    'Wallet Platform signing returned a PSBT with no input signatures'
  );
}

async function waitForReadyTransaction(
  wallet: ReturnType<IWallet['toStakingWallet']>,
  request: StakingRequest,
  timeoutMs: number
): Promise<StakingTransaction> {
  let transaction: StakingTransaction | undefined;
  await waitFor(
    `Wallet Platform PoX-5 transaction for request ${request.id} to become ready`,
    async () => {
      const latest = await wallet.getStakingRequest(request.id);
      if (['FAILED', 'REJECTED', 'CANCELED'].includes(latest.status.toUpperCase())) {
        throw new Error(`Wallet Platform staking request ${request.id} ended in ${latest.status}`);
      }
      const ready = latest.transactions.filter((candidate) => candidate.status === 'READY');
      if (ready.length > 1) throw new Error(`Expected one ready transaction, received ${ready.length}`);
      if (ready.length === 0) return false;
      transaction = ready[0];
      return true;
    },
    timeoutMs,
    10_000
  );
  if (!transaction) throw new Error(`Wallet Platform returned no ready transaction for request ${request.id}`);
  return transaction;
}

async function assertPairedPox5Wallet(coin: IWallet['baseCoin'], mainWallet: IWallet): Promise<string> {
  const refreshedMainWallet = await coin.wallets().get({ id: mainWallet.id() });
  const pairedWalletId = getPox5WalletSpecific(refreshedMainWallet)?.pairedWalletId;
  if (typeof pairedWalletId !== 'string') throw new Error('Wallet Platform did not link a paired PoX-5 wallet');

  const pairedWallet = await coin.wallets().get({ id: pairedWalletId });
  assert.equal(
    getPox5WalletSpecific(pairedWallet)?.pairedWalletId,
    mainWallet.id(),
    'Paired PoX-5 wallet does not link back to the main wallet'
  );
  assert.ok(descriptorDetails(pairedWallet).length > 0, 'Paired wallet has no PoX-5 descriptor');
  return pairedWalletId;
}

describe('BitGo API PoX-5 live Wallet Platform signing integration', function () {
  it('validates the selected Wallet Platform signing mode without broadcasting', async function (this: Mocha.Context) {
    if (process.env.POX5_ENABLE_LIVE_WP_SIGNING !== '1') {
      throw new Error('Set POX5_ENABLE_LIVE_WP_SIGNING=1 to enable the live Wallet Platform signing test');
    }

    const localEnvPath = resolve(__dirname, '.env');
    if (existsSync(localEnvPath)) {
      const processEnvironment = { ...process.env };
      process.loadEnvFile(localEnvPath);
      Object.assign(process.env, processEnvironment);
    }

    // Default to the documented private-1 profile; explicit operator values win.
    process.env.POX5_NETWORK ??= 'tbtcstxprivate1';
    process.env.POX5_BOND_INDEX ??= '0';

    const context = loadBitGoApiIntegrationContext();
    const walletType = parseBitGoWalletType(process.env.POX5_WP_SIGN_WALLET_TYPE);
    // This opt-in integration is restricted to test/staging and a dedicated wallet.
    const walletPassphrase =
      walletType === 'hot' ? process.env.BITGO_WALLET_PASSPHRASE ?? 'too many secrets' : undefined;

    const amountSats = parsePositiveSats(
      process.env.POX5_BITGO_STAKING_AMOUNT_SATS ?? defaultStakeAmountSats,
      'PoX-5 staking amount'
    );
    const minimumFundingSats = (BigInt(amountSats) + 10_000n).toString();
    const secrets = [context.token, ...(walletPassphrase ? [walletPassphrase] : [])];
    this.timeout(context.config.bitcoin.startupTimeoutMs * 3 + context.config.bitcoin.timeoutMs);

    let mainWallet: IWallet | undefined;
    let wallet = undefined as ReturnType<IWallet['toStakingWallet']> | undefined;
    let request: StakingRequest | undefined;
    let custodialPendingApprovalId: string | undefined;
    let failed = false;
    let errorMessage = '';
    let stage = 'authenticate BitGo API';

    try {
      await authenticateBitGoApi(context);
      stage = `load or create the dedicated ${walletType} BitGo wallet`;
      const selected = await createOrGetLiveStakingWallet(context, walletPassphrase, walletType);
      mainWallet = selected.wallet;
      stage = 'confirm the wallet has a sufficiently funded input';
      const funding = await findSufficientWalletUnspent(mainWallet, minimumFundingSats);
      if (funding) {
        console.log(`Using confirmed input ${funding.outpoint} for live staking request`);
      } else {
        const faucetFunding = await faucetFundWallet(context, mainWallet);
        assert.ok(
          BigInt(faucetFunding.amountSats) >= BigInt(minimumFundingSats),
          `Faucet input ${faucetFunding.outpoint} is too small for the stake and transaction fee`
        );
        console.log(`Using confirmed faucet input ${faucetFunding.outpoint} for live staking request`);
      }

      if (walletType === 'hot') {
        if (!walletPassphrase) throw new Error('BITGO_WALLET_PASSPHRASE is required for hot wallet signing');
        const { bondIndex, signerManager } = context.config.stacks;
        if (bondIndex === undefined) throw new Error('POX5_BOND_INDEX is required for live Wallet Platform signing');
        if (!signerManager) throw new Error('POX5_SIGNER_MANAGER is required for live Wallet Platform signing');
        const stxWalletId = process.env.POX5_STX_WALLET_ID;
        if (!stxWalletId) throw new Error('POX5_STX_WALLET_ID must identify an allowlisted Stacks wallet');
        const btcRewardAddress = mainWallet.toJSON().receiveAddress?.address;
        if (!btcRewardAddress) throw new Error('PoX-5 BTC wallet has no reward address');
        const stxAmountUstx = parsePositiveSats(process.env.POX5_STX_AMOUNT_USTX ?? '10000000', 'STX amount in uSTX');

        wallet = mainWallet.toStakingWallet();
        stage = 'create the PoX-5 staking request';
        const stakeOptions = {
          subType: 'pox5-bond' as const,
          amount: amountSats,
          amountBtcSats: amountSats,
          stxAmountUstx,
          btcRewardAddress,
          stxWalletId,
          bondIndex,
          signerManager,
          maxFeeSats: process.env.POX5_MAX_FEE_SATS ?? '1000000',
        };
        request = await wallet.stake(stakeOptions);
        console.log(`Created live PoX-5 staking request ${request.id} on ${context.coinName}`);

        stage = `wait for staking request ${request.id} to become ready`;
        const transaction = await waitForReadyTransaction(wallet, request, context.config.bitcoin.startupTimeoutMs);
        stage = `SDK buildAndSign for staking transaction ${transaction.id}`;
        const signed = await wallet.buildAndSign({ walletPassphrase }, transaction);
        stage = 'extract signed staking PSBT';
        assertPox5PsbtHasPartialSignatures(parsePox5Psbt(signedTransactionPsbtHex(signed.signed), amountSats));
        stage = 'verify persisted paired-wallet linkage';
        const pairedWalletId = await assertPairedPox5Wallet(context.bitgo.coin(context.coinName), mainWallet);
        console.log(`Wallet Platform built and HSM-signed the hot PoX-5 request for paired wallet ${pairedWalletId}`);
      } else {
        stage = 'initiate custodial PoX-5 transaction through Wallet Platform';
        const response = await mainWallet.sendMany(custodialStakingBuildParams(amountSats));
        const approval = custodialPendingApproval(response, context.coinName);
        custodialPendingApprovalId = approval.id;
        assert.equal(approval.state, 'awaitingSignature', 'Custodial staking should create a pending approval');
        assert.equal(
          approval.isUnsigned,
          true,
          'Custodial initiation should leave signing for pending-approval review'
        );
        stage = 'parse and verify custodial pending-approval PSBT';
        const psbt = parsePox5Psbt(approval.psbtHex, amountSats);
        assert.ok(
          psbt.getInputs().every((_input, inputIndex) => !psbt.hasPartialSignatures(inputIndex)),
          'Custodial initiate should return an unsigned PSBT before approval'
        );
        stage = 'verify custodial paired-wallet linkage';
        const pairedWalletId = await assertPairedPox5Wallet(context.bitgo.coin(context.coinName), mainWallet);
        console.log(
          `Wallet Platform created the custodial PoX-5 pending approval for paired wallet ${pairedWalletId}; pending approval ${approval.id}`
        );
      }
    } catch (error) {
      failed = true;
      errorMessage = `Live PoX-5 test failed during ${stage}: ${redactBitGoError(error, secrets)}`;
      const diagnosticError = new Error(errorMessage);
      const stack = redactBitGoErrorStack(error, secrets);
      if (stack) {
        diagnosticError.stack = [
          `${diagnosticError.name}: ${diagnosticError.message}`,
          ...stack.split('\n').slice(1),
        ].join('\n');
      }
      throw diagnosticError;
    } finally {
      if (request && wallet) {
        try {
          const canceled = await wallet.cancelStakingRequest(request.id);
          if (canceled.status.toUpperCase() !== 'CANCELED') {
            throw new Error(`Wallet Platform returned ${canceled.status} instead of CANCELED`);
          }
          console.log(`Canceled signed-but-unbroadcast PoX-5 staking request ${request.id}`);
        } catch (error) {
          const cleanupMessage = redactBitGoError(error, secrets);
          if (failed) {
            throw new Error(
              `Live PoX-5 test failed (${errorMessage}) and request cleanup also failed (${cleanupMessage})`
            );
          }
          throw new Error(`Live PoX-5 request ${request.id} could not be canceled: ${cleanupMessage}`);
        }
      }
      if (custodialPendingApprovalId && mainWallet) {
        try {
          const refreshedWallet = await mainWallet.refresh();
          const pendingApproval = refreshedWallet
            .pendingApprovals()
            .find((approval) => approval.id() === custodialPendingApprovalId);
          if (!pendingApproval) throw new Error(`Pending approval ${custodialPendingApprovalId} was not found`);
          await pendingApproval.reject();
          console.log(`Rejected unbroadcast custodial PoX-5 pending approval ${custodialPendingApprovalId}`);
        } catch (error) {
          const cleanupMessage = redactBitGoError(error, secrets);
          if (failed) {
            throw new Error(
              `Custodial PoX-5 test failed (${errorMessage}) and pending-approval cleanup also failed (${cleanupMessage})`
            );
          }
          throw new Error(
            `Custodial PoX-5 pending approval ${custodialPendingApprovalId} could not be rejected: ${cleanupMessage}`
          );
        }
      }
    }
  });
});
