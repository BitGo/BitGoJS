import { AbstractUtxoCoin, getWalletKeys, RootWalletKeys } from '@bitgo/abstract-utxo';
import {
  HalfSignedUtxoTransaction,
  IInscriptionBuilder,
  IWallet,
  KeyIndices,
  PrebuildTransactionResult,
  PreparedInscriptionRevealData,
  SubmitTransactionResponse,
  xprvToRawPrv,
  xpubToCompressedPub,
} from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';
import {
  createPsbtForSingleInscriptionPassingTransaction,
  DefaultInscriptionConstraints,
  InscriptionOutputs,
  inscriptions,
  parseSatPoint,
  isSatPoint,
  ErrorNoLayout,
  findOutputLayoutForWalletUnspents,
  MAX_UNSPENTS_FOR_OUTPUT_LAYOUT,
  SatPoint,
} from '@bitgo/utxo-ord';
import assert from 'assert';

const SUPPLEMENTARY_UNSPENTS_MIN_VALUE_SATS = [0, 20_000, 200_000];

export class InscriptionBuilder implements IInscriptionBuilder {
  private readonly wallet: IWallet;
  private readonly coin: AbstractUtxoCoin;

  constructor(wallet: IWallet, coin: AbstractUtxoCoin) {
    this.wallet = wallet;
    this.coin = coin;
  }

  async prepareReveal(inscriptionData: Buffer, contentType: string): Promise<PreparedInscriptionRevealData> {
    const user = await this.wallet.baseCoin.keychains().get({ id: this.wallet.keyIds()[KeyIndices.USER] });
    assert(user.pub);

    const derived = this.coin.deriveKeyWithSeed({ key: user.pub, seed: inscriptionData.toString() });
    const compressedPublicKey = xpubToCompressedPub(derived.key);
    const xOnlyPublicKey = utxolib.bitgo.outputScripts.toXOnlyPublicKey(Buffer.from(compressedPublicKey, 'hex'));

    return inscriptions.createInscriptionRevealData(xOnlyPublicKey, contentType, inscriptionData, this.coin.network);
  }

  private async prepareTransferWithExtraInputs(
    satPoint: SatPoint,
    feeRateSatKB: number,
    {
      signer,
      cosigner,
      inscriptionConstraints,
    }: {
      signer: utxolib.bitgo.KeyName;
      cosigner: utxolib.bitgo.KeyName;
      inscriptionConstraints: {
        minChangeOutput?: bigint;
        minInscriptionOutput?: bigint;
        maxInscriptionOutput?: bigint;
      };
    },
    rootWalletKeys: RootWalletKeys,
    outputs: InscriptionOutputs,
    inscriptionUnspents: utxolib.bitgo.WalletUnspent<bigint>[],
    supplementaryUnspentsMinValue: number
  ): Promise<PrebuildTransactionResult> {
    let supplementaryUnspents: utxolib.bitgo.WalletUnspent<bigint>[] = [];
    if (supplementaryUnspentsMinValue > 0) {
      const response = await this.wallet.unspents({
        minValue: supplementaryUnspentsMinValue,
      });
      // Filter out the inscription unspent from the supplementary unspents
      supplementaryUnspents = response.unspents
        .filter((unspent) => unspent.id !== inscriptionUnspents[0].id)
        .slice(0, MAX_UNSPENTS_FOR_OUTPUT_LAYOUT - 1)
        .map((unspent) => {
          unspent.value = BigInt(unspent.value);
          return unspent;
        });
    }
    const psbt = createPsbtForSingleInscriptionPassingTransaction(
      this.coin.network,
      {
        walletKeys: rootWalletKeys,
        signer,
        cosigner,
      },
      inscriptionUnspents,
      satPoint,
      outputs,
      { feeRateSatKB, ...inscriptionConstraints },
      { supplementaryUnspents }
    );
    if (!psbt) {
      throw new Error('Fee too high for the selected unspent with this fee rate');
    }

    const allUnspents = [...inscriptionUnspents, ...supplementaryUnspents];

    // TODO: Remove the call to this function because it's already called inside the createPsbt function above.
    // Create & use a getFee function inside the created PSBT instead, lack of which necessitates a duplicate call here.
    const outputLayout = findOutputLayoutForWalletUnspents(allUnspents, satPoint, outputs, {
      feeRateSatKB,
      ...inscriptionConstraints,
    });
    if (!outputLayout) {
      throw new Error('Fee too high for the selected unspent with this fee rate');
    }
    return {
      walletId: this.wallet.id(),
      txHex: psbt.getUnsignedTx().toHex(),
      txInfo: { unspents: allUnspents },
      feeInfo: { fee: Number(outputLayout.layout.feeOutput), feeString: outputLayout.layout.feeOutput.toString() },
    };
  }

