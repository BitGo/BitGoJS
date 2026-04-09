import {
  CborUnsignedTransaction,
  RequestType,
  Signatures,
  UpdateEnvelope,
  RequestEnvelope,
  HttpCanisterUpdate,
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
    // at present we expect only one request type and one signature
    assert(combineRequest.signatures.length === 1);
    assert(unsignedTransaction.updates.length === 1);
    const envelopes = this.getEnvelopes(unsignedTransaction, signatureMap);
    const requestEnvelopeArray = envelopes[0] as [RequestEnvelope[]];
    const requestEnvelopes = requestEnvelopeArray[0] as RequestEnvelope[];
    assert(requestEnvelopes.length === 1);
    const requestEnvelope = requestEnvelopes[0] as RequestEnvelope;
    const signedTransaction = utils.cborEncode(requestEnvelope.update as UpdateEnvelope);
    return signedTransaction;
  }

  getEnvelopes(
    unsignedTransaction: CborUnsignedTransaction,
    signatureMap: Map<string, Signatures>
  ): [RequestEnvelope[]][] {
    const envelopes: [RequestEnvelope[]][] = [];
    for (const [, update] of unsignedTransaction.updates as unknown as [string, HttpCanisterUpdate][]) {
      const requestEnvelopes: RequestEnvelope[] = [];
      if (unsignedTransaction.ingress_expiries.length != 1) {
        throw new Error('ingress expiry can have only one entry');
      }
      const ingressExpiry = unsignedTransaction.ingress_expiries[0];
      update.ingress_expiry = ingressExpiry;

      const transactionSignature = utils.getTransactionSignature(signatureMap, update);
      if (!transactionSignature) {
        throw new Error('Transaction signature is invalid');
      }

      const pk_der = utils.getPublicKeyInDERFormat(transactionSignature.public_key.hex_bytes);
      const updateEnvelope: UpdateEnvelope = {
        content: { request_type: RequestType.CALL, ...update },
        sender_pubkey: pk_der,
        sender_sig: utils.blobFromHex(transactionSignature.hex_bytes),
      };

      requestEnvelopes.push({
        update: updateEnvelope,
      });

      envelopes.push([requestEnvelopes]);
    }
    return envelopes;
  }
}
