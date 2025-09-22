import assert from 'assert';
import { Secp256k1, Transaction as VetTransaction } from '@vechain/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo-beta/statics';
import { InvalidTransactionError, TransactionType } from '@bitgo-beta/sdk-core';
import utils from '../utils';
import { VetTransactionData } from '../iface';
import { Transaction } from './transaction';

export class NFTTransaction extends Transaction {
  private _nftCollectionId: string;
  private _tokenId: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._type = TransactionType.SendNFT;
  }

  get nftCollectionId(): string {
    return this._nftCollectionId;
  }

  set nftCollectionId(nftCollectionId: string) {
    this._nftCollectionId = nftCollectionId;
  }

  get tokenId(): string {
    return this._tokenId;
  }

  set tokenId(tokenId: string) {
    this._tokenId = tokenId;
  }

  buildClauses(): void {
    if (!this.nftCollectionId) {
      throw new Error('NFT collection id is not set');
    }

    if (!this.sender) {
      throw new Error('Sender address is not set');
    }

    if (!this.tokenId) {
      throw new Error('Token id is not set');
    }

    this.clauses = this.recipients.map((recipient) => {
      const data = utils.getTransferNFTData(this.sender, recipient.address, this.tokenId);
      return {
        to: this.nftCollectionId,
        value: '0x0',
        data,
      };
    });
  }

  toJson(): VetTransactionData {
    const json: VetTransactionData = {
      id: this.id,
      chainTag: this.chainTag,
      blockRef: this.blockRef,
      expiration: this.expiration,
      recipients: this.recipients,
      gasPriceCoef: this.gasPriceCoef,
      gas: this.gas,
      dependsOn: this.dependsOn,
      nonce: this.nonce,
      sender: this.sender,
      feePayer: this.feePayerAddress,
      nftCollectionId: this.nftCollectionId,
      tokenId: this.tokenId,
    };

    return json;
  }

  fromDeserializedSignedTransaction(signedTx: VetTransaction): void {
    try {
      if (!signedTx || !signedTx.body) {
        throw new InvalidTransactionError('Invalid transaction: missing transaction body');
      }

      // Store the raw transaction
      this.rawTransaction = signedTx;

      // Set transaction body properties
      const body = signedTx.body;
      this.chainTag = body.chainTag;
      this.blockRef = body.blockRef;
      this.expiration = body.expiration;
      this.clauses = body.clauses;
      this.gasPriceCoef = typeof body.gasPriceCoef === 'number' ? body.gasPriceCoef : 128;
      this.gas = Number(body.gas);
      this.dependsOn = body.dependsOn;
      this.nonce = String(body.nonce);
      // Set recipients from clauses
      assert(body.clauses[0].to, 'nft collection id(contract address) address not found in the clauses');
      assert(body.clauses.length === 1, 'NFT transaction should have exactly one clause');
      this.nftCollectionId = body.clauses[0].to;
      const decodedData = utils.decodeTransferNFTData(body.clauses[0].data);
      this.recipients = decodedData.recipients;
      this.tokenId = decodedData.tokenId;
      this.sender = decodedData.sender;
      this.loadInputsAndOutputs();

      // Set signatures if present
      if (signedTx.signature) {
        // First signature is sender's signature
        this.senderSignature = Buffer.from(signedTx.signature.slice(0, Secp256k1.SIGNATURE_LENGTH));

        // If there's additional signature data, it's the fee payer's signature
        if (signedTx.signature.length > Secp256k1.SIGNATURE_LENGTH) {
          this.feePayerSignature = Buffer.from(signedTx.signature.slice(Secp256k1.SIGNATURE_LENGTH));
        }
      }
    } catch (e) {
      throw new InvalidTransactionError(`Failed to deserialize transaction: ${e.message}`);
    }
  }
}
