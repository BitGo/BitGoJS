import { decodeOrElse } from '@bitgo/sdk-core';
import { bitgo } from '@bitgo/utxo-lib';
import { bip322, fixedScriptWallet, Transaction, type CoinName, type Triple } from '@bitgo/wasm-utxo';
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

function assertPubkeyTriple(pubkeys: string[]): Triple<string> {
  if (pubkeys.length !== 3) {
    throw new Error(`Expected exactly 3 pubkeys, got ${pubkeys.length}`);
  }
  return pubkeys as Triple<string>;
}

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
  if (coinName !== 'btc' && coinName !== 'tbtc4') {
    throw new Error('Only tbtc4 or btc coinNames are supported.');
  }
  const network = coinName as CoinName;

  if (bitgo.isPsbt(message.txHex)) {
    const psbt = fixedScriptWallet.BitGoPsbt.fromBytes(Buffer.from(message.txHex, 'hex'), network);
    try {
      message.messageInfo.forEach((info, inputIndex) => {
        bip322.verifyBip322PsbtInputWithPubkeys(psbt, inputIndex, {
          message: info.message,
          pubkeys: assertPubkeyTriple(info.pubkeys),
          scriptType: info.scriptType,
        });
      });
      return true;
    } catch (error) {
      return false;
    }
  } else {
    const tx = Transaction.fromBytes(Buffer.from(message.txHex, 'hex'));
    try {
      message.messageInfo.forEach((info, inputIndex) => {
        bip322.verifyBip322TxInputWithPubkeys(tx, inputIndex, {
          message: info.message,
          pubkeys: assertPubkeyTriple(info.pubkeys),
          scriptType: info.scriptType,
        });
      });
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
