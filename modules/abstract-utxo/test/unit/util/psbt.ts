import { fixedScriptWallet, type CoinName } from '@bitgo/wasm-utxo';

const { BitGoPsbt, ChainCode } = fixedScriptWallet;

export type PsbtInput = { scriptType: fixedScriptWallet.OutputScriptType; value: bigint };
export type PsbtOutput = { address: string; value: bigint };
export type PsbtOptions = { lockTime?: number; sequence?: number };

/**
 * Construct a test PSBT with the given inputs and outputs.
 * Uses dummy txids (all zeros) for inputs.
 */
export function constructPsbt(
  inputs: PsbtInput[],
  outputs: PsbtOutput[],
  network: CoinName,
  walletKeys: fixedScriptWallet.RootWalletKeys,
  options?: PsbtOptions
): fixedScriptWallet.BitGoPsbt {
  const psbt = BitGoPsbt.createEmpty(network, walletKeys, { lockTime: options?.lockTime });

  inputs.forEach((input, index) => {
    const chain = ChainCode.value(input.scriptType, 'external');
    psbt.addWalletInput(
      { txid: '00'.repeat(32), vout: index, value: input.value, sequence: options?.sequence },
      walletKeys,
      { scriptId: { chain, index }, signPath: { signer: 'user', cosigner: 'bitgo' } }
    );
  });

  outputs.forEach((output) => {
    psbt.addOutput(output.address, output.value);
  });

  return psbt;
}
