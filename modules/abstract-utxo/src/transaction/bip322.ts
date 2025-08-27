import { decodeOrElse } from '@bitgo/sdk-core';
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
