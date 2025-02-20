import { IcpTransaction, SendArgs, HttpCanisterUpdate, SigningPayload, PayloadsData } from './iface';
import protobuf from 'protobufjs';
import utils from './utils';

const PROTOPATH = './message.proto';
const MAX_INGRESS_TTL = 5 * 60 * 1000_000_000; // 5 minutes in nanoseconds
const PERMITTED_DRIFT = 60 * 1000_000_000; // 60 seconds in nanoseconds
const LEDGER_CANISTER_ID = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 2, 1, 1]);

export class UnsignedTransactionBuilder {
  private _icpTransactionPayload: IcpTransaction;
  constructor(icpTransactionPayload: IcpTransaction) {
    this._icpTransactionPayload = icpTransactionPayload;
  }

  async getUnsignedTransaction(): Promise<PayloadsData> {
    const interval = MAX_INGRESS_TTL - PERMITTED_DRIFT - 120 * 1000_000_000; // 120 seconds in milliseconds
    const ingressExpiries = this.getIngressExpiries(
      this._icpTransactionPayload.metadata.ingress_start,
      this._icpTransactionPayload.metadata.ingress_end,
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
    const updates: [() => string, HttpCanisterUpdate][] = [];
    updates.push([utils.getTransactionType, update]);
    const txn = { updates, ingressExpiries };
    const unsignedTransaction = utils.cborEncode(txn);
    const payloads: SigningPayload[] = [];
    this.getPayloads(
      payloads,
      ingressExpiries,
      this._icpTransactionPayload.operations[0].account.address,
      update,
      utils.getSignatureType()
    );
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
    update: HttpCanisterUpdate,
    signatureType: string
  ): SigningPayload[] {
    for (const ingressExpiry of ingressExpiries) {
      const clonedUpdate: HttpCanisterUpdate = {
        canister_id: update.canister_id,
        method_name: update.method_name,
        arg: update.arg,
        sender: update.sender,
        ingress_expiry: ingressExpiry,
      };

      const representationIndependentHash = utils.HttpCanisterUpdateRepresentationIndependentHash(clonedUpdate);
      const transactionPayload: SigningPayload = {
        hex_bytes: utils.blobToHex(utils.makeSignatureData(representationIndependentHash)),
        account_identifier: { address: accountAddress },
        signature_type: signatureType,
      };
      payloads.push(transactionPayload);

      const readState = utils.makeReadStateFromUpdate(clonedUpdate);
      const readStateMessageId = utils.HttpReadStateRepresentationIndependentHash(readState);
      const readStatePayload: SigningPayload = {
        hex_bytes: utils.blobToHex(utils.makeSignatureData(readStateMessageId)),
        account_identifier: { address: accountAddress },
        signature_type: signatureType,
      };
      payloads.push(readStatePayload);
    }

    return payloads;
  }

  getIngressExpiries(ingressStartTime: number, ingressEndTime: number, interval: number): bigint[] {
    const ingressExpiries: bigint[] = [];

    for (let now = ingressStartTime; now < ingressEndTime; now += interval) {
      const ingressExpiry = BigInt(now + (MAX_INGRESS_TTL - PERMITTED_DRIFT));
      ingressExpiries.push(ingressExpiry);
    }

    return ingressExpiries;
  }

  getSendArgs(memo: number, created_at_time: number, amount: string, fee: string, receiver: string): SendArgs {
    const sendArgs: SendArgs = {
      memo: { memo: memo },
      payment: { receiverGets: { e8s: Number(amount) } },
      maxFee: { e8s: Number(fee) },
      to: { hash: Buffer.from(receiver, 'hex') },
      createdAtTime: { timestampNanos: Number(created_at_time) },
    };
    return sendArgs;
  }

  async toArg(args: SendArgs): Promise<Uint8Array> {
    const root = await protobuf.load(PROTOPATH);
    const SendRequestMessage = root.lookupType('SendRequest');
    const errMsg = SendRequestMessage.verify(args);
    if (errMsg) throw new Error(errMsg);

    const message = SendRequestMessage.create(args);
    return SendRequestMessage.encode(message).finish();
  }

  async getUpdate(sendArgs: SendArgs, publicKeyHex: string): Promise<HttpCanisterUpdate> {
    const principalId = utils.getPrincipalIdFromPublicKey(publicKeyHex).toUint8Array();
    const senderBlob = principalId;
    const canisterIdBuffer = Buffer.from(LEDGER_CANISTER_ID);
    const args = await this.toArg(sendArgs);
    const update: HttpCanisterUpdate = {
      canister_id: canisterIdBuffer,
      method_name: 'send_pb',
      arg: args,
      sender: senderBlob,
      ingress_expiry: BigInt(0),
    };
    return update;
  }
}
