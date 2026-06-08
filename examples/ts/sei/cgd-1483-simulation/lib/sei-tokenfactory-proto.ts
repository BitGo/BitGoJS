/**
 * Sei tokenfactory proto encoders.
 *
 * Sei's `seiprotocol.seichain.tokenfactory.*` proto types aren't in
 * cosmjs-types, so we encode them by hand using the same length-prefixed
 * wire-format conventions as cosmjs's `Coin` / `MsgSend` etc.
 *
 * Proto definitions (from Sei v6.5.0 source x/tokenfactory/types/tx.proto):
 *
 *   message MsgCreateDenom { string sender = 1; string subdenom = 2; }
 *   message MsgMint        { string sender = 1; Coin amount = 2; }
 *   message MsgBurn        { string sender = 1; Coin amount = 2; }
 *   message MsgChangeAdmin { string sender = 1; string denom = 2; string newAdmin = 3; }
 *
 * The Coin message reuses cosmos.base.v1beta1.Coin, which cosmjs-types ships,
 * so we import that and encode via varint + length-delimited fields by hand.
 */

import { Coin } from 'cosmjs-types/cosmos/base/v1beta1/coin';

export const TYPE_URLS = {
  MsgCreateDenom: '/seiprotocol.seichain.tokenfactory.MsgCreateDenom',
  MsgMint: '/seiprotocol.seichain.tokenfactory.MsgMint',
  MsgBurn: '/seiprotocol.seichain.tokenfactory.MsgBurn',
  MsgChangeAdmin: '/seiprotocol.seichain.tokenfactory.MsgChangeAdmin',
};

/** Encode a varint (uint32). */
function encodeVarint(value: number): number[] {
  const out: number[] = [];
  let v = value;
  while (v >= 0x80) {
    out.push((v & 0x7f) | 0x80);
    v >>>= 7;
  }
  out.push(v & 0x7f);
  return out;
}

/** Wire tag = (field_number << 3) | wire_type. */
function tag(fieldNumber: number, wireType: number): number[] {
  return encodeVarint((fieldNumber << 3) | wireType);
}

/** Encode a length-delimited (wire type 2) string field. */
function writeString(fieldNumber: number, value: string): number[] {
  if (!value) return [];
  const bytes = Buffer.from(value, 'utf-8');
  return [...tag(fieldNumber, 2), ...encodeVarint(bytes.length), ...bytes];
}

/** Encode a length-delimited (wire type 2) bytes field. */
function writeBytes(fieldNumber: number, value: Uint8Array): number[] {
  if (!value || value.length === 0) return [];
  return [...tag(fieldNumber, 2), ...encodeVarint(value.length), ...Array.from(value)];
}

export interface MsgCreateDenomValue {
  sender: string;
  subdenom: string;
}
export interface MsgMintValue {
  sender: string;
  amount: { denom: string; amount: string };
}
export interface MsgBurnValue {
  sender: string;
  amount: { denom: string; amount: string };
}
export interface MsgChangeAdminValue {
  sender: string;
  denom: string;
  newAdmin: string;
}

/** Build a cosmjs Registry-compatible encoder for each Sei tokenfactory msg. */
export function encoderFor(typeUrl: string) {
  return {
    encode: (msg: any) => {
      switch (typeUrl) {
        case TYPE_URLS.MsgCreateDenom: {
          const m = msg as MsgCreateDenomValue;
          const out = [...writeString(1, m.sender), ...writeString(2, m.subdenom)];
          return { finish: () => Uint8Array.from(out) } as any;
        }
        case TYPE_URLS.MsgMint:
        case TYPE_URLS.MsgBurn: {
          const m = msg as MsgMintValue;
          const coinBytes = Coin.encode(Coin.fromPartial(m.amount)).finish();
          const out = [...writeString(1, m.sender), ...writeBytes(2, coinBytes)];
          return { finish: () => Uint8Array.from(out) } as any;
        }
        case TYPE_URLS.MsgChangeAdmin: {
          const m = msg as MsgChangeAdminValue;
          const out = [
            ...writeString(1, m.sender),
            ...writeString(2, m.denom),
            ...writeString(3, m.newAdmin),
          ];
          return { finish: () => Uint8Array.from(out) } as any;
        }
        default:
          throw new Error(`encoderFor: unknown typeUrl ${typeUrl}`);
      }
    },
    decode: () => {
      throw new Error(`decode not implemented for ${typeUrl} (broadcast-only encoder)`);
    },
    create: (m: any) => m,
    fromPartial: (m: any) => m,
  };
}

/** Returns an array of [typeUrl, encoder] pairs suitable for new Registry([...defaults, ...sei]) */
export function tokenfactoryRegistryTypes(): [string, ReturnType<typeof encoderFor>][] {
  return [
    [TYPE_URLS.MsgCreateDenom, encoderFor(TYPE_URLS.MsgCreateDenom)],
    [TYPE_URLS.MsgMint, encoderFor(TYPE_URLS.MsgMint)],
    [TYPE_URLS.MsgBurn, encoderFor(TYPE_URLS.MsgBurn)],
    [TYPE_URLS.MsgChangeAdmin, encoderFor(TYPE_URLS.MsgChangeAdmin)],
  ];
}