  /**
   * Build a transaction to send an inscription
   * @param satPoint Satpoint you want to send
   * @param recipient Address you want to send to
   * @param feeRateSatKB Fee rate for transaction
   * @param signer first signer of the transaction
   * @param cosigner second signer of the transaction
   * @param inscriptionConstraints.minChangeOutput (optional) the minimum size of the change output
   * @param inscriptionConstraints.minInscriptionOutput (optional) the minimum number of sats of the output containing the inscription
   * @param inscriptionConstraints.maxInscriptionOutput (optional) the maximum number of sats of the output containing the inscription
   * @param changeAddressType Address type of the change address
   */
  async prepareTransfer(
    satPoint: string,
    recipient: string,
    feeRateSatKB: number,
    {
      signer = 'user',
      cosigner = 'bitgo',
      inscriptionConstraints = DefaultInscriptionConstraints,
      changeAddressType = 'p2wsh',
    }: {
      signer?: utxolib.bitgo.KeyName;
      cosigner?: utxolib.bitgo.KeyName;
      inscriptionConstraints?: {
        minChangeOutput?: bigint;
        minInscriptionOutput?: bigint;
        maxInscriptionOutput?: bigint;
      };
      changeAddressType?: utxolib.bitgo.outputScripts.ScriptType2Of3;
    }
  ): Promise<PrebuildTransactionResult> {
    assert(isSatPoint(satPoint));

    const rootWalletKeys = await getWalletKeys(this.coin, this.wallet);
    const parsedSatPoint = parseSatPoint(satPoint);
    const transaction = await this.wallet.getTransaction({ txHash: parsedSatPoint.txid });
    const unspents: utxolib.bitgo.WalletUnspent<bigint>[] = [transaction.outputs[parsedSatPoint.vout]];
    unspents[0].value = BigInt(unspents[0].value);

    const changeAddress = await this.wallet.createAddress({
      chain: utxolib.bitgo.getInternalChainCode(changeAddressType),
    });
    const outputs: InscriptionOutputs = {
      inscriptionRecipient: recipient,
      changeOutputs: [
        { chain: changeAddress.chain, index: changeAddress.index },
        { chain: changeAddress.chain, index: changeAddress.index },
      ],
    };

    for (const supplementaryUnspentsMinValue of SUPPLEMENTARY_UNSPENTS_MIN_VALUE_SATS) {
      try {
        return await this.prepareTransferWithExtraInputs(
          satPoint,
          feeRateSatKB,
          { signer, cosigner, inscriptionConstraints },
          rootWalletKeys,
          outputs,
          unspents,
          supplementaryUnspentsMinValue
        );
      } catch (error) {
        if (!(error instanceof ErrorNoLayout)) {
          throw error; // Propagate error if it's not an ErrorNoLayout
        } // Otherwise continue trying with higher minValue for supplementary unspents
      }
    }

    throw new Error('Fee too high for the selected unspent with this fee rate'); // Exhausted all tries to supplement
  }

  /**
   *
   * @param walletPassphrase
   * @param tapLeafScript
   * @param commitAddress
   * @param unsignedCommitTx
   * @param commitTransactionUnspents
   * @param recipientAddress
   * @param inscriptionData
   */
  async signAndSendReveal(
    walletPassphrase: string,
    tapLeafScript: utxolib.bitgo.TapLeafScript,
    commitAddress: string,
    unsignedCommitTx: Buffer,
    commitTransactionUnspents: utxolib.bitgo.WalletUnspent[],
    recipientAddress: string,
    inscriptionData: Buffer
  ): Promise<SubmitTransactionResponse> {
    const userKeychain = await this.wallet.baseCoin.keychains().get({ id: this.wallet.keyIds()[KeyIndices.USER] });
    const xprv = await this.wallet.getUserPrv({ keychain: userKeychain, walletPassphrase });

    const halfSignedCommitTransaction = (await this.wallet.signTransaction({
      prv: xprv,
      txPrebuild: {
        txHex: unsignedCommitTx.toString('hex'),
        txInfo: { unspents: commitTransactionUnspents },
      },
    })) as HalfSignedUtxoTransaction;

    const derived = this.coin.deriveKeyWithSeed({ key: xprv, seed: inscriptionData.toString() });
    const prv = xprvToRawPrv(derived.key);

    const fullySignedRevealTransaction = await inscriptions.signRevealTransaction(
      Buffer.from(prv, 'hex'),
      tapLeafScript,
      commitAddress,
      recipientAddress,
      Buffer.from(halfSignedCommitTransaction.txHex, 'hex'),
      this.coin.network
    );

    return this.wallet.submitTransaction({
      halfSigned: {
        txHex: halfSignedCommitTransaction.txHex,
        signedChildPsbt: fullySignedRevealTransaction.toHex(),
      },
    });
  }

  /**
   * Sign and send a transaction that transfers an inscription
   * @param walletPassphrase passphrase to unlock your keys
   * @param txPrebuild this is the output of `inscription.prepareTransfer`
   */
  async signAndSendTransfer(
    walletPassphrase: string,
    txPrebuild: PrebuildTransactionResult
  ): Promise<SubmitTransactionResponse> {
    const userKeychain = await this.wallet.baseCoin.keychains().get({ id: this.wallet.keyIds()[KeyIndices.USER] });
    const prv = this.wallet.getUserPrv({ keychain: userKeychain, walletPassphrase });

    const halfSigned = (await this.wallet.signTransaction({ prv, txPrebuild })) as HalfSignedUtxoTransaction;
    return this.wallet.submitTransaction({ halfSigned });
  }
}
