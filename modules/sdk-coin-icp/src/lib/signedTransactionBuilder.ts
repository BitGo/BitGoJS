import {
  cborUnsignedTransaction,
  RequestType,
  Signatures,
  UpdateEnvelope,
  ReadStateEnvelope,
  RequestEnvelope,
} from './iface';
import utils from './utils';
import assert from 'assert';

export class SignedTransactionBuilder {
  protected _unsigned_transaction: string;
  protected _signaturePayload: Signatures[];

  constructor(unsigned_transaction: string, signatures: Signatures[]) {
    this._unsigned_transaction = unsigned_transaction;
    this._signaturePayload = signatures;
  }

  getSignTransaction(): string {
    const combineRequest = {
      signatures: this._signaturePayload,
      unsigned_transaction: this._unsigned_transaction,
    };
    const signatureMap = new Map();
    for (const sig of combineRequest.signatures) {
      signatureMap.set(sig.signing_payload.hex_bytes, sig);
    }
    /*{
    string: SIGNATURE
    }
    */
    const unsignedTransaction = utils.cborDecode(
      utils.blobFromHex(combineRequest.unsigned_transaction)
    ) as cborUnsignedTransaction;
    assert(combineRequest.signatures.length === unsignedTransaction.ingress_expiries.length * 2);
    assert(unsignedTransaction.updates.length === 1);
    const envelopes = this.getEnvelopes(unsignedTransaction, signatureMap);
    const envelopRequests = { requests: envelopes };
    const signedTransaction = utils.blobToHex(Buffer.from(utils.cborEncode(envelopRequests)));
    return signedTransaction;
  }

  getEnvelopes(
    unsignedTransaction: cborUnsignedTransaction,
    signatureMap: Map<string, Signatures>
  ): [string, RequestEnvelope[]][] {
    const envelopes: [string, RequestEnvelope[]][] = [];
    for (const [reqType, update] of unsignedTransaction.updates) {
      const requestEnvelopes: RequestEnvelope[] = [];
      for (const ingressExpiry of unsignedTransaction.ingress_expiries) {
        update.ingress_expiry = ingressExpiry;

        const readState = utils.makeReadStateFromUpdate(update);

        const transaction_signature = signatureMap.get(
          utils.blobToHex(utils.makeSignatureData(utils.generateHttpCanisterUpdateId(update)))
        );
        if (!transaction_signature) {
          throw new Error('Transaction signature is undefined');
        }

        const readStateSignature = signatureMap.get(
          utils.blobToHex(utils.makeSignatureData(utils.HttpReadStateRepresentationIndependentHash(readState)))
        );
        if (!readStateSignature) {
          throw new Error('read state signature is undefined');
        }

        const pk_der = utils.getPublicKeyInDERFormat(transaction_signature.public_key.hex_bytes);
        const updateEnvelope: UpdateEnvelope = {
          content: { request_type: RequestType.CALL, ...update },
          sender_pubkey: pk_der,
          sender_sig: utils.blobFromHex(transaction_signature.hex_bytes),
        };

        const readStateEnvelope: ReadStateEnvelope = {
          content: { request_type: RequestType.READ_STATE, ...readState },
          sender_pubkey: pk_der,
          sender_sig: utils.blobFromHex(readStateSignature.hex_bytes),
        };

        requestEnvelopes.push({
          update: updateEnvelope,
          read_state: readStateEnvelope,
        });
      }
      envelopes.push([reqType, requestEnvelopes]);
    }
    return envelopes;
  }
}
