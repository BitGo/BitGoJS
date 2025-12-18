import * as utxolib from '@bitgo/utxo-lib';
import { Dimensions } from '@bitgo/unspents';

type RootWalletKeys = utxolib.bitgo.RootWalletKeys;
type WalletUnspent<TNumber extends number | bigint> = utxolib.bitgo.WalletUnspent<TNumber>;

class InsufficientFundsError extends Error {
  constructor(
    public totalInputAmount: bigint,
    public approximateFee: bigint,
    public krsFee: bigint,
    public recoveryAmount: bigint
  ) {
    super(
      `This wallet's balance is too low to pay the fees specified by the KRS provider.` +
        `Existing balance on wallet: ${totalInputAmount.toString()}. ` +
        `Estimated network fee for the recovery transaction: ${approximateFee.toString()}` +
        `KRS fee to pay: ${krsFee.toString()}. ` +
        `After deducting fees, your total recoverable balance is ${recoveryAmount.toString()}`
    );
  }
}

export function createBackupKeyRecoveryPsbt(
  network: utxolib.Network,
  rootWalletKeys: RootWalletKeys,
  unspents: WalletUnspent<bigint>[],
  {
    feeRateSatVB,
    recoveryDestination,
    keyRecoveryServiceFee,
    keyRecoveryServiceFeeAddress,
  }: {
    feeRateSatVB: number;
    recoveryDestination: string;
    keyRecoveryServiceFee: bigint;
    keyRecoveryServiceFeeAddress: string | undefined;
  }
): utxolib.bitgo.UtxoPsbt {
  if (keyRecoveryServiceFee > 0 && !keyRecoveryServiceFeeAddress) {
    throw new Error('keyRecoveryServiceFeeAddress is required when keyRecoveryServiceFee is provided');
  }

  const psbt = utxolib.bitgo.createPsbtForNetwork({ network });
  utxolib.bitgo.addXpubsToPsbt(psbt, rootWalletKeys);
  unspents.forEach((unspent) => {
    utxolib.bitgo.addWalletUnspentToPsbt(psbt, unspent, rootWalletKeys, 'user', 'backup');
  });

  let dimensions = Dimensions.fromPsbt(psbt).plus(
    Dimensions.fromOutput({ script: utxolib.address.toOutputScript(recoveryDestination, network) })
  );

  if (keyRecoveryServiceFeeAddress) {
    dimensions = dimensions.plus(
      Dimensions.fromOutput({
        script: utxolib.address.toOutputScript(keyRecoveryServiceFeeAddress, network),
      })
    );
  }

  const approximateFee = BigInt(dimensions.getVSize() * feeRateSatVB);

  const totalInputAmount = utxolib.bitgo.unspentSum(unspents, 'bigint');

  const recoveryAmount = totalInputAmount - approximateFee - keyRecoveryServiceFee;

  // FIXME(BTC-2650): we should check for dust limit here instead
  if (recoveryAmount < BigInt(0)) {
    throw new InsufficientFundsError(totalInputAmount, approximateFee, keyRecoveryServiceFee, recoveryAmount);
  }

  psbt.addOutput({ script: utxolib.address.toOutputScript(recoveryDestination, network), value: recoveryAmount });

  if (keyRecoveryServiceFeeAddress) {
    psbt.addOutput({
      script: utxolib.address.toOutputScript(keyRecoveryServiceFeeAddress, network),
      value: keyRecoveryServiceFee,
    });
  }

  return psbt;
}

export function getRecoveryAmount(psbt: utxolib.bitgo.UtxoPsbt, address: string): bigint {
  const recoveryOutputScript = utxolib.address.toOutputScript(address, psbt.network);
  const output = psbt.txOutputs.find((o) => o.script.equals(recoveryOutputScript));
  if (!output) {
    throw new Error(`Recovery destination output not found in PSBT: ${address}`);
  }
  return output.value;
}
