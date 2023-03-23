import * as utxolib from '@bitgo/utxo-lib';
import { PrebuildTransactionResult } from '../wallet';

export interface SubmitTransactionResponse {
  transfer: Transfer;
  txid: string;
  tx: string;
  status: string;
}

interface Entry {
  address: string;
  wallet: string;
  value: number;
  valueString: string;
  isChange?: boolean;
  isPayGo?: boolean;
}

interface Transfer {
  entries: Entry[];
  id: string;
  coin: string;
  wallet: string;
  enterprise: string;
  txid: string;
  height: number;
  heightId: string;
  type: string;
  value: number;
  valueString: string;
  baseValue: number;
  baseValueString: string;
  feeString: string;
  payGoFee: number;
  payGoFeeString: string;
  state: string;
  vSize: number;
}

export type PreparedInscriptionRevealData = {
  address: string;
  revealTransactionVSize: number;
  tapLeafScript: utxolib.bitgo.TapLeafScript;
};

export interface IInscriptionBuilder {
  prepareReveal(inscriptionData: Buffer, contentType: string): Promise<PreparedInscriptionRevealData>;

  prepareTransfer(
    satPoint: string,
    recipient: string,
    feeRateSatKB: number,
    {
      signer,
      cosigner,
      inscriptionConstraints,
      changeAddressType,
    }: {
      signer: utxolib.bitgo.KeyName;
      cosigner: utxolib.bitgo.KeyName;
      inscriptionConstraints: {
        minChangeOutput?: bigint;
        minInscriptionOutput?: bigint;
        maxInscriptionOutput?: bigint;
      };
      changeAddressType: utxolib.bitgo.outputScripts.ScriptType2Of3;
    }
  ): Promise<PrebuildTransactionResult>;

  // same response as wallet.submitTransaction`
  signAndSendReveal(
    walletPassphrase: string,
    tapLeafScript: utxolib.bitgo.TapLeafScript,
    commitAddress: string,
    unsignedCommitTx: Buffer,
    commitTransactionUnspents: utxolib.bitgo.WalletUnspent[],
    recipientAddress: string,
    inscriptionData: Buffer
  ): Promise<SubmitTransactionResponse>;

  signAndSendTransfer(
    walletPassphrase: string,
    txPrebuild: PrebuildTransactionResult
  ): Promise<SubmitTransactionResponse>;
}
