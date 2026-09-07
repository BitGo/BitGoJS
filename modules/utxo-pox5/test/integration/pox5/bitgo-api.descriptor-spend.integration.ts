import { existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

import { descriptor as descriptorApi, type AbstractUtxoCoin } from '@bitgo/abstract-utxo';
import type { IWallet, PrebuildTransactionResult } from '@bitgo/sdk-core';
import { pox5 } from '@bitgo/utxo-descriptors';
import { pox5 as pox5Staking } from '@bitgo/utxo-staking';
import * as utxolib from '@bitgo/utxo-lib';
import { Descriptor, Psbt as WasmPsbt, descriptorWallet } from '@bitgo/wasm-utxo';

import { decodePsbt, latestBlockHeight, networkForCoin, replacePsbt, signAndSubmit } from './bitgo-api-helpers';
import {
  listBitGoWallets,
  outpointFromUnspent,
  redactBitGoError,
  responseUnspents,
  walletCoinSpecifics,
} from './bitgo-api';
import {
  authenticateBitGoApi,
  createOrGetDedicatedWallet,
  faucetFundWallet,
  findSufficientWalletUnspent,
  loadBitGoApiIntegrationContext,
  waitForWalletUnspent,
  type BitGoApiIntegrationContext,
} from './bitgo-api.integration-support';
import { derivePox5FakeStakeMaterials } from './fake-stake';
import { waitFor } from './rpc';

const pox5DescriptorName = 'Pox5Lockup';
const lockAmountSats = '30000';
const spendFeeRate = 1000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pox5LockupDescriptorValue(wallet: IWallet): string {
  for (const coinSpecific of walletCoinSpecifics(wallet)) {
    if (!Array.isArray(coinSpecific.descriptors)) continue;
    for (const item of coinSpecific.descriptors) {
      if (isRecord(item) && item.name === pox5DescriptorName && typeof item.value === 'string') {
        return item.value;
      }
    }
  }
  throw new Error('Descriptor wallet is missing the PoX-5 lockup descriptor');
}

function toSats(value: unknown): bigint | undefined {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number' && Number.isSafeInteger(value)) return BigInt(value);
  return undefined;
}

function dropPathlessDerivations(psbt: utxolib.bitgo.UtxoPsbt): utxolib.bitgo.UtxoPsbt {
  for (const input of psbt.data.inputs) {
    if (Array.isArray(input.bip32Derivation)) {
      input.bip32Derivation = input.bip32Derivation.filter((derivation) => derivation.path.length > 0);
    }
  }
  return psbt;
}

async function createOrGetPox5DescriptorWallet(args: {
  context: BitGoApiIntegrationContext;
  unlockHeight: number;
  stakerCommitment: Buffer;
  earlyExitKey: Buffer;
  walletPassphrase: string;
  enterpriseId: string;
}): Promise<{ wallet: IWallet; unlockHeight: number }> {
  const label = process.env.POX5_DESCRIPTOR_WALLET_LABEL?.trim() || `pox5-descriptor-spend-${args.context.coinName}`;
  const listedWallets = await listBitGoWallets(args.context.bitgo, args.context.coinName);
  const matches = listedWallets.filter((wallet) => wallet.label === label);
  if (matches.length > 1) {
    throw new Error(`Multiple wallets found with the dedicated descriptor label ${label}`);
  }
  if (matches.length === 1) {
    const wallet = await args.context.bitgo.coin(args.context.coinName).wallets().get({ id: matches[0].id });
    const info = pox5.parsePox5LockupDescriptor(Descriptor.fromString(pox5LockupDescriptorValue(wallet), 'derivable'));
    if (!info) throw new Error('Stored PoX-5 lockup descriptor could not be parsed');
    if (!info.stakerCommitment.equals(args.stakerCommitment) || !info.earlyExitKey.equals(args.earlyExitKey)) {
      throw new Error(
        `Wallet ${label} uses different PoX-5 recovery material; set POX5_DESCRIPTOR_WALLET_LABEL to a fresh label`
      );
    }
    return { wallet, unlockHeight: info.unlockHeight };
  }

  const coin = args.context.bitgo.coin(args.context.coinName) as AbstractUtxoCoin;
  const wallet = await descriptorApi.createWallet.createDescriptorWalletWithWalletPassphrase(args.context.bitgo, coin, {
    label,
    enterprise: args.enterpriseId,
    walletPassphrase: args.walletPassphrase,
    descriptorsFromKeys(userKey, cosigners) {
      const lockup = pox5.createPox5LockupDescriptor({
        unlockHeight: args.unlockHeight,
        stakerCommitment: args.stakerCommitment,
        earlyExitKey: args.earlyExitKey,
        stakerKeys: [userKey, cosigners[0], cosigners[1]],
      });
      return [
        ...descriptorApi.createWallet.DefaultWsh2Of3(userKey, cosigners),
        descriptorApi.createNamedDescriptorWithSignature(pox5DescriptorName, lockup.toString(), userKey),
      ];
    },
  });
  return { wallet, unlockHeight: args.unlockHeight };
}

async function registerPox5ReceiveAddress(args: {
  context: BitGoApiIntegrationContext;
  descriptorWallet: IWallet;
}): Promise<{ address: string; index: number }> {
  const response = await args.context.bitgo
    .post(args.context.bitgo.coin(args.context.coinName).url(`/wallet/${args.descriptorWallet.id()}/address`))
    .send({ descriptorName: pox5DescriptorName })
    .result();
  if (
    !isRecord(response) ||
    typeof response.address !== 'string' ||
    response.address.length === 0 ||
    typeof response.index !== 'number' ||
    !Number.isSafeInteger(response.index) ||
    response.index < 0
  ) {
    throw new Error('Wallet Platform returned no PoX-5 descriptor receive address');
  }
  const coinSpecific = isRecord(response.coinSpecific) ? response.coinSpecific : undefined;
  if (!isRecord(coinSpecific) || coinSpecific.descriptorName !== pox5DescriptorName) {
    throw new Error('Wallet Platform receive address was not derived from the PoX-5 descriptor');
  }
  return { address: response.address, index: response.index };
}

async function buildPox5SweepPrebuild(args: {
  context: BitGoApiIntegrationContext;
  descriptorWallet: IWallet;
  recoveryAddress: string;
  outpoint: string;
  unlockHeight: number;
}): Promise<PrebuildTransactionResult> {
  const response = await args.context.bitgo
    .post(args.context.bitgo.coin(args.context.coinName).url(`/wallet/${args.descriptorWallet.id()}/tx/build`))
    .send({
      recipients: [{ address: args.recoveryAddress, amount: 'max' }],
      unspents: [args.outpoint],
      locktime: args.unlockHeight,
      feeRate: spendFeeRate,
      txFormat: 'psbt',
    })
    .result();
  if (!isRecord(response) || typeof response.txBase64 !== 'string' || response.txBase64.length === 0) {
    throw new Error('Wallet Platform returned no PSBT for the PoX-5 sweep build');
  }
  return { txBase64: response.txBase64 } as unknown as PrebuildTransactionResult;
}

function assertSweepPsbtShape(args: {
  psbt: utxolib.bitgo.UtxoPsbt;
  addressCodec: AbstractUtxoCoin['addressCodec'];
  outpoint: string;
  unlockHeight: number;
  amountSats: string;
  expectedScript: Buffer;
  recoveryAddress: string;
}): void {
  const { psbt } = args;
  assert.equal(psbt.txInputs.length, 1, 'PoX-5 sweep must spend exactly the lockup output');
  const input = psbt.txInputs[0];
  const inputTxid = Buffer.from(input.hash).reverse().toString('hex');
  assert.equal(`${inputTxid}:${input.index}`, args.outpoint, 'PoX-5 sweep spends a different outpoint');
  assert.ok(psbt.locktime >= args.unlockHeight, `PoX-5 sweep locktime ${psbt.locktime} precedes the unlock height`);
  assert.ok(psbt.locktime < 500_000_000, 'PoX-5 sweep locktime must remain a block height');
  assert.notEqual(input.sequence, 0xffffffff, 'PoX-5 sweep input must use a non-final sequence');

  const psbtInput = psbt.data.inputs[0] as unknown;
  const witnessUtxo = isRecord(psbtInput) ? psbtInput.witnessUtxo : undefined;
  assert.ok(isRecord(witnessUtxo), 'PoX-5 sweep input has no witness UTXO');
  const witnessScript = witnessUtxo?.script;
  assert.ok(Buffer.isBuffer(witnessScript), 'PoX-5 sweep witness UTXO has no script');
  assert.ok(
    witnessScript.equals(args.expectedScript),
    'PoX-5 sweep witness script differs from the registered descriptor script'
  );
  const witnessValue = toSats(witnessUtxo?.value);
  assert.ok(
    witnessValue === BigInt(args.amountSats),
    `PoX-5 sweep input value ${witnessValue?.toString() ?? 'unknown'} differs from the lockup amount`
  );

  const recoveryScript = args.addressCodec.fromExtendedAddressFormatToScript(args.recoveryAddress);
  const outputs = psbt.getUnsignedTx().outs;
  assert.ok(
    outputs.some((output) => output.script.equals(recoveryScript) && output.value > 0n),
    'PoX-5 sweep does not pay the main-wallet recovery address'
  );
  const outputSum = outputs.reduce((sum, output) => sum + output.value, 0n);
  const feeSats = BigInt(args.amountSats) - outputSum;
  assert.ok(feeSats > 0n && feeSats < BigInt(args.amountSats), `PoX-5 sweep has an unexpected fee ${feeSats}`);
}

function assertNativePox5Spend(psbt: utxolib.bitgo.UtxoPsbt, lockupDescriptor: Descriptor): void {
  const wasmPsbt = WasmPsbt.deserialize(psbt.toBuffer());
  const descriptorMap = descriptorWallet.toDescriptorMap([{ name: pox5DescriptorName, value: lockupDescriptor }]);
  const match = pox5.matchPox5Input(wasmPsbt, 0, descriptorMap);
  assert.ok(match, 'Wallet Platform sweep input does not match the stored PoX-5 descriptor');
  pox5Staking.assertPox5LocktimeSpend(wasmPsbt, [match]);
}

describe('BitGo API PoX-5 descriptor-wallet spend integration', function () {
  it('funds and spends a standalone PoX-5 descriptor-wallet output through Wallet Platform', async function (this: Mocha.Context) {
    if (process.env.POX5_ENABLE_LIVE_DESCRIPTOR_SPEND !== '1') {
      throw new Error('Set POX5_ENABLE_LIVE_DESCRIPTOR_SPEND=1 to enable the live descriptor-wallet spend test');
    }

    const localEnvPath = resolve(__dirname, '.env');
    if (existsSync(localEnvPath)) {
      const processEnvironment = { ...process.env };
      process.loadEnvFile(localEnvPath);
      Object.assign(process.env, processEnvironment);
    }

    process.env.POX5_NETWORK ??= 'tbtcstx';

    const context = loadBitGoApiIntegrationContext();
    const walletPassphrase = process.env.BITGO_WALLET_PASSPHRASE ?? 'too many secrets';
    const network = networkForCoin(context.coinName);
    const materials = derivePox5FakeStakeMaterials(walletPassphrase, context.environment, context.coinName, network);
    const stakerCommitment = createHash('sha256').update(materials.principalPreimage).digest();
    const secrets = [
      context.token,
      walletPassphrase,
      materials.principalPreimage.toString('hex'),
      materials.earlyExitKey.privateKey ? Buffer.from(materials.earlyExitKey.privateKey).toString('hex') : '',
    ];
    this.timeout(context.config.bitcoin.startupTimeoutMs * 6 + context.config.bitcoin.timeoutMs * 2);

    let stage = 'authenticate BitGo API';
    try {
      await authenticateBitGoApi(context);

      stage = 'select the dedicated fixed-script main wallet';
      const mainLabel =
        process.env.POX5_DESCRIPTOR_MAIN_WALLET_LABEL?.trim() || `pox5-descriptor-main-${context.coinName}`;
      const mainWallet = (await createOrGetDedicatedWallet(context, walletPassphrase, mainLabel)).wallet;

      stage = 'resolve the PoX-5 descriptor wallet and its unlock height';
      const currentHeight = await latestBlockHeight(mainWallet.baseCoin);
      const enterpriseId = process.env.POX5_BITGO_ENTERPRISE_ID?.trim() || mainWallet.toJSON().enterprise;
      if (typeof enterpriseId !== 'string' || enterpriseId.length === 0) {
        throw new Error('Set POX5_BITGO_ENTERPRISE_ID for the descriptor-wallet creation');
      }
      const { wallet: descriptorWallet, unlockHeight } = await createOrGetPox5DescriptorWallet({
        context,
        unlockHeight: currentHeight + 1,
        stakerCommitment,
        earlyExitKey: materials.earlyExitKey.publicKey,
        walletPassphrase,
        enterpriseId,
      });
      const lockupDescriptor = Descriptor.fromString(pox5LockupDescriptorValue(descriptorWallet), 'derivable');
      console.log(`Using descriptor wallet ${descriptorWallet.id()} with PoX-5 unlock height ${unlockHeight}`);

      stage = 'register a PoX-5 receive address on the descriptor wallet';
      const receive = await registerPox5ReceiveAddress({ context, descriptorWallet });
      const expectedScript = Buffer.from(lockupDescriptor.atDerivationIndex(receive.index).scriptPubkey());
      assert.equal(
        (mainWallet.baseCoin as AbstractUtxoCoin).addressCodec.toExtendedAddressFormat(expectedScript),
        receive.address,
        'Wallet Platform receive address does not match the PoX-5 descriptor script'
      );

      stage = 'fund the PoX-5 lockup output from the main wallet';
      const minimumFundingSats = (BigInt(lockAmountSats) + 10_000n).toString();
      const existingInput = await findSufficientWalletUnspent(mainWallet, minimumFundingSats);
      const fundingInput = existingInput ?? (await faucetFundWallet(context, mainWallet));
      console.log(
        existingInput
          ? `Reusing confirmed main-wallet input ${fundingInput.outpoint}`
          : `Using confirmed faucet input ${fundingInput.outpoint}`
      );
      const fundingSubmission = await mainWallet.sendMany({
        recipients: [{ address: receive.address, amount: lockAmountSats }],
        walletPassphrase,
      });
      const fundingTxid =
        isRecord(fundingSubmission) && typeof fundingSubmission.txid === 'string' ? fundingSubmission.txid : undefined;
      if (!fundingTxid) throw new Error('Main-wallet lockup funding send returned no transaction id');

      stage = 'wait for lockup confirmation and descriptor-wallet indexing';
      await context.funding.waitForConfirmed(fundingTxid);
      const lockUnspent = await waitForWalletUnspent(context, descriptorWallet, fundingTxid, receive.address);

      stage = `wait for chain height to reach the PoX-5 unlock height ${unlockHeight}`;
      await waitFor(
        `Bitcoin height to reach the PoX-5 unlock height ${unlockHeight}`,
        async () => (await latestBlockHeight(mainWallet.baseCoin)) >= unlockHeight,
        context.config.bitcoin.startupTimeoutMs,
        15_000
      );

      stage = 'build the post-CLTV sweep from the descriptor wallet';
      const { address: recoveryAddress } = await mainWallet.createAddress();
      assert.ok(typeof recoveryAddress === 'string' && recoveryAddress.length > 0);
      const sweepPrebuild = await buildPox5SweepPrebuild({
        context,
        descriptorWallet,
        recoveryAddress,
        outpoint: lockUnspent.outpoint,
        unlockHeight,
      });
      const sweepPsbt = dropPathlessDerivations(decodePsbt(sweepPrebuild, network));
      assertSweepPsbtShape({
        psbt: sweepPsbt,
        addressCodec: (mainWallet.baseCoin as AbstractUtxoCoin).addressCodec,
        outpoint: lockUnspent.outpoint,
        unlockHeight,
        amountSats: lockUnspent.amountSats,
        expectedScript,
        recoveryAddress,
      });
      assertNativePox5Spend(sweepPsbt, lockupDescriptor);

      stage = 'sign and submit the PoX-5 sweep through Wallet Platform';
      const sweepSubmission = await signAndSubmit(
        descriptorWallet,
        replacePsbt(sweepPrebuild, sweepPsbt),
        walletPassphrase
      );
      const sweepTxid = typeof sweepSubmission.txid === 'string' ? sweepSubmission.txid : undefined;
      if (!sweepTxid) {
        throw new Error(`PoX-5 sweep was not broadcast: ${JSON.stringify(sweepSubmission)}`);
      }

      stage = 'wait for sweep confirmation and recovered funds';
      await context.funding.waitForConfirmed(sweepTxid);
      const recovered = await waitForWalletUnspent(context, mainWallet, sweepTxid, recoveryAddress);
      assert.ok(BigInt(recovered.amountSats) > 0n, 'PoX-5 sweep did not return funds to the main wallet');

      stage = 'wait for the spent lockup to leave the descriptor wallet';
      await waitFor(
        `BitGo to remove the spent PoX-5 outpoint ${lockUnspent.outpoint}`,
        async () =>
          !responseUnspents(await descriptorWallet.unspents({ limit: 100 })).some(
            (unspent) => outpointFromUnspent(unspent) === lockUnspent.outpoint
          ),
        context.config.bitcoin.startupTimeoutMs,
        15_000
      );
      console.log(
        `PoX-5 descriptor-wallet round trip complete; ${recovered.amountSats} sats returned to the main wallet`
      );
    } catch (error) {
      throw new Error(`Failed to ${stage}: ${redactBitGoError(error, secrets)}`);
    }
  });
});
