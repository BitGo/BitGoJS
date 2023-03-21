import { AbstractUtxoCoin } from '@bitgo/abstract-utxo';
import {
  HalfSignedUtxoTransaction,
  IInscriptionBuilder,
  IWallet,
  KeyIndices,
  PreparedInscriptionRevealData,
  SubmitTransactionResponse,
  xprvToRawPrv,
} from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';
import { inscriptions } from '@bitgo/utxo-ord';
import assert from 'assert';

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
    const pubkey = Buffer.from(user.pub, 'hex');

    return inscriptions.createInscriptionRevealData(pubkey, contentType, inscriptionData, this.coin.network);
  }

  /**
   *
   * @param walletPassphrase
   * @param tapLeafScript
   * @param commitAddress
   * @param unsignedCommitTx
   * @param commitTransactionUnspents
   * @param recipientAddress
   */
  async signAndSendReveal(
    walletPassphrase: string,
    tapLeafScript: utxolib.bitgo.TapLeafScript,
    commitAddress: string,
    unsignedCommitTx: Buffer,
    commitTransactionUnspents: utxolib.bitgo.WalletUnspent[],
    recipientAddress: string
  ): Promise<SubmitTransactionResponse> {
    const userKeychain = await this.wallet.baseCoin.keychains().get({ id: this.wallet.keyIds()[KeyIndices.USER] });
    const xprv = await this.wallet.getUserPrv({ keychain: userKeychain, walletPassphrase });
    const prv = xprvToRawPrv(xprv);

    const halfSignedCommitTransaction = (await this.wallet.signTransaction({
      prv: xprv,
      txPrebuild: {
        txHex: unsignedCommitTx.toString('hex'),
        txInfo: { unspents: commitTransactionUnspents },
      },
    })) as HalfSignedUtxoTransaction;

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
}
