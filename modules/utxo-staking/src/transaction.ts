import * as utxolib from '@bitgo/utxo-lib';
import { Dimensions } from '@bitgo/unspents';
import * as bitcoinjslib from 'bitcoinjs-lib';

bitcoinjslib.initEccLib(utxolib.ecc);

/**
 * Build a staking transaction for a wallet that assumes 2-of-3 multisig for the inputs
 *
 * Given the inputs and the staking outputs, we will create the PSBT with the desired fee rate.
 * We always add the change address as the last output.
 *
 * @param rootWalletKeys
 * @param unspents
 * @param createStakingOutputs
 * @param changeAddressInfo
 * @param feeRateSatKB
 * @param network
 */
export function buildFixedWalletStakingPsbt({
  rootWalletKeys,
  unspents,
  outputs,
  changeAddressInfo,
  feeRateSatKB,
  network,
  skipNonWitnessUtxo,
  dustAmount = BigInt(0),
}: {
  rootWalletKeys: utxolib.bitgo.RootWalletKeys;
  unspents: utxolib.bitgo.WalletUnspent<bigint>[];
  outputs: {
    script: Buffer;
    value: bigint;
  }[];
  changeAddressInfo: {
    chain: utxolib.bitgo.ChainCode;
    index: number;
    address: string;
  };
  feeRateSatKB: number;
  network: utxolib.Network;
  skipNonWitnessUtxo?: boolean;
  dustAmount?: bigint;
}): utxolib.bitgo.UtxoPsbt {
  if (feeRateSatKB < 1000) {
    throw new Error('Fee rate must be at least 1 sat/vbyte');
  }
  if (unspents.length === 0 || outputs.length === 0) {
    throw new Error('Must have at least one input and one output');
  }

  // Check the change address info
  const changeScript = utxolib.bitgo.outputScripts.createOutputScript2of3(
    rootWalletKeys.deriveForChainAndIndex(changeAddressInfo.chain, changeAddressInfo.index).publicKeys,
    utxolib.bitgo.scriptTypeForChain(changeAddressInfo.chain),
    network
  ).scriptPubKey;
  if (!changeScript.equals(utxolib.addressFormat.toOutputScriptTryFormats(changeAddressInfo.address, network))) {
    throw new Error('Change address info does not match the derived change script');
  }

  const psbt = utxolib.bitgo.createPsbtForNetwork({ network });
  utxolib.bitgo.addXpubsToPsbt(psbt, rootWalletKeys);

  const inputAmount = unspents.reduce((sum, unspent) => sum + unspent.value, BigInt(0));
  const outputAmount = outputs.reduce((sum, output) => sum + output.value, BigInt(0));

  unspents.forEach((unspent) =>
    utxolib.bitgo.addWalletUnspentToPsbt(psbt, unspent, rootWalletKeys, 'user', 'bitgo', {
      isReplaceableByFee: true,
      skipNonWitnessUtxo,
    })
  );
  outputs.forEach((output) => psbt.addOutput(output));

  const fee = Math.ceil(
    (Dimensions.fromPsbt(psbt)
      .plus(Dimensions.fromOutput({ script: changeScript }))
      .getVSize() *
      feeRateSatKB) /
      1000
  );

  const changeAmount = inputAmount - (outputAmount + BigInt(fee));
  if (changeAmount < BigInt(0)) {
    throw new Error(
      `Input amount ${inputAmount.toString()} cannot cover the staking amount ${outputAmount} and  the fee: ${fee}`
    );
  }

  if (changeAmount > dustAmount) {
    utxolib.bitgo.addWalletOutputToPsbt(
      psbt,
      rootWalletKeys,
      changeAddressInfo.chain,
      changeAddressInfo.index,
      changeAmount
    );
  }

  return psbt;
}
