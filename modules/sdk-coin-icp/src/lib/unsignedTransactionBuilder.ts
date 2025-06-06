import {
  IcpTransaction,
  SendArgs,
  HttpCanisterUpdate,
  SigningPayload,
  PayloadsData,
  SignatureType,
  OperationType,
  MethodName,
  MAX_INGRESS_TTL,
  PERMITTED_DRIFT,
  LEDGER_CANISTER_ID,
} from './iface';
import utils from './utils';

export class UnsignedTransactionBuilder {
  private _icpTransactionPayload: IcpTransaction;
  constructor(icpTransactionPayload: IcpTransaction) {
    this._icpTransactionPayload = icpTransactionPayload;
  }

  async getUnsignedTransaction(): Promise<PayloadsData> {
    // interval value can be altered here to change the count of ingressExpiries which eventually changes the number of interval value can be altered here to change the count of ingressExpiries which eventually changes the number of payloads that needs to be signed
    const interval =
      Number(this._icpTransactionPayload.metadata.ingress_end) -
      Number(this._icpTransactionPayload.metadata.ingress_start); // 300s in nanoseconds
    const ingressExpiries = this.getIngressExpiries(
      this._icpTransactionPayload.metadata.ingress_start!,
      this._icpTransactionPayload.metadata.ingress_end!,
      interval
    );
    const sendArgs = this.getSendArgs(
      this._icpTransactionPayload.metadata.memo,
      this._icpTransactionPayload.metadata.created_at_time,
      this._icpTransactionPayload.operations[1].amount.value,
      this._icpTransactionPayload.operations[2].amount.value,
      this._icpTransactionPayload.operations[1].account.address
    );
    const update = await this.getUpdate(sendArgs, this._icpTransactionPayload.public_keys[0].hex_bytes);
    const updates: [string, HttpCanisterUpdate][] = [];
    updates.push([OperationType.TRANSACTION, update]);
    const txn = { updates: updates, ingress_expiries: ingressExpiries };
    const unsignedTransaction = utils.cborEncode(txn);
    const payloads: SigningPayload[] = [];
    this.getPayloads(payloads, ingressExpiries, this._icpTransactionPayload.operations[0].account.address, update);
    const payloadsData = {
      payloads: payloads,
      unsigned_transaction: unsignedTransaction,
    };
    return payloadsData;
  }

  getPayloads(
    payloads: SigningPayload[],
    ingressExpiries: bigint[],
    accountAddress: string,
    update: HttpCanisterUpdate
  ): SigningPayload[] {
    if (ingressExpiries.length != 1) {
      throw new Error('ingress expiry can have only one entry');
    }
    const ingressExpiry = ingressExpiries[0];
    const clonedUpdate: HttpCanisterUpdate = {
      canister_id: Buffer.from(update.canister_id),
      method_name: update.method_name,
      arg: update.arg,
      sender: update.sender,
      ingress_expiry: ingressExpiry,
    };

    const representationIndependentHash = utils.HttpCanisterUpdateRepresentationIndependentHash(clonedUpdate);
    const transactionPayload: SigningPayload = {
      hex_bytes: utils.blobToHex(utils.makeSignatureData(representationIndependentHash)),
      account_identifier: { address: accountAddress },
      signature_type: SignatureType.ECDSA,
    };
    payloads.push(transactionPayload);
    return payloads;
  }

  getIngressExpiries(ingressStartTime: number | BigInt, ingressEndTime: number | BigInt, interval: number): bigint[] {
    const ingressExpiries: bigint[] = [];

    for (let now = Number(ingressStartTime); now < Number(ingressEndTime); now += interval) {
      const ingressExpiry = BigInt(now + (MAX_INGRESS_TTL - PERMITTED_DRIFT));
      ingressExpiries.push(ingressExpiry);
    }

    return ingressExpiries;
  }

  getSendArgs(memo: number | BigInt, created_at_time: number, amount: string, fee: string, receiver: string): SendArgs {
    const sendArgs: SendArgs = {
      payment: { receiverGets: { e8s: Number(amount) } },
      maxFee: { e8s: -Number(fee) },
      to: { hash: Buffer.from(receiver, 'hex') },
      createdAtTime: { timestampNanos: Number(created_at_time) },
      memo: { memo: memo },
    };

    return sendArgs;
  }

  async getUpdate(sendArgs: SendArgs, publicKeyHex: string): Promise<HttpCanisterUpdate> {
    const principalId = utils.getPrincipalIdFromPublicKey(publicKeyHex).toUint8Array();
    const senderBlob = Buffer.from(principalId);
    const canisterIdBuffer = Buffer.from(LEDGER_CANISTER_ID);
    const args = await utils.toArg(sendArgs);
    const update: HttpCanisterUpdate = {
      canister_id: canisterIdBuffer,
      method_name: MethodName.SEND_PB,
      arg: args,
      sender: senderBlob,
      ingress_expiry: 0n,
    };
    return update;
  }
}
