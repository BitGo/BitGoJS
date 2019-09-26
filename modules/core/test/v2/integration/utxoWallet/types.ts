import { Codes, Dimensions, IDimensions } from '@bitgo/unspents';
import { dumpUnspentsLong } from './display';
import * as utxolib from 'bitgo-utxo-lib';

export const CodeGroups: any[] = [Codes.p2sh, Codes.p2shP2wsh, Codes.p2wsh];

export type BitGoWallet = any;

export interface Unspent {
  id: string;
  address: string;
  value: number;
  blockHeight: number;
  date: string;
  wallet: string;
  fromWallet: string;
  chain: number;
  index: number;
  redeemScript: string;
  isSegwit: boolean;
}

export interface Address {
  address: string;
  chain: number;
}

export interface Recipient {
  address: string;
  amount: number;
}

export declare type ChainCode = number;

enum UnspentType {
  p2sh = 'p2sh',
  p2shP2wsh = 'p2shP2wsh',
  p2wsh = 'p2wsh'
}

export declare class CodeGroup {
  values: readonly ChainCode[];

  constructor(values: Iterable<ChainCode>);

  has(code: ChainCode): boolean;
}

export declare class CodesByPurpose extends CodeGroup {
  internal: ChainCode;
  external: ChainCode;

  constructor(t: UnspentType);
}

export const sumUnspents = (us: Unspent[]) =>
  us.reduce((sum, u) => sum + u.value, 0);


export interface WalletConfig {
  name: string;

  getMinUnspents(c: CodeGroup): number;

  getMaxUnspents(c: CodeGroup): number;
}

export interface WalletLimits {
  minUnspentBalance: number;
  maxUnspentBalance: number;
  resetUnspentBalance: number;
}

export interface Send {
  source: BitGoWallet;
  unspents?: string[];
  recipients: Recipient[];
}

export const getDimensions = (unspents: Unspent[], outputScripts: Buffer[]): IDimensions =>
  Dimensions.fromUnspents(unspents)
    .plus(Dimensions.sum(
      ...outputScripts.map((s) => Dimensions.fromOutputScriptLength(s.length))
    ));

export const getMaxSpendable = (unspents: Unspent[], outputScripts: Buffer[], feeRate: number) => {
  if (unspents.length === 0) {
    throw new Error(`must provide at least one unspent`);
  }
  const cost = getDimensions(unspents, outputScripts).getVSize() * feeRate / 1000;
  const amount = Math.floor(sumUnspents(unspents) - cost);
  if (amount < 1000) {
    throw new Error(
      `unspendable unspents ${dumpUnspentsLong(unspents, undefined, { value: true })} ` +
      `at feeRate=${feeRate}: ${amount}`
    );
  }
  return amount;
};

export class Timechain {
  public constructor(
    public chainHead: number,
    public network: any,
  ) {
  }

  public getMaxSpendable(us: Unspent[], recipients: string[], feeRate: number) {
    return getMaxSpendable(
      us,
      recipients.map((a) => utxolib.address.toOutputScript(a, this.network)),
      feeRate
    );
  }

  public getConfirmations(u: Unspent) {
    return Math.max(0, this.chainHead - u.blockHeight + 1);
  }

  public parseTx(txHex: string) {
    return utxolib.Transaction.fromHex(txHex, this.network);
  }
}

export const makeConfigSingleGroup = (name: string, allowedGroups: CodeGroup[]): WalletConfig => ({
  name,

  getMinUnspents(c: CodeGroup): number {
    return allowedGroups.includes(c) ? 2 : 0;
  },
  getMaxUnspents(c: CodeGroup): number {
    return allowedGroups.includes(c) ? Infinity : 0;
  },
});

export type ManagedWalletPredicate = (w: BitGoWallet, us: Unspent[]) => boolean;

export const GroupPureP2sh = makeConfigSingleGroup('pure-p2sh', [Codes.p2sh]);
export const GroupPureP2shP2wsh = makeConfigSingleGroup('pure-p2shP2wsh', [Codes.p2shP2wsh]);
export const GroupPureP2wsh = makeConfigSingleGroup('pure-p2wsh', [Codes.p2wsh]);
