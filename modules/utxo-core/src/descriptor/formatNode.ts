/*

This file contains type definitions for building an Abstract Syntax Tree for
Bitcoin Descriptors and Miniscript expressions.

Currently, the types do not encode any validity or soundness checks, so it is
possible to construct invalid descriptors.

*/
type Key = string;

// https://bitcoin.sipa.be/miniscript/
// r is for custom bitgo extension OP_DROP
type Identities = 'a' | 's' | 'c' | 't' | 'd' | 'v' | 'j' | 'n' | 'l' | 'u' | 'r';

// Union of all possible prefixes: { f: T } => { 'a:f': T } | { 's:f': T } | ...
type PrefixWith<T, P extends string> = {
  [K in keyof T & string as `${P}:${K}`]: T[K];
};
type PrefixIdUnion<T> = { [P in Identities]: PrefixWith<T, P> }[Identities];

// Wrap a type with a union of all possible prefixes
type Wrap<T> = T | PrefixIdUnion<T>;

type Miniscript =
  | Wrap<{ pk: Key }>
  | Wrap<{ pkh: Key }>
  | Wrap<{ wpkh: Key }>
  | Wrap<{ multi: [number, ...Key[]] }>
  | Wrap<{ sortedmulti: [number, ...Key[]] }>
  | Wrap<{ multi_a: [number, ...Key[]] }>
  | Wrap<{ sortedmulti_a: [number, ...Key[]] }>
  | Wrap<{ tr: Key | [Key, Miniscript] }>
  | Wrap<{ sh: Miniscript }>
  | Wrap<{ wsh: Miniscript }>
  | Wrap<{ and_v: [Miniscript, Miniscript] }>
  | Wrap<{ and_b: [Miniscript, Miniscript] }>
  | Wrap<{ andor: [Miniscript, Miniscript, Miniscript] }>
  | Wrap<{ or_b: [Miniscript, Miniscript] }>
  | Wrap<{ or_c: [Miniscript, Miniscript] }>
  | Wrap<{ or_d: [Miniscript, Miniscript] }>
  | Wrap<{ or_i: [Miniscript, Miniscript] }>
  | Wrap<{ thresh: [number, ...Miniscript[]] }>
  | Wrap<{ sha256: string }>
  | Wrap<{ ripemd160: string }>
  | Wrap<{ hash256: string }>
  | Wrap<{ hash160: string }>
  | Wrap<{ older: number }>
  | Wrap<{ after: number }>;

// Top level descriptor expressions
// https://github.com/bitcoin/bitcoin/blob/master/doc/descriptors.md#reference
type Descriptor =
  | { sh: Miniscript | { wsh: Miniscript } }
  | { wsh: Miniscript }
  | { pk: Key }
  | { pkh: Key }
  | { wpkh: Key }
  | { combo: Key }
  | { tr: [Key, Miniscript] }
  | { addr: string }
  | { raw: string }
  | { rawtr: string };

type Node = Miniscript | Descriptor | number | string;

function formatN(n: Node | Node[]): string {
  if (typeof n === 'string') {
    return n;
  }
  if (typeof n === 'number') {
    return String(n);
  }
  if (Array.isArray(n)) {
    return n.map(formatN).join(',');
  }
  if (n && typeof n === 'object') {
    const entries = Object.entries(n);
    if (entries.length !== 1) {
      throw new Error(`Invalid node: ${n}`);
    }
    const [name, value] = entries[0];
    return `${name}(${formatN(value)})`;
  }
  throw new Error(`Invalid node: ${n}`);
}

export type MiniscriptNode = Miniscript;
export type DescriptorNode = Descriptor;

/** Format a Miniscript or Descriptor node as a descriptor string (without checksum) */
export function formatNode(n: MiniscriptNode | DescriptorNode): string {
  return formatN(n);
}
