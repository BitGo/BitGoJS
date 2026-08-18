import { ECDSAUtils, Ecdsa } from '@bitgo/sdk-core';
import { NetworkType } from '@bitgo/statics';
import { Starknet, StarknetRecoveryOptions } from '../starknet';
import {
  STRK_TOKEN_CONTRACT,
  RECOVERY_L2_GAS_MAX_AMOUNT,
  RECOVERY_L1_DATA_GAS_MAX_AMOUNT,
  RECOVERY_GAS_PRICE_BUFFER_MULTIPLIER,
  RECOVERY_L2_GAS_MIN_PRICE_PER_UNIT,
} from './constants';
import { TransferBuilder } from './transferBuilder';
import { WalletInitializationBuilder } from './walletInitializationBuilder';
import { Transaction } from './transaction';
import utils from './utils';
import { StarknetResourceBounds } from './iface';

export async function queryStarknetNode(nodeUrl: string, method: string, params: unknown): Promise<any> {
  const response = await fetch(nodeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  });
  if (!response.ok) {
    throw new Error(`Starknet Node RPC HTTP error: ${response.status} ${response.statusText}`);
  }
  const result = await response.json();
  if (result.error) {
    throw new Error(
      `Starknet Node RPC error (code ${result.error.code}): ${result.error.message || JSON.stringify(result.error)}`
    );
  }
  return result.result;
}

interface StarknetGasPrices {
  l1: bigint;
  l2: bigint;
  l1Data: bigint;
}

/** Read live per-resource gas prices (in fri) from the latest block header. */
async function getGasPrices(nodeUrl: string): Promise<StarknetGasPrices> {
  const block = await queryStarknetNode(nodeUrl, 'starknet_getBlockWithTxHashes', ['latest']);
  const toFri = (gasPrice: any): bigint => {
    try {
      return BigInt(gasPrice?.price_in_fri ?? '0x0');
    } catch {
      return 0n;
    }
  };
  return {
    l1: toFri(block?.l1_gas_price),
    l2: toFri(block?.l2_gas_price),
    l1Data: toFri(block?.l1_data_gas_price),
  };
}

/**
 * Build V3 resource bounds (mirrors bitgo-microservices wallet-platform `buildResourceBounds`):
 * fixed generous amounts per resource, live prices with a 2x buffer, and an L2 price floor.
 */
function buildRecoveryResourceBounds(gasPrices: StarknetGasPrices): StarknetResourceBounds {
  const bufferedL2Price = gasPrices.l2 * RECOVERY_GAS_PRICE_BUFFER_MULTIPLIER;
  const l2Price =
    bufferedL2Price > RECOVERY_L2_GAS_MIN_PRICE_PER_UNIT ? bufferedL2Price : RECOVERY_L2_GAS_MIN_PRICE_PER_UNIT;
  return {
    l2_gas: { max_amount: RECOVERY_L2_GAS_MAX_AMOUNT, max_price_per_unit: '0x' + l2Price.toString(16) },
    // V3 txns don't consume L1 gas (data goes through L1_DATA), so amount is 0.
    l1_gas: {
      max_amount: '0x0',
      max_price_per_unit: '0x' + (gasPrices.l1 * RECOVERY_GAS_PRICE_BUFFER_MULTIPLIER).toString(16),
    },
    l1_data_gas: {
      max_amount: RECOVERY_L1_DATA_GAS_MAX_AMOUNT,
      max_price_per_unit: '0x' + (gasPrices.l1Data * RECOVERY_GAS_PRICE_BUFFER_MULTIPLIER).toString(16),
    },
  };
}

/** Maximum fee the sequencer can charge = sum of (max_amount x max_price_per_unit) over resources. */
function maxFeeFromResourceBounds(rb: StarknetResourceBounds): bigint {
  const product = (amount: string, price: string): bigint => BigInt(amount) * BigInt(price);
  return (
    product(rb.l2_gas.max_amount, rb.l2_gas.max_price_per_unit) +
    product(rb.l1_gas.max_amount, rb.l1_gas.max_price_per_unit) +
    product(rb.l1_data_gas.max_amount, rb.l1_data_gas.max_price_per_unit)
  );
}

