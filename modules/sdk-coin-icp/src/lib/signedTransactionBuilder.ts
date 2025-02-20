import { PayloadsData, RequestType } from './iface';
import crypto from 'crypto';
import elliptic from 'elliptic';
import utils from './utils';
import assert from 'assert';

const { ec: EC } = elliptic;

export class SignedTransactionBuilder {
  protected _payloadsData: PayloadsData;
  protected _publicKey: string;
  protected _privateKey: string;

  constructor(payloadsData: PayloadsData, senderPublicKey: string, senderPrivateKey: string) {
    this._payloadsData = payloadsData;
    this._publicKey = senderPublicKey;
    this._privateKey = senderPrivateKey;
  }

  getSignatures(): any[] {
    return this._payloadsData.payloads.map((payload) => ({
      signing_payload: payload,
      signature_type: payload.signature_type,
      public_key: {
        hex_bytes: this._publicKey,
        curve_type: utils.getCurveType(),
      },
      hex_bytes: this.signPayload(payload.hex_bytes),
    }));
  }

  signPayload(payloadHex: string): string {
    const ec = new EC('secp256k1');
    const key = ec.keyFromPrivate(this._privateKey);
    const payloadHash = crypto.createHash('sha256').update(Buffer.from(payloadHex, 'hex')).digest('hex');
    const signature = key.sign(payloadHash);
    const r = signature.r.toArray('be', 32);
    const s = signature.s.toArray('be', 32);
    return Buffer.concat([Buffer.from(r), Buffer.from(s)]).toString('hex');
  }

  getSignTransaction(): any {
    const signatures = this.getSignatures();
    const combineRequest = {
      signatures: signatures,
      unsigned_transaction: this._payloadsData.unsigned_transaction,
    };
    const signaturesBySigData = new Map();
    for (const sig of combineRequest.signatures) {
      signaturesBySigData.set(sig.signing_payload.hex_bytes, sig);
    }
    const unsignedTransaction = utils.cborDecode(utils.blobFromHex(combineRequest.unsigned_transaction));
    assert(combineRequest.signatures.length === unsignedTransaction.ingress_expiries.length * 2);
    assert(unsignedTransaction.updates.length === 1);
    const envelopes = this.getEnvelopes(unsignedTransaction, signaturesBySigData);
    const envelopRequests = { requests: envelopes };
    const signedTransaction = utils.blobToHex(Buffer.from(utils.cborEncode(envelopRequests)));
    return signedTransaction;
  }

  getEnvelopes(unsignedTransaction: any, signaturesBySigData: Map<any, any>): any {
    const envelopes: [string, any[]][] = [];
    for (const [reqType, update] of unsignedTransaction.updates) {
      const requestEnvelopes: { update: any; read_state: any }[] = [];
      for (const ingressExpiry of unsignedTransaction.ingress_expiries) {
        update.ingress_expiry = ingressExpiry;

        const readState = utils.makeReadStateFromUpdate(update);

        const transaction_signature = signaturesBySigData.get(
          utils.blobToHex(utils.makeSignatureData(utils.HttpCanisterUpdateId(update)))
        );

        const readStateSignature = signaturesBySigData.get(
          utils.blobToHex(utils.makeSignatureData(utils.HttpReadStateRepresentationIndependentHash(readState)))
        );

        const pk_der = utils.getPublicKeyInDERFormat(transaction_signature.public_key.hex_bytes);
        const envelope = {
          content: Object.assign({ request_type: RequestType.CALL }, update),
          sender_pubkey: pk_der,
          sender_sig: utils.blobFromHex(transaction_signature.hex_bytes),
        };

        const readStateEnvelope = {
          content: Object.assign({ request_type: RequestType.READ_STATE }, readState),
          sender_pubkey: pk_der,
          sender_sig: utils.blobFromHex(readStateSignature.hex_bytes),
        };

        requestEnvelopes.push({
          update: envelope,
          read_state: readStateEnvelope,
        });
      }
      envelopes.push([reqType, requestEnvelopes]);
    }
    return envelopes;
  }
}
