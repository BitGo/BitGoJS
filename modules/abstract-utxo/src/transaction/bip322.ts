import { decodeOrElse } from '@bitgo/sdk-core';
import { bip322 } from '@bitgo/utxo-core';
import { bitgo, networks, Network } from '@bitgo/utxo-lib';
import * as t from 'io-ts';

const BIP322MessageInfo = t.type({
  address: t.string,
  message: t.string,
  pubkeys: t.array(t.string),
  scriptType: t.union([
    t.literal('p2sh'),
    t.literal('p2shP2wsh'),
    t.literal('p2wsh'),
    t.literal('p2tr'),
    t.literal('p2trMusig2'),
  ]),
});

export type BIP322MessageInfo = t.TypeOf<typeof BIP322MessageInfo>;

const BIP322MessageBroadcastable = t.type({
  txHex: t.string,
  messageInfo: t.array(BIP322MessageInfo),
});

export type BIP322MessageBroadcastable = t.TypeOf<typeof BIP322MessageBroadcastable>;

export function serializeBIP322BroadcastableMessage(message: BIP322MessageBroadcastable): string {
  return Buffer.from(JSON.stringify(message), 'utf8').toString('hex');
}

export function deserializeBIP322BroadcastableMessage(hex: string): BIP322MessageBroadcastable {
  const json = JSON.parse(Buffer.from(hex, 'hex').toString('utf8'));
  return decodeOrElse(BIP322MessageBroadcastable.name, BIP322MessageBroadcastable, json, (error) => {
    throw new Error(`Failed to decode ${BIP322MessageBroadcastable.name}: ${error}`);
  });
}

export function verifyTransactionFromBroadcastableMessage(
  message: BIP322MessageBroadcastable,
  coinName: string
): boolean {
  let network: Network = networks.bitcoin;
  if (coinName === 'tbtc4') {
    network = networks.bitcoinTestnet4;
  } else if (coinName !== 'btc') {
    throw new Error('Only tbtc4 or btc coinNames are supported.');
  }
  if (bitgo.isPsbt(message.txHex)) {
    const psbt = bitgo.createPsbtFromBuffer(Buffer.from(message.txHex, 'hex'), network);
    try {
      bip322.assertBip322PsbtProof(psbt, message.messageInfo);
      return true;
    } catch (error) {
      return false;
    }
  } else {
    const tx = bitgo.createTransactionFromBuffer(Buffer.from(message.txHex, 'hex'), network, { amountType: 'bigint' });
    try {
      bip322.assertBip322TxProof(tx, message.messageInfo);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export function generateBIP322MessageListAndVerifyFromMessageBroadcastable(
  messageBroadcastables: BIP322MessageBroadcastable[],
  coinName: string
): { address: string; message: string }[] {
  // Map from the address to the message. If there are duplicates of the address, make sure that the
  // message is the same. If there are duplicate addresses and the messages are not the same, throw an error.
  const addressMap = new Map<string, string>();

  messageBroadcastables.forEach((message, index) => {
    if (verifyTransactionFromBroadcastableMessage(message, coinName)) {
      message.messageInfo.forEach((info) => {
        const { address, message: msg } = info;
        if (addressMap.has(address)) {
          if (addressMap.get(address) !== msg) {
            throw new Error(`Duplicate address ${address} has different messages`);
          }
        } else {
          addressMap.set(address, msg);
        }
      });
    } else {
      throw new Error(`Message Broadcastable ${index} did not have a successful validation`);
    }
  });

  return Array.from(addressMap.entries()).map(([address, message]) => ({
    address,
    message,
  }));
}