async function buildDeployTransaction(
  coin: Starknet,
  derivedPublicKey: string,
  chainId: string,
  resourceBounds: any,
  isUnsignedSweep: boolean,
  userKeyShare?: Buffer,
  backupKeyShare?: Buffer,
  commonKeyChain?: string
): Promise<{ deployTx: Transaction; deployTxHex: string }> {
  const deployBuilder = new WalletInitializationBuilder((coin as any)._staticsCoin);
  deployBuilder.fromPublicKey(derivedPublicKey);
  deployBuilder.nonce('0x0');
  deployBuilder.chainId(chainId);
  deployBuilder.resourceBounds(resourceBounds);
  const deployTx = (await deployBuilder.build()) as Transaction;

  if (!isUnsignedSweep) {
    const deployMessageHash = Buffer.from(deployTx.signableHex, 'hex');
    const deploySignature = await coin.signRecoveryTransaction(
      deployMessageHash,
      userKeyShare!,
      backupKeyShare!,
      commonKeyChain!
    );
    const deployFormattedSig = utils.formatEthAccountSignature(
      deploySignature.r,
      deploySignature.s,
      deploySignature.recid
    );
    deployTx.starknetTransactionData.signature = deployFormattedSig;
    deployTx.signedTransaction = deployTx.toInternalHex();
  }

  return {
    deployTx,
    deployTxHex: deployTx.toInternalHex(),
  };
}

