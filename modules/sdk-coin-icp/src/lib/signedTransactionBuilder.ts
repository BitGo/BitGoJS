import {
  CborUnsignedTransaction,
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
    const unsignedTransaction = utils.cborDecode(
      utils.blobFromHex(combineRequest.unsigned_transaction)
    ) as CborUnsignedTransaction;
    assert(combineRequest.signatures.length === unsignedTransaction.ingress_expiries.length * 2);
    assert(unsignedTransaction.updates.length === 1);
    const envelopes = this.getEnvelopes(unsignedTransaction, signatureMap);
    const envelopRequests = { requests: envelopes };
    const signedTransaction = utils.cborEncode(envelopRequests);
    return signedTransaction;
  }

  getEnvelopes(
    unsignedTransaction: CborUnsignedTransaction,
    signatureMap: Map<string, Signatures>
  ): [string, RequestEnvelope[]][] {
    const envelopes: [string, RequestEnvelope[]][] = [];
    for (const [reqType, update] of unsignedTransaction.updates) {
      const requestEnvelopes: RequestEnvelope[] = [];
      for (const ingressExpiry of unsignedTransaction.ingress_expiries) {
        update.ingress_expiry = ingressExpiry;

        const readState = utils.makeReadStateFromUpdate(update);
        const transactionSignature = utils.getTransactionSignature(signatureMap, update);
        if (!transactionSignature) {
          throw new Error('Transaction signature is undefined');
        }

        const readStateSignature = utils.getReadStateSignature(signatureMap, readState);
        if (!readStateSignature) {
          throw new Error('read state signature is undefined');
        }

        const pk_der = utils.getPublicKeyInDERFormat(transactionSignature.public_key.hex_bytes);
        const updateEnvelope: UpdateEnvelope = {
          content: { request_type: RequestType.CALL, ...update },
          sender_pubkey: pk_der,
          sender_sig: utils.blobFromHex(transactionSignature.hex_bytes),
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
