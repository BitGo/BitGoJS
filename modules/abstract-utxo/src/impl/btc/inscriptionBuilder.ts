import assert from 'assert';

import {
  BaseCoin,
  HalfSignedUtxoTransaction,
  IInscriptionBuilder,
  IWallet,
  KeyIndices,
  PrebuildTransactionResult,
  PreparedInscriptionRevealData,
  SubmitTransactionResponse,
  Triple,
  xprvToRawPrv,
} from '@bitgo/sdk-core';
import { bip32 } from '@bitgo/secp256k1';
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
  WalletUnspent,
  type TapLeafScript,
} from '@bitgo/utxo-ord';
import { fixedScriptWallet } from '@bitgo/wasm-utxo';

import { AbstractUtxoCoin } from '../../abstractUtxoCoin';
import { fetchKeychains } from '../../keychains';

/** Key identifier for signing */
type SignerKey = 'user' | 'backup' | 'bitgo';

/** Unspent from wallet API (value may be number or bigint) */
type WalletUnspentLike = {
  id: string;
  value: number | bigint;
  chain: number;
  index: number;
};

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

    const userKey = bip32.fromBase58(user.pub);
    const { key: derivedKey } = BaseCoin.deriveKeyWithSeedBip32(userKey, inscriptionData.toString());

    const result = inscriptions.createInscriptionRevealData(
      derivedKey.publicKey,
      contentType,
      inscriptionData,
      this.coin.name
    );

    // Convert TapLeafScript to utxolib format for backwards compatibility
    return {
      address: result.address,
      revealTransactionVSize: result.revealTransactionVSize,
      tapLeafScript: {
        controlBlock: Buffer.from(result.tapLeafScript.controlBlock),
        script: Buffer.from(result.tapLeafScript.script),
        leafVersion: result.tapLeafScript.leafVersion,
      },
    };
  }

  private async prepareTransferWithExtraInputs(
    satPoint: SatPoint,
    feeRateSatKB: number,
    {
      signer,
      cosigner,
      inscriptionConstraints,
      txFormat,
    }: {
      signer: SignerKey;
      cosigner: SignerKey;
      inscriptionConstraints: {
        minChangeOutput?: bigint;
        minInscriptionOutput?: bigint;
        maxInscriptionOutput?: bigint;
      };
      txFormat?: 'psbt' | 'legacy';
    },
    walletXpubs: Triple<string>,
    outputs: InscriptionOutputs,
    inscriptionUnspents: WalletUnspent[],
    supplementaryUnspentsMinValue: number
  ): Promise<PrebuildTransactionResult> {
    let supplementaryUnspents: WalletUnspent[] = [];
    if (supplementaryUnspentsMinValue > 0) {
      const response = await this.wallet.unspents({
        minValue: supplementaryUnspentsMinValue,
      });
      // Filter out the inscription unspent from the supplementary unspents
      supplementaryUnspents = response.unspents
        .filter((unspent: { id: string }) => unspent.id !== inscriptionUnspents[0].id)
        .slice(0, MAX_UNSPENTS_FOR_OUTPUT_LAYOUT - 1)
        .map(
          (unspent: WalletUnspentLike): WalletUnspent => ({
            id: unspent.id,
            value: BigInt(unspent.value),
            chain: unspent.chain,
            index: unspent.index,
          })
        );
    }

    const psbt = createPsbtForSingleInscriptionPassingTransaction(
      this.coin.name,
      {
        walletKeys: walletXpubs,
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
      txHex: Buffer.from(psbt.serialize()).toString('hex'),
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
      txFormat = 'psbt',
    }: {
      signer?: SignerKey;
      cosigner?: SignerKey;
      inscriptionConstraints?: {
        minChangeOutput?: bigint;
        minInscriptionOutput?: bigint;
        maxInscriptionOutput?: bigint;
      };
      changeAddressType?: 'p2sh' | 'p2shP2wsh' | 'p2wsh' | 'p2tr' | 'p2trMusig2';
      txFormat?: 'psbt' | 'legacy';
    }
  ): Promise<PrebuildTransactionResult> {
    assert(isSatPoint(satPoint));

    const keychains = await fetchKeychains(this.coin, this.wallet);
    const walletXpubs: Triple<string> = [keychains.user.pub, keychains.backup.pub, keychains.bitgo.pub];
    const parsedSatPoint = parseSatPoint(satPoint);
    const transaction = await this.wallet.getTransaction({ txHash: parsedSatPoint.txid });
    const output = transaction.outputs[parsedSatPoint.vout];
    const unspents: WalletUnspent[] = [
      {
        id: `${parsedSatPoint.txid}:${parsedSatPoint.vout}`,
        value: BigInt(output.value),
        chain: output.chain,
        index: output.index,
      },
    ];

    const changeChain = fixedScriptWallet.ChainCode.value(changeAddressType, 'internal');

    const changeAddress = await this.wallet.createAddress({
      chain: changeChain,
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
          { signer, cosigner, inscriptionConstraints, txFormat },
          walletXpubs,
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
    tapLeafScript: TapLeafScript,
    commitAddress: string,
    unsignedCommitTx: Buffer,
    commitTransactionUnspents: WalletUnspentLike[],
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

    const fullySignedRevealTransaction = inscriptions.signRevealTransaction(
      Buffer.from(prv, 'hex'),
      tapLeafScript,
      commitAddress,
      recipientAddress,
      Buffer.from(halfSignedCommitTransaction.txHex, 'hex'),
      this.coin.name
    );

    return this.wallet.submitTransaction({
      halfSigned: {
        txHex: halfSignedCommitTransaction.txHex,
        signedChildPsbt: Buffer.from(fullySignedRevealTransaction).toString('hex'),
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