export async function recoverStarknetWallet(coin: Starknet, params: StarknetRecoveryOptions): Promise<any> {
  if (!params.bitgoKey) {
    throw new Error('Missing bitgoKey (Box C)');
  }
  if (!params.recoveryDestination || !coin.isValidAddress(params.recoveryDestination)) {
    throw new Error('Invalid recoveryDestination');
  }

  const bitgoKey = params.bitgoKey.replace(/\s/g, '');
  const isUnsignedSweep = !params.walletPassphrase || !params.userKey || !params.backupKey;

  const index = params.index || 0;
  const derivationPath = `m/${index}`;
  const ecdsa = new Ecdsa();

  let commonKeyChain = bitgoKey;
  let userKeyShare: Buffer | undefined;
  let backupKeyShare: Buffer | undefined;

  if (!isUnsignedSweep) {
    const userKey = params.userKey!.replace(/\s/g, '');
    const backupKey = params.backupKey!.replace(/\s/g, '');

    const shares = await ECDSAUtils.getMpcV2RecoveryKeyShares(
      userKey,
      backupKey,
      params.walletPassphrase,
      (coin as any).bitgo
    );
    userKeyShare = shares.userKeyShare;
    backupKeyShare = shares.backupKeyShare;
    commonKeyChain = shares.commonKeyChain;
  }

  // Derive public key and Starknet address from common keychain
  const derivedCommonKeyChain = ecdsa.deriveUnhardened(commonKeyChain, derivationPath);
  const derivedPublicKey = derivedCommonKeyChain.slice(0, 66); // 33 bytes compressed hex
  const senderAddress = utils.getAddressFromPublicKey(derivedPublicKey);

  // Get Starknet node URL from options or defaults
  const nodeUrl =
    params.nodeUrl ||
    params.starknetNodeUrl ||
    ((coin as any)._staticsCoin.network.type === NetworkType.TESTNET
      ? 'https://starknet-sepolia-rpc.publicnode.com/'
      : 'https://starknet-mainnet-rpc.publicnode.com/');

  // Check if account is deployed on-chain. Counterfactual accounts that have received funds
  // but never transacted are not yet deployed and need a DEPLOY_ACCOUNT before the INVOKE sweep.
  let isDeployed = true;
  try {
    await queryStarknetNode(nodeUrl, 'starknet_getClassHashAt', ['latest', senderAddress]);
  } catch (e: any) {
    const msg = (e.message || '').toLowerCase();
    if (msg.includes('contract not found') || msg.includes('code 20') || msg.includes('code 28')) {
      isDeployed = false;
    } else {
      throw new Error(`Failed to check account deployment status: ${e.message}`);
    }
  }

  // Determine the nonce for the INVOKE sweep.
  // - Deployed account: query the live nonce.
  // - Undeployed account: the DEPLOY_ACCOUNT consumes nonce 0, so the following sweep uses nonce 1.
  let sweepNonce: string;
  if (isDeployed) {
    try {
      const nonceResult = await queryStarknetNode(nodeUrl, 'starknet_getNonce', ['latest', senderAddress]);
      sweepNonce = '0x' + BigInt(nonceResult).toString(16);
    } catch (e) {
      sweepNonce = '0x0';
    }
  } else {
    sweepNonce = '0x1';
  }

  // Query node for balance of the token
  const tokenContractAddress = params.tokenContractAddress || STRK_TOKEN_CONTRACT;
  const balanceOfSelector = '0x' + utils.getSelectorFromName('balance_of').toString(16);
  let balance = 0n;
  try {
    const balanceResult = await queryStarknetNode(nodeUrl, 'starknet_call', [
      {
        contract_address: tokenContractAddress,
        entry_point_selector: balanceOfSelector,
        calldata: [senderAddress],
      },
      'latest',
    ]);
    if (Array.isArray(balanceResult) && balanceResult.length >= 2) {
      const low = BigInt(balanceResult[0]);
      const high = BigInt(balanceResult[1]);
      balance = (high << 128n) | low;
    }
  } catch (e: any) {
    throw new Error(`Failed to query balance of token ${tokenContractAddress}: ${e.message}`);
  }

  // Build V3 resource bounds from live per-resource gas prices.
  const gasPrices = await getGasPrices(nodeUrl);
  const resourceBounds = buildRecoveryResourceBounds(gasPrices);
  const maxFee = maxFeeFromResourceBounds(resourceBounds);

  const chainId =
    (coin as any)._staticsCoin.network.type === NetworkType.TESTNET ? '0x534e5f5345504f4c4941' : '0x534e5f4d41494e';

  let deployTxHex: string | undefined;
  let deployTx: Transaction | undefined;

  if (!isDeployed) {
    ({ deployTx, deployTxHex } = await buildDeployTransaction(
      coin,
      derivedPublicKey,
      chainId,
      resourceBounds,
      isUnsignedSweep,
      userKeyShare,
      backupKeyShare,
      commonKeyChain
    ));
  }

  // When sweeping the gas token (STRK), reserve the fee from the swept amount. Both the deploy
  // and the sweep fees are paid in STRK from the same account, so reserve 2x when also deploying.
  let amountToSend = balance;
  if (tokenContractAddress.toLowerCase() === STRK_TOKEN_CONTRACT.toLowerCase()) {
    const totalFeeReserve = isDeployed ? maxFee : maxFee * 2n;
    amountToSend = balance - totalFeeReserve;
    if (amountToSend <= 0n) {
      throw new Error(
        `Insufficient STRK balance to cover recovery fee of ${totalFeeReserve.toString()} fri. Balance: ${balance.toString()} fri.`
      );
    }
  }

  const factory = (coin as any).getBuilderFactory();
  const transferBuilder = factory.getTransferBuilder() as TransferBuilder;
  transferBuilder
    .sender(senderAddress)
    .receiverId(params.recoveryDestination)
    .amount(amountToSend.toString())
    .nonce(sweepNonce)
    .chainId(chainId)
    .resourceBounds(resourceBounds)
    .tokenContractAddress(tokenContractAddress);

  const unsignedTransaction = (await transferBuilder.build()) as Transaction;
  const signableHex = unsignedTransaction.signableHex;

  let serializedTx: string;
  if (isUnsignedSweep) {
    serializedTx = unsignedTransaction.toInternalHex();
  } else {
    const cleanHex = signableHex.startsWith('0x') ? signableHex.slice(2) : signableHex;
    const messageHash = Buffer.from(cleanHex, 'hex');
    const signature = await coin.signRecoveryTransaction(messageHash, userKeyShare!, backupKeyShare!, commonKeyChain);

    const formattedSignature = utils.formatEthAccountSignature(signature.r, signature.s, signature.recid);

    const txData = unsignedTransaction.starknetTransactionData;
    txData.signature = formattedSignature;
    unsignedTransaction.starknetTransactionData = txData;
    unsignedTransaction.signedTransaction = unsignedTransaction.toInternalHex();

    serializedTx = unsignedTransaction.toInternalHex();
  }

  // Build return metadata matching WRW requirements
  const feeInfo = {
    fee: 0,
    feeString: maxFee.toString(),
  };
  const coinSpecific = {
    commonKeychain: bitgoKey,
  };
  const parsedTx = {
    inputs: [{ address: senderAddress, value: balance.toString(), valueString: balance.toString() }],
    outputs: [
      { address: params.recoveryDestination, value: amountToSend.toString(), valueString: amountToSend.toString() },
    ],
    spendAmount: amountToSend.toString(),
    type: 'send',
  };

  const buildTxItem = (tx: Transaction, serialized: string, parsed: any) => {
    const item: any = {
      unsignedTx: {
        serializedTx: serialized,
        scanIndex: index,
        coin: coin.getChain(),
        signableHex: tx.signableHex,
        derivationPath,
        parsedTx: parsed,
        feeInfo,
        coinSpecific,
      },
      signatureShares: [],
    };
    if (!isUnsignedSweep) {
      item.unsignedTx.broadcastFormat = JSON.parse(tx.toBroadcastFormat());
    }
    return item;
  };

  const transactions: any[] = [];
  if (deployTxHex && deployTx) {
    transactions.push(
      buildTxItem(deployTx, deployTxHex, {
        inputs: [],
        outputs: [],
        spendAmount: '0',
        type: 'deploy_account',
      })
    );
  }
  transactions.push(buildTxItem(unsignedTransaction, serializedTx, parsedTx));

  return {
    txRequests: [
      {
        transactions,
        walletCoin: coin.getChain(),
      },
    ],
  };
}
